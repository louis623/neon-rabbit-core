-- Link durable Support reports and reviewed Task List promotions to private conversations.

alter table public.support_reports
  add column if not exists workspace_conversation_id uuid
    references public.workspace_conversations(id) on delete set null,
  add column if not exists submission_idempotency_key text,
  add column if not exists notification_claimed_at timestamptz;

create unique index if not exists uq_support_reports_workspace_conversation
  on public.support_reports(workspace_conversation_id)
  where workspace_conversation_id is not null;
create unique index if not exists uq_support_reports_submission_idempotency
  on public.support_reports(rep_id, submission_idempotency_key)
  where submission_idempotency_key is not null;

alter table public.sparkle_suite_bug_hunt_items
  add column if not exists source_support_report_id uuid
    references public.support_reports(id) on delete set null;
create unique index if not exists uq_bug_hunt_source_support_report
  on public.sparkle_suite_bug_hunt_items(source_support_report_id)
  where source_support_report_id is not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'workspace-support-attachments',
  'workspace-support-attachments',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.workspace_conversation_attachments (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.workspace_conversations(id) on delete cascade,
  message_id uuid references public.workspace_conversation_messages(id) on delete set null,
  uploaded_by_rep_id uuid references public.reps(id) on delete set null,
  attachment_slot smallint not null,
  object_path text not null unique,
  client_request_id text,
  content_sha256 text,
  content_type text not null,
  byte_size integer not null,
  width integer not null,
  height integer not null,
  created_at timestamptz not null default now(),
  constraint workspace_conversation_attachments_type_check
    check (content_type in ('image/jpeg', 'image/png', 'image/webp')),
  constraint workspace_conversation_attachments_size_check
    check (byte_size between 1 and 8388608),
  constraint workspace_conversation_attachments_dimensions_check
    check (width between 1 and 2400 and height between 1 and 2400),
  constraint workspace_conversation_attachments_slot_check
    check (attachment_slot between 1 and 3),
  constraint workspace_conversation_attachments_path_check
    check (object_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'),
  constraint workspace_conversation_attachments_request_check
    check (client_request_id is null or length(client_request_id) between 1 and 180),
  constraint workspace_conversation_attachments_sha_check
    check (content_sha256 is null or content_sha256 ~ '^[0-9a-f]{64}$')
);
alter table public.workspace_conversation_attachments
  add column if not exists client_request_id text,
  add column if not exists content_sha256 text;
create unique index if not exists uq_workspace_conversation_attachment_slot
  on public.workspace_conversation_attachments(conversation_id, attachment_slot);
create unique index if not exists uq_workspace_conversation_attachment_request
  on public.workspace_conversation_attachments(conversation_id, client_request_id)
  where client_request_id is not null;
create unique index if not exists uq_workspace_conversation_attachment_content
  on public.workspace_conversation_attachments(conversation_id, content_sha256)
  where content_sha256 is not null;
create index if not exists idx_workspace_conversation_attachments_conversation
  on public.workspace_conversation_attachments(conversation_id, created_at, id);

alter table public.workspace_conversation_attachments enable row level security;
create policy workspace_conversation_attachments_member_read
  on public.workspace_conversation_attachments for select to authenticated
  using ((select public.workspace_rep_is_conversation_participant(workspace_conversation_attachments.conversation_id)));
revoke all on public.workspace_conversation_attachments from anon, authenticated;
grant select on public.workspace_conversation_attachments to authenticated;

create or replace function public.assert_workspace_support_attachment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.workspace_conversations conversation
    where conversation.id = new.conversation_id
      and conversation.conversation_type = 'support'
  ) then raise exception 'attachments are limited to Support conversations'; end if;
  return new;
end;
$$;
drop trigger if exists trg_workspace_support_attachment_only
  on public.workspace_conversation_attachments;
create trigger trg_workspace_support_attachment_only
before insert or update on public.workspace_conversation_attachments
for each row execute function public.assert_workspace_support_attachment();
revoke all on function public.assert_workspace_support_attachment()
  from public, anon, authenticated;

-- No authenticated storage.objects policy is created for this bucket.
-- Browser clients receive only short-lived signed reads after server-side
-- conversation authorization; service_role retains its normal bypass.

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.support_reports'::regclass
      and conname = 'support_reports_source_check'
  ) then
    alter table public.support_reports drop constraint support_reports_source_check;
  end if;
  alter table public.support_reports add constraint support_reports_source_check
    check (source in ('help_form', 'nic_nac', 'message_center')) not valid;
  alter table public.support_reports validate constraint support_reports_source_check;

  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.support_reports'::regclass
      and conname = 'support_reports_report_type_check'
  ) then
    alter table public.support_reports drop constraint support_reports_report_type_check;
  end if;
  alter table public.support_reports add constraint support_reports_report_type_check
    check (report_type in ('help_question', 'site_issue', 'bug', 'suggested_upgrade', 'workflow_idea')) not valid;
  alter table public.support_reports validate constraint support_reports_report_type_check;
end $$;

create or replace function public.create_workspace_support_submission(
  p_rep_id uuid,
  p_rep_display_name text,
  p_client_account_profile_id uuid,
  p_client_snapshot jsonb,
  p_report_type text,
  p_urgency text,
  p_page_or_workflow text,
  p_title text,
  p_details text,
  p_expected_result text,
  p_actual_result text,
  p_contact_ok boolean,
  p_client_request_id text,
  p_submission_idempotency_key text
)
returns table (report_id uuid, conversation_id uuid, message_id uuid, was_created boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_report_id uuid;
  v_conversation_id uuid;
  v_message_id uuid;
begin
  if p_rep_id is null or btrim(coalesce(p_submission_idempotency_key, '')) = '' then
    raise exception 'trusted rep identity and idempotency key are required';
  end if;

  -- Serialize retries for the same trusted rep/key before the read. The unique
  -- partial index remains the final integrity boundary, while this transaction
  -- lock avoids creating an orphan conversation in a concurrent loser.
  perform pg_advisory_xact_lock(
    hashtextextended(
      'workspace-support-submission:' || p_rep_id::text || ':' || p_submission_idempotency_key,
      0
    )
  );

  select report.id, report.workspace_conversation_id
    into v_report_id, v_conversation_id
  from public.support_reports report
  where report.rep_id = p_rep_id
    and report.submission_idempotency_key = p_submission_idempotency_key;

  if v_report_id is not null then
    select message.id into v_message_id
    from public.workspace_conversation_messages message
    where message.conversation_id = v_conversation_id
      and message.sender_identity_key = 'rep:' || p_rep_id::text
      and message.client_request_id = p_client_request_id;
    return query select v_report_id, v_conversation_id, v_message_id, false;
    return;
  end if;

  insert into public.workspace_conversations (
    conversation_type, state, subject, created_by_rep_id,
    context_type, context_snapshot
  ) values (
    'support', 'open', p_title, p_rep_id,
    'workspace_area', jsonb_strip_nulls(jsonb_build_object('pageOrWorkflow', p_page_or_workflow))
  ) returning id into v_conversation_id;

  insert into public.workspace_conversation_participants (
    conversation_id, principal_type, rep_id, role, membership_state
  ) values (v_conversation_id, 'rep', p_rep_id, 'requester', 'active');
  insert into public.workspace_conversation_participants (
    conversation_id, principal_type, principal_key, role, membership_state
  ) values (v_conversation_id, 'support_queue', 'sparkle_suite_support', 'support', 'active');

  insert into public.support_reports (
    rep_id, client_account_profile_id, client_snapshot, source, report_type,
    urgency, status, page_or_workflow, title, details, expected_result,
    actual_result, contact_ok, notification_channel, notification_status,
    audit_status, workspace_conversation_id, submission_idempotency_key
  ) values (
    p_rep_id, p_client_account_profile_id, coalesce(p_client_snapshot, '{}'::jsonb),
    'message_center', p_report_type, p_urgency, 'open', p_page_or_workflow,
    p_title, p_details, p_expected_result, p_actual_result, p_contact_ok,
    'google_chat', 'pending', 'pending', v_conversation_id, p_submission_idempotency_key
  ) returning id into v_report_id;

  update public.workspace_conversations set
    context_type = 'support_report', context_id = v_report_id::text,
    context_snapshot = context_snapshot || jsonb_build_object('supportType', p_report_type, 'status', 'Received')
  where id = v_conversation_id;

  insert into public.workspace_conversation_messages (
    conversation_id, sender_principal_type, sender_identity_key, sender_rep_id,
    sender_display_name, kind, body, client_request_id
  ) values (
    v_conversation_id, 'rep', 'rep:' || p_rep_id::text, p_rep_id,
    coalesce(nullif(btrim(p_rep_display_name), ''), 'Sparkle Suite rep'),
    'message', p_details, p_client_request_id
  ) returning id into v_message_id;

  insert into public.workspace_conversation_messages (
    conversation_id, sender_principal_type, sender_identity_key, sender_principal_key,
    sender_display_name, kind, body, client_request_id,
    metadata
  ) values (
    v_conversation_id, 'system', 'system', 'system', 'Sparkle Suite Support',
    'system_status', 'Received by Sparkle Suite Support',
    'support-received:' || v_report_id::text,
    jsonb_build_object('supportReportId', v_report_id, 'status', 'open', 'suppressUnread', true)
  );

  insert into public.workspace_conversation_audit_events (
    conversation_id, message_id, actor_type, actor_id, event_type, details,
    idempotency_key
  ) values (
    v_conversation_id, v_message_id, 'rep', p_rep_id::text,
    'support_submission_created', jsonb_build_object('supportReportId', v_report_id),
    'support-submission:' || p_rep_id::text || ':' || p_submission_idempotency_key
  );

  return query select v_report_id, v_conversation_id, v_message_id, true;
end;
$$;

revoke all on function public.create_workspace_support_submission(
  uuid, text, uuid, jsonb, text, text, text, text, text, text, text, boolean, text, text
) from public, anon, authenticated;
grant execute on function public.create_workspace_support_submission(
  uuid, text, uuid, jsonb, text, text, text, text, text, text, text, boolean, text, text
) to service_role;

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
