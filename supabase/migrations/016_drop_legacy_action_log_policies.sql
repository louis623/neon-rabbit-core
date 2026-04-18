-- 016_drop_legacy_action_log_policies.sql
-- Task 4 Part A follow-up — drop two dashboard-era RLS policies on
-- public.build_action_log that neutralized migration 013's trust boundary.
--
-- "Public read action log" (role=PUBLIC, SELECT, USING=true) let any role —
-- including anon — read every row, including audit-kind rows. That defeated
-- the `build_action_log_anon_card_read` policy added in migration 013, which
-- restricts anon SELECTs to entry_kind='card_snapshot'.
--
-- "Admin write action log" (role=PUBLIC, ALL, USING=auth.jwt()->>'email' =
-- 'louis@neonrabbit.net') is redundant with `build_action_log_service_all`
-- and anyway granted PUBLIC, which is never what we want for writes.
--
-- After this migration the table has exactly two policies:
--   build_action_log_service_all     (service_role, ALL, USING=true)
--   build_action_log_anon_card_read  (anon, SELECT, USING=entry_kind='card_snapshot')
--
-- Transactional. Idempotent.

begin;

drop policy if exists "Public read action log" on public.build_action_log;
drop policy if exists "Admin write action log" on public.build_action_log;

commit;
