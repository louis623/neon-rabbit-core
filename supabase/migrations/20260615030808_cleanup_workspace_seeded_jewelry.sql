-- Remove remaining seeded/demo jewelry records from the shared catalog.
-- Keep legitimate uploaded rows such as ER76003 / The Elodie Luxe. Targets are
-- exact item-number + design-name pairs from historical smoke/demo seed data.

WITH target_designs AS (
  SELECT id
  FROM public.jewelry_designs
  WHERE (item_number, design_name) IN (
    ('RG-SMOKE-001', 'Reviewer Smoke Ring'),
    ('BR22415', 'Wrapped In Light'),
    ('ST78951', 'The Modern Muse'),
    ('ER84972', 'Sculpted To Shimmer'),
    ('NK66139', 'In The Orbit Of Grace'),
    ('RG31452', 'The Celeste Ring')
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

DELETE FROM public.collections AS collections
WHERE collections.name IN ('Celestial', 'Galaxy', 'March 2026')
  AND NOT EXISTS (
    SELECT 1
    FROM public.jewelry_designs AS designs
    WHERE designs.collection_id = collections.id
  );
