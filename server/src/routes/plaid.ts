import { Router } from 'express'
import { CountryCode, Products } from 'plaid'
import { requireUser } from '../middleware/requireUser.js'
import { getPlaidClient, isPlaidConfigured } from '../plaid/client.js'
import { mapPlaidAccount } from '../plaid/mapPlaidAccount.js'
import {
  getSupabaseAdmin,
  isSupabaseServiceConfigured,
  missingSupabaseServiceEnvHint,
} from '../lib/supabaseAdmin.js'
import { formatPlaidHttpError } from '../plaid/httpError.js'

const router = Router()

const CLIENT_NAME = (process.env.PLAID_CLIENT_NAME ?? 'Finwise').slice(0, 30)

function plaidNotReady(res: import('express').Response) {
  return res.status(503).json({
    error: 'Plaid is not configured. Set PLAID_CLIENT_ID, PLAID_SECRET, and PLAID_ENV (sandbox or production).',
  })
}

/** Anonymous sanity check for the UI / debugging (no secrets). */
router.get('/status', (_req, res) => {
  res.json({
    plaid_env_vars: isPlaidConfigured(),
    supabase_jwt_verification: isSupabaseServiceConfigured(),
    supabase_hint: isSupabaseServiceConfigured() ? null : missingSupabaseServiceEnvHint(),
  })
})

router.post('/create-link-token', requireUser, async (req, res) => {
  if (!isPlaidConfigured()) return plaidNotReady(res)
  try {
    const plaid = getPlaidClient()
    const tokenRes = await plaid.linkTokenCreate({
      user: { client_user_id: req.userId },
      client_name: CLIENT_NAME,
      language: 'en',
      country_codes: [CountryCode.Us],
      products: [Products.Transactions],
    })
    const link_token = tokenRes.data.link_token
    return res.json({ link_token })
  } catch (e) {
    console.error('[plaid] linkTokenCreate', e)
    return res.status(502).json({
      error: formatPlaidHttpError(e),
    })
  }
})

router.post('/exchange-public-token', requireUser, async (req, res) => {
  if (!isPlaidConfigured()) return plaidNotReady(res)
  if (!isSupabaseServiceConfigured()) {
    return res.status(503).json({
      error: missingSupabaseServiceEnvHint() || 'SUPABASE_SERVICE_ROLE_KEY is not configured on the server',
    })
  }

  const public_token = typeof req.body?.public_token === 'string' ? req.body.public_token.trim() : ''
  if (!public_token) {
    return res.status(400).json({ error: 'public_token is required' })
  }

  const institution_name =
    typeof req.body?.institution_name === 'string' ? req.body.institution_name.trim() : ''

  try {
    const plaid = getPlaidClient()
    const ex = await plaid.itemPublicTokenExchange({ public_token })
    const access_token = ex.data.access_token
    const item_id = ex.data.item_id

    const supabase = getSupabaseAdmin()

    const { error: itemErr } = await supabase.from('plaid_items').upsert(
      {
        user_id: req.userId,
        item_id,
        access_token,
        institution_name,
      },
      { onConflict: 'item_id' },
    )
    if (itemErr) {
      console.error('[plaid] plaid_items upsert', itemErr)
      return res.status(500).json({ error: 'Could not store Plaid item' })
    }

    const acctRes = await plaid.accountsGet({ access_token })
    const accounts = acctRes.data.accounts
    const item = acctRes.data.item
    const institution =
      institution_name
      || (item.institution_name ?? '')
      || (item.institution_id ?? '')

    const createdOrUpdated: string[] = []

    for (const a of accounts) {
      const row = mapPlaidAccount(a, item_id, institution)

      const { data: existing } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', req.userId)
        .eq('plaid_account_id', a.account_id)
        .maybeSingle()

      if (existing?.id) {
        const { error: upErr } = await supabase
          .from('accounts')
          .update({
            name: row.name,
            institution: row.institution,
            type: row.type,
            balance: row.balance,
            is_liability: row.is_liability,
            currency: row.currency,
            color: row.color,
            plaid_item_id: row.plaid_item_id,
            last_synced: row.last_synced,
          })
          .eq('id', existing.id)
        if (upErr) {
          console.error('[plaid] account update', upErr)
          return res.status(500).json({ error: 'Could not update account from Plaid' })
        }
        createdOrUpdated.push(existing.id)
      } else {
        const { data: inserted, error: insErr } = await supabase
          .from('accounts')
          .insert({
            user_id: req.userId,
            name: row.name,
            institution: row.institution,
            type: row.type,
            balance: row.balance,
            is_liability: row.is_liability,
            currency: row.currency,
            color: row.color,
            plaid_item_id: row.plaid_item_id,
            plaid_account_id: row.plaid_account_id,
            last_synced: row.last_synced,
          })
          .select('id')
          .single()
        if (insErr) {
          console.error('[plaid] account insert', insErr)
          return res.status(500).json({ error: 'Could not create account from Plaid' })
        }
        if (inserted?.id) createdOrUpdated.push(inserted.id)
      }
    }

    return res.status(201).json({
      item_id,
      accounts_synced: accounts.length,
      account_ids: createdOrUpdated,
    })
  } catch (e) {
    console.error('[plaid] exchange', e)
    return res.status(502).json({
      error: formatPlaidHttpError(e),
    })
  }
})

export default router
