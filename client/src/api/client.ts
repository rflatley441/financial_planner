// ============================================================================
// Finwise — API client (Supabase adapter)
// All functions re-exported from lib/db/ so existing page imports keep working.
// The Express/SQLite server is no longer used for data operations.
// ============================================================================

export {
  // Dashboard
  getDashboard,

  // Accounts
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,

  // Transactions
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,

  // Categories
  getCategories,

  // Budgets
  getBudgets,
  upsertBudget,
  deleteBudget,

  // Goals
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,

  // Net worth history
  getNetWorth,
  recordNetWorthSnapshot,
} from '../lib/db'
