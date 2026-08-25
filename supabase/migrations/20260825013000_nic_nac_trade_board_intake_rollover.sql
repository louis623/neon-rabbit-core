create or replace function public.rpc_rollover_trade_board_intake(
  p_rep_id uuid,
  p_source_conversation_id text,
  p_destination_conversation_id text,
  p_now timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session_id uuid;
begin
  if p_rep_id is null
    or nullif(btrim(p_source_conversation_id), '') is null
    or nullif(btrim(p_destination_conversation_id), '') is null
    or p_source_conversation_id = p_destination_conversation_id
  then
    raise exception 'invalid Trade Board intake rollover scope'
      using errcode = '22023';
  end if;

  select id
    into v_session_id
  from public.trade_board_intake_sessions
  where rep_id = p_rep_id
    and conversation_id = p_source_conversation_id
    and status in ('active', 'needs_human_review')
    and expires_at > p_now
  order by updated_at desc
  limit 1
  for update;

  if v_session_id is null then
    return null;
  end if;

  update public.trade_board_intake_photos
  set conversation_id = p_destination_conversation_id
  where session_id = v_session_id
    and rep_id = p_rep_id
    and conversation_id = p_source_conversation_id;

  update public.trade_board_intake_sessions
  set conversation_id = p_destination_conversation_id,
      updated_at = p_now
  where id = v_session_id
    and rep_id = p_rep_id
    and conversation_id = p_source_conversation_id
    and status in ('active', 'needs_human_review')
    and expires_at > p_now;

  if not found then
    raise exception 'open Trade Board intake changed during rollover'
      using errcode = '40001';
  end if;

  return v_session_id;
end;
$$;

revoke all on function public.rpc_rollover_trade_board_intake(uuid, text, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.rpc_rollover_trade_board_intake(uuid, text, text, timestamptz)
  to service_role;

create or replace function public.rpc_rollover_trade_board_intake_v2(
  p_rep_id uuid,
  p_source_conversation_id text,
  p_destination_conversation_id text,
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session_id uuid;
  v_destination_conversation_id text;
begin
  if p_rep_id is null
    or nullif(btrim(p_source_conversation_id), '') is null
    or nullif(btrim(p_destination_conversation_id), '') is null
    or p_source_conversation_id = p_destination_conversation_id
  then
    raise exception 'invalid Trade Board intake rollover scope'
      using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_rep_id::text || ':' || p_source_conversation_id, 0)
  );

  select id, conversation_id
    into v_session_id, v_destination_conversation_id
  from public.trade_board_intake_sessions
  where rep_id = p_rep_id
    and status in ('active', 'needs_human_review')
    and expires_at > p_now
    and metadata ->> 'rolloverSourceConversationId' = p_source_conversation_id
  order by updated_at desc
  limit 1
  for update;

  if v_session_id is not null then
    return jsonb_build_object(
      'workflow_id', v_session_id,
      'destination_conversation_id', v_destination_conversation_id,
      'replayed', true
    );
  end if;

  select id
    into v_session_id
  from public.trade_board_intake_sessions
  where rep_id = p_rep_id
    and conversation_id = p_source_conversation_id
    and status in ('active', 'needs_human_review')
    and expires_at > p_now
  order by updated_at desc
  limit 1
  for update;

  if v_session_id is null then
    return null;
  end if;

  update public.trade_board_intake_photos
  set conversation_id = p_destination_conversation_id
  where session_id = v_session_id
    and rep_id = p_rep_id
    and conversation_id = p_source_conversation_id;

  update public.trade_board_intake_sessions
  set conversation_id = p_destination_conversation_id,
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'rolloverSourceConversationId', p_source_conversation_id,
        'rolloverDestinationConversationId', p_destination_conversation_id
      ),
      updated_at = p_now
  where id = v_session_id
    and rep_id = p_rep_id
    and conversation_id = p_source_conversation_id
    and status in ('active', 'needs_human_review')
    and expires_at > p_now;

  if not found then
    raise exception 'open Trade Board intake changed during rollover'
      using errcode = '40001';
  end if;

  return jsonb_build_object(
    'workflow_id', v_session_id,
    'destination_conversation_id', p_destination_conversation_id,
    'replayed', false
  );
end;
$$;

revoke all on function public.rpc_rollover_trade_board_intake_v2(uuid, text, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.rpc_rollover_trade_board_intake_v2(uuid, text, text, timestamptz)
  to service_role;

notify pgrst, 'reload schema';
