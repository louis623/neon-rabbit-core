ALTER TABLE public.site_settings
  DROP CONSTRAINT IF EXISTS site_settings_appearance_preset_check;

UPDATE public.site_settings
SET appearance_preset = 'sparkle_suite_morganite'
WHERE appearance_preset IS NULL
  OR appearance_preset NOT IN (
    'sparkle_suite_morganite',
    'black_diamond',
    'moonstone',
    'alpine_opal',
    'rose_gold',
    'garnet',
    'amber',
    'pearl',
    'luxe',
    'rose_quartz',
    'ocean_sapphire'
  );

ALTER TABLE public.site_settings
  ADD CONSTRAINT site_settings_appearance_preset_check
  CHECK (
    appearance_preset IN (
      'sparkle_suite_morganite',
      'black_diamond',
      'moonstone',
      'alpine_opal',
      'rose_gold',
      'garnet',
      'amber',
      'pearl',
      'luxe',
      'rose_quartz',
      'ocean_sapphire'
    )
  );

UPDATE public.site_settings AS settings
SET
  appearance_preset = 'alpine_opal',
  team_name = 'Diamond Peak Society'
FROM public.reps AS reps
WHERE settings.rep_id = reps.id
  AND reps.public_site_slug = 'milehighfizz';
