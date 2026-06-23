create table if not exists public.show_reminder_preferences (
  rep_id uuid primary key references public.reps(id) on delete cascade,
  enabled boolean not null default true,
  channels text[] not null default '{sms}'
    check (channels <@ array['sms', 'email']::text[] and array_length(channels, 1) >= 1),
  lead_minutes integer not null default 30
    check (lead_minutes between 15 and 180),
  include_discount_codes boolean not null default true,
  include_featured_collections boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_show_reminder_preferences_enabled
  on public.show_reminder_preferences (enabled);

create table if not exists public.show_reminder_overrides (
  event_id uuid primary key references public.calendar_events(id) on delete cascade,
  rep_id uuid not null references public.reps(id) on delete cascade,
  enabled boolean not null default true,
  channels text[] not null default '{sms}'
    check (channels <@ array['sms', 'email']::text[] and array_length(channels, 1) >= 1),
  lead_minutes integer not null default 30
    check (lead_minutes between 15 and 180),
  include_discount_codes boolean not null default true,
  include_featured_collections boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'calendar_events_id_rep_id_unique'
  ) then
    alter table public.calendar_events
      add constraint calendar_events_id_rep_id_unique unique (id, rep_id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'show_reminder_overrides_event_rep_fk'
  ) then
    alter table public.show_reminder_overrides
      add constraint show_reminder_overrides_event_rep_fk
      foreign key (event_id, rep_id)
      references public.calendar_events(id, rep_id)
      on delete cascade;
  end if;
end $$;

create index if not exists idx_show_reminder_overrides_rep
  on public.show_reminder_overrides (rep_id);

create table if not exists public.show_reminder_runs (
  id uuid primary key default gen_random_uuid(),
  run_mode text not null
    check (run_mode in ('dry_run', 'live')),
  status text not null
    check (status in ('completed', 'failed')),
  rep_ids uuid[] not null default '{}'::uuid[],
  live_sms_enabled boolean not null default false,
  live_email_enabled boolean not null default false,
  planned_count integer not null default 0 check (planned_count >= 0),
  sent_count integer not null default 0 check (sent_count >= 0),
  skipped_count integer not null default 0 check (skipped_count >= 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_show_reminder_runs_created_at
  on public.show_reminder_runs (created_at desc);

create index if not exists idx_show_reminder_runs_rep_ids
  on public.show_reminder_runs using gin (rep_ids);

create table if not exists public.show_reminder_run_items (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.show_reminder_runs(id) on delete cascade,
  rep_id uuid not null references public.reps(id) on delete cascade,
  event_id uuid not null references public.calendar_events(id) on delete cascade,
  audience_id uuid references public.customer_audience(id) on delete set null,
  channel text not null check (channel in ('sms', 'email')),
  automation_key text not null,
  status text not null check (status in ('planned', 'sent', 'skipped')),
  recipient text not null,
  scheduled_for timestamptz not null,
  event_time timestamptz not null,
  error text,
  message_preview text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_show_reminder_run_items_run
  on public.show_reminder_run_items (run_id);

create index if not exists idx_show_reminder_run_items_rep
  on public.show_reminder_run_items (rep_id, created_at desc);

alter table public.show_reminder_preferences enable row level security;
alter table public.show_reminder_overrides enable row level security;
alter table public.show_reminder_runs enable row level security;
alter table public.show_reminder_run_items enable row level security;

grant select, insert, update, delete on table public.show_reminder_preferences to service_role;
grant select, insert, update on table public.show_reminder_preferences to authenticated;
grant select, insert, update, delete on table public.show_reminder_overrides to service_role;
grant select, insert, update on table public.show_reminder_overrides to authenticated;
grant select, insert, update, delete on table public.show_reminder_runs to service_role;
grant select on table public.show_reminder_runs to authenticated;
grant select, insert, update, delete on table public.show_reminder_run_items to service_role;
grant select on table public.show_reminder_run_items to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'show_reminder_preferences'
      and policyname = 'show_reminder_preferences_own_data'
  ) then
    create policy show_reminder_preferences_own_data
      on public.show_reminder_preferences
      for all
      using (
        auth.uid() is not null
        and rep_id = (select id from public.reps where auth_user_id = auth.uid())
      )
      with check (
        auth.uid() is not null
        and rep_id = (select id from public.reps where auth_user_id = auth.uid())
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'show_reminder_preferences'
      and policyname = 'show_reminder_preferences_admin_full_access'
  ) then
    create policy show_reminder_preferences_admin_full_access
      on public.show_reminder_preferences
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'show_reminder_overrides'
      and policyname = 'show_reminder_overrides_own_data'
  ) then
    create policy show_reminder_overrides_own_data
      on public.show_reminder_overrides
      for all
      using (
        auth.uid() is not null
        and rep_id = (select id from public.reps where auth_user_id = auth.uid())
      )
      with check (
        auth.uid() is not null
        and rep_id = (select id from public.reps where auth_user_id = auth.uid())
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'show_reminder_overrides'
      and policyname = 'show_reminder_overrides_admin_full_access'
  ) then
    create policy show_reminder_overrides_admin_full_access
      on public.show_reminder_overrides
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'show_reminder_runs'
      and policyname = 'show_reminder_runs_own_data'
  ) then
    create policy show_reminder_runs_own_data
      on public.show_reminder_runs
      for select
      using (
        auth.uid() is not null
        and (select id from public.reps where auth_user_id = auth.uid()) = any(rep_ids)
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'show_reminder_runs'
      and policyname = 'show_reminder_runs_admin_full_access'
  ) then
    create policy show_reminder_runs_admin_full_access
      on public.show_reminder_runs
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'show_reminder_run_items'
      and policyname = 'show_reminder_run_items_own_data'
  ) then
    create policy show_reminder_run_items_own_data
      on public.show_reminder_run_items
      for select
      using (
        auth.uid() is not null
        and rep_id = (select id from public.reps where auth_user_id = auth.uid())
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'show_reminder_run_items'
      and policyname = 'show_reminder_run_items_admin_full_access'
  ) then
    create policy show_reminder_run_items_admin_full_access
      on public.show_reminder_run_items
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

notify pgrst, 'reload schema';
