alter table public.sparkle_suite_waitlist
  add column if not exists intake_submission_id uuid
    references public.sparkle_suite_intake_submissions(id) on delete set null,
  add column if not exists handoff_status text not null default 'not_started',
  add column if not exists warmup_status text not null default 'not_started',
  add column if not exists warmup_started_at timestamptz,
  add column if not exists warmup_completed_at timestamptz,
  add column if not exists handoff_notes text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.sparkle_suite_intake_submissions
  add column if not exists waitlist_id uuid
    references public.sparkle_suite_waitlist(id) on delete set null,
  add column if not exists scout_input_status text not null default 'not_ready',
  add column if not exists scout_input jsonb,
  add column if not exists scout_input_generated_at timestamptz,
  add column if not exists handoff_status text not null default 'not_started',
  add column if not exists warmup_sequence_status text not null default 'not_started';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sparkle_suite_waitlist_handoff_status_check'
      and conrelid = 'public.sparkle_suite_waitlist'::regclass
  ) then
    alter table public.sparkle_suite_waitlist
      add constraint sparkle_suite_waitlist_handoff_status_check
      check (handoff_status in ('not_started', 'intake_started', 'intake_received', 'reviewing', 'converted', 'closed'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'sparkle_suite_waitlist_warmup_status_check'
      and conrelid = 'public.sparkle_suite_waitlist'::regclass
  ) then
    alter table public.sparkle_suite_waitlist
      add constraint sparkle_suite_waitlist_warmup_status_check
      check (warmup_status in ('not_started', 'welcome_sent', 'active', 'paused', 'completed', 'failed'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'sparkle_suite_intake_scout_input_status_check'
      and conrelid = 'public.sparkle_suite_intake_submissions'::regclass
  ) then
    alter table public.sparkle_suite_intake_submissions
      add constraint sparkle_suite_intake_scout_input_status_check
      check (scout_input_status in ('not_ready', 'ready', 'generated', 'blocked'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'sparkle_suite_intake_handoff_status_check'
      and conrelid = 'public.sparkle_suite_intake_submissions'::regclass
  ) then
    alter table public.sparkle_suite_intake_submissions
      add constraint sparkle_suite_intake_handoff_status_check
      check (handoff_status in ('not_started', 'reviewing', 'scout_ready', 'meeting_ready', 'converted', 'closed'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'sparkle_suite_intake_warmup_sequence_status_check'
      and conrelid = 'public.sparkle_suite_intake_submissions'::regclass
  ) then
    alter table public.sparkle_suite_intake_submissions
      add constraint sparkle_suite_intake_warmup_sequence_status_check
      check (warmup_sequence_status in ('not_started', 'intake_received', 'active', 'paused', 'completed', 'failed'));
  end if;
end $$;

create index if not exists idx_sparkle_suite_waitlist_intake_submission
  on public.sparkle_suite_waitlist(intake_submission_id)
  where intake_submission_id is not null;

create index if not exists idx_sparkle_suite_intake_waitlist
  on public.sparkle_suite_intake_submissions(waitlist_id)
  where waitlist_id is not null;

create index if not exists idx_sparkle_suite_intake_scout_input
  on public.sparkle_suite_intake_submissions(scout_input_status, created_at desc);

create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  run_key text not null unique,
  agent_name text not null,
  agent_kind text not null,
  subject_type text,
  subject_id uuid,
  rep_id uuid references public.reps(id) on delete set null,
  intake_submission_id uuid references public.sparkle_suite_intake_submissions(id) on delete set null,
  waitlist_id uuid references public.sparkle_suite_waitlist(id) on delete set null,
  status text not null default 'queued'
    check (status in ('queued','running','completed','failed','cancelled','skipped')),
  trigger_source text not null default 'manual',
  model text,
  input_tokens integer,
  output_tokens integer,
  duration_ms integer,
  summary text,
  error_message text,
  input jsonb,
  output jsonb,
  metadata jsonb not null default '{}'::jsonb,
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_agent_runs_agent_created
  on public.agent_runs(agent_name, created_at desc);

create index idx_agent_runs_status_created
  on public.agent_runs(status, created_at desc);

create index idx_agent_runs_intake_created
  on public.agent_runs(intake_submission_id, created_at desc)
  where intake_submission_id is not null;

create index idx_agent_runs_waitlist_created
  on public.agent_runs(waitlist_id, created_at desc)
  where waitlist_id is not null;

alter table public.agent_runs enable row level security;

revoke all on table public.agent_runs from anon, authenticated;
grant select, insert, update on table public.agent_runs to service_role;
