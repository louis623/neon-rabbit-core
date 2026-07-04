create table if not exists public.nic_nac_trade_workflows (
  id uuid primary key default gen_random_uuid(),
  rep_id uuid not null references public.reps(id) on delete cascade,
  conversation_id uuid not null,
  workflow_type text not null,
  status text not null default 'active',
  phase text not null default 'started',
  intent text,
  known_fields jsonb not null default '{}'::jsonb,
  missing_fields text[] not null default '{}'::text[],
  blockers text[] not null default '{}'::text[],
  candidates jsonb not null default '[]'::jsonb,
  approval_state text not null default 'not_required',
  db_assertions jsonb not null default '{}'::jsonb,
  public_proof jsonb not null default '{}'::jsonb,
  created_mutation_ids jsonb not null default '[]'::jsonb,
  last_user_message_id text,
  expires_at timestamptz not null default (now() + interval '2 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nic_nac_trade_workflows_type_check
    check (workflow_type in (
      'trade_board_add_listing',
      'trade_board_remove_listing',
      'trade_request_decision',
      'trade_swap_capture',
      'trade_swap_cleanup',
      'trade_fulfillment_update',
      'trade_catalog_correction'
    )),
  constraint nic_nac_trade_workflows_status_check
    check (status in ('active', 'completed', 'cancelled', 'expired', 'needs_human_review')),
  constraint nic_nac_trade_workflows_phase_check
    check (phase in (
      'started',
      'identify_target',
      'details_capture',
      'photo_capture',
      'approval_required',
      'ready_to_add',
      'ready_to_remove',
      'ready_to_approve',
      'ready_to_reject',
      'ready_to_update',
      'ready_to_report',
      'mutating',
      'completed',
      'cancelled',
      'needs_human_review'
    )),
  constraint nic_nac_trade_workflows_approval_state_check
    check (approval_state in ('not_required', 'required', 'approved', 'denied'))
);

create index if not exists idx_nic_nac_trade_workflows_active
  on public.nic_nac_trade_workflows(rep_id, conversation_id, expires_at desc)
  where status = 'active';

create index if not exists idx_nic_nac_trade_workflows_type_active
  on public.nic_nac_trade_workflows(rep_id, workflow_type, expires_at desc)
  where status = 'active';

create index if not exists idx_nic_nac_trade_workflows_created
  on public.nic_nac_trade_workflows(created_at desc);

alter table public.nic_nac_trade_workflows enable row level security;

drop policy if exists "nic_nac_trade_workflows_own_data"
  on public.nic_nac_trade_workflows;

create policy "nic_nac_trade_workflows_own_data"
  on public.nic_nac_trade_workflows
  for all
  to authenticated
  using (rep_id = (select id from public.reps where auth_user_id = auth.uid()))
  with check (rep_id = (select id from public.reps where auth_user_id = auth.uid()));

drop policy if exists "nic_nac_trade_workflows_admin_full_access"
  on public.nic_nac_trade_workflows;

create policy "nic_nac_trade_workflows_admin_full_access"
  on public.nic_nac_trade_workflows
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.reps
      where auth_user_id = auth.uid()
        and email = 'louis@neonrabbit.net'
    )
  )
  with check (
    exists (
      select 1
      from public.reps
      where auth_user_id = auth.uid()
        and email = 'louis@neonrabbit.net'
    )
  );

grant select on table public.nic_nac_trade_workflows to authenticated;
grant select, insert, update, delete on table public.nic_nac_trade_workflows to service_role;
