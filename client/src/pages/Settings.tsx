import { useState } from 'react';
import { User, Bell, Shield, Link2, Palette, LogOut, Check } from 'lucide-react';

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

function Toggle({ label, desc, defaultOn }: { label: string; desc?: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn ?? false);
  return (
    <div className="flex items-start justify-between py-3 border-b border-slate-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => setOn(o => !o)}
        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 mt-0.5
          ${on ? 'bg-indigo-500' : 'bg-slate-200'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform
          ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

export default function Settings() {
  const [saved, setSaved] = useState(false);
  const [name,  setName]  = useState('Alex Johnson');
  const [email, setEmail] = useState('alex@example.com');

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
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
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-semibold">AJ</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{name}</p>
              <p className="text-xs text-slate-400">{email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Currency</label>
            <select className="input max-w-xs">
              <option>USD — US Dollar</option>
              <option>EUR — Euro</option>
              <option>GBP — British Pound</option>
              <option>CAD — Canadian Dollar</option>
            </select>
          </div>
          <button type="submit" className="btn-primary">
            {saved ? <><Check size={14} /> Saved!</> : 'Save Changes'}
          </button>
        </form>
      </Section>

      {/* Notifications */}
      <Section title="Notifications" icon={Bell}>
        <Toggle label="Budget alerts"      desc="Notify when you're 80% through a budget category" defaultOn />
        <Toggle label="Goal milestones"    desc="Notify when you reach a goal milestone" defaultOn />
        <Toggle label="Large transactions" desc="Alert for transactions over $200" defaultOn />
        <Toggle label="Weekly summary"     desc="Email digest every Monday" />
        <Toggle label="Monthly report"     desc="Full financial report at month end" defaultOn />
      </Section>

      {/* Connected Accounts — Plaid placeholder */}
      <Section title="Connected Accounts" icon={Link2}>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm">🏦</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">Chase Bank</p>
              <p className="text-xs text-slate-400">3 accounts · Last synced just now</p>
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Connected</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Link2 size={14} className="text-slate-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500">Connect another institution</p>
              {/* TODO: Trigger Plaid Link OAuth flow — createLinkToken() → PlaidLink component → exchangePublicToken() */}
              <p className="text-xs text-slate-400">Powered by Plaid (integration coming soon)</p>
            </div>
            <button className="btn-secondary text-xs py-1 px-3">Connect</button>
          </div>
        </div>
      </Section>

      {/* Security */}
      <Section title="Security" icon={Shield}>
        <Toggle label="Two-factor authentication" desc="Require a code when logging in" />
        <Toggle label="Session timeout"           desc="Auto-logout after 30 minutes of inactivity" defaultOn />
        <div className="pt-3">
          <button className="btn-secondary text-sm">Change Password</button>
        </div>
      </Section>

      {/* Appearance */}
      <Section title="Appearance" icon={Palette}>
        <div>
          <label className="label">Theme</label>
          <div className="flex gap-2 mt-1">
            {['Light', 'Dark', 'System'].map((t, i) => (
              <button
                key={t}
                className={`px-4 py-1.5 rounded-xl text-sm font-medium border transition-colors ${i === 0 ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">Dark mode coming soon.</p>
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
