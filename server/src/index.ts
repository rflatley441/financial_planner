import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.join(__dirname, '..');
const repoRoot = path.join(serverDir, '..');
const clientDir = path.join(repoRoot, 'client');

// `npm run dev --prefix server` leaves cwd at repo root — load env from usual locations.
// Later files override earlier keys so server/.env wins.
dotenv.config({ path: path.join(repoRoot, '.env.local') });
dotenv.config({ path: path.join(repoRoot, '.env') });
dotenv.config({ path: path.join(clientDir, '.env.local') });
dotenv.config({ path: path.join(clientDir, '.env') });
dotenv.config({ path: path.join(serverDir, '.env') });
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
import plaidRouter from './routes/plaid.js';
import { isPlaidConfigured } from './plaid/client.js';
import { isSupabaseServiceConfigured } from './lib/supabaseAdmin.js';

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
app.use('/api/plaid',        plaidRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(Number(PORT), () => {
  console.log(`🚀 API server running at http://localhost:${PORT}`);
  const supabaseOk = isSupabaseServiceConfigured();
  const plaidOk = isPlaidConfigured();
  console.log(
    `[finwise] Plaid: ${plaidOk ? 'configured' : 'missing PLAID_*'} · Supabase JWT (service role): ${supabaseOk ? 'configured' : 'missing URL or SUPABASE_SERVICE_ROLE_KEY'}`,
  );
  if (!supabaseOk || !plaidOk) {
    console.log('[finwise] Bank linking needs both; see server/.env.example');
  }
});
