export const HARD_FAIL_PHRASES = [
  "I can't actually add listings",
  'Log into your workspace and add it manually',
  'The photo of the earrings needs',
  'Unboxed',
  'Plain background',
  'Packaging is too prominent',
] as const

export interface TradeBoardIntakeSmokeCase {
  id: string
  message: string
  uploads: string[]
  expect: string[]
  fail: string[]
}

export function parseTradeBoardIntakeSmokeCases(
  raw: string,
): TradeBoardIntakeSmokeCase[] {
  const cases: TradeBoardIntakeSmokeCase[] = []
  let current: TradeBoardIntakeSmokeCase | null = null
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    if (trimmed.startsWith('CASE ')) {
      current = {
        id: trimmed.slice('CASE '.length).trim(),
        message: '',
        uploads: [],
        expect: [],
        fail: [],
      }
      continue
    }
    if (trimmed === 'END') {
      if (current) cases.push(current)
      current = null
      continue
    }
    if (!current) continue
    const [key, ...rest] = trimmed.split('=')
    const value = rest.join('=').trim()
    if (key === 'message') current.message = value
    if (key === 'upload') current.uploads.push(value)
    if (key === 'expect') current.expect.push(value)
    if (key === 'fail') current.fail.push(value)
  }
  return cases
}

async function main() {
  const fixtureDir =
    process.env.SPARKLE_NIC_NAC_SMOKE_ASSETS ??
    'C:\\Users\\louis\\sparkle-suite-smoke-assets'
  console.log(
    JSON.stringify({
      ok: false,
      status: 'not_implemented_for_live_calls',
      fixtureDir,
      message:
        'Smoke harness parser is present. Live UI/API replay should be implemented after workflow state lands and fixture photos exist.',
    }),
  )
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
