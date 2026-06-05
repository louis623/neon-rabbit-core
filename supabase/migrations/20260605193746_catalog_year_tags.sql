-- Catalog year and practical discovery tags.
-- Year belongs to the collection. Tags belong to the design.
-- This intentionally does not add rarity, release intelligence, or review queues.

ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS collection_year INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'collections_collection_year_check'
  ) THEN
    ALTER TABLE collections
      ADD CONSTRAINT collections_collection_year_check
      CHECK (
        collection_year IS NULL
        OR collection_year BETWEEN 2020 AND 2040
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_collections_year
  ON collections(collection_year);

ALTER TABLE jewelry_designs
  ADD COLUMN IF NOT EXISTS search_tags TEXT[] NOT NULL DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_designs_search_tags
  ON jewelry_designs USING GIN (search_tags);

ALTER TABLE jewelry_catalog_change_log
  DROP CONSTRAINT IF EXISTS jewelry_catalog_change_log_issue_type_check;

ALTER TABLE jewelry_catalog_change_log
  ADD CONSTRAINT jewelry_catalog_change_log_issue_type_check
  CHECK (
    issue_type IS NULL OR issue_type IN (
      'wrong_item_number',
      'wrong_collection',
      'wrong_collection_year',
      'wrong_design_name',
      'wrong_msrp',
      'wrong_jewelry_type',
      'wrong_material',
      'wrong_stone',
      'wrong_tags',
      'bad_photo',
      'duplicate',
      'other'
    )
  );
