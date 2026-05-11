create table public.sparkle_suite_intake_submissions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  business_name text not null,
  tiktok_handle text,
  instagram_handle text,
  facebook_url text,
  team_name text,
  team_size text not null,
  primary_platform text not null,
  streaming_frequency text not null,
  current_setup text not null,
  setup_goal text not null,
  device_setup text not null,
  brand_vibe text,
  color_preferences text,
  special_requests text,
  sms_consent boolean not null default false,
  email_consent boolean not null default false,
  intake_status text not null default 'submitted',
  prequalification_status text not null default 'needs_review',
  fit_flags text[] not null default '{}',
  source text not null default 'prelaunch_intake',
  converted_rep_id uuid references public.reps(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sparkle_suite_intake_team_size_check
    check (team_size in ('1-5', '6-20', '21-50', '51-plus')),
  constraint sparkle_suite_intake_primary_platform_check
    check (primary_platform in ('tiktok', 'facebook', 'instagram', 'multiple', 'not_sure')),
  constraint sparkle_suite_intake_streaming_frequency_check
    check (streaming_frequency in ('not_live_yet', 'occasional', 'weekly', 'multiple_weekly')),
  constraint sparkle_suite_intake_device_setup_check
    check (device_setup in ('phone_only', 'phone_and_computer', 'phone_and_tablet', 'not_sure')),
  constraint sparkle_suite_intake_status_check
    check (intake_status in ('submitted', 'reviewing', 'qualified', 'waitlisted', 'converted', 'declined')),
  constraint sparkle_suite_intake_prequalification_status_check
    check (prequalification_status in ('qualified', 'needs_review'))
);

create index idx_sparkle_suite_intake_created_at
  on public.sparkle_suite_intake_submissions(created_at desc);

create index idx_sparkle_suite_intake_status
  on public.sparkle_suite_intake_submissions(intake_status);

create index idx_sparkle_suite_intake_prequalification
  on public.sparkle_suite_intake_submissions(prequalification_status);

alter table public.sparkle_suite_intake_submissions enable row level security;

revoke all on table public.sparkle_suite_intake_submissions from anon, authenticated;
grant select, insert, update on table public.sparkle_suite_intake_submissions to service_role;
