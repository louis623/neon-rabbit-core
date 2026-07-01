import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  PHASE_11_SMOKE_MANIFEST,
  type Phase11JourneyId,
  type Phase11SmokeManifestEntry,
  type Phase11SmokeStatus,
} from '@/lib/launch-readiness/phase-11-smoke-manifest'
import type { CancellationSmokeReport } from '@/lib/launch-readiness/cancellation-smoke'
import type { LiveShowSmokeReport } from '@/lib/launch-readiness/live-show-smoke'
import type { MultiRepIsolationReport } from '@/lib/launch-readiness/multi-rep-isolation-smoke'
import type { OnboardingSmokeReport } from '@/lib/launch-readiness/onboarding-smoke'
import type { LaunchSmokeReport, LaunchSmokeTarget } from '@/scripts/smoke-demo-readiness'
import type { RecipeChatSmokeResult } from '@/scripts/smoke-nic-nac-recipe-chat'

export type LaunchReadinessProviderProofStatus =
  | 'blocked'
  | 'prepared'
  | 'covered'

export interface LaunchReadinessProviderProof {
  id: string
  label: string
  status: LaunchReadinessProviderProofStatus
  approvalGate: string
  evidence: string[]
  defaultAction: 'blocked' | 'none'
}

export interface LaunchReadinessRenderedMobileSmoke {
  ok: boolean
  artifactPath: string
  routes: string[]
}

type ComposedSmokeReport =
  | OnboardingSmokeReport
  | LiveShowSmokeReport
  | CancellationSmokeReport
  | MultiRepIsolationReport
  | RecipeChatSmokeResult

interface ComposedSmokeProof {
  artifactPath: string
  report: ComposedSmokeReport
}

export type LaunchReadinessComposedSmokes = Partial<
  Record<Phase11JourneyId, ComposedSmokeProof>
>

export interface LaunchReadinessReportInput {
  generatedAt?: Date
  target?: LaunchSmokeTarget | null
  launchSmokeReport?: LaunchSmokeReport | null
  composedSmokes?: LaunchReadinessComposedSmokes
  renderedMobileSmoke?: LaunchReadinessRenderedMobileSmoke | null
  providerProofChecklist?: LaunchReadinessProviderProof[]
}

export interface LaunchReadinessSummary {
  total: number
  covered: number
  partial: number
  missing: number
  blocked: number
  ready: boolean
}

export interface LaunchReadinessSmokeProofSummary {
  ok: boolean
  artifactPath: string
  stepCount: number
}

export interface LaunchReadinessRenderedProofSummary {
  ok: boolean
  artifactPath: string
  routeCount: number
}

export interface LaunchReadinessJourneyReport {
  id: Phase11JourneyId
  label: string
  status: Phase11SmokeStatus
  evidenceFiles: string[]
  safeSmokeCommand: Phase11SmokeManifestEntry['safeSmokeCommand']
  defaultProviderActions: string[]
  nextAction: string
  smokeProof: LaunchReadinessSmokeProofSummary | null
  renderedProof: LaunchReadinessRenderedProofSummary | null
  launchSmokeCategories: string[]
  blockedItems: string[]
}

export interface LaunchReadinessProviderActions {
  sendSms: false
  sendEmail: false
  chargeStripe: false
  sendSignWellLiveAgreement: false
  callPhotoroom: false
  callPostHog: false
  retrieveStripeSubscription: false
  cancelStripeSubscription: false
  createStripeRefund: false
  createBillingPortalSession: false
  constructStripeWebhook: false
}

export interface LaunchReadinessReport {
  generatedAt: string
  target: LaunchSmokeTarget
  ok: boolean
  safeByDefault: true
  summary: LaunchReadinessSummary
  providerActions: LaunchReadinessProviderActions
  journeys: LaunchReadinessJourneyReport[]
  providerProofChecklist: LaunchReadinessProviderProof[]
}

export interface WriteLaunchReadinessReportOptions {
  outputDir?: string
}

export interface LaunchReadinessReportArtifactOptions {
  generatedAt?: Date
  target?: LaunchSmokeTarget | null
  json?: boolean
  writeReport?: boolean
  outputDir?: string
  launchSmokeReportPath?: string | null
  onboardingReportPath?: string | null
  liveShowReportPath?: string | null
  dashboardNicNacReportPath?: string | null
  cancellationReportPath?: string | null
  multiRepIsolationReportPath?: string | null
  renderedMobileReportPath?: string | null
  providerProofChecklist?: LaunchReadinessProviderProof[]
}

export interface ParsedLaunchReadinessReportArgs {
  target: LaunchSmokeTarget | null
  json: boolean
  writeReport: boolean
  launchSmokeReportPath: string | null
  onboardingReportPath: string | null
  liveShowReportPath: string | null
  dashboardNicNacReportPath: string | null
  cancellationReportPath: string | null
  multiRepIsolationReportPath: string | null
  renderedMobileReportPath: string | null
}

export interface LaunchReadinessReportRunResult {
  report: LaunchReadinessReport
  outputPath: string | null
}

const PROVIDER_ACTIONS: LaunchReadinessProviderActions = {
  sendSms: false,
  sendEmail: false,
  chargeStripe: false,
  sendSignWellLiveAgreement: false,
  callPhotoroom: false,
  callPostHog: false,
  retrieveStripeSubscription: false,
  cancelStripeSubscription: false,
  createStripeRefund: false,
  createBillingPortalSession: false,
  constructStripeWebhook: false,
}

const COMPOSED_JOURNEY_IDS = new Set<Phase11JourneyId>([
  'onboarding',
  'live-show',
  'dashboard-nic-nac',
  'cancellation',
  'multi-rep-isolation',
])

function composedSmokeStepCount(report: ComposedSmokeReport): number {
  if ('steps' in report && Array.isArray(report.steps)) return report.steps.length
  if ('turns' in report && Array.isArray(report.turns)) return report.turns.length
  return 0
}

function isRecipeChatSmokeReport(
  report: ComposedSmokeReport,
): report is RecipeChatSmokeResult {
  return 'status' in report && 'message' in report && 'turns' in report
}

function composedSmokeOk(report: ComposedSmokeReport): boolean {
  if (isRecipeChatSmokeReport(report)) return report.status === 'passed'
  return report.ok
}

function summarizeSmokeProof(
  proof: ComposedSmokeProof | undefined,
): LaunchReadinessSmokeProofSummary | null {
  if (!proof) return null

  return {
    ok: composedSmokeOk(proof.report),
    artifactPath: proof.artifactPath,
    stepCount: composedSmokeStepCount(proof.report),
  }
}

function renderedProofSummary(
  proof: LaunchReadinessRenderedMobileSmoke | null | undefined,
): LaunchReadinessRenderedProofSummary | null {
  if (!proof) return null

  return {
    ok: proof.ok,
    artifactPath: proof.artifactPath,
    routeCount: proof.routes.length,
  }
}

function smokeBlockedSuggestions(
  proof: ComposedSmokeProof | undefined,
): string[] {
  if (!proof) return []

  if ('nextEvidenceSuggestions' in proof.report) {
    return proof.report.nextEvidenceSuggestions ?? []
  }

  if (!composedSmokeOk(proof.report) && 'message' in proof.report) {
    return [proof.report.message]
  }

  return []
}

function journeyStatus(
  entry: Phase11SmokeManifestEntry,
  smokeProof: LaunchReadinessSmokeProofSummary | null,
  renderedProof: LaunchReadinessRenderedProofSummary | null,
): Phase11SmokeStatus {
  if (entry.id === 'mobile-final-responsive' && renderedProof?.ok) {
    return 'covered'
  }

  if (COMPOSED_JOURNEY_IDS.has(entry.id) && smokeProof?.ok) {
    return 'covered'
  }

  if (COMPOSED_JOURNEY_IDS.has(entry.id) && smokeProof && !smokeProof.ok) {
    return 'partial'
  }

  return entry.status
}

function blockedItemsForJourney(
  status: Phase11SmokeStatus,
  entry: Phase11SmokeManifestEntry,
  smokeProof: ComposedSmokeProof | undefined,
  renderedProof: LaunchReadinessRenderedMobileSmoke | null | undefined,
): string[] {
  if (status === 'covered') return []

  const smokeSuggestions = smokeBlockedSuggestions(smokeProof)
  const renderedSuggestion =
    entry.id === 'mobile-final-responsive' && renderedProof && !renderedProof.ok
      ? ['Rendered mobile smoke artifact is attached but did not pass.']
      : []

  if (status === 'missing') {
    return [...renderedSuggestion, ...smokeSuggestions, entry.nextAction]
  }

  if (smokeSuggestions.length > 0) {
    return smokeSuggestions
  }

  return []
}

function launchSmokeCategories(report: LaunchSmokeReport | null | undefined) {
  return report?.categories
    .filter((category) => category.ok)
    .map((category) => category.category) ?? []
}

function countStatus(
  journeys: LaunchReadinessJourneyReport[],
  status: Phase11SmokeStatus,
) {
  return journeys.filter((journey) => journey.status === status).length
}

function buildSummary(
  journeys: LaunchReadinessJourneyReport[],
  providerProofChecklist: LaunchReadinessProviderProof[],
): LaunchReadinessSummary {
  const missing = countStatus(journeys, 'missing')
  const partial = countStatus(journeys, 'partial')
  const blockedProviderProofs = providerProofChecklist.filter(
    (proof) => proof.status === 'blocked',
  ).length
  const blocked = missing + blockedProviderProofs
  const covered = countStatus(journeys, 'covered')

  return {
    total: journeys.length,
    covered,
    partial,
    missing,
    blocked,
    ready: partial === 0 && missing === 0 && blockedProviderProofs === 0,
  }
}

export function buildLaunchReadinessReport(
  input: LaunchReadinessReportInput = {},
): LaunchReadinessReport {
  const generatedAt = input.generatedAt ?? new Date()
  const composedSmokes = input.composedSmokes ?? {}
  const renderedMobileSmoke = input.renderedMobileSmoke ?? null
  const launchCategories = launchSmokeCategories(input.launchSmokeReport)

  const journeys = PHASE_11_SMOKE_MANIFEST.map((entry) => {
    const composedProof = composedSmokes[entry.id]
    const smokeProof = summarizeSmokeProof(composedProof)
    const renderedProof =
      entry.id === 'mobile-final-responsive'
        ? renderedProofSummary(renderedMobileSmoke)
        : null
    const status = journeyStatus(entry, smokeProof, renderedProof)

    return {
      id: entry.id,
      label: entry.label,
      status,
      evidenceFiles: entry.evidenceFiles,
      safeSmokeCommand: entry.safeSmokeCommand,
      defaultProviderActions: entry.defaultProviderActions,
      nextAction: entry.nextAction,
      smokeProof,
      renderedProof,
      launchSmokeCategories: launchCategories,
      blockedItems: blockedItemsForJourney(
        status,
        entry,
        composedProof,
        renderedMobileSmoke,
      ),
    }
  })

  const providerProofChecklist = input.providerProofChecklist ?? []
  const summary = buildSummary(journeys, providerProofChecklist)

  return {
    generatedAt: generatedAt.toISOString(),
    target: input.target ?? input.launchSmokeReport?.target ?? 'local',
    ok: summary.ready,
    safeByDefault: true,
    summary,
    providerActions: PROVIDER_ACTIONS,
    journeys,
    providerProofChecklist,
  }
}

export async function writeLaunchReadinessReport(
  report: LaunchReadinessReport,
  options: WriteLaunchReadinessReportOptions = {},
): Promise<string> {
  const outputDir =
    options.outputDir ?? path.join('.local', 'launch-readiness-results')
  await mkdir(outputDir, { recursive: true })
  const safeTimestamp = report.generatedAt.replace(/[:.]/g, '-')
  const outputPath = path.join(
    outputDir,
    `launch-readiness-${report.target}-${safeTimestamp}.json`,
  )
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  return outputPath
}

function readRequiredValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1]
  if (!value || value.startsWith('--')) {
    throw new Error(`${flag} requires a value`)
  }
  return value
}

export function parseLaunchReadinessReportArgs(
  args: string[],
): ParsedLaunchReadinessReportArgs {
  const parsed: ParsedLaunchReadinessReportArgs = {
    target: null,
    json: false,
    writeReport: false,
    launchSmokeReportPath: null,
    onboardingReportPath: null,
    liveShowReportPath: null,
    dashboardNicNacReportPath: null,
    cancellationReportPath: null,
    multiRepIsolationReportPath: null,
    renderedMobileReportPath: null,
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    switch (arg) {
      case '--target': {
        const target = readRequiredValue(args, index, arg)
        if (target !== 'local' && target !== 'preview') {
          throw new Error('--target must be one of: local, preview')
        }
        parsed.target = target
        index += 1
        break
      }
      case '--launch-smoke-report':
        parsed.launchSmokeReportPath = readRequiredValue(args, index, arg)
        index += 1
        break
      case '--onboarding-report':
        parsed.onboardingReportPath = readRequiredValue(args, index, arg)
        index += 1
        break
      case '--live-show-report':
        parsed.liveShowReportPath = readRequiredValue(args, index, arg)
        index += 1
        break
      case '--dashboard-nic-nac-report':
        parsed.dashboardNicNacReportPath = readRequiredValue(args, index, arg)
        index += 1
        break
      case '--cancellation-report':
        parsed.cancellationReportPath = readRequiredValue(args, index, arg)
        index += 1
        break
      case '--multi-rep-isolation-report':
        parsed.multiRepIsolationReportPath = readRequiredValue(args, index, arg)
        index += 1
        break
      case '--rendered-mobile-report':
        parsed.renderedMobileReportPath = readRequiredValue(args, index, arg)
        index += 1
        break
      case '--write-report':
        parsed.writeReport = true
        break
      case '--json':
        parsed.json = true
        break
      default:
        throw new Error(`Unknown launch readiness report option: ${arg}`)
    }
  }

  return parsed
}

async function readJsonArtifact<T>(artifactPath: string): Promise<T> {
  return JSON.parse(await readFile(artifactPath, 'utf8')) as T
}

async function readComposedSmoke(
  artifactPath: string | null | undefined,
): Promise<ComposedSmokeProof | null> {
  if (!artifactPath) return null
  return {
    artifactPath,
    report: await readJsonArtifact<ComposedSmokeReport>(artifactPath),
  }
}

async function readRenderedMobileSmoke(
  artifactPath: string | null | undefined,
): Promise<LaunchReadinessRenderedMobileSmoke | null> {
  if (!artifactPath) return null
  const report =
    await readJsonArtifact<Partial<LaunchReadinessRenderedMobileSmoke>>(
      artifactPath,
    )

  return {
    ok: report.ok === true,
    artifactPath: report.artifactPath ?? artifactPath,
    routes: report.routes ?? [],
  }
}

export async function runLaunchReadinessReportFromArtifacts(
  options: LaunchReadinessReportArtifactOptions,
): Promise<LaunchReadinessReportRunResult> {
  const [
    launchSmokeReport,
    onboardingSmoke,
    liveShowSmoke,
    dashboardNicNacSmoke,
    cancellationSmoke,
    multiRepIsolationSmoke,
    renderedMobileSmoke,
  ] = await Promise.all([
    options.launchSmokeReportPath
      ? readJsonArtifact<LaunchSmokeReport>(options.launchSmokeReportPath)
      : Promise.resolve(null),
    readComposedSmoke(options.onboardingReportPath),
    readComposedSmoke(options.liveShowReportPath),
    readComposedSmoke(options.dashboardNicNacReportPath),
    readComposedSmoke(options.cancellationReportPath),
    readComposedSmoke(options.multiRepIsolationReportPath),
    readRenderedMobileSmoke(options.renderedMobileReportPath),
  ])

  const composedSmokes: LaunchReadinessComposedSmokes = {}
  if (onboardingSmoke) composedSmokes.onboarding = onboardingSmoke
  if (liveShowSmoke) composedSmokes['live-show'] = liveShowSmoke
  if (dashboardNicNacSmoke) {
    composedSmokes['dashboard-nic-nac'] = dashboardNicNacSmoke
  }
  if (cancellationSmoke) composedSmokes.cancellation = cancellationSmoke
  if (multiRepIsolationSmoke) {
    composedSmokes['multi-rep-isolation'] = multiRepIsolationSmoke
  }

  const report = buildLaunchReadinessReport({
    generatedAt: options.generatedAt,
    target: options.target,
    launchSmokeReport,
    composedSmokes,
    renderedMobileSmoke,
    providerProofChecklist: options.providerProofChecklist,
  })
  const outputPath = options.writeReport
    ? await writeLaunchReadinessReport(report, { outputDir: options.outputDir })
    : null

  return {
    report,
    outputPath,
  }
}

export function formatLaunchReadinessReportText(
  report: LaunchReadinessReport,
): string {
  const lines = [
    `[launch-readiness] target=${report.target} ready=${String(report.summary.ready)} covered=${report.summary.covered} partial=${report.summary.partial} missing=${report.summary.missing} blocked=${report.summary.blocked}`,
    '[launch-readiness] journeys:',
  ]

  for (const journey of report.journeys) {
    lines.push(`  - ${journey.status} ${journey.label}`)
    if (journey.smokeProof) {
      lines.push(
        `    smoke=${journey.smokeProof.ok ? 'ok' : 'fail'} steps=${journey.smokeProof.stepCount} artifact=${journey.smokeProof.artifactPath}`,
      )
    }
    if (journey.renderedProof) {
      lines.push(
        `    rendered=${journey.renderedProof.ok ? 'ok' : 'fail'} routes=${journey.renderedProof.routeCount} artifact=${journey.renderedProof.artifactPath}`,
      )
    }
    for (const blockedItem of journey.blockedItems) {
      lines.push(`    next=${blockedItem}`)
    }
  }

  if (report.providerProofChecklist.length > 0) {
    lines.push('[launch-readiness] provider proof checklist:')
    for (const proof of report.providerProofChecklist) {
      lines.push(
        `  - ${proof.status} ${proof.label} gate=${proof.approvalGate} default=${proof.defaultAction}`,
      )
    }
  }

  lines.push('provider_actions=none')
  return lines.join('\n')
}
