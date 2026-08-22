-- Release 5: bounded, privacy-aware public Showcase reads.

create index if not exists sparkle_finder_collection_items_public_showcase_page_idx
  on public.sparkle_finder_collection_items(user_id, updated_at desc, id desc)
  where visibility = 'public'
    and state <> 'private_note_only'
    and showcase_status <> 'private_note_only';

create index if not exists sparkle_finder_showcase_collections_public_page_idx
  on public.sparkle_finder_showcase_collections(user_id, created_at desc, id desc)
  where visibility = 'public';

create index if not exists sparkle_finder_showcase_comments_public_page_idx
  on public.sparkle_finder_showcase_comments(showcase_user_id, target_type, target_id, created_at desc, id desc)
  where deleted_at is null;

create or replace function public.sparkle_finder_get_public_showcase_social_summary(
  showcase_owner_id uuid,
  viewer_user_id uuid default null
)
returns table (
  follower_count bigint,
  following_count bigint,
  is_followed_by_viewer boolean,
  public_piece_count bigint,
  rarest_reveal_count bigint,
  hero_collection_item_id uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (
      select count(*)
      from public.sparkle_finder_collector_follows as follow
      where follow.followed_user_id = showcase_owner_id
        and not exists (
          select 1
          from public.sparkle_finder_collector_blocks as block
          where (block.blocker_user_id = follow.follower_user_id and block.blocked_user_id = showcase_owner_id)
             or (block.blocker_user_id = showcase_owner_id and block.blocked_user_id = follow.follower_user_id)
        )
    )::bigint as follower_count,
    (
      select count(*)
      from public.sparkle_finder_collector_follows as follow
      where follow.follower_user_id = showcase_owner_id
        and not exists (
          select 1
          from public.sparkle_finder_collector_blocks as block
          where (block.blocker_user_id = follow.followed_user_id and block.blocked_user_id = showcase_owner_id)
             or (block.blocker_user_id = showcase_owner_id and block.blocked_user_id = follow.followed_user_id)
        )
    )::bigint as following_count,
    coalesce(
      viewer_user_id is not null
      and viewer_user_id <> showcase_owner_id
      and exists (
        select 1
        from public.sparkle_finder_collector_follows as follow
        where follow.follower_user_id = viewer_user_id
          and follow.followed_user_id = showcase_owner_id
      )
      and not exists (
        select 1
        from public.sparkle_finder_collector_blocks as block
        where (block.blocker_user_id = viewer_user_id and block.blocked_user_id = showcase_owner_id)
           or (block.blocker_user_id = showcase_owner_id and block.blocked_user_id = viewer_user_id)
      ),
      false
    ) as is_followed_by_viewer,
    (
      select count(*)
      from public.sparkle_finder_collection_items as item
      where item.user_id = showcase_owner_id
        and item.visibility = 'public'
        and item.state in ('owned', 'wishlist')
        and item.showcase_status in ('owned', 'wishlist', 'iso')
    )::bigint as public_piece_count,
    (
      select count(*)
      from public.sparkle_finder_collection_items as item
      where item.user_id = showcase_owner_id
        and item.visibility = 'public'
        and item.state = 'owned'
        and item.showcase_status = 'owned'
        and item.is_rarest_reveal = true
    )::bigint as rarest_reveal_count,
    (
      select profile.hero_collection_item_id
      from public.sparkle_finder_profiles as profile
      where profile.user_id = showcase_owner_id
    ) as hero_collection_item_id
  where exists (
    select 1
    from public.sparkle_finder_profiles as profile
    where profile.user_id = showcase_owner_id
      and profile.profile_visibility = 'sparkle_finder'
      and profile.showcase_visibility = 'public'
  );
$$;

revoke all on function public.sparkle_finder_get_public_showcase_social_summary(uuid, uuid) from public;
revoke all on function public.sparkle_finder_get_public_showcase_social_summary(uuid, uuid) from anon;
revoke all on function public.sparkle_finder_get_public_showcase_social_summary(uuid, uuid) from authenticated;
grant execute on function public.sparkle_finder_get_public_showcase_social_summary(uuid, uuid) to service_role;
