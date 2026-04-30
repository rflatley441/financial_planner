import { useEffect, useState } from 'react';
import { getDashboard, getNetWorth } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { DashboardData, NetWorthSnapshot } from '../types';
import { formatCurrency, formatShortDate } from '../utils/format';
import StatCard from '../components/StatCard';
import ProgressBar from '../components/ProgressBar';
import CategoryBadge from '../components/CategoryBadge';
import {
  TrendingUp, DollarSign, CreditCard, Target,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

function LoadingSkeleton() {
  return (
    <div className="p-8 space-y-6 animate-pulse">
      <div className="h-8 bg-slate-200 rounded-xl w-48" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-slate-200 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 h-72 bg-slate-200 rounded-2xl" />
        <div className="h-72 bg-slate-200 rounded-2xl" />
      </div>
    </div>
  );
}

const RADIAN = Math.PI / 180;
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.05) return null;
  const r  = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x  = cx + r * Math.cos(-midAngle * RADIAN);
  const y  = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-semibold" fontSize={11}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function loadErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return String(err);
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data,     setData]     = useState<DashboardData | null>(null);
  const [history,  setHistory]  = useState<NetWorthSnapshot[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const metaName = user?.user_metadata?.name as string | undefined;
  const firstName =
    metaName?.trim().split(/\s+/)[0]
    ?? user?.email?.split('@')[0]
    ?? 'there';

  useEffect(() => {
    Promise.all([getDashboard(), getNetWorth()])
      .then(([dash, nw]) => {
        setData(dash);
        setHistory(nw);
        setLoadError(null);
      })
      .catch((err) => {
        console.error('[Dashboard]', err);
        setLoadError(loadErrorMessage(err));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (!data) {
    return (
      <div className="p-8 max-w-xl space-y-3">
        <p className="text-red-600 font-medium">Couldn’t load dashboard.</p>
        <p className="text-slate-600 text-sm leading-relaxed">
          This app talks to <strong className="font-medium text-slate-800">Supabase</strong> from the browser — there is no separate API server to start.
          Confirm <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and{' '}
          <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> in{' '}
          <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">client/.env.local</code>, run migrations on your project, then restart{' '}
          <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">npm run dev</code>.
          Check the browser Network tab for failed requests to{' '}
          <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">*.supabase.co</code>.
        </p>
        {loadError && (
          <pre className="text-xs text-slate-700 bg-slate-100 p-3 rounded-xl overflow-x-auto whitespace-pre-wrap">{loadError}</pre>
        )}
      </div>
    );
  }

  const { netWorth, monthlySpending, budgets, recentTransactions, goals, accounts } = data;

  const chartData = history.map(s => ({
    date: formatShortDate(s.date),
    'Net Worth': Math.round(s.net_worth),
    Assets:      Math.round(s.assets),
    Liabilities: Math.round(s.liabilities),
  }));

  const topBudgets = [...budgets]
    .filter(b => b.amount > 0)
    .sort((a, b) => ((b.spent ?? 0) / b.amount) - ((a.spent ?? 0) / a.amount))
    .slice(0, 5);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Good morning, {firstName} 👋</h1>
        <p className="text-slate-500 text-sm mt-0.5">Here's your financial snapshot for today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Net Worth"
          value={formatCurrency(netWorth.total)}
          icon={TrendingUp}
          iconBg="bg-indigo-50"
          trend={netWorth.change30d}
          trendLabel="vs 30 days ago"
        />
        <StatCard
          title="Total Assets"
          value={formatCurrency(netWorth.assets)}
          icon={DollarSign}
          iconBg="bg-emerald-50"
          valueColor="text-emerald-700"
        />
        <StatCard
          title="Total Liabilities"
          value={formatCurrency(netWorth.liabilities)}
          icon={CreditCard}
          iconBg="bg-red-50"
          valueColor="text-red-600"
        />
        <StatCard
          title="Monthly Spending"
          value={formatCurrency(monthlySpending.total)}
          icon={Target}
          iconBg="bg-amber-50"
          subtitle="This month so far"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Net worth chart */}
        <div className="card lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Net Worth Over Time</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                width={48}
              />
              <Tooltip
                formatter={(v: number) => [formatCurrency(v), '']}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: 12 }}
              />
              <Line type="monotone" dataKey="Net Worth" stroke="#4F46E5" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="Assets"    stroke="#10B981" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="Liabilities" stroke="#EF4444" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Spending pie */}
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">Spending by Category</h2>
          {monthlySpending.byCategory.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-12">No spending data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={monthlySpending.byCategory}
                  dataKey="total"
                  nameKey="category_name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  labelLine={false}
                  label={PieLabel}
                >
                  {monthlySpending.byCategory.map((entry, i) => (
                    <Cell key={i} fill={entry.category_color ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(v) => <span style={{ fontSize: 11, color: '#475569' }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent transactions */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700">Recent Transactions</h2>
            <a href="/transactions" className="text-xs text-indigo-600 font-medium hover:text-indigo-700">View all →</a>
          </div>
          <div className="space-y-1">
            {recentTransactions.map(t => {
              const isIncome = t.amount > 0;
              return (
                <div key={t.id} className="flex items-center gap-3 py-2 px-1 rounded-lg hover:bg-slate-50 transition-colors">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                    style={{ backgroundColor: `${t.category_color ?? '#94a3b8'}20` }}
                  >
                    {t.category_icon ?? '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{t.merchant}</p>
                    <p className="text-xs text-slate-400">{t.account_name} · {formatShortDate(t.date)}</p>
                  </div>
                  <div className={`text-sm font-semibold tabular-nums flex items-center gap-0.5 flex-shrink-0 ${isIncome ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {isIncome ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                    {isIncome ? '+' : ''}{formatCurrency(t.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Budget progress + Goals summary */}
        <div className="space-y-4">
          {/* Budget */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-700">Budget This Month</h2>
              <a href="/budgets" className="text-xs text-indigo-600 font-medium hover:text-indigo-700">View all →</a>
            </div>
            <div className="space-y-3">
              {topBudgets.map(b => {
                const spent = b.spent ?? 0;
                const pct   = b.amount > 0 ? (spent / b.amount) * 100 : 0;
                const isOver = pct > 100;
                return (
                  <div key={b.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{b.category_icon}</span>
                        <span className="text-xs font-medium text-slate-600">{b.category_name}</span>
                      </div>
                      <span className={`text-xs font-semibold tabular-nums ${isOver ? 'text-red-500' : 'text-slate-500'}`}>
                        {formatCurrency(spent)}<span className="font-normal text-slate-400"> / {formatCurrency(b.amount)}</span>
                      </span>
                    </div>
                    <ProgressBar value={pct} height="h-1.5" animate />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Goals */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-700">Goals</h2>
              <a href="/goals" className="text-xs text-indigo-600 font-medium hover:text-indigo-700">View all →</a>
            </div>
            <div className="space-y-3">
              {goals.slice(0, 3).map(g => {
                const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
                return (
                  <div key={g.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                        <span className="text-xs font-medium text-slate-600 truncate max-w-[110px]">{g.name}</span>
                      </div>
                      <span className="text-xs text-slate-500 font-semibold">{Math.round(pct)}%</span>
                    </div>
                    <ProgressBar value={pct} height="h-1.5" animate />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Account balances */}
      <div className="card">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Account Balances</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {accounts.map(a => {
            const display = a.is_liability ? -a.balance : a.balance;
            return (
              <div key={a.id} className="flex flex-col gap-1 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${a.color}25` }}>
                  <span className="text-sm">
                    {a.type === 'checking' ? '🏦' : a.type === 'savings' ? '💰' : a.type === 'credit_card' ? '💳' : a.type === 'brokerage' ? '📈' : a.type === 'retirement' ? '🏛️' : '📋'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">{a.name}</p>
                <p className={`text-sm font-bold tabular-nums ${display < 0 ? 'text-red-500' : 'text-slate-800'}`}>
                  {formatCurrency(display, { compact: true })}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
