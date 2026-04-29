import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// GET /api/budgets?month=4&year=2026
router.get('/', (req, res) => {
  const { month = 4, year = 2026 } = req.query;

  const budgets = db.prepare(`
    SELECT
      b.*,
      c.name  AS category_name,
      c.icon  AS category_icon,
      c.color AS category_color,
      COALESCE(ABS(SUM(CASE WHEN t.amount < 0 THEN t.amount ELSE 0 END)), 0) AS spent
    FROM budgets b
    JOIN categories c ON b.category_id = c.id
    LEFT JOIN transactions t
      ON  t.category_id = b.category_id
      AND strftime('%m', t.date) = ?
      AND strftime('%Y', t.date) = ?
      AND t.account_id IN (SELECT id FROM accounts WHERE user_id = 1)
    WHERE b.user_id = 1 AND b.month = ? AND b.year = ?
    GROUP BY b.id
    ORDER BY c.name ASC
  `).all(
    String(month).padStart(2, '0'), String(year),
    Number(month), Number(year)
  );

  res.json(budgets);
});

router.post('/', (req, res) => {
  const { category_id, month, year, amount } = req.body;
  db.prepare(`
    INSERT OR REPLACE INTO budgets (user_id, category_id, month, year, amount)
    VALUES (1, ?, ?, ?, ?)
  `).run(category_id, month, year, amount);
  res.status(201).json({ category_id, month, year, amount });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM budgets WHERE id = ? AND user_id = 1').run(req.params.id);
  res.status(204).send();
});

export default router;
