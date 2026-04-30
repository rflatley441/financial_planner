import { useEffect, useMemo, useState } from 'react';
import { User, Bell, Shield, Link2, Palette, LogOut, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAccounts } from '../lib/db/accounts';
import PlaidLinkButton from '../components/PlaidLinkButton';
import { getProfile, upsertProfile } from '../lib/db/profile';
import type { Profile } from '../types/database';

function initialsFrom(name: string | undefined, email: string | undefined): string {
  const n = name?.trim() ?? '';
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
    return n.slice(0, 2).toUpperCase();
  }
  const local = email?.split('@')[0] ?? '?';
  return local.slice(0, 2).toUpperCase();
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
          <Icon size={16} className="text-indigo-600" />
        </div>
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Toggle({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc?: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-slate-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 mt-0.5
          ${value ? 'bg-indigo-500' : 'bg-slate-200'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform
          ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

export default function Settings() {
  const { user, loading } = useAuth();
  const [saved, setSaved] = useState(false);
  const authMetaName = user?.user_metadata?.name as string | undefined;
  const derivedAuthName = authMetaName?.trim() || user?.email?.split('@')[0] || '';
  const derivedAuthEmail = user?.email ?? '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'CAD' | string>('USD');
  const [theme, setTheme] = useState<'Light' | 'Dark' | 'System'>('System');

  const [notifyBudgetAlerts, setNotifyBudgetAlerts] = useState(true);
  const [notifyGoalMilestones, setNotifyGoalMilestones] = useState(true);
  const [notifyLargeTransactions, setNotifyLargeTransactions] = useState(true);
  const [largeTransactionThreshold, setLargeTransactionThreshold] = useState(200);
  const [notifyWeeklySummary, setNotifyWeeklySummary] = useState(false);
  const [notifyMonthlyReport, setNotifyMonthlyReport] = useState(true);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(30);

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [connected, setConnected] = useState<Array<{
    institution: string
    accountCount: number
    lastSynced: string | null
  }>>([]);
  const [connectedLoading, setConnectedLoading] = useState(false);
  const [connectedError, setConnectedError] = useState<string | null>(null);

  // Keep local inputs in sync with auth user (unless user is editing).
  useEffect(() => {
    if (!user) {
      setName('');
      setEmail('');
      return;
    }
    setName(derivedAuthName);
    setEmail(derivedAuthEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const initials = useMemo(
    () => initialsFrom(name || authMetaName, email || user?.email || undefined),
    [authMetaName, email, name, user?.email],
  );

  function toUiTheme(dbTheme: Profile['theme'] | string | null | undefined): 'Light' | 'Dark' | 'System' {
    const t = (dbTheme ?? '').toLowerCase();
    if (t === 'light') return 'Light';
    if (t === 'dark') return 'Dark';
    return 'System';
  }

  function toDbTheme(ui: 'Light' | 'Dark' | 'System'): 'light' | 'dark' | 'system' {
    if (ui === 'Light') return 'light';
    if (ui === 'Dark') return 'dark';
    return 'system';
  }

  async function refreshProfile() {
    if (!user) return;
    setProfileLoading(true);
    setProfileError(null);
    try {
      let p: Profile;
      try {
        p = await getProfile();
      } catch {
        // If the trigger didn’t create a row (or it was deleted), recreate it.
        p = await upsertProfile({
          name: derivedAuthName,
          email: derivedAuthEmail,
        } as any);
      }

      setName(p.name || derivedAuthName);
      setEmail(p.email || derivedAuthEmail);
      setCurrency(p.currency || 'USD');
      setTheme(toUiTheme((p as any).theme));

      setNotifyBudgetAlerts(Boolean((p as any).notify_budget_alerts));
      setNotifyGoalMilestones(Boolean((p as any).notify_goal_milestones));
      setNotifyLargeTransactions(Boolean((p as any).notify_large_transactions));
      setLargeTransactionThreshold(Number((p as any).large_transaction_threshold ?? 200));
      setNotifyWeeklySummary(Boolean((p as any).notify_weekly_summary));
      setNotifyMonthlyReport(Boolean((p as any).notify_monthly_report));

      setTwoFactorEnabled(Boolean((p as any).two_factor_enabled));
      setSessionTimeoutMinutes(Number((p as any).session_timeout_minutes ?? 30));
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : 'Could not load profile settings');
    } finally {
      setProfileLoading(false);
    }
  }

  async function refreshConnected() {
    if (!user) {
      setConnected([]);
      return;
    }
    setConnectedLoading(true);
    setConnectedError(null);
    try {
      const accounts = await getAccounts();
      const linked = accounts.filter(a => Boolean(a.plaid_item_id));

      const byInstitution = new Map<string, { accountCount: number; lastSynced: string | null }>();
      for (const a of linked) {
        const inst = a.institution?.trim() || 'Bank';
        const existing = byInstitution.get(inst);
        const last = a.last_synced ?? null;

        if (!existing) {
          byInstitution.set(inst, { accountCount: 1, lastSynced: last });
          continue;
        }
        existing.accountCount += 1;
        if (!existing.lastSynced) {
          existing.lastSynced = last;
        } else if (last && new Date(last).getTime() > new Date(existing.lastSynced).getTime()) {
          existing.lastSynced = last;
        }
      }

      const rows = Array.from(byInstitution.entries())
        .map(([institution, v]) => ({ institution, ...v }))
        .sort((a, b) => a.institution.localeCompare(b.institution));

      setConnected(rows);
    } catch (e) {
      setConnectedError(e instanceof Error ? e.message : 'Could not load connected accounts');
    } finally {
      setConnectedLoading(false);
    }
  }

  useEffect(() => {
    refreshProfile();
    refreshConnected();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaved(false);
    setProfileError(null);
    setProfileLoading(true);
    upsertProfile({
      name: name.trim(),
      email: derivedAuthEmail,
      currency,
      theme: toDbTheme(theme),
      notify_budget_alerts: notifyBudgetAlerts,
      notify_goal_milestones: notifyGoalMilestones,
      notify_large_transactions: notifyLargeTransactions,
      large_transaction_threshold: largeTransactionThreshold,
      notify_weekly_summary: notifyWeeklySummary,
      notify_monthly_report: notifyMonthlyReport,
      two_factor_enabled: twoFactorEnabled,
      session_timeout_minutes: sessionTimeoutMinutes,
    } as any)
      .then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      })
      .catch((e) => {
        setProfileError(e instanceof Error ? e.message : 'Could not save settings');
      })
      .finally(() => setProfileLoading(false));
  }

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your account preferences.</p>
      </div>

      {/* Profile */}
      <Section title="Profile" icon={User}>
        <form onSubmit={handleSave} className="space-y-4">
          {profileError && (
            <p className="text-xs text-red-600">{profileError}</p>
          )}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-semibold">{initials}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {(loading || profileLoading) ? 'Loading…' : (name || '—')}
              </p>
              <p className="text-xs text-slate-400">{email || '—'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={email} disabled />
            </div>
          </div>
          <div>
            <label className="label">Currency</label>
            <select
              className="input max-w-xs"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="CAD">CAD — Canadian Dollar</option>
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={profileLoading || !user}>
            {saved ? <><Check size={14} /> Saved!</> : 'Save Changes'}
          </button>
        </form>
      </Section>

      {/* Notifications */}
      <Section title="Notifications" icon={Bell}>
        <Toggle
          label="Budget alerts"
          desc="Notify when you're 80% through a budget category"
          value={notifyBudgetAlerts}
          onChange={setNotifyBudgetAlerts}
        />
        <Toggle
          label="Goal milestones"
          desc="Notify when you reach a goal milestone"
          value={notifyGoalMilestones}
          onChange={setNotifyGoalMilestones}
        />
        <div className="py-3 border-b border-slate-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Large transactions</p>
              <p className="text-xs text-slate-400 mt-0.5">Alert for transactions over a threshold</p>
            </div>
            <button
              type="button"
              onClick={() => setNotifyLargeTransactions(v => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 mt-0.5
                ${notifyLargeTransactions ? 'bg-indigo-500' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform
                ${notifyLargeTransactions ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-slate-500">$</span>
            <input
              type="number"
              className="input max-w-[140px]"
              value={Number.isFinite(largeTransactionThreshold) ? largeTransactionThreshold : 200}
              onChange={(e) => setLargeTransactionThreshold(Number(e.target.value))}
              min={0}
              step={10}
              disabled={!notifyLargeTransactions}
            />
            <span className="text-xs text-slate-500">threshold</span>
          </div>
        </div>
        <Toggle
          label="Weekly summary"
          desc="Email digest every Monday"
          value={notifyWeeklySummary}
          onChange={setNotifyWeeklySummary}
        />
        <Toggle
          label="Monthly report"
          desc="Full financial report at month end"
          value={notifyMonthlyReport}
          onChange={setNotifyMonthlyReport}
        />
      </Section>

      {/* Connected Accounts — Plaid placeholder */}
      <Section title="Connected Accounts" icon={Link2}>
        <div className="space-y-3">
          {connectedError && (
            <p className="text-xs text-red-600">{connectedError}</p>
          )}

          {connectedLoading ? (
            <div className="text-sm text-slate-500">Loading connected institutions…</div>
          ) : connected.length === 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-slate-500">
                {user ? 'No connected institutions yet.' : 'Sign in to connect your bank accounts.'}
              </p>
            </div>
          ) : (
            connected.map((c) => (
              <div key={c.institution} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">🏦</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{c.institution}</p>
                  <p className="text-xs text-slate-400">
                    {c.accountCount} account{c.accountCount === 1 ? '' : 's'}
                    {c.lastSynced ? ` · Last synced ${new Date(c.lastSynced).toLocaleString()}` : ' · Not yet synced'}
                  </p>
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Connected</span>
              </div>
            ))
          )}

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Link2 size={14} className="text-slate-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500">Connect another institution</p>
              <p className="text-xs text-slate-400">Powered by Plaid</p>
            </div>
            {/* Button renders its own disabled/error states */}
            <div className="shrink-0">
              {user ? (
                <PlaidLinkButton onConnected={refreshConnected} />
              ) : (
                <button className="btn-secondary text-xs py-1 px-3" disabled>Connect</button>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* Security */}
      <Section title="Security" icon={Shield}>
        <Toggle
          label="Two-factor authentication"
          desc="Require a code when logging in (preference only for now)"
          value={twoFactorEnabled}
          onChange={setTwoFactorEnabled}
        />
        <div className="py-3 border-b border-slate-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Session timeout</p>
              <p className="text-xs text-slate-400 mt-0.5">Auto-logout after inactivity</p>
            </div>
            <select
              className="input max-w-[180px]"
              value={sessionTimeoutMinutes}
              onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
            >
              {[15, 30, 45, 60, 120].map((m) => (
                <option key={m} value={m}>{m} minutes</option>
              ))}
            </select>
          </div>
        </div>
        <div className="pt-3">
          <button className="btn-secondary text-sm">Change Password</button>
        </div>
      </Section>

      {/* Appearance */}
      <Section title="Appearance" icon={Palette}>
        <div>
          <label className="label">Theme</label>
          <div className="flex gap-2 mt-1">
            {(['Light', 'Dark', 'System'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`px-4 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                  theme === t
                    ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">Saved to your profile.</p>
        </div>
      </Section>

      {/* Danger zone */}
      <div className="card border-red-100">
        <h2 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
          <LogOut size={14} />
          Account Actions
        </h2>
        <div className="flex gap-3">
          <button className="btn-secondary text-sm">Export All Data</button>
          <button className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors px-4 py-2 rounded-xl hover:bg-red-50">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
