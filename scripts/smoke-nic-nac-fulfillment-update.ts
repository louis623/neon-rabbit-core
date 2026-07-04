import { randomUUID } from 'node:crypto'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import type { UIMessage } from 'ai'

import { loadCanonicalHistory } from '@/lib/nic-nac/persistence'
import { getReviewerSmokePersona } from '@/lib/reviewer-smoke/config'
import { resetReviewerSmokeSession } from '@/lib/reviewer-smoke/session'

const DEFAULT_APP_URL = 'https://sparkle-suite-demo.vercel.app'
const MAX_HISTORY_WAIT_MS = 75_000
const HISTORY_POLL_MS = 1_000
const SMOKE_PREFIX = 'Codex Fulfillment Smoke'

type Env = Record<string, string | undefined>
type Supabase = SupabaseClient
type UiPart = UIMessage['parts'][number] & {
  type?: string
  text?: string
  state?: string
  output?: unknown
}

type Rep = {
  id: string
  email: string
  displayName?: string
  publicSiteSlug?: string | null
}

type SeededFulfillmentTarget = {
  collectionId: string
  designId: string
  listingId: string
  requestId: string
  fulfillmentId: string
  itemNumber: string
  designName: string
  customerName: string
}

type TurnResult = {
  turn: string
  runId: string | null
  observedTools: string[]
  assistantText: string
}

type FulfillmentSmokeStatus =
  | 'passed'
  | 'missing_env'
  | 'api_failed'
  | 'tool_not_observed'
  | 'database_assertion_failed'
  | 'public_site_assertion_failed'
  | 'cleanup_failed'

type FulfillmentSmokeResult = {
  ok: boolean
  status: FulfillmentSmokeStatus
  appUrl?: string
  conversationId?: string
  rep?: Rep
  runTag?: string
  target?: SeededFulfillmentTarget
  turns?: TurnResult[]
  cleanup?: { deletedRows: Record<string, number>; error?: string }
  missingEnv?: string[]
  message: string
}

const HARD_FAIL_PATTERNS = [
  /i can['’]t actually (mark|ship|complete|update|change)/i,
  /i['’]m not able to (mark|ship|complete|update|change)/i,
  /not able to access (the )?fulfillment tool/i,
  /only have notes access/i,
  /mark it manually/i,
  /complete it manually/i,
  /log into your workspace and (mark|complete|ship)/i,
  /paste (this|it) into/i,
]

export function getMissingFulfillmentSmokeEnv(env: Env) {
  return [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ].filter((name) => !env[name]?.trim())
}

function getSmokeAppUrl(env: Env) {
  return (
    env.SPARKLE_NIC_NAC_SMOKE_APP_URL?.trim() ||
    DEFAULT_APP_URL
  ).replace(/\/+$/, '')
}

function withVercelProtectionBypass(rawUrl: string, env: Env) {
  const bypass =
    env.VERCEL_PROTECTION_BYPASS?.trim() ||
    env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim()
  if (!bypass) return rawUrl

  const url = new URL(rawUrl)
  url.searchParams.set('x-vercel-set-bypass-cookie', 'true')
  url.searchParams.set('x-vercel-protection-bypass', bypass)
  return url.toString()
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function assertNoHardFails(text: string) {
  const failures = HARD_FAIL_PATTERNS.filter((pattern) => pattern.test(text))
  if (failures.length) {
    throw new Error(
      `Hard-fail phrase detected: ${failures.map((pattern) => pattern.source).join(', ')}`,
    )
  }
}

async function createReviewerSessionCookie(env: Env) {
  const persona = getReviewerSmokePersona(env as NodeJS.ProcessEnv)
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase auth environment is incomplete.')
  }

  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error } = await client.auth.signInWithPassword({
    email: persona.email,
    password: persona.password,
  })
  if (error) throw new Error(`Reviewer smoke sign-in failed: ${error.message}`)

  const {
    data: { session },
  } = await client.auth.getSession()
  if (!session) throw new Error('Reviewer smoke sign-in did not return a session.')

  const supabaseRef = new URL(supabaseUrl).hostname.split('.')[0]
  return {
    cookie: `sb-${supabaseRef}-auth-token=${encodeURIComponent(
      JSON.stringify(session),
    )}`,
  }
}

async function fetchNicNacMe(appUrl: string, env: Env, cookie: string): Promise<Rep> {
  const response = await fetch(
    withVercelProtectionBypass(`${appUrl}/api/nic-nac/me`, env),
    { headers: { cookie } },
  )
  if (!response.ok) {
    throw new Error(`/api/nic-nac/me returned ${response.status}: ${await response.text()}`)
  }
  const payload = (await response.json()) as {
    rep?: {
      id?: string
      email?: string
      display_name?: string
      public_site_slug?: string | null
    }
  }
  if (!payload.rep?.id || !payload.rep.email) {
    throw new Error('/api/nic-nac/me did not return a usable rep.')
  }
  return {
    id: payload.rep.id,
    email: payload.rep.email,
    displayName: payload.rep.display_name,
    publicSiteSlug: payload.rep.public_site_slug ?? null,
  }
}

async function postNicNacTurn(
  appUrl: string,
  env: Env,
  cookie: string,
  body: { conversationId: string; messages: UIMessage[] },
) {
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
    throw new Error(`/api/nic-nac returned ${response.status}: ${responseText.slice(0, 800)}`)
  }
  return response.headers.get('x-nic-nac-run-id')
}

async function waitForCanonicalHistory(input: {
  supabase: Supabase
  conversationId: string
  expectedAssistantCount: number
}) {
  const startedAt = Date.now()
  let latest: UIMessage[] = []
  while (Date.now() - startedAt < MAX_HISTORY_WAIT_MS) {
    latest = await loadCanonicalHistory(input.supabase, input.conversationId)
    const assistantCount = latest.filter((message) => message.role === 'assistant').length
    if (assistantCount >= input.expectedAssistantCount) return latest
    await sleep(HISTORY_POLL_MS)
  }
  throw new Error(
    `Timed out waiting for assistant turn ${input.expectedAssistantCount}. Last canonical message count=${latest.length}.`,
  )
}

function extractAssistantText(messages: UIMessage[]) {
  return messages
    .filter((message) => message.role === 'assistant')
    .flatMap((message) => message.parts ?? [])
    .map((part) => {
      const toolPart = part as UiPart
      if (toolPart.type === 'text') return toolPart.text ?? ''
      if (toolPart.output && typeof toolPart.output === 'object') {
        return JSON.stringify(toolPart.output)
      }
      return ''
    })
    .filter(Boolean)
    .join('\n')
}

function getLatestAssistantToolNames(messages: UIMessage[]) {
  const latestAssistant = [...messages].reverse().find((message) => message.role === 'assistant')
  if (!latestAssistant) return new Set<string>()
  const observed = new Set<string>()
  for (const part of latestAssistant.parts ?? []) {
    const toolPart = part as UiPart
    if (!toolPart.type?.startsWith('tool-')) continue
    if (toolPart.state !== 'output-available') continue
    observed.add(toolPart.type.slice('tool-'.length))
  }
  return observed
}

async function sendTurn(input: {
  appUrl: string
  env: Env
  cookie: string
  supabase: Supabase
  conversationId: string
  currentMessages: UIMessage[]
  text: string
  expectedAssistantCount: number
  requiredTools?: string[]
  turns: TurnResult[]
}) {
  const nextMessages: UIMessage[] = [
    ...input.currentMessages,
    {
      id: `user-${randomUUID()}`,
      role: 'user',
      parts: [{ type: 'text', text: input.text }],
    },
  ]

  const runId = await postNicNacTurn(input.appUrl, input.env, input.cookie, {
    conversationId: input.conversationId,
    messages: nextMessages,
  })
  const history = await waitForCanonicalHistory({
    supabase: input.supabase,
    conversationId: input.conversationId,
    expectedAssistantCount: input.expectedAssistantCount,
  })
  const assistantText = extractAssistantText(history)
  assertNoHardFails(assistantText)
  const observedTools = [...getLatestAssistantToolNames(history)]
  for (const toolName of input.requiredTools ?? []) {
    if (!observedTools.includes(toolName)) {
      throw new Error(
        `Did not observe ${toolName} in latest turn. Observed latest-turn tools: ${observedTools.join(', ')}`,
      )
    }
  }
  input.turns.push({
    turn: input.text,
    runId,
    observedTools,
    assistantText: assistantText.slice(-1200),
  })
  return history
}

async function seedFulfillmentTarget(
  supabase: Supabase,
  repId: string,
  runTag: string,
): Promise<SeededFulfillmentTarget> {
  const itemNumber = `NK${runTag}`
  const designName = `${SMOKE_PREFIX} Necklace ${runTag}`
  const customerName = 'Jamie Fulfillment Smoke'

  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .insert({ name: `${SMOKE_PREFIX} Collection ${runTag}` })
    .select('id')
    .single()
  if (collectionError) throw collectionError

  const { data: design, error: designError } = await supabase
    .from('jewelry_designs')
    .insert({
      item_number: itemNumber,
      design_name: designName,
      collection_id: collection.id,
      material: 'Rhodium Plating',
      main_stone: 'Synthetic smoke crystal',
      bp_msrp: 42,
      canonical_photo_url: null,
      type_prefix: 'NK',
    })
    .select('id')
    .single()
  if (designError) throw designError

  const { data: listing, error: listingError } = await supabase
    .from('trade_listings')
    .insert({
      rep_id: repId,
      design_id: design.id,
      listing_source: 'catalog',
      status: 'traded',
      rep_notes: `${SMOKE_PREFIX} listing ${runTag}`,
      trade_preferences: 'Synthetic fulfillment smoke.',
      uses_canonical_photo: true,
      listed_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (listingError) throw listingError

  const { data: request, error: requestError } = await supabase
    .from('trade_requests')
    .insert({
      listing_id: listing.id,
      customer_name: customerName,
      customer_description: `Synthetic approved request for ${itemNumber}.`,
      status: 'approved',
      rep_notes: 'Seeded approved request for fulfillment smoke.',
    })
    .select('id')
    .single()
  if (requestError) throw requestError

  const { data: fulfillment, error: fulfillmentError } = await supabase
    .from('trade_fulfillment')
    .insert({
      request_id: request.id,
      fulfillment_status: 'approved',
      shipping_notes: null,
      status_updated_at: new Date(Date.now() - 4 * 86_400_000).toISOString(),
    })
    .select('id')
    .single()
  if (fulfillmentError) throw fulfillmentError

  return {
    collectionId: collection.id,
    designId: design.id,
    listingId: listing.id,
    requestId: request.id,
    fulfillmentId: fulfillment.id,
    itemNumber,
    designName,
    customerName,
  }
}

async function cleanupTarget(supabase: Supabase, target?: SeededFulfillmentTarget) {
  const deletedRows: Record<string, number> = {
    trade_fulfillment: 0,
    trade_requests: 0,
    trade_listings: 0,
    jewelry_designs: 0,
    collections: 0,
  }
  if (!target) return { deletedRows }

  const fulfillmentDelete = await supabase
    .from('trade_fulfillment')
    .delete()
    .eq('id', target.fulfillmentId)
    .select('id')
  if (fulfillmentDelete.error) throw fulfillmentDelete.error
  deletedRows.trade_fulfillment = fulfillmentDelete.data?.length ?? 0

  const requestDelete = await supabase
    .from('trade_requests')
    .delete()
    .eq('id', target.requestId)
    .select('id')
  if (requestDelete.error) throw requestDelete.error
  deletedRows.trade_requests = requestDelete.data?.length ?? 0

  const listingDelete = await supabase
    .from('trade_listings')
    .delete()
    .eq('id', target.listingId)
    .select('id')
  if (listingDelete.error) throw listingDelete.error
  deletedRows.trade_listings = listingDelete.data?.length ?? 0

  const designDelete = await supabase
    .from('jewelry_designs')
    .delete()
    .eq('id', target.designId)
    .select('id')
  if (designDelete.error) throw designDelete.error
  deletedRows.jewelry_designs = designDelete.data?.length ?? 0

  const collectionDelete = await supabase
    .from('collections')
    .delete()
    .eq('id', target.collectionId)
    .select('id')
  if (collectionDelete.error) throw collectionDelete.error
  deletedRows.collections = collectionDelete.data?.length ?? 0

  return { deletedRows }
}

async function getFulfillmentRow(supabase: Supabase, target: SeededFulfillmentTarget) {
  const { data, error } = await supabase
    .from('trade_fulfillment')
    .select('id,request_id,fulfillment_status,shipping_notes,completed_at,status_updated_at')
    .eq('id', target.fulfillmentId)
    .maybeSingle()
  if (error) throw error
  return data as {
    id: string
    request_id: string
    fulfillment_status: string
    shipping_notes: string | null
    completed_at: string | null
    status_updated_at: string
  } | null
}

async function getWorkflowRow(
  supabase: Supabase,
  repId: string,
  conversationId: string,
  requestId: string,
  expectedStatus: string,
) {
  const { data, error } = await supabase
    .from('nic_nac_trade_workflows')
    .select('id,status,phase,approval_state,known_fields,db_assertions,public_proof')
    .eq('rep_id', repId)
    .eq('conversation_id', conversationId)
    .eq('workflow_type', 'trade_fulfillment_update')
    .order('updated_at', { ascending: false })
  if (error) throw error
  const rows = (data ?? []) as Array<{
    id: string
    status: string
    phase: string
    approval_state: string
    known_fields: Record<string, unknown>
    db_assertions: Record<string, unknown>
    public_proof: Record<string, unknown>
  }>
  return (
    rows.find(
      (row) =>
        row.known_fields?.requestId === requestId &&
        row.known_fields?.nextFulfillmentStatus === expectedStatus,
    ) ?? null
  )
}

async function assertFulfillmentState(input: {
  supabase: Supabase
  repId: string
  conversationId: string
  target: SeededFulfillmentTarget
  expectedStatus: 'shipped' | 'completed'
  expectedShippingNotes?: string
  expectCompletedAt?: boolean
  expectPromptAddToBoard?: boolean
}) {
  const row = await getFulfillmentRow(input.supabase, input.target)
  if (!row) throw new Error('database assertion failed: fulfillment row disappeared.')
  if (row.fulfillment_status !== input.expectedStatus) {
    throw new Error(
      `database assertion failed: fulfillment status was ${row.fulfillment_status}, expected ${input.expectedStatus}.`,
    )
  }
  if (
    input.expectedShippingNotes !== undefined &&
    row.shipping_notes !== input.expectedShippingNotes
  ) {
    throw new Error(
      `database assertion failed: shipping notes were ${row.shipping_notes}, expected ${input.expectedShippingNotes}.`,
    )
  }
  if (input.expectCompletedAt && !row.completed_at) {
    throw new Error('database assertion failed: completed fulfillment did not record completed_at.')
  }

  const workflow = await getWorkflowRow(
    input.supabase,
    input.repId,
    input.conversationId,
    input.target.requestId,
    input.expectedStatus,
  )
  if (!workflow) {
    throw new Error(
      `database assertion failed: fulfillment workflow row missing for ${input.expectedStatus}.`,
    )
  }
  if (
    workflow.status !== 'completed' ||
    workflow.phase !== 'completed' ||
    workflow.approval_state !== 'not_required'
  ) {
    throw new Error(
      `database assertion failed: fulfillment workflow not completed/not_required (${workflow.status}/${workflow.phase}/${workflow.approval_state}).`,
    )
  }
  if (workflow.db_assertions?.fulfillment == null) {
    throw new Error('database assertion failed: fulfillment workflow missing db assertion.')
  }
  if (
    workflow.public_proof?.tradeBoardListingVisibilityUnaffected !== true ||
    workflow.public_proof?.shouldPromptAddToBoard !== Boolean(input.expectPromptAddToBoard)
  ) {
    throw new Error('database assertion failed: fulfillment workflow missing public proof flags.')
  }
}

async function fetchPublicTradeBoardPayload(appUrl: string, env: Env, repId: string) {
  const response = await fetch(
    withVercelProtectionBypass(
      `${appUrl}/api/amethyst/trade-board?c=${encodeURIComponent(repId)}`,
      env,
    ),
  )
  if (!response.ok) {
    throw new Error(`/api/amethyst/trade-board returned ${response.status}: ${await response.text()}`)
  }
  return (await response.json()) as { listings?: Array<{ id?: string; name?: string }> }
}

async function assertPublicListingHidden(input: {
  appUrl: string
  env: Env
  repId: string
  listingId: string
}) {
  const payload = await fetchPublicTradeBoardPayload(input.appUrl, input.env, input.repId)
  const ids = new Set((payload.listings ?? []).map((listing) => listing.id))
  if (ids.has(input.listingId)) {
    throw new Error(
      `public site assertion failed: traded listing ${input.listingId} was visible on the public board.`,
    )
  }
}

function classify(error: unknown): FulfillmentSmokeStatus {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('Missing required')) return 'missing_env'
  if (message.includes('Did not observe')) return 'tool_not_observed'
  if (message.includes('database assertion failed')) return 'database_assertion_failed'
  if (message.includes('public site assertion failed')) return 'public_site_assertion_failed'
  if (message.includes('cleanup')) return 'cleanup_failed'
  return 'api_failed'
}

export async function runFulfillmentUpdateSmoke(
  env: Env = process.env,
): Promise<FulfillmentSmokeResult> {
  const missingEnv = getMissingFulfillmentSmokeEnv(env)
  if (missingEnv.length) {
    return {
      ok: false,
      status: 'missing_env',
      missingEnv,
      message: `Missing required Nic-Nac fulfillment smoke env: ${missingEnv.join(', ')}`,
    }
  }

  const appUrl = getSmokeAppUrl(env)
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  await resetReviewerSmokeSession('dashboard_unlocked', supabase as never)
  const session = await createReviewerSessionCookie(env)
  const rep = await fetchNicNacMe(appUrl, env, session.cookie)

  const runTag = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(4, 14)
  const conversationId = randomUUID()
  const turns: TurnResult[] = []
  let messages: UIMessage[] = []
  let target: SeededFulfillmentTarget | undefined

  try {
    target = await seedFulfillmentTarget(supabase, rep.id, runTag)
    await assertPublicListingHidden({
      appUrl,
      env,
      repId: rep.id,
      listingId: target.listingId,
    })

    messages = await sendTurn({
      appUrl,
      env,
      cookie: session.cookie,
      supabase,
      conversationId,
      currentMessages: messages,
      expectedAssistantCount: 1,
      requiredTools: ['get_fulfillment_queue'],
      turns,
      text:
        `Show my active trade fulfillment queue. I am looking for request ${target.requestId} ` +
        `from ${target.customerName} for ${target.itemNumber}.`,
    })

    messages = await sendTurn({
      appUrl,
      env,
      cookie: session.cookie,
      supabase,
      conversationId,
      currentMessages: messages,
      expectedAssistantCount: 2,
      requiredTools: ['update_fulfillment_status'],
      turns,
      text:
        `Mark fulfillment request ${target.requestId} for ${target.customerName} as shipped. ` +
        'Shipping notes: USPS TRACK-CODEX-123.',
    })

    await assertFulfillmentState({
      supabase,
      repId: rep.id,
      conversationId,
      target,
      expectedStatus: 'shipped',
      expectedShippingNotes: 'USPS TRACK-CODEX-123',
      expectPromptAddToBoard: false,
    })
    await assertPublicListingHidden({
      appUrl,
      env,
      repId: rep.id,
      listingId: target.listingId,
    })

    messages = await sendTurn({
      appUrl,
      env,
      cookie: session.cookie,
      supabase,
      conversationId,
      currentMessages: messages,
      expectedAssistantCount: 3,
      requiredTools: ['update_fulfillment_status'],
      turns,
      text:
        `Mark fulfillment request ${target.requestId} for ${target.customerName} as completed. ` +
        'Yes, help me add the piece I received from the customer to my board after this.',
    })

    const finalAssistantText = extractAssistantText(messages)
    if (!/add the piece|add .* to (?:your|my) board|piece .* received/i.test(finalAssistantText)) {
      throw new Error(
        'database assertion failed: completed fulfillment response did not prompt to add the received piece.',
      )
    }

    await assertFulfillmentState({
      supabase,
      repId: rep.id,
      conversationId,
      target,
      expectedStatus: 'completed',
      expectedShippingNotes: 'USPS TRACK-CODEX-123',
      expectCompletedAt: true,
      expectPromptAddToBoard: true,
    })
    await assertPublicListingHidden({
      appUrl,
      env,
      repId: rep.id,
      listingId: target.listingId,
    })

    const cleanup = await cleanupTarget(supabase, target)
    return {
      ok: true,
      status: 'passed',
      appUrl,
      conversationId,
      rep,
      runTag,
      target,
      turns,
      cleanup,
      message:
        'Nic-Nac fulfillment update smoke passed through real /api/nic-nac queue listing, shipped update, completed update, received-piece prompt, workflow DB assertions, public hidden proof, and cleanup.',
    }
  } catch (error) {
    const cleanup: FulfillmentSmokeResult['cleanup'] = { deletedRows: {} }
    try {
      cleanup.deletedRows = (await cleanupTarget(supabase, target)).deletedRows
    } catch (cleanupError) {
      cleanup.error = cleanupError instanceof Error ? cleanupError.message : String(cleanupError)
    }
    return {
      ok: false,
      status: classify(error),
      appUrl,
      conversationId,
      rep,
      runTag,
      target,
      turns,
      cleanup,
      message: error instanceof Error ? error.message : String(error),
    }
  }
}

async function main() {
  config({ path: '.env.local', quiet: true })
  const result = await runFulfillmentUpdateSmoke()
  console.log(JSON.stringify(result, null, 2))
  if (!result.ok) process.exit(1)
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
