drop function if exists public.update_sparkle_finder_communication_preferences(boolean, boolean, boolean);

create or replace function public.update_sparkle_finder_communication_preferences(
  promotional_email_opt_in boolean,
  promotional_sms_opt_in boolean,
  account_sms_allowed boolean default null,
  privacy_acknowledged boolean default null
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
    end,
    privacy_acknowledged_at = case
      when update_sparkle_finder_communication_preferences.privacy_acknowledged
        and consent.privacy_acknowledged_at is null
        then now()
      else consent.privacy_acknowledged_at
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

comment on function public.update_sparkle_finder_communication_preferences(boolean, boolean, boolean, boolean) is
  'Updates a user''s own communication opt-ins and privacy acknowledgment while keeping consent timestamp evidence server-controlled.';

revoke all on function public.update_sparkle_finder_communication_preferences(boolean, boolean, boolean, boolean) from public;
revoke all on function public.update_sparkle_finder_communication_preferences(boolean, boolean, boolean, boolean) from anon;
grant execute on function public.update_sparkle_finder_communication_preferences(boolean, boolean, boolean, boolean) to authenticated;
