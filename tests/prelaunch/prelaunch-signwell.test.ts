import { describe, expect, it, vi } from 'vitest'

import {
  buildPrelaunchSignWellAgreementPayload,
  buildPrelaunchSignWellMetadata,
  getPrelaunchSignWellLiveSendMode,
  getPrelaunchSignWellConfig,
  normalizePrelaunchAgreementGateType,
  PrelaunchSignWellProviderError,
  summarizeSignWellProviderErrorBody,
  submitPrelaunchSignWellSandboxAgreement,
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
      recipientPlaceholderName: 'sparkle_suite_rep',
    })
    expect(
      getPrelaunchSignWellConfig({
        SIGNWELL_API_KEY: 'signwell_api_key',
        SIGNWELL_TEMPLATE_ID: 'template_123',
        SIGNWELL_API_BASE_URL: 'https://www.signwell.com/api/v1',
        SIGNWELL_TEMPLATE_RECIPIENT_PLACEHOLDER: 'Customer',
      }),
    ).toEqual({
      apiKey: 'signwell_api_key',
      apiBaseUrl: 'https://www.signwell.com/api/v1',
      templateId: 'template_123',
      recipientPlaceholderName: 'Customer',
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
      draft: true,
      recipients: [
        {
          id: 'sparkle_suite_rep',
          placeholder_name: 'sparkle_suite_rep',
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

  it('submits a SignWell sandbox provider request without sending email', async () => {
    const payload = buildPrelaunchSignWellAgreementPayload({
      templateId: 'template_demo',
      recipientPlaceholderName: 'Customer',
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
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          id: 'document_123',
          recipients: [{ id: 'sparkle_suite_rep' }],
        }),
        { status: 201 },
      ),
    )

    const result = await submitPrelaunchSignWellSandboxAgreement({
      config: {
        apiKey: 'signwell_secret_key',
        apiBaseUrl: 'https://www.signwell.com/api/v1/',
        templateId: 'template_demo',
        recipientPlaceholderName: 'Customer',
      },
      agreementPayload: payload,
      fetchImpl,
    })

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://www.signwell.com/api/v1/document_templates/documents',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': 'signwell_secret_key',
        },
        body: JSON.stringify(payload),
      },
    )
    expect(result).toEqual({
      providerStatus: 201,
      documentId: 'document_123',
      recipientCount: 1,
      testMode: true,
      sendEmail: false,
      draft: true,
    })
  })

  it('omits null metadata values from the provider payload', () => {
    const payload = buildPrelaunchSignWellAgreementPayload({
      templateId: 'template_demo',
      recipient: {
        email: 'demo.rep@example.com',
      },
      metadata: buildPrelaunchSignWellMetadata({
        gateType: 'service_agreement',
        intakeId: 'intake-demo',
        waitlistId: null,
        operatorRepId: null,
      }),
      mode: 'sandbox',
    })

    expect(payload.metadata).toEqual({
      platform: 'sparkle_suite',
      agreement_gate: 'service_agreement',
      sparkle_suite_agreement_gate: 'true',
      intake_submission_id: 'intake-demo',
    })
  })

  it('refuses provider requests that are not sandbox non-sends', async () => {
    const payload = {
      ...buildPrelaunchSignWellAgreementPayload({
        templateId: 'template_demo',
        recipient: {
          name: 'Demo Rep',
          email: 'demo.rep@example.com',
        },
        metadata: buildPrelaunchSignWellMetadata({
          gateType: 'service_agreement',
          intakeId: 'intake-demo',
        }),
        mode: 'sandbox',
      }),
      test_mode: false,
    }

    await expect(
      submitPrelaunchSignWellSandboxAgreement({
        config: {
          apiKey: 'signwell_secret_key',
          apiBaseUrl: 'https://www.signwell.com/api/v1',
          templateId: 'template_demo',
          recipientPlaceholderName: 'Customer',
        },
        agreementPayload: payload,
        fetchImpl: vi.fn(),
      }),
    ).rejects.toThrow(PrelaunchSignWellProviderError)
  })

  it('refuses provider requests that could send instead of staying as drafts', async () => {
    const payload = {
      ...buildPrelaunchSignWellAgreementPayload({
        templateId: 'template_demo',
        recipient: {
          name: 'Demo Rep',
          email: 'demo.rep@example.com',
        },
        metadata: buildPrelaunchSignWellMetadata({
          gateType: 'service_agreement',
          intakeId: 'intake-demo',
        }),
        mode: 'sandbox',
      }),
      draft: false,
    }

    await expect(
      submitPrelaunchSignWellSandboxAgreement({
        config: {
          apiKey: 'signwell_secret_key',
          apiBaseUrl: 'https://www.signwell.com/api/v1',
          templateId: 'template_demo',
          recipientPlaceholderName: 'Customer',
        },
        agreementPayload: payload,
        fetchImpl: vi.fn(),
      }),
    ).rejects.toThrow('SignWell sandbox provider smoke requires draft=true.')
  })

  it('summarizes SignWell provider errors with redacted response hints', async () => {
    const payload = buildPrelaunchSignWellAgreementPayload({
      templateId: 'template_demo',
      recipient: {
        name: 'Demo Rep',
        email: 'demo.rep@example.com',
      },
      metadata: buildPrelaunchSignWellMetadata({
        gateType: 'service_agreement',
        intakeId: 'intake-demo',
      }),
      mode: 'sandbox',
    })

    await expect(
      submitPrelaunchSignWellSandboxAgreement({
        config: {
          apiKey: 'signwell_secret_key',
          apiBaseUrl: 'https://www.signwell.com/api/v1',
          templateId: 'template_demo',
          recipientPlaceholderName: 'Customer',
        },
        agreementPayload: payload,
        fetchImpl: vi.fn(async () =>
          new Response(
            JSON.stringify({
              error: 'secret response detail',
              email: 'demo.rep@example.com',
            }),
            { status: 422 },
          ),
        ),
      }),
    ).rejects.toThrow(
      'SignWell sandbox provider call failed with status 422. Provider detail: keys=error,email; messages=secret response detail.',
    )
  })

  it('redacts provider error messages before exposing diagnostics', () => {
    expect(
      summarizeSignWellProviderErrorBody({
        error:
          'Recipient demo.rep@example.com could not use template 11111111-2222-3333-4444-555555555555.',
      }),
    ).toBe(
      'keys=error; messages=Recipient [email] could not use template [uuid].',
    )
  })
})
