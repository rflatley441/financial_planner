import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  const accounts = db.prepare(`
    SELECT * FROM accounts WHERE user_id = 1
    ORDER BY is_liability ASC, balance DESC
  `).all();
  res.json(accounts);
});

router.get('/:id', (req, res) => {
  const account = db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = 1').get(req.params.id);
  if (!account) return res.status(404).json({ error: 'Account not found' });
  res.json(account);
});

router.post('/', (req, res) => {
  const { name, institution, type, balance, is_liability, color } = req.body;
  const result = db.prepare(`
    INSERT INTO accounts (user_id, name, institution, type, balance, is_liability, color)
    VALUES (1, ?, ?, ?, ?, ?, ?)
  `).run(name, institution ?? '', type, balance ?? 0, is_liability ? 1 : 0, color ?? '#4F46E5');
  const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(account);
});

router.put('/:id', (req, res) => {
  const { name, institution, type, balance, is_liability, color } = req.body;
  db.prepare(`
    UPDATE accounts
    SET name = ?, institution = ?, type = ?, balance = ?, is_liability = ?, color = ?,
        last_synced = datetime('now')
    WHERE id = ? AND user_id = 1
  `).run(name, institution, type, balance, is_liability ? 1 : 0, color, req.params.id);
  const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
  res.json(account);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM accounts WHERE id = ? AND user_id = 1').run(req.params.id);
  res.status(204).send();
});

export default router;
