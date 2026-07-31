import { randomUUID } from 'node:crypto'

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import sharp from 'sharp'
import type { UIMessage } from 'ai'

import { BLING_KITCHEN_PROFILE } from '@/lib/bling-kitchen/profile'
import { loadCanonicalHistory } from '@/lib/nic-nac/persistence'
import { getReviewerSmokePersona } from '@/lib/reviewer-smoke/config'
import { resetReviewerSmokeSession } from '@/lib/reviewer-smoke/session'
import { createAdminClient } from '@/lib/supabase/admin'

config({ path: '.env.local', quiet: true })

const DEFAULT_APP_URL = 'https://www.yoursparklesuite.com'
const MAX_HISTORY_WAIT_MS = 75_000
const HISTORY_POLL_MS = 1_000
const SMOKE_TITLE_PREFIX = 'Smoke Chocolate-Dipped Strawberries'

const REQUIRED_FACTS = [
  { label: 'strawberries', pattern: /strawberr/i },
  { label: 'chocolate', pattern: /chocolate/i },
  { label: 'coconut oil', pattern: /coconut/i },
  { label: 'dry berries guidance', pattern: /\bdry\b|dried/i },
  { label: 'dip step', pattern: /\bdip|dipped|dipping/i },
  { label: 'chill step', pattern: /\bchill|refrigerat/i },
]

const MODEL_UNAVAILABLE_PATTERN =
  /insufficient_quota|quota|billing|MODEL_UNAVAILABLE|exceeded your current quota/i

type Env = Record<string, string | undefined>
type SmokeTarget = 'reviewer' | 'bling-kitchen'
type Supabase = SupabaseClient
type UiPart = UIMessage['parts'][number] & {
  type?: string
  text?: string
  mediaType?: string
  url?: string
  state?: string
  input?: unknown
  output?: unknown
}

type SmokeAccount = {
  email: string
  password: string
  source: SmokeTarget
}

type SessionCookie = {
  cookie: string
  email: string
}

type SmokeTurnResult = {
  turn: string
  runId: string | null
  assistantText: string
  observedTools: string[]
}

type RecipeRow = {
  id: string
  title: string
  description: string | null
  ingredients: unknown
  steps: unknown
  note: string | null
  image_url: string | null
  modal_image_url: string | null
  created_at: string | null
}

type WaitResult =
  | { kind: 'history'; messages: UIMessage[] }
  | { kind: 'model_unavailable'; message: string }
  | { kind: 'run_error'; message: string }

type RecipeChatSmokeOptions = {
  target?: SmokeTarget
  expectModel?: boolean
  keepRecipe?: boolean
  admin?: Supabase
}

type RecipeChatSmokeStatus =
  | 'passed'
  | 'missing_env'
  | 'model_unavailable'
  | 'api_failed'
  | 'tool_not_observed'
  | 'database_assertion_failed'
  | 'public_page_assertion_failed'

export type RecipeChatSmokeResult = {
  ok: boolean
  status: RecipeChatSmokeStatus
  appUrl?: string
  conversationId?: string
  rep?: { id: string; email: string; displayName?: string }
  turns?: SmokeTurnResult[]
  recipeId?: string
  cleanup?: { skipped: boolean; removedRecipeIds: string[]; error?: string }
  missingEnv?: string[]
  message: string
}

function hasArg(name: string, args = process.argv) {
  return args.includes(name)
}

function getArgValue(name: string, args = process.argv) {
  const prefix = `${name}=`
  return args
    .find((arg) => arg.startsWith(prefix))
    ?.slice(prefix.length)
    .trim()
}

function getCliValue(name: string, args = process.argv): string | null {
  const inlineValue = getArgValue(name, args)
  if (inlineValue !== undefined) {
    if (!inlineValue) throw new Error(`${name} requires a value`)
    return inlineValue
  }

  const index = args.indexOf(name)
  if (index === -1) return null

  const value = args[index + 1]?.trim()
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} requires a value`)
  }
  return value
}

function getTargetFromArgs(args = process.argv): SmokeTarget {
  const target = getCliValue('--target', args)?.toLowerCase()
  return target === 'bling-kitchen' ? 'bling-kitchen' : 'reviewer'
}

export function getMissingRecipeChatSmokeEnv(
  env: Env,
  options: { target?: SmokeTarget } = {},
): string[] {
  const missing = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ].filter((name) => !env[name]?.trim())
  if (
    options.target === 'bling-kitchen' &&
    !env.BLING_KITCHEN_RECIPE_SMOKE_PASSWORD?.trim()
  ) {
    missing.push('BLING_KITCHEN_RECIPE_SMOKE_PASSWORD')
  }
  return missing
}

function getSmokeAppUrl(env: Env): string {
  return (
    env.SPARKLE_NIC_NAC_RECIPE_SMOKE_APP_URL?.trim() ||
    env.SPARKLE_NIC_NAC_SMOKE_APP_URL?.trim() ||
    DEFAULT_APP_URL
  ).replace(/\/+$/, '')
}

async function getSmokeAccount(
  target: SmokeTarget,
  env: Env,
  admin: Supabase,
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

async function createSessionCookie(
  env: Env,
  account: SmokeAccount,
): Promise<SessionCookie> {
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
  if (error) throw new Error(`Recipe chat smoke sign-in failed: ${error.message}`)

  const {
    data: { session },
  } = await client.auth.getSession()
  if (!session) throw new Error('Recipe chat smoke did not create a session.')

  const supabaseRef = new URL(supabaseUrl).hostname.split('.')[0]
  return {
    cookie: `sb-${supabaseRef}-auth-token=${encodeURIComponent(
      JSON.stringify(session),
    )}`,
    email: account.email,
  }
}

async function fetchNicNacMe(
  appUrl: string,
  env: Env,
  cookie: string,
): Promise<{ id: string; email: string; displayName?: string }> {
  const response = await fetch(
    withVercelProtectionBypass(`${appUrl}/api/nic-nac/me`, env),
    { headers: { cookie } },
  )
  if (!response.ok) {
    throw new Error(
      `/api/nic-nac/me returned ${response.status}: ${await safeResponseSnippet(
        response,
      )}`,
    )
  }
  const payload = (await response.json()) as {
    rep?: { id?: string; email?: string; display_name?: string }
  }
  if (!payload.rep?.id || !payload.rep.email) {
    throw new Error('/api/nic-nac/me did not return a usable rep.')
  }
  return {
    id: payload.rep.id,
    email: payload.rep.email,
    displayName: payload.rep.display_name,
  }
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

async function buildRecipeCardFixtureDataUrl(title: string) {
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
    <text x="120" y="220" class="subtitle">${escapeSvgText(title)}</text>
    ${renderSvgTextLines(lines, { x: 120, y: 310 })}
    <style>
      .title { font: 700 54px Georgia, serif; fill: #402924; }
      .subtitle { font: 700 38px Arial, sans-serif; fill: #d81b87; }
      .body { font: 600 30px Arial, sans-serif; fill: #402924; }
    </style>
  </svg>`
  return svgToPngDataUrl(svg)
}

async function buildDisplayPhotoFixtureDataUrl(title: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
    <rect width="1200" height="900" fill="#fff5f8"/>
    <ellipse cx="600" cy="560" rx="420" ry="160" fill="#f4e3d8"/>
    <circle cx="420" cy="430" r="105" fill="#c7194d"/>
    <circle cx="600" cy="380" r="118" fill="#d7285d"/>
    <circle cx="780" cy="440" r="105" fill="#bd1746"/>
    <path d="M330 435 C430 350, 520 500, 620 400 S820 360, 910 450" fill="none" stroke="#ffffff" stroke-width="34" stroke-linecap="round"/>
    <path d="M360 498 C470 420, 560 570, 670 470 S840 430, 930 520" fill="none" stroke="#5a271f" stroke-width="24" stroke-linecap="round"/>
    <text x="600" y="760" text-anchor="middle" class="label">${escapeSvgText(title)}</text>
    <style>
      .label { font: 700 36px Arial, sans-serif; fill: #402924; }
    </style>
  </svg>`
  return svgToPngDataUrl(svg)
}

async function makeRecipeImageParts(title: string): Promise<UiPart[]> {
  return [
    {
      type: 'file',
      mediaType: 'image/png',
      url: await buildDisplayPhotoFixtureDataUrl(title),
    } as UiPart,
    {
      type: 'file',
      mediaType: 'image/png',
      url: await buildRecipeCardFixtureDataUrl(title),
    } as UiPart,
  ]
}

async function postNicNacTurn(
  appUrl: string,
  env: Env,
  cookie: string,
  body: { conversationId: string; messages: UIMessage[] },
): Promise<string | null> {
  const response = await fetch(
    withVercelProtectionBypass(`${appUrl}/api/nic-nac`, env),
    {
      method: 'POST',
      headers: {
        cookie,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        conversationId: body.conversationId,
        messages: body.messages,
        mode: 'workspace',
      }),
    },
  )
  const responseText = await response.text()
  if (!response.ok) {
    throw new Error(
      `/api/nic-nac returned ${response.status}: ${responseText.slice(0, 500)}`,
    )
  }
  return response.headers.get('x-nic-nac-run-id')
}

async function waitForHistoryOrRunFailure(input: {
  supabase: Supabase
  conversationId: string
  expectedAssistantCount: number
}): Promise<WaitResult> {
  const startedAt = Date.now()
  let latest: UIMessage[] = []
  while (Date.now() - startedAt < MAX_HISTORY_WAIT_MS) {
    latest = await loadCanonicalHistory(input.supabase, input.conversationId)
    const assistantCount = latest.filter(
      (message) => message.role === 'assistant',
    ).length
    if (assistantCount >= input.expectedAssistantCount) {
      return { kind: 'history', messages: latest }
    }

    const failure = await getLatestRunFailure(input.supabase, input.conversationId)
    if (failure?.status === 'error') {
      if (MODEL_UNAVAILABLE_PATTERN.test(failure.message)) {
        return { kind: 'model_unavailable', message: failure.message }
      }
      return { kind: 'run_error', message: failure.message }
    }

    await sleep(HISTORY_POLL_MS)
  }

  const failure = await getLatestRunFailure(input.supabase, input.conversationId)
  if (failure?.status === 'error' && MODEL_UNAVAILABLE_PATTERN.test(failure.message)) {
    return { kind: 'model_unavailable', message: failure.message }
  }
  return {
    kind: 'run_error',
    message: `Timed out waiting for assistant turn ${input.expectedAssistantCount}. Last canonical message count=${latest.length}.`,
  }
}

async function getLatestRunFailure(supabase: Supabase, conversationId: string) {
  const { data, error } = await supabase
    .from('nic_nac_runs')
    .select('status,error_message')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<{ status: string; error_message: string | null }>()
  if (error) throw error
  if (!data || data.status !== 'error') return null
  return {
    status: data.status,
    message: data.error_message ?? 'Nic-Nac run failed without an error message.',
  }
}

function extractAssistantText(messages: UIMessage[]): string {
  return messages
    .filter((message) => message.role === 'assistant')
    .flatMap((message) => message.parts ?? [])
    .filter((part) => (part as UiPart).type === 'text')
    .map((part) => (part as UiPart).text ?? '')
    .join('\n')
}

function getObservedToolNames(messages: UIMessage[]): string[] {
  const observed = new Set<string>()
  for (const message of messages) {
    if (message.role !== 'assistant') continue
    for (const part of message.parts ?? []) {
      const toolPart = part as UiPart
      if (!toolPart.type?.startsWith('tool-')) continue
      if (
        toolPart.state !== 'output-available' &&
        toolPart.state !== 'approval-requested'
      ) {
        continue
      }
      observed.add(toolPart.type.slice('tool-'.length))
    }
  }
  return [...observed]
}

function getLatestAssistantToolNames(messages: UIMessage[]): string[] {
  const latestAssistant = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant')
  return latestAssistant ? getObservedToolNames([latestAssistant]) : []
}

function getToolOutputs(messages: UIMessage[], toolName: string): unknown[] {
  const outputs: unknown[] = []
  for (const message of messages) {
    if (message.role !== 'assistant') continue
    for (const part of message.parts ?? []) {
      const toolPart = part as UiPart
      if (toolPart.type !== `tool-${toolName}`) continue
      if (toolPart.state === 'output-available') outputs.push(toolPart.output)
    }
  }
  return outputs
}

function toolOutputsReportModelUnavailable(messages: UIMessage[]) {
  return getToolOutputs(messages, 'build_site_recipe_draft').some((output) => {
    if (!output || typeof output !== 'object') return false
    const record = output as { ok?: unknown; code?: unknown; message?: unknown }
    return (
      record.ok === false &&
      (record.code === 'MODEL_UNAVAILABLE' ||
        MODEL_UNAVAILABLE_PATTERN.test(String(record.message ?? '')))
    )
  })
}

async function sendTurn(input: {
  appUrl: string
  env: Env
  cookie: string
  supabase: Supabase
  conversationId: string
  currentMessages: UIMessage[]
  turn: string
  parts: UiPart[]
  expectedAssistantCount: number
  turns: SmokeTurnResult[]
}): Promise<WaitResult & { runId: string | null }> {
  const nextMessages: UIMessage[] = [
    ...input.currentMessages,
    {
      id: `user-${input.turn}-${randomUUID()}`,
      role: 'user',
      parts: input.parts as UIMessage['parts'],
    },
  ]
  const runId = await postNicNacTurn(input.appUrl, input.env, input.cookie, {
    conversationId: input.conversationId,
    messages: nextMessages,
  })
  const result = await waitForHistoryOrRunFailure({
    supabase: input.supabase,
    conversationId: input.conversationId,
    expectedAssistantCount: input.expectedAssistantCount,
  })
  if (result.kind === 'history') {
    input.turns.push({
      turn: input.turn,
      runId,
      assistantText: extractAssistantText(result.messages).slice(-1200),
      observedTools: getObservedToolNames(result.messages),
    })
  }
  return { ...result, runId }
}

async function findCreatedSmokeRecipe(input: {
  supabase: Supabase
  repId: string
  startedAtIso: string
  title: string
}): Promise<RecipeRow | null> {
  const { data, error } = await input.supabase
    .from('public_site_recipes')
    .select(
      'id,title,description,ingredients,steps,note,image_url,modal_image_url,created_at',
    )
    .eq('rep_id', input.repId)
    .gte('created_at', input.startedAtIso)
    .eq('title', input.title)
    .order('created_at', { ascending: false })
    .limit(1)
  if (error) throw error
  const rows = (data ?? []) as RecipeRow[]
  return rows[0] ?? null
}

function findMissingRecipeFacts(recipe: RecipeRow) {
  const text = JSON.stringify(recipe).toLowerCase()
  return REQUIRED_FACTS.filter((fact) => !fact.pattern.test(text)).map(
    (fact) => fact.label,
  )
}

async function assertPublicPantryContainsRecipe(input: {
  appUrl: string
  env: Env
  repId: string
  title: string
}) {
  const pageUrl = `${input.appUrl}/blingkitchen/in-the-pantry`
  const templateUrl = new URL('/api/amethyst/pantry-template', input.appUrl)
  templateUrl.searchParams.set('c', input.repId)
  templateUrl.searchParams.set('publicSiteSlug', 'blingkitchen')

  let lastMessage = 'BlingKitchen Pantry did not include the saved smoke recipe.'
  const deadline = Date.now() + 30_000

  while (Date.now() <= deadline) {
    const pageResponse = await fetch(
      withVercelProtectionBypass(pageUrl, input.env),
    )
    if (!pageResponse.ok) {
      throw new Error(
        `BlingKitchen Pantry page returned ${pageResponse.status}: ${await safeResponseSnippet(
          pageResponse,
        )}`,
      )
    }
    const html = await pageResponse.text()
    if (!html.includes('/api/amethyst/pantry-template')) {
      throw new Error(
        'BlingKitchen Pantry page did not load the Pantry template script.',
      )
    }

    const templateResponse = await fetch(
      withVercelProtectionBypass(templateUrl.toString(), input.env),
    )
    if (!templateResponse.ok) {
      throw new Error(
        `BlingKitchen Pantry template returned ${templateResponse.status}: ${await safeResponseSnippet(
          templateResponse,
        )}`,
      )
    }
    const templateScript = await templateResponse.text()
    if (templateScript.includes(input.title)) {
      return
    }

    lastMessage =
      'BlingKitchen Pantry template did not include the saved smoke recipe.'
    await sleep(1_000)
  }

  throw new Error(lastMessage)
}

async function cleanupSmokeRecipes(input: {
  supabase: Supabase
  repId: string
  recipeId: string
  title: string
  keep: boolean
}) {
  if (input.keep) return { skipped: true, removedRecipeIds: [] }

  const { data, error } = await input.supabase
    .from('public_site_recipes')
    .delete()
    .eq('rep_id', input.repId)
    .eq('id', input.recipeId)
    .eq('title', input.title)
    .select('id')
  if (error) {
    return {
      skipped: false,
      removedRecipeIds: [],
      error: error.message,
    }
  }

  const removedRecipeIds = ((data ?? []) as Array<{ id: string }>).map(
    (row) => row.id,
  )
  return { skipped: false, removedRecipeIds }
}

export async function runRecipeChatSmoke(
  env: Env = process.env,
  options: RecipeChatSmokeOptions = {},
): Promise<RecipeChatSmokeResult> {
  const target = options.target ?? 'reviewer'
  const missingEnv = getMissingRecipeChatSmokeEnv(env, { target })
  if (missingEnv.length > 0) {
    return {
      ok: false,
      status: 'missing_env',
      missingEnv,
      message: 'Nic-Nac recipe chat smoke is missing required environment.',
    }
  }

  const appUrl = getSmokeAppUrl(env)
  const expectModel = options.expectModel ?? false
  const keepRecipe = options.keepRecipe ?? env.SPARKLE_NIC_NAC_RECIPE_SMOKE_KEEP === 'true'
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  const admin = options.admin ?? (createAdminClient() as unknown as Supabase)
  const account = await getSmokeAccount(target, env, admin as unknown as Supabase)
  const session = await createSessionCookie(env, account)
  const rep = await fetchNicNacMe(appUrl, env, session.cookie)
  const conversationId = randomUUID()
  const startedAtIso = new Date().toISOString()
  const title = `${SMOKE_TITLE_PREFIX} ${startedAtIso.replace(/[:.]/g, '-')}`
  const turns: SmokeTurnResult[] = []

  try {
    const firstTurn = await sendTurn({
      appUrl,
      env,
      cookie: session.cookie,
      supabase,
      conversationId,
      currentMessages: [],
      turn: 'draft_recipe',
      parts: [
        {
          type: 'text',
          text:
            `Add a new Pantry recipe titled exactly "${title}". ` +
            'The first image is the finished food/display photo customers should see. ' +
            'The second image is the recipe-card photo with ingredients and instructions. ' +
            'Build the recipe draft from those images, then ask me before saving it.',
        } as UiPart,
        ...(await makeRecipeImageParts(title)),
      ],
      expectedAssistantCount: 1,
      turns,
    })

    if (firstTurn.kind === 'model_unavailable') {
      return {
        ok: !expectModel,
        status: 'model_unavailable',
        appUrl,
        conversationId,
        rep,
        turns,
        message: firstTurn.message,
      }
    }
    if (firstTurn.kind === 'run_error') {
      throw new Error(firstTurn.message)
    }

    if (toolOutputsReportModelUnavailable(firstTurn.messages)) {
      return {
        ok: !expectModel,
        status: 'model_unavailable',
        appUrl,
        conversationId,
        rep,
        turns,
        message:
          'Nic-Nac selected build_site_recipe_draft, but the recipe-card vision builder reported MODEL_UNAVAILABLE.',
      }
    }

    const draftTurnTools = getLatestAssistantToolNames(firstTurn.messages)
    if (!draftTurnTools.includes('build_site_recipe_draft')) {
      return {
        ok: false,
        status: 'tool_not_observed',
        appUrl,
        conversationId,
        rep,
        turns,
        message: `Did not observe build_site_recipe_draft in the draft turn. Observed tools: ${draftTurnTools.join(', ')}`,
      }
    }
    if (draftTurnTools.includes('manage_site_recipes')) {
      return {
        ok: false,
        status: 'tool_not_observed',
        appUrl,
        conversationId,
        rep,
        turns,
        message:
          'Observed manage_site_recipes during the draft turn before the rep approved saving.',
      }
    }

    const secondTurn = await sendTurn({
      appUrl,
      env,
      cookie: session.cookie,
      supabase,
      conversationId,
      currentMessages: firstTurn.messages,
      turn: 'save_recipe',
      parts: [
        {
          type: 'text',
          text: 'Yes, save that recipe to the Pantry now.',
        } as UiPart,
      ],
      expectedAssistantCount: 2,
      turns,
    })

    if (secondTurn.kind === 'model_unavailable') {
      return {
        ok: !expectModel,
        status: 'model_unavailable',
        appUrl,
        conversationId,
        rep,
        turns,
        message: secondTurn.message,
      }
    }
    if (secondTurn.kind === 'run_error') {
      throw new Error(secondTurn.message)
    }

    const saveTurnTools = getLatestAssistantToolNames(secondTurn.messages)
    if (!saveTurnTools.includes('manage_site_recipes')) {
      return {
        ok: false,
        status: 'tool_not_observed',
        appUrl,
        conversationId,
        rep,
        turns,
        message: `Did not observe manage_site_recipes in the save turn. Observed tools: ${saveTurnTools.join(', ')}`,
      }
    }

    const recipe = await findCreatedSmokeRecipe({
      supabase,
      repId: rep.id,
      startedAtIso,
      title,
    })
    if (!recipe) {
      return {
        ok: false,
        status: 'database_assertion_failed',
        appUrl,
        conversationId,
        rep,
        turns,
        message: 'No saved smoke recipe row was found after manage_site_recipes.',
      }
    }

    const missingFacts = findMissingRecipeFacts(recipe)
    if (missingFacts.length > 0) {
      const cleanup = await cleanupSmokeRecipes({
        supabase,
        repId: rep.id,
        recipeId: recipe.id,
        title: recipe.title,
        keep: keepRecipe,
      })
      return {
        ok: false,
        status: 'database_assertion_failed',
        appUrl,
        conversationId,
        rep,
        turns,
        recipeId: recipe.id,
        cleanup,
        message: `Saved recipe missed expected recipe-card fact(s): ${missingFacts.join(', ')}`,
      }
    }
    if (!recipe.image_url || !recipe.modal_image_url) {
      const cleanup = await cleanupSmokeRecipes({
        supabase,
        repId: rep.id,
        recipeId: recipe.id,
        title: recipe.title,
        keep: keepRecipe,
      })
      return {
        ok: false,
        status: 'database_assertion_failed',
        appUrl,
        conversationId,
        rep,
        turns,
        recipeId: recipe.id,
        cleanup,
        message: 'Saved recipe is missing public display images.',
      }
    }

    if (target === 'bling-kitchen') {
      try {
        await assertPublicPantryContainsRecipe({
          appUrl,
          env,
          repId: rep.id,
          title: recipe.title,
        })
      } catch (error) {
        const cleanup = await cleanupSmokeRecipes({
          supabase,
          repId: rep.id,
          recipeId: recipe.id,
          title: recipe.title,
          keep: keepRecipe,
        })
        return {
          ok: false,
          status: 'public_page_assertion_failed',
          appUrl,
          conversationId,
          rep,
          turns,
          recipeId: recipe.id,
          cleanup,
          message: error instanceof Error ? error.message : String(error),
        }
      }
    }

    const cleanup = await cleanupSmokeRecipes({
      supabase,
      repId: rep.id,
      recipeId: recipe.id,
      title: recipe.title,
      keep: keepRecipe,
    })

    return {
      ok: true,
      status: 'passed',
      appUrl,
      conversationId,
      rep,
      turns,
      recipeId: recipe.id,
      cleanup,
      message:
        'Nic-Nac recipe chat smoke passed through draft, save, and recipe database assertions.',
    }
  } catch (error) {
    return {
      ok: false,
      status: 'api_failed',
      appUrl,
      conversationId,
      rep,
      turns,
      message: error instanceof Error ? error.message : String(error),
    }
  }
}

function withVercelProtectionBypass(rawUrl: string, env: Env): string {
  const bypass =
    env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim() ||
    env.VERCEL_PROTECTION_BYPASS?.trim()
  if (!bypass) return rawUrl

  const url = new URL(rawUrl)
  url.searchParams.set('x-vercel-set-bypass-cookie', 'true')
  url.searchParams.set('x-vercel-protection-bypass', bypass)
  return url.toString()
}

async function safeResponseSnippet(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 500)
  } catch {
    return 'unreadable response body'
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function writeRecipeChatSmokeArtifact(
  result: RecipeChatSmokeResult,
  outputPath: string,
): Promise<string> {
  const outputDir = path.dirname(outputPath)
  if (outputDir && outputDir !== '.') {
    await mkdir(outputDir, { recursive: true })
  }
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
  return outputPath
}

async function main() {
  const target = getTargetFromArgs()
  const outputPath = getCliValue('--output')
  const result = await runRecipeChatSmoke(process.env as Env, {
    target,
    expectModel: hasArg('--expect-model'),
    keepRecipe: hasArg('--keep-recipe'),
  })
  if (outputPath) {
    await writeRecipeChatSmokeArtifact(result, outputPath)
    console.error(`[recipe-chat-smoke] wrote ${outputPath}`)
  }
  console.log(JSON.stringify(result, null, 2))
  if (!result.ok) process.exit(1)
}

if (require.main === module) {
  main().catch((error) => {
    console.error('[recipe-chat-smoke] error', error)
    process.exit(1)
  })
}
