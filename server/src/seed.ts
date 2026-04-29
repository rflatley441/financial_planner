import { db } from './db.js';

export function seedData() {
  const { count } = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (count > 0) return;

  console.log('🌱 Seeding mock data...');

  // ── User ─────────────────────────────────────────────────────────────────
  db.prepare(`INSERT INTO users (name, email) VALUES (?, ?)`).run('Alex Johnson', 'alex@example.com');

  // ── Categories ───────────────────────────────────────────────────────────
  const categoryRows = [
    { name: 'Housing',       icon: '🏠', color: '#6366F1', is_income: 0 },
    { name: 'Utilities',     icon: '⚡', color: '#EAB308', is_income: 0 },
    { name: 'Groceries',     icon: '🛒', color: '#10B981', is_income: 0 },
    { name: 'Dining Out',    icon: '🍽️', color: '#F59E0B', is_income: 0 },
    { name: 'Transportation',icon: '🚗', color: '#3B82F6', is_income: 0 },
    { name: 'Entertainment', icon: '🎬', color: '#8B5CF6', is_income: 0 },
    { name: 'Shopping',      icon: '🛍️', color: '#EC4899', is_income: 0 },
    { name: 'Healthcare',    icon: '🏥', color: '#14B8A6', is_income: 0 },
    { name: 'Travel',        icon: '✈️', color: '#F97316', is_income: 0 },
    { name: 'Subscriptions', icon: '📱', color: '#7C3AED', is_income: 0 },
    { name: 'Personal Care', icon: '💅', color: '#F472B6', is_income: 0 },
    { name: 'Education',     icon: '📚', color: '#0EA5E9', is_income: 0 },
    { name: 'Savings',       icon: '🏦', color: '#059669', is_income: 0 },
    { name: 'Income',        icon: '💵', color: '#16A34A', is_income: 1 },
    { name: 'Transfer',      icon: '🔄', color: '#94A3B8', is_income: 0 },
    { name: 'Other',         icon: '📦', color: '#78716C', is_income: 0 },
  ];
  const insertCat = db.prepare(`INSERT INTO categories (name, icon, color, is_income) VALUES (?, ?, ?, ?)`);
  categoryRows.forEach(c => insertCat.run(c.name, c.icon, c.color, c.is_income));

  // IDs assigned in insertion order (1-indexed)
  const C = {
    housing: 1, utilities: 2, groceries: 3, dining: 4,
    transport: 5, entertainment: 6, shopping: 7, healthcare: 8,
    travel: 9, subscriptions: 10, personalCare: 11, education: 12,
    savings: 13, income: 14, transfer: 15, other: 16,
  };

  // ── Accounts ─────────────────────────────────────────────────────────────
  // is_liability=1 means the balance represents what is owed (positive = debt)
  const accountRows = [
    { name: 'Chase Checking',    institution: 'Chase Bank',  type: 'checking',    balance: 5234.56,   is_liability: 0, color: '#1E40AF' },
    { name: 'Chase Savings',     institution: 'Chase Bank',  type: 'savings',     balance: 15000.00,  is_liability: 0, color: '#1D4ED8' },
    { name: 'Chase Sapphire',    institution: 'Chase Bank',  type: 'credit_card', balance: 1847.23,   is_liability: 1, color: '#1E3A8A' },
    { name: 'Vanguard Brokerage',institution: 'Vanguard',    type: 'brokerage',   balance: 45678.90,  is_liability: 0, color: '#991B1B' },
    { name: 'Fidelity 401(k)',   institution: 'Fidelity',    type: 'retirement',  balance: 125432.10, is_liability: 0, color: '#065F46' },
    { name: 'Student Loan',      institution: 'Sallie Mae',  type: 'loan',        balance: 12500.00,  is_liability: 1, color: '#92400E' },
  ];
  // IDs: 1=Checking, 2=Savings, 3=CreditCard, 4=Brokerage, 5=401k, 6=Loan
  const insertAcc = db.prepare(
    `INSERT INTO accounts (user_id, name, institution, type, balance, is_liability, color)
     VALUES (1, ?, ?, ?, ?, ?, ?)`
  );
  accountRows.forEach(a => insertAcc.run(a.name, a.institution, a.type, a.balance, a.is_liability, a.color));

  // ── Transactions ─────────────────────────────────────────────────────────
  // amount: negative = expense, positive = income/credit
  const txns = [
    // April 2026
    { account_id: 1, date: '2026-04-01', merchant: 'Landlord – Rent',          amount: -2000.00, cat: C.housing },
    { account_id: 3, date: '2026-04-02', merchant: 'Whole Foods Market',        amount:   -89.43, cat: C.groceries },
    { account_id: 3, date: '2026-04-03', merchant: 'Sweetgreen',                amount:   -15.75, cat: C.dining },
    { account_id: 3, date: '2026-04-05', merchant: 'Netflix',                   amount:   -15.49, cat: C.subscriptions },
    { account_id: 3, date: '2026-04-05', merchant: 'Spotify',                   amount:    -9.99, cat: C.subscriptions },
    { account_id: 3, date: '2026-04-06', merchant: 'Shell Gas Station',         amount:   -52.34, cat: C.transport },
    { account_id: 3, date: '2026-04-08', merchant: "Trader Joe's",              amount:   -67.21, cat: C.groceries },
    { account_id: 3, date: '2026-04-09', merchant: 'Chipotle',                  amount:   -13.89, cat: C.dining },
    { account_id: 3, date: '2026-04-10', merchant: 'Amazon',                    amount:   -45.67, cat: C.shopping },
    { account_id: 1, date: '2026-04-11', merchant: 'Con Edison – Electric',     amount:   -78.45, cat: C.utilities },
    { account_id: 3, date: '2026-04-12', merchant: 'Starbucks',                 amount:    -6.75, cat: C.dining },
    { account_id: 3, date: '2026-04-14', merchant: 'Uber',                      amount:   -18.50, cat: C.transport },
    { account_id: 1, date: '2026-04-15', merchant: 'Employer Payroll',          amount:  5000.00, cat: C.income },
    { account_id: 3, date: '2026-04-16', merchant: 'Whole Foods Market',        amount:  -102.34, cat: C.groceries },
    { account_id: 3, date: '2026-04-17', merchant: 'The Cheesecake Factory',    amount:   -85.43, cat: C.dining },
    { account_id: 3, date: '2026-04-18', merchant: 'Target',                    amount:   -67.89, cat: C.shopping },
    { account_id: 1, date: '2026-04-19', merchant: 'Xfinity – Internet',        amount:   -59.99, cat: C.utilities },
    { account_id: 3, date: '2026-04-20', merchant: 'Planet Fitness',            amount:   -24.99, cat: C.subscriptions },
    { account_id: 3, date: '2026-04-21', merchant: 'Whole Foods Market',        amount:  -118.73, cat: C.groceries },
    { account_id: 3, date: '2026-04-23', merchant: 'Lyft',                      amount:   -22.50, cat: C.transport },
    { account_id: 3, date: '2026-04-24', merchant: 'AMC Theaters',              amount:   -28.50, cat: C.entertainment },
    { account_id: 3, date: '2026-04-25', merchant: 'The Local Bar & Grill',     amount:   -45.00, cat: C.dining },
    { account_id: 3, date: '2026-04-26', merchant: 'CVS Pharmacy',              amount:   -23.45, cat: C.healthcare },
    { account_id: 3, date: '2026-04-27', merchant: 'Zara',                      amount:   -89.99, cat: C.shopping },
    { account_id: 1, date: '2026-04-28', merchant: 'Transfer to Savings',       amount:  -500.00, cat: C.transfer },
    { account_id: 2, date: '2026-04-28', merchant: 'Transfer from Checking',    amount:   500.00, cat: C.transfer },
    { account_id: 3, date: '2026-04-29', merchant: 'Starbucks',                 amount:    -7.25, cat: C.dining },

    // March 2026
    { account_id: 1, date: '2026-03-01', merchant: 'Landlord – Rent',           amount: -2000.00, cat: C.housing },
    { account_id: 3, date: '2026-03-02', merchant: 'Whole Foods Market',         amount:   -95.67, cat: C.groceries },
    { account_id: 3, date: '2026-03-04', merchant: 'Chipotle',                   amount:   -12.50, cat: C.dining },
    { account_id: 3, date: '2026-03-05', merchant: 'Netflix',                    amount:   -15.49, cat: C.subscriptions },
    { account_id: 3, date: '2026-03-05', merchant: 'Spotify',                    amount:    -9.99, cat: C.subscriptions },
    { account_id: 3, date: '2026-03-07', merchant: 'Shell Gas Station',          amount:   -48.23, cat: C.transport },
    { account_id: 3, date: '2026-03-09', merchant: "Trader Joe's",               amount:   -71.45, cat: C.groceries },
    { account_id: 1, date: '2026-03-10', merchant: 'Con Edison – Electric',      amount:   -82.34, cat: C.utilities },
    { account_id: 3, date: '2026-03-11', merchant: 'Amazon',                     amount:  -129.99, cat: C.shopping },
    { account_id: 3, date: '2026-03-12', merchant: 'Uber Eats',                  amount:   -34.50, cat: C.dining },
    { account_id: 3, date: '2026-03-14', merchant: 'H&M',                        amount:   -78.50, cat: C.shopping },
    { account_id: 1, date: '2026-03-15', merchant: 'Employer Payroll',           amount:  5000.00, cat: C.income },
    { account_id: 3, date: '2026-03-15', merchant: 'Whole Foods Market',         amount:   -88.34, cat: C.groceries },
    { account_id: 3, date: '2026-03-17', merchant: 'Nobu Restaurant',            amount:   -97.80, cat: C.dining },
    { account_id: 1, date: '2026-03-18', merchant: 'Xfinity – Internet',         amount:   -59.99, cat: C.utilities },
    { account_id: 3, date: '2026-03-19', merchant: 'Planet Fitness',             amount:   -24.99, cat: C.subscriptions },
    { account_id: 3, date: '2026-03-20', merchant: 'Walgreens',                  amount:   -18.95, cat: C.healthcare },
    { account_id: 3, date: '2026-03-21', merchant: 'Whole Foods Market',         amount:  -112.45, cat: C.groceries },
    { account_id: 3, date: '2026-03-22', merchant: 'Lyft',                       amount:   -19.50, cat: C.transport },
    { account_id: 3, date: '2026-03-24', merchant: 'Concert Tickets – Ticketmaster', amount: -85.00, cat: C.entertainment },
    { account_id: 3, date: '2026-03-25', merchant: 'IKEA',                       amount:  -145.67, cat: C.shopping },
    { account_id: 3, date: '2026-03-26', merchant: "Doctor's Office Copay",      amount:   -40.00, cat: C.healthcare },
    { account_id: 3, date: '2026-03-28', merchant: 'The Local Bar & Grill',      amount:   -38.50, cat: C.dining },
    { account_id: 1, date: '2026-03-28', merchant: 'Transfer to Savings',        amount:  -500.00, cat: C.transfer },
    { account_id: 2, date: '2026-03-28', merchant: 'Transfer from Checking',     amount:   500.00, cat: C.transfer },
    { account_id: 3, date: '2026-03-30', merchant: 'BP Gas Station',             amount:   -55.00, cat: C.transport },
    { account_id: 1, date: '2026-03-31', merchant: 'Student Loan Payment',       amount:  -250.00, cat: C.education },

    // February 2026
    { account_id: 1, date: '2026-02-01', merchant: 'Landlord – Rent',            amount: -2000.00, cat: C.housing },
    { account_id: 3, date: '2026-02-03', merchant: 'Whole Foods Market',          amount:   -88.90, cat: C.groceries },
    { account_id: 3, date: '2026-02-05', merchant: 'Netflix',                     amount:   -15.49, cat: C.subscriptions },
    { account_id: 3, date: '2026-02-05', merchant: 'Spotify',                     amount:    -9.99, cat: C.subscriptions },
    { account_id: 3, date: '2026-02-08', merchant: "Valentine's Day Dinner",      amount:  -145.00, cat: C.dining },
    { account_id: 1, date: '2026-02-10', merchant: 'Con Edison – Electric',       amount:   -95.67, cat: C.utilities },
    { account_id: 3, date: '2026-02-11', merchant: 'Amazon',                      amount:   -67.45, cat: C.shopping },
    { account_id: 1, date: '2026-02-14', merchant: 'Employer Payroll',            amount:  5000.00, cat: C.income },
    { account_id: 3, date: '2026-02-15', merchant: "Trader Joe's",                amount:   -82.30, cat: C.groceries },
    { account_id: 1, date: '2026-02-17', merchant: 'Xfinity – Internet',          amount:   -59.99, cat: C.utilities },
    { account_id: 3, date: '2026-02-19', merchant: 'Planet Fitness',              amount:   -24.99, cat: C.subscriptions },
    { account_id: 3, date: '2026-02-20', merchant: 'Shell Gas Station',           amount:   -44.56, cat: C.transport },
    { account_id: 3, date: '2026-02-22', merchant: 'Whole Foods Market',          amount:  -105.34, cat: C.groceries },
    { account_id: 3, date: '2026-02-25', merchant: 'Flight – Spring Break Trip',  amount:  -389.00, cat: C.travel },
    { account_id: 1, date: '2026-02-28', merchant: 'Transfer to Savings',         amount:  -500.00, cat: C.transfer },
    { account_id: 2, date: '2026-02-28', merchant: 'Transfer from Checking',      amount:   500.00, cat: C.transfer },
    { account_id: 1, date: '2026-02-28', merchant: 'Student Loan Payment',        amount:  -250.00, cat: C.education },
  ];

  const insertTxn = db.prepare(
    `INSERT INTO transactions (account_id, date, merchant, amount, category_id) VALUES (?, ?, ?, ?, ?)`
  );
  txns.forEach(t => insertTxn.run(t.account_id, t.date, t.merchant, t.amount, t.cat));

  // ── Budgets ───────────────────────────────────────────────────────────────
  const budgets: { cat: number; apr: number; mar: number }[] = [
    { cat: C.housing,       apr: 2200, mar: 2200 },
    { cat: C.utilities,     apr:  200, mar:  200 },
    { cat: C.groceries,     apr:  400, mar:  400 },
    { cat: C.dining,        apr:  200, mar:  200 },
    { cat: C.transport,     apr:  150, mar:  150 },
    { cat: C.entertainment, apr:   80, mar:   80 },
    { cat: C.shopping,      apr:  150, mar:  200 },
    { cat: C.healthcare,    apr:  100, mar:  100 },
    { cat: C.subscriptions, apr:   80, mar:   80 },
    { cat: C.travel,        apr:  100, mar:    0 },
    { cat: C.savings,       apr:  500, mar:  500 },
  ];
  const insertBudget = db.prepare(
    `INSERT OR REPLACE INTO budgets (user_id, category_id, month, year, amount) VALUES (1, ?, ?, 2026, ?)`
  );
  budgets.forEach(b => {
    insertBudget.run(b.cat, 4, b.apr);
    if (b.mar > 0) insertBudget.run(b.cat, 3, b.mar);
  });

  // ── Goals ─────────────────────────────────────────────────────────────────
  const goals = [
    { name: 'Emergency Fund',     type: 'emergency_fund', target: 30000,   current: 15000,   date: '2027-01-01', acc: 2, color: '#10B981', notes: 'Build 6 months of expenses' },
    { name: 'Europe Vacation',    type: 'vacation',       target:  8000,   current:  3200,   date: '2026-12-01', acc: null, color: '#F59E0B', notes: '2-week trip to Europe' },
    { name: 'House Down Payment', type: 'down_payment',   target: 60000,   current: 22000,   date: '2028-06-01', acc: null, color: '#6366F1', notes: '20% down on a $300k home' },
    { name: 'Student Loan Payoff',type: 'debt_payoff',    target: 16000,   current:  3500,   date: '2027-12-01', acc: null, color: '#EF4444', notes: 'Pay off remaining balance' },
    { name: 'Investment Portfolio',type:'investment',     target: 200000,  current: 171111,  date: '2027-12-31', acc: 4,    color: '#8B5CF6', notes: 'Reach $200k in investments' },
  ];
  const insertGoal = db.prepare(
    `INSERT INTO goals (user_id, name, type, target_amount, current_amount, target_date, account_id, color, notes)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  goals.forEach(g => insertGoal.run(g.name, g.type, g.target, g.current, g.date, g.acc, g.color, g.notes));

  // ── Net Worth Snapshots ───────────────────────────────────────────────────
  const snapshots = [
    { date: '2025-04-30', assets: 155000,    liabilities: 16000,   net_worth: 139000 },
    { date: '2025-05-31', assets: 160000,    liabilities: 15800,   net_worth: 144200 },
    { date: '2025-06-30', assets: 163000,    liabilities: 15600,   net_worth: 147400 },
    { date: '2025-07-31', assets: 165500,    liabilities: 15400,   net_worth: 150100 },
    { date: '2025-08-31', assets: 168000,    liabilities: 15200,   net_worth: 152800 },
    { date: '2025-09-30', assets: 171000,    liabilities: 15000,   net_worth: 156000 },
    { date: '2025-10-31', assets: 175000,    liabilities: 14800,   net_worth: 160200 },
    { date: '2025-11-30', assets: 178000,    liabilities: 14600,   net_worth: 163400 },
    { date: '2025-12-31', assets: 182000,    liabilities: 14500,   net_worth: 167500 },
    { date: '2026-01-31', assets: 184000,    liabilities: 14400,   net_worth: 169600 },
    { date: '2026-02-28', assets: 186000,    liabilities: 14347,   net_worth: 171653 },
    { date: '2026-03-31', assets: 189000,    liabilities: 14347,   net_worth: 174653 },
    { date: '2026-04-29', assets: 191345.56, liabilities: 14347.23,net_worth: 176998.33 },
  ];
  const insertSnap = db.prepare(
    `INSERT INTO net_worth_snapshots (user_id, date, assets, liabilities, net_worth) VALUES (1, ?, ?, ?, ?)`
  );
  snapshots.forEach(s => insertSnap.run(s.date, s.assets, s.liabilities, s.net_worth));

  console.log('✅ Mock data seeded successfully');
}
