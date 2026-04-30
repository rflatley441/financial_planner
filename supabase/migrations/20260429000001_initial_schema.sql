-- ============================================================================
-- Finwise — Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================================

-- ── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Enum types ────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.account_type AS ENUM (
    'checking', 'savings', 'credit_card', 'brokerage', 'retirement', 'loan', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.goal_type AS ENUM (
    'emergency_fund', 'vacation', 'down_payment', 'debt_payoff', 'investment', 'savings', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Profiles ──────────────────────────────────────────────────────────────────
-- One row per auth.users entry, created automatically by trigger below.
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL DEFAULT '',
  email      TEXT        NOT NULL DEFAULT '',
  currency   TEXT        NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create a profile row whenever a new user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Categories ────────────────────────────────────────────────────────────────
-- is_system = TRUE  → seeded defaults, readable by every authenticated user
-- is_system = FALSE → user-created custom categories (user_id required)
CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL for system rows
  name       TEXT        NOT NULL,
  icon       TEXT        NOT NULL DEFAULT '📦',
  color      TEXT        NOT NULL DEFAULT '#94A3B8',
  is_income  BOOLEAN     NOT NULL DEFAULT FALSE,
  is_system  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id  ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_system   ON public.categories(is_system) WHERE is_system = TRUE;

-- ── Accounts ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.accounts (
  id               UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID              NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT              NOT NULL,
  institution      TEXT              NOT NULL DEFAULT '',
  type             public.account_type NOT NULL DEFAULT 'checking',
  balance          NUMERIC(14,2)     NOT NULL DEFAULT 0,
  is_liability     BOOLEAN           NOT NULL DEFAULT FALSE,
  currency         TEXT              NOT NULL DEFAULT 'USD',
  color            TEXT              NOT NULL DEFAULT '#4F46E5',
  last_synced      TIMESTAMPTZ,
  -- Future Plaid integration: store item/account IDs for sync
  -- TODO: populate via Plaid /accounts/get after exchangePublicToken()
  plaid_item_id    TEXT,
  plaid_account_id TEXT,
  created_at       TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ       NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);

-- ── Transactions ──────────────────────────────────────────────────────────────
-- amount: negative = expense, positive = income/credit
CREATE TABLE IF NOT EXISTS public.transactions (
  id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id           UUID          NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id              UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date                 DATE          NOT NULL,
  merchant             TEXT          NOT NULL,
  amount               NUMERIC(14,2) NOT NULL,
  category_id          UUID          REFERENCES public.categories(id) ON DELETE SET NULL,
  notes                TEXT          NOT NULL DEFAULT '',
  is_pending           BOOLEAN       NOT NULL DEFAULT FALSE,
  -- Future Plaid integration: unique ID prevents duplicate imports
  -- TODO: populate via Plaid /transactions/sync
  plaid_transaction_id TEXT          UNIQUE,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id    ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date       ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category   ON public.transactions(category_id);

-- ── Budgets ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.budgets (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID          NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  month       SMALLINT      NOT NULL CHECK (month BETWEEN 1 AND 12),
  year        SMALLINT      NOT NULL CHECK (year >= 2000),
  amount      NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (user_id, category_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_period ON public.budgets(user_id, year, month);

-- ── Goals ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.goals (
  id             UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID              NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT              NOT NULL,
  type           public.goal_type  NOT NULL DEFAULT 'savings',
  target_amount  NUMERIC(14,2)     NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(14,2)     NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  target_date    DATE,
  account_id     UUID              REFERENCES public.accounts(id) ON DELETE SET NULL,
  color          TEXT              NOT NULL DEFAULT '#4F46E5',
  notes          TEXT              NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ       NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);

-- ── Net Worth Snapshots ───────────────────────────────────────────────────────
-- Periodic snapshots; net_worth is computed automatically.
CREATE TABLE IF NOT EXISTS public.net_worth_snapshots (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        DATE          NOT NULL,
  assets      NUMERIC(14,2) NOT NULL,
  liabilities NUMERIC(14,2) NOT NULL,
  net_worth   NUMERIC(14,2) NOT NULL GENERATED ALWAYS AS (assets - liabilities) STORED,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_nw_user_date ON public.net_worth_snapshots(user_id, date);

-- ── updated_at trigger ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.net_worth_snapshots ENABLE ROW LEVEL SECURITY;

-- Profiles ─────────────────────────────────────────────────────────────────
CREATE POLICY "profiles: own row"
  ON public.profiles FOR ALL TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Categories ───────────────────────────────────────────────────────────────
-- All authenticated users can read system categories.
CREATE POLICY "categories: read system categories"
  ON public.categories FOR SELECT TO authenticated
  USING (is_system = TRUE);

-- Users can fully manage their own custom categories.
CREATE POLICY "categories: manage own custom"
  ON public.categories FOR ALL TO authenticated
  USING (is_system = FALSE AND user_id = auth.uid())
  WITH CHECK (is_system = FALSE AND user_id = auth.uid());

-- Accounts ─────────────────────────────────────────────────────────────────
CREATE POLICY "accounts: own rows"
  ON public.accounts FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Transactions ─────────────────────────────────────────────────────────────
CREATE POLICY "transactions: own rows"
  ON public.transactions FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Budgets ──────────────────────────────────────────────────────────────────
CREATE POLICY "budgets: own rows"
  ON public.budgets FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Goals ────────────────────────────────────────────────────────────────────
CREATE POLICY "goals: own rows"
  ON public.goals FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Net Worth Snapshots ──────────────────────────────────────────────────────
CREATE POLICY "net_worth_snapshots: own rows"
  ON public.net_worth_snapshots FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
