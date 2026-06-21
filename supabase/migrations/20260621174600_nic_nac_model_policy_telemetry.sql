alter table public.nic_nac_runs
  add column if not exists model_policy text,
  add column if not exists model_provider text,
  add column if not exists reasoning_level text,
  add column if not exists product text,
  add column if not exists surface text,
  add column if not exists actor_type text,
  add column if not exists account_tier text,
  add column if not exists linked_human_id text,
  add column if not exists product_context jsonb not null default '{}'::jsonb,
  add column if not exists memory_card_count integer not null default 0 check (
    memory_card_count >= 0
  ),
  add column if not exists blocked_memory_card_count integer not null default 0 check (
    blocked_memory_card_count >= 0
  ),
  add column if not exists memory_scopes text[] not null default '{}',
  add column if not exists memory_context_truncated boolean not null default false,
  add column if not exists estimated_cost_cents integer check (
    estimated_cost_cents is null or estimated_cost_cents >= 0
  );

create index if not exists idx_nic_nac_runs_model_policy_created
  on public.nic_nac_runs(model_policy, created_at desc)
  where model_policy is not null;

create index if not exists idx_nic_nac_runs_product_surface_created
  on public.nic_nac_runs(product, surface, created_at desc)
  where product is not null;

create index if not exists idx_nic_nac_runs_linked_human_created
  on public.nic_nac_runs(linked_human_id, created_at desc)
  where linked_human_id is not null;

alter table public.tool_executions
  add column if not exists run_id uuid;

create index if not exists idx_tool_executions_run_id
  on public.tool_executions(run_id)
  where run_id is not null;

notify pgrst, 'reload schema';
