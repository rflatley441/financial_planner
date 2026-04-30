import { supabase, requireUserId } from '../supabase'
import type { Budget } from '../../types'

/**
 * Fetch budgets for a given month/year with actual spending joined in.
 * Spending is computed client-side by fetching the matching transactions —
 * straightforward and avoids needing a Postgres function.
 */
export async function getBudgets(month: number, year: number): Promise<Budget[]> {
  const mm    = String(month).padStart(2, '0')
  const start = `${year}-${mm}-01`
  const end   = new Date(year, month, 0).toISOString().slice(0, 10)

  // Budgets with category info
  const [budgetsResult, txnsResult] = await Promise.all([
    supabase
      .from('budgets')
      .select(`*, categories ( id, name, icon, color )`)
      .eq('month', month)
      .eq('year',  year)
      .order('name', { ascending: true, foreignTable: 'categories' }),

    // All expense transactions in the period (amount < 0, excluding transfers)
    supabase
      .from('transactions')
      .select('category_id, amount')
      .gte('date', start)
      .lte('date', end)
      .lt('amount', 0),
  ])

  if (budgetsResult.error) throw budgetsResult.error
  if (txnsResult.error)    throw txnsResult.error

  // Sum spending per category_id
  const spendingMap = new Map<string, number>()
  for (const t of txnsResult.data ?? []) {
    if (!t.category_id) continue
    spendingMap.set(t.category_id, (spendingMap.get(t.category_id) ?? 0) + Math.abs(t.amount))
  }

  return (budgetsResult.data ?? []).map(row => {
    const { categories: cat, ...rest } = row as typeof row & {
      categories: { id: string; name: string; icon: string; color: string } | null
    }
    return {
      ...rest,
      category_name:  cat?.name  ?? '',
      category_icon:  cat?.icon  ?? '📦',
      category_color: cat?.color ?? '#94A3B8',
      spent:          spendingMap.get(rest.category_id) ?? 0,
    } as Budget
  })
}

export async function upsertBudget(input: {
  category_id: string
  month:       number
  year:        number
  amount:      number
}): Promise<Budget> {
  const userId = await requireUserId()

  // Supabase upsert on unique constraint (user_id, category_id, month, year)
  const { data, error } = await supabase
    .from('budgets')
    .upsert(
      { ...input, user_id: userId },
      { onConflict: 'user_id,category_id,month,year' }
    )
    .select()
    .single()
  if (error) throw error
  return data as Budget
}

export async function deleteBudget(id: string): Promise<void> {
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id)
  if (error) throw error
}
