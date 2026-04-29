import { useEffect, useState } from 'react';
import { getGoals, createGoal, updateGoal, deleteGoal, getAccounts } from '../api/client';
import type { Goal, Account } from '../types';
import { formatCurrency, GOAL_TYPE_LABELS } from '../utils/format';
import GoalCard from '../components/GoalCard';
import Modal from '../components/Modal';
import ProgressBar from '../components/ProgressBar';
import { Plus, Trash2, Target } from 'lucide-react';
import {
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer,
} from 'recharts';

const GOAL_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6', '#F97316'];
const GOAL_TYPES  = Object.entries(GOAL_TYPE_LABELS);

function GoalForm({
  initial,
  accounts,
  onSave,
  onClose,
  onDelete,
}: {
  initial?: Goal;
  accounts: Account[];
  onSave: (d: Partial<Goal>) => Promise<void>;
  onClose: () => void;
  onDelete?: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    name:           initial?.name           ?? '',
    type:           initial?.type           ?? 'savings',
    target_amount:  initial?.target_amount  ?? 0,
    current_amount: initial?.current_amount ?? 0,
    target_date:    initial?.target_date    ?? '',
    account_id:     initial?.account_id     ?? null as number | null,
    color:          initial?.color          ?? '#4F46E5',
    notes:          initial?.notes          ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave(form).finally(() => setSaving(false));
  }

  const pct = form.target_amount > 0 ? (form.current_amount / form.target_amount) * 100 : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Goal Name</label>
        <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Emergency Fund" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Goal Type</label>
          <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
            {GOAL_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Target Date</label>
          <input type="date" className="input" value={form.target_date} onChange={e => set('target_date', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Target Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <input type="number" step="1" min="0" className="input pl-7" value={form.target_amount}
              onChange={e => set('target_amount', parseFloat(e.target.value) || 0)} required />
          </div>
        </div>
        <div>
          <label className="label">Current Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
            <input type="number" step="1" min="0" className="input pl-7" value={form.current_amount}
              onChange={e => set('current_amount', parseFloat(e.target.value) || 0)} />
          </div>
        </div>
      </div>
      <div>
        <label className="label">Linked Account (optional)</label>
        <select className="input" value={form.account_id ?? ''} onChange={e => set('account_id', e.target.value ? Number(e.target.value) : null)}>
          <option value="">— None —</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Color</label>
        <div className="flex gap-2">
          {GOAL_COLORS.map(c => (
            <button
              key={c}
              type="button"
              className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' : 'hover:scale-105'}`}
              style={{ backgroundColor: c }}
              onClick={() => set('color', c)}
            />
          ))}
        </div>
      </div>
      <div>
        <label className="label">Notes</label>
        <input className="input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional" />
      </div>

      {/* Progress preview */}
      {form.target_amount > 0 && (
        <div className="p-3 bg-slate-50 rounded-xl">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Progress Preview</span>
            <span className="font-semibold">{Math.round(pct)}%</span>
          </div>
          <ProgressBar value={pct} height="h-2" />
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Goal'}
        </button>
        {onDelete && (
          <button type="button" onClick={onDelete} className="btn-danger"><Trash2 size={14} /></button>
        )}
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
}

export default function Goals() {
  const [goals,    setGoals]    = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState<'add' | Goal | null>(null);

  const refresh = () => {
    setLoading(true);
    getGoals().then(setGoals).finally(() => setLoading(false));
  };
  useEffect(() => {
    Promise.all([getGoals(), getAccounts()])
      .then(([g, a]) => { setGoals(g); setAccounts(a); })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(data: Partial<Goal>) {
    if (modal && modal !== 'add') {
      await updateGoal((modal as Goal).id, data);
    } else {
      await createGoal(data);
    }
    setModal(null);
    refresh();
  }

  async function handleDelete() {
    if (modal && modal !== 'add') {
      await deleteGoal((modal as Goal).id);
      setModal(null);
      refresh();
    }
  }

  const totalTarget  = goals.reduce((s, g) => s + g.target_amount, 0);
  const totalCurrent = goals.reduce((s, g) => s + g.current_amount, 0);
  const overallPct   = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  const radialData = [{ name: 'Progress', value: Math.min(overallPct, 100), fill: '#4F46E5' }];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Goals</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track progress toward your financial goals.</p>
        </div>
        <button onClick={() => setModal('add')} className="btn-primary">
          <Plus size={16} /> New Goal
        </button>
      </div>

      {/* Overall summary */}
      <div className="card">
        <div className="flex items-center gap-8">
          <div className="w-32 h-32 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%" cy="50%"
                innerRadius="70%" outerRadius="100%"
                startAngle={90} endAngle={-270}
                data={radialData}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background={{ fill: '#EEF2FF' }} fill="#4F46E5" dataKey="value" cornerRadius={8} angleAxisId={0} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-500 mb-1">Overall Goal Progress</p>
            <p className="text-3xl font-bold text-slate-900">{Math.round(overallPct)}%</p>
            <p className="text-sm text-slate-500 mt-1">
              {formatCurrency(totalCurrent)} saved of {formatCurrency(totalTarget)} total target
            </p>
            <div className="flex gap-4 mt-3">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Active Goals</p>
                <p className="text-lg font-bold text-slate-800">{goals.length}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Completed</p>
                <p className="text-lg font-bold text-emerald-600">
                  {goals.filter(g => g.current_amount >= g.target_amount).length}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Remaining</p>
                <p className="text-lg font-bold text-indigo-600">{formatCurrency(totalTarget - totalCurrent)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-slate-200 rounded-2xl" />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="card text-center py-12">
          <Target size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700">No goals yet</p>
          <p className="text-sm text-slate-400 mt-1">Set your first financial goal to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(g => (
            <GoalCard key={g.id} goal={g} onEdit={g => setModal(g)} />
          ))}
        </div>
      )}

      {modal && (
        <Modal
          title={modal === 'add' ? 'Create Goal' : `Edit — ${(modal as Goal).name}`}
          onClose={() => setModal(null)}
          size="lg"
        >
          <GoalForm
            initial={modal !== 'add' ? (modal as Goal) : undefined}
            accounts={accounts}
            onSave={handleSave}
            onClose={() => setModal(null)}
            onDelete={modal !== 'add' ? handleDelete : undefined}
          />
        </Modal>
      )}
    </div>
  );
}
