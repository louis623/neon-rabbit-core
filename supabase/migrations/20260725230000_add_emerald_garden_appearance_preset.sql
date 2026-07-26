ALTER TABLE public.site_settings
  DROP CONSTRAINT IF EXISTS site_settings_appearance_preset_check;

UPDATE public.site_settings
SET appearance_preset = 'sparkle_suite_morganite'
WHERE appearance_preset IS NULL
  OR appearance_preset NOT IN (
    'amethyst',
    'sparkle_suite_morganite',
    'black_diamond',
    'moonstone',
    'alpine_opal',
    'emerald_garden',
    'rose_gold',
    'garnet',
    'amber',
    'pearl',
    'luxe',
    'velvet',
    'rose_quartz',
    'ocean_sapphire'
  );

ALTER TABLE public.site_settings
  ADD CONSTRAINT site_settings_appearance_preset_check
  CHECK (
    appearance_preset IN (
      'amethyst',
      'sparkle_suite_morganite',
      'black_diamond',
      'moonstone',
      'alpine_opal',
      'emerald_garden',
      'rose_gold',
      'garnet',
      'amber',
      'pearl',
      'luxe',
      'velvet',
      'rose_quartz',
      'ocean_sapphire'
    )
  );
