-- Correct unread routing for nullable participant identity columns.
-- SQL's three-valued NULL logic caused the original series of NOT predicates
-- to exclude participants whose unrelated identity columns were NULL.

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

revoke all on function public.update_workspace_conversation_after_message()
  from public, anon, authenticated;

notify pgrst, 'reload schema';
