import { randomUUID } from 'node:crypto'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import type { UIMessage } from 'ai'

import { loadCanonicalHistory } from '@/lib/nic-nac/persistence'
import { getReviewerSmokePersona } from '@/lib/reviewer-smoke/config'
import {
  REVIEWER_SMOKE_CALENDAR,
  resetReviewerSmokeSession,
} from '@/lib/reviewer-smoke/session'

const APP_URL = 'https://www.yoursparklesuite.com'
const MAX_PAID_REQUESTS = 4
const HISTORY_WAIT_MS = 90_000
const HISTORY_POLL_MS = 1_000

const CALENDAR_READ_PROMPTS = [
  'Hey Nic-Nac, do I have anything on my calendar right now?',
  "What's on my schedule this week?",
  'When is my next live?',
  'Do I have a show tonight?',
] as const

const BAD_RESPONSE_PATTERNS = [
  /which show and date or schedule should i use/i,
  /which show (?:and|or) date/i,
  /what title, date and start time/i,
  /didn['’]t produce a response that time/i,
]

type Env = Record<string, string | undefined>
type Supabase = SupabaseClient
type UiPart = UIMessage['parts'][number] & {
  type?: string
  text?: string
  state?: string
  output?: unknown
}

type CalendarSnapshotRow = {
  id: string
  title: string | null
  event_time: string
  time_zone: string | null
  status: string
  updated_at: string
}

type ReplayResult = {
  prompt: string
  conversationId: string
  runId: string | null
  tools: string[]
  response: string
  ok: boolean
  failures: string[]
}

function requiredEnvMissing(env: Env) {
  return [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ].filter((name) => !env[name]?.trim())
}

async function createReviewerCookie(env: Env) {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL!.trim()
  const client = createClient(
    supabaseUrl,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  const persona = getReviewerSmokePersona(env as NodeJS.ProcessEnv)
  const { error } = await client.auth.signInWithPassword({
    email: persona.email,
    password: persona.password,
  })
  if (error) throw new Error(`Synthetic reviewer sign-in failed: ${error.message}`)

  const {
    data: { session },
  } = await client.auth.getSession()
  if (!session) throw new Error('Synthetic reviewer sign-in returned no session.')

  const supabaseRef = new URL(supabaseUrl).hostname.split('.')[0]
  return `sb-${supabaseRef}-auth-token=${encodeURIComponent(JSON.stringify(session))}`
}

async function calendarSnapshot(supabase: Supabase, repId: string) {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('id,title,event_time,time_zone,status,updated_at')
    .eq('rep_id', repId)
    .in('id', [
      REVIEWER_SMOKE_CALENDAR.tonightEventId,
      REVIEWER_SMOKE_CALENDAR.futureEventId,
    ])
    .order('id', { ascending: true })
  if (error) throw error
  return (data ?? []) as CalendarSnapshotRow[]
}

async function waitForAssistant(supabase: Supabase, conversationId: string) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < HISTORY_WAIT_MS) {
    const history = await loadCanonicalHistory(supabase, conversationId)
    const assistant = [...history]
      .reverse()
      .find((message) => message.role === 'assistant')
    if (assistant) return assistant
    await new Promise((resolve) => setTimeout(resolve, HISTORY_POLL_MS))
  }
  throw new Error(`Timed out waiting for Nic-Nac in conversation ${conversationId}.`)
}

function readAssistantText(message: UIMessage) {
  return (message.parts ?? [])
    .filter((part) => (part as UiPart).type === 'text')
    .map((part) => (part as UiPart).text?.trim() ?? '')
    .filter(Boolean)
    .join('\n')
}

function readToolNames(message: UIMessage) {
  return (message.parts ?? [])
    .map((part) => part as UiPart)
    .filter((part) => part.type?.startsWith('tool-'))
    .map((part) => part.type!.slice('tool-'.length))
}

function validateReplay(prompt: string, response: string, tools: string[]) {
  const failures: string[] = []
  if (!tools.includes('list_my_shows')) {
    failures.push(`list_my_shows was not observed (saw: ${tools.join(', ') || 'none'})`)
  }
  const disallowedTools = tools.filter((toolName) => toolName !== 'list_my_shows')
  if (disallowedTools.length > 0) {
    failures.push(`disallowed tools were observed: ${disallowedTools.join(', ')}`)
  }
  if (!response) failures.push('assistant response was empty')
  for (const pattern of BAD_RESPONSE_PATTERNS) {
    if (pattern.test(response)) failures.push(`bad response pattern matched: ${pattern.source}`)
  }
  if (!/reviewer smoke friday sparkles/i.test(response)) {
    failures.push('response did not identify the seeded reviewer show')
  }
  if (/right now/i.test(prompt) && !/happening right now/i.test(response)) {
    failures.push('right-now response did not say whether a show is happening now')
  }
  if (/this week/i.test(prompt)) {
    if (!/this week/i.test(response)) failures.push('this-week response was not scoped to this week')
    if (/september 8/i.test(response)) failures.push('this-week response included next week')
  }
  if (/next live/i.test(prompt)) {
    if (!/your next live is/i.test(response)) failures.push('next-live response was not direct')
    if (/september 8/i.test(response)) failures.push('next-live response listed later shows')
  }
  if (/tonight/i.test(prompt)) {
    if (!/tonight/i.test(response)) failures.push('tonight response was not direct')
    if (/september 8/i.test(response)) failures.push('tonight response listed later shows')
  }
  return failures
}

async function runReplay(input: {
  env: Env
  cookie: string
  supabase: Supabase
  prompt: string
}) {
  const conversationId = randomUUID()
  const userMessage: UIMessage = {
    id: `user-${randomUUID()}`,
    role: 'user',
    parts: [{ type: 'text', text: input.prompt }],
  }

  const response = await fetch(`${APP_URL}/api/nic-nac`, {
    method: 'POST',
    headers: {
      cookie: input.cookie,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      conversationId,
      messages: [userMessage],
      mode: 'workspace',
    }),
  })
  const responseBody = await response.text()
  if (!response.ok) {
    throw new Error(
      `/api/nic-nac returned ${response.status}: ${responseBody.slice(0, 500)}`,
    )
  }

  const assistant = await waitForAssistant(input.supabase, conversationId)
  const assistantText = readAssistantText(assistant)
  const tools = readToolNames(assistant)
  const failures = validateReplay(input.prompt, assistantText, tools)
  return {
    prompt: input.prompt,
    conversationId,
    runId: response.headers.get('x-nic-nac-run-id'),
    tools,
    response: assistantText,
    ok: failures.length === 0,
    failures,
  } satisfies ReplayResult
}

export async function runCalendarReadSmoke(env: Env = process.env) {
  const missingEnv = requiredEnvMissing(env)
  if (missingEnv.length > 0) {
    return {
      ok: false,
      requestCount: 0,
      message: `Missing required environment: ${missingEnv.join(', ')}`,
    }
  }
  if (CALENDAR_READ_PROMPTS.length !== MAX_PAID_REQUESTS) {
    throw new Error('Calendar read smoke must contain exactly four prompts.')
  }

  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    env.SUPABASE_SERVICE_ROLE_KEY!.trim(),
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  const reset = await resetReviewerSmokeSession('dashboard_unlocked', supabase as never)
  const cookie = await createReviewerCookie(env)
  const before = await calendarSnapshot(supabase, reset.repId)
  if (before.length !== 2) {
    throw new Error(`Reviewer reset should seed two calendar rows; found ${before.length}.`)
  }

  const results: ReplayResult[] = []
  for (const prompt of CALENDAR_READ_PROMPTS) {
    if (results.length >= MAX_PAID_REQUESTS) {
      throw new Error('Paid Nic-Nac request cap reached.')
    }
    results.push(await runReplay({ env, cookie, supabase, prompt }))
  }

  const after = await calendarSnapshot(supabase, reset.repId)
  const calendarUnchanged = JSON.stringify(after) === JSON.stringify(before)
  const ok =
    results.length === MAX_PAID_REQUESTS &&
    results.every((result) => result.ok) &&
    calendarUnchanged

  return {
    ok,
    requestCount: results.length,
    reviewer: 'synthetic dashboard-unlocked reviewer',
    calendarUnchanged,
    results,
    message: ok
      ? 'All four released Nic-Nac calendar-read replays passed without calendar writes.'
      : 'One or more released Nic-Nac calendar-read assertions failed.',
  }
}

async function main() {
  config({ path: '.env.local', quiet: true })
  const result = await runCalendarReadSmoke()
  console.log(JSON.stringify(result, null, 2))
  if (!result.ok) process.exit(1)
}

if (require.main === module) {
  main().catch((error) => {
    console.error(
      JSON.stringify({
        ok: false,
        message: error instanceof Error ? error.message : String(error),
      }),
    )
    process.exit(1)
  })
}
