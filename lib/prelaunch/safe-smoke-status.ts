import { getPrelaunchSignWellConfig } from '@/lib/prelaunch/signwell'

type EnvLike = Record<string, string | undefined>

export type PrelaunchSafeSmokeStatus = 'ready' | 'blocked' | 'guarded'

export interface PrelaunchSafeSmokeStatusItem {
  key: 'demo_account' | 'stripe_test' | 'signwell_sandbox' | 'live_actions'
  label: string
  status: PrelaunchSafeSmokeStatus
  detail: string
}

interface ActiveLaunchBuildSmokeSummary {
  leadName: string
  repId: string | null
  status: string
}

interface BuildPrelaunchSafeSmokeStatusInput {
  activeLaunchBuild: ActiveLaunchBuildSmokeSummary | null
  env?: EnvLike
}

const STRIPE_TEST_SMOKE_ENV_KEYS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_BUILD_FEE',
  'STRIPE_PRICE_FOUNDER_MONTHLY',
  'STRIPE_PRICE_STANDARD_MONTHLY',
] as const

const SIGNWELL_SANDBOX_ENV_KEYS = [
  'SIGNWELL_API_KEY',
  'SIGNWELL_API_BASE_URL',
  'SIGNWELL_TEMPLATE_ID',
] as const

function missingEnvKeys(
  env: EnvLike,
  keys: readonly string[],
) {
  return keys.filter((key) => !env[key]?.trim())
}

function buildClientAccountStatus(
  activeLaunchBuild: ActiveLaunchBuildSmokeSummary | null,
): PrelaunchSafeSmokeStatusItem {
  if (!activeLaunchBuild) {
    return {
      key: 'demo_account',
      label: 'Client account',
      status: 'blocked',
      detail: 'No active build is ready for local smoke yet.',
    }
  }

  if (activeLaunchBuild.status === 'ready' && activeLaunchBuild.repId) {
    return {
      key: 'demo_account',
      label: 'Client account',
      status: 'ready',
      detail: `${activeLaunchBuild.leadName} is connected and ready for local smoke.`,
    }
  }

  return {
    key: 'demo_account',
    label: 'Client account',
    status: 'blocked',
    detail: `${activeLaunchBuild.leadName} still has build blockers to clear before local smoke.`,
  }
}

function buildStripeTestStatus(env: EnvLike): PrelaunchSafeSmokeStatusItem {
  const missing = missingEnvKeys(env, STRIPE_TEST_SMOKE_ENV_KEYS)
  const secretKey = env.STRIPE_SECRET_KEY?.trim() ?? ''
  const isTestKey = secretKey.startsWith('sk_test_')

  if (missing.length === 0 && isTestKey) {
    return {
      key: 'stripe_test',
      label: 'Stripe test mode',
      status: 'ready',
      detail: 'Test key, webhook secret, and Sparkle Suite test prices are present.',
    }
  }

  const issues = [
    missing.length > 0 ? `Missing ${missing.join(', ')}.` : null,
    secretKey && !isTestKey ? 'STRIPE_SECRET_KEY is not a test key.' : null,
  ].filter(Boolean)

  return {
    key: 'stripe_test',
    label: 'Stripe test mode',
    status: 'blocked',
    detail: issues.join(' '),
  }
}

function buildSignWellSandboxStatus(env: EnvLike): PrelaunchSafeSmokeStatusItem {
  const missing = missingEnvKeys(env, SIGNWELL_SANDBOX_ENV_KEYS)

  if (missing.length === 0 && getPrelaunchSignWellConfig(env)) {
    return {
      key: 'signwell_sandbox',
      label: 'SignWell sandbox',
      status: 'ready',
      detail: 'Sandbox payload config is present; sending still stays disabled.',
    }
  }

  return {
    key: 'signwell_sandbox',
    label: 'SignWell sandbox',
    status: 'blocked',
    detail: `Missing ${missing.join(', ')}.`,
  }
}

export function buildPrelaunchSafeSmokeStatus({
  activeLaunchBuild,
  env = process.env,
}: BuildPrelaunchSafeSmokeStatusInput): PrelaunchSafeSmokeStatusItem[] {
  return [
    buildClientAccountStatus(activeLaunchBuild),
    buildStripeTestStatus(env),
    buildSignWellSandboxStatus(env),
    {
      key: 'live_actions',
      label: 'Live actions',
      status: 'guarded',
      detail:
        'SMS, live SignWell sends, live Stripe charges, calendar invites, and paid Nic-Nac calls stay off.',
    },
  ]
}
