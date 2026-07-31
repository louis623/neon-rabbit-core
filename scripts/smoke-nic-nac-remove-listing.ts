import { randomUUID } from 'node:crypto'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import type { UIMessage } from 'ai'

import { loadCanonicalHistory } from '@/lib/nic-nac/persistence'
import { getReviewerSmokePersona } from '@/lib/reviewer-smoke/config'
import { resetReviewerSmokeSession } from '@/lib/reviewer-smoke/session'

const DEFAULT_APP_URL = 'https://www.yoursparklesuite.com'
const MAX_HISTORY_WAIT_MS = 75_000
const HISTORY_POLL_MS = 1_000
const SMOKE_PREFIX = 'Codex Remove Smoke'

type Env = Record<string, string | undefined>
type Supabase = SupabaseClient
type UiPart = UIMessage['parts'][number] & {
  type?: string
  text?: string
  state?: string
  input?: unknown
  output?: unknown
  toolCallId?: string
  toolName?: string
  approval?: { id?: string; approved?: boolean }
}

type Rep = {
  id: string
  email: string
  displayName?: string
  publicSiteSlug?: string | null
}

type SeededRemovalTarget = {
  collectionId: string
  designId: string
  listingId: string
  requestId: string
  itemNumber: string
  designName: string
}

type TurnResult = {
  turn: string
  runId: string | null
  observedTools: string[]
  assistantText: string
}

export type ApprovalTarget = {
  assistantMessage: UIMessage
  part: UiPart
  approvalId: string
  toolName: string
}

type RemoveListingSmokeStatus =
  | 'passed'
  | 'missing_env'
  | 'api_failed'
  | 'tool_not_observed'
  | 'approval_not_found'
  | 'approval_output_timeout'
  | 'database_assertion_failed'
  | 'public_site_assertion_failed'
  | 'cleanup_failed'

type RemoveListingSmokeResult = {
  ok: boolean
  status: RemoveListingSmokeStatus
  appUrl?: string
  conversationId?: string
  rep?: Rep
  runTag?: string
  target?: SeededRemovalTarget
  turns?: TurnResult[]
  cleanup?: { deletedRows: Record<string, number>; error?: string }
  missingEnv?: string[]
  message: string
}

export const REMOVE_LISTING_HARD_FAIL_PATTERNS = [
  /i can['’]t actually (remove|delete|change|update)/i,
  /i['’]m not able to (remove|delete|change|update)/i,
  /not able to access (the )?trade board tool/i,
  /only have notes access/i,
  /remove it manually/i,
  /delete it manually/i,
  /log into your workspace and (remove|delete)/i,
  /paste (this|it) into/i,
]

export function getMissingRemoveListingSmokeEnv(env: Env) {
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

function findHardFails(text: string) {
  return REMOVE_LISTING_HARD_FAIL_PATTERNS.filter((pattern) =>
    pattern.test(text),
  ).map((pattern) => pattern.source)
}

function assertNoHardFails(text: string) {
  const failures = findHardFails(text)
  if (failures.length) {
    throw new Error(`Hard-fail phrase detected: ${failures.join(', ')}`)
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

async function waitForApprovedToolOutput(input: {
  supabase: Supabase
  conversationId: string
  expectedAssistantCount: number
  toolName: string
  approvalId: string
}) {
  const startedAt = Date.now()
  let latest: UIMessage[] = []
  let latestState = 'missing'
  while (Date.now() - startedAt < MAX_HISTORY_WAIT_MS) {
    latest = await loadCanonicalHistory(input.supabase, input.conversationId)
    const assistantCount = latest.filter((message) => message.role === 'assistant').length
    if (assistantCount >= input.expectedAssistantCount) {
      for (const message of latest.filter((m) => m.role === 'assistant').reverse()) {
        for (const part of message.parts ?? []) {
          const toolPart = part as UiPart
          if (toolPart.type !== `tool-${input.toolName}`) continue
          if (toolPart.approval?.id !== input.approvalId) continue
          latestState = toolPart.state ?? 'missing-state'
          if (toolPart.state === 'output-available') return latest
          if (toolPart.state === 'output-error') {
            throw new Error(
              `Approval tool ${input.toolName} returned output-error for ${input.approvalId}.`,
            )
          }
        }
      }
    }
    await sleep(HISTORY_POLL_MS)
  }
  throw new Error(
    `approval output timeout: ${input.toolName} ${input.approvalId} never reached output-available; latest state=${latestState}; canonical message count=${latest.length}.`,
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
    if (
      toolPart.state !== 'output-available' &&
      toolPart.state !== 'approval-requested'
    ) {
      continue
    }
    observed.add(toolPart.type.slice('tool-'.length))
  }
  return observed
}

function getObservedToolNames(messages: UIMessage[]) {
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
  return observed
}

export function findApprovalTarget(messages: UIMessage[], toolName: string): ApprovalTarget | null {
  const latestAssistant = [...messages].reverse().find((message) => message.role === 'assistant')
  if (!latestAssistant) return null

  for (const part of latestAssistant.parts ?? []) {
    const toolPart = part as UiPart
    if (toolPart.type !== `tool-${toolName}`) continue
    if (toolPart.state !== 'approval-requested') continue
    const approvalId = toolPart.approval?.id
    if (!approvalId) continue
    return { assistantMessage: latestAssistant, part: toolPart, approvalId, toolName }
  }

  return null
}

export function approveLatestTool(messages: UIMessage[], target: ApprovalTarget): UIMessage[] {
  return messages.map((message) => {
    if (message.id !== target.assistantMessage.id) return message
    return {
      ...message,
      parts: (message.parts ?? []).map((part) => {
        const toolPart = part as UiPart
        if (toolPart !== target.part) return part
        return {
          ...toolPart,
          state: 'approval-responded',
          toolName: target.toolName,
          approval: {
            id: target.approvalId,
            approved: true,
          },
        } as UIMessage['parts'][number]
      }),
    }
  })
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

async function approveTurn(input: {
  appUrl: string
  env: Env
  cookie: string
  supabase: Supabase
  conversationId: string
  messages: UIMessage[]
  toolName: string
  expectedAssistantCount: number
  turns: TurnResult[]
}) {
  const approval = findApprovalTarget(input.messages, input.toolName)
  if (!approval) {
    throw new Error(`No approval-requested part found for ${input.toolName}.`)
  }
  const approvedMessages = approveLatestTool(input.messages, approval)
  const runId = await postNicNacTurn(input.appUrl, input.env, input.cookie, {
    conversationId: input.conversationId,
    messages: approvedMessages,
  })
  const history = await waitForApprovedToolOutput({
    supabase: input.supabase,
    conversationId: input.conversationId,
    expectedAssistantCount: input.expectedAssistantCount,
    toolName: input.toolName,
    approvalId: approval.approvalId,
  })
  const assistantText = extractAssistantText(history)
  assertNoHardFails(assistantText)
  input.turns.push({
    turn: `approve:${input.toolName}`,
    runId,
    observedTools: [...getObservedToolNames(history)],
    assistantText: assistantText.slice(-1200),
  })
  return history
}

async function seedRemovalTarget(
  supabase: Supabase,
  repId: string,
  runTag: string,
): Promise<SeededRemovalTarget> {
  const itemNumber = `ER${runTag}`
  const designName = `${SMOKE_PREFIX} Earrings ${runTag}`

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
      bp_msrp: 38,
      canonical_photo_url: null,
      type_prefix: 'ER',
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
      status: 'available',
      rep_notes: `${SMOKE_PREFIX} listing ${runTag}`,
      trade_preferences: 'Synthetic removal smoke. Item-for-item only.',
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
      customer_name: 'Codex Removal Smoke Customer',
      customer_description: 'Synthetic pending request for removal smoke.',
      status: 'pending',
    })
    .select('id')
    .single()
  if (requestError) throw requestError

  return {
    collectionId: collection.id,
    designId: design.id,
    listingId: listing.id,
    requestId: request.id,
    itemNumber,
    designName,
  }
}

async function cleanupSeededTarget(
  supabase: Supabase,
  target?: SeededRemovalTarget,
) {
  const deletedRows: Record<string, number> = {
    trade_requests: 0,
    trade_listings: 0,
    jewelry_designs: 0,
    collections: 0,
  }
  if (!target) return { deletedRows }

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

async function getListingRow(supabase: Supabase, repId: string, listingId: string) {
  const { data, error } = await supabase
    .from('trade_listings')
    .select('id,rep_id,status,removal_reason,deleted_at')
    .eq('id', listingId)
    .eq('rep_id', repId)
    .maybeSingle()
  if (error) throw error
  return data as {
    id: string
    rep_id: string
    status: string
    removal_reason: string | null
    deleted_at: string | null
  } | null
}

async function getTradeRequestRow(supabase: Supabase, requestId: string) {
  const { data, error } = await supabase
    .from('trade_requests')
    .select('id,status,updated_at')
    .eq('id', requestId)
    .maybeSingle()
  if (error) throw error
  return data as { id: string; status: string; updated_at: string } | null
}

async function getCompletedWorkflow(
  supabase: Supabase,
  repId: string,
  conversationId: string,
) {
  const { data, error } = await supabase
    .from('nic_nac_trade_workflows')
    .select('id,status,phase,workflow_type,approval_state,known_fields,db_assertions,public_proof')
    .eq('rep_id', repId)
    .eq('conversation_id', conversationId)
    .eq('workflow_type', 'trade_board_remove_listing')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data as {
    id: string
    status: string
    phase: string
    workflow_type: string
    approval_state: string
    known_fields: Record<string, unknown>
    db_assertions: Record<string, unknown>
    public_proof: Record<string, unknown>
  } | null
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

async function assertPublicListingVisible(input: {
  appUrl: string
  env: Env
  repId: string
  listingId: string
}) {
  const payload = await fetchPublicTradeBoardPayload(input.appUrl, input.env, input.repId)
  const ids = new Set((payload.listings ?? []).map((listing) => listing.id))
  if (!ids.has(input.listingId)) {
    throw new Error(
      `public site assertion failed: seeded listing ${input.listingId} was not visible before removal.`,
    )
  }
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
      `public site assertion failed: removed listing ${input.listingId} was still visible.`,
    )
  }
}

async function verifyRemovalDatabaseState(input: {
  supabase: Supabase
  repId: string
  conversationId: string
  target: SeededRemovalTarget
}) {
  const listing = await getListingRow(input.supabase, input.repId, input.target.listingId)
  if (!listing) throw new Error('database assertion failed: listing row disappeared before cleanup.')
  if (listing.status !== 'removed') {
    throw new Error(`database assertion failed: listing status was ${listing.status}, not removed.`)
  }
  if (listing.removal_reason !== 'mistake') {
    throw new Error(
      `database assertion failed: removal reason was ${listing.removal_reason}, not mistake.`,
    )
  }
  if (!listing.deleted_at) {
    throw new Error('database assertion failed: removed listing did not record deleted_at.')
  }

  const request = await getTradeRequestRow(input.supabase, input.target.requestId)
  if (!request) throw new Error('database assertion failed: pending request row disappeared.')
  if (request.status !== 'cancelled') {
    throw new Error(
      `database assertion failed: pending request status was ${request.status}, not cancelled.`,
    )
  }

  const workflow = await getCompletedWorkflow(
    input.supabase,
    input.repId,
    input.conversationId,
  )
  if (!workflow) throw new Error('database assertion failed: no remove-listing workflow row found.')
  if (
    workflow.status !== 'completed' ||
    workflow.phase !== 'completed' ||
    workflow.approval_state !== 'approved'
  ) {
    throw new Error(
      `database assertion failed: workflow not completed/approved (${workflow.status}/${workflow.phase}/${workflow.approval_state}).`,
    )
  }
  if (workflow.known_fields?.listingId !== input.target.listingId) {
    throw new Error('database assertion failed: workflow known listingId did not match target.')
  }
  if (workflow.db_assertions?.tradeListing == null) {
    throw new Error('database assertion failed: workflow missing tradeListing db assertion.')
  }
  if (workflow.public_proof?.tradeBoardListingShouldBeHidden !== true) {
    throw new Error('database assertion failed: workflow missing public hidden proof flag.')
  }
}

function classify(error: unknown): RemoveListingSmokeStatus {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('Missing required')) return 'missing_env'
  if (message.includes('Did not observe')) return 'tool_not_observed'
  if (message.includes('No approval-requested')) return 'approval_not_found'
  if (message.includes('approval output timeout')) return 'approval_output_timeout'
  if (message.includes('database assertion failed')) return 'database_assertion_failed'
  if (message.includes('public site assertion failed')) return 'public_site_assertion_failed'
  if (message.includes('cleanup')) return 'cleanup_failed'
  return 'api_failed'
}

export async function runRemoveListingSmoke(
  env: Env = process.env,
): Promise<RemoveListingSmokeResult> {
  const missingEnv = getMissingRemoveListingSmokeEnv(env)
  if (missingEnv.length) {
    return {
      ok: false,
      status: 'missing_env',
      missingEnv,
      message: `Missing required Nic-Nac remove-listing smoke env: ${missingEnv.join(', ')}`,
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
  let target: SeededRemovalTarget | undefined

  try {
    target = await seedRemovalTarget(supabase, rep.id, runTag)
    await assertPublicListingVisible({
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
      requiredTools: ['list_my_trade_board'],
      turns,
      text: `What is on my Trade Board right now? I am checking for ${target.itemNumber}.`,
    })

    messages = await sendTurn({
      appUrl,
      env,
      cookie: session.cookie,
      supabase,
      conversationId,
      currentMessages: messages,
      expectedAssistantCount: 2,
      requiredTools: ['remove_listing'],
      turns,
      text:
        `Remove ${target.itemNumber} from my Trade Board because I listed it by mistake. ` +
        `It is the ${target.designName} piece.`,
    })

    messages = await approveTurn({
      appUrl,
      env,
      cookie: session.cookie,
      supabase,
      conversationId,
      messages,
      toolName: 'remove_listing',
      expectedAssistantCount: 2,
      turns,
    })

    await verifyRemovalDatabaseState({
      supabase,
      repId: rep.id,
      conversationId,
      target,
    })
    await assertPublicListingHidden({
      appUrl,
      env,
      repId: rep.id,
      listingId: target.listingId,
    })

    const cleanup = await cleanupSeededTarget(supabase, target)
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
        'Nic-Nac remove-listing smoke passed through real /api/nic-nac list, approval-requested remove_listing, approval continuation, database removal/request cancellation assertions, public Trade Board hidden proof, and cleanup.',
    }
  } catch (error) {
    const cleanup: RemoveListingSmokeResult['cleanup'] = { deletedRows: {} }
    try {
      cleanup.deletedRows = (await cleanupSeededTarget(supabase, target)).deletedRows
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
  const result = await runRemoveListingSmoke()
  console.log(JSON.stringify(result, null, 2))
  if (!result.ok) process.exit(1)
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
