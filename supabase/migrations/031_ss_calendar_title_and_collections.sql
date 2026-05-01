ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS title TEXT;

ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS featured_collections TEXT[];
