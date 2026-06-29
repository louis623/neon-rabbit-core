ALTER TABLE public.trade_board_intake_sessions
  ADD COLUMN IF NOT EXISTS catalog_mode TEXT,
  ADD COLUMN IF NOT EXISTS jewelry_type TEXT,
  ADD COLUMN IF NOT EXISTS collection_family TEXT;

UPDATE public.trade_board_intake_sessions
SET catalog_mode = 'item_number'
WHERE catalog_mode IS NULL;

ALTER TABLE public.trade_board_intake_sessions
  ALTER COLUMN catalog_mode SET DEFAULT 'item_number',
  ALTER COLUMN catalog_mode SET NOT NULL;

DO $$
BEGIN
  ALTER TABLE public.trade_board_intake_sessions
    ADD CONSTRAINT trade_board_intake_sessions_catalog_mode_valid
    CHECK (catalog_mode IN ('item_number', 'non_item_number'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.trade_board_intake_sessions
    ADD CONSTRAINT trade_board_intake_sessions_jewelry_type_valid
    CHECK (jewelry_type IS NULL OR jewelry_type IN ('RG', 'NK', 'ER', 'ST', 'BR'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
