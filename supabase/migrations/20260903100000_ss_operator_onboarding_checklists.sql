-- Durable, operator-only onboarding launch ledger. This is deliberately
-- separate from rep self-serve onboarding and never stores customer answers.
create table if not exists public.operator_onboarding_checklist_items (
  id uuid primary key default gen_random_uuid(),
  rep_id uuid not null references public.reps(id) on delete cascade,
  item_key text not null check (char_length(trim(item_key)) between 1 and 100),
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'waiting_on_rep', 'blocked', 'complete', 'not_applicable')),
  evidence_summary text check (evidence_summary is null or char_length(evidence_summary) <= 1200),
  updated_by_rep_id uuid references public.reps(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rep_id, item_key)
);

create index if not exists idx_operator_onboarding_checklist_items_rep_updated
  on public.operator_onboarding_checklist_items(rep_id, updated_at desc);

alter table public.operator_onboarding_checklist_items enable row level security;

create policy "operator_onboarding_checklist_items_service_role_only"
  on public.operator_onboarding_checklist_items for all to service_role
  using (true) with check (true);

grant select, insert, update, delete on public.operator_onboarding_checklist_items to service_role;
