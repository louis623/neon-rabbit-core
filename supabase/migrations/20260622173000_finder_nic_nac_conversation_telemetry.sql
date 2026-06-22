create table if not exists public.sparkle_finder_nic_nac_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_type text not null check (actor_type in ('collector', 'linked_rep')),
  account_tier text not null check (account_tier in ('free', 'silver')),
  linked_suite_rep_id text,
  linked_suite_business_name text,
  source text not null default 'finder_nic_nac',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz
);

create table if not exists public.sparkle_finder_nic_nac_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.sparkle_finder_nic_nac_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null default '',
  parts jsonb not null default '[]'::jsonb,
  source_message_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.sparkle_finder_nic_nac_runs (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.sparkle_finder_nic_nac_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('started', 'completed', 'failed', 'redirected')),
  outcome text,
  model_provider text,
  model_name text,
  model_policy_key text,
  reasoning_effort text,
  requested_intents text[] not null default '{}',
  allowed_intents text[] not null default '{}',
  blocked_intents text[] not null default '{}',
  active_tools text[] not null default '{}',
  actor_type text not null check (actor_type in ('collector', 'linked_rep')),
  account_tier text not null check (account_tier in ('free', 'silver')),
  linked_suite_rep_id text,
  finder_memory_summary_count integer not null default 0 check (finder_memory_summary_count >= 0),
  suite_memory_summary_count integer not null default 0 check (suite_memory_summary_count >= 0),
  memory_summary_count integer not null default 0 check (memory_summary_count >= 0),
  prompt_tokens integer check (prompt_tokens is null or prompt_tokens >= 0),
  completion_tokens integer check (completion_tokens is null or completion_tokens >= 0),
  total_tokens integer check (total_tokens is null or total_tokens >= 0),
  estimated_cost_usd numeric(12, 6),
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  finish_reason text,
  error_code text,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sparkle_finder_nic_nac_conversations_user_updated_idx
  on public.sparkle_finder_nic_nac_conversations (user_id, updated_at desc);

create index if not exists sparkle_finder_nic_nac_conversations_linked_rep_idx
  on public.sparkle_finder_nic_nac_conversations (linked_suite_rep_id)
  where linked_suite_rep_id is not null;

create index if not exists sparkle_finder_nic_nac_messages_conversation_created_idx
  on public.sparkle_finder_nic_nac_messages (conversation_id, created_at asc);

create index if not exists sparkle_finder_nic_nac_messages_user_created_idx
  on public.sparkle_finder_nic_nac_messages (user_id, created_at desc);

create index if not exists sparkle_finder_nic_nac_runs_user_started_idx
  on public.sparkle_finder_nic_nac_runs (user_id, started_at desc);

create index if not exists sparkle_finder_nic_nac_runs_status_started_idx
  on public.sparkle_finder_nic_nac_runs (status, started_at desc);

drop trigger if exists set_sparkle_finder_nic_nac_conversations_updated_at
  on public.sparkle_finder_nic_nac_conversations;
create trigger set_sparkle_finder_nic_nac_conversations_updated_at
before update on public.sparkle_finder_nic_nac_conversations
for each row execute function private.set_updated_at();

drop trigger if exists set_sparkle_finder_nic_nac_runs_updated_at
  on public.sparkle_finder_nic_nac_runs;
create trigger set_sparkle_finder_nic_nac_runs_updated_at
before update on public.sparkle_finder_nic_nac_runs
for each row execute function private.set_updated_at();

alter table public.sparkle_finder_nic_nac_conversations enable row level security;
alter table public.sparkle_finder_nic_nac_messages enable row level security;
alter table public.sparkle_finder_nic_nac_runs enable row level security;

drop policy if exists "sparkle finder customers read own nic nac conversations"
  on public.sparkle_finder_nic_nac_conversations;
create policy "sparkle finder customers read own nic nac conversations"
  on public.sparkle_finder_nic_nac_conversations
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "sparkle finder customers read own nic nac messages"
  on public.sparkle_finder_nic_nac_messages;
create policy "sparkle finder customers read own nic nac messages"
  on public.sparkle_finder_nic_nac_messages
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "sparkle finder customers read own nic nac runs"
  on public.sparkle_finder_nic_nac_runs;
create policy "sparkle finder customers read own nic nac runs"
  on public.sparkle_finder_nic_nac_runs
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

grant usage on schema public to authenticated, service_role;

revoke all on public.sparkle_finder_nic_nac_conversations from anon, authenticated;
revoke all on public.sparkle_finder_nic_nac_messages from anon, authenticated;
revoke all on public.sparkle_finder_nic_nac_runs from anon, authenticated;

grant select on public.sparkle_finder_nic_nac_conversations to authenticated;
grant select on public.sparkle_finder_nic_nac_messages to authenticated;
grant select on public.sparkle_finder_nic_nac_runs to authenticated;

grant select, insert, update, delete
on public.sparkle_finder_nic_nac_conversations
to service_role;

grant select, insert, update, delete
on public.sparkle_finder_nic_nac_messages
to service_role;

grant select, insert, update, delete
on public.sparkle_finder_nic_nac_runs
to service_role;

notify pgrst, 'reload schema';
