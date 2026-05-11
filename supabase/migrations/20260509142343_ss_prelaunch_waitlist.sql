create table if not exists public.sparkle_suite_waitlist (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  tiktok_handle text not null,
  team_rep_name text not null,
  setup_pain text,
  sms_consent boolean not null default false,
  email_consent boolean not null default false,
  lead_status text not null default 'new',
  welcome_email_status text not null default 'not_attempted',
  welcome_email_provider_id text,
  welcome_email_error text,
  welcome_email_sent_at timestamptz,
  source text not null default 'prelaunch_site',
  created_at timestamptz not null default now(),
  constraint sparkle_suite_waitlist_welcome_email_status_check
    check (welcome_email_status in ('not_attempted', 'sent', 'skipped', 'failed'))
);

alter table public.sparkle_suite_waitlist
  add column if not exists setup_pain text,
  add column if not exists sms_consent boolean not null default false,
  add column if not exists email_consent boolean not null default false,
  add column if not exists lead_status text not null default 'new',
  add column if not exists welcome_email_status text not null default 'not_attempted',
  add column if not exists welcome_email_provider_id text,
  add column if not exists welcome_email_error text,
  add column if not exists welcome_email_sent_at timestamptz,
  add column if not exists source text not null default 'prelaunch_site',
  add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sparkle_suite_waitlist_welcome_email_status_check'
      and conrelid = 'public.sparkle_suite_waitlist'::regclass
  ) then
    alter table public.sparkle_suite_waitlist
      add constraint sparkle_suite_waitlist_welcome_email_status_check
      check (welcome_email_status in ('not_attempted', 'sent', 'skipped', 'failed'));
  end if;
end $$;

create index if not exists idx_sparkle_suite_waitlist_created_at
  on public.sparkle_suite_waitlist(created_at desc);

alter table public.sparkle_suite_waitlist enable row level security;

revoke all on table public.sparkle_suite_waitlist from anon, authenticated;
grant select, insert, update on table public.sparkle_suite_waitlist to service_role;
