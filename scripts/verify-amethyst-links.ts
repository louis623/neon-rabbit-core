import { spawnSync } from 'node:child_process'
import { createServer } from 'node:net'
import { buildAmethystLinkChecks } from '@/lib/amethyst/link-verification'

const DEFAULT_LOCAL_PORT = 3001
const PRODUCTION_BASE_URL = 'https://sparkle-suite.vercel.app'
const INCLUDE_PRODUCTION = process.env.AMETHYST_VERIFY_PRODUCTION === '1'

function sleep(ms: number) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms))
}

async function fetchWithRetry(url: string, attempts: number) {
  let lastError: unknown = null

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fetch(url, { redirect: 'follow' })
    } catch (error) {
      lastError = error
      await sleep(1000)
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unknown fetch error')
}

async function hasExpectedLocalAmethystRoute(port: number) {
  try {
    const response = await fetch(
      `http://localhost:${port}/amethyst/Homepage.html`,
      { redirect: 'follow' },
    )
    return response.ok
  } catch {
    return false
  }
}

async function hasAnyLocalHttpServer(port: number) {
  try {
    await fetch(`http://localhost:${port}/`, { redirect: 'manual' })
    return true
  } catch {
    return false
  }
}

function canListenOnPort(port: number) {
  return new Promise<boolean>((resolvePromise) => {
    const server = createServer()
    server.once('error', () => resolvePromise(false))
    server.once('listening', () => {
      server.close(() => resolvePromise(true))
    })
    server.listen(port, 'localhost')
  })
}

async function chooseLocalPort() {
  const configuredPort = Number.parseInt(
    process.env.AMETHYST_DEV_PORT ?? '',
    10,
  )
  if (Number.isFinite(configuredPort)) return configuredPort

  for (let port = DEFAULT_LOCAL_PORT; port < DEFAULT_LOCAL_PORT + 10; port += 1) {
    if (await hasExpectedLocalAmethystRoute(port)) return port
    if (await hasAnyLocalHttpServer(port)) continue
    if (await canListenOnPort(port)) return port
  }

  return DEFAULT_LOCAL_PORT
}

async function main() {
  let hasFailure = false
  const localPort = await chooseLocalPort()
  const localBaseUrl = `http://localhost:${localPort}`

  const ensureResult = spawnSync(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['run', 'ensure:amethyst-dev'],
    {
      cwd: process.cwd(),
      env: { ...process.env, AMETHYST_DEV_PORT: String(localPort) },
      stdio: 'inherit',
    },
  )

  if (ensureResult.status && ensureResult.status !== 0) {
    hasFailure = true
  }

  if (!INCLUDE_PRODUCTION) {
    console.log(
      '[INFO] Skipping production Amethyst links. Set AMETHYST_VERIFY_PRODUCTION=1 to include deployed URLs.',
    )
  }

  const checks = buildAmethystLinkChecks({
    includeProduction: INCLUDE_PRODUCTION,
    localBaseUrl,
    productionBaseUrl: PRODUCTION_BASE_URL,
  })

  for (const check of checks) {
    try {
      const response = await fetchWithRetry(
        check.url,
        check.label.startsWith('Local') ? 3 : 1,
      )

      if (!response.ok) {
        hasFailure = true
      }

      console.log(
        `[${response.ok ? 'OK' : 'FAIL'}] ${check.label}: ${response.status} ${check.url}`,
      )
    } catch (error) {
      hasFailure = true
      const message =
        error instanceof Error ? error.message : 'Unknown fetch error'
      console.log(`[FAIL] ${check.label}: ${message} ${check.url}`)
    }
  }

  if (hasFailure) {
    process.exitCode = 1
  }
}

void main()
