import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Building2, ArrowLeftRight,
  PiggyBank, Target, Settings, TrendingUp, LogOut,
} from 'lucide-react';

const links = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/accounts',     icon: Building2,       label: 'Accounts' },
  { to: '/transactions', icon: ArrowLeftRight,   label: 'Transactions' },
  { to: '/budgets',      icon: PiggyBank,        label: 'Budgets' },
  { to: '/goals',        icon: Target,           label: 'Goals' },
];

export default function Sidebar() {
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
            <span className="text-white text-xs font-semibold">AJ</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">Alex Johnson</p>
            <p className="text-slate-500 text-xs truncate">alex@example.com</p>
          </div>
          <LogOut size={14} className="text-slate-500 flex-shrink-0" />
        </div>
      </div>
    </aside>
  );
}
