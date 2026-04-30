import { supabase } from '../supabase'
import type { DashboardData, Account } from '../../types'
import { getBudgets } from './budgets'
import { getGoals }   from './goals'

/**
 * Aggregate all data needed for the dashboard in parallel.
 * Replaces the single /api/dashboard Express endpoint.
 */
export async function getDashboard(): Promise<DashboardData> {
  const now   = new Date()
  const month = now.getMonth() + 1
  const year  = now.getFullYear()
  const mm    = String(month).padStart(2, '0')
  const start = `${year}-${mm}-01`
  const end   = new Date(year, month, 0).toISOString().slice(0, 10)

  const [
    accountsRes,
    spendingRes,
    recentRes,
    snapshotRes,
    budgets,
    goals,
  ] = await Promise.all([
    // All accounts
    supabase.from('accounts').select('*').order('is_liability', { ascending: true }),

    // This-month spending grouped by category (expenses only, no transfers)
    supabase
      .from('transactions')
      .select('category_id, amount, categories ( name, icon, color )')
      .gte('date', start)
      .lte('date', end)
      .lt('amount', 0),

    // 10 most recent transactions with joins
    supabase
      .from('transactions')
      .select('*, categories ( id, name, icon, color ), accounts ( id, name, type, institution )')
      .order('date',       { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10),

    // Snapshot from ~30 days ago for net-worth change
    supabase
      .from('net_worth_snapshots')
      .select('net_worth')
      .lte('date', new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10))
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle(),

    getBudgets(month, year),
    getGoals(),
  ])

  if (accountsRes.error)  throw accountsRes.error
  if (spendingRes.error)  throw spendingRes.error
  if (recentRes.error)    throw recentRes.error

  const accounts: Account[] = (accountsRes.data ?? []) as Account[]
  const assets      = accounts.filter(a => !a.is_liability).reduce((s, a) => s + a.balance, 0)
  const liabilities = accounts.filter(a =>  a.is_liability).reduce((s, a) => s + a.balance, 0)
  const netWorthTotal = assets - liabilities
  const prevNW        = (snapshotRes.data as { net_worth: number } | null)?.net_worth ?? netWorthTotal

  // Aggregate spending by category
  const catMap = new Map<string, { name: string; icon: string; color: string; total: number }>()
  for (const t of spendingRes.data ?? []) {
    const cat = (t as any).categories
    if (!cat) continue
    const existing = catMap.get(cat.name)
    if (existing) {
      existing.total += Math.abs(t.amount)
    } else {
      catMap.set(cat.name, { name: cat.name, icon: cat.icon, color: cat.color, total: Math.abs(t.amount) })
    }
  }
  const byCategory = Array.from(catMap.values())
    .filter(c => c.name !== 'Transfer')
    .sort((a, b) => b.total - a.total)

  // Flatten recent transactions
  const recentTransactions = (recentRes.data ?? []).map((row: any) => {
    const { categories: cat, accounts: acc, ...rest } = row
    return {
      ...rest,
      category_name:       cat?.name        ?? undefined,
      category_icon:       cat?.icon        ?? undefined,
      category_color:      cat?.color       ?? undefined,
      account_name:        acc?.name        ?? undefined,
      account_type:        acc?.type        ?? undefined,
      account_institution: acc?.institution ?? undefined,
    }
  })

  return {
    netWorth: {
      total:       netWorthTotal,
      assets,
      liabilities,
      change30d:   netWorthTotal - prevNW,
    },
    monthlySpending: {
      total:      byCategory.reduce((s, c) => s + c.total, 0),
      byCategory: byCategory.map(c => ({
        category_name:  c.name,
        category_icon:  c.icon,
        category_color: c.color,
        total:          c.total,
      })),
    },
    budgets,
    recentTransactions,
    goals,
    accounts,
  }
}
