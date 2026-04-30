import { useCallback, useEffect, useRef, useState } from 'react'
import { usePlaidLink, type PlaidLinkOnSuccessMetadata } from 'react-plaid-link'
import { Link2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { readApiErrorMessage } from '../lib/apiFetch'

async function fetchLinkToken(accessToken: string): Promise<string> {
  const r = await fetch('/api/plaid/create-link-token', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
  if (!r.ok) throw new Error(await readApiErrorMessage(r))
  const j = await r.json().catch(() => ({})) as { link_token?: unknown }
  const token = j.link_token
  if (typeof token !== 'string' || !token) throw new Error('Invalid link token response from server')
  return token
}

async function exchangePublicToken(
  accessToken: string,
  publicToken: string,
  institutionName: string | undefined,
): Promise<void> {
  const r = await fetch('/api/plaid/exchange-public-token', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      public_token: publicToken,
      ...(institutionName ? { institution_name: institutionName } : {}),
    }),
  })
  if (!r.ok) throw new Error(await readApiErrorMessage(r))
}

export default function PlaidLinkButton({ onConnected }: { onConnected: () => void }) {
  const { session } = useAuth()
  const accessToken = session?.access_token

  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [setupHint, setSetupHint] = useState<string | null>(null)
  const openedForTokenRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/plaid/status')
      .then(async (r) => {
        if (r.status === 404) {
          return {
            __notFound: true as const,
          }
        }
        return r.json().catch(() => null)
      })
      .then((body: {
        __notFound?: boolean
        plaid_env_vars?: boolean
        supabase_jwt_verification?: boolean
        supabase_hint?: string | null
      } | null) => {
        if (cancelled || !body) return
        if ('__notFound' in body && body.__notFound) {
          setSetupHint(
            'Plaid API routes were not found (404). Stop all Node servers and run `npm run dev` from the repo root so port 3001 loads the latest server with `/api/plaid`.',
          )
          return
        }
        if (!body.plaid_env_vars || !body.supabase_jwt_verification) {
          const parts: string[] = []
          if (!body.plaid_env_vars) parts.push('PLAID_CLIENT_ID / PLAID_SECRET')
          if (!body.supabase_jwt_verification) {
            parts.push('SUPABASE_SERVICE_ROLE_KEY (and Supabase URL)')
          }
          const hint = typeof body.supabase_hint === 'string' ? body.supabase_hint : ''
          setSetupHint(
            hint || `API server setup incomplete — add ${parts.join(' and ')} to server/.env (see server/.env.example), then restart \`npm run dev\`.`,
          )
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const onSuccess = useCallback(
    async (publicToken: string, meta: PlaidLinkOnSuccessMetadata) => {
      if (!accessToken) return
      openedForTokenRef.current = null
      setBusy(true)
      setError(null)
      try {
        const name = meta.institution?.name?.trim() || undefined
        await exchangePublicToken(accessToken, publicToken, name)
        onConnected()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not complete bank link')
      } finally {
        setBusy(false)
        setLinkToken(null)
      }
    },
    [accessToken, onConnected],
  )

  const onExit = useCallback(() => {
    openedForTokenRef.current = null
    setLinkToken(null)
    setBusy(false)
  }, [])

  const { open, ready, error: scriptLoadError } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit,
  })

  useEffect(() => {
    if (scriptLoadError) {
      setError(
        'Could not load Plaid (cdn.plaid.com). Check your network, firewall, or ad blocker.',
      )
    }
  }, [scriptLoadError])

  useEffect(() => {
    if (!linkToken || !ready) return
    if (openedForTokenRef.current === linkToken) return
    openedForTokenRef.current = linkToken
    open()
    setBusy(false)
  }, [linkToken, ready, open])

  async function startLink() {
    if (!accessToken) {
      setError('You must be signed in to connect a bank.')
      return
    }
    setError(null)
    setBusy(true)
    openedForTokenRef.current = null
    try {
      const token = await fetchLinkToken(accessToken)
      setLinkToken(token)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start Plaid Link')
      setBusy(false)
    }
  }

  return (
    <div className="space-y-1">
      {setupHint && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 max-w-xl">
          {setupHint}
        </p>
      )}
      <button
        type="button"
        onClick={startLink}
        disabled={busy || !accessToken}
        className="btn-secondary inline-flex items-center gap-2"
      >
        <Link2 size={16} />
        {busy && !linkToken ? 'Starting…' : 'Connect bank (Plaid)'}
      </button>
      {error && <p className="text-xs text-red-600 max-w-xl">{error}</p>}
    </div>
  )
}
