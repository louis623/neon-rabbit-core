-- ─── 019: dashboard read access on public.thoughts ─────────────────────────
-- Operations > History > OpenBrainLog reads `thoughts` (1007 rows, populated
-- by the Anthropic skills `capture_thought` MCP) — the live replacement for
-- the dead `open_brain` table (0 rows). RLS currently denies both anon and
-- authenticated, so OpenBrainLog renders empty.
--
-- thoughts has no user_id column — single-tenant by design (Louis is the
-- only user; rows are global memory). USING (true) is the right shape.
--
-- Mirrors the dashboard_read_open_items / build_action_log_dashboard_card_read
-- pattern from migration 018 — TO anon, authenticated.
--
-- Idempotent.

BEGIN;

-- Ensure RLS is enabled (no-op if already on).
ALTER TABLE public.thoughts ENABLE ROW LEVEL SECURITY;

-- Replace any prior dashboard read policy (idempotent re-run).
DROP POLICY IF EXISTS dashboard_read_thoughts ON public.thoughts;
CREATE POLICY dashboard_read_thoughts
  ON public.thoughts FOR SELECT
  TO anon, authenticated
  USING (true);

COMMIT;
