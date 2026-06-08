import { describe, expect, it, vi } from 'vitest'

import {
  CUSTOMER_FLOW_SMOKE_CONFIRM_ENV,
  runCustomerFlowSmoke,
} from '@/lib/prelaunch/customer-flow-smoke'

describe('customer flow smoke', () => {
  it('drives the real customer flow services in order without provider sends', async () => {
    const calls: string[] = []
    const createWaitlistLead = vi.fn(async () => {
      calls.push('waitlist')
      return { waitlistId: 'waitlist-1' }
    })
    const advanceWaitlistLead = vi.fn(async () => {
      calls.push('outreach')
    })
    const createPrelaunchLaunchBuildDraft = vi.fn(async () => {
      calls.push('launch-build')
      return { id: 'build-1' }
    })
    const upsertPrelaunchLaunchSetupProfile = vi.fn(async () => {
      calls.push('setup-profile')
      return { id: 'setup-1' }
    })
    const upsertPrelaunchLaunchGate = vi.fn(async (input) => {
      calls.push(`gate:${input.gateKey}`)
      return { gateKey: input.gateKey }
    })
    const createPrelaunchAgreementDraftTracker = vi.fn(async () => {
      calls.push('agreement-draft')
      return { id: 'agreement-1' }
    })
    const recordPrelaunchAgreementSigned = vi.fn(async () => {
      calls.push('agreement-signed')
      return { id: 'agreement-1' }
    })
    const upsertPrelaunchLaunchCheck = vi.fn(async (input) => {
      calls.push(`check:${input.checkKey}`)
      return { checkKey: input.checkKey }
    })
    const loadRepIdByEmail = vi.fn(async () => 'rep-1')
    const connectPrelaunchLaunchBuildToProductionRep = vi.fn(async () => {
      calls.push('roster')
      return {
        id: 'build-1',
        repId: 'rep-1',
        stage: 'ready_for_launch',
        status: 'ready',
      }
    })

    const result = await runCustomerFlowSmoke({
      env: {
        [CUSTOMER_FLOW_SMOKE_CONFIRM_ENV]: 'true',
        CUSTOMER_FLOW_REP_EMAIL: 'customer@example.com',
      },
      dependencies: {
        createWaitlistLead,
        advanceWaitlistLead,
        createPrelaunchLaunchBuildDraft,
        upsertPrelaunchLaunchSetupProfile,
        upsertPrelaunchLaunchGate,
        createPrelaunchAgreementDraftTracker,
        recordPrelaunchAgreementSigned,
        upsertPrelaunchLaunchCheck,
        loadRepIdByEmail,
        connectPrelaunchLaunchBuildToProductionRep,
      },
    })

    expect(calls).toEqual([
      'waitlist',
      'outreach',
      'launch-build',
      'setup-profile',
      'gate:payment',
      'agreement-draft',
      'agreement-signed',
      'check:setup_profile_ready',
      'check:site_shell_review',
      'check:demo_account_review',
      'check:operator_final_review',
      'roster',
    ])
    expect(createWaitlistLead).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'customer@example.com',
        source: 'customer_flow_smoke',
      }),
    )
    expect(connectPrelaunchLaunchBuildToProductionRep).toHaveBeenCalledWith({
      launchBuildId: 'build-1',
      repId: 'rep-1',
      notes: 'Customer-flow smoke connected the existing account after gates and checks passed.',
    })
    expect(result).toMatchObject({
      ok: true,
      waitlistId: 'waitlist-1',
      launchBuildId: 'build-1',
      repId: 'rep-1',
      providerActions: {
        sendSms: false,
        sendEmail: false,
        sendSignWellLiveAgreement: false,
        chargeStripe: false,
        callPaidNicNac: false,
        attachReservedPhone: false,
      },
      links: {
        homepage: '/amethyst/Homepage.html',
        tradeBoard: '/amethyst/Trade.html',
        joinTeamComingSoon: 'Join Team is intentionally coming soon for launch.',
      },
    })
  })

  it('requires an explicit write confirmation', async () => {
    await expect(
      runCustomerFlowSmoke({
        env: { CUSTOMER_FLOW_REP_EMAIL: 'customer@example.com' },
        dependencies: {
          createWaitlistLead: vi.fn(),
        },
      }),
    ).rejects.toThrow(`${CUSTOMER_FLOW_SMOKE_CONFIRM_ENV}=true`)
  })

  it('refuses the real parked waitlist lead and reserved phone', async () => {
    await expect(
      runCustomerFlowSmoke({
        env: { [CUSTOMER_FLOW_SMOKE_CONFIRM_ENV]: 'true' },
        customer: {
          name: 'Kim Goforth',
          email: 'kim@example.com',
          phone: '202-555-0143',
          businessName: 'Kim Jewelry',
        },
        dependencies: { createWaitlistLead: vi.fn() },
      }),
    ).rejects.toThrow('Customer-flow smoke cannot use Kim Goforth')

    await expect(
      runCustomerFlowSmoke({
        env: { [CUSTOMER_FLOW_SMOKE_CONFIRM_ENV]: 'true' },
        customer: {
          name: 'Smoke Customer',
          email: 'smoke@example.com',
          phone: '+19044383050',
          businessName: 'Smoke Jewelry',
        },
        dependencies: { createWaitlistLead: vi.fn() },
      }),
    ).rejects.toThrow('must not be +19044383050')
  })
})
