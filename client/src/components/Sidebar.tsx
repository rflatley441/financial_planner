import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, ArrowLeftRight,
  PiggyBank, Target, Settings, TrendingUp, LogOut,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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

const links = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/accounts',     icon: Building2,       label: 'Accounts' },
  { to: '/transactions', icon: ArrowLeftRight,   label: 'Transactions' },
  { to: '/budgets',      icon: PiggyBank,        label: 'Budgets' },
  { to: '/goals',        icon: Target,           label: 'Goals' },
];

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const metaName = user?.user_metadata?.name as string | undefined;
  const displayName = metaName?.trim() || user?.email?.split('@')[0] || 'Account';
  const email = user?.email ?? '';
  const initials = initialsFrom(metaName, user?.email ?? undefined);

  async function handleSignOut() {
    await signOut();
    navigate('/auth', { replace: true });
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-slate-900 flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
          <TrendingUp size={16} className="text-white" />
        </div>
        <span className="text-white font-semibold text-lg tracking-tight">Finwise</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
               ${isActive
                 ? 'bg-indigo-600 text-white shadow-sm'
                 : 'text-slate-400 hover:text-white hover:bg-slate-800'
               }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-slate-800 pt-3 space-y-0.5">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
             ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`
          }
        >
          <Settings size={18} />
          Settings
        </NavLink>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{displayName}</p>
            <p className="text-slate-500 text-xs truncate">{email || '—'}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
