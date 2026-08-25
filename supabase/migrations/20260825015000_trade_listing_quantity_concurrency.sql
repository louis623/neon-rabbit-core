-- Reconcile any active duplicates before enforcing one row per exact catalog
-- grouping. This includes mixed available/pending_trade rows and preserves all
-- requests by moving them onto the oldest keeper.
create temporary table _trade_listing_catalog_reconcile on commit drop as
select
  id,
  first_value(id) over catalog_group as keeper_id,
  row_number() over catalog_group as group_row_number,
  sum(quantity_available) over catalog_group as total_quantity,
  count(*) over catalog_group as group_count
from public.trade_listings
where listing_source = 'catalog'
  and status in ('available', 'pending_trade')
window catalog_group as (
  partition by
    rep_id,
    design_id,
    ring_size,
    listing_photo_url,
    uses_canonical_photo,
    rep_notes,
    trade_preferences
  order by created_at asc, id asc
  rows between unbounded preceding and unbounded following
);

update public.trade_requests request
set listing_id = reconcile.keeper_id,
    updated_at = now()
from _trade_listing_catalog_reconcile reconcile
where reconcile.group_row_number > 1
  and request.listing_id = reconcile.id;

update public.trade_listings duplicate
set status = 'removed',
    quantity_available = 0,
    removal_reason = 'mistake',
    deleted_at = coalesce(duplicate.deleted_at, now()),
    updated_at = now()
from _trade_listing_catalog_reconcile reconcile
where reconcile.group_row_number > 1
  and duplicate.id = reconcile.id;

update public.trade_listings keeper
set quantity_available = grouped.total_quantity,
    status = case
      when (
        select count(*)
        from public.trade_requests request
        where request.listing_id = keeper.id
          and request.status = 'pending'
      ) >= grouped.total_quantity then 'pending_trade'::listing_status
      else 'available'::listing_status
    end,
    updated_at = now()
from (
  select distinct keeper_id, total_quantity
  from _trade_listing_catalog_reconcile
  where group_count > 1
) grouped
where keeper.id = grouped.keeper_id;

-- The uniqueness key is fixed-width so unbounded notes/preferences and long
-- photo URLs can never exceed PostgreSQL's B-tree tuple limit. The mutation
-- RPC still performs exact IS NOT DISTINCT FROM comparisons before grouping.
create or replace function public.trade_listing_catalog_group_digest(
  p_rep_id uuid,
  p_design_id uuid,
  p_ring_size text,
  p_listing_photo_url text,
  p_uses_canonical_photo boolean,
  p_rep_notes text,
  p_trade_preferences text
) returns text
language sql
immutable
parallel safe
as $$
  select
    md5(jsonb_build_array(
      p_rep_id,
      p_design_id,
      p_ring_size,
      p_listing_photo_url,
      p_uses_canonical_photo,
      p_rep_notes,
      p_trade_preferences
    )::text)
    || md5('sparkle-suite:' || jsonb_build_array(
      p_rep_id,
      p_design_id,
      p_ring_size,
      p_listing_photo_url,
      p_uses_canonical_photo,
      p_rep_notes,
      p_trade_preferences
    )::text)
$$;

create unique index if not exists idx_trade_listings_active_catalog_group_unique
  on public.trade_listings (
    public.trade_listing_catalog_group_digest(
      rep_id,
      design_id,
      ring_size,
      listing_photo_url,
      uses_canonical_photo,
      rep_notes,
      trade_preferences
    )
  )
  where listing_source = 'catalog'
    and status in ('available', 'pending_trade');

-- Keep the legacy seven-argument entrypoint compatible during a schema-first
-- rollout. It shares the exact group lock and pending-aware quantity rules
-- with v2, but intentionally has no mutation receipt because the old caller
-- has no idempotency identity to supply.
create or replace function public.rpc_add_or_increment_catalog_listing(
  p_rep_id uuid,
  p_design_id uuid,
  p_rep_notes text default null,
  p_trade_preferences text default null,
  p_ring_size text default null,
  p_listing_photo_url text default null,
  p_uses_canonical_photo boolean default true
) returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_listing public.trade_listings%rowtype;
  v_grouped_with_existing boolean := false;
  v_pending_count integer := 0;
  v_new_quantity integer;
  v_group_key text;
begin
  if p_rep_id is null or p_design_id is null then
    raise exception 'invalid catalog listing scope'
      using errcode = '22023';
  end if;

  v_group_key := public.trade_listing_catalog_group_digest(
    p_rep_id,
    p_design_id,
    p_ring_size,
    p_listing_photo_url,
    p_uses_canonical_photo,
    p_rep_notes,
    p_trade_preferences
  );
  perform pg_advisory_xact_lock(hashtextextended(v_group_key, 0));

  select *
    into v_listing
  from public.trade_listings
  where rep_id = p_rep_id
    and design_id = p_design_id
    and listing_source = 'catalog'
    and status in ('available', 'pending_trade')
    and ring_size is not distinct from p_ring_size
    and listing_photo_url is not distinct from p_listing_photo_url
    and uses_canonical_photo is not distinct from p_uses_canonical_photo
    and rep_notes is not distinct from p_rep_notes
    and trade_preferences is not distinct from p_trade_preferences
  order by created_at asc, id asc
  limit 1
  for update;

  if found then
    v_grouped_with_existing := true;
    v_new_quantity := v_listing.quantity_available + 1;

    select count(*)::integer
      into v_pending_count
    from public.trade_requests
    where listing_id = v_listing.id
      and status = 'pending';

    update public.trade_listings
    set quantity_available = v_new_quantity,
        status = case
          when v_pending_count >= v_new_quantity then 'pending_trade'::listing_status
          else 'available'::listing_status
        end,
        updated_at = now()
    where id = v_listing.id
    returning * into v_listing;
  else
    insert into public.trade_listings (
      rep_id, design_id, listing_source, status, rep_notes,
      trade_preferences, ring_size, listing_photo_url,
      uses_canonical_photo, quantity_available, listed_at
    ) values (
      p_rep_id, p_design_id, 'catalog', 'available', p_rep_notes,
      p_trade_preferences, p_ring_size, p_listing_photo_url,
      p_uses_canonical_photo, 1, now()
    )
    returning * into v_listing;
  end if;

  return json_build_object(
    'listing_id', v_listing.id,
    'status', v_listing.status,
    'quantity_available', v_listing.quantity_available,
    'grouped_with_existing', v_grouped_with_existing
  );
end;
$$;

revoke all on function public.rpc_add_or_increment_catalog_listing(
  uuid, uuid, text, text, text, text, boolean
) from public, anon, authenticated;
grant execute on function public.rpc_add_or_increment_catalog_listing(
  uuid, uuid, text, text, text, text, boolean
) to service_role;

-- A durable receipt makes the physical-piece increment safe when the database
-- commits but the HTTP response is lost. Replaying the same logical mutation
-- returns the original result without incrementing quantity again.
create table if not exists public.trade_listing_add_mutations (
  idempotency_key text not null,
  rep_id uuid not null references public.reps(id) on delete cascade,
  input_signature text not null,
  listing_id uuid not null references public.trade_listings(id) on delete cascade,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (rep_id, idempotency_key),
  constraint trade_listing_add_mutations_key_length
    check (length(idempotency_key) between 1 and 300),
  constraint trade_listing_add_mutations_signature_length
    check (length(input_signature) between 1 and 128)
);

alter table public.trade_listing_add_mutations enable row level security;
revoke all on table public.trade_listing_add_mutations
  from public, anon, authenticated;
grant select, insert on table public.trade_listing_add_mutations to service_role;

-- Versioned alongside the legacy 7-argument RPC so the schema can land before
-- the application deploy without interrupting the currently served build.
create or replace function public.rpc_add_or_increment_catalog_listing_v2(
  p_rep_id uuid,
  p_design_id uuid,
  p_rep_notes text default null,
  p_trade_preferences text default null,
  p_ring_size text default null,
  p_listing_photo_url text default null,
  p_uses_canonical_photo boolean default true,
  p_idempotency_key text default null,
  p_input_signature text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_listing public.trade_listings%rowtype;
  v_grouped_with_existing boolean := false;
  v_pending_count integer := 0;
  v_new_quantity integer;
  v_group_key text;
  v_receipt public.trade_listing_add_mutations%rowtype;
  v_result jsonb;
  v_mutation_lock_key text;
begin
  if p_rep_id is null
    or p_design_id is null
    or nullif(btrim(p_idempotency_key), '') is null
    or length(p_idempotency_key) > 300
    or nullif(btrim(p_input_signature), '') is null
    or length(p_input_signature) > 128
  then
    raise exception 'invalid catalog listing mutation identity'
      using errcode = '22023';
  end if;

  v_mutation_lock_key := p_rep_id::text || ':' || p_idempotency_key;
  perform pg_advisory_xact_lock(hashtextextended(v_mutation_lock_key, 1));

  select *
    into v_receipt
  from public.trade_listing_add_mutations
  where rep_id = p_rep_id
    and idempotency_key = p_idempotency_key;

  if found then
    if v_receipt.input_signature <> p_input_signature then
      raise exception 'catalog listing idempotency key reused with different input'
        using errcode = '22023';
    end if;
    return v_receipt.result || jsonb_build_object('mutation_replayed', true);
  end if;

  v_group_key := public.trade_listing_catalog_group_digest(
    p_rep_id,
    p_design_id,
    p_ring_size,
    p_listing_photo_url,
    p_uses_canonical_photo,
    p_rep_notes,
    p_trade_preferences
  );
  perform pg_advisory_xact_lock(hashtextextended(v_group_key, 0));

  select *
    into v_listing
  from public.trade_listings
  where rep_id = p_rep_id
    and design_id = p_design_id
    and listing_source = 'catalog'
    and status in ('available', 'pending_trade')
    and ring_size is not distinct from p_ring_size
    and listing_photo_url is not distinct from p_listing_photo_url
    and uses_canonical_photo is not distinct from p_uses_canonical_photo
    and rep_notes is not distinct from p_rep_notes
    and trade_preferences is not distinct from p_trade_preferences
  order by created_at asc, id asc
  limit 1
  for update;

  if found then
    v_grouped_with_existing := true;
    v_new_quantity := v_listing.quantity_available + 1;

    select count(*)::integer
      into v_pending_count
    from public.trade_requests
    where listing_id = v_listing.id
      and status = 'pending';

    update public.trade_listings
    set quantity_available = v_new_quantity,
        status = case
          when v_pending_count >= v_new_quantity then 'pending_trade'::listing_status
          else 'available'::listing_status
        end,
        updated_at = now()
    where id = v_listing.id
    returning * into v_listing;
  else
    insert into public.trade_listings (
      rep_id,
      design_id,
      listing_source,
      status,
      rep_notes,
      trade_preferences,
      ring_size,
      listing_photo_url,
      uses_canonical_photo,
      quantity_available,
      listed_at
    ) values (
      p_rep_id,
      p_design_id,
      'catalog',
      'available',
      p_rep_notes,
      p_trade_preferences,
      p_ring_size,
      p_listing_photo_url,
      p_uses_canonical_photo,
      1,
      now()
    )
    returning * into v_listing;
  end if;

  v_result := jsonb_build_object(
    'listing_id', v_listing.id,
    'status', v_listing.status,
    'quantity_available', v_listing.quantity_available,
    'grouped_with_existing', v_grouped_with_existing,
    'mutation_replayed', false
  );

  insert into public.trade_listing_add_mutations (
    idempotency_key,
    rep_id,
    input_signature,
    listing_id,
    result
  ) values (
    p_idempotency_key,
    p_rep_id,
    p_input_signature,
    v_listing.id,
    v_result
  );

  return v_result;
end;
$$;

revoke all on function public.rpc_add_or_increment_catalog_listing_v2(
  uuid, uuid, text, text, text, text, boolean, text, text
) from public, anon, authenticated;
grant execute on function public.rpc_add_or_increment_catalog_listing_v2(
  uuid, uuid, text, text, text, text, boolean, text, text
) to service_role;

notify pgrst, 'reload schema';
