alter table public.sparkle_finder_profiles
  add column if not exists showcase_handle text unique,
  add column if not exists showcase_tagline text not null default '',
  add column if not exists photo_url text,
  add column if not exists showcase_visibility text not null default 'private'
    check (showcase_visibility in ('private', 'public'));

create index sparkle_finder_profiles_showcase_visibility_idx
  on public.sparkle_finder_profiles(showcase_visibility);

alter table public.sparkle_finder_collection_items
  add column if not exists visibility text not null default 'private'
    check (visibility in ('private', 'public')),
  add column if not exists showcase_status text not null default 'owned'
    check (showcase_status in ('owned', 'wishlist', 'iso', 'private_note_only')),
  add column if not exists reveal_story text not null default '',
  add column if not exists personal_photo_url text,
  add column if not exists is_rarest_reveal boolean not null default false;

create index sparkle_finder_collection_items_user_visibility_idx
  on public.sparkle_finder_collection_items(user_id, visibility);

create index sparkle_finder_collection_items_user_showcase_status_idx
  on public.sparkle_finder_collection_items(user_id, showcase_status);

create table public.sparkle_finder_showcase_collections (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  slug text not null,
  description text not null default '',
  visibility text not null default 'private'
    check (visibility in ('private', 'public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug)
);

create index sparkle_finder_showcase_collections_user_id_idx
  on public.sparkle_finder_showcase_collections(user_id);

create index sparkle_finder_showcase_collections_visibility_idx
  on public.sparkle_finder_showcase_collections(visibility);

create index sparkle_finder_showcase_collections_user_visibility_idx
  on public.sparkle_finder_showcase_collections(user_id, visibility);

create table public.sparkle_finder_showcase_collection_items (
  showcase_collection_id uuid not null
    references public.sparkle_finder_showcase_collections(id) on delete cascade,
  collection_item_id uuid not null
    references public.sparkle_finder_collection_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (showcase_collection_id, collection_item_id)
);

create index sparkle_finder_showcase_collection_items_collection_idx
  on public.sparkle_finder_showcase_collection_items(showcase_collection_id);

create index sparkle_finder_showcase_collection_items_item_idx
  on public.sparkle_finder_showcase_collection_items(collection_item_id);

create table public.sparkle_finder_showcase_follows (
  follower_user_id uuid not null references auth.users(id) on delete cascade,
  showcase_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_user_id, showcase_user_id),
  check (follower_user_id <> showcase_user_id)
);

create index sparkle_finder_showcase_follows_showcase_user_id_idx
  on public.sparkle_finder_showcase_follows(showcase_user_id);

create table public.sparkle_finder_showcase_comments (
  id uuid primary key default extensions.gen_random_uuid(),
  showcase_user_id uuid not null references auth.users(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('showcase', 'piece')),
  target_id text not null,
  body text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sparkle_finder_showcase_comments_showcase_user_id_idx
  on public.sparkle_finder_showcase_comments(showcase_user_id);

create index sparkle_finder_showcase_comments_author_user_id_idx
  on public.sparkle_finder_showcase_comments(author_user_id);

create index sparkle_finder_showcase_comments_target_idx
  on public.sparkle_finder_showcase_comments(target_type, target_id);

create index sparkle_finder_showcase_comments_public_target_idx
  on public.sparkle_finder_showcase_comments(showcase_user_id, target_type, target_id)
  where deleted_at is null;

create table public.sparkle_finder_showcase_reports (
  id uuid primary key default extensions.gen_random_uuid(),
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  showcase_user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('showcase', 'piece', 'comment')),
  target_id text not null,
  reason text not null
    check (reason in ('spam', 'harassment', 'scam_or_impersonation', 'inappropriate', 'other')),
  details text not null default '',
  created_at timestamptz not null default now()
);

create index sparkle_finder_showcase_reports_reporter_user_id_idx
  on public.sparkle_finder_showcase_reports(reporter_user_id);

create index sparkle_finder_showcase_reports_showcase_user_id_idx
  on public.sparkle_finder_showcase_reports(showcase_user_id);

create index sparkle_finder_showcase_reports_target_idx
  on public.sparkle_finder_showcase_reports(target_type, target_id);

alter table public.sparkle_finder_showcase_collections enable row level security;
alter table public.sparkle_finder_showcase_collection_items enable row level security;
alter table public.sparkle_finder_showcase_follows enable row level security;
alter table public.sparkle_finder_showcase_comments enable row level security;
alter table public.sparkle_finder_showcase_reports enable row level security;

create trigger set_sparkle_finder_showcase_collections_updated_at
before update on public.sparkle_finder_showcase_collections
for each row execute function private.set_updated_at();

create trigger set_sparkle_finder_showcase_comments_updated_at
before update on public.sparkle_finder_showcase_comments
for each row execute function private.set_updated_at();

create policy "Public can select public showcase profiles"
on public.sparkle_finder_profiles
for select
to anon, authenticated
using (showcase_visibility = 'public');

create policy "Public can select public showcase collection items"
on public.sparkle_finder_collection_items
for select
to anon, authenticated
using (
  visibility = 'public'
  and exists (
    select 1
    from public.sparkle_finder_profiles profile
    where profile.user_id = sparkle_finder_collection_items.user_id
      and profile.showcase_visibility = 'public'
  )
);

create policy "Users can select their own showcase collections"
on public.sparkle_finder_showcase_collections
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert their own showcase collections"
on public.sparkle_finder_showcase_collections
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update their own showcase collections"
on public.sparkle_finder_showcase_collections
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete their own showcase collections"
on public.sparkle_finder_showcase_collections
for delete
to authenticated
using (user_id = auth.uid());

create policy "Public can select public showcase collections"
on public.sparkle_finder_showcase_collections
for select
to anon, authenticated
using (
  visibility = 'public'
  and exists (
    select 1
    from public.sparkle_finder_profiles profile
    where profile.user_id = sparkle_finder_showcase_collections.user_id
      and profile.showcase_visibility = 'public'
  )
);

create policy "Users can select joins for their own showcase collections"
on public.sparkle_finder_showcase_collection_items
for select
to authenticated
using (
  exists (
    select 1
    from public.sparkle_finder_showcase_collections showcase_collection
    where showcase_collection.id = sparkle_finder_showcase_collection_items.showcase_collection_id
      and showcase_collection.user_id = auth.uid()
  )
);

create policy "Users can insert joins for their own showcase collections"
on public.sparkle_finder_showcase_collection_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.sparkle_finder_showcase_collections showcase_collection
    where showcase_collection.id = sparkle_finder_showcase_collection_items.showcase_collection_id
      and showcase_collection.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.sparkle_finder_collection_items collection_item
    where collection_item.id = sparkle_finder_showcase_collection_items.collection_item_id
      and collection_item.user_id = auth.uid()
  )
);

create policy "Users can delete joins for their own showcase collections"
on public.sparkle_finder_showcase_collection_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.sparkle_finder_showcase_collections showcase_collection
    where showcase_collection.id = sparkle_finder_showcase_collection_items.showcase_collection_id
      and showcase_collection.user_id = auth.uid()
  )
);

create policy "Public can select public showcase collection joins"
on public.sparkle_finder_showcase_collection_items
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.sparkle_finder_showcase_collections showcase_collection
    join public.sparkle_finder_profiles profile
      on profile.user_id = showcase_collection.user_id
    join public.sparkle_finder_collection_items collection_item
      on collection_item.id = sparkle_finder_showcase_collection_items.collection_item_id
    where showcase_collection.id = sparkle_finder_showcase_collection_items.showcase_collection_id
      and showcase_collection.visibility = 'public'
      and profile.showcase_visibility = 'public'
      and collection_item.user_id = showcase_collection.user_id
      and collection_item.visibility = 'public'
  )
);

create policy "Users can select their own showcase follows"
on public.sparkle_finder_showcase_follows
for select
to authenticated
using (follower_user_id = auth.uid() or showcase_user_id = auth.uid());

create policy "Users can follow public showcases"
on public.sparkle_finder_showcase_follows
for insert
to authenticated
with check (
  follower_user_id = auth.uid()
  and follower_user_id <> showcase_user_id
  and exists (
    select 1
    from public.sparkle_finder_profiles profile
    where profile.user_id = sparkle_finder_showcase_follows.showcase_user_id
      and profile.showcase_visibility = 'public'
  )
);

create policy "Users can unfollow showcases"
on public.sparkle_finder_showcase_follows
for delete
to authenticated
using (follower_user_id = auth.uid());

create policy "Public can select non-deleted comments on public showcases"
on public.sparkle_finder_showcase_comments
for select
to anon, authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from public.sparkle_finder_profiles profile
    where profile.user_id = sparkle_finder_showcase_comments.showcase_user_id
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

create policy "Users can insert comments on public showcases"
on public.sparkle_finder_showcase_comments
for insert
to authenticated
with check (
  author_user_id = auth.uid()
  and deleted_at is null
  and exists (
    select 1
    from public.sparkle_finder_profiles profile
    where profile.user_id = sparkle_finder_showcase_comments.showcase_user_id
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

create policy "Comment authors can update their own non-deleted body"
on public.sparkle_finder_showcase_comments
for update
to authenticated
using (author_user_id = auth.uid() and deleted_at is null)
with check (author_user_id = auth.uid() and deleted_at is null);

create policy "Comment authors and showcase owners can soft delete comments"
on public.sparkle_finder_showcase_comments
for update
to authenticated
using (author_user_id = auth.uid() or showcase_user_id = auth.uid())
with check (author_user_id = auth.uid() or showcase_user_id = auth.uid());

create policy "Users can insert showcase reports"
on public.sparkle_finder_showcase_reports
for insert
to authenticated
with check (
  reporter_user_id = auth.uid()
  and exists (
    select 1
    from public.sparkle_finder_profiles profile
    where profile.user_id = sparkle_finder_showcase_reports.showcase_user_id
      and profile.showcase_visibility = 'public'
  )
);

create or replace function public.sparkle_finder_edit_showcase_comment(comment_id uuid, new_body text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.sparkle_finder_showcase_comments
  set body = left(trim(coalesce($2, '')), 500)
  where id = $1
    and author_user_id = auth.uid()
    and deleted_at is null
    and length(trim(coalesce($2, ''))) > 0;
end;
$$;

create or replace function public.sparkle_finder_delete_showcase_comment(comment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.sparkle_finder_showcase_comments
  set deleted_at = now()
  where id = $1
    and deleted_at is null
    and (
      author_user_id = auth.uid()
      or showcase_user_id = auth.uid()
    );
end;
$$;

revoke all on public.sparkle_finder_showcase_reports from anon;
revoke all on public.sparkle_finder_showcase_reports from authenticated;
revoke all on function public.sparkle_finder_edit_showcase_comment(uuid, text) from public;
revoke all on function public.sparkle_finder_delete_showcase_comment(uuid) from public;

grant usage on schema public to anon;
grant usage on schema public to authenticated;

grant select (
  user_id,
  display_name,
  state,
  tiktok_handle,
  bio,
  is_rep,
  showcase_handle,
  showcase_tagline,
  photo_url,
  showcase_visibility,
  created_at,
  updated_at
) on public.sparkle_finder_profiles to anon;

grant update (
  showcase_handle,
  showcase_tagline,
  photo_url,
  showcase_visibility
) on public.sparkle_finder_profiles to authenticated;

grant select (
  id,
  user_id,
  jewelry_item_id,
  state,
  is_highlighted,
  visibility,
  showcase_status,
  reveal_story,
  personal_photo_url,
  is_rarest_reveal,
  created_at,
  updated_at
) on public.sparkle_finder_collection_items to anon;

grant insert (
  visibility,
  showcase_status,
  reveal_story,
  personal_photo_url,
  is_rarest_reveal
) on public.sparkle_finder_collection_items to authenticated;

grant update (
  visibility,
  showcase_status,
  reveal_story,
  personal_photo_url,
  is_rarest_reveal
) on public.sparkle_finder_collection_items to authenticated;

grant select, delete on public.sparkle_finder_showcase_collections to authenticated;
grant select on public.sparkle_finder_showcase_collections to anon;
grant insert (
  user_id,
  title,
  slug,
  description,
  visibility
) on public.sparkle_finder_showcase_collections to authenticated;
grant update (
  title,
  slug,
  description,
  visibility
) on public.sparkle_finder_showcase_collections to authenticated;

grant select, delete on public.sparkle_finder_showcase_collection_items to authenticated;
grant select on public.sparkle_finder_showcase_collection_items to anon;
grant insert (
  showcase_collection_id,
  collection_item_id
) on public.sparkle_finder_showcase_collection_items to authenticated;

grant select, delete on public.sparkle_finder_showcase_follows to authenticated;
grant insert (
  follower_user_id,
  showcase_user_id
) on public.sparkle_finder_showcase_follows to authenticated;

grant select on public.sparkle_finder_showcase_comments to anon, authenticated;
grant insert (
  showcase_user_id,
  author_user_id,
  target_type,
  target_id,
  body
) on public.sparkle_finder_showcase_comments to authenticated;
revoke update on public.sparkle_finder_showcase_comments from authenticated;
grant execute on function public.sparkle_finder_edit_showcase_comment(uuid, text) to authenticated;
grant execute on function public.sparkle_finder_delete_showcase_comment(uuid) to authenticated;

grant insert (
  reporter_user_id,
  showcase_user_id,
  target_type,
  target_id,
  reason,
  details
) on public.sparkle_finder_showcase_reports to authenticated;
