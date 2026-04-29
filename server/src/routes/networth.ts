import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  const snapshots = db.prepare(`
    SELECT * FROM net_worth_snapshots
    WHERE user_id = 1
    ORDER BY date ASC
  `).all();
  res.json(snapshots);
});

export default router;
