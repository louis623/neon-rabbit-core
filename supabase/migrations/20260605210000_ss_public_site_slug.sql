ALTER TABLE reps
  ADD COLUMN IF NOT EXISTS public_site_slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reps_public_site_slug_unique
  ON reps (public_site_slug)
  WHERE public_site_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reps_public_site_slug_lookup
  ON reps (public_site_slug);
