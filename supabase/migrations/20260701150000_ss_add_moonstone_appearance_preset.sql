ALTER TABLE public.site_settings
  DROP CONSTRAINT IF EXISTS site_settings_appearance_preset_check;

ALTER TABLE public.site_settings
  ADD CONSTRAINT site_settings_appearance_preset_check
  CHECK (
    appearance_preset IN (
      'amethyst',
      'sparkle_suite_morganite',
      'black_diamond',
      'moonstone',
      'rose_gold',
      'garnet',
      'amber',
      'velvet',
      'rose_quartz'
    )
  );
