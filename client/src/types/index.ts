// ============================================================================
// Finwise — App-level types
// IDs are UUIDs (string). Booleans are real booleans (not 0/1).
// "Joined" optional fields are populated by the data layer from Supabase
// foreign-key selects so that pages don't need to drill into nested objects.
// ============================================================================

export type { AccountType, GoalType, Profile } from './database'

export interface Account {
  id:               string
  user_id:          string
  name:             string
  institution:      string
  type:             import('./database').AccountType
  balance:          number
  is_liability:     boolean
  currency:         string
  color:            string
  last_synced:      string | null
  plaid_item_id:    string | null
  plaid_account_id: string | null
  created_at:       string
  updated_at:       string
}

export interface Category {
  id:        string
  user_id:   string | null
  name:      string
  icon:      string
  color:     string
  is_income: boolean
  is_system: boolean
  created_at: string
}

export interface Transaction {
  id:          string
  account_id:  string
  user_id:     string
  date:        string
  merchant:    string
  amount:      number
  category_id: string | null
  notes:       string
  is_pending:  boolean
  created_at:  string
  updated_at:  string
  // Flattened join fields — populated by the data layer
  category_name?:         string
  category_icon?:         string
  category_color?:        string
  account_name?:          string
  account_type?:          string
  account_institution?:   string
}

export interface Budget {
  id:          string
  user_id:     string
  category_id: string
  month:       number
  year:        number
  amount:      number
  created_at:  string
  // Flattened join fields
  category_name?:  string
  category_icon?:  string
  category_color?: string
  // Computed server-side
  spent?: number
}

export interface Goal {
  id:             string
  user_id:        string
  name:           string
  type:           string
  target_amount:  number
  current_amount: number
  target_date:    string | null
  account_id:     string | null
  color:          string
  notes:          string
  created_at:     string
  updated_at:     string
}

export interface NetWorthSnapshot {
  id:          string
  user_id:     string
  date:        string
  assets:      number
  liabilities: number
  net_worth:   number
  created_at:  string
}

export interface DashboardData {
  netWorth: {
    total:      number
    assets:     number
    liabilities: number
    change30d:  number
  }
  monthlySpending: {
    total:      number
    byCategory: { category_name: string; category_icon: string; category_color: string; total: number }[]
  }
  budgets:             Budget[]
  recentTransactions:  Transaction[]
  goals:               Goal[]
  accounts:            Account[]
}
