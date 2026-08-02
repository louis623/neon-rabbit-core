ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS about_narrative TEXT;

COMMENT ON COLUMN public.site_settings.about_narrative IS
  'Customer-facing About section narrative, drafted with Nic-Nac or edited by the rep.';
