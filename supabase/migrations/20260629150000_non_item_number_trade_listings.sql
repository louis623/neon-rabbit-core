ALTER TABLE public.trade_listings
  ALTER COLUMN design_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS listing_source TEXT,
  ADD COLUMN IF NOT EXISTS manual_type_prefix TEXT,
  ADD COLUMN IF NOT EXISTS manual_collection_family TEXT,
  ADD COLUMN IF NOT EXISTS manual_collection_name TEXT,
  ADD COLUMN IF NOT EXISTS manual_size TEXT,
  ADD COLUMN IF NOT EXISTS manual_photo_url TEXT;

UPDATE public.trade_listings
SET listing_source = 'catalog'
WHERE listing_source IS NULL;

ALTER TABLE public.trade_listings
  ALTER COLUMN listing_source SET DEFAULT 'catalog',
  ALTER COLUMN listing_source SET NOT NULL;

DO $$
BEGIN
  ALTER TABLE public.trade_listings
    ADD CONSTRAINT trade_listings_listing_source_valid
    CHECK (listing_source IN ('catalog', 'non_item_number'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.trade_listings
    ADD CONSTRAINT trade_listings_catalog_requires_design
    CHECK (listing_source <> 'catalog' OR design_id IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.trade_listings
    ADD CONSTRAINT trade_listings_non_item_number_requires_no_design
    CHECK (listing_source <> 'non_item_number' OR design_id IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.trade_listings
    ADD CONSTRAINT trade_listings_non_item_number_required_fields
    CHECK (
      listing_source <> 'non_item_number'
      OR (
        manual_type_prefix IS NOT NULL
        AND length(btrim(manual_type_prefix)) > 0
        AND manual_collection_family IS NOT NULL
        AND length(btrim(manual_collection_family)) > 0
        AND manual_photo_url IS NOT NULL
        AND length(btrim(manual_photo_url)) > 0
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.trade_listings
    ADD CONSTRAINT trade_listings_non_item_number_type_valid
    CHECK (
      manual_type_prefix IS NULL
      OR manual_type_prefix IN ('RG', 'NK', 'ER', 'ST', 'BR')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.trade_listings
    ADD CONSTRAINT trade_listings_non_item_number_ring_size_required
    CHECK (
      listing_source <> 'non_item_number'
      OR manual_type_prefix <> 'RG' OR manual_size IS NOT NULL
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_trade_listings_catalog_design
  ON public.trade_listings (design_id)
  WHERE listing_source = 'catalog';

CREATE INDEX IF NOT EXISTS idx_trade_listings_rep_source_status
  ON public.trade_listings (rep_id, listing_source, status);

CREATE OR REPLACE FUNCTION public.rpc_approve_trade(
  p_request_id UUID,
  p_rep_notes TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request RECORD;
  v_listing RECORD;
  v_fulfillment_id UUID;
BEGIN
  SELECT id, listing_id, customer_name, status INTO v_request
  FROM public.trade_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'REQUEST_NOT_FOUND';
  END IF;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'REQUEST_NOT_PENDING';
  END IF;

  SELECT id, design_id INTO v_listing
  FROM public.trade_listings
  WHERE id = v_request.listing_id
  FOR UPDATE;

  UPDATE public.trade_requests
  SET status = 'approved', rep_notes = p_rep_notes, updated_at = now()
  WHERE id = p_request_id;

  UPDATE public.trade_listings
  SET status = 'traded', updated_at = now()
  WHERE id = v_request.listing_id;

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
    'customer_name', v_request.customer_name
  );
END;
$$;

NOTIFY pgrst, 'reload schema';
