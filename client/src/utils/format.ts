export function formatCurrency(amount: number, opts?: { compact?: boolean }): string {
  if (opts?.compact && Math.abs(amount) >= 1000) {
    const sign = amount < 0 ? '-' : '';
    const abs  = Math.abs(amount);
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
    return `${sign}$${(abs / 1000).toFixed(1)}k`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatMonthYear(month: number, year: number): string {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking:    'Checking',
  savings:     'Savings',
  credit_card: 'Credit Card',
  brokerage:   'Brokerage',
  retirement:  'Retirement',
  loan:        'Loan',
  other:       'Other',
};

export const GOAL_TYPE_LABELS: Record<string, string> = {
  emergency_fund: 'Emergency Fund',
  vacation:       'Vacation',
  down_payment:   'Down Payment',
  debt_payoff:    'Debt Payoff',
  investment:     'Investment',
  savings:        'Savings',
};
