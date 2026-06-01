create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

create table public.sparkle_finder_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email text not null,
  phone_e164 text,
  phone_verified_at timestamptz,
  state text,
  tiktok_handle text,
  bio text default '' not null,
  profile_visibility text not null default 'private' check (profile_visibility in ('private', 'sparkle_finder')),
  is_rep boolean not null default false,
  sparkle_suite_rep_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sparkle_finder_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_state text not null check (access_state in ('silver_trial', 'silver_paid', 'silver_rep_included', 'free')),
  silver_source text not null check (silver_source in ('trial', 'stripe', 'sparkle_suite_rep', 'manual', 'none')),
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  silver_started_at timestamptz,
  silver_ends_at timestamptz,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  rep_credit_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sparkle_finder_communication_consents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  account_email_required boolean not null default true,
  account_sms_allowed boolean not null default false,
  account_sms_consented_at timestamptz,
  promotional_email_opt_in boolean not null default false,
  promotional_email_consented_at timestamptz,
  promotional_sms_opt_in boolean not null default false,
  promotional_sms_consented_at timestamptz,
  privacy_acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.sparkle_finder_communication_consents is
  'Communication preferences for Sparkle Finder accounts. Consent timestamp evidence is server-controlled; promotional SMS is off by default.';

create table public.sparkle_finder_collection_items (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  jewelry_item_id text not null,
  state text not null check (state in ('owned', 'wishlist', 'private_note_only')),
  note text default '' not null,
  is_highlighted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sparkle_finder_collection_items_user_id_idx
  on public.sparkle_finder_collection_items(user_id);

create index sparkle_finder_collection_items_user_state_idx
  on public.sparkle_finder_collection_items(user_id, state);

alter table public.sparkle_finder_profiles enable row level security;
alter table public.sparkle_finder_memberships enable row level security;
alter table public.sparkle_finder_communication_consents enable row level security;
alter table public.sparkle_finder_collection_items enable row level security;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public;
revoke all on function private.set_updated_at() from anon;
revoke all on function private.set_updated_at() from authenticated;

create trigger set_sparkle_finder_profiles_updated_at
before update on public.sparkle_finder_profiles
for each row execute function private.set_updated_at();

create trigger set_sparkle_finder_memberships_updated_at
before update on public.sparkle_finder_memberships
for each row execute function private.set_updated_at();

create trigger set_sparkle_finder_communication_consents_updated_at
before update on public.sparkle_finder_communication_consents
for each row execute function private.set_updated_at();

create trigger set_sparkle_finder_collection_items_updated_at
before update on public.sparkle_finder_collection_items
for each row execute function private.set_updated_at();

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
begin
  -- raw_user_meta_data is user-editable and is used here only as profile display text, never for authorization.
  insert into public.sparkle_finder_profiles (
    user_id,
    display_name,
    email
  )
  values (
    new.id,
    coalesce(metadata_display_name, email_display_name, 'Sparkle Finder'),
    initial_email
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
    user_id
  )
  values (
    new.id
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function private.create_sparkle_finder_account_rows() from public;
revoke all on function private.create_sparkle_finder_account_rows() from anon;
revoke all on function private.create_sparkle_finder_account_rows() from authenticated;

create trigger create_sparkle_finder_account_rows
after insert on auth.users
for each row execute function private.create_sparkle_finder_account_rows();

create or replace function public.update_sparkle_finder_communication_preferences(
  promotional_email_opt_in boolean,
  promotional_sms_opt_in boolean,
  account_sms_allowed boolean default null
)
returns public.sparkle_finder_communication_consents
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  authenticated_user_id uuid := auth.uid();
  updated_consent public.sparkle_finder_communication_consents;
begin
  if authenticated_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  update public.sparkle_finder_communication_consents as consent
  set
    account_sms_allowed = coalesce(
      update_sparkle_finder_communication_preferences.account_sms_allowed,
      consent.account_sms_allowed
    ),
    account_sms_consented_at = case
      when update_sparkle_finder_communication_preferences.account_sms_allowed
        and consent.account_sms_consented_at is null
        then now()
      when update_sparkle_finder_communication_preferences.account_sms_allowed
        then consent.account_sms_consented_at
      when update_sparkle_finder_communication_preferences.account_sms_allowed = false
        then null
      else consent.account_sms_consented_at
    end,
    promotional_email_opt_in =
      update_sparkle_finder_communication_preferences.promotional_email_opt_in,
    promotional_email_consented_at = case
      when update_sparkle_finder_communication_preferences.promotional_email_opt_in
        and consent.promotional_email_consented_at is null
        then now()
      when update_sparkle_finder_communication_preferences.promotional_email_opt_in
        then consent.promotional_email_consented_at
      else null
    end,
    promotional_sms_opt_in =
      update_sparkle_finder_communication_preferences.promotional_sms_opt_in,
    promotional_sms_consented_at = case
      when update_sparkle_finder_communication_preferences.promotional_sms_opt_in
        and consent.promotional_sms_consented_at is null
        then now()
      when update_sparkle_finder_communication_preferences.promotional_sms_opt_in
        then consent.promotional_sms_consented_at
      else null
    end
  where consent.user_id = authenticated_user_id
  returning *
  into updated_consent;

  if not found then
    raise exception 'Sparkle Finder communication consent row not found'
      using errcode = 'P0002';
  end if;

  return updated_consent;
end;
$$;

comment on function public.update_sparkle_finder_communication_preferences(boolean, boolean, boolean) is
  'Updates a user''s own communication opt-ins while keeping consent timestamp evidence server-controlled.';

revoke all on function public.update_sparkle_finder_communication_preferences(boolean, boolean, boolean) from public;
revoke all on function public.update_sparkle_finder_communication_preferences(boolean, boolean, boolean) from anon;
grant execute on function public.update_sparkle_finder_communication_preferences(boolean, boolean, boolean) to authenticated;

create policy "Users can select their own profile"
on public.sparkle_finder_profiles
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert their own profile"
on public.sparkle_finder_profiles
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update their own profile"
on public.sparkle_finder_profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can select their own membership"
on public.sparkle_finder_memberships
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can select their own communication consent"
on public.sparkle_finder_communication_consents
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can select their own collection items"
on public.sparkle_finder_collection_items
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert their own collection items"
on public.sparkle_finder_collection_items
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update their own collection items"
on public.sparkle_finder_collection_items
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete their own collection items"
on public.sparkle_finder_collection_items
for delete
to authenticated
using (user_id = auth.uid());

grant usage on schema public to authenticated;

grant select on public.sparkle_finder_profiles to authenticated;
grant insert (
  user_id,
  display_name,
  email,
  phone_e164,
  state,
  tiktok_handle,
  bio,
  profile_visibility
) on public.sparkle_finder_profiles to authenticated;
grant update (
  display_name,
  email,
  phone_e164,
  state,
  tiktok_handle,
  bio,
  profile_visibility
) on public.sparkle_finder_profiles to authenticated;

grant select on public.sparkle_finder_memberships to authenticated;

grant select on public.sparkle_finder_communication_consents to authenticated;
revoke update on public.sparkle_finder_communication_consents from authenticated;

grant select, delete on public.sparkle_finder_collection_items to authenticated;
grant insert (
  user_id,
  jewelry_item_id,
  state,
  note,
  is_highlighted
) on public.sparkle_finder_collection_items to authenticated;
grant update (
  jewelry_item_id,
  state,
  note,
  is_highlighted
) on public.sparkle_finder_collection_items to authenticated;
