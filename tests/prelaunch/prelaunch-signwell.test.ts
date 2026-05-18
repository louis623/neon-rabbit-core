import { describe, expect, it } from 'vitest'

import {
  buildPrelaunchSignWellAgreementPayload,
  buildPrelaunchSignWellMetadata,
  getPrelaunchSignWellLiveSendMode,
  getPrelaunchSignWellConfig,
  normalizePrelaunchAgreementGateType,
} from '@/lib/prelaunch/signwell'

describe('prelaunch SignWell agreement gate', () => {
  it('normalizes only the supported agreement gate type', () => {
    expect(normalizePrelaunchAgreementGateType('service_agreement')).toBe(
      'service_agreement',
    )
    expect(normalizePrelaunchAgreementGateType('trade_clickwrap')).toBeNull()
  })

  it('returns null until the SignWell send configuration is complete', () => {
    expect(getPrelaunchSignWellConfig({})).toBeNull()
    expect(
      getPrelaunchSignWellConfig({
        SIGNWELL_API_KEY: 'signwell_api_key',
        SIGNWELL_TEMPLATE_ID: 'template_123',
      }),
    ).toBeNull()
    expect(
      getPrelaunchSignWellConfig({
        SIGNWELL_API_KEY: 'signwell_api_key',
        SIGNWELL_TEMPLATE_ID: 'template_123',
        SIGNWELL_API_BASE_URL: 'https://www.signwell.com/api/v1',
      }),
    ).toEqual({
      apiKey: 'signwell_api_key',
      apiBaseUrl: 'https://www.signwell.com/api/v1',
      templateId: 'template_123',
    })
  })

  it('builds neutral agreement metadata without legal copy', () => {
    expect(
      buildPrelaunchSignWellMetadata({
        gateType: 'service_agreement',
        intakeId: 'intake-1',
        waitlistId: 'waitlist-1',
        operatorRepId: 'rep-1',
      }),
    ).toEqual({
      platform: 'sparkle_suite',
      agreement_gate: 'service_agreement',
      sparkle_suite_agreement_gate: 'true',
      intake_submission_id: 'intake-1',
      waitlist_id: 'waitlist-1',
      operator_rep_id: 'rep-1',
    })
  })

  it('keeps live SignWell sending disabled unless the explicit allow flag is set', () => {
    expect(getPrelaunchSignWellLiveSendMode({})).toEqual({
      allowLiveSend: false,
      mode: 'live_blocked',
    })
    expect(
      getPrelaunchSignWellLiveSendMode({
        SIGNWELL_SEND_ENABLED: 'true',
      }),
    ).toEqual({
      allowLiveSend: false,
      mode: 'live_blocked',
    })
    expect(
      getPrelaunchSignWellLiveSendMode({
        SIGNWELL_ALLOW_LIVE_SEND: 'true',
      }),
    ).toEqual({
      allowLiveSend: true,
      mode: 'sandbox',
    })
  })

  it('builds a non-sending sandbox agreement payload for a demo rep', () => {
    const payload = buildPrelaunchSignWellAgreementPayload({
      templateId: 'template_demo',
      recipient: {
        name: 'Demo Rep',
        email: 'demo.rep@example.com',
      },
      metadata: buildPrelaunchSignWellMetadata({
        gateType: 'service_agreement',
        intakeId: 'intake-demo',
        waitlistId: 'waitlist-demo',
        operatorRepId: 'rep-demo',
      }),
      mode: 'sandbox',
    })

    expect(payload).toEqual({
      test_mode: true,
      template_id: 'template_demo',
      send_email: false,
      recipients: [
        {
          id: 'sparkle_suite_rep',
          name: 'Demo Rep',
          email: 'demo.rep@example.com',
        },
      ],
      metadata: {
        platform: 'sparkle_suite',
        agreement_gate: 'service_agreement',
        sparkle_suite_agreement_gate: 'true',
        intake_submission_id: 'intake-demo',
        waitlist_id: 'waitlist-demo',
        operator_rep_id: 'rep-demo',
      },
    })
    expect(JSON.stringify(payload).toLowerCase()).not.toContain('sent')
  })
})
