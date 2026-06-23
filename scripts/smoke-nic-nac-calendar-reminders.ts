import { randomUUID } from 'node:crypto'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import type { UIMessage } from 'ai'

import { loadCanonicalHistory } from '@/lib/nic-nac/persistence'
import { getReviewerSmokePersona } from '@/lib/reviewer-smoke/config'
import {
  resetReviewerSmokeSession,
  REVIEWER_SMOKE_CALENDAR,
} from '@/lib/reviewer-smoke/session'

const DEFAULT_APP_URL = 'https://sparkle-suite-demo.vercel.app'
const MAX_HISTORY_WAIT_MS = 60_000
const HISTORY_POLL_MS = 1_000

type Env = Record<string, string | undefined>
type Supabase = SupabaseClient
type UiPart = UIMessage['parts'][number] & {
  type?: string
  text?: string
  state?: string
  toolCallId?: string
  input?: unknown
  output?: unknown
  approval?: { id?: string; approved?: boolean }
  toolName?: string
}

type SmokeTurnResult = {
  turn: string
  runId: string | null
  assistantText: string
  observedTools: string[]
}

type SmokeStatus =
  | 'passed'
  | 'missing_env'
  | 'api_failed'
  | 'tool_not_observed'
  | 'approval_not_found'
  | 'database_assertion_failed'

export type CalendarReminderSmokeResult = {
  ok: boolean
  status: SmokeStatus
  appUrl?: string
  conversationId?: string
  rep?: { id: string; email: string; displayName?: string }
  turns?: SmokeTurnResult[]
  missingEnv?: string[]
  message: string
}

type ApprovalTarget = {
  assistantMessage: UIMessage
  part: UiPart
  approvalId: string
  toolName: string
}

export function getMissingCalendarSmokeEnv(env: Env): string[] {
  return [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ].filter((name) => !env[name]?.trim())
}

export function findApprovalTarget(
  messages: UIMessage[],
  toolName: string,
): ApprovalTarget | null {
  const latestAssistant = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant')
  if (!latestAssistant) return null

  for (const part of latestAssistant.parts ?? []) {
    const toolPart = part as UiPart
    if (toolPart.type !== `tool-${toolName}`) continue
    if (toolPart.state !== 'approval-requested') continue
    const approvalId = toolPart.approval?.id
    if (!approvalId) continue
    return {
      assistantMessage: latestAssistant,
      part: toolPart,
      approvalId,
      toolName,
    }
  }

  return null
}

export function approveLatestTool(
  messages: UIMessage[],
  target: ApprovalTarget,
): UIMessage[] {
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

export async function runCalendarReminderSmoke(
  env: Env = process.env,
): Promise<CalendarReminderSmokeResult> {
  const missingEnv = getMissingCalendarSmokeEnv(env)
  if (missingEnv.length > 0) {
    return {
      ok: false,
      status: 'missing_env',
      missingEnv,
      message: 'Nic-Nac calendar reminder smoke is missing required environment.',
    }
  }

  const appUrl = getSmokeAppUrl(env)
  const serviceSupabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const reset = await resetReviewerSmokeSession('dashboard_unlocked', serviceSupabase)
  const session = await createReviewerSessionCookie(env)
  const rep = await fetchNicNacMe(appUrl, env, session.cookie)
  const conversationId = randomUUID()
  const turns: SmokeTurnResult[] = []
  let messages: UIMessage[] = []

  try {
    messages = await sendTurn({
      appUrl,
      env,
      cookie: session.cookie,
      supabase: serviceSupabase,
      conversationId,
      currentMessages: messages,
      text: 'text my people 45 before every show, plz, i will forget',
      expectedAssistantCount: 1,
      expectedTools: [
        'prepare_calendar_work',
        'get_notification_preferences',
        'set_notification_preferences',
      ],
      turns,
    })
    messages = await approveTurn({
      appUrl,
      env,
      cookie: session.cookie,
      supabase: serviceSupabase,
      conversationId,
      messages,
      toolName: 'set_notification_preferences',
      expectedAssistantCount: 1,
      turns,
      turn: 'approve_default_reminders',
    })
    await assertReminderPreferences(serviceSupabase, reset.repId)

    messages = await sendTurn({
      appUrl,
      env,
      cookie: session.cookie,
      supabase: serviceSupabase,
      conversationId,
      currentMessages: messages,
      text: 'turn off SMS reminders for tonight but keep email, chaos mode',
      expectedAssistantCount: 2,
      expectedTools: [
        'prepare_calendar_work',
        'list_my_shows',
        'set_show_reminder_override',
      ],
      turns,
    })
    messages = await approveTurn({
      appUrl,
      env,
      cookie: session.cookie,
      supabase: serviceSupabase,
      conversationId,
      messages,
      toolName: 'set_show_reminder_override',
      expectedAssistantCount: 2,
      turns,
      turn: 'approve_show_reminder_override',
    })
    await assertReminderOverride(serviceSupabase, reset.repId)

    messages = await sendTurn({
      appUrl,
      env,
      cookie: session.cookie,
      supabase: serviceSupabase,
      conversationId,
      currentMessages: messages,
      text: 'ugh i am sick tonight can you just skip whatever live i had',
      expectedAssistantCount: 3,
      expectedTools: [
        'prepare_calendar_work',
        'list_my_shows',
        'skip_show_occurrence',
      ],
      turns,
    })
    await approveTurn({
      appUrl,
      env,
      cookie: session.cookie,
      supabase: serviceSupabase,
      conversationId,
      messages,
      toolName: 'skip_show_occurrence',
      expectedAssistantCount: 3,
      turns,
      turn: 'approve_skip_occurrence',
    })
    await assertSkipOnlyOneOccurrence(serviceSupabase, reset.repId)

    return {
      ok: true,
      status: 'passed',
      appUrl,
      conversationId,
      rep,
      turns,
      message:
        'Nic-Nac calendar/reminder smoke passed through the real API, approval flow, and database assertions.',
    }
  } catch (error) {
    return {
      ok: false,
      status: classifySmokeError(error),
      appUrl,
      conversationId,
      rep,
      turns,
      message: error instanceof Error ? error.message : String(error),
    }
  }
}

function classifySmokeError(error: unknown): SmokeStatus {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('approval')) return 'approval_not_found'
  if (message.includes('Did not observe')) return 'tool_not_observed'
  if (message.includes('database assertion')) return 'database_assertion_failed'
  return 'api_failed'
}

function getSmokeAppUrl(env: Env): string {
  return (
    env.SPARKLE_NIC_NAC_SMOKE_APP_URL?.trim() ||
    DEFAULT_APP_URL
  ).replace(/\/+$/, '')
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

async function sendTurn(input: {
  appUrl: string
  env: Env
  cookie: string
  supabase: Supabase
  conversationId: string
  currentMessages: UIMessage[]
  text: string
  expectedAssistantCount: number
  expectedTools: string[]
  turns: SmokeTurnResult[]
}): Promise<UIMessage[]> {
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
  const observedTools = [...getObservedToolNames(history)]
  for (const toolName of input.expectedTools) {
    if (!observedTools.includes(toolName)) {
      throw new Error(
        `Did not observe ${toolName}. Observed tools: ${observedTools.join(', ')}`,
      )
    }
  }
  input.turns.push({
    turn: input.text,
    runId,
    assistantText: extractAssistantText(history).slice(-1200),
    observedTools,
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
  turns: SmokeTurnResult[]
  turn: string
}): Promise<UIMessage[]> {
  const approval = findApprovalTarget(input.messages, input.toolName)
  if (!approval) {
    throw new Error(`No approval-requested part found for ${input.toolName}.`)
  }
  const approvedMessages = approveLatestTool(input.messages, approval)
  const runId = await postNicNacTurn(input.appUrl, input.env, input.cookie, {
    conversationId: input.conversationId,
    messages: approvedMessages,
  })
  const history = await waitForCanonicalHistory({
    supabase: input.supabase,
    conversationId: input.conversationId,
    expectedAssistantCount: input.expectedAssistantCount,
  })
  input.turns.push({
    turn: input.turn,
    runId,
    assistantText: extractAssistantText(history).slice(-1200),
    observedTools: [...getObservedToolNames(history)],
  })
  return history
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

async function waitForCanonicalHistory(input: {
  supabase: Supabase
  conversationId: string
  expectedAssistantCount: number
}): Promise<UIMessage[]> {
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

function extractAssistantText(messages: UIMessage[]): string {
  return messages
    .filter((message) => message.role === 'assistant')
    .flatMap((message) => message.parts ?? [])
    .filter((part) => (part as UiPart).type === 'text')
    .map((part) => (part as UiPart).text ?? '')
    .join('\n')
}

function getObservedToolNames(messages: UIMessage[]): Set<string> {
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

async function assertReminderPreferences(supabase: Supabase, repId: string) {
  const { data, error } = await supabase
    .from('show_reminder_preferences')
    .select('enabled, channels, lead_minutes')
    .eq('rep_id', repId)
    .maybeSingle<{ enabled: boolean; channels: string[]; lead_minutes: number }>()
  if (error) throw error
  if (!data?.enabled || data.lead_minutes !== 45 || !data.channels.includes('sms')) {
    throw new Error('database assertion failed: reminder preferences were not saved.')
  }
}

async function assertReminderOverride(supabase: Supabase, repId: string) {
  const { data, error } = await supabase
    .from('show_reminder_overrides')
    .select('rep_id, event_id, enabled, channels')
    .eq('event_id', REVIEWER_SMOKE_CALENDAR.tonightEventId)
    .maybeSingle<{
      rep_id: string
      event_id: string
      enabled: boolean
      channels: string[]
    }>()
  if (error) throw error
  if (
    data?.rep_id !== repId ||
    !data.enabled ||
    data.channels.length !== 1 ||
    data.channels[0] !== 'email'
  ) {
    throw new Error('database assertion failed: per-show reminder override was not saved.')
  }
}

async function assertSkipOnlyOneOccurrence(supabase: Supabase, repId: string) {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('id, rep_id, status')
    .in('id', [
      REVIEWER_SMOKE_CALENDAR.tonightEventId,
      REVIEWER_SMOKE_CALENDAR.futureEventId,
    ])
  if (error) throw error
  const rows = (data ?? []) as Array<{ id: string; rep_id: string; status: string }>
  const tonight = rows.find((row) => row.id === REVIEWER_SMOKE_CALENDAR.tonightEventId)
  const future = rows.find((row) => row.id === REVIEWER_SMOKE_CALENDAR.futureEventId)
  if (
    tonight?.rep_id !== repId ||
    future?.rep_id !== repId ||
    tonight.status !== 'cancelled' ||
    future.status !== 'scheduled'
  ) {
    throw new Error('database assertion failed: skip did not cancel only one occurrence.')
  }
}

function withVercelProtectionBypass(rawUrl: string, env: Env): string {
  const bypass = env.VERCEL_PROTECTION_BYPASS?.trim()
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

async function main() {
  config({ path: '.env.local', quiet: true })
  const result = await runCalendarReminderSmoke()
  console.log(JSON.stringify(result, null, 2))
  if (!result.ok) process.exit(1)
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
