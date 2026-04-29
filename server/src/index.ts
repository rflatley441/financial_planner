import express from 'express';
import cors from 'cors';
import { initSchema } from './db.js';
import { seedData } from './seed.js';
import accountsRouter from './routes/accounts.js';
import transactionsRouter from './routes/transactions.js';
import categoriesRouter from './routes/categories.js';
import budgetsRouter from './routes/budgets.js';
import goalsRouter from './routes/goals.js';
import networthRouter from './routes/networth.js';
import dashboardRouter from './routes/dashboard.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

initSchema();
seedData();

app.use('/api/accounts',     accountsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/categories',   categoriesRouter);
app.use('/api/budgets',      budgetsRouter);
app.use('/api/goals',        goalsRouter);
app.use('/api/networth',     networthRouter);
app.use('/api/dashboard',    dashboardRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(Number(PORT), () => {
  console.log(`🚀 API server running at http://localhost:${PORT}`);
});
