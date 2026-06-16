create table if not exists public.sparkle_finder_customer_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  memory_type text not null check (
    memory_type in (
      'style_preference',
      'collection_goal',
      'current_hunt',
      'favorite_rep',
      'rep_preference',
      'size_or_fit_note',
      'gift_or_occasion_note',
      'workflow_preference',
      'guarded_note'
    )
  ),
  summary text not null check (char_length(summary) <= 240),
  source text not null check (source in ('explicit', 'inferred', 'system')),
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sparkle_finder_customer_memory_user_updated_idx
  on public.sparkle_finder_customer_memory (user_id, updated_at desc);

alter table public.sparkle_finder_customer_memory enable row level security;

drop policy if exists "sparkle finder customers read own memory" on public.sparkle_finder_customer_memory;
create policy "sparkle finder customers read own memory"
  on public.sparkle_finder_customer_memory
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "sparkle finder customers insert own memory" on public.sparkle_finder_customer_memory;
create policy "sparkle finder customers insert own memory"
  on public.sparkle_finder_customer_memory
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "sparkle finder customers update own memory" on public.sparkle_finder_customer_memory;
create policy "sparkle finder customers update own memory"
  on public.sparkle_finder_customer_memory
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "sparkle finder customers delete own memory" on public.sparkle_finder_customer_memory;
create policy "sparkle finder customers delete own memory"
  on public.sparkle_finder_customer_memory
  for delete
  to authenticated
  using (auth.uid() = user_id);
