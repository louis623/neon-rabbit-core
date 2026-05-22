import { describe, expect, it, vi } from 'vitest'

import {
  buildDemoLaunchRunEnv,
  runDemoLaunchRun,
} from '@/lib/prelaunch/demo-launch-run'

describe('demo launch run', () => {
  it('builds a confirmed demo-only launch env without provider actions', () => {
    const env = buildDemoLaunchRunEnv({
      businessName: 'Demo Sparkle Studio',
      demoRepEmail: 'louis+demo@example.com',
      leadName: 'Demo Lead',
    })

    expect(env).toMatchObject({
      DEMO_PRELAUNCH_SEED_CONFIRMED: 'true',
      DEMO_REP_EMAIL: 'louis+demo@example.com',
      DEMO_PRELAUNCH_LEAD_EMAIL: 'louis+demo@example.com',
      DEMO_PRELAUNCH_LEAD_NAME: 'Demo Lead',
      DEMO_PRELAUNCH_BUSINESS_NAME: 'Demo Sparkle Studio',
    })
  })

  it('seeds the demo rep first and then runs the guarded launch skeleton', async () => {
    const seedDemoRep = vi.fn(async () => ({ repId: 'rep-1' }))
    const seedDemoLaunchFlow = vi.fn(async () => ({
      ok: true,
      waitlistId: 'waitlist-1',
      launchBuildId: 'build-1',
      setupProfileId: 'setup-1',
      repId: 'rep-1',
      stage: 'ready_for_launch',
      status: 'ready',
      providerActions: {
        sendSms: false as const,
        sendEmail: false as const,
        sendSignWellLiveAgreement: false as const,
        chargeStripe: false as const,
        callPaidNicNac: false as const,
        attachReservedPhone: false as const,
      },
    }))

    const result = await runDemoLaunchRun({
      businessName: 'Demo Sparkle Studio',
      demoRepEmail: 'louis+demo@example.com',
      leadName: 'Demo Lead',
      dependencies: {
        seedDemoRep,
        seedDemoLaunchFlow,
      },
    })

    expect(seedDemoRep).toHaveBeenCalledOnce()
    expect(seedDemoLaunchFlow).toHaveBeenCalledWith({
      env: expect.objectContaining({
        DEMO_PRELAUNCH_SEED_CONFIRMED: 'true',
        DEMO_REP_EMAIL: 'louis+demo@example.com',
        DEMO_PRELAUNCH_LEAD_NAME: 'Demo Lead',
        DEMO_PRELAUNCH_BUSINESS_NAME: 'Demo Sparkle Studio',
      }),
    })
    expect(result).toMatchObject({
      ok: true,
      repId: 'rep-1',
      stage: 'ready_for_launch',
      status: 'ready',
      providerActions: {
        sendSms: false,
        sendEmail: false,
        sendSignWellLiveAgreement: false,
        chargeStripe: false,
        callPaidNicNac: false,
        attachReservedPhone: false,
      },
    })
  })

  it('refuses real waitlist names for the demo run', async () => {
    await expect(
      runDemoLaunchRun({
        businessName: 'Kim Goforth Jewelry',
        demoRepEmail: 'louis+demo@example.com',
        leadName: 'Kim Goforth',
        dependencies: {
          seedDemoRep: vi.fn(),
          seedDemoLaunchFlow: vi.fn(),
        },
      }),
    ).rejects.toThrow('Demo launch runs cannot use the real waitlist lead')
  })
})
