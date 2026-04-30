import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** Vite injects env as-is; strip BOM and optional wrapping quotes from .env values. */
function readViteEnv(name: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY'): string | undefined {
  const raw = import.meta.env[name] as string | undefined
  if (raw === undefined || raw === '') return undefined
  let v = raw.trim().replace(/^\uFEFF/, '')
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim()
  }
  return v || undefined
}

const configuredUrl = readViteEnv('VITE_SUPABASE_URL')
const configuredKey = readViteEnv('VITE_SUPABASE_ANON_KEY')

function isValidSupabaseProjectUrl(url: string): boolean {
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false
    if (u.protocol === 'https:' && /^[a-z0-9_-]+\.supabase\.co$/i.test(u.hostname)) {
      if (/your-project-ref|placeholder/i.test(u.hostname)) return false
      return true
    }
    // Local Supabase CLI (`supabase start`) — default API is http://127.0.0.1:54321
    if (u.protocol === 'http:' && (u.hostname === '127.0.0.1' || u.hostname === 'localhost')) {
      return !/placeholder/i.test(url)
    }
    return false
  } catch {
    return false
  }
}

/**
 * Client-side key: Supabase **publishable** (`sb_publishable_…`) or legacy **anon** JWT (`eyJ…`).
 * Never accept `sb_secret_…` here — that key bypasses RLS and must only run on a server.
 */
function isValidSupabaseAnonKey(key: string): boolean {
  const k = key.trim()
  if (!k || k === 'your-anon-key-here' || k === 'your-publishable-or-legacy-anon-key') return false
  if (/placeholder|dev-placeholder/i.test(k)) return false
  if (k.startsWith('sb_secret_')) return false
  if (k.startsWith('sb_publishable_')) return k.length >= 40
  if (k.startsWith('eyJ')) return k.length >= 80
  return false
}

/**
 * True when URL and anon key look like a real Supabase project (not empty, not .env.example templates).
 * If false, a placeholder client is used so the app can mount; auth and DB calls will not work until configured.
 */
export const isSupabaseConfigured =
  Boolean(configuredUrl && configuredKey) &&
  isValidSupabaseProjectUrl(configuredUrl!) &&
  isValidSupabaseAnonKey(configuredKey!)

// createClient throws if url or key is empty ("supabaseUrl is required"), which previously crashed the whole app before React mounted.
const url = isSupabaseConfigured ? configuredUrl! : 'https://placeholder.local.supabase.co'
const key = isSupabaseConfigured ? configuredKey! : 'dev-placeholder-anon-key-not-for-production'

if (!isSupabaseConfigured) {
  const hasAny = Boolean(configuredUrl || configuredKey)
  if (configuredKey?.trim().startsWith('sb_secret_')) {
    console.warn(
      '[Finwise] VITE_SUPABASE_ANON_KEY looks like a **secret** key (sb_secret_…). Use the **publishable** key (sb_publishable_…) or legacy anon JWT (eyJ…) in the browser — never the secret key. Dashboard → Project Settings → API.'
    )
  }
  console.warn(
    hasAny
      ? '[Finwise] Supabase URL or client API key still looks like a template or is invalid. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your project URL and publishable/anon key (Dashboard → Project Settings → API), then restart `npm run dev`.'
      : '[Finwise] Missing Supabase env vars — using a placeholder client so the UI can load.\n' +
        'Copy client/.env.example → client/.env.local, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server.'
  )
}

// We don't pass the Database generic here because hand-written Database types
// must match Supabase's internal generic shape exactly (including Relationships,
// Views, Functions, Enums stubs). Type safety is enforced via explicit `as`
// casts inside each data-layer function instead.
export const supabase: SupabaseClient = createClient(url, key)

/** Returns the current user's ID or throws if not authenticated. */
export async function requireUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return user.id
}
