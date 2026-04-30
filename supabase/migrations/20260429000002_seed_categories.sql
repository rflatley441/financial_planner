-- ============================================================================
-- Finwise — Seed default system categories
-- Safe to re-run: ON CONFLICT DO NOTHING
-- ============================================================================

INSERT INTO public.categories (name, icon, color, is_income, is_system) VALUES
  ('Housing',        '🏠', '#6366F1', FALSE, TRUE),
  ('Utilities',      '⚡', '#EAB308', FALSE, TRUE),
  ('Groceries',      '🛒', '#10B981', FALSE, TRUE),
  ('Dining Out',     '🍽️', '#F59E0B', FALSE, TRUE),
  ('Transportation', '🚗', '#3B82F6', FALSE, TRUE),
  ('Entertainment',  '🎬', '#8B5CF6', FALSE, TRUE),
  ('Shopping',       '🛍️', '#EC4899', FALSE, TRUE),
  ('Healthcare',     '🏥', '#14B8A6', FALSE, TRUE),
  ('Travel',         '✈️', '#F97316', FALSE, TRUE),
  ('Subscriptions',  '📱', '#7C3AED', FALSE, TRUE),
  ('Personal Care',  '💅', '#F472B6', FALSE, TRUE),
  ('Education',      '📚', '#0EA5E9', FALSE, TRUE),
  ('Savings',        '🏦', '#059669', FALSE, TRUE),
  ('Income',         '💵', '#16A34A', TRUE,  TRUE),
  ('Transfer',       '🔄', '#94A3B8', FALSE, TRUE),
  ('Other',          '📦', '#78716C', FALSE, TRUE)
ON CONFLICT DO NOTHING;
