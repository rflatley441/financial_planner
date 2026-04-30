import { useCallback, useEffect, useRef, useState } from 'react'
import { Link2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { readApiErrorMessage } from '../lib/apiFetch'

declare global {
  interface Window {
    Plaid?: {
      create: (config: {
        token: string
        onSuccess: (public_token: string, metadata: PlaidLinkOnSuccessMetadata) => void
        onExit?: () => void
      }) => { open: () => void; destroy: () => void }
    }
  }
}

type PlaidLinkOnSuccessMetadata = {
  institution?: {
    name?: string | null
  } | null
}

const PLAID_SCRIPT_SRC = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js'
const PLAID_SCRIPT_ID = 'plaid-link-initialize'

let plaidScriptPromise: Promise<void> | null = null
function loadPlaidScriptOnce(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Plaid can only load in the browser'))
  if (window.Plaid?.create) return Promise.resolve()

  if (plaidScriptPromise) return plaidScriptPromise

  plaidScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(PLAID_SCRIPT_ID) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load Plaid script')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = PLAID_SCRIPT_ID
    script.src = PLAID_SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Plaid script'))
    document.body.appendChild(script)
  })

  return plaidScriptPromise
}

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
  const handlerRef = useRef<{ open: () => void; destroy: () => void } | null>(null)

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
      handlerRef.current?.destroy()
      handlerRef.current = null
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
    handlerRef.current?.destroy()
    handlerRef.current = null
    setLinkToken(null)
    setBusy(false)
  }, [])

  useEffect(() => {
    if (!linkToken) return
    if (openedForTokenRef.current === linkToken) return
    openedForTokenRef.current = linkToken

    let cancelled = false
    setBusy(true)
    setError(null)

    loadPlaidScriptOnce()
      .then(() => {
        if (cancelled) return
        if (!window.Plaid?.create) throw new Error('Plaid failed to initialize')

        handlerRef.current?.destroy()
        handlerRef.current = window.Plaid.create({
          token: linkToken,
          onSuccess,
          onExit,
        })
        handlerRef.current.open()
        setBusy(false)
      })
      .catch(() => {
        if (cancelled) return
        setBusy(false)
        setLinkToken(null)
        setError('Could not load Plaid (cdn.plaid.com). Check your network, firewall, or ad blocker.')
      })

    return () => {
      cancelled = true
    }
  }, [linkToken, onSuccess, onExit])

  useEffect(() => {
    return () => {
      handlerRef.current?.destroy()
      handlerRef.current = null
    }
  }, [])

  async function startLink() {
    if (!accessToken) {
      setError('You must be signed in to connect a bank.')
      return
    }
    setError(null)
    setBusy(true)
    openedForTokenRef.current = null
    try {
      await loadPlaidScriptOnce()
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
