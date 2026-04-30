// ============================================================================
// Finwise — Supabase Database Types
// These mirror the exact Postgres schema. Regenerate with:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
// ============================================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type AccountType = 'checking' | 'savings' | 'credit_card' | 'brokerage' | 'retirement' | 'loan' | 'other'
export type GoalType    = 'emergency_fund' | 'vacation' | 'down_payment' | 'debt_payoff' | 'investment' | 'savings' | 'other'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:         string
          name:       string
          email:      string
          currency:   string
          theme:      string
          notify_budget_alerts:      boolean
          notify_goal_milestones:    boolean
          notify_large_transactions: boolean
          large_transaction_threshold: number
          notify_weekly_summary:     boolean
          notify_monthly_report:     boolean
          two_factor_enabled:        boolean
          session_timeout_minutes:   number
          created_at: string
        }
        Insert: {
          id:          string
          name?:       string
          email?:      string
          currency?:   string
          theme?:      string
          notify_budget_alerts?:      boolean
          notify_goal_milestones?:    boolean
          notify_large_transactions?: boolean
          large_transaction_threshold?: number
          notify_weekly_summary?:     boolean
          notify_monthly_report?:     boolean
          two_factor_enabled?:        boolean
          session_timeout_minutes?:   number
          created_at?: string
        }
        Update: {
          name?:     string
          email?:    string
          currency?: string
          theme?:      string
          notify_budget_alerts?:      boolean
          notify_goal_milestones?:    boolean
          notify_large_transactions?: boolean
          large_transaction_threshold?: number
          notify_weekly_summary?:     boolean
          notify_monthly_report?:     boolean
          two_factor_enabled?:        boolean
          session_timeout_minutes?:   number
        }
      }

      categories: {
        Row: {
          id:         string
          user_id:    string | null
          name:       string
          icon:       string
          color:      string
          is_income:  boolean
          is_system:  boolean
          created_at: string
        }
        Insert: {
          id?:        string
          user_id?:   string | null
          name:       string
          icon?:      string
          color?:     string
          is_income?: boolean
          is_system?: boolean
          created_at?: string
        }
        Update: {
          name?:      string
          icon?:      string
          color?:     string
          is_income?: boolean
        }
      }

      accounts: {
        Row: {
          id:               string
          user_id:          string
          name:             string
          institution:      string
          type:             AccountType
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
        Insert: {
          id?:               string
          user_id?:          string        // set from auth.uid() in data layer
          name:              string
          institution?:      string
          type?:             AccountType
          balance?:          number
          is_liability?:     boolean
          currency?:         string
          color?:            string
          last_synced?:      string | null
          plaid_item_id?:    string | null
          plaid_account_id?: string | null
        }
        Update: {
          name?:         string
          institution?:  string
          type?:         AccountType
          balance?:      number
          is_liability?: boolean
          currency?:     string
          color?:        string
          last_synced?:  string | null
        }
      }

      transactions: {
        Row: {
          id:                   string
          account_id:           string
          user_id:              string
          date:                 string
          merchant:             string
          amount:               number
          category_id:          string | null
          notes:                string
          is_pending:           boolean
          plaid_transaction_id: string | null
          created_at:           string
          updated_at:           string
        }
        Insert: {
          id?:                   string
          account_id:            string
          user_id?:              string    // set from auth.uid() in data layer
          date:                  string
          merchant:              string
          amount:                number
          category_id?:          string | null
          notes?:                string
          is_pending?:           boolean
          plaid_transaction_id?: string | null
        }
        Update: {
          account_id?:  string
          date?:        string
          merchant?:    string
          amount?:      number
          category_id?: string | null
          notes?:       string
          is_pending?:  boolean
        }
      }

      budgets: {
        Row: {
          id:          string
          user_id:     string
          category_id: string
          month:       number
          year:        number
          amount:      number
          created_at:  string
        }
        Insert: {
          id?:         string
          user_id?:    string            // set from auth.uid() in data layer
          category_id: string
          month:       number
          year:        number
          amount:      number
        }
        Update: {
          amount?: number
        }
      }

      goals: {
        Row: {
          id:             string
          user_id:        string
          name:           string
          type:           GoalType
          target_amount:  number
          current_amount: number
          target_date:    string | null
          account_id:     string | null
          color:          string
          notes:          string
          created_at:     string
          updated_at:     string
        }
        Insert: {
          id?:             string
          user_id?:        string        // set from auth.uid() in data layer
          name:            string
          type?:           GoalType
          target_amount:   number
          current_amount?: number
          target_date?:    string | null
          account_id?:     string | null
          color?:          string
          notes?:          string
        }
        Update: {
          name?:           string
          type?:           GoalType
          target_amount?:  number
          current_amount?: number
          target_date?:    string | null
          account_id?:     string | null
          color?:          string
          notes?:          string
        }
      }

      net_worth_snapshots: {
        Row: {
          id:          string
          user_id:     string
          date:        string
          assets:      number
          liabilities: number
          net_worth:   number          // GENERATED ALWAYS (assets - liabilities)
          created_at:  string
        }
        Insert: {
          id?:         string
          user_id?:    string          // set from auth.uid() in data layer
          date:        string
          assets:      number
          liabilities: number
        }
        Update: {
          assets?:      number
          liabilities?: number
        }
      }
    }
  }
}

// ── Convenience row types ─────────────────────────────────────────────────────
export type Profile          = Database['public']['Tables']['profiles']['Row']
export type Category         = Database['public']['Tables']['categories']['Row']
export type AccountRow       = Database['public']['Tables']['accounts']['Row']
export type TransactionRow   = Database['public']['Tables']['transactions']['Row']
export type BudgetRow        = Database['public']['Tables']['budgets']['Row']
export type GoalRow          = Database['public']['Tables']['goals']['Row']
export type NetWorthRow      = Database['public']['Tables']['net_worth_snapshots']['Row']

export type AccountInsert    = Database['public']['Tables']['accounts']['Insert']
export type AccountUpdate    = Database['public']['Tables']['accounts']['Update']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update']
export type BudgetInsert     = Database['public']['Tables']['budgets']['Insert']
export type GoalInsert       = Database['public']['Tables']['goals']['Insert']
export type GoalUpdate       = Database['public']['Tables']['goals']['Update']
export type SnapshotInsert   = Database['public']['Tables']['net_worth_snapshots']['Insert']
