alter table public.sparkle_finder_profiles
  add column if not exists sparkle_suite_rep_business_name text,
  add column if not exists sparkle_suite_rep_public_site_slug text,
  add column if not exists sparkle_suite_rep_claimed_at timestamptz;

comment on column public.sparkle_finder_profiles.sparkle_suite_rep_id is
  'Sparkle Suite rep id linked after a server-side Secret Rep ID claim.';
comment on column public.sparkle_finder_profiles.sparkle_suite_rep_business_name is
  'Suite business name returned by the verified internal rep-claim API.';
comment on column public.sparkle_finder_profiles.sparkle_suite_rep_public_site_slug is
  'Suite public site slug returned by the verified internal rep-claim API, when available.';
comment on column public.sparkle_finder_profiles.sparkle_suite_rep_claimed_at is
  'Timestamp when Sparkle Finder linked the signed-in account to the Suite rep id.';
