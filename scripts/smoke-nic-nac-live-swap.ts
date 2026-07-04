import { randomUUID } from 'node:crypto'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import type { UIMessage } from 'ai'

import { loadCanonicalHistory } from '@/lib/nic-nac/persistence'
import { getReviewerSmokePersona } from '@/lib/reviewer-smoke/config'
import { resetReviewerSmokeSession } from '@/lib/reviewer-smoke/session'
import {
  approveLatestTool,
  findApprovalTarget,
  getMissingRemoveListingSmokeEnv,
} from './smoke-nic-nac-remove-listing'

const DEFAULT_APP_URL = 'https://sparkle-suite-demo.vercel.app'
const MAX_HISTORY_WAIT_MS = 75_000
const HISTORY_POLL_MS = 1_000
const SMOKE_PREFIX = 'Codex Live Swap Smoke'

type Env = Record<string, string | undefined>
type Supabase = SupabaseClient
type UiPart = UIMessage['parts'][number] & {
  type?: string
  text?: string
  state?: string
  output?: unknown
  approval?: { id?: string; approved?: boolean }
}

type Rep = {
  id: string
  email: string
  displayName?: string
  publicSiteSlug?: string | null
}

type SeededLiveSwapTarget = {
  collectionId: string
  outgoingDesignId: string
  replacementDesignId: string
  outgoingListingId: string
  replacementListingId?: string
  requestId: string
  fulfillmentId?: string
  swapId?: string
  outgoingItemNumber: string
  replacementItemNumber: string
  outgoingDesignName: string
  replacementDesignName: string
  customerName: string
}

type TurnResult = {
  turn: string
  runId: string | null
  observedTools: string[]
  assistantText: string
}

type LiveSwapSmokeStatus =
  | 'passed'
  | 'missing_env'
  | 'api_failed'
  | 'tool_not_observed'
  | 'approval_not_found'
  | 'approval_output_timeout'
  | 'database_assertion_failed'
  | 'public_site_assertion_failed'
  | 'cleanup_failed'

type LiveSwapSmokeResult = {
  ok: boolean
  status: LiveSwapSmokeStatus
  appUrl?: string
  conversationId?: string
  rep?: Rep
  runTag?: string
  target?: SeededLiveSwapTarget
  turns?: TurnResult[]
  cleanup?: { deletedRows: Record<string, number>; error?: string }
  missingEnv?: string[]
  message: string
}

const HARD_FAIL_PATTERNS = [
  /i can't actually (approve|swap|capture|add|update|change)/i,
  /i'm not able to (approve|swap|capture|add|update|change)/i,
  /not able to access (the )?(trade request|swap|trade board) tool/i,
  /only have notes access/i,
  /approve it manually/i,
  /add it manually/i,
  /log into your workspace and (approve|add)/i,
  /customer (?:has|will ship|needs to ship) the revealed/i,
  /use liveq/i,
  /paste (this|it) into/i,
]

export const getMissingLiveSwapSmokeEnv = getMissingRemoveListingSmokeEnv

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
  forbiddenLatestTools?: string[]
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
  for (const toolName of input.forbiddenLatestTools ?? []) {
    if (observedTools.includes(toolName)) {
      throw new Error(`Observed forbidden latest-turn tool ${toolName}.`)
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

async function seedLiveSwapTarget(
  supabase: Supabase,
  repId: string,
  runTag: string,
): Promise<SeededLiveSwapTarget> {
  const outgoingItemNumber = `NK${runTag}A`
  const replacementItemNumber = `ER${runTag}B`
  const customerName = 'Morgan Live Swap Smoke'

  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .insert({ name: `${SMOKE_PREFIX} Collection ${runTag}` })
    .select('id')
    .single()
  if (collectionError) throw collectionError

  const { data: designs, error: designError } = await supabase
    .from('jewelry_designs')
    .insert([
      {
        item_number: outgoingItemNumber,
        design_name: `${SMOKE_PREFIX} Outgoing Necklace ${runTag}`,
        collection_id: collection.id,
        material: 'Rhodium Plating',
        main_stone: 'Synthetic smoke crystal',
        bp_msrp: 42,
        canonical_photo_url: null,
        type_prefix: 'NK',
      },
      {
        item_number: replacementItemNumber,
        design_name: `${SMOKE_PREFIX} Revealed Earrings ${runTag}`,
        collection_id: collection.id,
        material: 'Rhodium Plating',
        main_stone: 'Synthetic smoke ruby',
        bp_msrp: 38,
        canonical_photo_url:
          'https://static.example.invalid/sparkle-suite/synthetic-earrings.png',
        type_prefix: 'ER',
      },
    ])
    .select('id,item_number,design_name')
  if (designError) throw designError
  const outgoingDesign = designs?.find((row) => row.item_number === outgoingItemNumber)
  const replacementDesign = designs?.find((row) => row.item_number === replacementItemNumber)
  if (!outgoingDesign || !replacementDesign) {
    throw new Error('database assertion failed: expected seeded live swap designs.')
  }

  const { data: outgoingListing, error: listingError } = await supabase
    .from('trade_listings')
    .insert({
      rep_id: repId,
      design_id: outgoingDesign.id,
      listing_source: 'catalog',
      status: 'pending_trade',
      rep_notes: `${SMOKE_PREFIX} outgoing listing ${runTag}`,
      trade_preferences: 'Synthetic live swap smoke.',
      uses_canonical_photo: true,
      listed_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (listingError) throw listingError

  const { data: request, error: requestError } = await supabase
    .from('trade_requests')
    .insert({
      listing_id: outgoingListing.id,
      customer_name: customerName,
      customer_description: `Synthetic live swap request for ${outgoingItemNumber}.`,
      status: 'pending',
    })
    .select('id')
    .single()
  if (requestError) throw requestError

  return {
    collectionId: collection.id,
    outgoingDesignId: outgoingDesign.id,
    replacementDesignId: replacementDesign.id,
    outgoingListingId: outgoingListing.id,
    requestId: request.id,
    outgoingItemNumber,
    replacementItemNumber,
    outgoingDesignName: outgoingDesign.design_name,
    replacementDesignName: replacementDesign.design_name,
    customerName,
  }
}

async function cleanupTarget(supabase: Supabase, target?: SeededLiveSwapTarget) {
  const deletedRows: Record<string, number> = {
    trade_swaps: 0,
    trade_fulfillment: 0,
    trade_requests: 0,
    trade_listings: 0,
    jewelry_designs: 0,
    collections: 0,
  }
  if (!target) return { deletedRows }

  const swapDelete = await supabase
    .from('trade_swaps')
    .delete()
    .eq('request_id', target.requestId)
    .select('id')
  if (swapDelete.error) throw swapDelete.error
  deletedRows.trade_swaps = swapDelete.data?.length ?? 0

  const fulfillmentDelete = await supabase
    .from('trade_fulfillment')
    .delete()
    .eq('request_id', target.requestId)
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

  const listingIds = [target.outgoingListingId, target.replacementListingId].filter(
    Boolean,
  ) as string[]
  if (listingIds.length) {
    const listingDelete = await supabase
      .from('trade_listings')
      .delete()
      .in('id', listingIds)
      .select('id')
    if (listingDelete.error) throw listingDelete.error
    deletedRows.trade_listings = listingDelete.data?.length ?? 0
  }

  const designDelete = await supabase
    .from('jewelry_designs')
    .delete()
    .in('id', [target.outgoingDesignId, target.replacementDesignId])
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

async function getRequestRow(supabase: Supabase, requestId: string) {
  const { data, error } = await supabase
    .from('trade_requests')
    .select('id,status')
    .eq('id', requestId)
    .maybeSingle()
  if (error) throw error
  return data as { id: string; status: string } | null
}

async function getListingRow(supabase: Supabase, repId: string, listingId: string) {
  const { data, error } = await supabase
    .from('trade_listings')
    .select('id,rep_id,status,ring_size,design:jewelry_designs(item_number,design_name,type_prefix)')
    .eq('id', listingId)
    .eq('rep_id', repId)
    .maybeSingle()
  if (error) throw error
  return data as {
    id: string
    rep_id: string
    status: string
    ring_size: string | null
    design:
      | { item_number: string; design_name: string; type_prefix: string }
      | Array<{ item_number: string; design_name: string; type_prefix: string }>
      | null
  } | null
}

async function getFulfillmentRow(supabase: Supabase, requestId: string) {
  const { data, error } = await supabase
    .from('trade_fulfillment')
    .select('id,request_id,fulfillment_status,received_listing_id')
    .eq('request_id', requestId)
    .maybeSingle()
  if (error) throw error
  return data as {
    id: string
    request_id: string
    fulfillment_status: string
    received_listing_id: string | null
  } | null
}

async function getSwapRow(supabase: Supabase, requestId: string) {
  const { data, error } = await supabase
    .from('trade_swaps')
    .select('id,request_id,outgoing_listing_id,revealed_item_number,revealed_design_id,replacement_listing_id,replacement_status')
    .eq('request_id', requestId)
    .maybeSingle()
  if (error) throw error
  return data as {
    id: string
    request_id: string
    outgoing_listing_id: string
    revealed_item_number: string
    revealed_design_id: string | null
    replacement_listing_id: string | null
    replacement_status: string
  } | null
}

async function getWorkflowRow(
  supabase: Supabase,
  repId: string,
  conversationId: string,
  requestId: string,
) {
  const { data, error } = await supabase
    .from('nic_nac_trade_workflows')
    .select('id,status,phase,approval_state,known_fields,db_assertions,public_proof,created_mutation_ids')
    .eq('rep_id', repId)
    .eq('conversation_id', conversationId)
    .eq('workflow_type', 'trade_swap_capture')
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
    created_mutation_ids: Array<Record<string, unknown>>
  }>
  return rows.find((row) => row.known_fields?.requestId === requestId) ?? null
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

async function assertPublicListingState(input: {
  appUrl: string
  env: Env
  repId: string
  listingId: string
  visible: boolean
}) {
  const payload = await fetchPublicTradeBoardPayload(input.appUrl, input.env, input.repId)
  const ids = new Set((payload.listings ?? []).map((listing) => listing.id))
  const actualVisible = ids.has(input.listingId)
  if (actualVisible !== input.visible) {
    throw new Error(
      `public site assertion failed: listing ${input.listingId} visible=${actualVisible}, expected ${input.visible}.`,
    )
  }
}

async function assertLiveSwapState(input: {
  supabase: Supabase
  repId: string
  conversationId: string
  target: SeededLiveSwapTarget
}) {
  const request = await getRequestRow(input.supabase, input.target.requestId)
  const outgoing = await getListingRow(
    input.supabase,
    input.repId,
    input.target.outgoingListingId,
  )
  const fulfillment = await getFulfillmentRow(input.supabase, input.target.requestId)
  const swap = await getSwapRow(input.supabase, input.target.requestId)
  if (request?.status !== 'approved') {
    throw new Error(`database assertion failed: request status was ${request?.status}.`)
  }
  if (outgoing?.status !== 'traded') {
    throw new Error(`database assertion failed: outgoing listing status was ${outgoing?.status}.`)
  }
  if (fulfillment?.fulfillment_status !== 'approved') {
    throw new Error('database assertion failed: fulfillment row missing or wrong status.')
  }
  if (!swap) throw new Error('database assertion failed: trade_swaps row missing.')
  if (swap.replacement_status !== 'added_to_board' || !swap.replacement_listing_id) {
    throw new Error(
      `database assertion failed: swap replacement was ${swap.replacement_status}/${swap.replacement_listing_id}.`,
    )
  }
  input.target.swapId = swap.id
  input.target.fulfillmentId = fulfillment!.id
  input.target.replacementListingId = swap.replacement_listing_id

  const replacement = await getListingRow(
    input.supabase,
    input.repId,
    swap.replacement_listing_id,
  )
  if (!replacement) throw new Error('database assertion failed: replacement listing missing.')
  const replacementDesign = Array.isArray(replacement.design)
    ? replacement.design[0]
    : replacement.design
  if (replacement.status !== 'available') {
    throw new Error(
      `database assertion failed: replacement listing status was ${replacement.status}.`,
    )
  }
  if (
    !replacementDesign ||
    replacementDesign.item_number !== input.target.replacementItemNumber ||
    replacementDesign.type_prefix !== 'ER'
  ) {
    throw new Error('database assertion failed: replacement listing design mismatch.')
  }

  const workflow = await getWorkflowRow(
    input.supabase,
    input.repId,
    input.conversationId,
    input.target.requestId,
  )
  if (!workflow) throw new Error('database assertion failed: live swap workflow row missing.')
  if (
    workflow.status !== 'completed' ||
    workflow.phase !== 'completed' ||
    workflow.approval_state !== 'approved'
  ) {
    throw new Error(
      `database assertion failed: live swap workflow not completed/approved (${workflow.status}/${workflow.phase}/${workflow.approval_state}).`,
    )
  }
  if (
    workflow.db_assertions?.tradeSwap == null ||
    workflow.db_assertions?.replacementListing == null ||
    workflow.public_proof?.outgoingListingShouldBeHidden !== true ||
    workflow.public_proof?.replacementListingShouldBeVisible !== true ||
    workflow.public_proof?.replacementListingId !== swap.replacement_listing_id
  ) {
    throw new Error('database assertion failed: live swap workflow missing DB/public proof.')
  }
}

function classify(error: unknown): LiveSwapSmokeStatus {
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

export async function runLiveSwapSmoke(
  env: Env = process.env,
): Promise<LiveSwapSmokeResult> {
  const missingEnv = getMissingLiveSwapSmokeEnv(env)
  if (missingEnv.length) {
    return {
      ok: false,
      status: 'missing_env',
      missingEnv,
      message: `Missing required Nic-Nac live swap smoke env: ${missingEnv.join(', ')}`,
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
  let target: SeededLiveSwapTarget | undefined

  try {
    target = await seedLiveSwapTarget(supabase, rep.id, runTag)

    messages = await sendTurn({
      appUrl,
      env,
      cookie: session.cookie,
      supabase,
      conversationId,
      currentMessages: messages,
      expectedAssistantCount: 1,
      turns,
      text:
        `Open my pending Trade Board request inbox. I am looking for request ${target.requestId} ` +
        `from ${target.customerName} for ${target.outgoingItemNumber}.`,
    })

    messages = await sendTurn({
      appUrl,
      env,
      cookie: session.cookie,
      supabase,
      conversationId,
      currentMessages: messages,
      expectedAssistantCount: 2,
      requiredTools: ['approve_trade_swap'],
      forbiddenLatestTools: ['approve_trade'],
      turns,
      text:
        `Approve live-show swap request ${target.requestId} from ${target.customerName}. ` +
        `The item number just revealed for the customer is ${target.replacementItemNumber}. ` +
        'Capture that revealed item number and approve the swap now.',
    })

    messages = await approveTurn({
      appUrl,
      env,
      cookie: session.cookie,
      supabase,
      conversationId,
      messages,
      toolName: 'approve_trade_swap',
      expectedAssistantCount: 2,
      turns,
    })

    await assertLiveSwapState({
      supabase,
      repId: rep.id,
      conversationId,
      target,
    })
    await assertPublicListingState({
      appUrl,
      env,
      repId: rep.id,
      listingId: target.outgoingListingId,
      visible: false,
    })
    await assertPublicListingState({
      appUrl,
      env,
      repId: rep.id,
      listingId: target.replacementListingId!,
      visible: true,
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
        'Nic-Nac live swap smoke passed through real /api/nic-nac pending-request listing, approve_trade_swap approval replay, outgoing hidden proof, replacement visible proof, workflow DB assertions, and cleanup.',
    }
  } catch (error) {
    const cleanup: LiveSwapSmokeResult['cleanup'] = { deletedRows: {} }
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
  const result = await runLiveSwapSmoke()
  console.log(JSON.stringify(result, null, 2))
  if (!result.ok) process.exit(1)
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
