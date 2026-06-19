create table if not exists public.sparkle_finder_favorite_reps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rep_id text not null,
  rep_display_name text not null default '',
  rep_site_url text,
  rep_board_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, rep_id)
);

comment on table public.sparkle_finder_favorite_reps is
  'Customer-scoped compact favorite reps for Sparkle Finder. Rep data remains owned by Sparkle Suite/Finder read models; Silver-only private fields live in sparkle_finder_favorite_rep_details.';

create table if not exists public.sparkle_finder_favorite_rep_details (
  id uuid primary key default gen_random_uuid(),
  favorite_rep_id uuid not null references public.sparkle_finder_favorite_reps(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  notes text not null default '',
  notify_next_show boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (favorite_rep_id),
  unique (user_id, favorite_rep_id)
);

comment on column public.sparkle_finder_favorite_rep_details.notes is
  'Silver-only private collector notes. Do not expose through direct compact favorite rep reads.';

comment on column public.sparkle_finder_favorite_rep_details.notify_next_show is
  'Silver-only reminder-ready metadata. The app server must check Silver access before reads or writes.';

alter table public.sparkle_finder_favorite_reps enable row level security;
alter table public.sparkle_finder_favorite_rep_details enable row level security;

drop trigger if exists set_sparkle_finder_favorite_reps_updated_at on public.sparkle_finder_favorite_reps;
create trigger set_sparkle_finder_favorite_reps_updated_at
before update on public.sparkle_finder_favorite_reps
for each row execute function private.set_updated_at();

drop trigger if exists set_sparkle_finder_favorite_rep_details_updated_at on public.sparkle_finder_favorite_rep_details;
create trigger set_sparkle_finder_favorite_rep_details_updated_at
before update on public.sparkle_finder_favorite_rep_details
for each row execute function private.set_updated_at();

create index if not exists sparkle_finder_favorite_reps_user_id_idx
  on public.sparkle_finder_favorite_reps(user_id);

create index if not exists sparkle_finder_favorite_rep_details_user_id_idx
  on public.sparkle_finder_favorite_rep_details(user_id);

create index if not exists sparkle_finder_favorite_rep_details_favorite_rep_id_idx
  on public.sparkle_finder_favorite_rep_details(favorite_rep_id);

grant select, insert, update, delete on public.sparkle_finder_favorite_reps to authenticated;
grant select, insert, update, delete on public.sparkle_finder_favorite_rep_details to authenticated;

comment on table public.sparkle_finder_favorite_rep_details is
  'Private Silver favorite rep details. Owner RLS prevents cross-user leakage; authenticated grants support the app server/Silver-gated action path, which must enforce Sparkle Finder Silver entitlement before reads and writes.';

drop policy if exists "Favorite reps are readable by owner" on public.sparkle_finder_favorite_reps;
create policy "Favorite reps are readable by owner"
  on public.sparkle_finder_favorite_reps
  for select
  to authenticated
  using (auth.uid() = user_id);

comment on policy "Favorite reps are readable by owner" on public.sparkle_finder_favorite_reps is
  'Customers can read only their own compact favorite rep rows; no private Silver notes or notify metadata are stored on this table.';

drop policy if exists "Favorite reps are insertable by owner" on public.sparkle_finder_favorite_reps;
create policy "Favorite reps are insertable by owner"
  on public.sparkle_finder_favorite_reps
  for insert
  to authenticated
  with check (auth.uid() = user_id);

comment on policy "Favorite reps are insertable by owner" on public.sparkle_finder_favorite_reps is
  'Customers can create compact favorite rep rows only for their own Sparkle Finder account.';

drop policy if exists "Favorite reps are updatable by owner" on public.sparkle_finder_favorite_reps;
create policy "Favorite reps are updatable by owner"
  on public.sparkle_finder_favorite_reps
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on policy "Favorite reps are updatable by owner" on public.sparkle_finder_favorite_reps is
  'Customers can update only their own compact favorite rep metadata.';

drop policy if exists "Favorite reps are deletable by owner" on public.sparkle_finder_favorite_reps;
create policy "Favorite reps are deletable by owner"
  on public.sparkle_finder_favorite_reps
  for delete
  to authenticated
  using (auth.uid() = user_id);

comment on policy "Favorite reps are deletable by owner" on public.sparkle_finder_favorite_reps is
  'Customers can remove only their own favorite rep rows; related private details cascade with the favorite row.';

drop policy if exists "Favorite rep details are readable by owner" on public.sparkle_finder_favorite_rep_details;
create policy "Favorite rep details are readable by owner"
  on public.sparkle_finder_favorite_rep_details
  for select
  to authenticated
  using (auth.uid() = user_id);

comment on policy "Favorite rep details are readable by owner" on public.sparkle_finder_favorite_rep_details is
  'Customers can read only their own private detail rows. App server code must additionally enforce Silver entitlement before selecting this table.';

drop policy if exists "Favorite rep details are insertable by owner" on public.sparkle_finder_favorite_rep_details;
create policy "Favorite rep details are insertable by owner"
  on public.sparkle_finder_favorite_rep_details
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.sparkle_finder_favorite_reps favorite
      where favorite.id = favorite_rep_id
        and favorite.user_id = auth.uid()
    )
  );

comment on policy "Favorite rep details are insertable by owner" on public.sparkle_finder_favorite_rep_details is
  'Customers can create private detail rows only for their own favorite reps. App server code must additionally enforce Silver entitlement before inserts.';

drop policy if exists "Favorite rep details are updatable by owner" on public.sparkle_finder_favorite_rep_details;
create policy "Favorite rep details are updatable by owner"
  on public.sparkle_finder_favorite_rep_details
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.sparkle_finder_favorite_reps favorite
      where favorite.id = favorite_rep_id
        and favorite.user_id = auth.uid()
    )
  );

comment on policy "Favorite rep details are updatable by owner" on public.sparkle_finder_favorite_rep_details is
  'Customers can update private details only for their own favorite reps. App server code must additionally enforce Silver entitlement before updates.';

drop policy if exists "Favorite rep details are deletable by owner" on public.sparkle_finder_favorite_rep_details;
create policy "Favorite rep details are deletable by owner"
  on public.sparkle_finder_favorite_rep_details
  for delete
  to authenticated
  using (auth.uid() = user_id);

comment on policy "Favorite rep details are deletable by owner" on public.sparkle_finder_favorite_rep_details is
  'Customers can delete only their own private favorite rep detail rows.';

create table if not exists public.sparkle_finder_collector_follows (
  id uuid primary key default gen_random_uuid(),
  follower_user_id uuid not null references auth.users(id) on delete cascade,
  followed_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_user_id, followed_user_id),
  constraint sparkle_finder_collector_follows_no_self_follow
    check (follower_user_id <> followed_user_id)
);

comment on table public.sparkle_finder_collector_follows is
  'One-way public collector follows for Sparkle Finder discovery. This table does not create mutual friend requests, DMs, customer-to-customer trading, escrow, fulfillment, marketplace, or buy/sell workflows.';

comment on column public.sparkle_finder_collector_follows.follower_user_id is
  'The authenticated Sparkle Finder customer choosing to follow another public collector profile.';

comment on column public.sparkle_finder_collector_follows.followed_user_id is
  'The public collector profile being followed. Follows remain one-way by default.';

create table if not exists public.sparkle_finder_collector_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_user_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null default '',
  created_at timestamptz not null default now(),
  unique (blocker_user_id, blocked_user_id),
  constraint sparkle_finder_collector_blocks_no_self_block
    check (blocker_user_id <> blocked_user_id)
);

comment on table public.sparkle_finder_collector_blocks is
  'One-way collector blocks for Sparkle Finder safety boundaries. Blocks suppress collector discovery/follow surfaces and do not enable DMs, mutual friend requests, trading, buy/sell, escrow, or fulfillment.';

comment on column public.sparkle_finder_collector_blocks.reason is
  'Optional owner-private block context for moderation/support review. Do not expose this in public collector discovery.';

create table if not exists public.sparkle_finder_social_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null,
  target_id text not null,
  reason text not null,
  details text not null default '',
  created_at timestamptz not null default now(),
  constraint sparkle_finder_social_reports_target_type
    check (target_type in ('collector_profile', 'showcase', 'favorite_rep')),
  constraint sparkle_finder_social_reports_reason
    check (reason in ('spam', 'harassment', 'scam_or_impersonation', 'inappropriate', 'other')),
  constraint sparkle_finder_social_reports_details_length
    check (char_length(details) <= 700)
);

comment on table public.sparkle_finder_social_reports is
  'Moderation reports for Sparkle Finder social surfaces. Reports are insert-only for customers and are not publicly selectable; this is safety infrastructure, not messaging, trading, marketplace, escrow, fulfillment, or friend-request infrastructure.';

comment on column public.sparkle_finder_social_reports.details is
  'Optional report details capped at 700 characters by application normalization and database constraint.';

alter table public.sparkle_finder_collector_follows enable row level security;
alter table public.sparkle_finder_collector_blocks enable row level security;
alter table public.sparkle_finder_social_reports enable row level security;

create index if not exists sparkle_finder_collector_follows_follower_user_id_idx
  on public.sparkle_finder_collector_follows(follower_user_id);

create index if not exists sparkle_finder_collector_follows_followed_user_id_idx
  on public.sparkle_finder_collector_follows(followed_user_id);

create index if not exists sparkle_finder_collector_blocks_blocker_blocked_idx
  on public.sparkle_finder_collector_blocks(blocker_user_id, blocked_user_id);

create index if not exists sparkle_finder_collector_blocks_blocked_blocker_idx
  on public.sparkle_finder_collector_blocks(blocked_user_id, blocker_user_id);

create index if not exists sparkle_finder_social_reports_reporter_user_id_idx
  on public.sparkle_finder_social_reports(reporter_user_id);

create index if not exists sparkle_finder_social_reports_target_idx
  on public.sparkle_finder_social_reports(target_type, target_id);

create or replace function private.sparkle_finder_can_insert_collector_follow(
  follower_user_id uuid,
  followed_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public, private
as $$
  select
    follower_user_id <> followed_user_id
    and exists (
      select 1
      from public.sparkle_finder_profiles profile
      where profile.user_id = followed_user_id
        and profile.profile_visibility = 'sparkle_finder'
        and profile.showcase_visibility = 'public'
    )
    and not exists (
      select 1
      from public.sparkle_finder_collector_blocks block
      where (
        block.blocker_user_id = follower_user_id
        and block.blocked_user_id = followed_user_id
      )
      or (
        block.blocker_user_id = followed_user_id
        and block.blocked_user_id = follower_user_id
      )
    );
$$;

comment on function private.sparkle_finder_can_insert_collector_follow(uuid, uuid) is
  'RLS helper for one-way collector follows. Uses owner privileges so hidden block rows in either direction still prevent direct authenticated inserts to private, non-public-Showcase, or blocked collectors.';

revoke all on function private.sparkle_finder_can_insert_collector_follow(uuid, uuid) from public;
grant execute on function private.sparkle_finder_can_insert_collector_follow(uuid, uuid) to authenticated;

create or replace function private.sparkle_finder_can_insert_social_report(
  p_reporter_user_id uuid,
  p_target_type text,
  p_target_id text
)
returns boolean
language sql
security definer
set search_path = public, private
as $$
  select
    p_target_type = 'collector_profile'
    and p_reporter_user_id::text <> p_target_id
    and exists (
      select 1
      from public.sparkle_finder_profiles profile
      where profile.user_id::text = p_target_id
        and profile.profile_visibility = 'sparkle_finder'
        and profile.showcase_visibility = 'public'
    )
    and not exists (
      select 1
      from public.sparkle_finder_collector_blocks block
      where (
        block.blocker_user_id = p_reporter_user_id
        and block.blocked_user_id::text = p_target_id
      )
      or (
        block.blocker_user_id::text = p_target_id
        and block.blocked_user_id = p_reporter_user_id
      )
    );
$$;

comment on function private.sparkle_finder_can_insert_social_report(uuid, text, text) is
  'RLS helper for direct Sparkle Finder social report inserts. Only collector_profile targets are currently validated; other target types fail closed until they have target-specific public/reportable checks.';

revoke all on function private.sparkle_finder_can_insert_social_report(uuid, text, text) from public;
grant execute on function private.sparkle_finder_can_insert_social_report(uuid, text, text) to authenticated;

grant select, insert, delete on public.sparkle_finder_collector_follows to authenticated;
grant select, insert, delete on public.sparkle_finder_collector_blocks to authenticated;
revoke all on public.sparkle_finder_social_reports from anon, authenticated;
grant insert (
  reporter_user_id,
  target_type,
  target_id,
  reason,
  details
) on public.sparkle_finder_social_reports to authenticated;

drop policy if exists "Collector follows are readable by follower" on public.sparkle_finder_collector_follows;
create policy "Collector follows are readable by follower"
  on public.sparkle_finder_collector_follows
  for select
  to authenticated
  using (auth.uid() = follower_user_id);

comment on policy "Collector follows are readable by follower" on public.sparkle_finder_collector_follows is
  'Customers can read their own one-way following rows. Public follower/following counts should be served through reviewed app queries that respect block boundaries.';

drop policy if exists "Collector follows are insertable by follower" on public.sparkle_finder_collector_follows;
create policy "Collector follows are insertable by follower"
  on public.sparkle_finder_collector_follows
  for insert
  to authenticated
  with check (
    auth.uid() = follower_user_id
    and private.sparkle_finder_can_insert_collector_follow(follower_user_id, followed_user_id)
  );

comment on policy "Collector follows are insertable by follower" on public.sparkle_finder_collector_follows is
  'Customers can follow public collectors only as themselves. Direct inserts are allowed only when the followed Sparkle Finder profile has profile_visibility = sparkle_finder, showcase_visibility = public, and no collector block exists in either direction.';

drop policy if exists "Collector follows are deletable by follower" on public.sparkle_finder_collector_follows;
create policy "Collector follows are deletable by follower"
  on public.sparkle_finder_collector_follows
  for delete
  to authenticated
  using (auth.uid() = follower_user_id);

comment on policy "Collector follows are deletable by follower" on public.sparkle_finder_collector_follows is
  'Customers can unfollow by deleting only their own one-way follow rows.';

drop policy if exists "Collector blocks are readable by blocker" on public.sparkle_finder_collector_blocks;
create policy "Collector blocks are readable by blocker"
  on public.sparkle_finder_collector_blocks
  for select
  to authenticated
  using (auth.uid() = blocker_user_id);

comment on policy "Collector blocks are readable by blocker" on public.sparkle_finder_collector_blocks is
  'Customers can read only block rows they created; public discovery should use server-side checks to suppress blocked relationships in both directions.';

drop policy if exists "Collector blocks are insertable by blocker" on public.sparkle_finder_collector_blocks;
create policy "Collector blocks are insertable by blocker"
  on public.sparkle_finder_collector_blocks
  for insert
  to authenticated
  with check (auth.uid() = blocker_user_id and blocker_user_id <> blocked_user_id);

comment on policy "Collector blocks are insertable by blocker" on public.sparkle_finder_collector_blocks is
  'Customers can create block boundaries only as themselves. Blocking does not create DMs, trading, marketplace, buy/sell, escrow, fulfillment, or mutual friend-request behavior.';

drop policy if exists "Collector blocks are deletable by blocker" on public.sparkle_finder_collector_blocks;
create policy "Collector blocks are deletable by blocker"
  on public.sparkle_finder_collector_blocks
  for delete
  to authenticated
  using (auth.uid() = blocker_user_id);

comment on policy "Collector blocks are deletable by blocker" on public.sparkle_finder_collector_blocks is
  'Customers can remove only block rows they created.';

drop policy if exists "Users can insert Sparkle Finder social reports" on public.sparkle_finder_social_reports;
create policy "Users can insert Sparkle Finder social reports"
  on public.sparkle_finder_social_reports
  for insert
  to authenticated
  with check (
    auth.uid() = reporter_user_id
    and private.sparkle_finder_can_insert_social_report(reporter_user_id, target_type, target_id)
  );

comment on policy "Users can insert Sparkle Finder social reports" on public.sparkle_finder_social_reports is
  'Customers can submit moderation reports as themselves only for reportable public collector profiles. No select policy is defined, so customer clients cannot browse reports; non-collector report targets fail closed until validated by target-specific RLS helpers.';

create or replace function public.sparkle_finder_search_public_collectors(
  search_query text default '',
  result_limit integer default 12
)
returns table (
  user_id uuid,
  showcase_handle text,
  display_name text,
  showcase_tagline text,
  photo_url text,
  follower_count bigint,
  following_count bigint,
  public_piece_count bigint,
  is_followed_by_viewer boolean,
  is_blocked_by_viewer boolean
)
language sql
security definer
set search_path = public, private
as $$
  with viewer as (
    select auth.uid() as user_id
  ),
  visible_profiles as (
    select
      profile.user_id,
      profile.showcase_handle,
      profile.display_name,
      coalesce(profile.showcase_tagline, '') as showcase_tagline,
      profile.photo_url
    from public.sparkle_finder_profiles profile
    cross join viewer
    where viewer.user_id is not null
      and profile.profile_visibility = 'sparkle_finder'
      and profile.showcase_visibility = 'public'
      and profile.showcase_handle is not null
      and profile.showcase_handle <> ''
      and not exists (
        select 1
        from public.sparkle_finder_collector_blocks block
        where (
          block.blocker_user_id = viewer.user_id
          and block.blocked_user_id = profile.user_id
        )
        or (
          block.blocker_user_id = profile.user_id
          and block.blocked_user_id = viewer.user_id
        )
      )
      and (
        coalesce(trim(search_query), '') = ''
        or profile.showcase_handle ilike '%' || trim(search_query) || '%'
        or profile.display_name ilike '%' || trim(search_query) || '%'
      )
  )
  select
    profile.user_id,
    profile.showcase_handle,
    profile.display_name,
    profile.showcase_tagline,
    profile.photo_url,
    (
      select count(*)
      from public.sparkle_finder_collector_follows follow
      where follow.followed_user_id = profile.user_id
        and not exists (
          select 1
          from public.sparkle_finder_collector_blocks block
          where (
            block.blocker_user_id = follow.follower_user_id
            and block.blocked_user_id = follow.followed_user_id
          )
          or (
            block.blocker_user_id = follow.followed_user_id
            and block.blocked_user_id = follow.follower_user_id
          )
        )
    ) as follower_count,
    (
      select count(*)
      from public.sparkle_finder_collector_follows follow
      where follow.follower_user_id = profile.user_id
        and exists (
          select 1
          from public.sparkle_finder_profiles followed_profile
          where followed_profile.user_id = follow.followed_user_id
            and followed_profile.profile_visibility = 'sparkle_finder'
            and followed_profile.showcase_visibility = 'public'
        )
        and not exists (
          select 1
          from public.sparkle_finder_collector_blocks block
          where (
            block.blocker_user_id = follow.follower_user_id
            and block.blocked_user_id = follow.followed_user_id
          )
          or (
            block.blocker_user_id = follow.followed_user_id
            and block.blocked_user_id = follow.follower_user_id
          )
        )
    ) as following_count,
    (
      select count(*)
      from public.sparkle_finder_collection_items item
      where item.user_id = profile.user_id
        and item.visibility = 'public'
    ) as public_piece_count,
    exists (
      select 1
      from public.sparkle_finder_collector_follows follow
      cross join viewer
      where follow.follower_user_id = viewer.user_id
        and follow.followed_user_id = profile.user_id
    ) as is_followed_by_viewer,
    exists (
      select 1
      from public.sparkle_finder_collector_blocks block
      cross join viewer
      where block.blocker_user_id = viewer.user_id
        and block.blocked_user_id = profile.user_id
    ) as is_blocked_by_viewer
  from visible_profiles profile
  order by profile.display_name asc, profile.showcase_handle asc
  limit least(greatest(coalesce(result_limit, 12), 1), 50);
$$;

comment on function public.sparkle_finder_search_public_collectors(text, integer) is
  'Server-side collector discovery read model. Uses auth.uid(), public Showcase/profile visibility, and collector blocks in either direction before returning counts or follow state. This is discovery only and does not create DMs, friend requests, trading, escrow, fulfillment, or marketplace behavior.';

revoke all on function public.sparkle_finder_search_public_collectors(text, integer) from public;
grant execute on function public.sparkle_finder_search_public_collectors(text, integer) to authenticated;
