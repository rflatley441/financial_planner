import { useEffect, useState } from 'react';
import { getBudgets, upsertBudget, getCategories } from '../api/client';
import type { Budget, Category } from '../types';
import { formatCurrency, formatMonthYear } from '../utils/format';
import ProgressBar from '../components/ProgressBar';
import Modal from '../components/Modal';
import { Plus, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';

function BudgetForm({
  categories,
  existingIds,
  month,
  year,
  initial,
  onSave,
  onClose,
}: {
  categories: Category[];
  existingIds: number[];
  month: number;
  year: number;
  initial?: Budget;
  onSave: () => void;
  onClose: () => void;
}) {
  const available = categories.filter(c => !c.is_income && !existingIds.includes(c.id));
  const [catId,  setCatId]  = useState(initial?.category_id ?? available[0]?.id ?? 0);
  const [amount, setAmount] = useState(initial?.amount ?? 0);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await upsertBudget({ category_id: catId, month, year, amount }).finally(() => setSaving(false));
    onSave();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!initial && (
        <div>
          <label className="label">Category</label>
          <select className="input" value={catId} onChange={e => setCatId(Number(e.target.value))}>
            {available.length === 0
              ? <option disabled>All categories have budgets</option>
              : available.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)
            }
          </select>
        </div>
      )}
      <div>
        <label className="label">Monthly Budget Amount</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
          <input
            type="number" step="1" min="0" className="input pl-7"
            value={amount}
            onChange={e => setAmount(parseFloat(e.target.value) || 0)}
            required
          />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={saving || (available.length === 0 && !initial)} className="btn-primary flex-1 justify-center">
          {saving ? 'Saving…' : initial ? 'Update Budget' : 'Add Budget'}
        </button>
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
}

export default function Budgets() {
  const today  = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year,  setYear]  = useState(today.getFullYear());

  const [budgets,    setBudgets]    = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState<'add' | Budget | null>(null);

  const refresh = () => {
    setLoading(true);
    getBudgets(month, year).then(setBudgets).finally(() => setLoading(false));
  };

  useEffect(() => { getCategories().then(setCategories); }, []);
  useEffect(() => { refresh(); }, [month, year]);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent    = budgets.reduce((s, b) => s + (b.spent ?? 0), 0);
  const overBudget    = budgets.filter(b => (b.spent ?? 0) > b.amount);
  const nearBudget    = budgets.filter(b => {
    const pct = b.amount > 0 ? ((b.spent ?? 0) / b.amount) * 100 : 0;
    return pct >= 80 && pct <= 100;
  });

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Budgets</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track spending against your monthly targets.</p>
        </div>
        <button onClick={() => setModal('add')} className="btn-primary">
          <Plus size={16} /> Add Budget
        </button>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={prevMonth} className="btn-secondary px-3"><ChevronLeft size={16} /></button>
        <h2 className="text-lg font-semibold text-slate-800 w-44 text-center">{formatMonthYear(month, year)}</h2>
        <button onClick={nextMonth} className="btn-secondary px-3"><ChevronRight size={16} /></button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Budgeted</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalBudgeted)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Spent</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Remaining</p>
          <p className={`text-2xl font-bold mt-1 ${totalBudgeted - totalSpent < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
            {formatCurrency(totalBudgeted - totalSpent)}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {overBudget.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
          <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">
            <span className="font-semibold">Over budget:</span>{' '}
            {overBudget.map(b => b.category_name).join(', ')}
          </p>
        </div>
      )}
      {nearBudget.length > 0 && overBudget.length === 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
          <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            <span className="font-semibold">Almost at limit:</span>{' '}
            {nearBudget.map(b => b.category_name).join(', ')}
          </p>
        </div>
      )}

      {/* Budget cards */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-slate-200 rounded-2xl" />)}
        </div>
      ) : budgets.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">💰</p>
          <p className="font-semibold text-slate-700">No budgets for this month</p>
          <p className="text-sm text-slate-400 mt-1">Add a budget to start tracking your spending.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map(b => {
            const spent     = b.spent ?? 0;
            const pct       = b.amount > 0 ? (spent / b.amount) * 100 : 0;
            const remaining = b.amount - spent;
            const isOver    = spent > b.amount;
            const isNear    = pct >= 80 && !isOver;

            return (
              <div
                key={b.id}
                className={`card hover:shadow-md transition-shadow cursor-pointer ${isOver ? 'border-red-200' : isNear ? 'border-amber-200' : ''}`}
                onClick={() => setModal(b)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${b.category_color ?? '#94a3b8'}20` }}
                    >
                      {b.category_icon ?? '📦'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{b.category_name}</p>
                      <p className="text-xs text-slate-400">{formatMonthYear(month, year)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {isOver ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                        <AlertTriangle size={10} /> Over budget
                      </span>
                    ) : pct >= 100 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={10} /> On track
                      </span>
                    ) : isNear ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <AlertTriangle size={10} /> Almost there
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>
                      <span className={`font-semibold text-sm ${isOver ? 'text-red-600' : 'text-slate-800'}`}>
                        {formatCurrency(spent)}
                      </span>
                      <span className="ml-1">of {formatCurrency(b.amount)}</span>
                    </span>
                    <span className={`font-medium ${isOver ? 'text-red-500' : 'text-slate-500'}`}>
                      {isOver ? `${formatCurrency(Math.abs(remaining))} over` : `${formatCurrency(remaining)} left`}
                    </span>
                  </div>
                  <ProgressBar value={pct} height="h-2.5" animate />
                  <p className="text-xs text-slate-400">{Math.round(pct)}% used</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal
          title={modal === 'add' ? 'Add Budget' : `Edit Budget — ${(modal as Budget).category_name}`}
          onClose={() => setModal(null)}
          size="sm"
        >
          <BudgetForm
            categories={categories}
            existingIds={modal === 'add' ? budgets.map(b => b.category_id) : []}
            month={month}
            year={year}
            initial={modal !== 'add' ? (modal as Budget) : undefined}
            onSave={() => { setModal(null); refresh(); }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}
