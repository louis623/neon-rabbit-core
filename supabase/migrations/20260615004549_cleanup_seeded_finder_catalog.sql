-- Remove seeded/demo jewelry catalog records from the public Finder source data.
-- This intentionally targets only known demo/smoke item numbers with exact
-- design-name matches and no canonical photo URL, so legitimate uploaded pieces
-- such as ER76003 / The Elodie Luxe are not affected.

WITH target_designs AS (
  SELECT id
  FROM public.jewelry_designs
  WHERE canonical_photo_url IS NULL
    AND (item_number, design_name) IN (
      ('RG-SMOKE-001', 'Reviewer Smoke Ring'),
      ('DM-BR-2610', 'Garden Gala Bracelet'),
      ('DM-BR-2609', 'Satin Sky Cuff'),
      ('DM-ST-2608', 'Golden Hour Stack'),
      ('DM-ST-2607', 'Afterglow Trio Set'),
      ('DM-ER-2606', 'Nova Bloom Studs'),
      ('DM-ER-2605', 'Fizzlight Huggie Earrings'),
      ('DM-NK-2604', 'Velvet Orbit Pendant'),
      ('DM-NK-2603', 'Aurora Drop Necklace'),
      ('DM-RG-2602', 'Starlace Promise Ring'),
      ('DM-RG-2601', 'Moonlit Meridian Ring')
    )
),
target_listings AS (
  SELECT id
  FROM public.trade_listings
  WHERE design_id IN (SELECT id FROM target_designs)
),
target_requests AS (
  SELECT id
  FROM public.trade_requests
  WHERE listing_id IN (SELECT id FROM target_listings)
),
deleted_swaps AS (
  DELETE FROM public.trade_swaps
  WHERE request_id IN (SELECT id FROM target_requests)
     OR outgoing_listing_id IN (SELECT id FROM target_listings)
     OR replacement_listing_id IN (SELECT id FROM target_listings)
     OR revealed_design_id IN (SELECT id FROM target_designs)
  RETURNING id
),
deleted_fulfillment AS (
  DELETE FROM public.trade_fulfillment
  WHERE request_id IN (SELECT id FROM target_requests)
     OR received_listing_id IN (SELECT id FROM target_listings)
  RETURNING id
),
deleted_requests AS (
  DELETE FROM public.trade_requests
  WHERE id IN (SELECT id FROM target_requests)
  RETURNING id
),
deleted_listings AS (
  DELETE FROM public.trade_listings
  WHERE id IN (SELECT id FROM target_listings)
  RETURNING id
)
DELETE FROM public.jewelry_designs
WHERE id IN (SELECT id FROM target_designs);
