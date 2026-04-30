import { supabase, requireUserId } from '../supabase'
import type { Profile } from '../../types/database'

export async function getProfile(): Promise<Profile> {
  const userId = await requireUserId()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data as Profile
}

export async function upsertProfile(
  input: Partial<Omit<Profile, 'id' | 'created_at'>>
): Promise<Profile> {
  const userId = await requireUserId()
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...input })
    .select('*')
    .single()
  if (error) throw error
  return data as Profile
}

