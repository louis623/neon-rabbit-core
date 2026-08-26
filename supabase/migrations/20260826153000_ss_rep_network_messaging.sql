-- Controlled subscriber-to-subscriber message requests and safety controls.

alter table public.workspace_conversations
  add column if not exists rep_pair_low uuid references public.reps(id) on delete set null,
  add column if not exists rep_pair_high uuid references public.reps(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conrelid = 'public.workspace_conversations'::regclass
      and conname = 'workspace_conversations_rep_pair_check'
  ) then
    alter table public.workspace_conversations add constraint workspace_conversations_rep_pair_check check (
      (conversation_type = 'rep_direct' and rep_pair_low is not null and rep_pair_high is not null and rep_pair_low::text < rep_pair_high::text)
      or (conversation_type <> 'rep_direct' and rep_pair_low is null and rep_pair_high is null)
    );
  end if;
end $$;

create unique index if not exists uq_workspace_rep_direct_active_pair
  on public.workspace_conversations(rep_pair_low, rep_pair_high)
  where conversation_type = 'rep_direct' and state in ('pending', 'open', 'resolved');

create table if not exists public.workspace_rep_message_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_rep_id uuid not null references public.reps(id) on delete cascade,
  blocked_rep_id uuid not null references public.reps(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  lifted_at timestamptz,
  constraint workspace_rep_message_blocks_not_self check (blocker_rep_id <> blocked_rep_id),
  constraint workspace_rep_message_blocks_unique unique (blocker_rep_id, blocked_rep_id)
);

create table if not exists public.workspace_conversation_reports (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.workspace_conversations(id) on delete cascade,
  reporter_rep_id uuid not null references public.reps(id) on delete cascade,
  message_id uuid references public.workspace_conversation_messages(id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by_actor text,
  constraint workspace_conversation_reports_reason_check
    check (reason in ('spam', 'harassment', 'recruiting', 'unsafe', 'other')),
  constraint workspace_conversation_reports_status_check
    check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  constraint workspace_conversation_reports_details_check
    check (details is null or char_length(details) <= 2000)
);

create table if not exists public.workspace_rep_messaging_suspensions (
  rep_id uuid primary key references public.reps(id) on delete cascade,
  reason text not null,
  suspended_at timestamptz not null default now(),
  suspended_by_actor text not null,
  lifted_at timestamptz,
  lifted_by_actor text
);

create index if not exists idx_workspace_rep_blocks_blocked
  on public.workspace_rep_message_blocks(blocked_rep_id, blocker_rep_id)
  where lifted_at is null;
create index if not exists idx_workspace_conversation_reports_queue
  on public.workspace_conversation_reports(status, created_at desc, id desc);
create index if not exists idx_workspace_conversation_reports_reporter_recent
  on public.workspace_conversation_reports(reporter_rep_id, conversation_id, created_at desc);
create index if not exists idx_workspace_rep_requests_rate
  on public.workspace_conversations(created_by_rep_id, created_at desc)
  where conversation_type = 'rep_direct';

create or replace function public.workspace_rep_network_account_class(p_rep_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when rep.status <> 'active' then null
    when exists (
      select 1 from public.subscriptions subscription
      where subscription.rep_id = rep.id
        and subscription.status = 'active'
        and subscription.monthly_amount > 0
        and subscription.stripe_livemode is true
        and nullif(btrim(subscription.stripe_subscription_id), '') is not null
        and subscription.stripe_subscription_id not like 'sub_reviewer_smoke_%'
    ) then 'live_paid'
    when exists (
      select 1 from public.subscriptions subscription
      where subscription.rep_id = rep.id
        and subscription.status = 'active'
        and subscription.monthly_amount > 0
        and subscription.stripe_livemode is false
        and subscription.stripe_subscription_id = 'sub_reviewer_smoke_' || p_rep_id::text
        and subscription.pricing_tier = 'smoke'
    ) then 'reviewer'
    else null
  end
  from public.reps rep
  where rep.id = p_rep_id
$$;

create or replace function public.create_workspace_rep_message_request(
  p_sender_rep_id uuid,
  p_sender_display_name text,
  p_recipient_rep_id uuid,
  p_subject text,
  p_body text,
  p_client_request_id text,
  p_context_type text,
  p_context_id text,
  p_context_snapshot jsonb
)
returns table (conversation_id uuid, conversation_state text, was_created boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_low uuid;
  v_high uuid;
  v_conversation_id uuid;
  v_state text;
  v_sender_class text;
  v_recipient_class text;
  v_message_id uuid;
begin
  if p_sender_rep_id = p_recipient_rep_id then raise exception 'self messaging is not allowed'; end if;
  perform pg_advisory_xact_lock(hashtextextended('workspace-rep-request:' || p_sender_rep_id::text, 0));
  v_low := least(p_sender_rep_id, p_recipient_rep_id);
  v_high := greatest(p_sender_rep_id, p_recipient_rep_id);
  perform pg_advisory_xact_lock(hashtextextended('workspace-rep-pair:' || v_low::text || ':' || v_high::text, 0));

  select id, state into v_conversation_id, v_state
  from public.workspace_conversations
  where conversation_type = 'rep_direct' and rep_pair_low = v_low and rep_pair_high = v_high
    and state in ('pending', 'open', 'resolved')
  limit 1;
  if v_conversation_id is not null then
    return query select v_conversation_id, v_state, false;
    return;
  end if;

  v_sender_class := public.workspace_rep_network_account_class(p_sender_rep_id);
  v_recipient_class := public.workspace_rep_network_account_class(p_recipient_rep_id);
  if v_sender_class is null or v_recipient_class is null or v_sender_class <> v_recipient_class then
    raise exception 'rep network eligibility failed';
  end if;
  if exists (select 1 from public.workspace_rep_messaging_suspensions suspension where suspension.rep_id in (p_sender_rep_id, p_recipient_rep_id) and suspension.lifted_at is null) then
    raise exception 'rep network messaging is suspended';
  end if;
  if exists (
    select 1 from public.workspace_rep_message_blocks block
    where block.lifted_at is null and (
      (block.blocker_rep_id = p_sender_rep_id and block.blocked_rep_id = p_recipient_rep_id)
      or (block.blocker_rep_id = p_recipient_rep_id and block.blocked_rep_id = p_sender_rep_id)
    )
  ) then raise exception 'rep network messaging is blocked'; end if;
  if (select count(*) from public.workspace_conversations conversation where conversation.conversation_type = 'rep_direct' and conversation.created_by_rep_id = p_sender_rep_id and conversation.created_at >= now() - interval '1 day') >= 5 then
    raise exception 'rep network request limit reached';
  end if;

  insert into public.workspace_conversations (
    conversation_type, state, subject, created_by_rep_id, context_type, context_id,
    context_snapshot, rep_pair_low, rep_pair_high
  ) values (
    'rep_direct', 'pending', p_subject, p_sender_rep_id,
    coalesce(p_context_type, 'rep_profile'), p_context_id,
    coalesce(p_context_snapshot, '{}'::jsonb), v_low, v_high
  ) returning id, state into v_conversation_id, v_state;
  insert into public.workspace_conversation_participants (conversation_id, principal_type, rep_id, role, membership_state)
    values (v_conversation_id, 'rep', p_sender_rep_id, 'requester', 'active'),
           (v_conversation_id, 'rep', p_recipient_rep_id, 'recipient', 'pending');
  insert into public.workspace_conversation_messages (
    conversation_id, sender_principal_type, sender_identity_key, sender_rep_id,
    sender_display_name, kind, body, client_request_id, metadata
  ) values (
    v_conversation_id, 'rep', 'rep:' || p_sender_rep_id::text, p_sender_rep_id,
    p_sender_display_name, 'message', p_body, p_client_request_id,
    jsonb_build_object('requestMessage', true)
  ) returning id into v_message_id;
  insert into public.workspace_conversation_audit_events (
    conversation_id, message_id, actor_type, actor_id, event_type, details,
    idempotency_key
  ) values (
    v_conversation_id, v_message_id, 'rep', p_sender_rep_id::text,
    'rep_message_request_created', jsonb_build_object('recipientRepId', p_recipient_rep_id),
    'rep-request:' || p_sender_rep_id::text || ':' || p_client_request_id
  );
  return query select v_conversation_id, v_state, true;
end;
$$;

create or replace function public.send_workspace_rep_direct_message(
  p_conversation_id uuid,
  p_sender_rep_id uuid,
  p_sender_display_name text,
  p_body text,
  p_client_request_id text
)
returns setof public.workspace_conversation_messages
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recipient_rep_id uuid;
  v_sender_class text;
  v_recipient_class text;
begin
  perform pg_advisory_xact_lock(hashtextextended('workspace-rep-send:' || p_sender_rep_id::text, 0));
  if exists (
    select 1 from public.workspace_conversation_messages message
    where message.conversation_id = p_conversation_id
      and message.sender_identity_key = 'rep:' || p_sender_rep_id::text
      and message.client_request_id = p_client_request_id
  ) then
    return query select * from public.workspace_conversation_messages message
      where message.conversation_id = p_conversation_id
        and message.sender_identity_key = 'rep:' || p_sender_rep_id::text
        and message.client_request_id = p_client_request_id;
    return;
  end if;
  select participant.rep_id into v_recipient_rep_id
  from public.workspace_conversation_participants participant
  join public.workspace_conversations conversation on conversation.id = participant.conversation_id
  where participant.conversation_id = p_conversation_id
    and participant.principal_type = 'rep'
    and participant.rep_id <> p_sender_rep_id
    and participant.membership_state = 'active'
    and conversation.conversation_type = 'rep_direct'
    and conversation.state = 'open';
  if v_recipient_rep_id is null or not exists (
    select 1 from public.workspace_conversation_participants sender
    where sender.conversation_id = p_conversation_id and sender.rep_id = p_sender_rep_id
      and sender.membership_state = 'active'
  ) then raise exception 'rep direct conversation is not replyable'; end if;
  v_sender_class := public.workspace_rep_network_account_class(p_sender_rep_id);
  v_recipient_class := public.workspace_rep_network_account_class(v_recipient_rep_id);
  if v_sender_class is null or v_recipient_class is null or v_sender_class <> v_recipient_class then raise exception 'rep network eligibility failed'; end if;
  if exists (select 1 from public.workspace_rep_messaging_suspensions suspension where suspension.rep_id in (p_sender_rep_id, v_recipient_rep_id) and suspension.lifted_at is null) then raise exception 'rep network messaging is suspended'; end if;
  if exists (select 1 from public.workspace_rep_message_blocks block where block.lifted_at is null and ((block.blocker_rep_id = p_sender_rep_id and block.blocked_rep_id = v_recipient_rep_id) or (block.blocker_rep_id = v_recipient_rep_id and block.blocked_rep_id = p_sender_rep_id))) then raise exception 'rep network messaging is blocked'; end if;
  if (
    select count(*)
    from public.workspace_conversation_messages message
    join public.workspace_conversations conversation on conversation.id = message.conversation_id
    where message.sender_rep_id = p_sender_rep_id
      and conversation.conversation_type = 'rep_direct'
      and message.created_at >= now() - interval '1 hour'
  ) >= 60 then raise exception 'rep network message limit reached'; end if;
  return query
    insert into public.workspace_conversation_messages (
      conversation_id, sender_principal_type, sender_identity_key, sender_rep_id,
      sender_display_name, kind, body, client_request_id
    ) values (
      p_conversation_id, 'rep', 'rep:' || p_sender_rep_id::text, p_sender_rep_id,
      p_sender_display_name, 'message', p_body, p_client_request_id
    ) returning *;
end;
$$;

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
    on conflict on constraint workspace_rep_message_blocks_unique do update set reason = excluded.reason, lifted_at = null, created_at = now();
  update public.workspace_conversations set state = 'blocked', closed_at = now(), closed_by_actor = 'rep:' || p_blocker_rep_id::text, updated_at = now()
    where id = p_conversation_id;
  insert into public.workspace_conversation_audit_events (conversation_id, actor_type, actor_id, event_type, details)
    values (p_conversation_id, 'rep', p_blocker_rep_id::text, 'rep_network_participant_blocked', jsonb_build_object('blockedRepId', v_blocked_rep_id));
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
    where recipient.conversation_id = p_conversation_id and recipient.rep_id = p_recipient_rep_id;
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
    where recipient.conversation_id = p_conversation_id and recipient.rep_id = p_recipient_rep_id;
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
    conversation_id, actor_type, actor_id, event_type, details,
    idempotency_key
  ) values (
    p_conversation_id, 'rep', p_recipient_rep_id::text,
    'rep_message_request_' || p_decision, '{}'::jsonb,
    'rep-request-decision:' || p_conversation_id::text
  ) on conflict (idempotency_key) do nothing;
  return query select p_conversation_id, v_state, p_decision;
end;
$$;

create or replace function public.create_workspace_rep_conversation_report(
  p_conversation_id uuid,
  p_reporter_rep_id uuid,
  p_message_id uuid,
  p_reason text,
  p_details text
)
returns table (report_id uuid, report_status text, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_report_id uuid;
  v_status text;
  v_created_at timestamptz;
begin
  perform pg_advisory_xact_lock(hashtextextended('workspace-rep-report:' || p_conversation_id::text || ':' || p_reporter_rep_id::text, 0));
  if not exists (
    select 1
    from public.workspace_conversation_participants participant
    join public.workspace_conversations conversation on conversation.id = participant.conversation_id
    where participant.conversation_id = p_conversation_id
      and participant.rep_id = p_reporter_rep_id
      and participant.membership_state in ('pending', 'active')
      and conversation.conversation_type = 'rep_direct'
  ) then raise exception 'rep direct participant required'; end if;
  if p_message_id is not null and not exists (
    select 1 from public.workspace_conversation_messages message
    where message.id = p_message_id and message.conversation_id = p_conversation_id
  ) then raise exception 'reported message does not belong to conversation'; end if;
  if (
    select count(*) from public.workspace_conversation_reports report
    where report.conversation_id = p_conversation_id
      and report.reporter_rep_id = p_reporter_rep_id
  ) >= 3 then raise exception 'report limit reached'; end if;
  insert into public.workspace_conversation_reports (
    conversation_id, reporter_rep_id, message_id, reason, details
  ) values (
    p_conversation_id, p_reporter_rep_id, p_message_id, p_reason,
    nullif(pg_catalog.left(pg_catalog.btrim(p_details), 2000), '')
  ) returning id, status, workspace_conversation_reports.created_at
    into v_report_id, v_status, v_created_at;
  insert into public.workspace_conversation_audit_events (
    conversation_id, actor_type, actor_id, event_type, details
  ) values (
    p_conversation_id, 'rep', p_reporter_rep_id::text,
    'rep_network_conversation_reported',
    jsonb_build_object('reportId', v_report_id, 'reason', p_reason)
  );
  return query select v_report_id, v_status, v_created_at;
end;
$$;

revoke all on function public.workspace_rep_network_account_class(uuid) from public, anon, authenticated;
revoke all on function public.create_workspace_rep_message_request(uuid, text, uuid, text, text, text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.send_workspace_rep_direct_message(uuid, uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.block_workspace_rep_conversation(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.decide_workspace_rep_message_request(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.create_workspace_rep_conversation_report(uuid, uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.create_workspace_rep_message_request(uuid, text, uuid, text, text, text, text, text, jsonb) to service_role;
grant execute on function public.send_workspace_rep_direct_message(uuid, uuid, text, text, text) to service_role;
grant execute on function public.block_workspace_rep_conversation(uuid, uuid, text) to service_role;
grant execute on function public.decide_workspace_rep_message_request(uuid, uuid, text, text) to service_role;
grant execute on function public.create_workspace_rep_conversation_report(uuid, uuid, uuid, text, text) to service_role;

alter table public.workspace_rep_message_blocks enable row level security;
alter table public.workspace_conversation_reports enable row level security;
alter table public.workspace_rep_messaging_suspensions enable row level security;

create policy workspace_rep_blocks_own_read
  on public.workspace_rep_message_blocks for select to authenticated
  using (blocker_rep_id = (select public.workspace_current_rep_id()));
create policy workspace_conversation_reports_own_read
  on public.workspace_conversation_reports for select to authenticated
  using (reporter_rep_id = (select public.workspace_current_rep_id()));

revoke all on public.workspace_rep_message_blocks from anon, authenticated;
revoke all on public.workspace_conversation_reports from anon, authenticated;
revoke all on public.workspace_rep_messaging_suspensions from anon, authenticated;
grant select on public.workspace_rep_message_blocks to authenticated;
grant select on public.workspace_conversation_reports to authenticated;

notify pgrst, 'reload schema';
