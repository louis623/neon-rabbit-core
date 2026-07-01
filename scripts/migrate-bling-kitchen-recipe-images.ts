import dotenv from 'dotenv'

import { BLING_KITCHEN_PROFILE } from '@/lib/bling-kitchen/profile'
import { uploadPublicSiteMedia } from '@/lib/services/storage'
import { createAdminClient } from '@/lib/supabase/admin'

type RecipeImageRow = {
  id: string
  title: string
  image_url: string | null
  modal_image_url: string | null
}

type MigratedField = {
  field: 'image_url' | 'modal_image_url'
  from: string
  to: string
}

const SOURCE_HOST_PATTERNS = [
  'readdy.ai',
  'readdy-site.link',
  'storage.readdy-site.link',
  'ready.ai',
]

function isDryRun(args = process.argv) {
  return args.includes('--dry-run')
}

function isSourceImageUrl(value: string | null | undefined) {
  if (!value) return false

  try {
    const host = new URL(value).hostname.toLowerCase()
    return SOURCE_HOST_PATTERNS.some(
      (pattern) => host === pattern || host.endsWith(`.${pattern}`),
    )
  } catch {
    return false
  }
}

function filenameForRecipe(
  recipe: RecipeImageRow,
  field: 'image_url' | 'modal_image_url',
) {
  return `${recipe.title}-${field.replace(/_/g, '-')}`.toLowerCase()
}

async function resolveBlingKitchenRep(
  admin: ReturnType<typeof createAdminClient>,
) {
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

async function fetchImageAsDataUrl(url: string) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`download failed ${response.status} for ${url}`)
  }

  const contentType =
    response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ||
    'image/jpeg'
  if (!contentType.startsWith('image/')) {
    throw new Error(`download did not return an image (${contentType}) for ${url}`)
  }

  const bytes = Buffer.from(await response.arrayBuffer())
  return `data:${contentType};base64,${bytes.toString('base64')}`
}

async function migrateRecipeImageField(input: {
  repId: string
  recipe: RecipeImageRow
  field: 'image_url' | 'modal_image_url'
  sourceUrl: string
  uploadedBySource: Map<string, string>
}) {
  const cached = input.uploadedBySource.get(input.sourceUrl)
  if (cached) return cached

  const dataUrl = await fetchImageAsDataUrl(input.sourceUrl)
  const uploadedUrl = await uploadPublicSiteMedia(input.repId, dataUrl, {
    filename: filenameForRecipe(input.recipe, input.field),
    folder: 'recipes',
  })
  input.uploadedBySource.set(input.sourceUrl, uploadedUrl)
  return uploadedUrl
}

export async function migrateBlingKitchenRecipeImages(
  options: { dryRun?: boolean } = {},
) {
  dotenv.config({ path: '.env.local', override: true })

  const admin = createAdminClient()
  const rep = await resolveBlingKitchenRep(admin)
  if (!rep?.id) {
    throw new Error(
      `Could not find BlingKitchen rep by ${BLING_KITCHEN_PROFILE.email} or slug ${BLING_KITCHEN_PROFILE.publicSiteSlug}`,
    )
  }

  const { data, error } = await admin
    .from('public_site_recipes')
    .select('id,title,image_url,modal_image_url')
    .eq('rep_id', rep.id)
    .order('sort_order', { ascending: true })
    .order('title', { ascending: true })

  if (error) throw error

  const rows = (data ?? []) as RecipeImageRow[]
  const uploadedBySource = new Map<string, string>()
  const migrated: Array<{
    id: string
    title: string
    fields: MigratedField[]
  }> = []
  const skipped: Array<{ id: string; title: string }> = []

  for (const recipe of rows) {
    const fields: MigratedField[] = []
    const patch: Partial<Pick<RecipeImageRow, 'image_url' | 'modal_image_url'>> = {}

    for (const field of ['image_url', 'modal_image_url'] as const) {
      const rawSourceUrl = recipe[field]
      if (!isSourceImageUrl(rawSourceUrl)) continue
      const sourceUrl = rawSourceUrl as string

      if (options.dryRun) {
        fields.push({ field, from: sourceUrl, to: '[dry-run]' })
        continue
      }

      const uploadedUrl = await migrateRecipeImageField({
        repId: rep.id,
        recipe,
        field,
        sourceUrl,
        uploadedBySource,
      })
      patch[field] = uploadedUrl
      fields.push({ field, from: sourceUrl, to: uploadedUrl })
    }

    if (fields.length === 0) {
      skipped.push({ id: recipe.id, title: recipe.title })
      continue
    }

    if (!options.dryRun) {
      const update = await admin
        .from('public_site_recipes')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('rep_id', rep.id)
        .eq('id', recipe.id)
      if (update.error) throw update.error
    }

    migrated.push({ id: recipe.id, title: recipe.title, fields })
  }

  return {
    ok: true,
    dryRun: Boolean(options.dryRun),
    repId: rep.id,
    scanned: rows.length,
    migrated,
    skippedCount: skipped.length,
    migratedRecipeCount: migrated.length,
    migratedFieldCount: migrated.reduce(
      (total, recipe) => total + recipe.fields.length,
      0,
    ),
  }
}

async function main() {
  const result = await migrateBlingKitchenRecipeImages({ dryRun: isDryRun() })
  console.log(JSON.stringify(result, null, 2))
}

if (process.argv[1]?.endsWith('migrate-bling-kitchen-recipe-images.ts')) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
