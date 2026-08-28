import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

import {
  readSparkleLabControlCenterModel,
  type SparkleLabControlCenterModel,
} from '@/lib/sparkle-lab/read-model'

const MAX_TELEMETRY_ROWS = 5_000

export type NicNacUsageRow = {
  product: string | null
  surface: string | null
  model: string
  model_provider: string | null
  status: string
  input_tokens: number | null
  output_tokens: number | null
  total_tokens: number | null
  estimated_cost_cents: number | null
  hard_fail_phrase_count: number | null
  blocked_memory_card_count: number | null
  created_at: string
}

function isWithin(value: string, start: Date, end: Date) {
  const timestamp = new Date(value).getTime()
  return timestamp >= start.getTime() && timestamp < end.getTime()
}

function spikeDetected(current: number, previous: number) {
  return current >= 5 && current >= Math.max(1, previous) * 2
}

function aggregateRows(rows: NicNacUsageRow[]) {
  return {
    runCount: rows.length,
    completedRunCount: rows.filter((row) => row.status === 'complete').length,
    failedOrAbortedRunCount: rows.filter((row) =>
      ['error', 'aborted'].includes(row.status),
    ).length,
    hardFailPhraseCount: rows.reduce(
      (total, row) => total + (row.hard_fail_phrase_count ?? 0),
      0,
    ),
    blockedMemoryCardCount: rows.reduce(
      (total, row) => total + (row.blocked_memory_card_count ?? 0),
      0,
    ),
    inputTokens: rows.reduce((total, row) => total + (row.input_tokens ?? 0), 0),
    outputTokens: rows.reduce((total, row) => total + (row.output_tokens ?? 0), 0),
    totalTokens: rows.reduce((total, row) => total + (row.total_tokens ?? 0), 0),
    knownEstimatedSpendCents: rows.reduce(
      (total, row) => total + (row.estimated_cost_cents ?? 0),
      0,
    ),
    unknownSpendRunCount: rows.filter(
      (row) => row.estimated_cost_cents === null,
    ).length,
  }
}

function groupRows(
  rows: NicNacUsageRow[],
  keyFor: (row: NicNacUsageRow) => string,
) {
  const groups = new Map<string, NicNacUsageRow[]>()
  for (const row of rows) {
    const key = keyFor(row)
    const group = groups.get(key)
    if (group) group.push(row)
    else groups.set(key, [row])
  }
  return groups
}

export function buildNicNacUsageSnapshot(input: {
  rows: NicNacUsageRow[]
  lab: SparkleLabControlCenterModel
  now: Date
  truncated?: boolean
  labFlags?: {
    manualRunsEnabled: boolean
    weeklyRunsEnabled: boolean
    modelSynthesisEnabled: boolean
  }
}) {
  const currentStart = new Date(input.now.getTime() - 24 * 60 * 60 * 1_000)
  const previousStart = new Date(input.now.getTime() - 48 * 60 * 60 * 1_000)
  const currentRows = input.rows.filter((row) =>
    isWithin(row.created_at, currentStart, input.now),
  )
  const previousRows = input.rows.filter((row) =>
    isWithin(row.created_at, previousStart, currentStart),
  )
  const allSurfaceKeys = new Set([
    ...groupRows(currentRows, (row) => `${row.product ?? 'unknown'}::${row.surface ?? 'unknown'}`).keys(),
    ...groupRows(previousRows, (row) => `${row.product ?? 'unknown'}::${row.surface ?? 'unknown'}`).keys(),
  ])
  const currentBySurface = groupRows(
    currentRows,
    (row) => `${row.product ?? 'unknown'}::${row.surface ?? 'unknown'}`,
  )
  const previousBySurface = groupRows(
    previousRows,
    (row) => `${row.product ?? 'unknown'}::${row.surface ?? 'unknown'}`,
  )
  const modelGroups = groupRows(
    currentRows,
    (row) => `${row.model_provider ?? 'unknown'}::${row.model}`,
  )
  const flags = input.labFlags ?? {
    manualRunsEnabled: false,
    weeklyRunsEnabled: false,
    modelSynthesisEnabled: false,
  }
  const coverageHoles = [
    'Credit balance is not recorded in existing Nic-Nac telemetry, so creditBalance is null.',
    'Finder runtime usage is stored in Finder\'s separate database and is not available to this Suite-side read model.',
  ]
  if (input.truncated) {
    coverageHoles.push(
      `The 48-hour telemetry window exceeded ${MAX_TELEMETRY_ROWS} rows; aggregates are partial.`,
    )
  }
  if (input.lab.accessIssue) {
    coverageHoles.push(`Sparkle Lab summaries are unavailable: ${input.lab.accessIssue}`)
  }

  const currentTotals = aggregateRows(currentRows)
  const previousTotals = aggregateRows(previousRows)

  return {
    generatedAt: input.now.toISOString(),
    window: {
      currentHours: 24,
      comparisonHours: 24,
      telemetryRowLimit: MAX_TELEMETRY_ROWS,
      truncated: Boolean(input.truncated),
    },
    totals: {
      ...currentTotals,
      previousRunCount: previousTotals.runCount,
      runSpikeDetected: spikeDetected(
        currentTotals.runCount,
        previousTotals.runCount,
      ),
      creditBalance: null,
      creditUnit: null,
    },
    bySurface: [...allSurfaceKeys]
      .map((key) => {
        const [product, surface] = key.split('::')
        const current = aggregateRows(currentBySurface.get(key) ?? [])
        const previous = aggregateRows(previousBySurface.get(key) ?? [])
        return {
          product,
          surface,
          ...current,
          previousRunCount: previous.runCount,
          runSpikeDetected: spikeDetected(current.runCount, previous.runCount),
        }
      })
      .sort((a, b) => b.runCount - a.runCount || a.surface.localeCompare(b.surface)),
    byModel: [...modelGroups.entries()]
      .map(([key, rows]) => {
        const [provider, model] = key.split('::')
        return { provider, model, ...aggregateRows(rows) }
      })
      .sort((a, b) => b.runCount - a.runCount || a.model.localeCompare(b.model)),
    surfaceCoverage: [
      {
        product: 'sparkle_suite',
        surface: 'rep_workspace',
        availability: 'available_in_suite_telemetry',
      },
      {
        product: 'sparkle_suite',
        surface: 'public_landing',
        availability: 'available_in_suite_telemetry',
      },
      {
        product: 'sparkle_suite',
        surface: 'customer_site',
        availability: 'available_in_suite_telemetry',
      },
      {
        product: 'sparkle_finder',
        surface: 'sparkle_finder',
        availability: 'coverage_hole_separate_database',
      },
    ],
    sparkleLab: {
      mutationMode: 'recommendations_only' as const,
      manualRunsEnabled: flags.manualRunsEnabled,
      weeklyRunsEnabled: flags.weeklyRunsEnabled,
      modelSynthesisEnabled: flags.modelSynthesisEnabled,
      latestRuns: input.lab.latestRuns,
      caps: input.lab.caps,
      accessIssue: input.lab.accessIssue,
    },
    coverageHoles,
    notice:
      'Read-only usage and guardrail telemetry. No prompt, tool, memory, account, billing, or Sparkle Lab run was changed or invoked.',
  }
}

export async function getControlCenterNicNacUsage(
  supabase: Pick<SupabaseClient, 'from'>,
  now = new Date(),
) {
  const previousStart = new Date(now.getTime() - 48 * 60 * 60 * 1_000)
  const [runsResult, lab] = await Promise.all([
    supabase
      .from('nic_nac_runs')
      .select(
        'product,surface,model,model_provider,status,input_tokens,output_tokens,total_tokens,estimated_cost_cents,hard_fail_phrase_count,blocked_memory_card_count,created_at',
      )
      .gte('created_at', previousStart.toISOString())
      .lt('created_at', now.toISOString())
      .order('created_at', { ascending: false })
      .limit(MAX_TELEMETRY_ROWS + 1),
    readSparkleLabControlCenterModel(supabase),
  ])

  if (runsResult.error) throw runsResult.error
  const rows = (runsResult.data ?? []) as NicNacUsageRow[]

  return buildNicNacUsageSnapshot({
    rows: rows.slice(0, MAX_TELEMETRY_ROWS),
    lab,
    now,
    truncated: rows.length > MAX_TELEMETRY_ROWS,
    labFlags: {
      manualRunsEnabled: process.env.SPARKLE_LAB_MANUAL_RUNS_ENABLED === 'true',
      weeklyRunsEnabled: process.env.SPARKLE_LAB_WEEKLY_RUNS_ENABLED === 'true',
      modelSynthesisEnabled:
        process.env.SPARKLE_LAB_MODEL_SYNTHESIS_ENABLED === 'true',
    },
  })
}
