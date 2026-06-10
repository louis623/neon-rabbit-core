ALTER TABLE trade_listings
  ADD COLUMN IF NOT EXISTS ring_size TEXT;

ALTER TABLE trade_listings
  ADD CONSTRAINT trade_listings_ring_size_not_blank
  CHECK (ring_size IS NULL OR length(btrim(ring_size)) > 0);
