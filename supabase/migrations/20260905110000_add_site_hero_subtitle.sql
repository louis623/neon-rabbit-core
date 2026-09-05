ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS hero_subtitle TEXT;

COMMENT ON COLUMN public.site_settings.hero_subtitle IS
  'Rep-editable supporting copy displayed directly beneath the customer-site hero title.';
