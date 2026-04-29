import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year  = String(now.getFullYear());

  // ── Net worth ─────────────────────────────────────────────────────────────
  const accounts = db.prepare('SELECT * FROM accounts WHERE user_id = 1').all() as any[];
  const assets      = accounts.filter(a => !a.is_liability).reduce((s, a) => s + a.balance, 0);
  const liabilities = accounts.filter(a =>  a.is_liability).reduce((s, a) => s + a.balance, 0);
  const netWorth    = assets - liabilities;

  // 30-day change from net worth snapshots
  const prevSnap = db.prepare(`
    SELECT net_worth FROM net_worth_snapshots
    WHERE user_id = 1 AND date <= date('now', '-30 days')
    ORDER BY date DESC LIMIT 1
  `).get() as { net_worth: number } | undefined;
  const change30d = prevSnap ? netWorth - prevSnap.net_worth : 0;

  // ── Monthly spending (current month, expenses only) ───────────────────────
  const spending = db.prepare(`
    SELECT
      c.name  AS category_name,
      c.icon  AS category_icon,
      c.color AS category_color,
      ABS(SUM(t.amount)) AS total
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN accounts   a ON t.account_id  = a.id
    WHERE a.user_id = 1
      AND t.amount < 0
      AND c.is_income = 0
      AND c.name != 'Transfer'
      AND strftime('%m', t.date) = ?
      AND strftime('%Y', t.date) = ?
    GROUP BY t.category_id
    ORDER BY total DESC
  `).all(month, year) as any[];

  const totalSpending = spending.reduce((s: number, r: any) => s + r.total, 0);

  // ── Budget progress (current month) ───────────────────────────────────────
  const budgets = db.prepare(`
    SELECT
      b.*,
      c.name  AS category_name,
      c.icon  AS category_icon,
      c.color AS category_color,
      COALESCE(ABS(SUM(CASE WHEN t.amount < 0 THEN t.amount ELSE 0 END)), 0) AS spent
    FROM budgets b
    JOIN  categories c ON b.category_id = c.id
    LEFT JOIN transactions t
      ON  t.category_id = b.category_id
      AND strftime('%m', t.date) = ?
      AND strftime('%Y', t.date) = ?
      AND t.account_id IN (SELECT id FROM accounts WHERE user_id = 1)
    WHERE b.user_id = 1 AND b.month = ? AND b.year = ?
    GROUP BY b.id
    ORDER BY c.name ASC
  `).all(month, year, Number(month), Number(year)) as any[];

  // ── Recent transactions ────────────────────────────────────────────────────
  const recentTransactions = db.prepare(`
    SELECT
      t.*,
      c.name  AS category_name,
      c.icon  AS category_icon,
      c.color AS category_color,
      a.name  AS account_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN accounts   a ON t.account_id  = a.id
    WHERE a.user_id = 1
    ORDER BY t.date DESC, t.id DESC
    LIMIT 10
  `).all() as any[];

  // ── Goals ─────────────────────────────────────────────────────────────────
  const goals = db.prepare('SELECT * FROM goals WHERE user_id = 1 ORDER BY created_at ASC').all();

  res.json({
    netWorth: { total: netWorth, assets, liabilities, change30d },
    monthlySpending: { total: totalSpending, byCategory: spending },
    budgets,
    recentTransactions,
    goals,
    accounts,
  });
});

export default router;
