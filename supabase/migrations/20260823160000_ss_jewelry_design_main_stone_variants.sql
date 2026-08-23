-- Bomb Party can reuse an item number and plating for a distinct main-stone
-- color. Preserve each catalog variant's own metadata and canonical photo.

DROP INDEX IF EXISTS public.idx_jewelry_designs_item_material_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_jewelry_designs_item_material_stone_unique
  ON public.jewelry_designs (
    item_number,
    COALESCE(NULLIF(lower(btrim(material)), ''), '__unknown__'),
    COALESCE(NULLIF(lower(btrim(main_stone)), ''), '__unknown__')
  );

NOTIFY pgrst, 'reload schema';
