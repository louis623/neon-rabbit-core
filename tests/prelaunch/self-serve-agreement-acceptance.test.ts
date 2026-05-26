import { describe, expect, it } from 'vitest'

import {
  buildSelfServeAgreementAcceptanceEvidence,
  getSelfServeAgreementVersion,
} from '@/lib/prelaunch/self-serve-agreement'

describe('self-serve agreement acceptance', () => {
  it('builds clickwrap evidence without requiring a provider signature flow', () => {
    const evidence = buildSelfServeAgreementAcceptanceEvidence({
      repId: 'rep-1',
      accountId: 'account-1',
      checkoutSessionId: 'cs_test_123',
      acceptedAt: new Date('2026-05-26T20:00:00.000Z'),
      ipAddress: '203.0.113.10',
      userAgent: 'Vitest Browser',
    })

    expect(evidence).toEqual({
      agreementVersion: getSelfServeAgreementVersion(),
      acceptedAt: '2026-05-26T20:00:00.000Z',
      repId: 'rep-1',
      accountId: 'account-1',
      checkoutSessionId: 'cs_test_123',
      ipAddress: '203.0.113.10',
      userAgent: 'Vitest Browser',
      provider: 'clickwrap',
      signWellRequired: false,
    })
  })

  it('trims optional identifiers and keeps unavailable request details nullable', () => {
    expect(
      buildSelfServeAgreementAcceptanceEvidence({
        repId: ' rep-1 ',
        accountId: ' account-1 ',
        checkoutSessionId: ' cs_test_123 ',
        acceptedAt: new Date('2026-05-26T20:00:00.000Z'),
      }),
    ).toMatchObject({
      repId: 'rep-1',
      accountId: 'account-1',
      checkoutSessionId: 'cs_test_123',
      ipAddress: null,
      userAgent: null,
    })
  })
})
