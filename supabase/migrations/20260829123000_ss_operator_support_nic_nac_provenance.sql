-- Isolate operator-support Nic-Nac turns from a rep's ordinary conversation
-- history and preserve the human actor behind every support turn.

alter table public.nic_nac_conversations
  add column if not exists support_session_id uuid
    references public.operator_support_sessions(id) on delete restrict,
  add column if not exists source_actor_type text not null default 'rep',
  add column if not exists source_actor_rep_id uuid
    references public.reps(id) on delete restrict;

alter table public.nic_nac_conversations
  drop constraint if exists nic_nac_conversations_source_actor_check,
  add constraint nic_nac_conversations_source_actor_check check (
    (support_session_id is null and source_actor_type = 'rep' and source_actor_rep_id is null)
    or
    (support_session_id is not null and source_actor_type = 'operator_support' and source_actor_rep_id is not null)
  );

create index if not exists idx_nic_nac_conversations_support_session
  on public.nic_nac_conversations (support_session_id, created_at, id)
  where support_session_id is not null;

create or replace function public.guard_operator_support_nic_nac_provenance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.operator_support_sessions%rowtype;
begin
  if new.support_session_id is null then
    if exists (
      select 1 from public.operator_support_sessions s
      where s.id = new.conversation_id
    ) then
      raise exception 'support conversation ids cannot be used as rep conversations';
    end if;
    return new;
  end if;

  select * into v_session
  from public.operator_support_sessions s
  where s.id = new.support_session_id;
  if not found
    or new.conversation_id <> v_session.id
    or new.rep_id <> v_session.target_rep_id
    or new.source_actor_rep_id <> v_session.operator_rep_id
  then
    raise exception 'invalid operator support conversation provenance';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_operator_support_nic_nac_provenance
  on public.nic_nac_conversations;
create trigger guard_operator_support_nic_nac_provenance
before insert or update on public.nic_nac_conversations
for each row execute function public.guard_operator_support_nic_nac_provenance();

alter table public.approval_events
  add column if not exists support_session_id uuid
    references public.operator_support_sessions(id) on delete restrict,
  add column if not exists source_actor_rep_id uuid
    references public.reps(id) on delete restrict;

alter table public.approval_events
  drop constraint if exists approval_events_support_actor_check,
  add constraint approval_events_support_actor_check check (
    (support_session_id is null and source_actor_rep_id is null)
    or
    (support_session_id is not null and source_actor_rep_id is not null)
  );

create or replace function public.guard_operator_support_approval_provenance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.operator_support_sessions%rowtype;
begin
  if new.support_session_id is null then
    if exists (select 1 from public.operator_support_sessions s where s.id = new.conversation_id) then
      raise exception 'support conversation ids cannot be used for rep approvals';
    end if;
    return new;
  end if;
  select * into v_session from public.operator_support_sessions s
  where s.id = new.support_session_id;
  if not found
    or new.conversation_id <> v_session.id
    or new.rep_id <> v_session.target_rep_id
    or new.source_actor_rep_id <> v_session.operator_rep_id
  then
    raise exception 'invalid operator support approval provenance';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_operator_support_approval_provenance
  on public.approval_events;
create trigger guard_operator_support_approval_provenance
before insert or update on public.approval_events
for each row execute function public.guard_operator_support_approval_provenance();

drop policy if exists nic_nac_conv_own_data on public.nic_nac_conversations;
create policy nic_nac_conv_own_data on public.nic_nac_conversations
  for all
  using (
    support_session_id is null
    and rep_id = (select id from public.reps where auth_user_id = auth.uid())
  )
  with check (
    support_session_id is null
    and rep_id = (select id from public.reps where auth_user_id = auth.uid())
  );

drop policy if exists nic_nac_conv_admin_full_access on public.nic_nac_conversations;
create policy nic_nac_conv_admin_full_access on public.nic_nac_conversations
  for all
  using (
    support_session_id is null
    and exists (
      select 1 from public.reps
      where auth_user_id = auth.uid() and email = 'louis@neonrabbit.net'
    )
  )
  with check (
    support_session_id is null
    and exists (
      select 1 from public.reps
      where auth_user_id = auth.uid() and email = 'louis@neonrabbit.net'
    )
  );

drop policy if exists approval_events_own_data on public.approval_events;
create policy approval_events_own_data on public.approval_events
  for all
  using (
    support_session_id is null
    and rep_id = (select id from public.reps where auth_user_id = auth.uid())
  )
  with check (
    support_session_id is null
    and rep_id = (select id from public.reps where auth_user_id = auth.uid())
  );

drop policy if exists approval_events_admin_full_access on public.approval_events;
create policy approval_events_admin_full_access on public.approval_events
  for all
  using (
    support_session_id is null
    and exists (
      select 1 from public.reps
      where auth_user_id = auth.uid() and email = 'louis@neonrabbit.net'
    )
  )
  with check (
    support_session_id is null
    and exists (
      select 1 from public.reps
      where auth_user_id = auth.uid() and email = 'louis@neonrabbit.net'
    )
  );

revoke all on function public.guard_operator_support_nic_nac_provenance()
  from public, anon, authenticated;
revoke all on function public.guard_operator_support_approval_provenance()
  from public, anon, authenticated;
