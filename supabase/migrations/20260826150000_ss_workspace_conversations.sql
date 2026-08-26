-- Canonical private conversation foundation for the Sparkle Suite Workspace.
-- Official publications remain in workspace_message_* and stay receive-only.

create table if not exists public.workspace_conversations (
  id uuid primary key default gen_random_uuid(),
  conversation_type text not null,
  state text not null default 'open',
  subject text not null,
  created_by_rep_id uuid references public.reps(id) on delete set null,
  context_type text,
  context_id text,
  context_snapshot jsonb not null default '{}'::jsonb,
  last_message_at timestamptz not null default now(),
  latest_message_preview text not null default '',
  latest_message_sender_display_name text,
  closed_at timestamptz,
  closed_by_actor text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_conversations_type_check
    check (conversation_type in ('team_onboarding', 'support', 'rep_direct')),
  constraint workspace_conversations_state_check
    check (state in ('pending', 'open', 'resolved', 'closed', 'blocked')),
  constraint workspace_conversations_subject_check
    check (char_length(btrim(subject)) between 1 and 160),
  constraint workspace_conversations_context_type_check
    check (context_type is null or context_type in (
      'team_onboarding_participant', 'support_report', 'dance_floor_dancer',
      'trade_request', 'rep_profile', 'workspace_area'
    )),
  constraint workspace_conversations_context_snapshot_object
    check (jsonb_typeof(context_snapshot) = 'object'),
  constraint workspace_conversations_closed_state_check
    check ((state in ('closed', 'blocked') and closed_at is not null) or state not in ('closed', 'blocked'))
);

create table if not exists public.workspace_conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.workspace_conversations(id) on delete cascade,
  principal_type text not null,
  rep_id uuid references public.reps(id) on delete cascade,
  team_onboarding_participant_id uuid references public.team_onboarding_participants(id) on delete cascade,
  principal_key text,
  role text not null,
  membership_state text not null default 'active',
  last_read_at timestamptz,
  archived_at timestamptz,
  muted_at timestamptz,
  unread_count integer not null default 0,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_conversation_participants_principal_type_check
    check (principal_type in ('rep', 'onboarding_guest', 'support_queue')),
  constraint workspace_conversation_participants_role_check
    check (role in ('requester', 'recipient', 'team_lead', 'onboarding_guest', 'support')),
  constraint workspace_conversation_participants_state_check
    check (membership_state in ('pending', 'active', 'declined', 'left', 'blocked')),
  constraint workspace_conversation_participants_unread_nonnegative
    check (unread_count >= 0),
  constraint workspace_conversation_participants_exact_identity_check check (
    (principal_type = 'rep' and rep_id is not null and team_onboarding_participant_id is null and principal_key is null)
    or (principal_type = 'onboarding_guest' and rep_id is null and team_onboarding_participant_id is not null and principal_key is null)
    or (principal_type = 'support_queue' and rep_id is null and team_onboarding_participant_id is null and principal_key = 'sparkle_suite_support')
  )
);

create unique index if not exists uq_workspace_conversation_participant_rep
  on public.workspace_conversation_participants(conversation_id, rep_id)
  where principal_type = 'rep';
create unique index if not exists uq_workspace_conversation_participant_guest
  on public.workspace_conversation_participants(conversation_id, team_onboarding_participant_id)
  where principal_type = 'onboarding_guest';
create unique index if not exists uq_workspace_conversation_participant_queue
  on public.workspace_conversation_participants(conversation_id, principal_key)
  where principal_type = 'support_queue';

create table if not exists public.workspace_conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.workspace_conversations(id) on delete cascade,
  sender_principal_type text not null,
  sender_identity_key text not null,
  sender_rep_id uuid references public.reps(id) on delete set null,
  sender_team_onboarding_participant_id uuid references public.team_onboarding_participants(id) on delete set null,
  sender_principal_key text,
  sender_display_name text not null,
  operator_actor_id text,
  kind text not null default 'message',
  body text not null,
  client_request_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  moderated_at timestamptz,
  moderation_reason text,
  moderated_by_actor text,
  created_at timestamptz not null default now(),
  constraint workspace_conversation_messages_sender_type_check
    check (sender_principal_type in ('rep', 'onboarding_guest', 'support_queue', 'system')),
  constraint workspace_conversation_messages_sender_identity_check check (
    (sender_principal_type = 'rep' and sender_rep_id is not null and sender_team_onboarding_participant_id is null and sender_principal_key is null)
    or (sender_principal_type = 'onboarding_guest' and sender_rep_id is null and sender_team_onboarding_participant_id is not null and sender_principal_key is null)
    or (sender_principal_type = 'support_queue' and sender_rep_id is null and sender_team_onboarding_participant_id is null and sender_principal_key = 'sparkle_suite_support')
    or (sender_principal_type = 'system' and sender_rep_id is null and sender_team_onboarding_participant_id is null and sender_principal_key = 'system')
  ),
  constraint workspace_conversation_messages_sender_key_not_blank
    check (btrim(sender_identity_key) <> ''),
  constraint workspace_conversation_messages_sender_name_check
    check (char_length(btrim(sender_display_name)) between 1 and 120),
  constraint workspace_conversation_messages_kind_check
    check (kind in ('message', 'system_status', 'moderation_notice')),
  constraint workspace_conversation_messages_body_check
    check (char_length(btrim(body)) between 1 and 10000),
  constraint workspace_conversation_messages_client_request_check
    check (char_length(btrim(client_request_id)) between 1 and 180),
  constraint workspace_conversation_messages_metadata_object
    check (jsonb_typeof(metadata) = 'object'),
  constraint workspace_conversation_messages_request_unique
    unique (conversation_id, sender_identity_key, client_request_id)
);

create table if not exists public.workspace_conversation_audit_events (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.workspace_conversations(id) on delete set null,
  message_id uuid references public.workspace_conversation_messages(id) on delete set null,
  actor_type text not null,
  actor_id text,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  constraint workspace_conversation_audit_actor_type_check
    check (actor_type in ('rep', 'onboarding_guest', 'support', 'operator', 'system', 'legacy')),
  constraint workspace_conversation_audit_event_check
    check (char_length(btrim(event_type)) between 1 and 100),
  constraint workspace_conversation_audit_details_object
    check (jsonb_typeof(details) = 'object')
);

create index if not exists idx_workspace_conversations_type_state_latest
  on public.workspace_conversations(conversation_type, state, last_message_at desc, id desc);
create index if not exists idx_workspace_conversations_creator_latest
  on public.workspace_conversations(created_by_rep_id, last_message_at desc, id desc);
create index if not exists idx_workspace_conversations_context
  on public.workspace_conversations(context_type, context_id)
  where context_type is not null;
create index if not exists idx_workspace_conversations_open_support_latest
  on public.workspace_conversations(last_message_at desc, id desc)
  where conversation_type = 'support' and state = 'open';
create index if not exists idx_workspace_conversations_pending_rep_latest
  on public.workspace_conversations(last_message_at desc, id desc)
  where conversation_type = 'rep_direct' and state = 'pending';
create index if not exists idx_workspace_conversation_participants_rep
  on public.workspace_conversation_participants(rep_id, membership_state, archived_at, conversation_id)
  where principal_type = 'rep';
create index if not exists idx_workspace_conversation_participants_guest
  on public.workspace_conversation_participants(team_onboarding_participant_id, conversation_id)
  where principal_type = 'onboarding_guest';
create index if not exists idx_workspace_conversation_messages_recent
  on public.workspace_conversation_messages(conversation_id, created_at desc, id desc);
create index if not exists idx_workspace_conversation_messages_sender_rate
  on public.workspace_conversation_messages(sender_rep_id, created_at desc)
  where sender_principal_type = 'rep';
create index if not exists idx_workspace_conversation_audit_recent
  on public.workspace_conversation_audit_events(conversation_id, created_at desc, id desc);

create or replace function public.update_workspace_conversation_after_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.workspace_conversations set
    last_message_at = new.created_at,
    latest_message_preview = pg_catalog.left(pg_catalog.regexp_replace(pg_catalog.btrim(new.body), '\s+', ' ', 'g'), 180),
    latest_message_sender_display_name = new.sender_display_name,
    updated_at = greatest(updated_at, new.created_at)
  where id = new.conversation_id;

  update public.workspace_conversation_participants participant set
    unread_count = participant.unread_count + 1,
    updated_at = greatest(participant.updated_at, new.created_at)
  where participant.conversation_id = new.conversation_id
    and participant.membership_state in ('pending', 'active')
    and coalesce((new.metadata ->> 'suppressUnread')::boolean, false) = false
    and not (
      (new.sender_principal_type = 'rep'
        and participant.rep_id is not distinct from new.sender_rep_id)
      or (new.sender_principal_type = 'onboarding_guest'
        and participant.team_onboarding_participant_id is not distinct from new.sender_team_onboarding_participant_id)
      or (new.sender_principal_type = 'support_queue'
        and participant.principal_type = 'support_queue'
        and participant.principal_key is not distinct from new.sender_principal_key)
      or (new.sender_principal_type = 'system'
        and participant.principal_type = 'support_queue')
    );
  return new;
end;
$$;

drop trigger if exists trg_workspace_conversation_after_message
  on public.workspace_conversation_messages;
create trigger trg_workspace_conversation_after_message
after insert on public.workspace_conversation_messages
for each row execute function public.update_workspace_conversation_after_message();

revoke all on function public.update_workspace_conversation_after_message()
  from public, anon, authenticated;

create or replace function public.workspace_current_rep_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select rep.id from public.reps rep where rep.auth_user_id = (select auth.uid()) limit 1
$$;

revoke all on function public.workspace_current_rep_id() from public, anon;
grant execute on function public.workspace_current_rep_id() to authenticated;

create or replace function public.workspace_rep_is_conversation_participant(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_conversation_participants participant
    where participant.conversation_id = p_conversation_id
      and participant.rep_id = (select public.workspace_current_rep_id())
      and participant.membership_state in ('pending', 'active')
  )
$$;

revoke all on function public.workspace_rep_is_conversation_participant(uuid) from public, anon;
grant execute on function public.workspace_rep_is_conversation_participant(uuid) to authenticated;

alter table public.workspace_conversations enable row level security;
alter table public.workspace_conversation_participants enable row level security;
alter table public.workspace_conversation_messages enable row level security;
alter table public.workspace_conversation_audit_events enable row level security;

create policy workspace_conversations_participant_read
  on public.workspace_conversations for select to authenticated
  using ((select public.workspace_rep_is_conversation_participant(workspace_conversations.id)));

create policy workspace_conversation_participants_member_read
  on public.workspace_conversation_participants for select to authenticated
  using ((select public.workspace_rep_is_conversation_participant(workspace_conversation_participants.conversation_id)));

create policy workspace_conversation_participants_own_state_update
  on public.workspace_conversation_participants for update to authenticated
  using (rep_id = (select public.workspace_current_rep_id()))
  with check (rep_id = (select public.workspace_current_rep_id()));

create policy workspace_conversation_messages_member_read
  on public.workspace_conversation_messages for select to authenticated
  using ((select public.workspace_rep_is_conversation_participant(workspace_conversation_messages.conversation_id)));

revoke all on public.workspace_conversations from anon, authenticated;
revoke all on public.workspace_conversation_participants from anon, authenticated;
revoke all on public.workspace_conversation_messages from anon, authenticated;
revoke all on public.workspace_conversation_audit_events from anon, authenticated;
grant select on public.workspace_conversations to authenticated;
grant select on public.workspace_conversation_participants to authenticated;
grant update (last_read_at, archived_at, muted_at) on public.workspace_conversation_participants to authenticated;
grant select on public.workspace_conversation_messages to authenticated;

comment on table public.workspace_conversations is
  'Canonical private Team, Support, and Rep Network conversation headers; separate from official publications.';
comment on table public.workspace_conversation_messages is
  'Immutable private messages with per-sender retry idempotency; no rep edit or delete surface.';

notify pgrst, 'reload schema';
