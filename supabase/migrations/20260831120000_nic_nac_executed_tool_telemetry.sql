alter table public.nic_nac_runs
  add column if not exists executed_tool_names text[] not null default '{}',
  add column if not exists executed_tool_count integer not null default 0
    check (executed_tool_count >= 0),
  add column if not exists tool_failure_count integer not null default 0
    check (tool_failure_count >= 0),
  add column if not exists tool_failures jsonb not null default '[]'::jsonb;

comment on column public.nic_nac_runs.tool_names is
  'Tools made available to the model for this run.';

comment on column public.nic_nac_runs.executed_tool_names is
  'Tools that actually returned an output during this run.';

comment on column public.nic_nac_runs.tool_failures is
  'Structured failures returned by executed tools; customer-visible recovery may still complete.';
