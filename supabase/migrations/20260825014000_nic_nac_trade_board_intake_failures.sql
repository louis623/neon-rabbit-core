create or replace function public.rpc_record_trade_board_intake_failure(
  p_session_id uuid,
  p_rep_id uuid,
  p_conversation_id text,
  p_tool_name text,
  p_run_id text,
  p_failure_signature text,
  p_input_signature text,
  p_error_code text,
  p_error_stage text,
  p_retryable boolean,
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session public.trade_board_intake_sessions%rowtype;
  v_previous jsonb;
  v_failure_count integer;
  v_same_run boolean;
  v_status_after text;
  v_newly_escalated boolean;
  v_attempt jsonb;
begin
  if p_session_id is null
    or p_rep_id is null
    or nullif(btrim(p_conversation_id), '') is null
    or nullif(btrim(p_tool_name), '') is null
    or nullif(btrim(p_run_id), '') is null
    or nullif(btrim(p_failure_signature), '') is null
    or nullif(btrim(p_error_code), '') is null
    or nullif(btrim(p_error_stage), '') is null
  then
    raise exception 'invalid Trade Board failure scope' using errcode = '22023';
  end if;

  select *
    into v_session
  from public.trade_board_intake_sessions
  where id = p_session_id
    and rep_id = p_rep_id
    and conversation_id = p_conversation_id
    and status in ('active', 'needs_human_review')
  for update;

  if not found then
    return null;
  end if;

  v_previous := coalesce(v_session.metadata -> 'addAttempt', '{}'::jsonb);
  v_same_run := coalesce(v_previous ->> 'lastFailureRunId', '') = p_run_id
    and coalesce(v_previous ->> 'failureSignature', '') = p_failure_signature;

  if v_same_run then
    v_failure_count := greatest(1, coalesce((v_previous ->> 'failureCount')::integer, 1));
  elsif coalesce(v_previous ->> 'failureSignature', '') = p_failure_signature then
    v_failure_count := coalesce((v_previous ->> 'failureCount')::integer, 0) + 1;
  else
    v_failure_count := 1;
  end if;

  v_status_after := case
    when v_session.status = 'needs_human_review' or v_failure_count >= 2
      then 'needs_human_review'
    else 'active'
  end;
  v_newly_escalated := v_session.status <> 'needs_human_review'
    and v_status_after = 'needs_human_review';

  v_attempt := jsonb_build_object(
    'toolName', p_tool_name,
    'stage', p_error_stage,
    'errorCode', p_error_code,
    'retryable', p_retryable,
    'failureSignature', p_failure_signature,
    'failureCount', v_failure_count,
    'lastFailureRunId', p_run_id,
    'inputSignature', coalesce(p_input_signature, ''),
    'lastFailedAt', p_now
  );

  update public.trade_board_intake_sessions
  set status = v_status_after,
      current_phase = case
        when v_status_after = 'needs_human_review' then 'needs_human_review'
        else 'adding'
      end,
      hard_blockers = case
        when v_status_after = 'needs_human_review'
          then array_append(array_remove(coalesce(hard_blockers, '{}'::text[]), 'add_listing_backend_failure'), 'add_listing_backend_failure')
        else hard_blockers
      end,
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('addAttempt', v_attempt),
      updated_at = p_now
  where id = v_session.id;

  return jsonb_build_object(
    'workflow_id', v_session.id,
    'failure_count', v_failure_count,
    'workflow_status_after', v_status_after,
    'newly_escalated', v_newly_escalated,
    'same_run_replay', v_same_run
  );
end;
$$;

revoke all on function public.rpc_record_trade_board_intake_failure(
  uuid, uuid, text, text, text, text, text, text, text, boolean, timestamptz
) from public, anon, authenticated;
grant execute on function public.rpc_record_trade_board_intake_failure(
  uuid, uuid, text, text, text, text, text, text, text, boolean, timestamptz
) to service_role;

notify pgrst, 'reload schema';
