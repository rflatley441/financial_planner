import { supabase, requireUserId } from '../supabase'
import type { NetWorthSnapshot } from '../../types'
import type { SnapshotInsert } from '../../types/database'

export async function getNetWorth(): Promise<NetWorthSnapshot[]> {
  const { data, error } = await supabase
    .from('net_worth_snapshots')
    .select('*')
    .order('date', { ascending: true })
  if (error) throw error
  return data as NetWorthSnapshot[]
}

/**
 * Record a snapshot of the user's net worth at a specific date.
 * Call this after account balances are updated to keep history current.
 * Upserts on (user_id, date) so running it twice the same day is safe.
 */
export async function recordNetWorthSnapshot(
  input: Omit<SnapshotInsert, 'user_id'>
): Promise<NetWorthSnapshot> {
  const userId = await requireUserId()
  const { data, error } = await supabase
    .from('net_worth_snapshots')
    .upsert(
      { ...input, user_id: userId },
      { onConflict: 'user_id,date' }
    )
    .select()
    .single()
  if (error) throw error
  return data as NetWorthSnapshot
}
