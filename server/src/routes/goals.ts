import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  const goals = db.prepare('SELECT * FROM goals WHERE user_id = 1 ORDER BY created_at ASC').all();
  res.json(goals);
});

router.post('/', (req, res) => {
  const { name, type, target_amount, current_amount, target_date, account_id, color, notes } = req.body;
  const result = db.prepare(`
    INSERT INTO goals (user_id, name, type, target_amount, current_amount, target_date, account_id, color, notes)
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, type ?? 'savings', target_amount, current_amount ?? 0, target_date ?? null, account_id ?? null, color ?? '#4F46E5', notes ?? '');
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(goal);
});

router.put('/:id', (req, res) => {
  const { name, type, target_amount, current_amount, target_date, account_id, color, notes } = req.body;
  db.prepare(`
    UPDATE goals
    SET name = ?, type = ?, target_amount = ?, current_amount = ?,
        target_date = ?, account_id = ?, color = ?, notes = ?
    WHERE id = ? AND user_id = 1
  `).run(name, type, target_amount, current_amount, target_date ?? null, account_id ?? null, color, notes ?? '', req.params.id);
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.id);
  res.json(goal);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM goals WHERE id = ? AND user_id = 1').run(req.params.id);
  res.status(204).send();
});

export default router;
