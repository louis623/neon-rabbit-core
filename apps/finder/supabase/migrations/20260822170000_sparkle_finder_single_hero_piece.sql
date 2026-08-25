-- Store the single Hero Piece on the owner profile so Reveal/rarity compatibility
-- fields on collection items remain independent.
alter table public.sparkle_finder_profiles
  add column if not exists hero_collection_item_id uuid
    references public.sparkle_finder_collection_items(id) on delete set null;

create index if not exists sparkle_finder_profiles_hero_collection_item_idx
  on public.sparkle_finder_profiles(hero_collection_item_id)
  where hero_collection_item_id is not null;

create or replace function public.set_sparkle_finder_hero_piece(collection_item_id uuid)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  authenticated_user_id uuid := auth.uid();
begin
  if authenticated_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  perform 1
  from public.sparkle_finder_collection_items
  where id = set_sparkle_finder_hero_piece.collection_item_id
    and user_id = authenticated_user_id
    and state = 'owned';

  if not found then
    raise exception 'Owned collection item not found'
      using errcode = 'P0002';
  end if;

  update public.sparkle_finder_profiles
  set hero_collection_item_id = set_sparkle_finder_hero_piece.collection_item_id
  where user_id = authenticated_user_id;

  if not found then
    raise exception 'Sparkle Finder profile not found'
      using errcode = 'P0002';
  end if;

  return true;
end;
$$;

comment on function public.set_sparkle_finder_hero_piece(uuid) is
  'Atomically selects exactly one owned Hero Piece for the authenticated Sparkle Finder customer.';

revoke all on function public.set_sparkle_finder_hero_piece(uuid) from public;
revoke all on function public.set_sparkle_finder_hero_piece(uuid) from anon;
grant execute on function public.set_sparkle_finder_hero_piece(uuid) to authenticated;
