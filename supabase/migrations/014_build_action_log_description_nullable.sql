-- 014_build_action_log_description_nullable.sql
-- Audit-kind rows (entry_kind='audit') do not carry a separate description —
-- the audit payload lives in summary/old_value/new_value. Migration 013's
-- RPCs insert audit rows with description=null, but the live column was
-- NOT NULL (set via the dashboard at table creation). Relax to nullable;
-- card_snapshot rows continue to populate description when the caller
-- provides one, but audit rows do not need to.

begin;

alter table public.build_action_log alter column description drop not null;

-- Update the reserved follow-up open_item to reflect the new numbering
-- for the NOT-NULL enforcement work. Guarded on title so it's idempotent.
update public.open_items
   set title = 'Migration 015 — build_action_log audit columns SET NOT NULL',
       description = 'After >=48h clean traffic on migration 013, verify no audit-kind rows have null target_type/target_key/actor/summary, then ALTER to SET NOT NULL on those columns and DROP DEFAULT on target_type. Earliest: 2026-04-19.'
 where title = 'Migration 014 — build_action_log audit columns SET NOT NULL';

commit;
