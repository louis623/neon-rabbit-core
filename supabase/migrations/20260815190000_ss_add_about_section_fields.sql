ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS about_heading TEXT,
  ADD COLUMN IF NOT EXISTS about_subheading TEXT;

COMMENT ON COLUMN public.site_settings.about_heading IS
  'Customer-facing About section title, editable by the rep or Nic-Nac.';

COMMENT ON COLUMN public.site_settings.about_subheading IS
  'Optional customer-facing About section byline or location, editable by the rep or Nic-Nac.';
