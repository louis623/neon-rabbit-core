ALTER TABLE site_settings
  DROP CONSTRAINT IF EXISTS site_settings_appearance_preset_check;

ALTER TABLE site_settings
  ADD CONSTRAINT site_settings_appearance_preset_check
  CHECK (
    appearance_preset IN (
      'amethyst',
      'editorial',
      'softGlam',
      'sparkleParty',
      'sparkle_suite_morganite',
      'black_diamond',
      'rose_gold',
      'garnet',
      'amber',
      'velvet',
      'rose_quartz',
      'maximum'
    )
  );
