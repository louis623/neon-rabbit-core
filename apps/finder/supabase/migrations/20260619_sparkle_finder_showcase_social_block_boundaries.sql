create or replace function private.sparkle_finder_has_collector_block_between(
  left_user_id uuid,
  right_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.sparkle_finder_collector_blocks block
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

comment on function private.sparkle_finder_has_collector_block_between(uuid, uuid) is
  'Shared RLS helper for Sparkle Finder social surfaces. Hidden block rows in either direction suppress follows, comments, and reports on older Showcase tables.';

revoke all on function private.sparkle_finder_has_collector_block_between(uuid, uuid) from public;
grant execute on function private.sparkle_finder_has_collector_block_between(uuid, uuid) to authenticated;

drop policy if exists "Public can select public showcase profiles" on public.sparkle_finder_profiles;
create policy "Public can select public showcase profiles"
on public.sparkle_finder_profiles
for select
to anon, authenticated
using (
  profile_visibility = 'sparkle_finder'
  and showcase_visibility = 'public'
);

drop policy if exists "Users can follow public showcases" on public.sparkle_finder_showcase_follows;
create policy "Users can follow public showcases"
on public.sparkle_finder_showcase_follows
for insert
to authenticated
with check (
  follower_user_id = auth.uid()
  and follower_user_id <> showcase_user_id
  and not private.sparkle_finder_has_collector_block_between(follower_user_id, showcase_user_id)
  and exists (
    select 1
    from public.sparkle_finder_profiles profile
    where profile.user_id = sparkle_finder_showcase_follows.showcase_user_id
      and profile.profile_visibility = 'sparkle_finder'
      and profile.showcase_visibility = 'public'
  )
);

drop policy if exists "Users can insert comments on public showcases" on public.sparkle_finder_showcase_comments;
create policy "Users can insert comments on public showcases"
on public.sparkle_finder_showcase_comments
for insert
to authenticated
with check (
  author_user_id = auth.uid()
  and deleted_at is null
  and not private.sparkle_finder_has_collector_block_between(author_user_id, showcase_user_id)
  and exists (
    select 1
    from public.sparkle_finder_profiles profile
    where profile.user_id = sparkle_finder_showcase_comments.showcase_user_id
      and profile.profile_visibility = 'sparkle_finder'
      and profile.showcase_visibility = 'public'
  )
  and (
    target_type = 'showcase'
    or (
      target_type = 'piece'
      and exists (
        select 1
        from public.sparkle_finder_collection_items collection_item
        where collection_item.id::text = sparkle_finder_showcase_comments.target_id
          and collection_item.user_id = sparkle_finder_showcase_comments.showcase_user_id
          and collection_item.visibility = 'public'
      )
    )
  )
);

drop policy if exists "Users can insert showcase reports" on public.sparkle_finder_showcase_reports;
create policy "Users can insert showcase reports"
on public.sparkle_finder_showcase_reports
for insert
to authenticated
with check (
  reporter_user_id = auth.uid()
  and not private.sparkle_finder_has_collector_block_between(reporter_user_id, showcase_user_id)
  and exists (
    select 1
    from public.sparkle_finder_profiles profile
    where profile.user_id = sparkle_finder_showcase_reports.showcase_user_id
      and profile.profile_visibility = 'sparkle_finder'
      and profile.showcase_visibility = 'public'
  )
);
