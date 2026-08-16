ALTER TABLE public.public_site_recipes
  ADD COLUMN IF NOT EXISTS recipe_source_image_urls JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.public_site_recipes
  DROP CONSTRAINT IF EXISTS public_site_recipes_source_images_array;

ALTER TABLE public.public_site_recipes
  ADD CONSTRAINT public_site_recipes_source_images_array
  CHECK (jsonb_typeof(recipe_source_image_urls) = 'array');
