-- 015_build_action_log_position_scope.sql
-- The live table had a dashboard-created CHECK constraint
-- `build_action_log_position_check` restricting `position` to the three
-- card-snapshot values ('previous','current','next'). Migration 013's
-- audit-row inserts use `position = target_key` (e.g. 'task_0_1'), which
-- violates that constraint. Rewrite the CHECK so it only applies to
-- card_snapshot rows; audit rows can use any non-null position value.

begin;

alter table public.build_action_log drop constraint if exists build_action_log_position_check;

alter table public.build_action_log
  add constraint build_action_log_position_check
  check (
    entry_kind <> 'card_snapshot'
    or position in ('previous','current','next')
  );

-- Bump the reserved NOT-NULL follow-up open_item to migration 016.
update public.open_items
   set title = 'Migration 016 — build_action_log audit columns SET NOT NULL',
       description = 'After >=48h clean traffic on migration 013, verify no audit-kind rows have null target_type/target_key/actor/summary, then ALTER to SET NOT NULL on those columns and DROP DEFAULT on target_type. Earliest: 2026-04-19.'
 where title in (
   'Migration 014 — build_action_log audit columns SET NOT NULL',
   'Migration 015 — build_action_log audit columns SET NOT NULL'
 );

commit;
