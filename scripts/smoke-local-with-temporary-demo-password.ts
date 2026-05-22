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
  type DemoSmokeCategory,
  type LaunchSmokeOptions,
  type LaunchSmokeReport,
} from '@/scripts/smoke-demo-readiness'
import { generateTemporaryDemoPassword } from '@/scripts/smoke-preview-with-temporary-demo-password'

const DEFAULT_LOCAL_DEMO_REP_EMAIL = 'louis+sparkle-demo@neonrabbit.net'
const DEFAULT_LOCAL_APP_URL = 'http://localhost:3000'
const LOCAL_TEMP_DEMO_SMOKE_CATEGORIES = [
  'local_static',
  'supabase_demo',
  'local_app',
  'stripe_test',
  'stripe_local_routes',
  'stripe_webhook_local_signature',
  'signwell_sandbox',
] as const satisfies readonly DemoSmokeCategory[]

type MutableEnv = Record<string, string | undefined>

export interface LocalSmokeWithTemporaryPasswordResult {
  ok: boolean
  target: string
  email: string
  temporaryPasswordRotated: true
  reportPath: string
  categories: LaunchSmokeReport['categories']
}

export interface LocalSmokeWithTemporaryPasswordDependencies {
  seedDemoRep?: (plan: DemoSeedPlan) => Promise<DemoSeedResult>
  runLaunchSmoke?: (
    options: LaunchSmokeOptions,
    env: MutableEnv,
  ) => Promise<LaunchSmokeReport>
  writeLaunchSmokeReport?: (report: LaunchSmokeReport) => Promise<string>
}

function restoreEnv(
  env: MutableEnv,
  snapshot: Pick<
    MutableEnv,
    'DEMO_REP_EMAIL' | 'DEMO_REP_PASSWORD' | 'NEXT_PUBLIC_LOCAL_APP_URL'
  >,
) {
  for (const name of [
    'DEMO_REP_EMAIL',
    'DEMO_REP_PASSWORD',
    'NEXT_PUBLIC_LOCAL_APP_URL',
  ] as const) {
    if (snapshot[name] === undefined) {
      delete env[name]
    } else {
      env[name] = snapshot[name]
    }
  }
}

export async function runLocalSmokeWithTemporaryDemoPassword(input: {
  env?: MutableEnv
  dependencies?: LocalSmokeWithTemporaryPasswordDependencies
} = {}) {
  const env = input.env ?? process.env
  const target =
    env.NEXT_PUBLIC_LOCAL_APP_URL?.trim() || DEFAULT_LOCAL_APP_URL
  const email =
    env.DEMO_REP_EMAIL?.trim().toLowerCase() || DEFAULT_LOCAL_DEMO_REP_EMAIL
  const temporaryPassword = generateTemporaryDemoPassword()
  const snapshot = {
    DEMO_REP_EMAIL: env.DEMO_REP_EMAIL,
    DEMO_REP_PASSWORD: env.DEMO_REP_PASSWORD,
    NEXT_PUBLIC_LOCAL_APP_URL: env.NEXT_PUBLIC_LOCAL_APP_URL,
  }
  const seed = input.dependencies?.seedDemoRep ?? seedDemoRep
  const launchSmoke = input.dependencies?.runLaunchSmoke ?? runLaunchSmoke
  const writeReport =
    input.dependencies?.writeLaunchSmokeReport ?? writeLaunchSmokeReport

  try {
    env.DEMO_REP_EMAIL = email
    env.DEMO_REP_PASSWORD = temporaryPassword
    env.NEXT_PUBLIC_LOCAL_APP_URL = target

    await seed(buildDemoSeedPlan({ email }))

    const report = await launchSmoke(
      {
        target: 'local',
        categories: [...LOCAL_TEMP_DEMO_SMOKE_CATEGORIES],
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
    } satisfies LocalSmokeWithTemporaryPasswordResult
  } finally {
    restoreEnv(env, snapshot)
  }
}

async function main() {
  config({ path: '.env.local', quiet: true })
  const result = await runLocalSmokeWithTemporaryDemoPassword()
  console.log(JSON.stringify(result, null, 2))

  if (!result.ok) {
    process.exitCode = 1
  }
}

const entrypoint = process.argv[1] ? path.resolve(process.argv[1]) : null
if (entrypoint === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(
      `[smoke:local:temp-demo-password] ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
    process.exitCode = 1
  })
}
