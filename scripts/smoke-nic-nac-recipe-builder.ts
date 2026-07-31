import { config } from 'dotenv'
import sharp from 'sharp'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getReviewerSmokePersona } from '@/lib/reviewer-smoke/config'
import { resetReviewerSmokeSession } from '@/lib/reviewer-smoke/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { BLING_KITCHEN_PROFILE } from '@/lib/bling-kitchen/profile'

config({ path: '.env.local' })

const DEFAULT_APP_URL = 'https://www.yoursparklesuite.com'

type Env = Record<string, string | undefined>
type SmokeTarget = 'reviewer' | 'bling-kitchen'

type SmokeAccount = {
  email: string
  password: string
  source: SmokeTarget
}

type SessionCookie = {
  cookie: string
  email: string
}

type RecipeDraftProbePayload = {
  draft?: {
    title?: string
    description?: string
    category?: string
    prepTime?: string
    servings?: number | null
    ingredients?: string[]
    steps?: string[]
    note?: string
    imageAlt?: string
    warnings?: string[]
  }
}

type RecipeImageUploadPayload = {
  ok?: boolean
  imageUrl?: string
  error?: string
}

const MODEL_PROBE_TITLE = 'Smoke Chocolate-Dipped Strawberries'

const MODEL_PROBE_REQUIRED_FACTS = [
  { label: 'strawberries', pattern: /strawberr/i },
  { label: 'chocolate chips', pattern: /chocolate/i },
  { label: 'coconut oil', pattern: /coconut/i },
  { label: 'dry berries guidance', pattern: /\bdry\b|dried/i },
  { label: 'dip step', pattern: /\bdip|dipped|dipping/i },
  { label: 'chill step', pattern: /\bchill|refrigerat/i },
]

function hasArg(name: string) {
  return process.argv.includes(name)
}

function getArgValue(name: string) {
  const prefix = `${name}=`
  return process.argv
    .find((arg) => arg.startsWith(prefix))
    ?.slice(prefix.length)
    .trim()
}

function getTarget(): SmokeTarget {
  const target = getArgValue('--target')?.toLowerCase()
  return target === 'bling-kitchen' ? 'bling-kitchen' : 'reviewer'
}

function getSmokeAppUrl(env: Env) {
  return (
    env.SPARKLE_NIC_NAC_RECIPE_SMOKE_APP_URL?.trim() ||
    env.SPARKLE_NIC_NAC_SMOKE_APP_URL?.trim() ||
    DEFAULT_APP_URL
  ).replace(/\/+$/, '')
}

function withVercelProtectionBypass(rawUrl: string, env: Env) {
  const bypass = env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim()
  if (!bypass) return rawUrl

  const url = new URL(rawUrl)
  url.searchParams.set('x-vercel-protection-bypass', bypass)
  return url.toString()
}

async function safeResponseSnippet(response: Response) {
  const body = await response.text().catch(() => '')
  return body.slice(0, 500)
}

function assertSmoke(condition: boolean, message: string) {
  if (condition) {
    console.log(`[recipe-builder-smoke][OK] ${message}`)
    return
  }
  throw new Error(`[recipe-builder-smoke][FAIL] ${message}`)
}

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function renderSvgTextLines(lines: string[], options: { x: number; y: number }) {
  return lines
    .map(
      (line, index) =>
        `<text x="${options.x}" y="${options.y + index * 40}" class="body">${escapeSvgText(
          line,
        )}</text>`,
    )
    .join('')
}

async function svgToPngDataUrl(svg: string) {
  const buffer = await sharp(Buffer.from(svg)).png().toBuffer()
  return `data:image/png;base64,${buffer.toString('base64')}`
}

async function buildRecipeCardFixtureDataUrl() {
  const lines = [
    'Ingredients:',
    '1 lb fresh strawberries, washed and completely dry',
    '1 cup semi-sweet chocolate chips',
    '1 tbsp coconut oil',
    'Steps:',
    '1. Wash berries and pat them completely dry.',
    '2. Melt chocolate chips with coconut oil until smooth.',
    '3. Dip strawberries, set on parchment, and chill 20 minutes.',
    'Note: Dry berries are the secret to a glossy coating.',
  ]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1000" viewBox="0 0 1400 1000">
    <rect width="1400" height="1000" fill="#fffaf5"/>
    <rect x="70" y="70" width="1260" height="860" rx="36" fill="#ffffff" stroke="#5b342d" stroke-width="8"/>
    <text x="120" y="150" class="title">Smoke Test Recipe Card</text>
    <text x="120" y="220" class="subtitle">${MODEL_PROBE_TITLE}</text>
    ${renderSvgTextLines(lines, { x: 120, y: 310 })}
    <style>
      .title { font: 700 54px Georgia, serif; fill: #402924; }
      .subtitle { font: 700 44px Arial, sans-serif; fill: #d81b87; }
      .body { font: 600 30px Arial, sans-serif; fill: #402924; }
    </style>
  </svg>`
  return svgToPngDataUrl(svg)
}

async function buildDisplayPhotoFixtureDataUrl() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
    <rect width="1200" height="900" fill="#fff5f8"/>
    <ellipse cx="600" cy="560" rx="420" ry="160" fill="#f4e3d8"/>
    <circle cx="420" cy="430" r="105" fill="#c7194d"/>
    <circle cx="600" cy="380" r="118" fill="#d7285d"/>
    <circle cx="780" cy="440" r="105" fill="#bd1746"/>
    <path d="M330 435 C430 350, 520 500, 620 400 S820 360, 910 450" fill="none" stroke="#ffffff" stroke-width="34" stroke-linecap="round"/>
    <path d="M360 498 C470 420, 560 570, 670 470 S840 430, 930 520" fill="none" stroke="#5a271f" stroke-width="24" stroke-linecap="round"/>
    <text x="600" y="760" text-anchor="middle" class="label">Chocolate-dipped strawberries</text>
    <style>
      .label { font: 700 44px Arial, sans-serif; fill: #402924; }
    </style>
  </svg>`
  return svgToPngDataUrl(svg)
}

async function uploadRecipeImageFixture(input: {
  appUrl: string
  env: Env
  session: SessionCookie
  base64Data: string
  filename: string
}) {
  const upload = await fetchJson(
    input.appUrl,
    input.env,
    '/api/nic-nac/site-recipes/image',
    {
      method: 'POST',
      headers: {
        cookie: input.session.cookie,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        base64Data: input.base64Data,
        filename: input.filename,
      }),
    },
  )
  const payload = upload.payload as RecipeImageUploadPayload | null
  if (!upload.response.ok || !payload?.imageUrl) {
    throw new Error(
      `recipe image fixture upload failed ${upload.response.status}: ${JSON.stringify(
        payload,
      ).slice(0, 500)}`,
    )
  }
  return payload.imageUrl
}

function assertModelDraftContainsExpectedFacts(payload: RecipeDraftProbePayload | null) {
  const draft = payload?.draft
  assertSmoke(Boolean(draft?.title), 'model draft probe returned a draft')

  const draftText = JSON.stringify(draft ?? {}).toLowerCase()
  for (const fact of MODEL_PROBE_REQUIRED_FACTS) {
    assertSmoke(
      fact.pattern.test(draftText),
      `model draft includes ${fact.label} from recipe-card fixture`,
    )
  }
}

async function getSmokeAccount(
  target: SmokeTarget,
  env: Env,
  admin: SupabaseClient,
): Promise<SmokeAccount> {
  if (target === 'bling-kitchen') {
    const password = env.BLING_KITCHEN_RECIPE_SMOKE_PASSWORD?.trim()
    if (!password) {
      throw new Error(
        'BLING_KITCHEN_RECIPE_SMOKE_PASSWORD is required for --target=bling-kitchen.',
      )
    }

    return {
      email:
        env.BLING_KITCHEN_RECIPE_SMOKE_EMAIL?.trim().toLowerCase() ||
        BLING_KITCHEN_PROFILE.email,
      password,
      source: 'bling-kitchen',
    }
  }

  const persona = getReviewerSmokePersona(env as NodeJS.ProcessEnv)
  await resetReviewerSmokeSession(
    'dashboard_unlocked',
    admin as Parameters<typeof resetReviewerSmokeSession>[1],
  )

  return {
    email: persona.email,
    password: persona.password,
    source: 'reviewer',
  }
}

async function createSessionCookie(env: Env, account: SmokeAccount): Promise<SessionCookie> {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase auth environment is incomplete.')
  }

  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error } = await client.auth.signInWithPassword({
    email: account.email,
    password: account.password,
  })
  if (error) throw new Error(`Recipe builder smoke sign-in failed: ${error.message}`)

  const {
    data: { session },
  } = await client.auth.getSession()
  if (!session) throw new Error('Recipe builder smoke did not create a session.')

  const supabaseRef = new URL(supabaseUrl).hostname.split('.')[0]
  return {
    cookie: `sb-${supabaseRef}-auth-token=${encodeURIComponent(
      JSON.stringify(session),
    )}`,
    email: account.email,
  }
}

async function fetchJson(
  appUrl: string,
  env: Env,
  pathname: string,
  options: RequestInit = {},
) {
  const response = await fetch(withVercelProtectionBypass(`${appUrl}${pathname}`, env), {
    ...options,
    headers: {
      ...(options.headers ?? {}),
    },
  })
  const text = await response.text()
  const payload = text ? (JSON.parse(text) as unknown) : null
  return { response, payload }
}

async function main() {
  const env = process.env as Env
  const appUrl = getSmokeAppUrl(env)
  const target = getTarget()
  const expectModel = hasArg('--expect-model')
  const probeModel = expectModel || hasArg('--probe-model')
  const admin = createAdminClient()

  const account = await getSmokeAccount(target, env, admin as unknown as SupabaseClient)
  const session = await createSessionCookie(env, account)
  console.log(
    `[recipe-builder-smoke] target=${account.source} app=${appUrl} email=${session.email}`,
  )

  const unauthDraft = await fetchJson(appUrl, env, '/api/nic-nac/site-recipes/draft', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: '', images: [] }),
  })
  assertSmoke(
    unauthDraft.response.status === 401,
    'draft endpoint rejects unauthenticated requests',
  )

  const me = await fetchJson(appUrl, env, '/api/nic-nac/me', {
    headers: { cookie: session.cookie },
  })
  assertSmoke(me.response.ok, '/api/nic-nac/me accepts smoke session')

  const recipes = await fetchJson(appUrl, env, '/api/nic-nac/site-recipes', {
    headers: { cookie: session.cookie },
  })
  assertSmoke(recipes.response.ok, '/api/nic-nac/site-recipes lists recipes')

  const missingTitle = await fetchJson(appUrl, env, '/api/nic-nac/site-recipes/draft', {
    method: 'POST',
    headers: {
      cookie: session.cookie,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      title: '',
      images: [
        {
          role: 'recipe_card',
          url: 'https://example.com/smoke-recipe-card.jpg',
        },
      ],
    }),
  })
  assertSmoke(missingTitle.response.status === 400, 'draft requires a title')

  const missingRecipeCard = await fetchJson(
    appUrl,
    env,
    '/api/nic-nac/site-recipes/draft',
    {
      method: 'POST',
      headers: {
        cookie: session.cookie,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Smoke Brownies',
        images: [
          {
            role: 'display_photo',
            url: 'https://example.com/smoke-brownies.jpg',
          },
        ],
      }),
    },
  )
  assertSmoke(
    missingRecipeCard.response.status === 400,
    'draft requires a recipe-card source image',
  )

  if (probeModel) {
    const displayPhotoUrl = await uploadRecipeImageFixture({
      appUrl,
      env,
      session,
      base64Data: await buildDisplayPhotoFixtureDataUrl(),
      filename: 'smoke-chocolate-dipped-strawberries-display.png',
    })
    const recipeCardUrl = await uploadRecipeImageFixture({
      appUrl,
      env,
      session,
      base64Data: await buildRecipeCardFixtureDataUrl(),
      filename: 'smoke-chocolate-dipped-strawberries-card.png',
    })
    const modelProbe = await fetchJson(appUrl, env, '/api/nic-nac/site-recipes/draft', {
      method: 'POST',
      headers: {
        cookie: session.cookie,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        title: MODEL_PROBE_TITLE,
        images: [
          {
            role: 'display_photo',
            url: displayPhotoUrl,
          },
          {
            role: 'recipe_card',
            url: recipeCardUrl,
          },
        ],
      }),
    })

    if (!modelProbe.response.ok) {
      const snippet = JSON.stringify(modelProbe.payload).slice(0, 500)
      if (expectModel) {
        throw new Error(
          `model draft probe failed ${modelProbe.response.status}: ${snippet}`,
        )
      }
      assertSmoke(
        modelProbe.response.status === 503,
        `model draft probe reports OpenAI/model unavailable while quota is blocked (status=${modelProbe.response.status}, body=${snippet})`,
      )
    } else {
      assertModelDraftContainsExpectedFacts(
        modelProbe.payload as RecipeDraftProbePayload | null,
      )
    }
  }

  console.log('[recipe-builder-smoke] ALL CHECKS PASSED')
}

main().catch((error) => {
  console.error('[recipe-builder-smoke] error', error)
  process.exit(1)
})
