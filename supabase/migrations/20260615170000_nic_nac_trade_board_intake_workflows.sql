create table if not exists public.trade_board_intake_sessions (
  id uuid primary key default gen_random_uuid(),
  rep_id uuid not null references public.reps(id) on delete cascade,
  conversation_id text not null,
  workflow_type text not null default 'trade_board_add_listing'
    check (workflow_type = 'trade_board_add_listing'),
  status text not null default 'active'
    check (status in ('active', 'completed', 'cancelled', 'expired', 'needs_human_review')),
  current_phase text not null default 'started'
    check (current_phase in ('started', 'details_capture', 'photo_capture', 'catalog_match', 'ready_to_add', 'adding', 'completed', 'cancelled', 'needs_human_review')),
  item_number text,
  quantity integer,
  design_name text,
  collection_name text,
  collection_year integer,
  material text,
  main_stone text,
  bp_msrp numeric,
  ring_size text,
  rep_notes text,
  trade_preferences text,
  missing_fields text[] not null default '{}',
  hard_blockers text[] not null default '{}',
  soft_warnings text[] not null default '{}',
  created_listing_ids uuid[] not null default '{}',
  created_design_id uuid,
  last_user_message_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours'
);

create index if not exists idx_trade_board_intake_sessions_rep_active
  on public.trade_board_intake_sessions (rep_id, conversation_id, updated_at desc)
  where status = 'active';

create index if not exists idx_trade_board_intake_sessions_expires
  on public.trade_board_intake_sessions (expires_at)
  where status = 'active';

create table if not exists public.trade_board_intake_photos (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.trade_board_intake_sessions(id) on delete cascade,
  rep_id uuid not null references public.reps(id) on delete cascade,
  conversation_id text not null,
  conversation_message_id text,
  attachment_index integer not null,
  declared_role text not null default 'unknown'
    check (declared_role in ('label_details', 'jewelry_front', 'unknown', 'other')),
  visual_role text not null default 'uncertain'
    check (visual_role in ('jewelry', 'label_or_packaging', 'uncertain')),
  role_confirmed boolean not null default false,
  image_url text,
  quality text not null default 'unknown'
    check (quality in ('usable', 'warning', 'blocked', 'unknown')),
  quality_score integer,
  quality_issues text[] not null default '{}',
  notes text[] not null default '{}',
  ocr_or_vision_summary text,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_trade_board_intake_photos_message_attachment
  on public.trade_board_intake_photos (session_id, conversation_message_id, attachment_index)
  where conversation_message_id is not null;

create index if not exists idx_trade_board_intake_photos_session
  on public.trade_board_intake_photos (session_id, created_at asc);

alter table public.trade_board_intake_sessions enable row level security;
alter table public.trade_board_intake_photos enable row level security;

grant select on table public.trade_board_intake_sessions to authenticated;
grant select on table public.trade_board_intake_photos to authenticated;
grant select, insert, update, delete on table public.trade_board_intake_sessions to service_role;
grant select, insert, update, delete on table public.trade_board_intake_photos to service_role;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'trade_board_intake_sessions'
      and policyname = 'trade_board_intake_sessions_own_data'
  ) then
    create policy trade_board_intake_sessions_own_data
      on public.trade_board_intake_sessions
      for select
      using (
        auth.uid() is not null
        and rep_id = (select id from public.reps where auth_user_id = auth.uid())
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'trade_board_intake_sessions'
      and policyname = 'trade_board_intake_sessions_admin_full_access'
  ) then
    create policy trade_board_intake_sessions_admin_full_access
      on public.trade_board_intake_sessions
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'trade_board_intake_photos'
      and policyname = 'trade_board_intake_photos_own_data'
  ) then
    create policy trade_board_intake_photos_own_data
      on public.trade_board_intake_photos
      for select
      using (
        auth.uid() is not null
        and rep_id = (select id from public.reps where auth_user_id = auth.uid())
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'trade_board_intake_photos'
      and policyname = 'trade_board_intake_photos_admin_full_access'
  ) then
    create policy trade_board_intake_photos_admin_full_access
      on public.trade_board_intake_photos
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;

alter table public.nic_nac_runs
  add column if not exists workflow_id uuid,
  add column if not exists workflow_type text,
  add column if not exists workflow_phase_before text,
  add column if not exists workflow_phase_after text,
  add column if not exists workflow_status_before text,
  add column if not exists workflow_status_after text,
  add column if not exists tool_policy_source text,
  add column if not exists hard_fail_phrase_count integer not null default 0,
  add column if not exists hard_fail_phrases text[] not null default '{}',
  add column if not exists workflow_photo_roles jsonb not null default '[]'::jsonb;

notify pgrst, 'reload schema';
