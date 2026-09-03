-- The dedicated Lane accounting MCP may provide expected recurring expenses
-- separately from confirmed paid expenses. This remains aggregate-only and
-- append-only: corrections are new snapshots, never updates to history.
alter table public.accounting_monthly_snapshots
  add column if not exists projected_expenses_cents bigint;

comment on column public.accounting_monthly_snapshots.projected_expenses_cents is
  'Aggregate expected recurring expenses for the period, supplied by the Lane accounting connector.';
