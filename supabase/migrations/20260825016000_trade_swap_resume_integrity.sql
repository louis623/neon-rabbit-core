ALTER TABLE public.trade_swaps
  ADD COLUMN IF NOT EXISTS revealed_material TEXT,
  ADD COLUMN IF NOT EXISTS input_signature TEXT;

ALTER TABLE public.trade_swaps
  DROP CONSTRAINT IF EXISTS trade_swaps_revealed_material_not_blank;

ALTER TABLE public.trade_swaps
  ADD CONSTRAINT trade_swaps_revealed_material_not_blank
    CHECK (
      revealed_material IS NULL
      OR length(btrim(revealed_material)) > 0
    );

ALTER TABLE public.trade_swaps
  DROP CONSTRAINT IF EXISTS trade_swaps_input_signature_format;

ALTER TABLE public.trade_swaps
  ADD CONSTRAINT trade_swaps_input_signature_format
    CHECK (
      input_signature IS NULL
      OR input_signature ~ '^[0-9a-f]{64}$'
    );

COMMENT ON COLUMN public.trade_swaps.revealed_material IS
  'Rep-confirmed material or stone/color variant captured for the revealed replacement dancer.';

COMMENT ON COLUMN public.trade_swaps.input_signature IS
  'Stable SHA-256 signature of the swap capture input. Used to reject mismatched retries after approval.';

NOTIFY pgrst, 'reload schema';
