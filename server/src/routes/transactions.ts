import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const { search, category_id, account_id, month, year } = req.query;

  let where = 'WHERE a.user_id = 1';
  const params: (string | number)[] = [];

  if (search) {
    where += ' AND (LOWER(t.merchant) LIKE LOWER(?) OR LOWER(COALESCE(t.notes,"")) LIKE LOWER(?))';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category_id) {
    where += ' AND t.category_id = ?';
    params.push(Number(category_id));
  }
  if (account_id) {
    where += ' AND t.account_id = ?';
    params.push(Number(account_id));
  }
  if (month && year) {
    where += " AND strftime('%m', t.date) = ? AND strftime('%Y', t.date) = ?";
    params.push(String(month).padStart(2, '0'), String(year));
  } else if (year) {
    where += " AND strftime('%Y', t.date) = ?";
    params.push(String(year));
  }

  const transactions = db.prepare(`
    SELECT
      t.*,
      c.name  AS category_name,
      c.icon  AS category_icon,
      c.color AS category_color,
      a.name  AS account_name,
      a.type  AS account_type,
      a.institution AS account_institution
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN accounts   a ON t.account_id  = a.id
    ${where}
    ORDER BY t.date DESC, t.id DESC
  `).all(...params);

  res.json(transactions);
});

router.get('/:id', (req, res) => {
  const txn = db.prepare(`
    SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
           a.name AS account_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN accounts   a ON t.account_id  = a.id
    WHERE t.id = ? AND a.user_id = 1
  `).get(req.params.id);
  if (!txn) return res.status(404).json({ error: 'Transaction not found' });
  res.json(txn);
});

router.post('/', (req, res) => {
  const { account_id, date, merchant, amount, category_id, notes } = req.body;
  const result = db.prepare(`
    INSERT INTO transactions (account_id, date, merchant, amount, category_id, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(account_id, date, merchant, amount, category_id ?? null, notes ?? '');
  const txn = db.prepare(`
    SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
           a.name AS account_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN accounts   a ON t.account_id  = a.id
    WHERE t.id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json(txn);
});

router.put('/:id', (req, res) => {
  const { account_id, date, merchant, amount, category_id, notes } = req.body;
  db.prepare(`
    UPDATE transactions
    SET account_id = ?, date = ?, merchant = ?, amount = ?, category_id = ?, notes = ?
    WHERE id = ?
  `).run(account_id, date, merchant, amount, category_id ?? null, notes ?? '', req.params.id);
  const txn = db.prepare(`
    SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
           a.name AS account_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN accounts   a ON t.account_id  = a.id
    WHERE t.id = ?
  `).get(req.params.id);
  res.json(txn);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

export default router;
