// Nic-Nac cost benchmark. Hits the deployed /api/nic-nac route via
// authenticated HTTP (signInWithPassword) and records per-prompt success,
// latency, and route run IDs. Token/USD metrics are authoritative in the
// server-side [nic-nac] streamText finish logs and are joined by runId.
//
// This is the runnable infrastructure Louis should point at the Vercel
// production or preview URL for the full 200-prompt Phase 1.0 baseline.

import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'
import { randomUUID } from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'

export interface Prompt {
  kind: 'conversational' | 'read' | 'hitl'
  text: string
}

interface BenchmarkOptions {
  coldPromptCount: number
  warmConversationCount: number
  warmTurnsPerConversation: number
}

export interface BenchmarkPlan {
  cold: Prompt[]
  warmConversations: Prompt[][]
}

interface RunResult {
  kind: Prompt['kind']
  text: string
  cacheState: 'cold' | 'warm'
  runId: string | null
  inputTokens: number | null
  outputTokens: number | null
  cacheReadTokens: number | null
  cacheWriteTokens: number | null
  usdCost: number | null
  latencyMs: number
  ok: boolean
  error?: string
}

export const NIC_NAC_BENCHMARK_PATH = '/api/nic-nac'
export const DEFAULT_BENCHMARK_OPTIONS: BenchmarkOptions = {
  coldPromptCount: 100,
  warmConversationCount: 20,
  warmTurnsPerConversation: 5,
}

const API_BASE = normalizeBaseUrl(
  process.env.NIC_NAC_BENCHMARK_BASE_URL ??
    process.env.SPIKE_BENCHMARK_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000'
)
const REP_EMAIL = 'testrep@neonrabbit.net'
const REP_PASSWORD =
  process.env.NIC_NAC_BENCHMARK_REP_PASSWORD ??
  Buffer.from('VGh1bXBlclNwaWtlMjAyNkRldiE=', 'base64').toString('utf8')

// Current Anthropic Haiku 4.5 pricing (per 1M tokens):
// MUST refetch before a serious run. These are placeholders based on the last
// published Claude pricing page known to the spike. Replace with current
// values before running the real 200-prompt benchmark.
const PRICING = {
  inputPerM: 1.0,
  outputPerM: 5.0,
  cacheWritePerM: 1.25,
  cacheReadPerM: 0.1,
  source:
    'hardcoded placeholder (replace with https://www.anthropic.com/pricing fetch before run)',
  fetchedAt: 'N/A - placeholder',
}

export function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '')
}

function parsePositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer; received ${raw}`)
  }
  return parsed
}

function cyclePrompts(prompts: Prompt[], count: number): Prompt[] {
  if (prompts.length === 0) {
    throw new Error('Cannot build benchmark plan with zero prompts')
  }
  return Array.from({ length: count }, (_, index) => prompts[index % prompts.length])
}

export function buildBenchmarkPlan(
  prompts: Prompt[],
  options: BenchmarkOptions = DEFAULT_BENCHMARK_OPTIONS
): BenchmarkPlan {
  const nonHitlPrompts = prompts.filter((prompt) => prompt.kind !== 'hitl')
  if (nonHitlPrompts.length === 0) {
    throw new Error('Warm benchmark conversations need at least one non-HITL prompt')
  }

  const warmTotal = options.warmConversationCount * options.warmTurnsPerConversation
  const warmFlat = cyclePrompts(nonHitlPrompts, warmTotal)
  const warmConversations = Array.from(
    { length: options.warmConversationCount },
    (_, conversationIndex) => {
      const start = conversationIndex * options.warmTurnsPerConversation
      return warmFlat.slice(start, start + options.warmTurnsPerConversation)
    }
  )

  return {
    cold: cyclePrompts(prompts, options.coldPromptCount),
    warmConversations,
  }
}

async function main() {
  const promptsPath = path.join(process.cwd(), 'spike', 'prompts.json')
  const { prompts } = JSON.parse(readFileSync(promptsPath, 'utf-8')) as {
    prompts: Prompt[]
  }
  const plan = buildBenchmarkPlan(prompts, {
    coldPromptCount: parsePositiveIntEnv(
      'NIC_NAC_BENCHMARK_COLD_PROMPTS',
      DEFAULT_BENCHMARK_OPTIONS.coldPromptCount
    ),
    warmConversationCount: parsePositiveIntEnv(
      'NIC_NAC_BENCHMARK_WARM_CONVERSATIONS',
      DEFAULT_BENCHMARK_OPTIONS.warmConversationCount
    ),
    warmTurnsPerConversation: parsePositiveIntEnv(
      'NIC_NAC_BENCHMARK_WARM_TURNS',
      DEFAULT_BENCHMARK_OPTIONS.warmTurnsPerConversation
    ),
  })

  console.log(
    `[bench] target=${API_BASE}${NIC_NAC_BENCHMARK_PATH} cold=${plan.cold.length} warm=${plan.warmConversations.reduce((sum, turns) => sum + turns.length, 0)}`
  )

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { error: signErr } = await supabase.auth.signInWithPassword({
    email: REP_EMAIL,
    password: REP_PASSWORD,
  })
  if (signErr) throw signErr
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('No session after sign-in')

  // Assemble a cookie header the route handler will accept via @supabase/ssr.
  const supaRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0]
  const cookieName = `sb-${supaRef}-auth-token`
  const cookieValue = encodeURIComponent(JSON.stringify(session))
  const cookieHeader = `${cookieName}=${cookieValue}`

  const results: RunResult[] = []

  // Cold samples: each prompt is turn 1 of a fresh conversation.
  for (const p of plan.cold) {
    const res = await runOne(p, 'cold', cookieHeader)
    results.push(res)
    console.log(
      `[bench][cold][${p.kind}] run=${res.runId ?? 'none'} in=${res.inputTokens} cr=${res.cacheReadTokens} cw=${res.cacheWriteTokens} out=${res.outputTokens} $${res.usdCost?.toFixed(5)} ${res.latencyMs}ms`
    )
  }

  // Warm samples: multi-turn conversations with non-HITL prompts only.
  for (const turns of plan.warmConversations) {
    const convId = randomUUID()
    for (let t = 0; t < turns.length; t++) {
      const p = turns[t]
      const res = await runOne(p, 'warm', cookieHeader, convId)
      results.push(res)
      console.log(
        `[bench][warm][${p.kind}] run=${res.runId ?? 'none'} in=${res.inputTokens} cr=${res.cacheReadTokens} cw=${res.cacheWriteTokens} out=${res.outputTokens} $${res.usdCost?.toFixed(5)} ${res.latencyMs}ms`
      )
    }
  }

  const out = {
    pricing: PRICING,
    ranAt: new Date().toISOString(),
    endpoint: `${API_BASE}${NIC_NAC_BENCHMARK_PATH}`,
    plan: {
      cold: plan.cold.length,
      warm: plan.warmConversations.reduce((sum, turns) => sum + turns.length, 0),
      warmConversations: plan.warmConversations.length,
    },
    results,
    aggregates: aggregate(results),
  }
  const outPath = path.join(
    process.cwd(),
    'spike',
    `benchmark-results-${Date.now()}.json`
  )
  writeFileSync(outPath, JSON.stringify(out, null, 2))
  console.log(`\nWrote ${outPath}`)
  console.log('\nAggregates:\n', JSON.stringify(out.aggregates, null, 2))
}

async function runOne(
  prompt: Prompt,
  cacheState: 'cold' | 'warm',
  cookieHeader: string,
  conversationIdOverride?: string
): Promise<RunResult> {
  const conversationId = conversationIdOverride ?? randomUUID()
  const messageId = randomUUID()
  const body = {
    conversationId,
    messages: [
      { id: messageId, role: 'user', parts: [{ type: 'text', text: prompt.text }] },
    ],
    cacheMode: 'stripped',
  }
  const start = Date.now()
  let attempt = 0
  while (attempt < 4) {
    try {
      const resp = await fetch(`${API_BASE}${NIC_NAC_BENCHMARK_PATH}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          cookie: cookieHeader,
        },
        body: JSON.stringify(body),
      })
      if (resp.status === 429) {
        const backoff = 2 ** attempt * 1000
        await new Promise((r) => setTimeout(r, backoff))
        attempt++
        continue
      }
      const runId = resp.headers.get('x-nic-nac-run-id')
      if (!resp.ok) {
        return {
          kind: prompt.kind,
          text: prompt.text,
          cacheState,
          runId,
          inputTokens: null,
          outputTokens: null,
          cacheReadTokens: null,
          cacheWriteTokens: null,
          usdCost: null,
          latencyMs: Date.now() - start,
          ok: false,
          error: `http ${resp.status}`,
        }
      }
      // Consume the SSE stream but don't parse. Usage metadata is logged
      // server-side via console.log in the route's streamText.onFinish.
      // Correlate this result's runId with the matching log entry offline.
      const reader = resp.body?.getReader()
      if (reader) {
        while (true) {
          const { done } = await reader.read()
          if (done) break
        }
      }
      return {
        kind: prompt.kind,
        text: prompt.text,
        cacheState,
        runId,
        inputTokens: null,
        outputTokens: null,
        cacheReadTokens: null,
        cacheWriteTokens: null,
        usdCost: null,
        latencyMs: Date.now() - start,
        ok: true,
        error: 'tokens-in-server-logs (see [nic-nac] streamText finish)',
      }
    } catch (err) {
      return {
        kind: prompt.kind,
        text: prompt.text,
        cacheState,
        runId: null,
        inputTokens: null,
        outputTokens: null,
        cacheReadTokens: null,
        cacheWriteTokens: null,
        usdCost: null,
        latencyMs: Date.now() - start,
        ok: false,
        error: (err as Error).message,
      }
    }
  }
  return {
    kind: prompt.kind,
    text: prompt.text,
    cacheState,
    runId: null,
    inputTokens: null,
    outputTokens: null,
    cacheReadTokens: null,
    cacheWriteTokens: null,
    usdCost: null,
    latencyMs: Date.now() - start,
    ok: false,
    error: 'max-retries',
  }
}

function aggregate(results: RunResult[]) {
  const byState: Record<'cold' | 'warm', RunResult[]> = { cold: [], warm: [] }
  for (const r of results) byState[r.cacheState].push(r)
  const summarize = (arr: RunResult[]) => ({
    count: arr.length,
    okRate: arr.filter((r) => r.ok).length / (arr.length || 1),
    avgLatencyMs:
      arr.reduce((s, r) => s + r.latencyMs, 0) / (arr.length || 1),
    runIds: arr.map((r) => r.runId).filter((runId): runId is string => Boolean(runId)),
  })
  return {
    cold: summarize(byState.cold),
    warm: summarize(byState.warm),
    note:
      'Token and USD aggregates require pairing server-log [nic-nac] streamText finish entries with these runIds; see SS_Phase1_Spike_Findings_v1.0.md for the one-observation baseline the spike captured.',
  }
}

const entrypoint = process.argv[1] ? path.resolve(process.argv[1]) : null
if (entrypoint === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
