-- Remove PL/pgSQL ambiguity between RETURNS TABLE output names and table
-- columns in Rep Network decision/block mutations.

create or replace function public.block_workspace_rep_conversation(
  p_conversation_id uuid,
  p_blocker_rep_id uuid,
  p_reason text
)
returns table (conversation_id uuid, blocked_rep_id uuid, conversation_state text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_blocked_rep_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('workspace-rep-block:' || p_conversation_id::text, 0));
  if not exists (
    select 1 from public.workspace_conversation_participants participant
    join public.workspace_conversations conversation on conversation.id = participant.conversation_id
    where participant.conversation_id = p_conversation_id
      and participant.rep_id = p_blocker_rep_id
      and participant.membership_state in ('pending', 'active')
      and conversation.conversation_type = 'rep_direct'
  ) then raise exception 'rep network participant required'; end if;
  select participant.rep_id into v_blocked_rep_id
  from public.workspace_conversation_participants participant
  where participant.conversation_id = p_conversation_id
    and participant.principal_type = 'rep'
    and participant.rep_id <> p_blocker_rep_id
  limit 1;
  if v_blocked_rep_id is null then raise exception 'rep network counterpart missing'; end if;
  insert into public.workspace_rep_message_blocks (blocker_rep_id, blocked_rep_id, reason, lifted_at)
    values (p_blocker_rep_id, v_blocked_rep_id, nullif(btrim(p_reason), ''), null)
    on conflict on constraint workspace_rep_message_blocks_unique do update
      set reason = excluded.reason, lifted_at = null, created_at = now();
  update public.workspace_conversations set
    state = 'blocked', closed_at = now(),
    closed_by_actor = 'rep:' || p_blocker_rep_id::text, updated_at = now()
    where id = p_conversation_id;
  insert into public.workspace_conversation_audit_events (
    conversation_id, actor_type, actor_id, event_type, details
  ) values (
    p_conversation_id, 'rep', p_blocker_rep_id::text,
    'rep_network_participant_blocked', jsonb_build_object('blockedRepId', v_blocked_rep_id)
  );
  return query select p_conversation_id, v_blocked_rep_id, 'blocked'::text;
end;
$$;

create or replace function public.decide_workspace_rep_message_request(
  p_conversation_id uuid,
  p_recipient_rep_id uuid,
  p_decision text,
  p_reason text
)
returns table (conversation_id uuid, conversation_state text, decision text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sender_rep_id uuid;
  v_state text;
  v_now timestamptz := now();
begin
  if p_decision not in ('accept', 'decline', 'decline_and_block') then
    raise exception 'invalid message request decision';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('workspace-rep-decision:' || p_conversation_id::text, 0));
  select conversation.state into v_state
  from public.workspace_conversations conversation
  where conversation.id = p_conversation_id
    and conversation.conversation_type = 'rep_direct'
  for update;
  if v_state is distinct from 'pending' then raise exception 'message request is not pending'; end if;
  if not exists (
    select 1 from public.workspace_conversation_participants recipient
    where recipient.conversation_id = p_conversation_id
      and recipient.rep_id = p_recipient_rep_id
      and recipient.role = 'recipient'
      and recipient.membership_state = 'pending'
  ) then raise exception 'pending recipient membership required'; end if;
  select requester.rep_id into v_sender_rep_id
  from public.workspace_conversation_participants requester
  where requester.conversation_id = p_conversation_id
    and requester.role = 'requester'
    and requester.principal_type = 'rep'
  limit 1;
  if v_sender_rep_id is null then raise exception 'message request sender missing'; end if;

  if p_decision = 'accept' then
    update public.workspace_conversation_participants as recipient
    set membership_state = 'active', joined_at = v_now, updated_at = v_now
    where recipient.conversation_id = p_conversation_id
      and recipient.rep_id = p_recipient_rep_id;
    update public.workspace_conversations
    set state = 'open', updated_at = v_now
    where id = p_conversation_id;
    v_state := 'open';
  else
    v_state := case when p_decision = 'decline_and_block' then 'blocked' else 'closed' end;
    update public.workspace_conversation_participants as recipient
    set membership_state = case when p_decision = 'decline_and_block' then 'blocked' else 'declined' end,
        left_at = v_now,
        updated_at = v_now
    where recipient.conversation_id = p_conversation_id
      and recipient.rep_id = p_recipient_rep_id;
    update public.workspace_conversations
    set state = v_state, closed_at = v_now,
        closed_by_actor = 'rep:' || p_recipient_rep_id::text, updated_at = v_now
    where id = p_conversation_id;
    if p_decision = 'decline_and_block' then
      insert into public.workspace_rep_message_blocks (
        blocker_rep_id, blocked_rep_id, reason, lifted_at
      ) values (
        p_recipient_rep_id, v_sender_rep_id, nullif(btrim(p_reason), ''), null
      ) on conflict on constraint workspace_rep_message_blocks_unique do update
        set reason = excluded.reason, lifted_at = null, created_at = v_now;
    end if;
  end if;
  insert into public.workspace_conversation_audit_events (
    conversation_id, actor_type, actor_id, event_type, details, idempotency_key
  ) values (
    p_conversation_id, 'rep', p_recipient_rep_id::text,
    'rep_message_request_' || p_decision, '{}'::jsonb,
    'rep-request-decision:' || p_conversation_id::text
  ) on conflict (idempotency_key) do nothing;
  return query select p_conversation_id, v_state, p_decision;
end;
$$;

revoke all on function public.block_workspace_rep_conversation(uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.decide_workspace_rep_message_request(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.block_workspace_rep_conversation(uuid, uuid, text)
  to service_role;
grant execute on function public.decide_workspace_rep_message_request(uuid, uuid, text, text)
  to service_role;

notify pgrst, 'reload schema';
