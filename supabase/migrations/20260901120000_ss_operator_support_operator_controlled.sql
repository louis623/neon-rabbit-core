-- Support access is operator-controlled. An open session remains active until
-- the operator explicitly ends it (or an existing non-time safety transition
-- revokes/fails it). Historical expiry data is retained for closed sessions.

alter table public.operator_support_sessions
  drop constraint if exists operator_support_sessions_expiry_check;

alter table public.operator_support_sessions
  alter column expires_at drop not null;

drop index if exists public.operator_support_sessions_expiry_idx;

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

-- Keep the legacy RPC harmless for older callers during rollout. It no longer
-- transitions sessions or writes expiry audit events.
create or replace function public.expire_operator_support_sessions()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.operator_support_assert_service_role();
  return 0;
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
  if p_event_type = 'mutation_attempted' and v_session.status <> 'active' then
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

-- Extensions are obsolete because there is no support window to extend.
revoke execute on function public.extend_operator_support_session(uuid, uuid, timestamptz, text)
  from service_role;

comment on table public.operator_support_sessions is
  'Transparent operator support access that remains active until explicitly ended. The operator actor and target rep subject remain distinct.';

comment on column public.operator_support_sessions.expires_at is
  'Legacy close-window evidence retained for existing sessions. Null for newly created operator-controlled sessions and never used to close access.';

notify pgrst, 'reload schema';
