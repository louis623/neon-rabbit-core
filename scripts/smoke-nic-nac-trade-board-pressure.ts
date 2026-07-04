import { config } from 'dotenv'

import { runCatalogCorrectionSmoke } from './smoke-nic-nac-catalog-correction'
import { runFulfillmentUpdateSmoke } from './smoke-nic-nac-fulfillment-update'
import { runLiveSwapSmoke } from './smoke-nic-nac-live-swap'
import { runRemoveListingSmoke } from './smoke-nic-nac-remove-listing'
import { runSwapCleanupSmoke } from './smoke-nic-nac-swap-cleanup'
import { runNonItemNumberTradeBoardSmoke } from './smoke-nic-nac-trade-board-non-item-number'
import { runTradeBoardIntakeSmoke } from './smoke-nic-nac-trade-board-intake'
import { runTradeRequestDecisionSmoke } from './smoke-nic-nac-trade-request-decisions'

type Env = Record<string, string | undefined>

type PressureSmokeName =
  | 'trade-board-intake'
  | 'trade-board-non-item-number'
  | 'remove-listing'
  | 'trade-request-decisions'
  | 'fulfillment-update'
  | 'live-swap'
  | 'swap-cleanup'
  | 'catalog-correction'

type SmokeResult = {
  ok: boolean
  status?: string
  message?: string
  appUrl?: string
  conversationId?: string
  runTag?: string
  turns?: unknown[]
  cleanup?: unknown
  missing?: unknown
  missingEnv?: unknown
}

type SmokeRunner = (env: Env) => Promise<SmokeResult>

export type TradeBoardPressureSmokeStep = {
  name: PressureSmokeName
  description: string
  run: SmokeRunner
}

export type TradeBoardPressureSmokeStepSummary = {
  name: PressureSmokeName
  ok: boolean
  status: string
  message: string
  appUrl?: string
  conversationId?: string
  runTag?: string
  turnCount: number
  durationMs: number
  cleanup?: unknown
  missing?: unknown
  missingEnv?: unknown
}

export type TradeBoardPressureSmokeResult = {
  ok: boolean
  status: 'passed' | 'failed'
  startedAt: string
  finishedAt: string
  durationMs: number
  passed: number
  failed: number
  steps: TradeBoardPressureSmokeStepSummary[]
  message: string
}

export const TRADE_BOARD_PRESSURE_SMOKE_STEPS: TradeBoardPressureSmokeStep[] = [
  {
    name: 'trade-board-intake',
    description: 'Item-number listing with label/details photo and boxed jewelry photo',
    run: runTradeBoardIntakeSmoke as SmokeRunner,
  },
  {
    name: 'trade-board-non-item-number',
    description: 'Listing without item number using structured non-catalog fields',
    run: runNonItemNumberTradeBoardSmoke as SmokeRunner,
  },
  {
    name: 'remove-listing',
    description: 'Approval-gated listing removal with public hidden proof',
    run: runRemoveListingSmoke as SmokeRunner,
  },
  {
    name: 'trade-request-decisions',
    description: 'Pending request inbox, approval-gated approve, direct reject',
    run: runTradeRequestDecisionSmoke as SmokeRunner,
  },
  {
    name: 'fulfillment-update',
    description: 'Fulfillment queue shipped/completed updates and received-piece prompt',
    run: runFulfillmentUpdateSmoke as SmokeRunner,
  },
  {
    name: 'live-swap',
    description: 'Live-show swap request approval and replacement listing creation',
    run: runLiveSwapSmoke as SmokeRunner,
  },
  {
    name: 'swap-cleanup',
    description: 'After-show swap cleanup with revealed ring size and add-listing handoff',
    run: runSwapCleanupSmoke as SmokeRunner,
  },
  {
    name: 'catalog-correction',
    description: 'Shared catalog MSRP correction with approval, audit, and public proof',
    run: runCatalogCorrectionSmoke as SmokeRunner,
  },
]

export function summarizePressureStep(input: {
  name: PressureSmokeName
  result: SmokeResult
  durationMs: number
}): TradeBoardPressureSmokeStepSummary {
  return {
    name: input.name,
    ok: input.result.ok,
    status: input.result.status ?? (input.result.ok ? 'passed' : 'failed'),
    message: input.result.message ?? '',
    appUrl: input.result.appUrl,
    conversationId: input.result.conversationId,
    runTag: input.result.runTag,
    turnCount: Array.isArray(input.result.turns) ? input.result.turns.length : 0,
    durationMs: input.durationMs,
    cleanup: input.result.cleanup,
    missing: input.result.missing,
    missingEnv: input.result.missingEnv,
  }
}

export async function runTradeBoardPressureSmoke(
  env: Env = process.env,
  steps: TradeBoardPressureSmokeStep[] = TRADE_BOARD_PRESSURE_SMOKE_STEPS,
): Promise<TradeBoardPressureSmokeResult> {
  const startedAtDate = new Date()
  const startedAt = startedAtDate.toISOString()
  const stepSummaries: TradeBoardPressureSmokeStepSummary[] = []

  for (const step of steps) {
    const stepStarted = Date.now()
    console.log(`[trade-board-pressure] START ${step.name}: ${step.description}`)
    try {
      const result = await step.run(env)
      const summary = summarizePressureStep({
        name: step.name,
        result,
        durationMs: Date.now() - stepStarted,
      })
      stepSummaries.push(summary)
      const label = summary.ok ? 'PASS' : 'FAIL'
      console.log(
        `[trade-board-pressure] ${label} ${step.name} status=${summary.status} conversation=${summary.conversationId ?? 'n/a'} message=${summary.message}`,
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      stepSummaries.push({
        name: step.name,
        ok: false,
        status: 'threw',
        message,
        turnCount: 0,
        durationMs: Date.now() - stepStarted,
      })
      console.error(`[trade-board-pressure] FAIL ${step.name} threw: ${message}`)
    }
  }

  const finishedAtDate = new Date()
  const failed = stepSummaries.filter((step) => !step.ok).length
  const passed = stepSummaries.length - failed
  const ok = failed === 0
  return {
    ok,
    status: ok ? 'passed' : 'failed',
    startedAt,
    finishedAt: finishedAtDate.toISOString(),
    durationMs: finishedAtDate.getTime() - startedAtDate.getTime(),
    passed,
    failed,
    steps: stepSummaries,
    message: ok
      ? `Nic-Nac Trade Board pressure smoke passed ${passed}/${stepSummaries.length} deployed smoke workflows.`
      : `Nic-Nac Trade Board pressure smoke failed ${failed}/${stepSummaries.length} deployed smoke workflows.`,
  }
}

async function main() {
  config({ path: '.env.local', quiet: true })
  const result = await runTradeBoardPressureSmoke()
  console.log(JSON.stringify(result, null, 2))
  if (!result.ok) process.exit(1)
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
