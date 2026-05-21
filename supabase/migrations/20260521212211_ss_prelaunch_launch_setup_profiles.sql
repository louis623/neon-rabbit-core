create table public.sparkle_suite_launch_setup_profiles (
  id uuid primary key default gen_random_uuid(),
  launch_build_id uuid not null references public.sparkle_suite_launch_builds(id) on delete cascade,
  business_name text not null,
  public_site_goal text not null default '',
  primary_social_url text,
  secondary_social_url text,
  shop_url text,
  brand_notes text not null default '',
  must_have_launch_notes text not null default '',
  open_questions text[] not null default '{}',
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sparkle_suite_launch_setup_profiles_status_check
    check (status in ('draft', 'ready', 'locked')),
  constraint sparkle_suite_launch_setup_profiles_build_unique
    unique (launch_build_id),
  constraint sparkle_suite_launch_setup_profiles_business_name_check
    check (btrim(business_name) <> '')
);

create index idx_sparkle_suite_launch_setup_profiles_build
  on public.sparkle_suite_launch_setup_profiles(launch_build_id);

drop trigger if exists trg_sparkle_suite_launch_setup_profiles_updated_at
  on public.sparkle_suite_launch_setup_profiles;
create trigger trg_sparkle_suite_launch_setup_profiles_updated_at
  before update on public.sparkle_suite_launch_setup_profiles
  for each row execute function public.update_updated_at_column();

alter table public.sparkle_suite_launch_setup_profiles enable row level security;

revoke all on table public.sparkle_suite_launch_setup_profiles from anon, authenticated;
grant select, insert, update, delete on table public.sparkle_suite_launch_setup_profiles to service_role;
