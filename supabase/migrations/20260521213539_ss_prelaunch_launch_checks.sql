create table public.sparkle_suite_launch_checks (
  id uuid primary key default gen_random_uuid(),
  launch_build_id uuid not null references public.sparkle_suite_launch_builds(id) on delete cascade,
  check_key text not null,
  label text not null,
  status text not null default 'not_started',
  notes text not null default '',
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sparkle_suite_launch_checks_status_check
    check (status in ('not_started', 'blocked', 'passed')),
  constraint sparkle_suite_launch_checks_key_check
    check (check_key in (
      'setup_profile_ready',
      'site_shell_review',
      'demo_account_review',
      'operator_final_review'
    )),
  constraint sparkle_suite_launch_checks_build_key_unique
    unique (launch_build_id, check_key)
);

create index idx_sparkle_suite_launch_checks_build
  on public.sparkle_suite_launch_checks(launch_build_id);

drop trigger if exists trg_sparkle_suite_launch_checks_updated_at
  on public.sparkle_suite_launch_checks;
create trigger trg_sparkle_suite_launch_checks_updated_at
  before update on public.sparkle_suite_launch_checks
  for each row execute function public.update_updated_at_column();

alter table public.sparkle_suite_launch_checks enable row level security;

revoke all on table public.sparkle_suite_launch_checks from anon, authenticated;
grant select, insert, update, delete on table public.sparkle_suite_launch_checks to service_role;
