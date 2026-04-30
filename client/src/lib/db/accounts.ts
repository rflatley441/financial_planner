import { supabase, requireUserId } from '../supabase'
import type { Account } from '../../types'
import type { AccountInsert, AccountUpdate } from '../../types/database'

export async function getAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .order('is_liability', { ascending: true })
    .order('balance',      { ascending: false })
  if (error) throw error
  return data as Account[]
}

export async function createAccount(
  input: Omit<AccountInsert, 'user_id'>
): Promise<Account> {
  const userId = await requireUserId()
  const { data, error } = await supabase
    .from('accounts')
    .insert({ ...input, user_id: userId })
    .select()
    .single()
  if (error) throw error
  return data as Account
}

export async function updateAccount(
  id: string,
  input: AccountUpdate
): Promise<Account> {
  const { data, error } = await supabase
    .from('accounts')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Account
}

export async function deleteAccount(id: string): Promise<void> {
  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id)
  if (error) throw error
}
