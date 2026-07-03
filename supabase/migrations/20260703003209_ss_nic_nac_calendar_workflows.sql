create table if not exists public.nic_nac_calendar_workflows (
  id uuid primary key default gen_random_uuid(),
  rep_id uuid not null references public.reps(id) on delete cascade,
  conversation_id uuid not null,
  workflow_type text not null default 'calendar_event_work',
  status text not null default 'active',
  phase text not null default 'started',
  intent text,
  known_fields jsonb not null default '{}'::jsonb,
  missing_fields text[] not null default '{}'::text[],
  candidate_event_ids uuid[] not null default '{}'::uuid[],
  last_user_message_id text,
  expires_at timestamptz not null default (now() + interval '2 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nic_nac_calendar_workflows_type_check
    check (workflow_type = 'calendar_event_work'),
  constraint nic_nac_calendar_workflows_status_check
    check (status in ('active', 'completed', 'cancelled', 'expired', 'needs_human_review')),
  constraint nic_nac_calendar_workflows_phase_check
    check (phase in (
      'started',
      'identify_existing_event',
      'details_capture',
      'ready_to_add',
      'ready_to_update',
      'ready_to_cancel',
      'ready_for_reminder_settings',
      'completed',
      'cancelled',
      'needs_human_review'
    ))
);

create index if not exists idx_nic_nac_calendar_workflows_active
  on public.nic_nac_calendar_workflows(rep_id, conversation_id, expires_at desc)
  where status = 'active';

create index if not exists idx_nic_nac_calendar_workflows_created
  on public.nic_nac_calendar_workflows(created_at desc);

alter table public.nic_nac_calendar_workflows enable row level security;

drop policy if exists "nic_nac_calendar_workflows_own_data"
  on public.nic_nac_calendar_workflows;

create policy "nic_nac_calendar_workflows_own_data"
  on public.nic_nac_calendar_workflows
  for all
  to authenticated
  using (rep_id = (select id from public.reps where auth_user_id = auth.uid()))
  with check (rep_id = (select id from public.reps where auth_user_id = auth.uid()));

drop policy if exists "nic_nac_calendar_workflows_admin_full_access"
  on public.nic_nac_calendar_workflows;

create policy "nic_nac_calendar_workflows_admin_full_access"
  on public.nic_nac_calendar_workflows
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.reps
      where auth_user_id = auth.uid()
        and email = 'louis@neonrabbit.net'
    )
  )
  with check (
    exists (
      select 1
      from public.reps
      where auth_user_id = auth.uid()
        and email = 'louis@neonrabbit.net'
    )
  );
