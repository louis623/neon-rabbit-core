create index if not exists sparkle_finder_favorite_reps_rep_id_idx
  on public.sparkle_finder_favorite_reps(rep_id);

create or replace function public.get_sparkle_finder_rep_favorite_counts(p_rep_ids text[])
returns table (
  rep_id text,
  favorite_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select favorite.rep_id, count(*)::bigint as favorite_count
  from public.sparkle_finder_favorite_reps as favorite
  where coalesce(cardinality(p_rep_ids), 0) between 1 and 200
    and favorite.rep_id = any(p_rep_ids)
  group by favorite.rep_id;
$$;

comment on function public.get_sparkle_finder_rep_favorite_counts(text[]) is
  'Returns anonymous aggregate favorite totals for up to 200 supplied Sparkle Suite rep ids. It does not expose Finder customer identities.';

revoke all on function public.get_sparkle_finder_rep_favorite_counts(text[]) from public;
grant execute on function public.get_sparkle_finder_rep_favorite_counts(text[]) to authenticated;

alter table public.sparkle_finder_favorite_reps
  add constraint sparkle_finder_favorite_reps_rep_id_length
  check (char_length(btrim(rep_id)) between 1 and 200);

create or replace function private.sparkle_finder_can_insert_favorite_rep(
  p_user_id uuid,
  p_rep_id text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_user_id = (select auth.uid())
    and char_length(btrim(p_rep_id)) between 1 and 200
    and (
      exists (
        select 1
        from public.sparkle_finder_favorite_reps as favorite
        where favorite.user_id = p_user_id
          and favorite.rep_id = p_rep_id
      )
      or exists (
        select 1
        from public.sparkle_finder_memberships as membership
        where membership.user_id = p_user_id
          and (
            membership.access_state = 'silver_rep_included'
            or (
              membership.access_state = 'silver_paid'
              and (membership.silver_ends_at is null or membership.silver_ends_at >= now())
            )
            or (
              membership.access_state = 'silver_trial'
              and membership.trial_ends_at >= now()
            )
          )
      )
      or (
        select count(*)
        from public.sparkle_finder_favorite_reps as favorite
        where favorite.user_id = p_user_id
      ) < 5
    );
$$;

comment on function private.sparkle_finder_can_insert_favorite_rep(uuid, text) is
  'RLS helper that enforces the five-rep Free limit while allowing active Silver customers to save additional reps.';

revoke all on function private.sparkle_finder_can_insert_favorite_rep(uuid, text) from public;
grant execute on function private.sparkle_finder_can_insert_favorite_rep(uuid, text) to authenticated;

revoke all on table public.sparkle_finder_favorite_reps from anon, authenticated;
grant select, insert, update, delete on table public.sparkle_finder_favorite_reps to authenticated;

revoke all on table public.sparkle_finder_favorite_rep_details from anon, authenticated;
grant select, insert, update, delete on table public.sparkle_finder_favorite_rep_details to authenticated;

drop policy if exists "Favorite reps are insertable by owner" on public.sparkle_finder_favorite_reps;
create policy "Favorite reps are insertable by owner"
  on public.sparkle_finder_favorite_reps
  for insert
  to authenticated
  with check (
    private.sparkle_finder_can_insert_favorite_rep(user_id, rep_id)
  );

comment on policy "Favorite reps are insertable by owner" on public.sparkle_finder_favorite_reps is
  'Customers can create favorite rows only for themselves. Direct database inserts enforce the Free limit as well as the app action.';
