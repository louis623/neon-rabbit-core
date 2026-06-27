-- Allow one Bomb Party item number to have multiple plating/material variants.
-- Example: NK12032 can exist as Rhodium Plating and Hematite Plating without
-- rewriting either catalog row or faking the item number.

ALTER TABLE public.jewelry_designs
  DROP CONSTRAINT IF EXISTS jewelry_designs_item_number_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_jewelry_designs_item_material_unique
  ON public.jewelry_designs (
    item_number,
    COALESCE(NULLIF(lower(btrim(material)), ''), '__unknown__')
  );

NOTIFY pgrst, 'reload schema';
