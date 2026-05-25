UPDATE site_settings
SET appearance_preset = 'sparkle_suite_morganite'
WHERE appearance_preset IN (
  'editorial',
  'softGlam',
  'sparkleParty',
  'maximum'
);

ALTER TABLE site_settings
  ALTER COLUMN appearance_preset SET DEFAULT 'sparkle_suite_morganite';
