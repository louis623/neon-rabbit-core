BEGIN;

ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS discount_codes JSONB DEFAULT '[]'::jsonb;

ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS recurrence_group_id UUID DEFAULT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'calendar_events'
      AND column_name = 'discount_code'
  ) THEN
    UPDATE calendar_events
    SET discount_codes = CASE
      WHEN discount_code IS NOT NULL
        THEN jsonb_build_array(
          jsonb_build_object(
            'code', discount_code,
            'description', COALESCE(discount_description, '')
          )
        )
      ELSE '[]'::jsonb
    END
    WHERE discount_codes IS NULL OR discount_codes = '[]'::jsonb;
  END IF;
END $$;

UPDATE calendar_events
SET discount_codes = '[]'::jsonb
WHERE discount_codes IS NULL;

ALTER TABLE calendar_events
  ALTER COLUMN discount_codes SET DEFAULT '[]'::jsonb;

ALTER TABLE calendar_events
  ALTER COLUMN discount_codes SET NOT NULL;

ALTER TABLE calendar_events
  DROP COLUMN IF EXISTS discount_code;

ALTER TABLE calendar_events
  DROP COLUMN IF EXISTS discount_description;

COMMIT;
