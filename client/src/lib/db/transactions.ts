import { supabase, requireUserId } from '../supabase'
import type { Transaction } from '../../types'
import type { TransactionInsert, TransactionUpdate } from '../../types/database'

export interface TransactionFilters {
  search?:      string
  category_id?: string
  account_id?:  string
  month?:       number
  year?:        number
}

// Supabase join shape returned by the select below
type TxnJoined = {
  categories: { id: string; name: string; icon: string; color: string } | null
  accounts:   { id: string; name: string; type: string; institution: string } | null
} & Record<string, unknown>

function flatten(row: TxnJoined): Transaction {
  const { categories: cat, accounts: acc, ...rest } = row
  return {
    ...rest,
    category_name:       cat?.name       ?? undefined,
    category_icon:       cat?.icon       ?? undefined,
    category_color:      cat?.color      ?? undefined,
    account_name:        acc?.name       ?? undefined,
    account_type:        acc?.type       ?? undefined,
    account_institution: acc?.institution ?? undefined,
  } as Transaction
}

export async function getTransactions(
  filters?: TransactionFilters
): Promise<Transaction[]> {
  let query = supabase
    .from('transactions')
    .select(`
      *,
      categories ( id, name, icon, color ),
      accounts   ( id, name, type, institution )
    `)
    .order('date',       { ascending: false })
    .order('created_at', { ascending: false })

  if (filters?.search) {
    query = query.ilike('merchant', `%${filters.search}%`)
  }
  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id)
  }
  if (filters?.account_id) {
    query = query.eq('account_id', filters.account_id)
  }
  if (filters?.month && filters?.year) {
    const mm    = String(filters.month).padStart(2, '0')
    const start = `${filters.year}-${mm}-01`
    const end   = new Date(filters.year, filters.month, 0).toISOString().slice(0, 10)
    query = query.gte('date', start).lte('date', end)
  } else if (filters?.year) {
    query = query
      .gte('date', `${filters.year}-01-01`)
      .lte('date', `${filters.year}-12-31`)
  }

  const { data, error } = await query
  if (error) throw error
  return (data as TxnJoined[]).map(flatten)
}

export async function createTransaction(
  input: Omit<TransactionInsert, 'user_id'>
): Promise<Transaction> {
  const userId = await requireUserId()
  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...input, user_id: userId })
    .select(`
      *,
      categories ( id, name, icon, color ),
      accounts   ( id, name, type, institution )
    `)
    .single()
  if (error) throw error
  return flatten(data as TxnJoined)
}

export async function updateTransaction(
  id: string,
  input: TransactionUpdate
): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .update(input)
    .eq('id', id)
    .select(`
      *,
      categories ( id, name, icon, color ),
      accounts   ( id, name, type, institution )
    `)
    .single()
  if (error) throw error
  return flatten(data as TxnJoined)
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
  if (error) throw error
}
