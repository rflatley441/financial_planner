import { useEffect, useState } from 'react';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../api/client';
import type { Account } from '../types';
import { formatCurrency, ACCOUNT_TYPE_LABELS } from '../utils/format';
import AccountCard from '../components/AccountCard';
import Modal from '../components/Modal';
import { Plus, Link2, Trash2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts';

const ACCOUNT_COLORS: Record<string, string> = {
  checking:    '#1E40AF',
  savings:     '#1D4ED8',
  credit_card: '#DC2626',
  brokerage:   '#059669',
  retirement:  '#7C3AED',
  loan:        '#D97706',
  other:       '#475569',
};

function AccountForm({
  initial,
  onSave,
  onClose,
  onDelete,
}: {
  initial?: Account;
  onSave: (data: Partial<Account>) => Promise<void>;
  onClose: () => void;
  onDelete?: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    name:         initial?.name ?? '',
    institution:  initial?.institution ?? '',
    type:         initial?.type ?? 'checking',
    balance:      initial?.balance ?? 0,
    is_liability: initial?.is_liability ?? false,
    color:        initial?.color ?? '#4F46E5',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave(form).finally(() => setSaving(false));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Account Name</label>
        <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required />
      </div>
      <div>
        <label className="label">Institution</label>
        <input className="input" value={form.institution} onChange={e => set('institution', e.target.value)} placeholder="e.g. Chase Bank" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Account Type</label>
          <select
            className="input"
            value={form.type}
            onChange={e => {
              const t = e.target.value;
              set('type', t);
              set('color', ACCOUNT_COLORS[t] ?? '#4F46E5');
              set('is_liability', t === 'credit_card' || t === 'loan');
            }}
          >
            {Object.entries(ACCOUNT_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Balance</label>
          <input
            type="number" step="0.01" className="input"
            value={form.balance}
            onChange={e => set('balance', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="liability"
          checked={form.is_liability}
          onChange={e => set('is_liability', e.target.checked)}
          className="rounded"
        />
        <label htmlFor="liability" className="text-sm text-slate-600">This is a liability (debt)</label>
      </div>

      {/* Plaid integration placeholder */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
        <Link2 size={14} className="text-indigo-500 flex-shrink-0" />
        <p className="text-xs text-indigo-700">
          <span className="font-semibold">Connect via Plaid</span> — automatic syncing coming soon.
          {/* TODO: Initialize Plaid Link here with createLinkToken() → exchange public_token */}
        </p>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Account'}
        </button>
        {onDelete && (
          <button type="button" onClick={onDelete} className="btn-danger">
            <Trash2 size={14} />
          </button>
        )}
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
}

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState<'add' | Account | null>(null);

  const refresh = () => getAccounts().then(setAccounts).finally(() => setLoading(false));
  useEffect(() => { refresh(); }, []);

  const assets      = accounts.filter(a => !a.is_liability).reduce((s, a) => s + a.balance, 0);
  const liabilities = accounts.filter(a =>  a.is_liability).reduce((s, a) => s + a.balance, 0);

  const chartData = accounts.map(a => ({
    name:  a.name,
    value: a.balance,
    color: a.color,
    is_liability: a.is_liability,
  }));

  async function handleSave(data: Partial<Account>) {
    if (modal && modal !== 'add') {
      await updateAccount((modal as Account).id, data);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await createAccount(data as any);
    }
    setModal(null);
    refresh();
  }

  async function handleDelete() {
    if (modal && modal !== 'add') {
      await deleteAccount((modal as Account).id);
      setModal(null);
      refresh();
    }
  }

  const assets_accounts      = accounts.filter(a => !a.is_liability);
  const liability_accounts   = accounts.filter(a =>  a.is_liability);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Accounts</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your linked financial accounts.</p>
        </div>
        <button onClick={() => setModal('add')} className="btn-primary">
          <Plus size={16} /> Add Account
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Assets</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(assets)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Liabilities</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{formatCurrency(liabilities)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Net Worth</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{formatCurrency(assets - liabilities)}</p>
        </div>
      </div>

      {/* Balance chart */}
      <div className="card">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Balance by Account</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={44} />
            <Tooltip
              formatter={(v: number, _n, p) => [formatCurrency(v), p.payload.is_liability ? 'Owed' : 'Balance']}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: 12 }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.is_liability ? '#EF4444' : entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-slate-200 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {assets_accounts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Assets</p>
              <div className="space-y-2">
                {assets_accounts.map(a => (
                  <AccountCard key={a.id} account={a} onEdit={a => setModal(a)} />
                ))}
              </div>
            </div>
          )}
          {liability_accounts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 mt-2">Liabilities</p>
              <div className="space-y-2">
                {liability_accounts.map(a => (
                  <AccountCard key={a.id} account={a} onEdit={a => setModal(a)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {modal && (
        <Modal
          title={modal === 'add' ? 'Add Account' : `Edit — ${(modal as Account).name}`}
          onClose={() => setModal(null)}
        >
          <AccountForm
            initial={modal !== 'add' ? (modal as Account) : undefined}
            onSave={handleSave}
            onClose={() => setModal(null)}
            onDelete={modal !== 'add' ? handleDelete : undefined}
          />
        </Modal>
      )}
    </div>
  );
}

