import { useEffect, useState, useCallback } from 'react';
import { getTransactions, getCategories, getAccounts, updateTransaction, createTransaction, deleteTransaction } from '../api/client';
import type { Transaction, Category, Account } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import CategoryBadge from '../components/CategoryBadge';
import Modal from '../components/Modal';
import { Search, Filter, Plus, Trash2, ArrowUpRight, ArrowDownRight, ChevronDown } from 'lucide-react';

function TransactionForm({
  initial,
  categories,
  accounts,
  onSave,
  onClose,
  onDelete,
}: {
  initial?: Transaction;
  categories: Category[];
  accounts: Account[];
  onSave: (d: Partial<Transaction>) => Promise<void>;
  onClose: () => void;
  onDelete?: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    account_id:  initial?.account_id  ?? accounts[0]?.id ?? '',
    date:        initial?.date        ?? new Date().toISOString().slice(0, 10),
    merchant:    initial?.merchant    ?? '',
    amount:      initial?.amount      ?? 0,
    category_id: initial?.category_id ?? null as string | null,
    notes:       initial?.notes       ?? '',
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={form.date} onChange={e => set('date', e.target.value)} required />
        </div>
        <div>
          <label className="label">Amount</label>
          <input type="number" step="0.01" className="input" value={form.amount}
            onChange={e => set('amount', parseFloat(e.target.value) || 0)}
            placeholder="-25.00 for expense" required />
        </div>
      </div>
      <div>
        <label className="label">Merchant / Description</label>
        <input className="input" value={form.merchant} onChange={e => set('merchant', e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Account</label>
          <select className="input" value={form.account_id} onChange={e => set('account_id', e.target.value)}>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" value={form.category_id ?? ''} onChange={e => set('category_id', e.target.value || null)}>
            <option value="">— Uncategorized —</option>
            {categories.filter(c => !c.is_income).map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            <optgroup label="Income">
              {categories.filter(c => c.is_income).map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </optgroup>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Notes</label>
        <input className="input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional" />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Transaction'}
        </button>
        {onDelete && (
          <button type="button" onClick={onDelete} className="btn-danger"><Trash2 size={14} /></button>
        )}
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories,   setCategories]   = useState<Category[]>([]);
  const [accounts,     setAccounts]     = useState<Account[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState<'add' | Transaction | null>(null);
  const [editingCat,   setEditingCat]   = useState<string | null>(null);

  // Filters
  const [search,      setSearch]      = useState('');
  const [filterCat,   setFilterCat]   = useState('');
  const [filterAcc,   setFilterAcc]   = useState('');
  const [filterMonth, setFilterMonth] = useState<number | ''>('');
  const [filterYear,  setFilterYear]  = useState<number | ''>(2026);
  const [showFilters, setShowFilters] = useState(false);

  const refresh = useCallback(() => {
    const params: Record<string, unknown> = {};
    if (search)      params.search      = search;
    if (filterCat)   params.category_id = filterCat;
    if (filterAcc)   params.account_id  = filterAcc;
    if (filterMonth) params.month       = filterMonth;
    if (filterYear)  params.year        = filterYear;
    setLoading(true);
    getTransactions(params as any)
      .then(setTransactions)
      .finally(() => setLoading(false));
  }, [search, filterCat, filterAcc, filterMonth, filterYear]);

  useEffect(() => {
    Promise.all([getCategories(), getAccounts()])
      .then(([cats, accs]) => { setCategories(cats); setAccounts(accs); });
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleSave(data: Partial<Transaction>) {
    if (modal && modal !== 'add') {
      await updateTransaction((modal as Transaction).id, data);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await createTransaction(data as any);
    }
    setModal(null);
    refresh();
  }

  async function handleDelete() {
    if (modal && modal !== 'add') {
      await deleteTransaction((modal as Transaction).id);
      setModal(null);
      refresh();
    }
  }

  async function handleQuickCat(txn: Transaction, catId: string) {
    await updateTransaction(txn.id, { category_id: catId });
    setEditingCat(null);
    refresh();
  }

  const income   = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div className="p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-500 text-sm mt-0.5">{transactions.length} transactions</p>
        </div>
        <button onClick={() => setModal('add')} className="btn-primary">
          <Plus size={16} /> Add Transaction
        </button>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card py-4 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Income</p>
          <p className="text-xl font-bold text-emerald-600 mt-0.5">{formatCurrency(income)}</p>
        </div>
        <div className="card py-4 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Expenses</p>
          <p className="text-xl font-bold text-red-500 mt-0.5">{formatCurrency(expenses)}</p>
        </div>
        <div className="card py-4 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Net</p>
          <p className={`text-xl font-bold mt-0.5 ${income - expenses >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {formatCurrency(income - expenses)}
          </p>
        </div>
      </div>

      {/* Search & filter */}
      <div className="card p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search transactions…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button onClick={() => setShowFilters(f => !f)} className="btn-secondary">
            <Filter size={15} /> Filters <ChevronDown size={13} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1 border-t border-slate-100">
            <div>
              <label className="label">Category</label>
              <select className="input" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Account</label>
              <select className="input" value={filterAcc} onChange={e => setFilterAcc(e.target.value)}>
                <option value="">All Accounts</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Month</label>
              <select className="input" value={filterMonth} onChange={e => setFilterMonth(e.target.value ? Number(e.target.value) : '')}>
                <option value="">All Months</option>
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                  <option key={i+1} value={i+1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Year</label>
              <select className="input" value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}>
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Transactions table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="animate-pulse p-6 space-y-3">
            {[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl" />)}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-4xl mb-2">🔍</p>
            <p className="font-medium">No transactions found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-5">Date</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">Merchant</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">Account</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-3">Category</th>
                <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wide py-3 px-5">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => {
                const isIncome = t.amount > 0;
                return (
                  <tr
                    key={t.id}
                    className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setModal(t)}
                  >
                    <td className="py-3 px-5 text-slate-500 whitespace-nowrap">{formatDate(t.date)}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                          style={{ backgroundColor: `${t.category_color ?? '#94a3b8'}20` }}
                        >
                          {t.category_icon ?? '📦'}
                        </div>
                        <span className="font-medium text-slate-700 truncate max-w-[200px]">{t.merchant}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-xs">{t.account_name}</td>
                    <td className="py-3 px-3" onClick={e => { e.stopPropagation(); setEditingCat(t.id); }}>
                      {editingCat === t.id ? (
                        <select
                          autoFocus
                          className="input text-xs py-1 px-2 w-36"
                          defaultValue={t.category_id ?? ''}
                          onChange={e => handleQuickCat(t, e.target.value)}
                          onBlur={() => setEditingCat(null)}
                        >
                          <option value="">Uncategorized</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                        </select>
                      ) : (
                        <CategoryBadge
                          name={t.category_name}
                          icon={t.category_icon}
                          color={t.category_color}
                          size="sm"
                        />
                      )}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <span className={`font-semibold tabular-nums flex items-center justify-end gap-0.5 ${isIncome ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {isIncome ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {isIncome ? '+' : ''}{formatCurrency(t.amount)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal
          title={modal === 'add' ? 'Add Transaction' : 'Edit Transaction'}
          onClose={() => setModal(null)}
        >
          <TransactionForm
            initial={modal !== 'add' ? (modal as Transaction) : undefined}
            categories={categories}
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
