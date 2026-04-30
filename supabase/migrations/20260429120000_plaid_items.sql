-- ============================================================================
-- Plaid: store Item access tokens server-side only (service_role).
-- RLS enabled with no policies → authenticated cannot read/write via PostgREST.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.plaid_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id           TEXT        NOT NULL,
  access_token      TEXT        NOT NULL,
  institution_name  TEXT        NOT NULL DEFAULT '',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (item_id)
);

CREATE INDEX IF NOT EXISTS idx_plaid_items_user_id ON public.plaid_items(user_id);

CREATE TRIGGER trg_plaid_items_updated_at
  BEFORE UPDATE ON public.plaid_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.plaid_items ENABLE ROW LEVEL SECURITY;

-- Prevent accidental exposure via Data API for anon/authenticated.
REVOKE ALL ON public.plaid_items FROM PUBLIC;
REVOKE ALL ON public.plaid_items FROM anon;
REVOKE ALL ON public.plaid_items FROM authenticated;
GRANT ALL ON public.plaid_items TO service_role;

-- At most one local account row per Plaid account per user.
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_user_plaid_account
  ON public.accounts (user_id, plaid_account_id)
  WHERE plaid_account_id IS NOT NULL;
