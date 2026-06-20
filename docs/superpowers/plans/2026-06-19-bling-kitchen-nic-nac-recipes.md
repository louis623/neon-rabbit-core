# BlingKitchen Nic-Nac Recipes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make BlingKitchen recipe cards fully editable by Nic-Nac and by Heather through the Nic-Nac workspace, including recipe copy, categories, images, TikTok links, ingredients, steps, notes, visibility, and ordering.

**Architecture:** Follow the existing `join_team_members` pattern: rep-owned Supabase table, service-layer validation, Nic-Nac API route, Nic-Nac tool definitions, public template loader, and focused tests. Recipes become database content loaded for the targeted rep; the current Ready.ai recipe export remains seed/fallback material until Heather's records are seeded.

**Tech Stack:** Next.js App Router, TypeScript, Supabase/Postgres/RLS/Storage, existing Nic-Nac tool framework, existing Amethyst public template runtime, Vitest.

---

## Current State

- The BlingKitchen Pantry page currently renders from `lib/bling-kitchen/recipes.ts`.
- That file is structured data, but it is still code-backed and requires a deploy to change.
- The correct permanent model is database-backed recipes with Nic-Nac as the lead editor and an in-dashboard recipe manager for Heather.
- The closest existing Sparkle Suite pattern is:
  - `supabase/migrations/20260618170000_ss_join_team_roster.sql`
  - `lib/services/join-team-roster.ts`
  - `app/api/nic-nac/join-team-roster/route.ts`
  - `lib/nic-nac/tools/join-team-roster.ts`
  - `tests/nic-nac-join-team-roster-route.test.ts`
  - `tests/nic-nac/join-team-roster-tools.test.ts`

## File Structure

Create:

- `supabase/migrations/<timestamp>_ss_public_site_recipes.sql`
  - Creates rep-owned `public_site_recipes` table and public recipe media storage bucket/policies.
- `lib/services/site-recipes.ts`
  - Service-layer list/upsert/remove/reorder and image upload helpers.
- `app/api/nic-nac/site-recipes/route.ts`
  - Authenticated Nic-Nac endpoint for Heather/dashboard recipe management.
- `app/api/nic-nac/site-recipes/image/route.ts`
  - Authenticated image upload endpoint for recipe card/modal images.
- `lib/nic-nac/tools/site-recipes.ts`
  - Nic-Nac tools for listing and managing recipes through conversation.
- `scripts/seed-bling-kitchen-recipes.ts`
  - One-time seed/backfill script that upserts the 26 Ready.ai recipes for Heather by rep id.
- `tests/services/site-recipes.test.ts`
  - Unit tests for validation/mapping/service behavior.
- `tests/nic-nac-site-recipes-route.test.ts`
  - API route tests mirroring join-team roster route coverage.
- `tests/nic-nac/site-recipes-tools.test.ts`
  - Nic-Nac tool tests and system-prompt/tool-pack exposure tests.
- `tests/bling-kitchen-recipes-db-loader.test.ts`
  - Public Pantry loader tests for DB-first/fallback behavior.

Modify:

- `lib/services/types.ts`
  - Add recipe domain types.
- `lib/services/storage.ts`
  - Add public site media upload helper, or a recipe-specific wrapper around the new bucket.
- `lib/nic-nac/tools/index.ts`
  - Register recipe tools under site-related intents.
- `lib/nic-nac/system-prompt.ts`
  - Tell Nic-Nac he can manage BlingKitchen/Pantry recipes.
- `app/nic-nac/components/DashboardPlaceholder.tsx`
  - Add a `recipes` workspace section with an edit UI for Heather.
- `lib/amethyst/pantry-template-data.ts`
  - Convert Pantry data builder to accept service-loaded recipes.
- `app/api/amethyst/pantry-template/route.ts`
  - Load visible recipes by target rep/public slug, falling back to seed data only if no DB recipes exist yet.
- `tests/nic-nac-paid-route-boundary.test.ts`
  - Add `/api/nic-nac/site-recipes` and image route to paid-route boundary coverage.
- `tests/bling-kitchen-public-site.test.ts`
  - Update assertions to verify DB-first recipe wiring instead of only static seed wiring.

## Data Model

Use one row per recipe card:

```sql
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

ALTER TABLE public.public_site_recipes ENABLE ROW LEVEL SECURITY;
```

RLS should mirror `join_team_members`: authenticated rep can manage only their own rows, and Louis/admin gets full access through the existing admin email policy.

Use a public storage bucket for recipe images:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-site-media', 'public-site-media', true)
ON CONFLICT (id) DO NOTHING;
```

Storage object keys should use `{rep_id}/recipes/{uuid}-{safe-filename}.{ext}`.

## Task 1: Red Tests For Recipe Service Contract

**Files:**

- Create: `tests/services/site-recipes.test.ts`
- Modify later: `lib/services/types.ts`
- Modify later: `lib/services/site-recipes.ts`

- [ ] **Step 1: Write failing tests for mapping/listing/upsert/remove/reorder**

Test exact behaviors:

```ts
expect(getPublicSiteRecipes(supabase, 'rep-1')).toReturnRowsOrderedBySortOrder()
expect(upsertPublicSiteRecipe(supabase, 'rep-1', { title: '' })).rejects.toMatchObject({
  code: 'INVALID_INPUT',
})
expect(upsertPublicSiteRecipe(supabase, 'rep-1', {
  title: 'Family Pasta Sauce',
  ingredients: ['Tomatoes', 'Garlic'],
  steps: ['Simmer low and slow'],
})).toSaveJsonArrays()
expect(removePublicSiteRecipe(supabase, 'rep-1', 'recipe-1')).toDeleteByRepAndId()
expect(reorderPublicSiteRecipes(supabase, 'rep-1', { recipeIds: ['a', 'b'] })).toUpdateSortOrder()
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
npm exec vitest run tests/services/site-recipes.test.ts
```

Expected: fail because service/types do not exist.

## Task 2: Database Migration And Recipe Types

**Files:**

- Create: `supabase/migrations/<timestamp>_ss_public_site_recipes.sql`
- Modify: `lib/services/types.ts`
- Test: `tests/bling-kitchen-recipes-db-loader.test.ts`

- [ ] **Step 1: Create migration with `supabase migration new ss_public_site_recipes`**

Do not hand-invent the timestamp. Use the CLI so migration ordering stays normal.

- [ ] **Step 2: Add `public_site_recipes` SQL**

Use the schema above. Add RLS:

```sql
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
```

- [ ] **Step 3: Add storage bucket/policies**

Use public read, rep-scoped authenticated writes:

```sql
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
```

- [ ] **Step 4: Add TypeScript types**

Add to `lib/services/types.ts`:

```ts
export interface PublicSiteRecipe {
  id: string
  repId: string
  title: string
  slug: string
  description: string
  category: string
  prepTime: string
  servings: number | null
  imageUrl: string
  imageAlt: string
  imagePosition: string
  modalImageUrl: string
  modalImagePosition: string
  tiktokUrl: string
  ingredients: string[]
  steps: string[]
  note: string
  sortOrder: number
  isVisible: boolean
  sourceRecipeId: string
  createdAt: string | null
  updatedAt: string | null
}

export interface UpsertPublicSiteRecipeInput {
  id?: string
  title: string
  slug?: string
  description?: string
  category?: string
  prepTime?: string
  servings?: number | null
  imageUrl?: string
  imageAlt?: string
  imagePosition?: string
  modalImageUrl?: string
  modalImagePosition?: string
  tiktokUrl?: string
  ingredients?: string[]
  steps?: string[]
  note?: string
  sortOrder?: number
  isVisible?: boolean
  sourceRecipeId?: string
}

export interface ReorderPublicSiteRecipesInput {
  recipeIds: string[]
}
```

- [ ] **Step 5: Run migration-related tests**

Run:

```bash
npm exec vitest run tests/services/site-recipes.test.ts
```

Expected: still fail until service implementation exists.

## Task 3: Recipe Service And Image Upload Helper

**Files:**

- Create: `lib/services/site-recipes.ts`
- Modify: `lib/services/storage.ts`
- Test: `tests/services/site-recipes.test.ts`
- Test: `tests/services/storage.test.ts`

- [ ] **Step 1: Implement service functions**

Create functions:

```ts
export async function getPublicSiteRecipes(
  supabase: SupabaseClient,
  repId: string,
  options: { visibleOnly?: boolean } = {},
): Promise<PublicSiteRecipe[]>

export async function upsertPublicSiteRecipe(
  supabase: SupabaseClient,
  repId: string,
  input: UpsertPublicSiteRecipeInput,
): Promise<PublicSiteRecipe>

export async function removePublicSiteRecipe(
  supabase: SupabaseClient,
  repId: string,
  recipeId: string,
): Promise<{ recipeId: string }>

export async function reorderPublicSiteRecipes(
  supabase: SupabaseClient,
  repId: string,
  input: ReorderPublicSiteRecipesInput,
): Promise<{ updatedCount: number }>
```

Validation rules:

- `title` is required.
- `slug` is generated from title when missing.
- `ingredients` and `steps` normalize to trimmed string arrays.
- `servings` must be null or positive integer.
- `imageUrl`, `modalImageUrl`, and `tiktokUrl` may be blank or `http(s)`.
- `sortOrder` is integer or omitted.
- `isVisible` defaults true.

- [ ] **Step 2: Add image helper**

Add to `lib/services/storage.ts`:

```ts
export async function uploadPublicSiteMedia(
  repId: string,
  base64Data: string,
  options: {
    filename?: string
    folder?: 'recipes'
  } = {},
): Promise<string>
```

It should write to `public-site-media` at `${repId}/recipes/${randomUUID()}-${safeName}.${ext}` and return a public URL.

- [ ] **Step 3: Run service/storage tests**

Run:

```bash
npm exec vitest run tests/services/site-recipes.test.ts tests/services/storage.test.ts
```

Expected: pass.

## Task 4: Nic-Nac Recipe API Routes

**Files:**

- Create: `app/api/nic-nac/site-recipes/route.ts`
- Create: `app/api/nic-nac/site-recipes/image/route.ts`
- Modify: `tests/nic-nac-paid-route-boundary.test.ts`
- Test: `tests/nic-nac-site-recipes-route.test.ts`

- [ ] **Step 1: Write route tests**

Cover:

- `GET` returns all recipes including hidden for authenticated paid rep.
- `POST { action:'upsert', recipe }` saves recipe.
- `POST { action:'remove', recipeId }` removes recipe.
- `POST { action:'reorder', recipeIds }` reorders.
- bad JSON returns 400.
- unauthenticated returns 401.
- service errors return `{ code, error }`.
- image upload accepts base64 image and returns `{ imageUrl }`.

- [ ] **Step 2: Implement `/api/nic-nac/site-recipes`**

Mirror `app/api/nic-nac/join-team-roster/route.ts`:

```ts
const { repId, supabase } = await getPaidNicNacContext()
```

Use service functions and action switching.

- [ ] **Step 3: Implement `/api/nic-nac/site-recipes/image`**

Payload:

```ts
{
  "base64Data": "data:image/jpeg;base64,...",
  "filename": "sauce.jpg"
}
```

Response:

```ts
{
  "ok": true,
  "imageUrl": "https://..."
}
```

- [ ] **Step 4: Run route tests**

Run:

```bash
npm exec vitest run tests/nic-nac-site-recipes-route.test.ts tests/nic-nac-paid-route-boundary.test.ts
```

Expected: pass.

## Task 5: Nic-Nac Tools Make Nic-Nac The Lead Editor

**Files:**

- Create: `lib/nic-nac/tools/site-recipes.ts`
- Modify: `lib/nic-nac/tools/index.ts`
- Modify: `lib/nic-nac/system-prompt.ts`
- Test: `tests/nic-nac/site-recipes-tools.test.ts`

- [ ] **Step 1: Create recipe tools**

Tool names:

- `list_site_recipes`
- `manage_site_recipes`

Tool behavior:

```ts
list_site_recipes({})
```

returns count and all recipes, including hidden.

```ts
manage_site_recipes({
  action: 'upsert',
  recipe: {
    id,
    title,
    description,
    category,
    prepTime,
    servings,
    imageUrl,
    modalImageUrl,
    tiktokUrl,
    ingredients,
    steps,
    note,
    sortOrder,
    isVisible
  }
})
```

also supports:

```ts
{ action: 'remove', recipeId: '...' }
{ action: 'reorder', recipeIds: ['...', '...'] }
```

- [ ] **Step 2: Add tool registration**

Add both tools to `buildAllTools` and the site intent list in `lib/nic-nac/tools/index.ts`.

- [ ] **Step 3: Update Nic-Nac system prompt**

Add explicit guidance:

```text
When a rep asks to add, update, remove, hide, show, reorder, or revise public site recipes, use list_site_recipes and manage_site_recipes. Recipes include title, description, category, prep time, servings, card image, modal image, TikTok URL, ingredients, steps, and Heather's note. Ask for missing required details one at a time.
```

- [ ] **Step 4: Run tool tests**

Run:

```bash
npm exec vitest run tests/nic-nac/site-recipes-tools.test.ts tests/nic-nac-dual-interface-contract.test.ts
```

Expected: pass.

## Task 6: Heather-Friendly Recipe Manager In Nic-Nac Workspace

**Files:**

- Modify: `app/nic-nac/components/DashboardPlaceholder.tsx`
- Test: `tests/nic-nac-dashboard-placeholder.test.ts`

- [ ] **Step 1: Add workspace section**

Add to workspace sections:

```ts
{ key: 'recipes', label: 'Recipes', subtitle: 'Pantry cards and images' }
```

- [ ] **Step 2: Add recipe manager state**

State shape:

```ts
type RecipeDraft = {
  id?: string
  title: string
  description: string
  category: string
  prepTime: string
  servings: number | null
  imageUrl: string
  modalImageUrl: string
  tiktokUrl: string
  ingredientsText: string
  stepsText: string
  note: string
  isVisible: boolean
}
```

- [ ] **Step 3: Add UI**

The section should include:

- recipe list with visible/hidden status.
- "Add recipe" button.
- edit form for title, description, category, prep time, servings.
- image URL fields for card/modal image.
- upload buttons for card/modal image using `/api/nic-nac/site-recipes/image`.
- TikTok URL field.
- multiline ingredients field, one ingredient per line.
- multiline steps field, one step per line.
- note field.
- show/hide toggle.
- save/remove buttons.
- reorder controls.

- [ ] **Step 4: Add tests**

Assert:

- section exists.
- fetches `/api/nic-nac/site-recipes` only when active.
- save calls POST upsert.
- remove calls POST remove.
- upload calls image endpoint and fills image URL.
- ingredients/steps line breaks become arrays.

- [ ] **Step 5: Run dashboard tests**

Run:

```bash
npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts
```

Expected: pass.

## Task 7: Public Pantry Loads DB Recipes First

**Files:**

- Modify: `lib/amethyst/pantry-template-data.ts`
- Modify: `app/api/amethyst/pantry-template/route.ts`
- Modify: `tests/bling-kitchen-public-site.test.ts`
- Create: `tests/bling-kitchen-recipes-db-loader.test.ts`

- [ ] **Step 1: Add adapter from service recipe to Pantry runtime recipe**

Keep the current public shape:

```ts
{
  id,
  title,
  description,
  category,
  prepTime,
  servings,
  image,
  modalImage,
  imagePosition,
  modalImagePosition,
  tiktokUrl,
  ingredients,
  steps,
  note
}
```

- [ ] **Step 2: Load visible recipes by targeted rep**

In `app/api/amethyst/pantry-template/route.ts`:

1. Resolve target with `resolveAmethystRequestTarget`.
2. Resolve the rep with `resolveAmethystPreviewRep` when needed.
3. Load `getPublicSiteRecipes(supabase, repId, { visibleOnly: true })`.
4. If rows exist, use DB rows.
5. If rows do not exist and the target is BlingKitchen, use `lib/bling-kitchen/recipes.ts` fallback.
6. Never show Heather's recipes for a different rep's targeted Pantry request.

- [ ] **Step 3: Run public loader tests**

Run:

```bash
npm exec vitest run tests/bling-kitchen-recipes-db-loader.test.ts tests/bling-kitchen-public-site.test.ts tests/public-site-slug-route.test.ts
```

Expected: pass.

## Task 8: Seed Heather's Existing 26 Recipes Into DB

**Files:**

- Create: `scripts/seed-bling-kitchen-recipes.ts`
- Test: `tests/bling-kitchen-public-site.test.ts`

- [ ] **Step 1: Write seed script**

Script behavior:

- Uses service-role admin client.
- Finds rep by `BLING_KITCHEN_PROFILE.email` or public slug `blingkitchen`.
- Upserts all 26 recipes from `lib/bling-kitchen/recipes.ts`.
- Uses `source_recipe_id` to avoid duplicates.
- Preserves title, description, category, prep time, servings, image, modal image, TikTok URL, ingredients, steps, note, and order.

- [ ] **Step 2: Add package script**

Add to `package.json`:

```json
"seed:bling-kitchen-recipes": "tsx scripts/seed-bling-kitchen-recipes.ts"
```

- [ ] **Step 3: Run seed script after migration is applied**

Run:

```bash
npm run seed:bling-kitchen-recipes
```

Expected: log `Seeded 26 BlingKitchen recipes for rep <id>`.

## Task 9: Verification And Closeout

**Files:**

- No new files unless test fixes require them.

- [ ] **Step 1: Run focused tests**

```bash
npm exec vitest run tests/services/site-recipes.test.ts tests/nic-nac-site-recipes-route.test.ts tests/nic-nac/site-recipes-tools.test.ts tests/bling-kitchen-recipes-db-loader.test.ts tests/bling-kitchen-public-site.test.ts tests/public-site-slug-route.test.ts
```

- [ ] **Step 2: Run affected regression tests**

```bash
npm exec vitest run tests/britt-with-bling-public-site.test.ts tests/mile-high-fizz-public-site.test.ts tests/nic-nac-dashboard-placeholder.test.ts tests/nic-nac-paid-route-boundary.test.ts
```

- [ ] **Step 3: Run TypeScript/build**

```bash
npx tsc --noEmit --pretty false
npm run build
git diff --check
```

- [ ] **Step 4: Manual local QA**

Verify:

- Nic-Nac can list Heather recipes.
- Nic-Nac can add a recipe.
- Nic-Nac can edit copy, ingredients, steps, note, category, TikTok URL.
- Nic-Nac can hide/remove a recipe.
- Heather dashboard can upload/change images.
- `/blingkitchen/in-the-pantry` updates without code changes.
- Hidden recipes do not show publicly.
- Britt With Bling and Mile High Fizz public pages still route normally.

- [ ] **Step 5: Optional deploy smoke**

Only after Louis asks for deploy:

- deploy preview.
- promote stable demo alias if Louis is reviewing stable.
- use `sparkle-suite-demo-smoke`.
- verify `/blingkitchen/in-the-pantry` desktop/mobile.

## Acceptance Bar

- Heather and Nic-Nac can manage recipes without a code deploy.
- The Pantry page still looks like BlingKitchen and keeps the migrated route shape.
- All 26 existing recipes are preserved in DB-backed content.
- Recipe image management supports both pasted URLs and direct upload.
- Public customers only see visible recipes.
- Recipe edits are rep-scoped and protected by the same paid Nic-Nac auth boundary as other workspace tools.
- No separate Heather app is needed unless Louis later wants a standalone client-facing uploader.

## Self-Review

- Spec coverage: Nic-Nac lead editing, Heather dashboard editing, add/update/remove, copywriting, images, ordering, hide/show, public Pantry loading, seed preservation, and verification are all covered.
- Placeholder scan: no TBD/TODO placeholders. The only timestamp placeholder is the migration filename because the plan requires `supabase migration new` to generate it correctly.
- Type consistency: `PublicSiteRecipe`, `UpsertPublicSiteRecipeInput`, `ReorderPublicSiteRecipesInput`, `getPublicSiteRecipes`, `upsertPublicSiteRecipe`, `removePublicSiteRecipe`, and `reorderPublicSiteRecipes` are used consistently across tasks.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-19-bling-kitchen-nic-nac-recipes.md`.

Two execution options:

1. Subagent-Driven (recommended) - dispatch a fresh subagent per task, review between tasks, fast iteration.
2. Inline Execution - execute tasks in this session using executing-plans, batch execution with checkpoints.
