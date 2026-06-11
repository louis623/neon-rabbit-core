CREATE TABLE IF NOT EXISTS public.trade_swaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID UNIQUE NOT NULL REFERENCES public.trade_requests(id) ON DELETE CASCADE,
  outgoing_listing_id UUID NOT NULL REFERENCES public.trade_listings(id),
  revealed_item_number TEXT NOT NULL,
  revealed_ring_size TEXT,
  revealed_design_id UUID REFERENCES public.jewelry_designs(id),
  replacement_listing_id UUID REFERENCES public.trade_listings(id),
  replacement_status TEXT NOT NULL DEFAULT 'needs_catalog_details'
    CHECK (replacement_status IN ('added_to_board', 'needs_catalog_details', 'needs_ring_size')),
  rep_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT trade_swaps_revealed_item_number_not_blank
    CHECK (length(btrim(revealed_item_number)) > 0),
  CONSTRAINT trade_swaps_revealed_ring_size_not_blank
    CHECK (revealed_ring_size IS NULL OR length(btrim(revealed_ring_size)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_trade_swaps_outgoing_listing
  ON public.trade_swaps(outgoing_listing_id);

CREATE INDEX IF NOT EXISTS idx_trade_swaps_replacement_status
  ON public.trade_swaps(replacement_status);

CREATE INDEX IF NOT EXISTS idx_trade_swaps_revealed_item_number
  ON public.trade_swaps(revealed_item_number);

CREATE INDEX IF NOT EXISTS idx_trade_swaps_revealed_design
  ON public.trade_swaps(revealed_design_id);

ALTER TABLE public.trade_swaps ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY trade_swaps_own_data ON public.trade_swaps
    FOR ALL
    USING (
      request_id IN (
        SELECT tr.id
        FROM public.trade_requests tr
        JOIN public.trade_listings tl ON tr.listing_id = tl.id
        WHERE tl.rep_id = (SELECT id FROM public.reps WHERE auth_user_id = auth.uid())
      )
    )
    WITH CHECK (
      request_id IN (
        SELECT tr.id
        FROM public.trade_requests tr
        JOIN public.trade_listings tl ON tr.listing_id = tl.id
        WHERE tl.rep_id = (SELECT id FROM public.reps WHERE auth_user_id = auth.uid())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY trade_swaps_admin_full_access ON public.trade_swaps
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.reps
        WHERE auth_user_id = auth.uid()
        AND email = 'louis@neonrabbit.net'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.reps
        WHERE auth_user_id = auth.uid()
        AND email = 'louis@neonrabbit.net'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
