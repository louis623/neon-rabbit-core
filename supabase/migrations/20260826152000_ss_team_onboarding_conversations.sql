-- Idempotently mirror legacy New Rep Onboarding threads into canonical conversations.

alter table public.team_onboarding_participants
  add column if not exists workspace_conversation_id uuid
    references public.workspace_conversations(id) on delete set null;
create unique index if not exists uq_team_onboarding_workspace_conversation
  on public.team_onboarding_participants(workspace_conversation_id)
  where workspace_conversation_id is not null;

do $$
declare
  participant record;
  v_conversation_id uuid;
begin
  for participant in
    select p.* from public.team_onboarding_participants p
    where p.status <> 'archived' and p.archived_at is null
    order by p.created_at, p.id
  loop
    v_conversation_id := participant.workspace_conversation_id;
    if v_conversation_id is null then
      insert into public.workspace_conversations (
        conversation_type, state, subject, created_by_rep_id, context_type,
        context_id, context_snapshot, last_message_at, created_at, updated_at
      ) values (
        'team_onboarding', 'open', 'New Rep Onboarding: ' || participant.display_name,
        participant.owner_rep_id, 'team_onboarding_participant', participant.id::text,
        jsonb_build_object('participantName', participant.display_name),
        coalesce(participant.last_activity_at, participant.created_at, now()),
        coalesce(participant.created_at, now()), coalesce(participant.updated_at, now())
      ) returning id into v_conversation_id;
      update public.team_onboarding_participants
        set workspace_conversation_id = v_conversation_id
        where id = participant.id and workspace_conversation_id is null;
    end if;

    insert into public.workspace_conversation_participants (
      conversation_id, principal_type, rep_id, role, membership_state, joined_at
    ) values (
      v_conversation_id, 'rep', participant.owner_rep_id, 'team_lead', 'active',
      coalesce(participant.created_at, now())
    ) on conflict do nothing;

    insert into public.workspace_conversation_participants (
      conversation_id, principal_type, team_onboarding_participant_id,
      role, membership_state, joined_at
    ) values (
      v_conversation_id, 'onboarding_guest', participant.id,
      'onboarding_guest', 'active', coalesce(participant.created_at, now())
    ) on conflict do nothing;

    insert into public.workspace_conversation_messages (
      conversation_id, sender_principal_type, sender_identity_key,
      sender_rep_id, sender_team_onboarding_participant_id, sender_display_name,
      kind, body, client_request_id, metadata, created_at
    )
    select
      v_conversation_id,
      case legacy.sender_type when 'team_lead' then 'rep' else 'onboarding_guest' end,
      case legacy.sender_type when 'team_lead' then 'rep:' || participant.owner_rep_id::text else 'guest:' || participant.id::text end,
      case legacy.sender_type when 'team_lead' then participant.owner_rep_id else null end,
      case legacy.sender_type when 'participant' then participant.id else null end,
      case legacy.sender_type when 'team_lead' then 'Team lead' else participant.display_name end,
      'message', legacy.body, 'legacy-team-onboarding:' || legacy.id::text,
      jsonb_build_object('legacySourceTable', 'team_onboarding_messages', 'legacySourceId', legacy.id),
      coalesce(legacy.created_at, now())
    from public.team_onboarding_messages legacy
    where legacy.participant_id = participant.id
    order by legacy.created_at, legacy.id
    on conflict (conversation_id, sender_identity_key, client_request_id) do nothing;

    update public.workspace_conversation_participants cp set
      last_read_at = reads.last_read_at,
      unread_count = (
        select count(*)::integer
        from public.team_onboarding_messages unread
        where unread.participant_id = participant.id
          and unread.sender_type = 'participant'
          and (reads.last_read_at is null or unread.created_at > reads.last_read_at)
      )
    from (
      select max(legacy.read_at) as last_read_at
      from public.team_onboarding_messages legacy
      where legacy.participant_id = participant.id and legacy.read_at is not null
    ) reads
    where cp.conversation_id = v_conversation_id
      and cp.rep_id = participant.owner_rep_id;

    insert into public.workspace_conversation_audit_events (
      conversation_id, actor_type, actor_id, event_type, details, idempotency_key
    ) values (
      v_conversation_id, 'legacy', participant.id::text,
      'team_onboarding_thread_backfilled',
      jsonb_build_object('participantId', participant.id),
      'team-onboarding-backfill:' || participant.id::text
    ) on conflict (idempotency_key) do nothing;
  end loop;
end $$;

create index if not exists idx_team_onboarding_participants_conversation
  on public.team_onboarding_participants(workspace_conversation_id)
  where workspace_conversation_id is not null;

notify pgrst, 'reload schema';
