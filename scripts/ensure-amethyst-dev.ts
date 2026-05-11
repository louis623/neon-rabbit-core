import { mkdirSync, openSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { buildWindowsDetachedDevServerLaunch } from '@/lib/amethyst/dev-server-launch'

const port = Number.parseInt(process.env.AMETHYST_DEV_PORT ?? '3001', 10)
const LOCAL_URL = `http://localhost:${port}/amethyst/Homepage.html`
const MAX_ATTEMPTS = 25
const SLEEP_MS = 1000

async function isLocalUp() {
  try {
    const response = await fetch(LOCAL_URL, { redirect: 'follow' })
    return response.ok
  } catch {
    return false
  }
}

function sleep(ms: number) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms))
}

async function main() {
  if (await isLocalUp()) {
    console.log(`[OK] Local Amethyst dev already running: ${LOCAL_URL}`)
    return
  }

  const logDir = resolve(process.cwd(), '.codex-logs')
  mkdirSync(logDir, { recursive: true })
  const outPath = resolve(logDir, `sparkle-suite-dev-${port}.out.log`)
  const errPath = resolve(logDir, `sparkle-suite-dev-${port}.err.log`)

  if (process.platform === 'win32') {
    const launchSpec = buildWindowsDetachedDevServerLaunch({
      cwd: process.cwd(),
      outPath,
      errPath,
      port,
    })
    const escapedArguments = launchSpec.argumentList
      .map((value) => `'${value.replace(/'/g, "''")}'`)
      .join(', ')
    const psCommand = `Start-Process -FilePath '${launchSpec.filePath.replace(/'/g, "''")}' -ArgumentList ${escapedArguments} -WindowStyle Hidden`
    const result = spawnSync('powershell.exe', ['-NoProfile', '-Command', psCommand], {
      cwd: process.cwd(),
      stdio: 'ignore',
    })

    if (result.status && result.status !== 0) {
      console.log('[FAIL] Could not launch local Amethyst dev server via PowerShell.')
      process.exitCode = 1
      return
    }
  } else {
    const child = spawn('npm', ['run', 'dev', '--', '--port', String(port)], {
      cwd: process.cwd(),
      detached: true,
      stdio: ['ignore', openSync(outPath, 'a'), openSync(errPath, 'a')],
    })

    child.unref()
  }

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    await sleep(SLEEP_MS)
    if (await isLocalUp()) {
      console.log(`[OK] Local Amethyst dev started: ${LOCAL_URL}`)
      return
    }
  }

  console.log(
    `[FAIL] Local Amethyst dev did not come up after ${MAX_ATTEMPTS}s: ${LOCAL_URL}`,
  )
  process.exitCode = 1
}

void main()
