export type AccountType = 'checking' | 'savings' | 'credit_card' | 'brokerage' | 'retirement' | 'loan' | 'other';

export interface Account {
  id: number;
  user_id: number;
  name: string;
  institution: string;
  type: AccountType;
  balance: number;
  is_liability: number;
  currency: string;
  color: string;
  last_synced: string | null;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  is_income: number;
}

export interface Transaction {
  id: number;
  account_id: number;
  date: string;
  merchant: string;
  amount: number;
  category_id: number | null;
  notes: string;
  is_pending: number;
  created_at: string;
  // joined
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  account_name?: string;
  account_type?: string;
  account_institution?: string;
}

export interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  month: number;
  year: number;
  amount: number;
  // joined
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  spent?: number;
}

export interface Goal {
  id: number;
  user_id: number;
  name: string;
  type: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  account_id: number | null;
  color: string;
  notes: string;
  created_at: string;
}

export interface NetWorthSnapshot {
  id: number;
  user_id: number;
  date: string;
  assets: number;
  liabilities: number;
  net_worth: number;
}

export interface DashboardData {
  netWorth: {
    total: number;
    assets: number;
    liabilities: number;
    change30d: number;
  };
  monthlySpending: {
    total: number;
    byCategory: { category_name: string; category_icon: string; category_color: string; total: number }[];
  };
  budgets: Budget[];
  recentTransactions: Transaction[];
  goals: Goal[];
  accounts: Account[];
}
