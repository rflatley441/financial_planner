import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !key) {
  console.error(
    '[Finwise] Missing Supabase env vars.\n' +
    'Copy client/.env.example → client/.env.local and add your project URL + anon key.\n' +
    'Find them at: Supabase Dashboard → Project Settings → API'
  )
}

// We don't pass the Database generic here because hand-written Database types
// must match Supabase's internal generic shape exactly (including Relationships,
// Views, Functions, Enums stubs). Type safety is enforced via explicit `as`
// casts inside each data-layer function instead.
export const supabase = createClient(url ?? '', key ?? '')

/** Returns the current user's ID or throws if not authenticated. */
export async function requireUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return user.id
}
