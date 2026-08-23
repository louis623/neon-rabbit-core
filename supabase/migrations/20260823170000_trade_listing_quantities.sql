-- A Dance Floor row represents one sellable/tradable dancer design. Identical
-- physical copies share that row and increment quantity_available instead of
-- producing indistinguishable duplicate cards.

ALTER TABLE public.trade_listings
  ADD COLUMN IF NOT EXISTS quantity_available INTEGER NOT NULL DEFAULT 1;

DO $$
BEGIN
  ALTER TABLE public.trade_listings
    ADD CONSTRAINT trade_listings_quantity_available_nonnegative
    CHECK (quantity_available >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Consolidate existing active catalog rows only when every listing-level
-- attribute is the same. Distinct stones, plating, photos, notes, sizes, or
-- trade preferences remain separate dancers. Pending requests follow their
-- surviving dancer so no customer request is lost.
WITH duplicate_groups AS (
  SELECT
    (array_agg(id ORDER BY created_at ASC, id ASC))[1] AS keeper_id,
    array_agg(id) AS listing_ids,
    sum(quantity_available) AS total_quantity
  FROM public.trade_listings
  WHERE listing_source = 'catalog'
    AND status = 'available'
  GROUP BY
    rep_id,
    design_id,
    ring_size,
    listing_photo_url,
    uses_canonical_photo,
    rep_notes,
    trade_preferences
  HAVING count(*) > 1
), moved_pending_requests AS (
  UPDATE public.trade_requests request
  SET listing_id = groups.keeper_id,
      updated_at = now()
  FROM duplicate_groups groups
  WHERE request.status = 'pending'
    AND request.listing_id = ANY(groups.listing_ids)
    AND request.listing_id <> groups.keeper_id
  RETURNING request.id
), updated_keepers AS (
  UPDATE public.trade_listings listing
  SET quantity_available = groups.total_quantity,
      updated_at = now()
  FROM duplicate_groups groups
  WHERE listing.id = groups.keeper_id
  RETURNING listing.id
)
UPDATE public.trade_listings listing
SET status = 'removed',
    removal_reason = 'mistake',
    quantity_available = 0,
    deleted_at = now(),
    updated_at = now()
FROM duplicate_groups groups
WHERE listing.id = ANY(groups.listing_ids)
  AND listing.id <> groups.keeper_id;

CREATE OR REPLACE FUNCTION public.rpc_add_or_increment_catalog_listing(
  p_rep_id UUID,
  p_design_id UUID,
  p_rep_notes TEXT DEFAULT NULL,
  p_trade_preferences TEXT DEFAULT NULL,
  p_ring_size TEXT DEFAULT NULL,
  p_listing_photo_url TEXT DEFAULT NULL,
  p_uses_canonical_photo BOOLEAN DEFAULT true
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing public.trade_listings%ROWTYPE;
  v_grouped_with_existing BOOLEAN := false;
BEGIN
  -- The update locks the matching row, making repeated adds atomic even when
  -- two Nic-Nac actions arrive at nearly the same time.
  UPDATE public.trade_listings
  SET quantity_available = quantity_available + 1,
      updated_at = now()
  WHERE rep_id = p_rep_id
    AND design_id = p_design_id
    AND listing_source = 'catalog'
    AND status = 'available'
    AND ring_size IS NOT DISTINCT FROM p_ring_size
    AND listing_photo_url IS NOT DISTINCT FROM p_listing_photo_url
    AND uses_canonical_photo IS NOT DISTINCT FROM p_uses_canonical_photo
    AND rep_notes IS NOT DISTINCT FROM p_rep_notes
    AND trade_preferences IS NOT DISTINCT FROM p_trade_preferences
  RETURNING * INTO v_listing;

  IF FOUND THEN
    v_grouped_with_existing := true;
  ELSE
    INSERT INTO public.trade_listings (
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
    ) VALUES (
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
    RETURNING * INTO v_listing;
  END IF;

  RETURN json_build_object(
    'listing_id', v_listing.id,
    'status', v_listing.status,
    'quantity_available', v_listing.quantity_available,
    'grouped_with_existing', v_grouped_with_existing
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_submit_trade_request(
  p_listing_id UUID,
  p_customer_name TEXT,
  p_customer_description TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing public.trade_listings%ROWTYPE;
  v_request_id UUID;
  v_pending_count INTEGER;
BEGIN
  SELECT * INTO v_listing
  FROM public.trade_listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'LISTING_NOT_FOUND';
  END IF;

  IF v_listing.status <> 'available' OR v_listing.quantity_available < 1 THEN
    RAISE EXCEPTION 'REQUEST_ALREADY_EXISTS';
  END IF;

  INSERT INTO public.trade_requests (listing_id, customer_name, customer_description, status)
  VALUES (p_listing_id, p_customer_name, p_customer_description, 'pending')
  RETURNING id INTO v_request_id;

  SELECT count(*) INTO v_pending_count
  FROM public.trade_requests
  WHERE listing_id = p_listing_id AND status = 'pending';

  UPDATE public.trade_listings
  SET status = CASE
        WHEN v_pending_count >= v_listing.quantity_available THEN 'pending_trade'::listing_status
        ELSE 'available'::listing_status
      END,
      updated_at = now()
  WHERE id = p_listing_id;

  RETURN json_build_object(
    'request_id', v_request_id,
    'listing_id', p_listing_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_approve_trade(
  p_request_id UUID,
  p_rep_notes TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_listing public.trade_listings%ROWTYPE;
  v_fulfillment_id UUID;
  v_remaining_quantity INTEGER;
  v_other_pending_count INTEGER;
  v_next_status listing_status;
BEGIN
  SELECT id, listing_id, customer_name, status INTO v_request
  FROM public.trade_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'REQUEST_NOT_FOUND'; END IF;
  IF v_request.status <> 'pending' THEN RAISE EXCEPTION 'REQUEST_NOT_PENDING'; END IF;

  SELECT * INTO v_listing
  FROM public.trade_listings
  WHERE id = v_request.listing_id
  FOR UPDATE;

  IF NOT FOUND OR v_listing.quantity_available < 1 THEN
    RAISE EXCEPTION 'LISTING_NOT_FOUND';
  END IF;

  UPDATE public.trade_requests
  SET status = 'approved', rep_notes = p_rep_notes, updated_at = now()
  WHERE id = p_request_id;

  v_remaining_quantity := v_listing.quantity_available - 1;
  SELECT count(*) INTO v_other_pending_count
  FROM public.trade_requests
  WHERE listing_id = v_listing.id
    AND status = 'pending';

  v_next_status := CASE
    WHEN v_remaining_quantity <= 0 THEN 'traded'::listing_status
    WHEN v_other_pending_count >= v_remaining_quantity THEN 'pending_trade'::listing_status
    ELSE 'available'::listing_status
  END;

  UPDATE public.trade_listings
  SET quantity_available = v_remaining_quantity,
      status = v_next_status,
      updated_at = now()
  WHERE id = v_listing.id;

  IF v_remaining_quantity <= 0 THEN
    UPDATE public.trade_requests
    SET status = 'cancelled', updated_at = now()
    WHERE listing_id = v_listing.id AND status = 'pending';
  END IF;

  INSERT INTO public.trade_fulfillment (request_id, fulfillment_status)
  VALUES (p_request_id, 'approved')
  RETURNING id INTO v_fulfillment_id;

  IF v_listing.design_id IS NOT NULL THEN
    UPDATE public.jewelry_designs
    SET times_traded = times_traded + 1, updated_at = now()
    WHERE id = v_listing.design_id;
  END IF;

  RETURN json_build_object(
    'request_id', p_request_id,
    'fulfillment_id', v_fulfillment_id,
    'listing_id', v_request.listing_id,
    'customer_name', v_request.customer_name,
    'quantity_available', v_remaining_quantity
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_reject_trade(
  p_request_id UUID,
  p_reason rejection_reason DEFAULT NULL,
  p_rep_notes TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_listing public.trade_listings%ROWTYPE;
  v_pending_count INTEGER;
  v_next_status listing_status;
BEGIN
  SELECT id, listing_id, customer_name, status INTO v_request
  FROM public.trade_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'REQUEST_NOT_FOUND'; END IF;
  IF v_request.status <> 'pending' THEN RAISE EXCEPTION 'REQUEST_NOT_PENDING'; END IF;

  SELECT * INTO v_listing
  FROM public.trade_listings
  WHERE id = v_request.listing_id
  FOR UPDATE;

  UPDATE public.trade_requests
  SET status = 'denied', rejection_reason = p_reason, rep_notes = p_rep_notes, updated_at = now()
  WHERE id = p_request_id;

  SELECT count(*) INTO v_pending_count
  FROM public.trade_requests
  WHERE listing_id = v_request.listing_id AND status = 'pending';

  v_next_status := CASE
    WHEN v_listing.quantity_available <= 0 THEN 'traded'::listing_status
    WHEN v_pending_count >= v_listing.quantity_available THEN 'pending_trade'::listing_status
    ELSE 'available'::listing_status
  END;

  UPDATE public.trade_listings
  SET status = v_next_status, updated_at = now()
  WHERE id = v_request.listing_id;

  RETURN json_build_object(
    'request_id', p_request_id,
    'listing_id', v_request.listing_id,
    'listing_restored', v_next_status = 'available'::listing_status
  );
END;
$$;

NOTIFY pgrst, 'reload schema';
