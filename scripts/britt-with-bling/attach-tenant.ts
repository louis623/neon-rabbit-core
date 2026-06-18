import dotenv from 'dotenv'

import { attachBrittWithBlingTenant } from '@/lib/britt-with-bling/tenant'

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

  const email = getArgValue('email') ?? process.env.BRITT_WITH_BLING_EMAIL
  const temporaryPassword =
    getArgValue('temporary-password') ?? process.env.BRITT_WITH_BLING_TEMP_PASSWORD
  const updateAuthPassword = hasFlag('update-auth-password')
  const replaceRoster = hasFlag('replace-roster')

  if (!email) {
    throw new Error(
      'Provide Brittany\'s email with --email or BRITT_WITH_BLING_EMAIL.',
    )
  }

  const result = await attachBrittWithBlingTenant({
    email,
    temporaryPassword,
    updateAuthPassword,
    replaceRoster,
  })

  console.log(
    JSON.stringify(
      {
        ...result,
        temporaryPasswordProvided: Boolean(temporaryPassword),
        replaceRoster,
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
