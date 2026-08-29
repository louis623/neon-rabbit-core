-- Transparent operator support access.
--
-- The operator remains the actor and the rep remains the subject. These
-- records never create a rep login, store a credential, or grant direct table
-- access to anon/authenticated clients. State changes are available only
-- through the narrow service-role RPCs below.

create or replace function public.operator_support_capabilities_are_valid(value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(value) = 'array'
    and jsonb_array_length(value) between 1 and 14
    and (
      select count(*) = count(distinct capability)
      from jsonb_array_elements_text(value) as capabilities(capability)
    )
    and not exists (
      select 1
      from jsonb_array_elements_text(value) as capabilities(capability)
      where capability not in (
        'workspace.view',
        'site.view',
        'site.manage',
        'inventory.view',
        'inventory.manage',
        'calendar.view',
        'calendar.manage',
        'customers.view',
        'customers.manage',
        'team.view',
        'team.manage',
        'messages.view',
        'nic_nac.use',
        'live_queue.view'
      )
    );
$$;

create table if not exists public.operator_support_sessions (
  id uuid primary key default gen_random_uuid(),
  operator_rep_id uuid not null references public.reps(id) on delete restrict,
  operator_email_snapshot text not null,
  operator_display_name_snapshot text not null,
  target_rep_id uuid not null references public.reps(id) on delete restrict,
  target_name_snapshot text not null,
  target_business_snapshot text not null,
  reason_code text not null,
  reason_note text,
  support_report_id uuid references public.support_reports(id) on delete set null,
  status text not null default 'pending_notice',
  capabilities jsonb not null,
  csrf_token_hash text not null,
  request_id text not null,
  started_at timestamptz,
  last_activity_at timestamptz,
  expires_at timestamptz not null,
  extended_at timestamptz,
  ended_at timestamptz,
  ended_reason text,
  completion_summary text,
  start_publication_id uuid references public.workspace_message_publications(id) on delete restrict,
  end_publication_id uuid references public.workspace_message_publications(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint operator_support_sessions_actor_subject_check
    check (operator_rep_id <> target_rep_id),
  constraint operator_support_sessions_operator_email_check
    check (btrim(operator_email_snapshot) <> '' and char_length(operator_email_snapshot) <= 320),
  constraint operator_support_sessions_operator_name_check
    check (btrim(operator_display_name_snapshot) <> '' and char_length(operator_display_name_snapshot) <= 160),
  constraint operator_support_sessions_target_name_check
    check (btrim(target_name_snapshot) <> '' and char_length(target_name_snapshot) <= 160),
  constraint operator_support_sessions_target_business_check
    check (btrim(target_business_snapshot) <> '' and char_length(target_business_snapshot) <= 200),
  constraint operator_support_sessions_reason_code_check
    check (reason_code in ('account_setup', 'troubleshooting', 'support_request', 'content_update', 'other')),
  constraint operator_support_sessions_reason_note_check
    check (reason_note is null or (btrim(reason_note) <> '' and char_length(reason_note) <= 500)),
  constraint operator_support_sessions_status_check
    check (status in ('pending_notice', 'active', 'ended', 'expired', 'revoked', 'failed')),
  constraint operator_support_sessions_capabilities_check
    check (public.operator_support_capabilities_are_valid(capabilities)),
  constraint operator_support_sessions_csrf_hash_check
    check (csrf_token_hash ~ '^[a-f0-9]{64}$'),
  constraint operator_support_sessions_request_id_check
    check (btrim(request_id) <> '' and char_length(request_id) <= 200),
  constraint operator_support_sessions_expiry_check
    check (expires_at > created_at and expires_at <= created_at + interval '1 hour'),
  constraint operator_support_sessions_reason_end_check
    check (ended_reason is null or ended_reason in (
      'operator', 'expired', 'revoked', 'control_center_logout',
      'target_ineligible', 'failure'
    )),
  constraint operator_support_sessions_completion_summary_check
    check (completion_summary is null or char_length(completion_summary) <= 1000),
  constraint operator_support_sessions_state_timestamps_check check (
    (status = 'pending_notice' and started_at is null and ended_at is null and start_publication_id is null)
    or
    (status = 'active' and started_at is not null and ended_at is null and start_publication_id is not null)
    or
    (status in ('ended', 'expired', 'revoked', 'failed') and ended_at is not null)
  ),
  constraint operator_support_sessions_start_evidence_check
    check ((started_at is null) = (start_publication_id is null)),
  constraint operator_support_sessions_end_state_check
    check ((ended_at is null) = (ended_reason is null)),
  constraint operator_support_sessions_publication_order_check
    check (end_publication_id is null or ended_at is not null),
  constraint operator_support_sessions_operator_request_unique
    unique (operator_rep_id, request_id)
);

create unique index if not exists operator_support_sessions_one_open_per_operator_idx
  on public.operator_support_sessions (operator_rep_id)
  where status in ('pending_notice', 'active');

create unique index if not exists operator_support_sessions_one_open_per_target_idx
  on public.operator_support_sessions (target_rep_id)
  where status in ('pending_notice', 'active');

create index if not exists operator_support_sessions_operator_history_idx
  on public.operator_support_sessions (operator_rep_id, created_at desc, id desc);

create index if not exists operator_support_sessions_target_history_idx
  on public.operator_support_sessions (target_rep_id, created_at desc, id desc);

create index if not exists operator_support_sessions_expiry_idx
  on public.operator_support_sessions (expires_at)
  where status in ('pending_notice', 'active');

create index if not exists operator_support_sessions_support_report_idx
  on public.operator_support_sessions (support_report_id)
  where support_report_id is not null;

create table if not exists public.operator_support_audit_events (
  id uuid primary key default gen_random_uuid(),
  support_session_id uuid not null references public.operator_support_sessions(id) on delete restrict,
  operator_rep_id uuid not null references public.reps(id) on delete restrict,
  target_rep_id uuid not null references public.reps(id) on delete restrict,
  event_type text not null,
  workspace_area text not null,
  capability text,
  resource_type text,
  resource_id text,
  action_name text,
  result text not null,
  safe_diff jsonb not null default '{}'::jsonb,
  error_code text,
  idempotency_key text,
  request_id text,
  created_at timestamptz not null default now(),
  constraint operator_support_audit_events_event_type_check
    check (event_type in (
      'session_requested', 'rep_notice_published', 'session_started',
      'workspace_area_viewed', 'public_site_opened', 'mutation_attempted',
      'mutation_succeeded', 'mutation_failed', 'blocked_action_attempted',
      'session_extended', 'session_end_requested', 'session_ended',
      'session_expired', 'session_revoked', 'completion_notice_published'
    )),
  constraint operator_support_audit_events_workspace_area_check
    check (workspace_area in (
      'session', 'workspace', 'site', 'inventory', 'calendar', 'customers',
      'team', 'messages', 'nic_nac', 'live_queue', 'billing', 'authentication',
      'security', 'communications', 'exports', 'system'
    )),
  constraint operator_support_audit_events_capability_check
    check (capability is null or capability in (
      'workspace.view', 'site.view', 'site.manage', 'inventory.view',
      'inventory.manage', 'calendar.view', 'calendar.manage', 'customers.view',
      'customers.manage', 'team.view', 'team.manage', 'messages.view',
      'nic_nac.use', 'live_queue.view'
    )),
  constraint operator_support_audit_events_result_check
    check (result in ('attempted', 'succeeded', 'failed', 'denied')),
  constraint operator_support_audit_events_safe_diff_check
    check (jsonb_typeof(safe_diff) = 'object' and pg_column_size(safe_diff) <= 16384),
  constraint operator_support_audit_events_resource_type_check
    check (resource_type is null or (btrim(resource_type) <> '' and char_length(resource_type) <= 100)),
  constraint operator_support_audit_events_resource_id_check
    check (resource_id is null or char_length(resource_id) <= 200),
  constraint operator_support_audit_events_action_name_check
    check (action_name is null or (btrim(action_name) <> '' and char_length(action_name) <= 160)),
  constraint operator_support_audit_events_error_code_check
    check (error_code is null or error_code ~ '^[A-Z0-9_]{2,100}$'),
  constraint operator_support_audit_events_idempotency_key_check
    check (idempotency_key is null or (btrim(idempotency_key) <> '' and char_length(idempotency_key) <= 200)),
  constraint operator_support_audit_events_request_id_check
    check (request_id is null or (btrim(request_id) <> '' and char_length(request_id) <= 200))
);

create index if not exists operator_support_audit_events_session_recent_idx
  on public.operator_support_audit_events (support_session_id, created_at desc, id desc);

create index if not exists operator_support_audit_events_operator_recent_idx
  on public.operator_support_audit_events (operator_rep_id, created_at desc, id desc);

create index if not exists operator_support_audit_events_target_recent_idx
  on public.operator_support_audit_events (target_rep_id, created_at desc, id desc);

create index if not exists operator_support_audit_events_request_idx
  on public.operator_support_audit_events (request_id)
  where request_id is not null;

create unique index if not exists operator_support_audit_events_idempotency_idx
  on public.operator_support_audit_events (support_session_id, event_type, idempotency_key)
  where idempotency_key is not null;

alter table public.operator_support_sessions enable row level security;
alter table public.operator_support_sessions force row level security;
alter table public.operator_support_audit_events enable row level security;
alter table public.operator_support_audit_events force row level security;

revoke all on table public.operator_support_sessions from anon, authenticated;
revoke all on table public.operator_support_audit_events from anon, authenticated;
revoke insert, update, delete on table public.operator_support_sessions from service_role;
revoke insert, update, delete on table public.operator_support_audit_events from service_role;
grant select on table public.operator_support_sessions to service_role;
grant select on table public.operator_support_audit_events to service_role;

create or replace function public.reject_operator_support_audit_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'operator support audit events are append-only' using errcode = '42501';
end;
$$;

drop trigger if exists operator_support_audit_events_immutable
  on public.operator_support_audit_events;
create trigger operator_support_audit_events_immutable
before update or delete on public.operator_support_audit_events
for each row execute function public.reject_operator_support_audit_mutation();

create or replace function public.guard_operator_support_session_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'operator support sessions cannot be deleted' using errcode = '42501';
  end if;
  if coalesce(current_setting('app.operator_support_transition', true), '') <> 'allowed' then
    raise exception 'operator support sessions require a guarded transition' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists operator_support_sessions_guarded_mutations
  on public.operator_support_sessions;
create trigger operator_support_sessions_guarded_mutations
before update or delete on public.operator_support_sessions
for each row execute function public.guard_operator_support_session_mutation();

create or replace function public.operator_support_assert_service_role()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'operator support RPC requires service role' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.operator_support_publication_targets_rep(
  publication_id uuid,
  target_rep_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_message_publications publication
    where publication.id = publication_id
      and publication.sender_key = 'support_access_notifier'
      and publication.category = 'account_activity'
      and publication.status = 'published'
      and publication.audience_count = 1
      and (
        select count(*)
        from public.workspace_message_deliveries delivery
        where delivery.publication_id = publication.id
      ) = 1
      and exists (
        select 1
        from public.workspace_message_deliveries delivery
        where delivery.publication_id = publication.id
          and delivery.rep_id = target_rep_id
      )
  );
$$;

create or replace function public.request_operator_support_session(
  p_session_id uuid,
  p_operator_rep_id uuid,
  p_operator_email_snapshot text,
  p_operator_display_name_snapshot text,
  p_target_rep_id uuid,
  p_target_name_snapshot text,
  p_target_business_snapshot text,
  p_reason_code text,
  p_reason_note text,
  p_support_report_id uuid,
  p_capabilities jsonb,
  p_csrf_token_hash text,
  p_expires_at timestamptz,
  p_request_id text
)
returns public.operator_support_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.operator_support_sessions%rowtype;
begin
  perform public.operator_support_assert_service_role();

  insert into public.operator_support_sessions (
    id, operator_rep_id, operator_email_snapshot,
    operator_display_name_snapshot, target_rep_id, target_name_snapshot,
    target_business_snapshot, reason_code, reason_note, support_report_id,
    capabilities, csrf_token_hash, expires_at, request_id
  ) values (
    p_session_id, p_operator_rep_id, lower(btrim(p_operator_email_snapshot)),
    btrim(p_operator_display_name_snapshot), p_target_rep_id, btrim(p_target_name_snapshot),
    btrim(p_target_business_snapshot), p_reason_code, nullif(btrim(p_reason_note), ''),
    p_support_report_id, p_capabilities, p_csrf_token_hash, p_expires_at, btrim(p_request_id)
  )
  on conflict (operator_rep_id, request_id) do nothing
  returning * into v_session;

  if v_session.id is null then
    select * into v_session
    from public.operator_support_sessions session_row
    where session_row.operator_rep_id = p_operator_rep_id
      and session_row.request_id = btrim(p_request_id);

    if v_session.target_rep_id <> p_target_rep_id
      or v_session.operator_email_snapshot <> lower(btrim(p_operator_email_snapshot))
      or v_session.operator_display_name_snapshot <> btrim(p_operator_display_name_snapshot)
      or v_session.target_name_snapshot <> btrim(p_target_name_snapshot)
      or v_session.target_business_snapshot <> btrim(p_target_business_snapshot)
      or v_session.reason_code <> p_reason_code
      or v_session.reason_note is distinct from nullif(btrim(p_reason_note), '')
      or v_session.support_report_id is distinct from p_support_report_id
      or v_session.capabilities <> p_capabilities
      or v_session.csrf_token_hash <> p_csrf_token_hash
      or v_session.id <> p_session_id
    then
      raise exception 'operator support idempotency key was reused with different input'
        using errcode = '22023';
    end if;
    return v_session;
  end if;

  insert into public.operator_support_audit_events (
    support_session_id, operator_rep_id, target_rep_id, event_type,
    workspace_area, result, idempotency_key, request_id
  ) values (
    v_session.id, v_session.operator_rep_id, v_session.target_rep_id,
    'session_requested', 'session', 'succeeded',
    'request:' || v_session.request_id, v_session.request_id
  );

  return v_session;
end;
$$;

create or replace function public.activate_operator_support_session(
  p_session_id uuid,
  p_operator_rep_id uuid,
  p_start_publication_id uuid,
  p_request_id text
)
returns public.operator_support_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.operator_support_sessions%rowtype;
  v_now timestamptz := now();
begin
  perform public.operator_support_assert_service_role();
  select * into v_session from public.operator_support_sessions
    where id = p_session_id for update;
  if v_session.id is null then raise exception 'operator support session not found' using errcode = 'P0002'; end if;
  if v_session.operator_rep_id <> p_operator_rep_id then raise exception 'operator mismatch' using errcode = '42501'; end if;
  if v_session.status = 'active' and v_session.start_publication_id = p_start_publication_id then return v_session; end if;
  if v_session.status <> 'pending_notice' then raise exception 'session is not pending activation' using errcode = '55000'; end if;
  if v_session.expires_at <= v_now then raise exception 'session expired before activation' using errcode = '55000'; end if;
  if not public.operator_support_publication_targets_rep(p_start_publication_id, v_session.target_rep_id) then
    raise exception 'start publication does not prove one exact target delivery' using errcode = '23514';
  end if;

  perform set_config('app.operator_support_transition', 'allowed', true);
  update public.operator_support_sessions set
    status = 'active', started_at = v_now, last_activity_at = v_now,
    start_publication_id = p_start_publication_id, updated_at = v_now
  where id = v_session.id returning * into v_session;

  insert into public.operator_support_audit_events (
    support_session_id, operator_rep_id, target_rep_id, event_type,
    workspace_area, resource_type, resource_id, result, idempotency_key, request_id
  ) values
    (v_session.id, v_session.operator_rep_id, v_session.target_rep_id,
      'rep_notice_published', 'messages', 'workspace_message_publication',
      p_start_publication_id::text, 'succeeded', 'start-notice:' || p_start_publication_id::text, p_request_id),
    (v_session.id, v_session.operator_rep_id, v_session.target_rep_id,
      'session_started', 'session', 'operator_support_session',
      v_session.id::text, 'succeeded', 'activate:' || p_start_publication_id::text, p_request_id)
  on conflict (support_session_id, event_type, idempotency_key) where idempotency_key is not null do nothing;

  return v_session;
end;
$$;

create or replace function public.extend_operator_support_session(
  p_session_id uuid,
  p_operator_rep_id uuid,
  p_new_expires_at timestamptz,
  p_request_id text
)
returns public.operator_support_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.operator_support_sessions%rowtype;
  v_now timestamptz := now();
begin
  perform public.operator_support_assert_service_role();
  select * into v_session from public.operator_support_sessions where id = p_session_id for update;
  if v_session.id is null then raise exception 'operator support session not found' using errcode = 'P0002'; end if;
  if v_session.operator_rep_id <> p_operator_rep_id then raise exception 'operator mismatch' using errcode = '42501'; end if;
  if v_session.status <> 'active' or v_session.expires_at <= v_now then raise exception 'only a current active session can be extended' using errcode = '55000'; end if;
  if v_session.expires_at = p_new_expires_at and exists (
    select 1 from public.operator_support_audit_events event_row
    where event_row.support_session_id = v_session.id
      and event_row.event_type = 'session_extended'
      and event_row.idempotency_key = 'extend:' || btrim(p_request_id)
  ) then
    return v_session;
  end if;
  if p_new_expires_at <= v_session.expires_at or p_new_expires_at > v_session.created_at + interval '1 hour' then
    raise exception 'extension is outside the allowed session window' using errcode = '22023';
  end if;

  perform set_config('app.operator_support_transition', 'allowed', true);
  update public.operator_support_sessions set
    expires_at = p_new_expires_at, extended_at = v_now, updated_at = v_now
  where id = v_session.id returning * into v_session;

  insert into public.operator_support_audit_events (
    support_session_id, operator_rep_id, target_rep_id, event_type,
    workspace_area, result, safe_diff, idempotency_key, request_id
  ) values (
    v_session.id, v_session.operator_rep_id, v_session.target_rep_id,
    'session_extended', 'session', 'succeeded',
    jsonb_build_object('changedFields', jsonb_build_array('expiresAt')),
    'extend:' || btrim(p_request_id), p_request_id
  ) on conflict (support_session_id, event_type, idempotency_key)
    where idempotency_key is not null do nothing;

  return v_session;
end;
$$;

create or replace function public.end_operator_support_session(
  p_session_id uuid,
  p_operator_rep_id uuid,
  p_ended_reason text,
  p_completion_summary text,
  p_end_publication_id uuid,
  p_request_id text
)
returns public.operator_support_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.operator_support_sessions%rowtype;
  v_now timestamptz := now();
  v_status text;
  v_event_type text;
begin
  perform public.operator_support_assert_service_role();
  select * into v_session from public.operator_support_sessions where id = p_session_id for update;
  if v_session.id is null then raise exception 'operator support session not found' using errcode = 'P0002'; end if;
  if v_session.operator_rep_id <> p_operator_rep_id then raise exception 'operator mismatch' using errcode = '42501'; end if;
  if v_session.status in ('ended', 'expired', 'revoked', 'failed') then return v_session; end if;
  if p_ended_reason not in ('operator', 'expired', 'revoked', 'control_center_logout', 'target_ineligible', 'failure') then
    raise exception 'invalid end reason' using errcode = '22023';
  end if;
  if p_end_publication_id is not null
    and not public.operator_support_publication_targets_rep(p_end_publication_id, v_session.target_rep_id)
  then
    raise exception 'completion publication does not prove one exact target delivery' using errcode = '23514';
  end if;

  v_status := case
    when p_ended_reason = 'expired' then 'expired'
    when p_ended_reason in ('revoked', 'control_center_logout', 'target_ineligible') then 'revoked'
    when p_ended_reason = 'failure' then 'failed'
    else 'ended'
  end;
  v_event_type := case
    when v_status = 'expired' then 'session_expired'
    when v_status = 'revoked' then 'session_revoked'
    else 'session_ended'
  end;

  perform set_config('app.operator_support_transition', 'allowed', true);
  update public.operator_support_sessions set
    status = v_status, ended_at = v_now, ended_reason = p_ended_reason,
    completion_summary = nullif(btrim(p_completion_summary), ''),
    end_publication_id = p_end_publication_id, updated_at = v_now
  where id = v_session.id returning * into v_session;

  insert into public.operator_support_audit_events (
    support_session_id, operator_rep_id, target_rep_id, event_type,
    workspace_area, result, idempotency_key, request_id
  ) values
    (v_session.id, v_session.operator_rep_id, v_session.target_rep_id,
      'session_end_requested', 'session', 'attempted', 'end-request:' || btrim(p_request_id), p_request_id),
    (v_session.id, v_session.operator_rep_id, v_session.target_rep_id,
      v_event_type, 'session', 'succeeded', 'end:' || btrim(p_request_id), p_request_id)
  on conflict (support_session_id, event_type, idempotency_key) where idempotency_key is not null do nothing;

  if p_end_publication_id is not null then
    insert into public.operator_support_audit_events (
      support_session_id, operator_rep_id, target_rep_id, event_type,
      workspace_area, resource_type, resource_id, result, idempotency_key, request_id
    ) values (
      v_session.id, v_session.operator_rep_id, v_session.target_rep_id,
      'completion_notice_published', 'messages', 'workspace_message_publication',
      p_end_publication_id::text, 'succeeded',
      'end-notice:' || p_end_publication_id::text, p_request_id
    ) on conflict (support_session_id, event_type, idempotency_key)
      where idempotency_key is not null do nothing;
  end if;

  return v_session;
end;
$$;

create or replace function public.record_operator_support_completion_notice(
  p_session_id uuid,
  p_end_publication_id uuid,
  p_request_id text
)
returns public.operator_support_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.operator_support_sessions%rowtype;
begin
  perform public.operator_support_assert_service_role();
  select * into v_session from public.operator_support_sessions where id = p_session_id for update;
  if v_session.id is null then raise exception 'operator support session not found' using errcode = 'P0002'; end if;
  if v_session.status not in ('ended', 'expired', 'revoked', 'failed') then raise exception 'session is not closed' using errcode = '55000'; end if;
  if v_session.end_publication_id = p_end_publication_id then return v_session; end if;
  if v_session.end_publication_id is not null then raise exception 'completion notice is already recorded' using errcode = '55000'; end if;
  if not public.operator_support_publication_targets_rep(p_end_publication_id, v_session.target_rep_id) then
    raise exception 'completion publication does not prove one exact target delivery' using errcode = '23514';
  end if;

  perform set_config('app.operator_support_transition', 'allowed', true);
  update public.operator_support_sessions set
    end_publication_id = p_end_publication_id, updated_at = now()
  where id = v_session.id returning * into v_session;

  insert into public.operator_support_audit_events (
    support_session_id, operator_rep_id, target_rep_id, event_type,
    workspace_area, resource_type, resource_id, result, idempotency_key, request_id
  ) values (
    v_session.id, v_session.operator_rep_id, v_session.target_rep_id,
    'completion_notice_published', 'messages', 'workspace_message_publication',
    p_end_publication_id::text, 'succeeded',
    'end-notice:' || p_end_publication_id::text, p_request_id
  ) on conflict (support_session_id, event_type, idempotency_key)
    where idempotency_key is not null do nothing;

  return v_session;
end;
$$;

create or replace function public.expire_operator_support_sessions()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  perform public.operator_support_assert_service_role();
  perform set_config('app.operator_support_transition', 'allowed', true);
  with expired as (
    update public.operator_support_sessions set
      status = 'expired', ended_at = now(), ended_reason = 'expired', updated_at = now()
    where status in ('pending_notice', 'active') and expires_at <= now()
    returning *
  ), audited as (
    insert into public.operator_support_audit_events (
      support_session_id, operator_rep_id, target_rep_id, event_type,
      workspace_area, result, idempotency_key
    )
    select id, operator_rep_id, target_rep_id, 'session_expired',
      'session', 'succeeded', 'expire:' || id::text
    from expired
    on conflict (support_session_id, event_type, idempotency_key)
      where idempotency_key is not null do nothing
  )
  select count(*) into v_count from expired;
  return v_count;
end;
$$;

create or replace function public.append_operator_support_audit_event(
  p_support_session_id uuid,
  p_operator_rep_id uuid,
  p_target_rep_id uuid,
  p_event_type text,
  p_workspace_area text,
  p_capability text,
  p_resource_type text,
  p_resource_id text,
  p_action_name text,
  p_result text,
  p_safe_diff jsonb,
  p_error_code text,
  p_idempotency_key text,
  p_request_id text
)
returns public.operator_support_audit_events
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.operator_support_sessions%rowtype;
  v_event public.operator_support_audit_events%rowtype;
begin
  perform public.operator_support_assert_service_role();
  select * into v_session from public.operator_support_sessions where id = p_support_session_id;
  if v_session.id is null then raise exception 'operator support session not found' using errcode = 'P0002'; end if;
  if v_session.operator_rep_id <> p_operator_rep_id or v_session.target_rep_id <> p_target_rep_id then
    raise exception 'audit actor or target mismatch' using errcode = '42501';
  end if;
  if p_capability is not null and not (v_session.capabilities ? p_capability) then
    raise exception 'audit capability is outside the frozen session' using errcode = '42501';
  end if;
  if p_event_type = 'mutation_attempted'
    and (v_session.status <> 'active' or v_session.expires_at <= now())
  then
    raise exception 'inactive support session cannot attempt a mutation' using errcode = '55000';
  end if;

  insert into public.operator_support_audit_events (
    support_session_id, operator_rep_id, target_rep_id, event_type,
    workspace_area, capability, resource_type, resource_id, action_name,
    result, safe_diff, error_code, idempotency_key, request_id
  ) values (
    p_support_session_id, p_operator_rep_id, p_target_rep_id, p_event_type,
    p_workspace_area, p_capability, nullif(btrim(p_resource_type), ''),
    nullif(btrim(p_resource_id), ''), nullif(btrim(p_action_name), ''),
    p_result, coalesce(p_safe_diff, '{}'::jsonb), nullif(btrim(p_error_code), ''),
    nullif(btrim(p_idempotency_key), ''), nullif(btrim(p_request_id), '')
  )
  on conflict (support_session_id, event_type, idempotency_key)
    where idempotency_key is not null do nothing
  returning * into v_event;

  if v_event.id is null and p_idempotency_key is not null then
    select * into v_event from public.operator_support_audit_events event_row
    where event_row.support_session_id = p_support_session_id
      and event_row.event_type = p_event_type
      and event_row.idempotency_key = p_idempotency_key;
    if v_event.operator_rep_id <> p_operator_rep_id
      or v_event.target_rep_id <> p_target_rep_id
      or v_event.workspace_area <> p_workspace_area
      or v_event.capability is distinct from p_capability
      or v_event.resource_type is distinct from nullif(btrim(p_resource_type), '')
      or v_event.resource_id is distinct from nullif(btrim(p_resource_id), '')
      or v_event.action_name is distinct from nullif(btrim(p_action_name), '')
      or v_event.result <> p_result
      or v_event.safe_diff <> coalesce(p_safe_diff, '{}'::jsonb)
      or v_event.error_code is distinct from nullif(btrim(p_error_code), '')
      or v_event.request_id is distinct from nullif(btrim(p_request_id), '')
    then
      raise exception 'audit idempotency key was reused with different input' using errcode = '22023';
    end if;
  end if;
  return v_event;
end;
$$;

-- Message Center transparency: support access notices are account activity and
-- this automation may address selected reps only.
alter table public.workspace_message_publications
  drop constraint if exists workspace_message_publications_category_check;
alter table public.workspace_message_publications
  add constraint workspace_message_publications_category_check check (
    category in (
      'customer_activity', 'business_update', 'monthly_report',
      'platform_update', 'help_update', 'blog', 'video', 'announcement',
      'account_activity'
    )
  );

insert into public.workspace_message_senders (
  sender_key, display_name, sender_type, capabilities, is_active
) values (
  'support_access_notifier',
  'Sparkle Suite Support',
  'automation',
  '{"categories":["account_activity"],"audiences":["selected"]}'::jsonb,
  true
)
on conflict (sender_key) do update set
  display_name = excluded.display_name,
  sender_type = excluded.sender_type,
  capabilities = excluded.capabilities,
  is_active = true,
  updated_at = now();

revoke all on function public.operator_support_capabilities_are_valid(jsonb) from public, anon, authenticated;
revoke all on function public.operator_support_assert_service_role() from public, anon, authenticated;
revoke all on function public.operator_support_publication_targets_rep(uuid, uuid) from public, anon, authenticated;
revoke all on function public.request_operator_support_session(uuid, uuid, text, text, uuid, text, text, text, text, uuid, jsonb, text, timestamptz, text) from public, anon, authenticated;
revoke all on function public.activate_operator_support_session(uuid, uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.extend_operator_support_session(uuid, uuid, timestamptz, text) from public, anon, authenticated;
revoke all on function public.end_operator_support_session(uuid, uuid, text, text, uuid, text) from public, anon, authenticated;
revoke all on function public.record_operator_support_completion_notice(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.expire_operator_support_sessions() from public, anon, authenticated;
revoke all on function public.append_operator_support_audit_event(uuid, uuid, uuid, text, text, text, text, text, text, text, jsonb, text, text, text) from public, anon, authenticated;

grant execute on function public.request_operator_support_session(uuid, uuid, text, text, uuid, text, text, text, text, uuid, jsonb, text, timestamptz, text) to service_role;
grant execute on function public.activate_operator_support_session(uuid, uuid, uuid, text) to service_role;
grant execute on function public.extend_operator_support_session(uuid, uuid, timestamptz, text) to service_role;
grant execute on function public.end_operator_support_session(uuid, uuid, text, text, uuid, text) to service_role;
grant execute on function public.record_operator_support_completion_notice(uuid, uuid, text) to service_role;
grant execute on function public.expire_operator_support_sessions() to service_role;
grant execute on function public.append_operator_support_audit_event(uuid, uuid, uuid, text, text, text, text, text, text, text, jsonb, text, text, text) to service_role;

comment on table public.operator_support_sessions is
  'Time-limited transparent operator support access. The operator actor and target rep subject remain distinct.';
comment on table public.operator_support_audit_events is
  'Append-only, redacted audit history for transparent operator support sessions. Never store credentials, payment data, message bodies, or raw request payloads.';

notify pgrst, 'reload schema';
