import type { Account } from '../types';
import { formatCurrency, ACCOUNT_TYPE_LABELS } from '../utils/format';
import { CreditCard, Landmark, TrendingUp, PiggyBank, GraduationCap, Wallet } from 'lucide-react';

const TYPE_ICONS: Record<string, React.ElementType> = {
  checking:    Wallet,
  savings:     PiggyBank,
  credit_card: CreditCard,
  brokerage:   TrendingUp,
  retirement:  Landmark,
  loan:        GraduationCap,
  other:       Wallet,
};

interface Props {
  account: Account;
  onEdit?: (a: Account) => void;
}

export default function AccountCard({ account, onEdit }: Props) {
  const Icon = TYPE_ICONS[account.type] ?? Wallet;
  const isLiability = Boolean(account.is_liability);
  const displayBalance = isLiability ? -account.balance : account.balance;

  return (
    <div
      className="card flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onEdit?.(account)}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${account.color}20` }}
      >
        <Icon size={20} style={{ color: account.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{account.name}</p>
        <p className="text-xs text-slate-400 truncate">{account.institution} · {ACCOUNT_TYPE_LABELS[account.type]}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-bold tabular-nums ${displayBalance < 0 ? 'text-red-500' : 'text-slate-800'}`}>
          {formatCurrency(displayBalance)}
        </p>
        {isLiability && (
          <p className="text-xs text-red-400 font-medium">Liability</p>
        )}
      </div>
    </div>
  );
}
