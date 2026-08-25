-- Rarest Reveals describe jewelry the collector owns. Normalize historical
-- Wishlist/ISO flags before enforcing that durable invariant.
update public.sparkle_finder_collection_items
set showcase_status = 'owned'
where state = 'owned'
  and showcase_status <> 'owned';

update public.sparkle_finder_collection_items
set showcase_status = 'wishlist'
where state = 'wishlist'
  and showcase_status not in ('wishlist', 'iso');

update public.sparkle_finder_collection_items
set showcase_status = 'private_note_only'
where state = 'private_note_only'
  and showcase_status <> 'private_note_only';

update public.sparkle_finder_collection_items
set is_rarest_reveal = false
where is_rarest_reveal = true
  and (state <> 'owned' or showcase_status <> 'owned');

alter table public.sparkle_finder_collection_items
  drop constraint if exists sparkle_finder_collection_items_rarest_reveal_owned;

alter table public.sparkle_finder_collection_items
  add constraint sparkle_finder_collection_items_rarest_reveal_owned
  check (
    is_rarest_reveal = false
    or (state = 'owned' and showcase_status = 'owned')
  );

comment on constraint sparkle_finder_collection_items_rarest_reveal_owned
  on public.sparkle_finder_collection_items is
  'Rarest Reveal selections are valid only for owned Sparkle Showcase pieces.';

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
      (
        item.state = 'owned'
        and item.showcase_status = 'owned'
        and item.is_rarest_reveal
      ) as is_rarest_reveal,
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
      and item.state <> 'private_note_only'
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
  'Returns bounded public highlights from followed collectors; Rarest Reveal flags are owned-only.';

revoke all on function public.sparkle_finder_list_followed_showcase_highlights(integer) from public;
revoke all on function public.sparkle_finder_list_followed_showcase_highlights(integer) from anon;
grant execute on function public.sparkle_finder_list_followed_showcase_highlights(integer) to authenticated;

-- V2 preserves the v1 function and adds only the ownership fields needed by
-- Sparkle Finder to safely enrich owned Diamonds and Unicorns from its catalog.
create or replace function public.sparkle_finder_list_followed_showcase_highlights_v2(
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
  updated_at timestamptz,
  state text,
  showcase_status text
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
      (
        item.state = 'owned'
        and item.showcase_status = 'owned'
        and item.is_rarest_reveal
      ) as is_rarest_reveal,
      item.updated_at,
      item.state::text as state,
      item.showcase_status::text as showcase_status
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
      and item.state <> 'private_note_only'
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

comment on function public.sparkle_finder_list_followed_showcase_highlights_v2(integer) is
  'Returns bounded public followed-Showcase highlights with state/status for owned-only rarity enrichment.';

revoke all on function public.sparkle_finder_list_followed_showcase_highlights_v2(integer) from public;
revoke all on function public.sparkle_finder_list_followed_showcase_highlights_v2(integer) from anon;
grant execute on function public.sparkle_finder_list_followed_showcase_highlights_v2(integer) to authenticated;
