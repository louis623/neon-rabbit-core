CREATE TABLE IF NOT EXISTS public.public_site_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID NOT NULL REFERENCES public.reps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  prep_time TEXT NOT NULL DEFAULT '',
  servings INTEGER,
  image_url TEXT NOT NULL DEFAULT '',
  image_alt TEXT NOT NULL DEFAULT '',
  image_position TEXT NOT NULL DEFAULT 'center',
  modal_image_url TEXT NOT NULL DEFAULT '',
  modal_image_position TEXT NOT NULL DEFAULT 'center',
  tiktok_url TEXT NOT NULL DEFAULT '',
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  note TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  source_recipe_id TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT public_site_recipes_title_not_blank
    CHECK (length(btrim(title)) > 0),
  CONSTRAINT public_site_recipes_slug_not_blank
    CHECK (length(btrim(slug)) > 0),
  CONSTRAINT public_site_recipes_ingredients_array
    CHECK (jsonb_typeof(ingredients) = 'array'),
  CONSTRAINT public_site_recipes_steps_array
    CHECK (jsonb_typeof(steps) = 'array'),
  CONSTRAINT public_site_recipes_servings_positive
    CHECK (servings IS NULL OR servings > 0),
  CONSTRAINT public_site_recipes_rep_slug_unique
    UNIQUE (rep_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_public_site_recipes_rep_visible_order
  ON public.public_site_recipes(rep_id, is_visible, sort_order, title);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.public_site_recipes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.public_site_recipes TO service_role;

ALTER TABLE public.public_site_recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_site_recipes_own_data" ON public.public_site_recipes;
CREATE POLICY "public_site_recipes_own_data" ON public.public_site_recipes
  FOR ALL
  TO authenticated
  USING (rep_id = (SELECT id FROM public.reps WHERE auth_user_id = auth.uid()))
  WITH CHECK (rep_id = (SELECT id FROM public.reps WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "public_site_recipes_admin_full_access" ON public.public_site_recipes;
CREATE POLICY "public_site_recipes_admin_full_access" ON public.public_site_recipes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reps
      WHERE auth_user_id = auth.uid()
      AND email = 'louis@neonrabbit.net'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reps
      WHERE auth_user_id = auth.uid()
      AND email = 'louis@neonrabbit.net'
    )
  );

INSERT INTO storage.buckets (id, name, public)
VALUES ('public-site-media', 'public-site-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_site_media_public_read" ON storage.objects;
CREATE POLICY "public_site_media_public_read"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'public-site-media');

DROP POLICY IF EXISTS "public_site_media_rep_insert" ON storage.objects;
CREATE POLICY "public_site_media_rep_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'public-site-media'
    AND split_part(name, '/', 1) =
        (SELECT id::text FROM public.reps WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "public_site_media_rep_update" ON storage.objects;
CREATE POLICY "public_site_media_rep_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'public-site-media'
    AND split_part(name, '/', 1) =
        (SELECT id::text FROM public.reps WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    bucket_id = 'public-site-media'
    AND split_part(name, '/', 1) =
        (SELECT id::text FROM public.reps WHERE auth_user_id = auth.uid())
  );
