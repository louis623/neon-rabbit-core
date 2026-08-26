-- Recreate the Support status transition with an unambiguous conflict target.
-- The function's conversation_id output column otherwise collides with the
-- workspace_conversation_messages column name in PL/pgSQL resolution.

create or replace function public.transition_workspace_support_status(
  p_report_id uuid,
  p_status text,
  p_operator_id text
)
returns table (
  conversation_id uuid,
  message_id uuid,
  previous_status text,
  current_status text,
  was_changed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation_id uuid;
  v_previous_status text;
  v_previous_conversation_state text;
  v_conversation_state text;
  v_message_id uuid;
  v_message_was_created boolean := false;
  v_request_id text;
  v_now timestamptz := now();
begin
  if p_status not in ('open', 'reviewing', 'planned', 'resolved', 'closed') then
    raise exception 'invalid support status';
  end if;
  select report.workspace_conversation_id, report.status
    into v_conversation_id, v_previous_status
  from public.support_reports report
  where report.id = p_report_id
  for update;
  if v_conversation_id is null then raise exception 'linked support report not found'; end if;

  v_conversation_state := case
    when p_status = 'resolved' then 'resolved'
    when p_status = 'closed' then 'closed'
    else 'open'
  end;
  select conversation.state into v_previous_conversation_state
  from public.workspace_conversations conversation
  where conversation.id = v_conversation_id
    and conversation.conversation_type = 'support'
  for update;
  if v_previous_conversation_state is null then raise exception 'linked support conversation not found'; end if;

  update public.support_reports
  set status = p_status, updated_at = v_now
  where id = p_report_id;
  update public.workspace_conversations
  set state = v_conversation_state,
      closed_at = case when p_status = 'closed' then v_now else null end,
      closed_by_actor = case when p_status = 'closed' then p_operator_id else null end,
      updated_at = v_now,
      context_snapshot = context_snapshot || jsonb_build_object(
        'supportReportId', p_report_id,
        'status', case p_status
          when 'open' then 'Received'
          when 'reviewing' then 'Under review'
          when 'planned' then 'Planned'
          when 'resolved' then 'Resolved'
          else 'Closed'
        end
      )
  where id = v_conversation_id;

  v_request_id := 'support-status:' || p_report_id::text || ':' || p_status;
  insert into public.workspace_conversation_messages (
    conversation_id, sender_principal_type, sender_identity_key,
    sender_principal_key, sender_display_name, kind, body,
    client_request_id, metadata, created_at
  ) values (
    v_conversation_id, 'system', 'system', 'system', 'Sparkle Suite Support',
    'system_status', case p_status
      when 'open' then 'Received'
      when 'reviewing' then 'Under review'
      when 'planned' then 'Planned'
      when 'resolved' then 'Resolved'
      else 'Closed'
    end,
    v_request_id, jsonb_build_object('supportReportId', p_report_id, 'status', p_status), v_now
  ) on conflict on constraint workspace_conversation_messages_request_unique do nothing
  returning id into v_message_id;
  v_message_was_created := v_message_id is not null;
  if v_message_id is null then
    select message.id into v_message_id
    from public.workspace_conversation_messages message
    where message.conversation_id = v_conversation_id
      and message.sender_identity_key = 'system'
      and message.client_request_id = v_request_id;
  end if;
  insert into public.workspace_conversation_audit_events (
    conversation_id, message_id, actor_type, actor_id, event_type, details,
    idempotency_key
  ) values (
    v_conversation_id, v_message_id, 'operator', p_operator_id,
    'support_status_changed', jsonb_build_object('from', v_previous_status, 'to', p_status),
    v_request_id
  ) on conflict (idempotency_key) do nothing;

  return query select v_conversation_id, v_message_id, v_previous_status, p_status,
    (v_previous_status is distinct from p_status or v_previous_conversation_state is distinct from v_conversation_state or v_message_was_created);
end;
$$;

revoke all on function public.transition_workspace_support_status(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.transition_workspace_support_status(uuid, text, text)
  to service_role;

notify pgrst, 'reload schema';
