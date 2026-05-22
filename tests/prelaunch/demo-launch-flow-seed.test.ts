import { describe, expect, it, vi } from 'vitest'

import { seedDemoLaunchFlow } from '@/scripts/seed-demo-launch-flow'

describe('demo launch flow seed', () => {
  it('runs the guarded demo from prelaunch lead through ready-for-launch skeleton without provider sends', async () => {
    const seedDemoPrelaunch = vi.fn(async () => ({
      waitlistId: 'waitlist-1',
      launchBuildId: 'build-1',
      setupProfileId: 'setup-1',
      leadEmail: 'demo@example.com',
      leadStatus: 'start_work_ready',
      setupProfileStatus: 'ready',
    }))
    const loadDemoRepId = vi.fn(async () => 'rep-1')
    const upsertPrelaunchLaunchGate = vi.fn(async () => ({
      gateKey: 'payment',
      status: 'ready',
    }))
    const createPrelaunchAgreementDraftTracker = vi.fn(async () => ({
      id: 'agreement-1',
      launchBuildId: 'build-1',
      status: 'created',
    }))
    const recordPrelaunchAgreementSigned = vi.fn(async () => ({
      id: 'agreement-1',
      launchBuildId: 'build-1',
      status: 'signed',
    }))
    const upsertPrelaunchLaunchCheck = vi.fn(async (input) => ({
      checkKey: input.checkKey,
      status: input.status,
    }))
    const connectPrelaunchLaunchBuildToProductionRep = vi.fn(async () => ({
      id: 'build-1',
      repId: 'rep-1',
      stage: 'ready_for_launch',
      status: 'ready',
    }))

    const result = await seedDemoLaunchFlow({
      env: {
        DEMO_PRELAUNCH_SEED_CONFIRMED: 'true',
        DEMO_REP_EMAIL: 'demo-rep@example.com',
        DEMO_PRELAUNCH_LEAD_EMAIL: 'demo-lead@example.com',
      },
      dependencies: {
        seedDemoPrelaunch,
        loadDemoRepId,
        upsertPrelaunchLaunchGate,
        createPrelaunchAgreementDraftTracker,
        recordPrelaunchAgreementSigned,
        upsertPrelaunchLaunchCheck,
        connectPrelaunchLaunchBuildToProductionRep,
      },
    })

    expect(seedDemoPrelaunch).toHaveBeenCalledOnce()
    expect(loadDemoRepId).toHaveBeenCalledWith('demo-rep@example.com')
    expect(upsertPrelaunchLaunchGate).toHaveBeenCalledWith({
      launchBuildId: 'build-1',
      gateKey: 'payment',
      status: 'ready',
      notes: 'Demo payment gate marked ready in Stripe test mode only. No checkout or charge.',
    })
    expect(createPrelaunchAgreementDraftTracker).toHaveBeenCalledWith({
      launchBuildId: 'build-1',
      providerDocumentId: 'demo-sandbox-agreement',
      providerStatus: 200,
      notes: 'Demo sandbox agreement tracker. No email sent and no live agreement created.',
      env: expect.any(Object),
    })
    expect(recordPrelaunchAgreementSigned).toHaveBeenCalledWith({
      launchBuildId: 'build-1',
      signedPdfUrl: null,
      notes: 'Demo sandbox agreement signature recorded. No live SignWell send.',
    })
    expect(upsertPrelaunchLaunchCheck).toHaveBeenCalledTimes(4)
    expect(connectPrelaunchLaunchBuildToProductionRep).toHaveBeenCalledWith({
      launchBuildId: 'build-1',
      repId: 'rep-1',
      notes: 'Existing demo rep account connected after sandbox checks passed.',
    })
    expect(result).toMatchObject({
      ok: true,
      waitlistId: 'waitlist-1',
      launchBuildId: 'build-1',
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
})
