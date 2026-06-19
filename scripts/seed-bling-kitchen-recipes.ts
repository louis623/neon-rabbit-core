import dotenv from 'dotenv'

import { BLING_KITCHEN_PROFILE } from '@/lib/bling-kitchen/profile'
import { recipes } from '@/lib/bling-kitchen/recipes'
import { slugifyRecipeTitle } from '@/lib/services/site-recipes'
import { createAdminClient } from '@/lib/supabase/admin'

type RecipeSeed = (typeof recipes)[number] & {
  modalImage?: string
  imagePosition?: string
  modalImagePosition?: string
  tiktokUrl?: string
  note?: string
}

async function resolveBlingKitchenRep(admin: ReturnType<typeof createAdminClient>) {
  const byEmail = await admin
    .from('reps')
    .select('id, email, public_site_slug')
    .eq('email', BLING_KITCHEN_PROFILE.email)
    .maybeSingle()

  if (byEmail.error) throw byEmail.error
  if (byEmail.data?.id) return byEmail.data

  const bySlug = await admin
    .from('reps')
    .select('id, email, public_site_slug')
    .eq('public_site_slug', BLING_KITCHEN_PROFILE.publicSiteSlug)
    .maybeSingle()

  if (bySlug.error) throw bySlug.error
  return bySlug.data
}

async function main() {
  dotenv.config({ path: '.env.local', override: true })

  const admin = createAdminClient()
  const rep = await resolveBlingKitchenRep(admin)
  if (!rep?.id) {
    throw new Error(
      `Could not find BlingKitchen rep by ${BLING_KITCHEN_PROFILE.email} or slug ${BLING_KITCHEN_PROFILE.publicSiteSlug}`,
    )
  }

  const rows = (recipes as RecipeSeed[]).map((recipe, index) => ({
    rep_id: rep.id,
    title: recipe.title,
    slug: slugifyRecipeTitle(recipe.title),
    description: recipe.description,
    category: recipe.category,
    prep_time: recipe.prepTime,
    servings: recipe.servings,
    image_url: recipe.image,
    image_alt: recipe.title,
    image_position: recipe.imagePosition ?? 'center',
    modal_image_url: recipe.modalImage ?? '',
    modal_image_position: recipe.modalImagePosition ?? 'center',
    tiktok_url: recipe.tiktokUrl ?? '',
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    note: recipe.note ?? '',
    sort_order: index,
    is_visible: true,
    source_recipe_id: String(recipe.id),
  }))

  const { error } = await admin
    .from('public_site_recipes')
    .upsert(rows, { onConflict: 'rep_id,slug' })

  if (error) throw error

  console.log(`Seeded ${rows.length} BlingKitchen recipes for rep ${rep.id}.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
