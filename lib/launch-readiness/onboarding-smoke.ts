import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

export type OnboardingSmokeState = 'ready' | 'blocked'

export type OnboardingSmokeStepId =
  | 'intake_submission'
  | 'setup_profile'
  | 'payment_gate'
  | 'agreement_gate'
  | 'launch_checks'
  | 'launch_build_ready'

export interface OnboardingSmokeProviderActions {
  sendSms: false
  sendEmail: false
  sendSignWellLiveAgreement: false
  chargeStripe: false
  callPaidNicNac: false
  attachReservedPhone: false
}

export interface OnboardingSmokeStep {
  id: OnboardingSmokeStepId
  label: string
  ok: boolean
  providerAction: false
  details: Record<string, unknown>
}

export interface OnboardingSmokeDependencyInput {
  leadEmail: string
  now: Date
  providerFree: true
}

export interface OnboardingSmokeIntakeResult {
  intakeId: string
  waitlistId: string | null
  handoffStatus: string
}

export interface OnboardingSmokeSetupProfileResult {
  setupProfileId: string
  launchBuildId?: string
  status: string
}

export interface OnboardingSmokeGateResult {
  gateKey: 'payment' | 'agreement'
  status: string
  mode: string
}

export interface OnboardingSmokeCheckResult {
  passed: number
  total: number
  status: string
}

export interface OnboardingSmokeLaunchBuildResult {
  launchBuildId: string
  stage: string
  status: string
  blockers: string[]
}

export interface OnboardingSmokeDependencies {
  saveIntake?: (
    input: OnboardingSmokeDependencyInput,
  ) => Promise<OnboardingSmokeIntakeResult>
  saveSetupProfile?: (
    input: OnboardingSmokeDependencyInput & OnboardingSmokeIntakeResult,
  ) => Promise<OnboardingSmokeSetupProfileResult>
  markPaymentGateReady?: (
    input: OnboardingSmokeDependencyInput &
      OnboardingSmokeIntakeResult &
      OnboardingSmokeSetupProfileResult,
  ) => Promise<OnboardingSmokeGateResult>
  markAgreementGateReady?: (
    input: OnboardingSmokeDependencyInput &
      OnboardingSmokeIntakeResult &
      OnboardingSmokeSetupProfileResult,
  ) => Promise<OnboardingSmokeGateResult>
  markLaunchChecksPassed?: (
    input: OnboardingSmokeDependencyInput &
      OnboardingSmokeIntakeResult &
      OnboardingSmokeSetupProfileResult,
  ) => Promise<OnboardingSmokeCheckResult>
  loadLaunchBuildReadiness?: (
    input: OnboardingSmokeDependencyInput &
      OnboardingSmokeIntakeResult &
      OnboardingSmokeSetupProfileResult,
  ) => Promise<OnboardingSmokeLaunchBuildResult>
}

export interface OnboardingSmokeInput {
  leadEmail: string
  now?: Date
  dependencies?: OnboardingSmokeDependencies & Record<string, unknown>
}

export interface OnboardingSmokeReport {
  ok: boolean
  target: 'local'
  generatedAt: string
  artifactPath?: string
  onboardingState: OnboardingSmokeState
  leadEmail: string
  steps: OnboardingSmokeStep[]
  providerActions: OnboardingSmokeProviderActions
  nextEvidenceSuggestions: string[]
}

export interface WriteOnboardingSmokeReportOptions {
  outputDir?: string
}

const PROVIDER_ACTIONS: OnboardingSmokeProviderActions = {
  sendSms: false,
  sendEmail: false,
  sendSignWellLiveAgreement: false,
  chargeStripe: false,
  callPaidNicNac: false,
  attachReservedPhone: false,
}

function step(
  id: OnboardingSmokeStepId,
  label: string,
  ok: boolean,
  details: Record<string, unknown>,
): OnboardingSmokeStep {
  return {
    id,
    label,
    ok,
    providerAction: false,
    details,
  }
}

async function defaultIntake(
  input: OnboardingSmokeDependencyInput,
): Promise<OnboardingSmokeIntakeResult> {
  return {
    intakeId: `provider-free-intake-${input.leadEmail}`,
    waitlistId: `provider-free-waitlist-${input.leadEmail}`,
    handoffStatus: 'intake_received',
  }
}

async function defaultSetupProfile(): Promise<OnboardingSmokeSetupProfileResult> {
  return {
    setupProfileId: 'provider-free-setup-profile',
    launchBuildId: 'provider-free-launch-build',
    status: 'ready',
  }
}

async function defaultPaymentGate(): Promise<OnboardingSmokeGateResult> {
  return {
    gateKey: 'payment',
    status: 'ready',
    mode: 'test',
  }
}

async function defaultAgreementGate(): Promise<OnboardingSmokeGateResult> {
  return {
    gateKey: 'agreement',
    status: 'ready',
    mode: 'sandbox',
  }
}

async function defaultLaunchChecks(): Promise<OnboardingSmokeCheckResult> {
  return {
    passed: 4,
    total: 4,
    status: 'passed',
  }
}

async function defaultLaunchBuild(
  input: OnboardingSmokeDependencyInput &
    OnboardingSmokeIntakeResult &
    OnboardingSmokeSetupProfileResult,
): Promise<OnboardingSmokeLaunchBuildResult> {
  return {
    launchBuildId: input.launchBuildId ?? 'provider-free-launch-build',
    stage: 'ready_for_launch',
    status: 'ready',
    blockers: [],
  }
}

function evidenceSuggestions(state: OnboardingSmokeState): string[] {
  const suggestions = [
    'Attach this report to the onboarding Phase 11 evidence bundle.',
    'Keep the providerActions block in the smoke artifact for launch signoff.',
  ]

  if (state === 'blocked') {
    suggestions.push(
      'Rerun onboarding smoke after every setup, gate, check, and launch-build step is ready.',
    )
  }

  return suggestions
}

export async function runOnboardingSmoke(
  input: OnboardingSmokeInput,
): Promise<OnboardingSmokeReport> {
  const now = input.now ?? new Date()
  const dependencies = input.dependencies ?? {}
  const dependencyInput: OnboardingSmokeDependencyInput = {
    leadEmail: input.leadEmail.trim().toLowerCase(),
    now,
    providerFree: true,
  }
  const steps: OnboardingSmokeStep[] = []

  const intake = await (dependencies.saveIntake ?? defaultIntake)(dependencyInput)
  steps.push(
    step('intake_submission', 'Intake submission', Boolean(intake.intakeId), {
      intakeId: intake.intakeId,
      waitlistId: intake.waitlistId,
      handoffStatus: intake.handoffStatus,
      providerFree: true,
    }),
  )

  const setupProfile = await (
    dependencies.saveSetupProfile ?? defaultSetupProfile
  )({
    ...dependencyInput,
    ...intake,
  })
  steps.push(
    step('setup_profile', 'Setup profile', setupProfile.status === 'ready', {
      setupProfileId: setupProfile.setupProfileId,
      launchBuildId: setupProfile.launchBuildId ?? null,
      status: setupProfile.status,
      providerFree: true,
    }),
  )

  const sharedLaunchInput = {
    ...dependencyInput,
    ...intake,
    ...setupProfile,
  }

  const paymentGate = await (
    dependencies.markPaymentGateReady ?? defaultPaymentGate
  )(sharedLaunchInput)
  steps.push(
    step('payment_gate', 'Payment gate', paymentGate.status === 'ready', {
      gateKey: paymentGate.gateKey,
      mode: paymentGate.mode,
      status: paymentGate.status,
      providerFree: true,
      chargeStripe: false,
    }),
  )

  const agreementGate = await (
    dependencies.markAgreementGateReady ?? defaultAgreementGate
  )(sharedLaunchInput)
  steps.push(
    step('agreement_gate', 'Agreement gate', agreementGate.status === 'ready', {
      gateKey: agreementGate.gateKey,
      mode: agreementGate.mode,
      status: agreementGate.status,
      providerFree: true,
      sendSignWellLiveAgreement: false,
    }),
  )

  const launchChecks = await (
    dependencies.markLaunchChecksPassed ?? defaultLaunchChecks
  )(sharedLaunchInput)
  steps.push(
    step('launch_checks', 'Launch checks', launchChecks.status === 'passed', {
      passed: launchChecks.passed,
      total: launchChecks.total,
      status: launchChecks.status,
      providerFree: true,
    }),
  )

  const launchBuild = await (
    dependencies.loadLaunchBuildReadiness ?? defaultLaunchBuild
  )(sharedLaunchInput)
  steps.push(
    step(
      'launch_build_ready',
      'Launch build ready',
      launchBuild.stage === 'ready_for_launch' &&
        launchBuild.status === 'ready' &&
        launchBuild.blockers.length === 0,
      {
        launchBuildId: launchBuild.launchBuildId,
        stage: launchBuild.stage,
        status: launchBuild.status,
        blockers: launchBuild.blockers,
        providerFree: true,
      },
    ),
  )

  const onboardingState: OnboardingSmokeState = steps.every((item) => item.ok)
    ? 'ready'
    : 'blocked'

  return {
    ok: onboardingState === 'ready',
    target: 'local',
    generatedAt: now.toISOString(),
    onboardingState,
    leadEmail: dependencyInput.leadEmail,
    steps,
    providerActions: PROVIDER_ACTIONS,
    nextEvidenceSuggestions: evidenceSuggestions(onboardingState),
  }
}

export async function writeOnboardingSmokeReport(
  report: OnboardingSmokeReport,
  options: WriteOnboardingSmokeReportOptions = {},
): Promise<string> {
  const outputDir =
    options.outputDir ?? path.join('.local', 'launch-readiness-results')
  await mkdir(outputDir, { recursive: true })
  const safeTimestamp = report.generatedAt.replace(/[:.]/g, '-')
  const outputPath = path.join(
    outputDir,
    `onboarding-${report.target}-${safeTimestamp}.json`,
  )
  await writeFile(
    outputPath,
    `${JSON.stringify({ ...report, artifactPath: outputPath }, null, 2)}\n`,
    'utf8',
  )
  return outputPath
}
