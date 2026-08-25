create or replace function public.sparkle_finder_list_followed_showcase_highlights(
  result_limit integer default 6
)
returns table (
  user_id uuid,
  showcase_handle text,
  display_name text,
  showcase_tagline text,
  photo_url text,
  collection_item_id uuid,
  jewelry_item_id text,
  reveal_story text,
  personal_photo_url text,
  is_rarest_reveal boolean,
  updated_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  with viewer as (
    select (select auth.uid()) as user_id
  ),
  visible_highlights as (
    select
      profile.user_id,
      profile.showcase_handle,
      profile.display_name,
      coalesce(profile.showcase_tagline, '') as showcase_tagline,
      profile.photo_url,
      item.id as collection_item_id,
      item.jewelry_item_id,
      coalesce(item.reveal_story, '') as reveal_story,
      item.personal_photo_url,
      item.is_rarest_reveal,
      item.updated_at
    from viewer
    join public.sparkle_finder_collector_follows follow
      on follow.follower_user_id = viewer.user_id
    join public.sparkle_finder_profiles profile
      on profile.user_id = follow.followed_user_id
    join public.sparkle_finder_collection_items item
      on item.user_id = profile.user_id
    where viewer.user_id is not null
      and profile.profile_visibility = 'sparkle_finder'
      and profile.showcase_visibility = 'public'
      and profile.showcase_handle is not null
      and profile.showcase_handle <> ''
      and item.visibility = 'public'
      and item.showcase_status <> 'private_note_only'
      and not exists (
        select 1
        from public.sparkle_finder_collector_blocks block
        where (
          block.blocker_user_id = viewer.user_id
          and block.blocked_user_id = profile.user_id
        ) or (
          block.blocker_user_id = profile.user_id
          and block.blocked_user_id = viewer.user_id
        )
      )
  )
  select *
  from visible_highlights
  order by updated_at desc, collection_item_id desc
  limit least(greatest(coalesce(result_limit, 6), 1), 12);
$$;

comment on function public.sparkle_finder_list_followed_showcase_highlights(integer) is
  'Returns a bounded, privacy-filtered set of public piece highlights from collectors followed by the authenticated Sparkle Finder customer.';

revoke all on function public.sparkle_finder_list_followed_showcase_highlights(integer) from public;
revoke all on function public.sparkle_finder_list_followed_showcase_highlights(integer) from anon;
grant execute on function public.sparkle_finder_list_followed_showcase_highlights(integer) to authenticated;
