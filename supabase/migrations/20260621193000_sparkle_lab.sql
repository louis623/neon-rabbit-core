create table if not exists public.sparkle_lab_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null check (run_type in ('weekly', 'manual', 'urgent')),
  status text not null check (
    status in ('queued', 'running', 'completed', 'stopped_by_limit', 'failed')
  ),
  started_at timestamptz,
  completed_at timestamptz,
  cost_cap_cents integer not null check (cost_cap_cents >= 0),
  monthly_scheduled_cap_cents integer check (
    monthly_scheduled_cap_cents is null or monthly_scheduled_cap_cents >= 0
  ),
  estimated_cost_cents integer not null default 0 check (estimated_cost_cents >= 0),
  model_call_cap integer not null check (model_call_cap >= 0),
  model_call_count integer not null default 0 check (model_call_count >= 0),
  premium_call_cap integer not null check (premium_call_cap >= 0),
  premium_call_count integer not null default 0 check (premium_call_count >= 0),
  runtime_cap_seconds integer not null check (runtime_cap_seconds >= 0),
  candidate_record_cap integer not null check (candidate_record_cap >= 0),
  candidate_record_count integer not null default 0 check (candidate_record_count >= 0),
  deep_item_cap integer not null check (deep_item_cap >= 0),
  deep_item_count integer not null default 0 check (deep_item_count >= 0),
  headline_finding_cap integer not null check (headline_finding_cap >= 0),
  headline_finding_count integer not null default 0 check (headline_finding_count >= 0),
  active_priority_cap integer not null check (active_priority_cap >= 0),
  active_priority_count integer not null default 0 check (active_priority_count >= 0),
  limits_hit text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sparkle_lab_findings (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.sparkle_lab_runs(id) on delete cascade,
  section text not null check (
    section in (
      'nic_nac_lab',
      'sparkle_suite_lab',
      'sparkle_finder_lab',
      'ops_lab',
      'research_desk'
    )
  ),
  severity text not null check (severity in ('low', 'medium', 'high', 'urgent')),
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  title text not null,
  summary text not null,
  recommended_action text not null,
  impact_score integer not null default 0,
  effort_score integer not null default 0,
  priority_rank integer,
  source_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.sparkle_lab_artifacts (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.sparkle_lab_runs(id) on delete cascade,
  section text not null check (
    section in (
      'nic_nac_lab',
      'sparkle_suite_lab',
      'sparkle_finder_lab',
      'ops_lab',
      'research_desk'
    )
  ),
  artifact_type text not null check (
    artifact_type in ('report', 'replay_case', 'research_brief', 'recommendation', 'lab_note')
  ),
  title text not null,
  body_markdown text not null default '',
  source_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_sparkle_lab_runs_created
  on public.sparkle_lab_runs(created_at desc);

create index if not exists idx_sparkle_lab_runs_status_created
  on public.sparkle_lab_runs(status, created_at desc);

create index if not exists idx_sparkle_lab_findings_run_priority
  on public.sparkle_lab_findings(run_id, priority_rank nulls last, created_at desc);

create index if not exists idx_sparkle_lab_findings_section_created
  on public.sparkle_lab_findings(section, created_at desc);

create index if not exists idx_sparkle_lab_artifacts_run_created
  on public.sparkle_lab_artifacts(run_id, created_at desc);

alter table public.sparkle_lab_runs enable row level security;
alter table public.sparkle_lab_findings enable row level security;
alter table public.sparkle_lab_artifacts enable row level security;

drop policy if exists "sparkle_lab_runs_service_role_only" on public.sparkle_lab_runs;
create policy "sparkle_lab_runs_service_role_only"
  on public.sparkle_lab_runs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "sparkle_lab_findings_service_role_only" on public.sparkle_lab_findings;
create policy "sparkle_lab_findings_service_role_only"
  on public.sparkle_lab_findings
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "sparkle_lab_artifacts_service_role_only" on public.sparkle_lab_artifacts;
create policy "sparkle_lab_artifacts_service_role_only"
  on public.sparkle_lab_artifacts
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

notify pgrst, 'reload schema';
