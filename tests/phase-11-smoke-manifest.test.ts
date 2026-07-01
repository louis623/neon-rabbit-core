import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  PHASE_11_JOURNEY_IDS,
  PHASE_11_SMOKE_MANIFEST,
  PHASE_11_SMOKE_STATUSES,
} from '@/lib/launch-readiness/phase-11-smoke-manifest'

const EXPECTED_PHASE_11_JOURNEYS = [
  'onboarding',
  'daily-workflow',
  'live-show',
  'post-show',
  'dashboard-nic-nac',
  'cancellation',
  'multi-rep-isolation',
  'error-recovery',
  'mobile-final-responsive',
] as const

const UNSAFE_DEFAULT_ACTION_PATTERNS = [
  /live[_:-]?preflight/i,
  /live[_:-]?send/i,
  /provider[_:-]?sandbox/i,
  /provider[_:-]?call/i,
  /nic[_-]nac[_:-]?paid/i,
  /STRIPE_LIVE/i,
  /SIGNWELL_ALLOW_LIVE_SEND/i,
  /SPARKLE_PRE_SHOW_SMS_ENABLED\s*=\s*true/i,
  /TELNYX_API_KEY/i,
  /RESEND_API_KEY/i,
]

describe('Phase 11 smoke manifest', () => {
  it('defines exactly the nine HQ launch-readiness journeys in order', () => {
    expect(PHASE_11_JOURNEY_IDS).toEqual(EXPECTED_PHASE_11_JOURNEYS)
    expect(PHASE_11_SMOKE_MANIFEST.map((journey) => journey.id)).toEqual(
      EXPECTED_PHASE_11_JOURNEYS,
    )
  })

  it('uses only the launch-readiness status vocabulary', () => {
    for (const journey of PHASE_11_SMOKE_MANIFEST) {
      expect(PHASE_11_SMOKE_STATUSES).toContain(journey.status)
    }
  })

  it('keeps every journey tied to existing evidence files and an explicit next action', () => {
    for (const journey of PHASE_11_SMOKE_MANIFEST) {
      expect(journey.evidenceFiles.length).toBeGreaterThan(0)
      expect(journey.nextAction.trim().length).toBeGreaterThan(0)

      for (const evidenceFile of journey.evidenceFiles) {
        expect(evidenceFile).not.toContain('docs/sparkle-suite/marketing')
        expect(existsSync(resolve(process.cwd(), evidenceFile))).toBe(true)
      }
    }
  })

  it('does not include live or provider actions in default smoke commands', () => {
    for (const journey of PHASE_11_SMOKE_MANIFEST) {
      expect(journey.defaultProviderActions).toEqual([])

      if (!journey.safeSmokeCommand) continue

      for (const unsafePattern of UNSAFE_DEFAULT_ACTION_PATTERNS) {
        expect(journey.safeSmokeCommand.command).not.toMatch(unsafePattern)
      }
    }
  })

  it('keeps the rep-facing assistant named Nic-Nac', () => {
    const dashboardJourney = PHASE_11_SMOKE_MANIFEST.find(
      (journey) => journey.id === 'dashboard-nic-nac',
    )

    expect(dashboardJourney?.label).toContain('Nic-Nac')
    expect(JSON.stringify(PHASE_11_SMOKE_MANIFEST)).not.toContain('Nick-Nack')
  })

  it('tracks the Heather recipe chat replay harness in Dashboard / Nic-Nac evidence', () => {
    const dashboardJourney = PHASE_11_SMOKE_MANIFEST.find(
      (journey) => journey.id === 'dashboard-nic-nac',
    )

    expect(dashboardJourney?.evidenceFiles).toEqual(
      expect.arrayContaining([
        'scripts/smoke-nic-nac-recipe-chat.ts',
        'tests/nic-nac-recipe-builder-smoke-script.test.ts',
        'tests/nic-nac/nic-nac-calendar-route-routing-smoke.test.ts',
      ]),
    )
    expect(dashboardJourney?.nextAction).toContain(
      'npm run report:launch-readiness -- --dashboard-nic-nac-report',
    )
    expect(dashboardJourney?.nextAction).toContain(
      '.local/launch-readiness-results/bling-kitchen-recipe-chat.json',
    )
  })
})
