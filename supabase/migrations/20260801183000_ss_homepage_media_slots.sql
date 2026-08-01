ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS homepage_media_slots JSONB NOT NULL DEFAULT '[]'::JSONB;

COMMENT ON COLUMN public.site_settings.homepage_media_slots IS
  'Rep-managed homepage showcase, About media 1, and About media 2 image/video placements.';
