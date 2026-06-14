import dotenv from 'dotenv'

import { attachMileHighFizzTenant } from '@/lib/mile-high-fizz/tenant'

function getArgValue(name: string) {
  const prefix = `--${name}=`
  const inline = process.argv.find((arg) => arg.startsWith(prefix))
  if (inline) return inline.slice(prefix.length)

  const index = process.argv.indexOf(`--${name}`)
  if (index >= 0) return process.argv[index + 1]

  return undefined
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`)
}

async function main() {
  const envPath = getArgValue('env') ?? '.env.local'
  dotenv.config({ path: envPath, override: true })

  const temporaryPassword =
    getArgValue('temporary-password') ?? process.env.MILE_HIGH_FIZZ_TEMP_PASSWORD
  const updateAuthPassword = hasFlag('update-auth-password')

  const result = await attachMileHighFizzTenant({
    temporaryPassword,
    updateAuthPassword,
  })

  console.log(
    JSON.stringify(
      {
        ...result,
        temporaryPasswordProvided: Boolean(temporaryPassword),
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
