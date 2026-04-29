import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY is_income ASC, name ASC').all();
  res.json(categories);
});

export default router;
