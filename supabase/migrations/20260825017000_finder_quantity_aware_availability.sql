-- One grouped Dance Floor listing may represent multiple physical dancers.
-- Pending requests reserve copies, so the former one-pending-request index is
-- replaced by a lookup index and the row-locking RPC becomes the only public
-- request creation boundary.
drop index if exists public.idx_one_pending_request_per_listing;

create index if not exists idx_trade_requests_pending_listing
  on public.trade_requests (listing_id)
  where status = 'pending';

drop policy if exists "requests_public_insert" on public.trade_requests;
revoke insert on table public.trade_requests from public, anon, authenticated;

alter table public.trade_requests
  add column if not exists submission_id uuid;

create unique index if not exists idx_trade_requests_submission_id_unique
  on public.trade_requests (submission_id)
  where submission_id is not null;

create or replace function public.rpc_submit_trade_request_v2(
  p_listing_id uuid,
  p_customer_name text,
  p_customer_description text,
  p_submission_id uuid
) returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_listing public.trade_listings%rowtype;
  v_existing_request public.trade_requests%rowtype;
  v_request_id uuid;
  v_pending_count integer := 0;
begin
  if p_submission_id is null
    or nullif(btrim(p_customer_name), '') is null
    or length(p_customer_name) > 100
    or nullif(btrim(p_customer_description), '') is null
    or length(p_customer_description) > 1000
  then
    raise exception 'INVALID_TRADE_REQUEST';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_submission_id::text, 2));

  select *
    into v_existing_request
  from public.trade_requests
  where submission_id = p_submission_id;

  if found then
    if v_existing_request.listing_id <> p_listing_id
      or v_existing_request.customer_name <> btrim(p_customer_name)
      or v_existing_request.customer_description <> btrim(p_customer_description)
    then
      raise exception 'IDEMPOTENCY_CONFLICT';
    end if;

    return json_build_object(
      'request_id', v_existing_request.id,
      'listing_id', v_existing_request.listing_id,
      'mutation_replayed', true
    );
  end if;

  select *
    into v_listing
  from public.trade_listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'LISTING_NOT_FOUND';
  end if;

  if v_listing.status <> 'available' or v_listing.quantity_available < 1 then
    raise exception 'REQUEST_ALREADY_EXISTS';
  end if;

  select count(*)::integer
    into v_pending_count
  from public.trade_requests
  where listing_id = v_listing.id
    and status = 'pending';

  if v_pending_count >= v_listing.quantity_available then
    raise exception 'REQUEST_ALREADY_EXISTS';
  end if;

  insert into public.trade_requests (
    listing_id,
    customer_name,
    customer_description,
    status,
    submission_id
  ) values (
    v_listing.id,
    btrim(p_customer_name),
    btrim(p_customer_description),
    'pending',
    p_submission_id
  )
  returning id into v_request_id;

  v_pending_count := v_pending_count + 1;

  update public.trade_listings
  set status = case
        when v_pending_count >= v_listing.quantity_available
          then 'pending_trade'::listing_status
        else 'available'::listing_status
      end,
      updated_at = now()
  where id = v_listing.id;

  return json_build_object(
    'request_id', v_request_id,
    'listing_id', v_listing.id,
    'mutation_replayed', false
  );
end;
$$;

-- Keep the legacy three-argument caller working during rollout. It receives a
-- fresh server identity and therefore preserves its historic non-idempotent
-- behavior while sharing the same locked capacity boundary.
create or replace function public.rpc_submit_trade_request(
  p_listing_id uuid,
  p_customer_name text,
  p_customer_description text
) returns json
language sql
security definer
set search_path = public, pg_temp
as $$
  select public.rpc_submit_trade_request_v2(
    p_listing_id,
    p_customer_name,
    p_customer_description,
    gen_random_uuid()
  );
$$;

revoke all on function public.rpc_submit_trade_request(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.rpc_submit_trade_request(uuid, text, text)
  to service_role;
revoke all on function public.rpc_submit_trade_request_v2(uuid, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.rpc_submit_trade_request_v2(uuid, text, text, uuid)
  to service_role;

create index if not exists idx_trade_listings_finder_availability_exact
  on public.trade_listings (design_id, listed_at desc, id desc)
  include (rep_id, quantity_available, listing_photo_url, uses_canonical_photo)
  where listing_source = 'catalog'
    and status = 'available';

create index if not exists idx_trade_listings_finder_availability_rep_order
  on public.trade_listings (rep_id, listed_at desc, id desc)
  include (design_id, quantity_available, listing_photo_url, uses_canonical_photo)
  where listing_source = 'catalog'
    and status = 'available';

create index if not exists idx_trade_listings_public_board_net_order
  on public.trade_listings (rep_id, listed_at desc, id desc)
  include (quantity_available)
  where status = 'available';

-- Finder passes the exact set of reps already qualified by the existing Suite
-- subscription, public-site, status, and next-show rules. This keeps that
-- product behavior in application code while making quantity aggregation,
-- exact/similar totals, and both cursor pages one atomic database read.
create or replace function public.list_sparkle_finder_availability_v2(
  p_design_id uuid,
  p_eligible_rep_ids uuid[],
  p_limit integer default 25,
  p_exact_after_listed_at timestamptz default null,
  p_exact_after_listing_id uuid default null,
  p_similar_after_listed_at timestamptz default null,
  p_similar_after_listing_id uuid default null
)
returns table (
  bucket text,
  listing_id uuid,
  rep_id uuid,
  design_id uuid,
  net_quantity integer,
  listed_at timestamptz,
  listing_photo_url text,
  uses_canonical_photo boolean,
  item_number text,
  design_name text,
  material text,
  main_stone text,
  bp_msrp numeric,
  canonical_photo_url text,
  type_prefix public.jewelry_type,
  search_tags text[],
  collection_name text,
  collection_year integer,
  rep_display_name text,
  rep_business_name text,
  rep_public_site_slug text,
  rep_status text,
  total_lead_count bigint,
  total_dancer_count bigint
)
language sql
stable
security definer
set search_path = ''
set statement_timeout = '5s'
as $$
  with requested as (
    select
      requested_design.id,
      requested_design.type_prefix,
      requested_collection.name as collection_name
    from public.jewelry_designs requested_design
    left join public.collections requested_collection
      on requested_collection.id = requested_design.collection_id
    where requested_design.id = p_design_id
  ),
  candidates as (
    select
      case
        when listing.design_id = p_design_id then 'exact'::text
        else 'similar'::text
      end as bucket,
      listing.id as listing_id,
      listing.rep_id,
      listing.design_id,
      greatest(
        listing.quantity_available - coalesce(pending.pending_count, 0),
        0
      )::integer as net_quantity,
      listing.listed_at,
      listing.listing_photo_url,
      listing.uses_canonical_photo,
      design.item_number,
      design.design_name,
      design.material,
      design.main_stone,
      design.bp_msrp,
      design.canonical_photo_url,
      design.type_prefix,
      design.search_tags,
      collection.name as collection_name,
      collection.collection_year,
      rep.display_name as rep_display_name,
      rep.business_name as rep_business_name,
      rep.public_site_slug as rep_public_site_slug,
      rep.status::text as rep_status
    from public.trade_listings listing
    join requested on true
    join public.jewelry_designs design on design.id = listing.design_id
    left join public.collections collection on collection.id = design.collection_id
    join public.reps rep on rep.id = listing.rep_id
    left join lateral (
      select count(*)::integer as pending_count
      from public.trade_requests request
      where request.listing_id = listing.id
        and request.status = 'pending'
    ) pending on true
    where listing.status = 'available'
      and listing.listing_source = 'catalog'
      and listing.rep_id = any(coalesce(p_eligible_rep_ids, array[]::uuid[]))
      and (
        listing.design_id = p_design_id
        or (
          listing.design_id <> p_design_id
          and design.type_prefix = requested.type_prefix
          and collection.name is not distinct from requested.collection_name
        )
      )
  ),
  available as (
    select *
    from candidates
    where net_quantity > 0
  ),
  totals as (
    select
      count(*) filter (where bucket = 'exact')::bigint as exact_lead_count,
      coalesce(sum(net_quantity) filter (where bucket = 'exact'), 0)::bigint
        as exact_dancer_count,
      count(*) filter (where bucket = 'similar')::bigint as similar_lead_count,
      coalesce(sum(net_quantity) filter (where bucket = 'similar'), 0)::bigint
        as similar_dancer_count
    from available
  ),
  buckets as (
    select unnest(array['exact'::text, 'similar'::text]) as bucket
  ),
  after_cursors as (
    select available.*
    from available
    where (
      bucket = 'exact'
      and (
        p_exact_after_listing_id is null
        or (
          p_exact_after_listed_at is not null
          and (
            listed_at < p_exact_after_listed_at
            or listed_at is null
            or (
              listed_at = p_exact_after_listed_at
              and listing_id < p_exact_after_listing_id
            )
          )
        )
        or (
          p_exact_after_listed_at is null
          and listed_at is null
          and listing_id < p_exact_after_listing_id
        )
      )
    ) or (
      bucket = 'similar'
      and (
        p_similar_after_listing_id is null
        or (
          p_similar_after_listed_at is not null
          and (
            listed_at < p_similar_after_listed_at
            or listed_at is null
            or (
              listed_at = p_similar_after_listed_at
              and listing_id < p_similar_after_listing_id
            )
          )
        )
        or (
          p_similar_after_listed_at is null
          and listed_at is null
          and listing_id < p_similar_after_listing_id
        )
      )
    )
  ),
  ranked as (
    select
      after_cursors.*,
      row_number() over (
        partition by bucket
        order by listed_at desc nulls last, listing_id desc
      ) as page_row_number
    from after_cursors
  )
  select
    buckets.bucket,
    ranked.listing_id,
    ranked.rep_id,
    ranked.design_id,
    ranked.net_quantity,
    ranked.listed_at,
    ranked.listing_photo_url,
    ranked.uses_canonical_photo,
    ranked.item_number,
    ranked.design_name,
    ranked.material,
    ranked.main_stone,
    ranked.bp_msrp,
    ranked.canonical_photo_url,
    ranked.type_prefix,
    ranked.search_tags,
    ranked.collection_name,
    ranked.collection_year,
    ranked.rep_display_name,
    ranked.rep_business_name,
    ranked.rep_public_site_slug,
    ranked.rep_status,
    case when buckets.bucket = 'exact'
      then totals.exact_lead_count else totals.similar_lead_count end,
    case when buckets.bucket = 'exact'
      then totals.exact_dancer_count else totals.similar_dancer_count end
  from buckets
  cross join totals
  left join ranked
    on ranked.bucket = buckets.bucket
   and ranked.page_row_number <= least(greatest(p_limit, 1), 51)
  order by buckets.bucket, ranked.listed_at desc nulls last, ranked.listing_id desc;
$$;

revoke all on function public.list_sparkle_finder_availability_v2(
  uuid, uuid[], integer, timestamptz, uuid, timestamptz, uuid
) from public, anon, authenticated;
grant execute on function public.list_sparkle_finder_availability_v2(
  uuid, uuid[], integer, timestamptz, uuid, timestamptz, uuid
) to service_role;

-- Customer-site Dance Floor quantities come from the same snapshot used to
-- filter and limit the public board. Only listing identity and net quantity
-- leave this RPC; the application hydrates the existing public display shape.
create or replace function public.list_amethyst_public_trade_board_net_v2(
  p_rep_id uuid,
  p_limit integer default null
)
returns table (
  listing_id uuid,
  net_quantity integer
)
language sql
stable
security definer
set search_path = ''
set statement_timeout = '5s'
as $$
  with net_listings as (
    select
      listing.id as listing_id,
      greatest(
        listing.quantity_available - coalesce(pending.pending_count, 0),
        0
      )::integer as net_quantity,
      listing.listed_at
    from public.trade_listings listing
    left join lateral (
      select count(*)::integer as pending_count
      from public.trade_requests request
      where request.listing_id = listing.id
        and request.status = 'pending'
    ) pending on true
    where listing.rep_id = p_rep_id
      and listing.status = 'available'
  )
  select listing_id, net_quantity
  from net_listings
  where net_quantity > 0
  order by listed_at desc nulls last, listing_id desc
  limit case
    when p_limit is null then null
    else least(greatest(p_limit, 1), 100)
  end;
$$;

revoke all on function public.list_amethyst_public_trade_board_net_v2(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.list_amethyst_public_trade_board_net_v2(uuid, integer)
  to service_role;

notify pgrst, 'reload schema';
