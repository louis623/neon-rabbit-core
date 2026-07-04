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
const SMOKE_PREFIX = 'Codex Catalog Correction Smoke'
const ORIGINAL_MSRP = 38
const CORRECTED_MSRP = 54

type Env = Record<string, string | undefined>
type Supabase = SupabaseClient
type UiPart = UIMessage['parts'][number] & {
  type?: string
  text?: string
  state?: string
  input?: unknown
  output?: unknown
  approval?: { id?: string; approved?: boolean }
}

type Rep = {
  id: string
  email: string
  displayName?: string
  publicSiteSlug?: string | null
}

type SeededCatalogCorrectionTarget = {
  collectionId: string
  designId: string
  listingId: string
  itemNumber: string
  designName: string
}

type TurnResult = {
  turn: string
  runId: string | null
  observedTools: string[]
  assistantText: string
}

type CatalogCorrectionSmokeStatus =
  | 'passed'
  | 'missing_env'
  | 'api_failed'
  | 'tool_not_observed'
  | 'approval_not_found'
  | 'approval_output_timeout'
  | 'database_assertion_failed'
  | 'public_site_assertion_failed'
  | 'cleanup_failed'

type CatalogCorrectionSmokeResult = {
  ok: boolean
  status: CatalogCorrectionSmokeStatus
  appUrl?: string
  conversationId?: string
  rep?: Rep
  runTag?: string
  target?: SeededCatalogCorrectionTarget
  turns?: TurnResult[]
  cleanup?: { deletedRows: Record<string, number>; error?: string }
  missingEnv?: string[]
  message: string
}

const HARD_FAIL_PATTERNS = [
  /i can['’`]?t (?:actually )?(?:open|pull|look up|access|correct|fix|update|change)/i,
  /i['’`]?m not able to (?:open|pull|look up|access|correct|fix|update|change)/i,
  /not able to access (the )?(catalog|jewelry database|trade board) tool/i,
  /only have notes access/i,
  /fix it manually/i,
  /update it manually/i,
  /log into your workspace and (fix|update|change)/i,
  /send (this|it) to louis/i,
  /louis (will|can) review/i,
]

export const getMissingCatalogCorrectionSmokeEnv = getMissingRemoveListingSmokeEnv

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

async function seedCatalogCorrectionTarget(
  supabase: Supabase,
  repId: string,
  runTag: string,
): Promise<SeededCatalogCorrectionTarget> {
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
      main_stone: 'Synthetic catalog crystal',
      bp_msrp: ORIGINAL_MSRP,
      canonical_photo_url:
        'https://static.example.invalid/sparkle-suite/synthetic-catalog-earrings.png',
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
      trade_preferences: 'Synthetic catalog correction smoke. Item-for-item only.',
      uses_canonical_photo: true,
      listed_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (listingError) throw listingError

  return {
    collectionId: collection.id,
    designId: design.id,
    listingId: listing.id,
    itemNumber,
    designName,
  }
}

async function cleanupSeededTarget(
  supabase: Supabase,
  target?: SeededCatalogCorrectionTarget,
) {
  const deletedRows: Record<string, number> = {
    jewelry_catalog_change_log: 0,
    trade_listings: 0,
    jewelry_designs: 0,
    collections: 0,
  }
  if (!target) return { deletedRows }

  const logDelete = await supabase
    .from('jewelry_catalog_change_log')
    .delete()
    .eq('design_id', target.designId)
    .select('id')
  if (logDelete.error) throw logDelete.error
  deletedRows.jewelry_catalog_change_log = logDelete.data?.length ?? 0

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

async function getDesignRow(supabase: Supabase, designId: string) {
  const { data, error } = await supabase
    .from('jewelry_designs')
    .select('id,item_number,bp_msrp,last_corrected_by_rep_id,last_corrected_at')
    .eq('id', designId)
    .maybeSingle()
  if (error) throw error
  return data as {
    id: string
    item_number: string
    bp_msrp: number | null
    last_corrected_by_rep_id: string | null
    last_corrected_at: string | null
  } | null
}

async function getCatalogLogRows(
  supabase: Supabase,
  designId: string,
  conversationId: string,
) {
  const { data, error } = await supabase
    .from('jewelry_catalog_change_log')
    .select('id,design_id,conversation_id,change_type,issue_type,before_state,after_state')
    .eq('design_id', designId)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Array<{
    id: string
    design_id: string
    conversation_id: string | null
    change_type: string
    issue_type: string | null
    before_state: Record<string, unknown> | null
    after_state: Record<string, unknown> | null
  }>
}

async function getWorkflowRow(
  supabase: Supabase,
  repId: string,
  conversationId: string,
) {
  const { data, error } = await supabase
    .from('nic_nac_trade_workflows')
    .select('id,status,phase,approval_state,known_fields,db_assertions,public_proof,created_mutation_ids')
    .eq('rep_id', repId)
    .eq('conversation_id', conversationId)
    .eq('workflow_type', 'trade_catalog_correction')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data as {
    id: string
    status: string
    phase: string
    approval_state: string
    known_fields: Record<string, unknown>
    db_assertions: Record<string, unknown>
    public_proof: Record<string, unknown>
    created_mutation_ids: Array<Record<string, unknown>>
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
  return (await response.json()) as {
    listings?: Array<{ id?: string; name?: string; msrp?: number | null }>
  }
}

async function assertPublicCatalogState(input: {
  appUrl: string
  env: Env
  repId: string
  listingId: string
}) {
  const payload = await fetchPublicTradeBoardPayload(input.appUrl, input.env, input.repId)
  const listing = (payload.listings ?? []).find((entry) => entry.id === input.listingId)
  if (!listing) {
    throw new Error(`public site assertion failed: listing ${input.listingId} was not visible.`)
  }
  if (listing.msrp !== CORRECTED_MSRP) {
    throw new Error(
      `public site assertion failed: listing ${input.listingId} MSRP was ${listing.msrp}, expected ${CORRECTED_MSRP}.`,
    )
  }
}

async function assertCatalogCorrectionState(input: {
  supabase: Supabase
  repId: string
  conversationId: string
  target: SeededCatalogCorrectionTarget
}) {
  const design = await getDesignRow(input.supabase, input.target.designId)
  if (!design) throw new Error('database assertion failed: catalog design missing.')
  if (design.bp_msrp !== CORRECTED_MSRP) {
    throw new Error(
      `database assertion failed: catalog MSRP was ${design.bp_msrp}, expected ${CORRECTED_MSRP}.`,
    )
  }
  if (design.last_corrected_by_rep_id !== input.repId || !design.last_corrected_at) {
    throw new Error('database assertion failed: catalog correction attribution missing.')
  }

  const logs = await getCatalogLogRows(
    input.supabase,
    input.target.designId,
    input.conversationId,
  )
  if (!logs.some((row) => row.change_type === 'report_issue' && row.issue_type === 'wrong_msrp')) {
    throw new Error('database assertion failed: catalog issue report log missing.')
  }
  const correctionLog = logs.find(
    (row) => row.change_type === 'correct_design_fields' && row.issue_type === 'wrong_msrp',
  )
  if (!correctionLog) {
    throw new Error('database assertion failed: catalog correction log missing.')
  }
  if (correctionLog.before_state?.bpMsrp !== ORIGINAL_MSRP) {
    throw new Error('database assertion failed: catalog correction before-state mismatch.')
  }
  if (correctionLog.after_state?.bpMsrp !== CORRECTED_MSRP) {
    throw new Error('database assertion failed: catalog correction after-state mismatch.')
  }

  const workflow = await getWorkflowRow(input.supabase, input.repId, input.conversationId)
  if (!workflow) {
    throw new Error('database assertion failed: catalog correction workflow row missing.')
  }
  if (
    workflow.status !== 'completed' ||
    workflow.phase !== 'completed' ||
    workflow.approval_state !== 'approved'
  ) {
    throw new Error(
      `database assertion failed: catalog correction workflow not completed/approved (${workflow.status}/${workflow.phase}/${workflow.approval_state}).`,
    )
  }
  if (
    workflow.known_fields?.itemNumber !== input.target.itemNumber ||
    workflow.known_fields?.catalogIssueType !== 'wrong_msrp'
  ) {
    throw new Error('database assertion failed: catalog workflow known fields mismatch.')
  }
  if (
    workflow.db_assertions?.catalogIssue == null ||
    workflow.db_assertions?.catalogDesign == null ||
    workflow.public_proof?.publicTradeBoardMayUseUpdatedCatalogData !== true ||
    workflow.public_proof?.itemNumber !== input.target.itemNumber
  ) {
    throw new Error('database assertion failed: catalog workflow missing DB/public proof.')
  }
}

function classify(error: unknown): CatalogCorrectionSmokeStatus {
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

export async function runCatalogCorrectionSmoke(
  env: Env = process.env,
): Promise<CatalogCorrectionSmokeResult> {
  const missingEnv = getMissingCatalogCorrectionSmokeEnv(env)
  if (missingEnv.length) {
    return {
      ok: false,
      status: 'missing_env',
      missingEnv,
      message: `Missing required Nic-Nac catalog correction smoke env: ${missingEnv.join(', ')}`,
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
  let target: SeededCatalogCorrectionTarget | undefined

  try {
    target = await seedCatalogCorrectionTarget(supabase, rep.id, runTag)

    messages = await sendTurn({
      appUrl,
      env,
      cookie: session.cookie,
      supabase,
      conversationId,
      currentMessages: messages,
      expectedAssistantCount: 1,
      requiredTools: ['search_jewelry_database'],
      turns,
      text:
        `Open the jewelry database record for item ${target.itemNumber}. ` +
        `I need to check the shared catalog details for ${target.designName}.`,
    })

    messages = await sendTurn({
      appUrl,
      env,
      cookie: session.cookie,
      supabase,
      conversationId,
      currentMessages: messages,
      expectedAssistantCount: 2,
      requiredTools: ['report_jewelry_catalog_issue'],
      forbiddenLatestTools: ['update_listing', 'add_memory'],
      turns,
      text:
        `The shared jewelry catalog MSRP for ${target.itemNumber} is wrong. ` +
        `It should be ${CORRECTED_MSRP}, not ${ORIGINAL_MSRP}. ` +
        `Fix the catalog record now and record the reason as synthetic smoke MSRP correction.`,
    })

    messages = await approveTurn({
      appUrl,
      env,
      cookie: session.cookie,
      supabase,
      conversationId,
      messages,
      toolName: 'report_jewelry_catalog_issue',
      expectedAssistantCount: 2,
      turns,
    })

    await assertCatalogCorrectionState({
      supabase,
      repId: rep.id,
      conversationId,
      target,
    })
    await assertPublicCatalogState({
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
        'Nic-Nac catalog correction smoke passed through real /api/nic-nac search, report_jewelry_catalog_issue approval replay, catalog/audit/workflow assertions, public Trade Board MSRP proof, and cleanup.',
    }
  } catch (error) {
    const cleanup: CatalogCorrectionSmokeResult['cleanup'] = { deletedRows: {} }
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
  const result = await runCatalogCorrectionSmoke()
  console.log(JSON.stringify(result, null, 2))
  if (!result.ok) process.exit(1)
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
