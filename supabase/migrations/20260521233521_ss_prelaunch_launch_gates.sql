create table public.sparkle_suite_launch_gates (
  id uuid primary key default gen_random_uuid(),
  launch_build_id uuid not null references public.sparkle_suite_launch_builds(id) on delete cascade,
  gate_key text not null,
  label text not null,
  mode text not null,
  status text not null default 'disabled',
  notes text not null default '',
  updated_by_rep_id uuid references public.reps(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sparkle_suite_launch_gates_key_check
    check (gate_key in ('payment', 'agreement')),
  constraint sparkle_suite_launch_gates_mode_check
    check (mode in ('test', 'sandbox')),
  constraint sparkle_suite_launch_gates_status_check
    check (status in ('disabled', 'ready')),
  constraint sparkle_suite_launch_gates_build_key_unique
    unique (launch_build_id, gate_key)
);

create index idx_sparkle_suite_launch_gates_build
  on public.sparkle_suite_launch_gates(launch_build_id);

drop trigger if exists trg_sparkle_suite_launch_gates_updated_at
  on public.sparkle_suite_launch_gates;
create trigger trg_sparkle_suite_launch_gates_updated_at
  before update on public.sparkle_suite_launch_gates
  for each row execute function public.update_updated_at_column();

alter table public.sparkle_suite_launch_gates enable row level security;

revoke all on table public.sparkle_suite_launch_gates from anon, authenticated;
grant select, insert, update, delete on table public.sparkle_suite_launch_gates to service_role;
