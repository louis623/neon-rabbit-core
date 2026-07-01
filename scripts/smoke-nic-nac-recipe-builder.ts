import { config } from 'dotenv'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getReviewerSmokePersona } from '@/lib/reviewer-smoke/config'
import { resetReviewerSmokeSession } from '@/lib/reviewer-smoke/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { BLING_KITCHEN_PROFILE } from '@/lib/bling-kitchen/profile'

config({ path: '.env.local' })

const DEFAULT_APP_URL = 'https://sparkle-suite-demo.vercel.app'

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
    const modelProbe = await fetchJson(appUrl, env, '/api/nic-nac/site-recipes/draft', {
      method: 'POST',
      headers: {
        cookie: session.cookie,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Smoke Chocolate-Dipped Strawberries',
        images: [
          {
            role: 'display_photo',
            url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6',
          },
          {
            role: 'recipe_card',
            url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136',
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
        'model draft probe reports OpenAI/model unavailable while quota is blocked',
      )
    } else {
      const payload = modelProbe.payload as { draft?: { title?: string } } | null
      assertSmoke(Boolean(payload?.draft?.title), 'model draft probe returned a draft')
    }
  }

  console.log('[recipe-builder-smoke] ALL CHECKS PASSED')
}

main().catch((error) => {
  console.error('[recipe-builder-smoke] error', error)
  process.exit(1)
})
