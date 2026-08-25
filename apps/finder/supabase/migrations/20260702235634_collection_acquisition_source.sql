alter table public.sparkle_finder_collection_items
  add column if not exists acquisition_source text not null default 'unknown',
  add column if not exists acquisition_context jsonb not null default '{}'::jsonb,
  add column if not exists acquisition_marked_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sparkle_finder_collection_items_acquisition_source_check'
  ) then
    alter table public.sparkle_finder_collection_items
      add constraint sparkle_finder_collection_items_acquisition_source_check
      check (
        acquisition_source in (
          'manual',
          'wishlist',
          'sparkle_finder_lead',
          'nic_nac_request',
          'unknown'
        )
      );
  end if;
end $$;

create index if not exists sparkle_finder_collection_items_user_acquisition_source_idx
  on public.sparkle_finder_collection_items(user_id, acquisition_source)
  where state = 'owned';

grant insert (
  acquisition_source,
  acquisition_context,
  acquisition_marked_at
) on public.sparkle_finder_collection_items to authenticated;

grant update (
  acquisition_source,
  acquisition_context,
  acquisition_marked_at
) on public.sparkle_finder_collection_items to authenticated;
