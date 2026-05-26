import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'

import {
  runOnboardingSmoke,
  writeOnboardingSmokeReport,
} from '@/lib/launch-readiness/onboarding-smoke'

interface ParsedArgs {
  leadEmail: string
  json: boolean
  writeReport: boolean
}

function readRequiredValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1]
  if (!value || value.startsWith('--')) {
    throw new Error(`${flag} requires a value`)
  }
  return value
}

export function parseOnboardingSmokeArgs(args: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    leadEmail:
      process.env.DEMO_PRELAUNCH_LEAD_EMAIL ??
      process.env.DEMO_REP_EMAIL ??
      'provider-free-onboarding@yoursparklesuite.com',
    json: false,
    writeReport: false,
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    switch (arg) {
      case '--lead-email':
        parsed.leadEmail = readRequiredValue(args, index, arg)
        index += 1
        break
      case '--json':
        parsed.json = true
        break
      case '--write-report':
        parsed.writeReport = true
        break
      default:
        throw new Error(`Unknown onboarding smoke option: ${arg}`)
    }
  }

  return parsed
}

async function main() {
  config({ path: '.env.local', quiet: true })
  const options = parseOnboardingSmokeArgs(process.argv.slice(2))
  const report = await runOnboardingSmoke({
    leadEmail: options.leadEmail,
  })
  const outputPath = options.writeReport
    ? await writeOnboardingSmokeReport(report)
    : null

  if (options.json) {
    console.log(JSON.stringify({ ...report, artifactPath: outputPath ?? undefined }, null, 2))
  } else {
    console.log(
      `[onboarding-smoke] ok=${String(report.ok)} state=${report.onboardingState} steps=${report.steps.length}`,
    )
  }

  if (outputPath) {
    console.log(`[onboarding-smoke] wrote ${outputPath}`)
  }

  if (!report.ok) {
    process.exitCode = 1
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
