-- ─── 018: extend anon-read policies to authenticated role ───────────────────
-- The HQ dashboard wraps every page in <AuthGuard>, so the supabase-js
-- client attaches Louis's JWT and the request role becomes `authenticated`,
-- NOT `anon`. Migrations 011 and 013 scoped their dashboard-read policies
-- TO anon only:
--
--   011: anon_read_open_items                 (open_items,        TO anon, USING true)
--   013: build_action_log_anon_card_read      (build_action_log,  TO anon, USING entry_kind='card_snapshot')
--
-- Pre-Part-B these reads still worked via the legacy "Public read action
-- log" policy (PUBLIC, USING true) and a permissive default on open_items.
-- Migration 016 dropped "Public read action log" to enforce the
-- card_snapshot trust boundary, which silently broke authenticated reads
-- on both tables — Open Items panel renders empty, History sub-tab renders
-- "No history entries yet", ActionCards on Build Tracker would also be
-- broken on next reload (it survived only because the page was already
-- loaded before 016 was applied).
--
-- Fix: replace each anon-only policy with one TO anon, authenticated.
-- The trust boundary (only card_snapshot rows leave audit data) is
-- enforced by the USING predicate, not the role.
--
-- Idempotent. Safe to re-run.

BEGIN;

-- open_items: read all rows (governance items are dashboard-visible by design).
DROP POLICY IF EXISTS anon_read_open_items           ON public.open_items;
DROP POLICY IF EXISTS dashboard_read_open_items      ON public.open_items;
CREATE POLICY dashboard_read_open_items
  ON public.open_items FOR SELECT
  TO anon, authenticated
  USING (true);

-- build_action_log: read card_snapshot rows only — audit rows stay
-- service-role-only, accessible via get_recent_audit_log MCP tool.
DROP POLICY IF EXISTS build_action_log_anon_card_read       ON public.build_action_log;
DROP POLICY IF EXISTS build_action_log_dashboard_card_read  ON public.build_action_log;
CREATE POLICY build_action_log_dashboard_card_read
  ON public.build_action_log FOR SELECT
  TO anon, authenticated
  USING (entry_kind = 'card_snapshot');

COMMIT;
