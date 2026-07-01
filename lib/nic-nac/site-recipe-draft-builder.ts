import { generateText } from 'ai'
import { z } from 'zod'
import { getNicNacLanguageModel } from '@/lib/nic-nac/core/model-provider'
import { getNicNacModelPolicy } from '@/lib/nic-nac/core/model-policy'

export type SiteRecipeDraftImageRole = 'display_photo' | 'recipe_card'

export type SiteRecipeDraftImage = {
  role: SiteRecipeDraftImageRole
  url: string
}

export type SiteRecipeDraftBuilderInput = {
  title: string
  images: SiteRecipeDraftImage[]
}

export type BuiltSiteRecipeDraft = {
  title: string
  description: string
  category: string
  prepTime: string
  servings: number | null
  ingredients: string[]
  steps: string[]
  note: string
  imageAlt: string
  warnings: string[]
}

type GenerateTextOptions = Parameters<typeof generateText>[0]
type GenerateTextResult = Awaited<ReturnType<typeof generateText>>

type GenerateTextImpl = (options: GenerateTextOptions) => Promise<GenerateTextResult>

const recipeDraftSchema = z.object({
  title: z.string().default(''),
  description: z.string().default(''),
  category: z.string().default(''),
  prepTime: z.string().default(''),
  servings: z.number().int().positive().nullable().default(null),
  ingredients: z.array(z.string()).default([]),
  steps: z.array(z.string()).default([]),
  note: z.string().default(''),
  imageAlt: z.string().default(''),
  warnings: z.array(z.string()).default([]),
})

function normalizeText(value: string, maxLength = 2000) {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

function normalizeList(values: string[]) {
  return values.map((value) => normalizeText(value, 500)).filter(Boolean)
}

function extractJsonObject(text: string) {
  const trimmed = text.trim()
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  if (unfenced.startsWith('{') && unfenced.endsWith('}')) return unfenced

  const start = unfenced.indexOf('{')
  const end = unfenced.lastIndexOf('}')
  if (start >= 0 && end > start) return unfenced.slice(start, end + 1)
  throw new Error('Recipe draft response did not include JSON.')
}

function normalizeDraft(value: z.infer<typeof recipeDraftSchema>): BuiltSiteRecipeDraft {
  return {
    title: normalizeText(value.title, 160),
    description: normalizeText(value.description),
    category: normalizeText(value.category, 80),
    prepTime: normalizeText(value.prepTime, 80),
    servings: value.servings,
    ingredients: normalizeList(value.ingredients),
    steps: normalizeList(value.steps),
    note: normalizeText(value.note),
    imageAlt: normalizeText(value.imageAlt, 160),
    warnings: normalizeList(value.warnings),
  }
}

export function parseSiteRecipeDraftModelText(text: string): BuiltSiteRecipeDraft {
  const parsed = JSON.parse(extractJsonObject(text)) as unknown
  return normalizeDraft(recipeDraftSchema.parse(parsed))
}

function validateDraftInput(input: SiteRecipeDraftBuilderInput) {
  const title = normalizeText(input.title, 160)
  const images = input.images
    .map((image) => ({
      role: image.role,
      url: normalizeText(image.url, 2048),
    }))
    .filter((image) => image.url)

  if (!title) {
    throw new Error('Recipe title is required.')
  }
  if (!images.some((image) => image.role === 'recipe_card')) {
    throw new Error('At least one recipe card image is required.')
  }

  return { title, images }
}

function buildPrompt(title: string, images: SiteRecipeDraftImage[]) {
  const imageRoster = images
    .map((image, index) => `${index + 1}. ${image.role}: ${image.url}`)
    .join('\n')

  return `You are Nic-Nac helping Heather from BlingKitchen turn uploaded recipe photos into a polished Pantry recipe.

Recipe title from Heather: ${title}

Images:
${imageRoster}

Use recipe_card images as the source of truth for ingredients and instructions. Use display_photo images only to understand the finished food and write image alt text. Do not reject recipe-card photos for being plain or handwritten if they are readable. Only warn when a recipe card is unreadable or a display photo is genuinely unsuitable for a public recipe page.

Write in the same warm, practical BlingKitchen style as Heather's current Pantry recipes. If prep time, servings, or category are not visible, infer a reasonable value and include a warning. Return JSON only with this exact shape:
{
  "title": "string",
  "description": "string",
  "category": "string",
  "prepTime": "string",
  "servings": 12,
  "ingredients": ["string"],
  "steps": ["string"],
  "note": "string",
  "imageAlt": "string",
  "warnings": ["string"]
}`
}

export async function buildSiteRecipeDraftFromImages(
  input: SiteRecipeDraftBuilderInput,
  options: { generateTextImpl?: GenerateTextImpl } = {},
): Promise<BuiltSiteRecipeDraft> {
  const { title, images } = validateDraftInput(input)
  const modelPolicy = getNicNacModelPolicy('human_default')
  const generateTextImpl = options.generateTextImpl ?? generateText

  const imageParts = images.map((image) => ({
    type: 'image' as const,
    image: image.url,
  }))

  const result = await generateTextImpl({
    model: getNicNacLanguageModel(modelPolicy),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: buildPrompt(title, images) },
          ...imageParts,
        ],
      },
    ],
  } as GenerateTextOptions)

  return parseSiteRecipeDraftModelText(result.text)
}
