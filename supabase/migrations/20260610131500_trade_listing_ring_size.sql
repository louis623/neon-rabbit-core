ALTER TABLE public.trade_listings
  ADD COLUMN IF NOT EXISTS ring_size TEXT;

DO $$
BEGIN
  ALTER TABLE public.trade_listings
    ADD CONSTRAINT trade_listings_ring_size_not_blank
    CHECK (ring_size IS NULL OR length(btrim(ring_size)) > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
