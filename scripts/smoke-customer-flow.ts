import { pathToFileURL } from 'node:url'

import { config } from 'dotenv'

import { runCustomerFlowSmoke } from '@/lib/prelaunch/customer-flow-smoke'

function formatError(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

async function main() {
  config({ path: '.env.local', quiet: true })
  const result = await runCustomerFlowSmoke()
  console.log(JSON.stringify(result, null, 2))

  if (!result.ok) {
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(formatError(error))
    process.exitCode = 1
  })
}
