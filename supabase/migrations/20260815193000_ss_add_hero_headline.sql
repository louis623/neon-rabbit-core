ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS hero_headline TEXT;

COMMENT ON COLUMN public.site_settings.hero_headline IS
  'Rep-managed large homepage title. Empty values preserve the established customer-site title.';
