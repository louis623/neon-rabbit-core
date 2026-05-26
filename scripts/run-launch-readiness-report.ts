import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'

import {
  formatLaunchReadinessReportText,
  parseLaunchReadinessReportArgs,
  runLaunchReadinessReportFromArtifacts,
} from '@/lib/launch-readiness/launch-report-runner'

async function main() {
  config({ path: '.env.local', quiet: true })

  const options = parseLaunchReadinessReportArgs(process.argv.slice(2))
  const result = await runLaunchReadinessReportFromArtifacts(options)

  if (options.json) {
    console.log(JSON.stringify(result.report, null, 2))
  } else {
    console.log(formatLaunchReadinessReportText(result.report))
  }

  if (result.outputPath) {
    console.log(`[launch-readiness] wrote ${result.outputPath}`)
  }

  if (!result.report.ok) {
    process.exitCode = 1
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
