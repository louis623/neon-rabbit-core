create table if not exists public.sparkle_finder_stripe_events (
  stripe_event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

alter table public.sparkle_finder_stripe_events enable row level security;

revoke all on public.sparkle_finder_stripe_events from anon;
revoke all on public.sparkle_finder_stripe_events from authenticated;

create or replace function private.create_sparkle_finder_account_rows()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  initial_email text := coalesce(new.email, '');
  email_display_name text := nullif(split_part(coalesce(new.email, ''), '@', 1), '');
  metadata_display_name text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '');
  metadata_phone text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), '');
  metadata_state text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'state', '')), '');
  privacy_acknowledged boolean := coalesce((new.raw_user_meta_data ->> 'privacy_acknowledged')::boolean, false);
  promo_email boolean := coalesce((new.raw_user_meta_data ->> 'promotional_email_opt_in')::boolean, false);
  promo_sms boolean := coalesce((new.raw_user_meta_data ->> 'promotional_sms_opt_in')::boolean, false);
begin
  insert into public.sparkle_finder_profiles (
    user_id,
    display_name,
    email,
    phone_e164,
    state
  )
  values (
    new.id,
    coalesce(metadata_display_name, email_display_name, 'Sparkle Finder'),
    initial_email,
    metadata_phone,
    metadata_state
  )
  on conflict (user_id) do nothing;

  insert into public.sparkle_finder_memberships (
    user_id,
    access_state,
    silver_source,
    trial_started_at,
    trial_ends_at,
    silver_started_at,
    silver_ends_at
  )
  values (
    new.id,
    'silver_trial',
    'trial',
    now(),
    now() + interval '45 days',
    now(),
    now() + interval '45 days'
  )
  on conflict (user_id) do nothing;

  insert into public.sparkle_finder_communication_consents (
    user_id,
    promotional_email_opt_in,
    promotional_email_consented_at,
    promotional_sms_opt_in,
    promotional_sms_consented_at,
    privacy_acknowledged_at
  )
  values (
    new.id,
    promo_email,
    case when promo_email then now() else null end,
    promo_sms,
    case when promo_sms then now() else null end,
    case when privacy_acknowledged then now() else null end
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function private.create_sparkle_finder_account_rows() from public;
revoke all on function private.create_sparkle_finder_account_rows() from anon;
revoke all on function private.create_sparkle_finder_account_rows() from authenticated;

insert into public.sparkle_finder_profiles (
  user_id,
  display_name,
  email
)
select
  auth_user.id,
  coalesce(nullif(split_part(coalesce(auth_user.email, ''), '@', 1), ''), 'Sparkle Finder'),
  coalesce(auth_user.email, '')
from auth.users auth_user
where not exists (
  select 1
  from public.sparkle_finder_profiles profile
  where profile.user_id = auth_user.id
);

insert into public.sparkle_finder_memberships (
  user_id,
  access_state,
  silver_source,
  trial_started_at,
  trial_ends_at,
  silver_started_at,
  silver_ends_at
)
select
  auth_user.id,
  'silver_trial',
  'trial',
  auth_user.created_at,
  auth_user.created_at + interval '45 days',
  auth_user.created_at,
  auth_user.created_at + interval '45 days'
from auth.users auth_user
where not exists (
  select 1
  from public.sparkle_finder_memberships membership
  where membership.user_id = auth_user.id
);

insert into public.sparkle_finder_communication_consents (user_id)
select auth_user.id
from auth.users auth_user
where not exists (
  select 1
  from public.sparkle_finder_communication_consents consent
  where consent.user_id = auth_user.id
);
