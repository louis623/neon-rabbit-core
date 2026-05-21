create table public.sparkle_suite_launch_builds (
  id uuid primary key default gen_random_uuid(),
  waitlist_id uuid references public.sparkle_suite_waitlist(id) on delete set null,
  intake_submission_id uuid references public.sparkle_suite_intake_submissions(id) on delete set null,
  rep_id uuid references public.reps(id) on delete set null,
  operator_rep_id uuid references public.reps(id) on delete set null,
  stage text not null default 'draft',
  status text not null default 'blocked',
  lead_name text not null,
  lead_email text not null,
  setup_profile_status text not null default 'not_started',
  payment_gate_status text not null default 'disabled',
  agreement_gate_status text not null default 'disabled',
  build_check_status text not null default 'not_started',
  production_roster_status text not null default 'not_started',
  blockers text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sparkle_suite_launch_builds_stage_check
    check (stage in ('draft', 'setup_profile', 'building', 'checks', 'ready_for_launch', 'launched', 'closed')),
  constraint sparkle_suite_launch_builds_status_check
    check (status in ('blocked', 'active', 'ready', 'closed')),
  constraint sparkle_suite_launch_builds_setup_profile_status_check
    check (setup_profile_status in ('not_started', 'drafted', 'ready')),
  constraint sparkle_suite_launch_builds_payment_gate_status_check
    check (payment_gate_status in ('not_started', 'disabled', 'ready')),
  constraint sparkle_suite_launch_builds_agreement_gate_status_check
    check (agreement_gate_status in ('not_started', 'disabled', 'ready')),
  constraint sparkle_suite_launch_builds_build_check_status_check
    check (build_check_status in ('not_started', 'passed')),
  constraint sparkle_suite_launch_builds_production_roster_status_check
    check (production_roster_status in ('not_started', 'connected')),
  constraint sparkle_suite_launch_builds_subject_check
    check (waitlist_id is not null or intake_submission_id is not null)
);

create index idx_sparkle_suite_launch_builds_updated_at
  on public.sparkle_suite_launch_builds(updated_at desc);

create index idx_sparkle_suite_launch_builds_waitlist
  on public.sparkle_suite_launch_builds(waitlist_id)
  where waitlist_id is not null;

create index idx_sparkle_suite_launch_builds_intake
  on public.sparkle_suite_launch_builds(intake_submission_id)
  where intake_submission_id is not null;

alter table public.sparkle_suite_launch_builds enable row level security;

revoke all on table public.sparkle_suite_launch_builds from anon, authenticated;
grant select, insert, update on table public.sparkle_suite_launch_builds to service_role;
