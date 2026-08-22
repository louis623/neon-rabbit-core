create or replace function private.sparkle_finder_has_collector_block_between(
  left_user_id uuid,
  right_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.sparkle_finder_collector_blocks as block
    where (
      block.blocker_user_id = left_user_id
      and block.blocked_user_id = right_user_id
    )
    or (
      block.blocker_user_id = right_user_id
      and block.blocked_user_id = left_user_id
    )
  );
$$;

create or replace function private.sparkle_finder_is_public_showcase_owner(
  target_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.sparkle_finder_profiles as profile
    where profile.user_id = target_user_id
      and profile.profile_visibility = 'sparkle_finder'
      and profile.showcase_visibility = 'public'
  );
$$;

create or replace function private.sparkle_finder_is_public_showcase_item(
  target_user_id uuid,
  target_collection_item_id text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.sparkle_finder_is_public_showcase_owner(target_user_id)
    and exists (
      select 1
      from public.sparkle_finder_collection_items as collection_item
      where collection_item.id = case
          when target_collection_item_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            then target_collection_item_id::uuid
          else null
        end
        and collection_item.user_id = target_user_id
        and collection_item.visibility = 'public'
        and collection_item.state in ('owned', 'wishlist')
        and collection_item.showcase_status in ('owned', 'wishlist', 'iso')
    );
$$;

create or replace function private.sparkle_finder_is_public_showcase_comment(
  target_showcase_user_id uuid,
  target_author_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.sparkle_finder_is_public_showcase_owner(target_showcase_user_id)
    and not private.sparkle_finder_has_collector_block_between(
      target_showcase_user_id,
      target_author_user_id
    );
$$;

comment on function private.sparkle_finder_is_public_showcase_owner(uuid) is
  'Fail-closed RLS helper for a public Sparkle Finder profile and Showcase.';

comment on function private.sparkle_finder_is_public_showcase_item(uuid, text) is
  'Fail-closed RLS helper for a public, non-private-only Showcase collection item.';

comment on function private.sparkle_finder_is_public_showcase_comment(uuid, uuid) is
  'Fail-closed RLS helper that suppresses comments across owner-author blocks.';

revoke all on function private.sparkle_finder_is_public_showcase_owner(uuid) from public;
revoke all on function private.sparkle_finder_is_public_showcase_item(uuid, text) from public;
revoke all on function private.sparkle_finder_is_public_showcase_comment(uuid, uuid) from public;
grant execute on function private.sparkle_finder_is_public_showcase_owner(uuid) to anon, authenticated;
grant execute on function private.sparkle_finder_is_public_showcase_item(uuid, text) to anon, authenticated;
grant execute on function private.sparkle_finder_is_public_showcase_comment(uuid, uuid) to anon, authenticated;

create index if not exists sparkle_finder_profiles_public_showcase_owner_idx
  on public.sparkle_finder_profiles(user_id)
  where profile_visibility = 'sparkle_finder' and showcase_visibility = 'public';

drop policy if exists "Public can select public showcase profiles" on public.sparkle_finder_profiles;
create policy "Public can select public showcase profiles"
on public.sparkle_finder_profiles
for select
to anon
using (
  profile_visibility = 'sparkle_finder'
  and showcase_visibility = 'public'
);

drop policy if exists "Users can select their own profile" on public.sparkle_finder_profiles;
create policy "Users can select their own profile"
on public.sparkle_finder_profiles
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Public can select public showcase collection items" on public.sparkle_finder_collection_items;
create policy "Public can select public showcase collection items"
on public.sparkle_finder_collection_items
for select
to anon
using (
  visibility = 'public'
  and state in ('owned', 'wishlist')
  and showcase_status in ('owned', 'wishlist', 'iso')
  and private.sparkle_finder_is_public_showcase_owner(user_id)
);

drop policy if exists "Users can select their own collection items" on public.sparkle_finder_collection_items;
create policy "Users can select their own collection items"
on public.sparkle_finder_collection_items
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Public can select public showcase collections" on public.sparkle_finder_showcase_collections;
create policy "Public can select public showcase collections"
on public.sparkle_finder_showcase_collections
for select
to anon
using (
  visibility = 'public'
  and private.sparkle_finder_is_public_showcase_owner(user_id)
);

drop policy if exists "Public can select public showcase collection joins" on public.sparkle_finder_showcase_collection_items;
create policy "Public can select public showcase collection joins"
on public.sparkle_finder_showcase_collection_items
for select
to anon
using (
  exists (
    select 1
    from public.sparkle_finder_showcase_collections as showcase_collection
    join public.sparkle_finder_collection_items as collection_item
      on collection_item.id = sparkle_finder_showcase_collection_items.collection_item_id
    where showcase_collection.id = sparkle_finder_showcase_collection_items.showcase_collection_id
      and showcase_collection.visibility = 'public'
      and collection_item.user_id = showcase_collection.user_id
      and private.sparkle_finder_is_public_showcase_owner(showcase_collection.user_id)
      and private.sparkle_finder_is_public_showcase_item(
        showcase_collection.user_id,
        collection_item.id::text
      )
  )
);

drop policy if exists "Public can select non-deleted comments on public showcases" on public.sparkle_finder_showcase_comments;
drop policy if exists "Anonymous can select non-deleted comments on public showcases" on public.sparkle_finder_showcase_comments;
create policy "Anonymous can select non-deleted comments on public showcases"
on public.sparkle_finder_showcase_comments
for select
to anon
using (
  deleted_at is null
  and private.sparkle_finder_is_public_showcase_comment(showcase_user_id, author_user_id)
  and (
    (
      target_type = 'showcase'
      and target_id = showcase_user_id::text
    )
    or (
      target_type = 'piece'
      and private.sparkle_finder_is_public_showcase_item(showcase_user_id, target_id)
    )
  )
);

drop policy if exists "Authenticated users can select non-deleted comments on public showcases" on public.sparkle_finder_showcase_comments;
create policy "Authenticated users can select non-deleted comments on public showcases"
on public.sparkle_finder_showcase_comments
for select
to authenticated
using (
  deleted_at is null
  and private.sparkle_finder_is_public_showcase_comment(showcase_user_id, author_user_id)
  and not private.sparkle_finder_has_collector_block_between((select auth.uid()), showcase_user_id)
  and not private.sparkle_finder_has_collector_block_between((select auth.uid()), author_user_id)
  and (
    (
      target_type = 'showcase'
      and target_id = showcase_user_id::text
    )
    or (
      target_type = 'piece'
      and private.sparkle_finder_is_public_showcase_item(showcase_user_id, target_id)
    )
  )
);

drop policy if exists "Users can insert comments on public showcases" on public.sparkle_finder_showcase_comments;
create policy "Users can insert comments on public showcases"
on public.sparkle_finder_showcase_comments
for insert
to authenticated
with check (
  author_user_id = (select auth.uid())
  and deleted_at is null
  and private.sparkle_finder_is_public_showcase_owner(showcase_user_id)
  and not private.sparkle_finder_has_collector_block_between(author_user_id, showcase_user_id)
  and (
    (
      target_type = 'showcase'
      and target_id = showcase_user_id::text
    )
    or (
      target_type = 'piece'
      and private.sparkle_finder_is_public_showcase_item(showcase_user_id, target_id)
    )
  )
);

drop policy if exists "Users can follow public showcases" on public.sparkle_finder_showcase_follows;
create policy "Users can follow public showcases"
on public.sparkle_finder_showcase_follows
for insert
to authenticated
with check (
  follower_user_id = (select auth.uid())
  and follower_user_id <> showcase_user_id
  and private.sparkle_finder_is_public_showcase_owner(showcase_user_id)
  and not private.sparkle_finder_has_collector_block_between(follower_user_id, showcase_user_id)
);

drop policy if exists "Users can insert showcase reports" on public.sparkle_finder_showcase_reports;
create policy "Users can insert showcase reports"
on public.sparkle_finder_showcase_reports
for insert
to authenticated
with check (
  reporter_user_id = (select auth.uid())
  and private.sparkle_finder_is_public_showcase_owner(showcase_user_id)
  and not private.sparkle_finder_has_collector_block_between(reporter_user_id, showcase_user_id)
  and (
    (
      target_type = 'showcase'
      and target_id = showcase_user_id::text
    )
    or (
      target_type = 'piece'
      and private.sparkle_finder_is_public_showcase_item(showcase_user_id, target_id)
    )
    or (
      target_type = 'comment'
      and exists (
        select 1
        from public.sparkle_finder_showcase_comments as comment
        where comment.id = case
            when target_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              then target_id::uuid
            else null
          end
          and comment.showcase_user_id = sparkle_finder_showcase_reports.showcase_user_id
          and comment.deleted_at is null
      )
    )
  )
);

revoke select on table public.sparkle_finder_profiles from authenticated;
revoke truncate, references, trigger on table public.sparkle_finder_profiles from anon, authenticated;
revoke select (
  email,
  phone_e164,
  phone_verified_at,
  sparkle_suite_rep_id,
  sparkle_suite_rep_claimed_at,
  hero_collection_item_id
) on public.sparkle_finder_profiles from anon;
grant select (
  user_id,
  display_name,
  email,
  phone_e164,
  phone_verified_at,
  state,
  tiktok_handle,
  bio,
  profile_visibility,
  is_rep,
  sparkle_suite_rep_id,
  created_at,
  updated_at,
  photo_url,
  sparkle_suite_rep_business_name,
  sparkle_suite_rep_public_site_slug,
  sparkle_suite_rep_claimed_at,
  showcase_handle,
  showcase_tagline,
  showcase_visibility,
  hero_collection_item_id
) on public.sparkle_finder_profiles to authenticated;

revoke select on table public.sparkle_finder_collection_items from authenticated;
revoke truncate, references, trigger on table public.sparkle_finder_collection_items from anon, authenticated;
revoke select (
  note,
  acquisition_source,
  acquisition_context,
  acquisition_marked_at
) on public.sparkle_finder_collection_items from anon;
grant select (
  id,
  user_id,
  jewelry_item_id,
  state,
  note,
  is_highlighted,
  created_at,
  updated_at,
  acquisition_source,
  acquisition_context,
  acquisition_marked_at,
  visibility,
  showcase_status,
  reveal_story,
  personal_photo_url,
  is_rarest_reveal
) on public.sparkle_finder_collection_items to authenticated;

-- Server-rendered public Showcase reads and server-only action guards use the
-- service role. BYPASSRLS does not imply table privileges, so keep these
-- explicit instead of relying on dashboard defaults.
grant select on table
  public.sparkle_finder_profiles,
  public.sparkle_finder_collection_items,
  public.sparkle_finder_showcase_collections,
  public.sparkle_finder_showcase_collection_items,
  public.sparkle_finder_showcase_comments,
  public.sparkle_finder_collector_follows,
  public.sparkle_finder_collector_blocks
to service_role;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end
$$;
