ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS customer_site_template TEXT NOT NULL DEFAULT 'amethyst',
  ADD COLUMN IF NOT EXISTS appearance_preset TEXT NOT NULL DEFAULT 'amethyst';

UPDATE site_settings
SET customer_site_template = 'amethyst'
WHERE customer_site_template IS NULL;

UPDATE site_settings
SET appearance_preset = 'amethyst'
WHERE appearance_preset IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'site_settings_customer_site_template_amethyst_check'
  ) THEN
    ALTER TABLE site_settings
      ADD CONSTRAINT site_settings_customer_site_template_amethyst_check
      CHECK (customer_site_template = 'amethyst');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'site_settings_appearance_preset_check'
  ) THEN
    ALTER TABLE site_settings
      ADD CONSTRAINT site_settings_appearance_preset_check
      CHECK (
        appearance_preset IN (
          'amethyst',
          'editorial',
          'softGlam',
          'sparkleParty',
          'maximum'
        )
      );
  END IF;
END $$;
