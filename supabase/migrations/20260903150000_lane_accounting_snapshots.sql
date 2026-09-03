-- Append-only, aggregate-only accounting snapshots supplied by the dedicated
-- Lane connector. No customer, transaction, banking, or provider-object data
-- belongs in this ledger.
create table if not exists public.accounting_monthly_snapshots (
  id uuid primary key default gen_random_uuid(),
  schema_version smallint not null default 1 check (schema_version = 1),
  product text not null check (product in ('suite', 'finder')),
  period_start date not null,
  period_end_exclusive date not null,
  as_of timestamptz not null,
  recorded_at timestamptz not null default now(),
  recorded_by text not null check (recorded_by = 'lane'),
  reason text not null check (reason in ('initial', 'correction', 'restatement')),
  source_status jsonb not null,
  money_basis jsonb not null,
  active_client_count integer,
  past_due_client_count integer,
  cancelled_client_count integer,
  projected_recurring_cents bigint,
  actual_collected_cents bigint,
  refunds_cents bigint,
  credits_cents bigint,
  disputes_cents bigint,
  past_due_balance_cents bigint,
  processor_available_cents bigint,
  payouts_in_transit_cents bigint,
  expenses_cents bigint,
  net_cents bigint,
  check (period_end_exclusive > period_start),
  check (active_client_count is null or active_client_count >= 0),
  check (past_due_client_count is null or past_due_client_count >= 0),
  check (cancelled_client_count is null or cancelled_client_count >= 0)
);

create index if not exists accounting_monthly_snapshots_latest_idx
  on public.accounting_monthly_snapshots (product, period_start, recorded_at desc);

alter table public.accounting_monthly_snapshots enable row level security;

comment on table public.accounting_monthly_snapshots is
  'Append-only aggregate monthly accounting snapshots from the Lane-only connector; no individual customer or transaction data.';
