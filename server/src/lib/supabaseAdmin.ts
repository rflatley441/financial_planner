import { createClient } from '@supabase/supabase-js'

/** Prefer SUPABASE_URL; reuse same host as the browser app when only VITE_* is set. */
export function resolveSupabaseUrl(): string | undefined {
  const u =
    process.env.SUPABASE_URL?.trim()
    || process.env.VITE_SUPABASE_URL?.trim()
    || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  return u || undefined
}

export function resolveServiceRoleKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || undefined
}

export function isSupabaseServiceConfigured(): boolean {
  return Boolean(resolveSupabaseUrl() && resolveServiceRoleKey())
}

/** Human-readable hint for 503 responses when env is incomplete. */
export function missingSupabaseServiceEnvHint(): string {
  const url = resolveSupabaseUrl()
  const key = resolveServiceRoleKey()
  if (!url && !key) {
    return 'Add SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY to server/.env — see server/.env.example.'
  }
  if (!url) {
    return 'Add SUPABASE_URL on the API server (copy VITE_SUPABASE_URL from client/.env.local if needed).'
  }
  if (!key) {
    return 'Add SUPABASE_SERVICE_ROLE_KEY to server/.env (Dashboard → Project Settings → API → secret/service_role). Never expose this in the browser.'
  }
  return ''
}

export function getSupabaseAdmin() {
  const url = resolveSupabaseUrl()
  const serviceKey = resolveServiceRoleKey()
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for Plaid')
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
