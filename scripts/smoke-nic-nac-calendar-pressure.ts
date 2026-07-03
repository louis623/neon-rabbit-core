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
const PRESSURE_TITLE_PREFIX = 'Codex Pressure'

type Env = Record<string, string | undefined>
type Supabase = SupabaseClient
type UiPart = UIMessage['parts'][number] & {
  type?: string
  text?: string
  state?: string
  output?: unknown
  approval?: { id?: string; approved?: boolean }
}

type CalendarRow = {
  id: string
  title: string | null
  platform: string
  event_time: string
  time_zone: string | null
  duration_minutes: number | null
  discount_codes: Array<{ code: string; description: string }> | null
  featured_collections: string[] | null
  is_recurring: boolean | null
  recurrence_group_id: string | null
  recurrence_rule: string | null
  status: string
}

type TurnResult = {
  turn: string
  runId: string | null
  observedTools: string[]
  assistantText: string
}

type ApprovalTarget = {
  assistantMessage: UIMessage
  part: UiPart
  approvalId: string
  toolName: string
}

type SmokeStatus =
  | 'passed'
  | 'missing_env'
  | 'api_failed'
  | 'tool_not_observed'
  | 'approval_not_found'
  | 'approval_output_timeout'
  | 'database_assertion_failed'
  | 'public_site_assertion_failed'

type CalendarPressureSmokeResult = {
  ok: boolean
  status: SmokeStatus
  appUrl?: string
  conversationId?: string
  rep?: { id: string; email: string; displayName?: string; publicSiteSlug?: string | null }
  runTag?: string
  turns?: TurnResult[]
  createdEventIds?: string[]
  cleanup?: { deletedRows: number; error?: string }
  missingEnv?: string[]
  message: string
}

const HARD_FAIL_PATTERNS = [
  /i can['’]t actually (write|add|create|update|cancel)/i,
  /i['’]m not able to (write|add|create|update|cancel)/i,
  /not able to access (the )?calendar tool/i,
  /only have notes access/i,
  /paste (this|it) into/i,
  /add it manually/i,
  /cancel it manually/i,
  /from this turn/i,
]

function getMissingEnv(env: Env) {
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
  const bypass = env.VERCEL_PROTECTION_BYPASS?.trim()
  if (!bypass) return rawUrl

  const url = new URL(rawUrl)
  url.searchParams.set('x-vercel-set-bypass-cookie', 'true')
  url.searchParams.set('x-vercel-protection-bypass', bypass)
  return url.toString()
}

function futureDate(hoursFromNow: number) {
  const date = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000)
  date.setUTCSeconds(0, 0)
  return date
}

function formatIsoForPrompt(date: Date) {
  return `${date.toISOString()} (America/New_York timezone; keep this exact start instant)`
}

function title(runTag: string, suffix: string) {
  return `${PRESSURE_TITLE_PREFIX} ${runTag} ${suffix}`
}

function assertNoHardFails(text: string) {
  const hit = HARD_FAIL_PATTERNS.find((pattern) => pattern.test(text))
  if (hit) {
    throw new Error(`hard-fail phrase matched ${hit}: ${text.slice(-900)}`)
  }
}

function codes(row: CalendarRow) {
  return row.discount_codes ?? []
}

function collections(row: CalendarRow) {
  return row.featured_collections ?? []
}

function expectNearIso(actualIso: string, expected: Date, label: string) {
  const delta = Math.abs(Date.parse(actualIso) - expected.getTime())
  if (delta > 60_000) {
    throw new Error(
      `database assertion failed: ${label} time ${actualIso} was not near ${expected.toISOString()}`,
    )
  }
}

function expectCodeSet(row: CalendarRow, expectedCodes: string[], label: string) {
  const actual = codes(row).map((code) => code.code).sort()
  const expected = [...expectedCodes].sort()
  if (actual.join('|') !== expected.join('|')) {
    throw new Error(
      `database assertion failed: ${label} codes ${actual.join(',')} did not equal ${expected.join(',')}`,
    )
  }
}

function expectCollectionSet(row: CalendarRow, expectedCollections: string[], label: string) {
  const actual = collections(row).sort()
  const expected = [...expectedCollections].sort()
  if (actual.join('|') !== expected.join('|')) {
    throw new Error(
      `database assertion failed: ${label} collections ${actual.join(',')} did not equal ${expected.join(',')}`,
    )
  }
}

async function createReviewerSessionCookie(env: Env) {
  const persona = getReviewerSmokePersona(env as NodeJS.ProcessEnv)
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!supabaseUrl || !anonKey) {
    throw new Error('Demo Supabase auth environment is incomplete.')
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

async function fetchNicNacMe(appUrl: string, env: Env, cookie: string) {
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
    await new Promise((resolve) => setTimeout(resolve, HISTORY_POLL_MS))
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
    await new Promise((resolve) => setTimeout(resolve, HISTORY_POLL_MS))
  }
  throw new Error(
    `approval output timeout: ${input.toolName} ${input.approvalId} never reached output-available; latest state=${latestState}; canonical message count=${latest.length}.`,
  )
}

function extractAssistantText(messages: UIMessage[]) {
  return messages
    .filter((message) => message.role === 'assistant')
    .flatMap((message) => message.parts ?? [])
    .filter((part) => (part as UiPart).type === 'text')
    .map((part) => (part as UiPart).text ?? '')
    .join('\n')
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

function findApprovalTarget(messages: UIMessage[], toolName: string): ApprovalTarget | null {
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

function approveLatestTool(messages: UIMessage[], target: ApprovalTarget): UIMessage[] {
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
  const observedTools = [...getObservedToolNames(history)]
  for (const toolName of input.requiredTools ?? []) {
    if (!observedTools.includes(toolName)) {
      throw new Error(
        `Did not observe ${toolName}. Observed tools: ${observedTools.join(', ')}`,
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

async function cleanupPressureEvents(supabase: Supabase, repId: string) {
  const { data, error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('rep_id', repId)
    .ilike('title', `${PRESSURE_TITLE_PREFIX}%`)
    .select('id')
  if (error) throw error
  return (data ?? []).length
}

async function getEventsByTitle(supabase: Supabase, repId: string, eventTitle: string) {
  const { data, error } = await supabase
    .from('calendar_events')
    .select(
      'id,title,platform,event_time,time_zone,duration_minutes,discount_codes,featured_collections,is_recurring,recurrence_group_id,recurrence_rule,status',
    )
    .eq('rep_id', repId)
    .eq('title', eventTitle)
    .order('event_time', { ascending: true })
  if (error) throw error
  return (data ?? []) as CalendarRow[]
}

async function getPressureRows(supabase: Supabase, repId: string, runTag: string) {
  const { data, error } = await supabase
    .from('calendar_events')
    .select(
      'id,title,platform,event_time,time_zone,duration_minutes,discount_codes,featured_collections,is_recurring,recurrence_group_id,recurrence_rule,status',
    )
    .eq('rep_id', repId)
    .ilike('title', `${PRESSURE_TITLE_PREFIX} ${runTag}%`)
    .order('event_time', { ascending: true })
  if (error) throw error
  return (data ?? []) as CalendarRow[]
}

function requireRows(rows: CalendarRow[], count: number, label: string) {
  if (rows.length !== count) {
    throw new Error(`database assertion failed: ${label} expected ${count} row(s), found ${rows.length}.`)
  }
}

async function assertPublicSiteData(input: {
  appUrl: string
  env: Env
  repId: string
  requiredText: string[]
}) {
  const response = await fetch(
    withVercelProtectionBypass(
      `${input.appUrl}/api/amethyst/homepage-template?c=${encodeURIComponent(input.repId)}`,
      input.env,
    ),
  )
  const script = await response.text()
  if (!response.ok) {
    throw new Error(`public-site assertion failed: homepage-template returned ${response.status}`)
  }
  for (const text of input.requiredText) {
    if (!script.includes(text)) {
      throw new Error(`public-site assertion failed: homepage template did not include ${text}.`)
    }
  }
}

function classify(error: unknown): SmokeStatus {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('approval output timeout')) return 'approval_output_timeout'
  if (message.includes('approval')) return 'approval_not_found'
  if (message.includes('Did not observe')) return 'tool_not_observed'
  if (message.includes('database assertion')) return 'database_assertion_failed'
  if (message.includes('public-site assertion')) return 'public_site_assertion_failed'
  return 'api_failed'
}

export async function runCalendarPressureSmoke(
  env: Env = process.env,
): Promise<CalendarPressureSmokeResult> {
  const missingEnv = getMissingEnv(env)
  if (missingEnv.length > 0) {
    return {
      ok: false,
      status: 'missing_env',
      missingEnv,
      message: 'Nic-Nac calendar pressure smoke is missing required environment.',
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
  await cleanupPressureEvents(supabase, rep.id)

  const runTag = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(4, 14)
  const oneTitle = title(runTag, 'One-Time')
  const bonusTitle = title(runTag, 'Bonus')
  const seriesTitle = title(runTag, 'Weekly Series')
  const oneTime = futureDate(3)
  const bonusTime = futureDate(4)
  const seriesTime = futureDate(5)
  const conversationId = randomUUID()
  const turns: TurnResult[] = []
  let messages: UIMessage[] = []

  try {
    messages = await sendTurn({
      appUrl,
      env,
      cookie: session.cookie,
      supabase,
      conversationId,
      currentMessages: messages,
      expectedAssistantCount: 1,
      requiredTools: ['add_show'],
      turns,
      text:
        `Add a one-time calendar show. Title: ${oneTitle}. Platform: TikTok. ` +
        `Date/time: ${formatIsoForPrompt(oneTime)}. Duration: 90 minutes. ` +
        'Discount codes: CODEA10 = 10% off cart, CODEB15 = 15% off when customers order 3+ items. ' +
        'Featured collections: July Birthday 2026, Sterling Club 2026. ' +
        'Description: Smoke test one-time event.',
    })

    let oneRows = await getEventsByTitle(supabase, rep.id, oneTitle)
    requireRows(oneRows, 1, 'one-time add')
    expectNearIso(oneRows[0].event_time, oneTime, 'one-time add')
    if (oneRows[0].duration_minutes !== 90 || oneRows[0].is_recurring) {
      throw new Error('database assertion failed: one-time event duration/recurrence was wrong.')
    }
    expectCodeSet(oneRows[0], ['CODEA10', 'CODEB15'], 'one-time add')
    expectCollectionSet(oneRows[0], ['July Birthday 2026', 'Sterling Club 2026'], 'one-time add')

    messages = await sendTurn({
      appUrl,
      env,
      cookie: session.cookie,
      supabase,
      conversationId,
      currentMessages: messages,
      expectedAssistantCount: 2,
      requiredTools: ['add_show'],
      turns,
      text:
        `Add another one-time show. Title: ${bonusTitle}. Platform: Facebook Live. ` +
        `Date/time: ${formatIsoForPrompt(bonusTime)}. Duration: 45 minutes. ` +
        'Discount codes: FLASH5 = $5 off, CART12 = 12% off cart. ' +
        'Featured collections: OG Originals, Luxe Layers.',
    })

    const bonusRows = await getEventsByTitle(supabase, rep.id, bonusTitle)
    requireRows(bonusRows, 1, 'second one-time add')
    expectNearIso(bonusRows[0].event_time, bonusTime, 'second one-time add')
    if (bonusRows[0].duration_minutes !== 45 || bonusRows[0].is_recurring) {
      throw new Error('database assertion failed: second one-time event duration/recurrence was wrong.')
    }
    expectCodeSet(bonusRows[0], ['FLASH5', 'CART12'], 'second one-time add')
    expectCollectionSet(bonusRows[0], ['OG Originals', 'Luxe Layers'], 'second one-time add')

    messages = await sendTurn({
      appUrl,
      env,
      cookie: session.cookie,
      supabase,
      conversationId,
      currentMessages: messages,
      expectedAssistantCount: 3,
      requiredTools: ['add_show'],
      turns,
      text:
        `Add a weekly recurring show. Title: ${seriesTitle}. Platform: Facebook Live. ` +
        `Starts: ${formatIsoForPrompt(seriesTime)}. Duration: 120 minutes. ` +
        'Repeat weekly for three months. Discount codes: WEEKLY5 = $5 off live orders, BUNDLE20 = 20% off bundles. ' +
        'Featured collections: OG Originals, Luxe Layers, July Birthday 2026.',
    })

    const seriesRows = await getEventsByTitle(supabase, rep.id, seriesTitle)
    requireRows(seriesRows, 13, 'weekly recurring add')
    const groupIds = new Set(seriesRows.map((row) => row.recurrence_group_id))
    if (
      groupIds.size !== 1 ||
      !seriesRows.every((row) => row.is_recurring && row.recurrence_rule === 'weekly')
    ) {
      throw new Error('database assertion failed: weekly series recurrence fields were wrong.')
    }
    expectNearIso(seriesRows[0].event_time, seriesTime, 'weekly recurring add')
    expectCodeSet(seriesRows[0], ['WEEKLY5', 'BUNDLE20'], 'weekly recurring add')
    expectCollectionSet(
      seriesRows[0],
      ['OG Originals', 'Luxe Layers', 'July Birthday 2026'],
      'weekly recurring add',
    )

    await assertPublicSiteData({
      appUrl,
      env,
      repId: rep.id,
      requiredText: [oneTitle, bonusTitle, 'CODEA10', 'FLASH5', 'July Birthday 2026', 'OG Originals'],
    })

    messages = await sendTurn({
      appUrl,
      env,
      cookie: session.cookie,
      supabase,
      conversationId,
      currentMessages: messages,
      expectedAssistantCount: 4,
      requiredTools: ['list_my_shows'],
      turns,
      text: `List my upcoming Codex Pressure ${runTag} shows and summarize the codes and collections.`,
    })

    messages = await sendTurn({
      appUrl,
      env,
      cookie: session.cookie,
      supabase,
      conversationId,
      currentMessages: messages,
      expectedAssistantCount: 5,
      requiredTools: ['update_show'],
      turns,
      text:
        `Update the show titled ${oneTitle}: replace discount codes with ` +
        'VIP25 = 25% off VIP cart and STACK10 = 10% off stackable sets. ' +
        'Replace featured collections with Spring Luxe, Fall Luxe, and July Birthday 2026.',
    })

    oneRows = await getEventsByTitle(supabase, rep.id, oneTitle)
    requireRows(oneRows, 1, 'one-time update')
    expectCodeSet(oneRows[0], ['VIP25', 'STACK10'], 'one-time update')
    expectCollectionSet(oneRows[0], ['Spring Luxe', 'Fall Luxe', 'July Birthday 2026'], 'one-time update')

    messages = await sendTurn({
      appUrl,
      env,
      cookie: session.cookie,
      supabase,
      conversationId,
      currentMessages: messages,
      expectedAssistantCount: 6,
      requiredTools: ['cancel_show'],
      turns,
      text: `Cancel the one-time show titled ${bonusTitle}. Reason: Codex pressure smoke cleanup of one entry.`,
    })
    messages = await approveTurn({
      appUrl,
      env,
      cookie: session.cookie,
      supabase,
      conversationId,
      messages,
      toolName: 'cancel_show',
      expectedAssistantCount: 6,
      turns,
    })

    const cancelledBonus = await getEventsByTitle(supabase, rep.id, bonusTitle)
    requireRows(cancelledBonus, 1, 'one-time cancellation')
    if (cancelledBonus[0].status !== 'cancelled') {
      throw new Error('database assertion failed: one-time cancellation did not set status=cancelled.')
    }

    messages = await sendTurn({
      appUrl,
      env,
      cookie: session.cookie,
      supabase,
      conversationId,
      currentMessages: messages,
      expectedAssistantCount: 7,
      requiredTools: ['cancel_show_series'],
      turns,
      text:
        `Cancel the recurring series titled ${seriesTitle} starting with the first occurrence and all future occurrences. ` +
        'Reason: Codex pressure smoke cleanup of recurring series.',
    })
    await approveTurn({
      appUrl,
      env,
      cookie: session.cookie,
      supabase,
      conversationId,
      messages,
      toolName: 'cancel_show_series',
      expectedAssistantCount: 7,
      turns,
    })

    const cancelledSeries = await getEventsByTitle(supabase, rep.id, seriesTitle)
    requireRows(cancelledSeries, 13, 'series cancellation')
    if (!cancelledSeries.every((row) => row.status === 'cancelled')) {
      throw new Error('database assertion failed: series cancellation left scheduled rows behind.')
    }

    const createdRows = await getPressureRows(supabase, rep.id, runTag)
    const cleanupDeleted = await cleanupPressureEvents(supabase, rep.id)

    return {
      ok: true,
      status: 'passed',
      appUrl,
      conversationId,
      rep,
      runTag,
      turns,
      createdEventIds: createdRows.map((row) => row.id),
      cleanup: { deletedRows: cleanupDeleted },
      message:
        'Nic-Nac calendar pressure smoke passed: multiple one-time entries, recurring series, list, update, cancel one event, cancel series, public-site template visibility, and cleanup.',
    }
  } catch (error) {
    const cleanup: CalendarPressureSmokeResult['cleanup'] = { deletedRows: 0 }
    try {
      cleanup.deletedRows = await cleanupPressureEvents(supabase, rep.id)
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
      turns,
      cleanup,
      message: error instanceof Error ? error.message : String(error),
    }
  }
}

async function main() {
  config({ path: '.env.local', quiet: true })
  const result = await runCalendarPressureSmoke()
  console.log(JSON.stringify(result, null, 2))
  if (!result.ok) process.exit(1)
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
