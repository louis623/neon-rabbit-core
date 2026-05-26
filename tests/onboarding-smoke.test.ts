import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import {
  runOnboardingSmoke,
  writeOnboardingSmokeReport,
} from '@/lib/launch-readiness/onboarding-smoke'

describe('provider-free onboarding smoke', () => {
  it('walks intake, setup profile, gates, checks, and launch-build readiness without provider actions', async () => {
    const saveIntake = vi.fn(async () => ({
      intakeId: 'intake-1',
      waitlistId: 'waitlist-1',
      handoffStatus: 'intake_received',
    }))
    const saveSetupProfile = vi.fn(async () => ({
      setupProfileId: 'setup-1',
      launchBuildId: 'build-1',
      status: 'ready',
    }))
    const markPaymentGateReady = vi.fn(async () => ({
      gateKey: 'payment',
      status: 'ready',
      mode: 'test',
    }) as const)
    const markAgreementGateReady = vi.fn(async () => ({
      gateKey: 'agreement',
      status: 'ready',
      mode: 'sandbox',
    }) as const)
    const markLaunchChecksPassed = vi.fn(async () => ({
      passed: 4,
      total: 4,
      status: 'passed',
    }))
    const loadLaunchBuildReadiness = vi.fn(async () => ({
      launchBuildId: 'build-1',
      stage: 'ready_for_launch',
      status: 'ready',
      blockers: [],
    }))

    const report = await runOnboardingSmoke({
      leadEmail: 'demo@example.com',
      now: new Date('2026-05-26T18:00:00.000Z'),
      dependencies: {
        saveIntake,
        saveSetupProfile,
        markPaymentGateReady,
        markAgreementGateReady,
        markLaunchChecksPassed,
        loadLaunchBuildReadiness,
      },
    })

    expect(report.ok).toBe(true)
    expect(report.onboardingState).toBe('ready')
    expect(report.steps.map((step) => step.id)).toEqual([
      'intake_submission',
      'setup_profile',
      'payment_gate',
      'agreement_gate',
      'launch_checks',
      'launch_build_ready',
    ])
    expect(report.steps.every((step) => step.providerAction === false)).toBe(true)
    expect(report.providerActions).toEqual({
      sendSms: false,
      sendEmail: false,
      sendSignWellLiveAgreement: false,
      chargeStripe: false,
      callPaidNicNac: false,
      attachReservedPhone: false,
    })
    expect(saveIntake).toHaveBeenCalledWith({
      leadEmail: 'demo@example.com',
      now: new Date('2026-05-26T18:00:00.000Z'),
      providerFree: true,
    })
    expect(saveSetupProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        intakeId: 'intake-1',
        waitlistId: 'waitlist-1',
        providerFree: true,
      }),
    )
    expect(loadLaunchBuildReadiness).toHaveBeenCalledWith(
      expect.objectContaining({
        providerFree: true,
        launchBuildId: 'build-1',
      }),
    )
  })

  it('reports blocked onboarding when a required gate is not ready', async () => {
    const report = await runOnboardingSmoke({
      leadEmail: 'demo@example.com',
      dependencies: {
        markPaymentGateReady: async () => ({
          gateKey: 'payment',
          status: 'disabled',
          mode: 'test',
        } as const),
      },
    })

    expect(report.ok).toBe(false)
    expect(report.onboardingState).toBe('blocked')
    expect(report.steps.find((step) => step.id === 'payment_gate')).toMatchObject({
      ok: false,
      details: {
        status: 'disabled',
      },
    })
    expect(report.nextEvidenceSuggestions).toContain(
      'Rerun onboarding smoke after every setup, gate, check, and launch-build step is ready.',
    )
  })

  it('writes a local launch-readiness artifact', async () => {
    const outputDir = await mkdtemp(join(tmpdir(), 'onboarding-smoke-'))

    try {
      const report = await runOnboardingSmoke({
        leadEmail: 'demo@example.com',
        now: new Date('2026-05-26T18:00:00.000Z'),
      })

      const outputPath = await writeOnboardingSmokeReport(report, { outputDir })
      const artifact = JSON.parse(await readFile(outputPath, 'utf8')) as {
        ok: boolean
        artifactPath: string
      }

      expect(outputPath).toContain('onboarding-local-2026-05-26T18-00-00-000Z.json')
      expect(artifact.ok).toBe(true)
      expect(artifact.artifactPath).toBe(outputPath)
    } finally {
      await rm(outputDir, { recursive: true, force: true })
    }
  })
})
