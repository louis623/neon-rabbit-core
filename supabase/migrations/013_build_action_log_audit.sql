-- 013_build_action_log_audit.sql
-- Task 4 Part A — unify build_action_log into a single build-activity log:
-- every row is either a card_snapshot or an audit event, differentiated by
-- entry_kind. Codifies the dashboard-created canonical table, adds audit
-- columns + discriminator, enforces DB-level CHECKs, scopes RLS so audit
-- payloads are not anon-readable, and defines 4 atomic state+audit RPCs.
-- Transactional. Idempotent on rerun.

begin;

-- ─── 1. Canonical base table (codify dashboard-created debt) ────────────────
create table if not exists public.build_action_log (
  id          uuid primary key default gen_random_uuid(),
  project     text not null,
  position    text not null,
  title       text not null,
  description text,
  is_active   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── 2. Pre-flight: validate existing data BEFORE tightening NOT NULL ───────
-- Hard-fails with a clear message if any historical row violates the
-- NOT NULL invariants below. If triggered, inspect the dirty rows and
-- re-run after cleanup.
do $$
declare v_bad integer;
begin
  select count(*) into v_bad
    from public.build_action_log
   where project is null
      or position is null
      or title is null
      or is_active is null
      or created_at is null
      or updated_at is null;
  if v_bad > 0 then
    raise exception 'Migration 013 aborting: % build_action_log rows violate NOT NULL assumptions. Inspect and clean before retry.', v_bad;
  end if;
end $$;

-- Reconcile drift: dashboard-created table may have relaxed defaults.
alter table public.build_action_log alter column project     set not null;
alter table public.build_action_log alter column position    set not null;
alter table public.build_action_log alter column title       set not null;
alter table public.build_action_log alter column is_active   set not null;
alter table public.build_action_log alter column is_active   set default false;
alter table public.build_action_log alter column created_at  set not null;
alter table public.build_action_log alter column created_at  set default now();
alter table public.build_action_log alter column updated_at  set not null;
alter table public.build_action_log alter column updated_at  set default now();

-- ─── 3. Audit columns + discriminator (all additive, nullable for phased rollout) ─
alter table public.build_action_log
  add column if not exists entry_kind  text default 'card_snapshot',
  add column if not exists target_type text default 'action_card',
  add column if not exists target_key  text,
  add column if not exists actor       text,
  add column if not exists old_value   text,
  add column if not exists new_value   text,
  add column if not exists summary     text;

-- ─── 4. Backfill BEFORE RLS (ordering matters — see RLS block) ──────────────
-- All existing rows are action-card snapshots. Backfilling before the RLS
-- policy activates guarantees anon reads never observe a null entry_kind
-- that would silently vanish under the new SELECT predicate.
update public.build_action_log
   set entry_kind  = coalesce(entry_kind,  'card_snapshot'),
       target_type = coalesce(target_type, 'action_card');

-- ─── 5. DB-level enum enforcement ───────────────────────────────────────────
alter table public.build_action_log
  drop constraint if exists build_action_log_entry_kind_check;
alter table public.build_action_log
  add  constraint build_action_log_entry_kind_check
       check (entry_kind in ('card_snapshot','audit'));

alter table public.build_action_log
  drop constraint if exists build_action_log_target_type_check;
alter table public.build_action_log
  add  constraint build_action_log_target_type_check
       check (target_type in ('task','phase','gate','action_card'));

alter table public.build_action_log
  drop constraint if exists build_action_log_actor_check;
alter table public.build_action_log
  add  constraint build_action_log_actor_check
       check (actor is null or actor in ('chat','claude_code'));

-- Audit-kind rows must carry identifying fields.
alter table public.build_action_log
  drop constraint if exists build_action_log_audit_shape_check;
alter table public.build_action_log
  add  constraint build_action_log_audit_shape_check
       check (
         entry_kind = 'card_snapshot'
         or (target_type is not null
             and target_key is not null
             and actor       is not null
             and summary     is not null)
       );

-- ─── 6. Indexes ─────────────────────────────────────────────────────────────
create index if not exists idx_bal_project_kind_created
  on public.build_action_log (project, entry_kind, created_at desc);
create index if not exists idx_bal_target_lookup
  on public.build_action_log (target_type, target_key, created_at desc)
  where entry_kind = 'audit';

-- ─── 7. RLS — anon sees card snapshots only; audit rows service-role-only ──
-- NOTE: runs AFTER backfill (step 4). The predicate entry_kind='card_snapshot'
-- is safe to enforce once backfill has populated every historical row.
alter table public.build_action_log enable row level security;

drop policy if exists build_action_log_service_all on public.build_action_log;
create policy build_action_log_service_all
  on public.build_action_log for all
  to service_role using (true) with check (true);

drop policy if exists build_action_log_anon_card_read on public.build_action_log;
create policy build_action_log_anon_card_read
  on public.build_action_log for select
  to anon using (entry_kind = 'card_snapshot');

-- ─── 8. Atomic state+audit RPCs (SECURITY DEFINER, row-locked) ──────────────
-- All return jsonb. All validate actor and status up front with clear error
-- messages so SQL-direct callers don't get opaque CHECK-constraint violations.
-- Status pools probed against live CHECKs on 2026-04-17 and match these values.

create or replace function public.rpc_update_task_status(
  p_project            text,
  p_task_key           text,
  p_status             text,
  p_completion_session text        default null,
  p_completion_date    timestamptz default null,
  p_notes              text        default null,
  p_actor              text        default 'claude_code'
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r_old      public.construction_tasks%rowtype;
  r_new      public.construction_tasks%rowtype;
  v_new_comp timestamptz;
  v_audit_id uuid;
  v_changed  boolean;
  v_multi    boolean;
  v_old_val  text;
  v_new_val  text;
  v_summary  text;
begin
  if p_actor is null or p_actor not in ('chat','claude_code') then
    raise exception 'Invalid actor: expected ''chat'' or ''claude_code'', got: %', coalesce(p_actor, 'NULL');
  end if;
  if p_status not in ('not_started','in_progress','complete','blocked') then
    raise exception 'Invalid task status: expected one of not_started, in_progress, complete, blocked; got: %', coalesce(p_status, 'NULL');
  end if;

  select * into r_old
    from public.construction_tasks
   where project = p_project and task_key = p_task_key
   for update;
  if not found then
    raise exception 'Task not found: % (project=%)', p_task_key, p_project;
  end if;

  -- Preserve Task 3 Decision 9 EXACTLY:
  --   explicit completion_date  -> always wins.
  --   status='complete' with no explicit date -> auto-set to now(), regardless of prior value.
  --   status != 'complete' and no explicit date -> preserve existing (never null it).
  if p_completion_date is not null then
    v_new_comp := p_completion_date;
  elsif p_status = 'complete' then
    v_new_comp := now();
  else
    v_new_comp := r_old.completion_date;
  end if;

  v_changed := (r_old.status             is distinct from p_status)
            or (r_old.notes              is distinct from coalesce(p_notes,              r_old.notes))
            or (r_old.completion_session is distinct from coalesce(p_completion_session, r_old.completion_session))
            or (r_old.completion_date    is distinct from v_new_comp);

  if not v_changed then
    return jsonb_build_object('task', to_jsonb(r_old), 'audit_id', null, 'changed', false);
  end if;

  update public.construction_tasks
     set status             = p_status,
         notes              = coalesce(p_notes,              notes),
         completion_session = coalesce(p_completion_session, completion_session),
         completion_date    = v_new_comp,
         updated_at         = now()
   where id = r_old.id
   returning * into r_new;

  v_multi := (r_old.notes              is distinct from r_new.notes)
          or (r_old.completion_session is distinct from r_new.completion_session)
          or (r_old.completion_date    is distinct from r_new.completion_date);

  if v_multi then
    v_old_val := jsonb_build_object(
      'status', r_old.status, 'notes', r_old.notes,
      'completion_session', r_old.completion_session,
      'completion_date',    r_old.completion_date
    )::text;
    v_new_val := jsonb_build_object(
      'status', r_new.status, 'notes', r_new.notes,
      'completion_session', r_new.completion_session,
      'completion_date',    r_new.completion_date
    )::text;
  else
    v_old_val := r_old.status;
    v_new_val := r_new.status;
  end if;
  v_summary := format('Task %s: %s -> %s', p_task_key, r_old.status, r_new.status);

  insert into public.build_action_log (
    project, position, title, is_active,
    entry_kind, target_type, target_key, actor, old_value, new_value, summary
  ) values (
    p_project, p_task_key, v_summary, false,
    'audit', 'task', p_task_key, p_actor, v_old_val, v_new_val, v_summary
  )
  returning id into v_audit_id;

  return jsonb_build_object('task', to_jsonb(r_new), 'audit_id', v_audit_id, 'changed', true);
end;
$$;

-- ALWAYS recomputes total_tasks/completed_tasks (preserves drift-repair use).
-- updated_at bumps on every call. Audit row emitted ONLY when status actually changes.
create or replace function public.rpc_update_phase_status(
  p_project   text,
  p_phase_key text,
  p_status    text,
  p_actor     text default 'claude_code'
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r_old      public.construction_phases%rowtype;
  r_new      public.construction_phases%rowtype;
  v_total    integer;
  v_done     integer;
  v_audit_id uuid;
  v_changed  boolean;
  v_summary  text;
begin
  if p_actor is null or p_actor not in ('chat','claude_code') then
    raise exception 'Invalid actor: expected ''chat'' or ''claude_code'', got: %', coalesce(p_actor, 'NULL');
  end if;
  if p_status not in ('not_started','in_progress','testing','complete') then
    raise exception 'Invalid phase status: expected one of not_started, in_progress, testing, complete; got: %', coalesce(p_status, 'NULL');
  end if;

  select * into r_old
    from public.construction_phases
   where project = p_project and phase_key = p_phase_key
   for update;
  if not found then
    raise exception 'Phase not found: % (project=%)', p_phase_key, p_project;
  end if;

  select count(*) into v_total
    from public.construction_tasks where phase_id = r_old.id;
  select count(*) into v_done
    from public.construction_tasks where phase_id = r_old.id and status = 'complete';

  v_changed := r_old.status is distinct from p_status;

  update public.construction_phases
     set status          = p_status,
         total_tasks     = v_total,
         completed_tasks = v_done,
         updated_at      = now()
   where id = r_old.id
   returning * into r_new;

  if v_changed then
    v_summary := format('Phase %s: %s -> %s', p_phase_key, r_old.status, r_new.status);
    insert into public.build_action_log (
      project, position, title, is_active,
      entry_kind, target_type, target_key, actor, old_value, new_value, summary
    ) values (
      p_project, p_phase_key, v_summary, false,
      'audit', 'phase', p_phase_key, p_actor, r_old.status, r_new.status, v_summary
    )
    returning id into v_audit_id;
  end if;

  return jsonb_build_object('phase', to_jsonb(r_new), 'audit_id', v_audit_id, 'changed', v_changed);
end;
$$;

create or replace function public.rpc_update_gate_status(
  p_project  text,
  p_gate_key text,
  p_status   text,
  p_actor    text default 'claude_code'
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r_old      public.construction_gates%rowtype;
  r_new      public.construction_gates%rowtype;
  v_audit_id uuid;
  v_summary  text;
begin
  if p_actor is null or p_actor not in ('chat','claude_code') then
    raise exception 'Invalid actor: expected ''chat'' or ''claude_code'', got: %', coalesce(p_actor, 'NULL');
  end if;
  if p_status not in ('locked','testing','passed','failed') then
    raise exception 'Invalid gate status: expected one of locked, testing, passed, failed; got: %', coalesce(p_status, 'NULL');
  end if;

  select * into r_old
    from public.construction_gates
   where project = p_project and gate_key = p_gate_key
   for update;
  if not found then
    raise exception 'Gate not found: % (project=%)', p_gate_key, p_project;
  end if;

  if r_old.status = p_status then
    return jsonb_build_object('gate', to_jsonb(r_old), 'audit_id', null, 'changed', false);
  end if;

  update public.construction_gates
     set status = p_status, updated_at = now()
   where id = r_old.id
   returning * into r_new;

  v_summary := format('Gate %s: %s -> %s', p_gate_key, r_old.status, r_new.status);
  insert into public.build_action_log (
    project, position, title, is_active,
    entry_kind, target_type, target_key, actor, old_value, new_value, summary
  ) values (
    p_project, p_gate_key, v_summary, false,
    'audit', 'gate', p_gate_key, p_actor, r_old.status, r_new.status, v_summary
  )
  returning id into v_audit_id;

  return jsonb_build_object('gate', to_jsonb(r_new), 'audit_id', v_audit_id, 'changed', true);
end;
$$;

-- Action cards: archive active snapshots, insert 3 new snapshots, emit one
-- audit row per position whose title OR description changed.
create or replace function public.rpc_update_action_cards(
  p_project text,
  p_cards   jsonb,
  p_actor   text default 'claude_code'
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_map   jsonb := '{}'::jsonb;
  r_old       record;
  pos         text;
  v_card      jsonb;
  v_title     text;
  v_desc      text;
  v_old_card  jsonb;
  v_summary   text;
  v_audit_id  uuid;
  v_audit_ids uuid[] := array[]::uuid[];
  v_previous  jsonb;
  v_current   jsonb;
  v_next      jsonb;
  v_inserted  record;
begin
  if p_actor is null or p_actor not in ('chat','claude_code') then
    raise exception 'Invalid actor: expected ''chat'' or ''claude_code'', got: %', coalesce(p_actor, 'NULL');
  end if;

  -- Lock + snapshot currently-active card rows for this project.
  for r_old in
    select position, title, description
      from public.build_action_log
     where project = p_project
       and is_active = true
       and entry_kind = 'card_snapshot'
     for update
  loop
    v_old_map := v_old_map || jsonb_build_object(
      r_old.position,
      jsonb_build_object('title', r_old.title, 'description', r_old.description)
    );
  end loop;

  -- Archive — predicate includes null entry_kind rows so the coalesce
  -- genuinely self-heals any drift (operator error via direct SQL
  -- bypassing the column default). No-op for clean data.
  update public.build_action_log
     set is_active  = false,
         updated_at = now(),
         entry_kind = coalesce(entry_kind, 'card_snapshot')
   where project = p_project
     and is_active = true
     and (entry_kind = 'card_snapshot' or entry_kind is null);

  foreach pos in array array['previous','current','next'] loop
    v_card  := p_cards -> pos;
    if v_card is null then
      raise exception 'Missing card for position: %', pos;
    end if;
    v_title := v_card ->> 'title';
    v_desc  := v_card ->> 'description';
    if v_title is null or length(trim(v_title)) = 0 then
      raise exception 'Empty title for position: %', pos;
    end if;

    insert into public.build_action_log (
      project, position, title, description, is_active, entry_kind, target_type, target_key
    ) values (
      p_project, pos, v_title, v_desc, true, 'card_snapshot', 'action_card', pos
    )
    returning * into v_inserted;
    if pos = 'previous'     then v_previous := to_jsonb(v_inserted);
    elsif pos = 'current'   then v_current  := to_jsonb(v_inserted);
    else                         v_next     := to_jsonb(v_inserted);
    end if;

    v_old_card := v_old_map -> pos;
    if v_old_card is null
       or (v_old_card ->> 'title')       is distinct from v_title
       or (v_old_card ->> 'description') is distinct from v_desc
    then
      v_summary := format('Action card (%s): %s -> %s',
        pos,
        coalesce(v_old_card ->> 'title', 'NULL'),
        v_title);
      insert into public.build_action_log (
        project, position, title, is_active,
        entry_kind, target_type, target_key, actor, old_value, new_value, summary
      ) values (
        p_project, pos, v_summary, false,
        'audit', 'action_card', pos, p_actor,
        coalesce(v_old_card::text, 'null'),
        jsonb_build_object('title', v_title, 'description', v_desc)::text,
        v_summary
      )
      returning id into v_audit_id;
      v_audit_ids := array_append(v_audit_ids, v_audit_id);
    end if;
  end loop;

  return jsonb_build_object(
    'cards', jsonb_build_object('previous', v_previous, 'current', v_current, 'next', v_next),
    'audit_ids', to_jsonb(v_audit_ids)
  );
end;
$$;

-- Grants - service_role only.
revoke all on function public.rpc_update_task_status(text,text,text,text,timestamptz,text,text)    from public;
revoke all on function public.rpc_update_phase_status(text,text,text,text)                         from public;
revoke all on function public.rpc_update_gate_status(text,text,text,text)                          from public;
revoke all on function public.rpc_update_action_cards(text,jsonb,text)                             from public;
grant execute on function public.rpc_update_task_status(text,text,text,text,timestamptz,text,text) to service_role;
grant execute on function public.rpc_update_phase_status(text,text,text,text)                      to service_role;
grant execute on function public.rpc_update_gate_status(text,text,text,text)                       to service_role;
grant execute on function public.rpc_update_action_cards(text,jsonb,text)                          to service_role;

-- ─── 9. Follow-up tracking (precedent: migration 012, idempotent insert) ────
insert into public.open_items (project, title, category, status, priority, description)
select 'neon_rabbit',
       'Migration 014 — build_action_log audit columns SET NOT NULL',
       'task', 'open', 'medium',
       'After >=48h clean traffic on migration 013, verify no audit-kind rows have null target_type/target_key/actor/summary, then ALTER to SET NOT NULL on those columns and DROP DEFAULT on target_type. Earliest: 2026-04-19.'
where not exists (
  select 1 from public.open_items where title = 'Migration 014 — build_action_log audit columns SET NOT NULL'
);

commit;
