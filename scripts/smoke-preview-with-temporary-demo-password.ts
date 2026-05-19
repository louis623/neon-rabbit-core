import { randomBytes } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { config } from 'dotenv'

import {
  buildDemoSeedPlan,
  seedDemoRep,
  type DemoSeedPlan,
  type DemoSeedResult,
} from '@/scripts/seed-demo-rep'
import {
  runLaunchSmoke,
  writeLaunchSmokeReport,
  type LaunchSmokeOptions,
  type LaunchSmokeReport,
} from '@/scripts/smoke-demo-readiness'

const DEFAULT_DEMO_REP_EMAIL = 'louis+sparkle-demo@neonrabbit.net'

type MutableEnv = Record<string, string | undefined>

export interface PreviewSmokeWithTemporaryPasswordResult {
  ok: boolean
  target: string
  email: string
  temporaryPasswordRotated: true
  reportPath: string
  categories: LaunchSmokeReport['categories']
}

export interface PreviewSmokeWithTemporaryPasswordDependencies {
  seedDemoRep?: (plan: DemoSeedPlan) => Promise<DemoSeedResult>
  runLaunchSmoke?: (
    options: LaunchSmokeOptions,
    env: MutableEnv,
  ) => Promise<LaunchSmokeReport>
  writeLaunchSmokeReport?: (report: LaunchSmokeReport) => Promise<string>
}

interface ParsedArgs {
  target?: string
}

export function generateTemporaryDemoPassword(
  randomBytesImpl: typeof randomBytes = randomBytes,
) {
  const entropy = randomBytesImpl(24).toString('base64url')
  return `Ss-${entropy}-9aA!`
}

function parseArgs(args: string[]): ParsedArgs {
  const parsed: ParsedArgs = {}

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--target' || arg === '--url') {
      parsed.target = args[index + 1]
      index += 1
      continue
    }
    if (arg.startsWith('--target=')) {
      parsed.target = arg.slice('--target='.length)
      continue
    }
    if (arg.startsWith('--url=')) {
      parsed.target = arg.slice('--url='.length)
    }
  }

  return parsed
}

function restoreEnv(
  env: MutableEnv,
  snapshot: Pick<MutableEnv, 'DEMO_REP_EMAIL' | 'DEMO_REP_PASSWORD' | 'NEXT_PUBLIC_APP_URL'>,
) {
  for (const name of ['DEMO_REP_EMAIL', 'DEMO_REP_PASSWORD', 'NEXT_PUBLIC_APP_URL'] as const) {
    if (snapshot[name] === undefined) {
      delete env[name]
    } else {
      env[name] = snapshot[name]
    }
  }
}

export async function runPreviewSmokeWithTemporaryDemoPassword(input: {
  target?: string
  env?: MutableEnv
  dependencies?: PreviewSmokeWithTemporaryPasswordDependencies
}) {
  const env = input.env ?? process.env
  const target = input.target?.trim() || env.NEXT_PUBLIC_APP_URL?.trim()
  if (!target) {
    throw new Error(
      'Preview target is required. Set NEXT_PUBLIC_APP_URL or pass --target https://...',
    )
  }

  const email = env.DEMO_REP_EMAIL?.trim().toLowerCase() || DEFAULT_DEMO_REP_EMAIL
  const temporaryPassword = generateTemporaryDemoPassword()
  const snapshot = {
    DEMO_REP_EMAIL: env.DEMO_REP_EMAIL,
    DEMO_REP_PASSWORD: env.DEMO_REP_PASSWORD,
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
  }

  const seed = input.dependencies?.seedDemoRep ?? seedDemoRep
  const launchSmoke = input.dependencies?.runLaunchSmoke ?? runLaunchSmoke
  const writeReport =
    input.dependencies?.writeLaunchSmokeReport ?? writeLaunchSmokeReport

  try {
    env.DEMO_REP_EMAIL = email
    env.DEMO_REP_PASSWORD = temporaryPassword
    env.NEXT_PUBLIC_APP_URL = target

    await seed(buildDemoSeedPlan({ email }))

    const report = await launchSmoke(
      {
        target: 'preview',
        categories: ['protected_preview_routes'],
        json: true,
        writeReport: true,
      },
      env,
    )
    const reportPath = await writeReport(report)

    return {
      ok: report.ok,
      target,
      email,
      temporaryPasswordRotated: true,
      reportPath,
      categories: report.categories,
    } satisfies PreviewSmokeWithTemporaryPasswordResult
  } finally {
    restoreEnv(env, snapshot)
  }
}

async function main() {
  config({ path: '.env.local', quiet: true })
  const args = parseArgs(process.argv.slice(2))
  const result = await runPreviewSmokeWithTemporaryDemoPassword({
    target: args.target,
  })
  console.log(JSON.stringify(result, null, 2))
  if (!result.ok) {
    process.exitCode = 1
  }
}

const entrypoint = process.argv[1] ? path.resolve(process.argv[1]) : null
if (entrypoint === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(
      `[smoke:preview:temp-demo-password] ${error instanceof Error ? error.message : String(error)}`,
    )
    process.exitCode = 1
  })
}
