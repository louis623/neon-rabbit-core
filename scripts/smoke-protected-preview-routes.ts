import { execFile } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

import { DEFAULT_DEMO_PASSWORD } from '@/scripts/seed-demo-rep'

const execFileAsync = promisify(execFile)

type JsonObject = Record<string, unknown>

type VercelCurlArgsInput = {
  routePath: string
  deployment: string
  curlConfigPath: string
  curlArgs?: string[]
}

type StripeUrlValidationInput = {
  payload: JsonObject
  host: string
  routeLabel: string
}

export function getNpxExecutable(platform = process.platform) {
  return platform === 'win32' ? 'npx.cmd' : 'npx'
}

function quotePowerShellArg(value: string) {
  return `'${value.replace(/'/g, "''")}'`
}

export function buildVercelCurlArgs({
  routePath,
  deployment,
  curlConfigPath,
  curlArgs = [],
}: VercelCurlArgsInput): string[] {
  return [
    'vercel',
    'curl',
    routePath,
    '--deployment',
    deployment,
    '--',
    '--silent',
    '--show-error',
    '--location',
    '--config',
    curlConfigPath,
    ...curlArgs,
  ]
}

export function parseJsonObject(text: string, routeLabel: string): JsonObject {
  const parsed = JSON.parse(text) as unknown
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${routeLabel} did not return a JSON object.`)
  }
  return parsed as JsonObject
}

export function validateStripeUrl({
  payload,
  host,
  routeLabel,
}: StripeUrlValidationInput): boolean {
  const rawUrl = typeof payload.url === 'string' ? payload.url : ''
  if (!rawUrl) {
    throw new Error(`${routeLabel} route did not return a Stripe URL.`)
  }

  const parsed = new URL(rawUrl)
  if (parsed.hostname !== host) {
    throw new Error(`${routeLabel} route returned an unexpected Stripe host.`)
  }

  return true
}

async function createDemoSessionCookie(env: Record<string, string | undefined>) {
  const email = env.DEMO_REP_EMAIL
  const password = env.DEMO_REP_PASSWORD || DEFAULT_DEMO_PASSWORD
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!email) throw new Error('DEMO_REP_EMAIL is required.')
  if (!supabaseUrl || !anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.')
  }

  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`preview route smoke sign-in failed: ${error.message}`)

  const {
    data: { session },
  } = await client.auth.getSession()
  if (!session) throw new Error('preview route smoke did not create a Supabase session.')

  const supabaseRef = new URL(supabaseUrl).hostname.split('.')[0]
  return {
    cookie: `sb-${supabaseRef}-auth-token=${encodeURIComponent(JSON.stringify(session))}`,
    email,
  }
}

async function withCurlConfig<T>(cookie: string, run: (configPath: string) => Promise<T>) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'sparkle-preview-smoke-'))
  const configPath = path.join(tempDir, 'curl.cfg')
  await writeFile(configPath, `header = "cookie: ${cookie}"\n`, 'utf8')

  try {
    return await run(configPath)
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}

async function runVercelCurl(
  routePath: string,
  deployment: string,
  curlConfigPath: string,
  curlArgs: string[] = [],
) {
  const args = buildVercelCurlArgs({
    routePath,
    deployment,
    curlConfigPath,
    curlArgs,
  })
  const { stdout } =
    process.platform === 'win32'
      ? await execFileAsync(
          'C:/WINDOWS/System32/WindowsPowerShell/v1.0/powershell.exe',
          ['-NoProfile', '-Command', `npx ${args.map(quotePowerShellArg).join(' ')}`],
          { maxBuffer: 1024 * 1024 * 5 },
        )
      : await execFileAsync(getNpxExecutable(), args, {
          maxBuffer: 1024 * 1024 * 5,
        })
  return stdout
}

export async function runProtectedPreviewRouteSmoke(
  env: Record<string, string | undefined> = process.env,
) {
  const deployment = env.NEXT_PUBLIC_APP_URL
  if (!deployment) throw new Error('NEXT_PUBLIC_APP_URL must be the protected preview URL.')

  const { cookie, email } = await createDemoSessionCookie(env)

  return await withCurlConfig(cookie, async (curlConfigPath) => {
    const me = parseJsonObject(
      await runVercelCurl('/api/nic-nac/me', deployment, curlConfigPath),
      '/api/nic-nac/me',
    ) as { rep?: { email?: string; display_name?: string } }
    if (me.rep?.email !== email) {
      throw new Error('/api/nic-nac/me did not return the demo rep.')
    }

    const shell = await runVercelCurl('/nic-nac', deployment, curlConfigPath)
    if (!shell.includes('Nic-Nac')) {
      throw new Error('/nic-nac did not render the Nic-Nac shell.')
    }

    const checkout = parseJsonObject(
      await runVercelCurl('/api/stripe/create-checkout', deployment, curlConfigPath, [
        '--request',
        'POST',
        '--header',
        'content-type: application/json',
        '--data',
        JSON.stringify({ planType: 'monthly' }),
      ]),
      '/api/stripe/create-checkout',
    )
    validateStripeUrl({
      payload: checkout,
      host: 'checkout.stripe.com',
      routeLabel: 'checkout',
    })

    const portal = parseJsonObject(
      await runVercelCurl('/api/stripe/create-portal-session', deployment, curlConfigPath, [
        '--request',
        'POST',
      ]),
      '/api/stripe/create-portal-session',
    )
    validateStripeUrl({
      payload: portal,
      host: 'billing.stripe.com',
      routeLabel: 'portal',
    })

    return {
      ok: true,
      target: deployment,
      rep: me.rep?.display_name ?? 'unknown rep',
      shell: true,
      checkout: true,
      portal: true,
    }
  })
}

async function main() {
  config({ path: '.env.local', quiet: true })
  const result = await runProtectedPreviewRouteSmoke()
  console.log(JSON.stringify(result, null, 2))
}

const entrypoint = process.argv[1] ? path.resolve(process.argv[1]) : null
if (entrypoint === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(
      `[smoke:preview:vercel-curl] ${error instanceof Error ? error.message : String(error)}`,
    )
    process.exitCode = 1
  })
}
