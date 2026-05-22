import { beforeEach, describe, expect, it, vi } from 'vitest'

const fromMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: fromMock,
  }),
}))

import {
  createPrelaunchAgreementDraftTracker,
  createPrelaunchSignWellSandboxDraftForBuild,
  getPrelaunchAgreementTemplateSnapshot,
  isPrelaunchSignWellSandboxDraftCreateEnabled,
  loadPrelaunchAgreementDocumentsByBuildIds,
  normalizePrelaunchAgreementDocumentRows,
  recordPrelaunchAgreementSigned,
} from '@/lib/prelaunch/agreement-documents'

describe('prelaunch agreement documents', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('captures the configured reusable template and pricing cohort', () => {
    expect(
      getPrelaunchAgreementTemplateSnapshot({
        SIGNWELL_API_KEY: 'signwell_api_key',
        SIGNWELL_API_BASE_URL: 'https://www.signwell.com/api/v1',
        SIGNWELL_TEMPLATE_ID: 'template_first_20',
      }),
    ).toEqual({
      templateId: 'template_first_20',
      templateLabel: 'Sparkle Suite service agreement',
      pricingCohort: 'founder_first_20',
    })

    expect(
      getPrelaunchAgreementTemplateSnapshot({
        SIGNWELL_API_KEY: 'signwell_api_key',
        SIGNWELL_API_BASE_URL: 'https://www.signwell.com/api/v1',
        SIGNWELL_TEMPLATE_ID: 'template_standard',
        SIGNWELL_TEMPLATE_LABEL: 'Sparkle Suite standard agreement',
        SPARKLE_SUITE_AGREEMENT_PRICING_COHORT: 'standard',
      }),
    ).toMatchObject({
      templateId: 'template_standard',
      templateLabel: 'Sparkle Suite standard agreement',
      pricingCohort: 'standard',
    })
  })

  it('keeps sandbox draft creation behind an explicit guard flag', () => {
    expect(isPrelaunchSignWellSandboxDraftCreateEnabled({})).toBe(false)
    expect(
      isPrelaunchSignWellSandboxDraftCreateEnabled({
        SIGNWELL_SANDBOX_DRAFT_CREATE_ENABLED: 'true',
      }),
    ).toBe(true)
    expect(
      isPrelaunchSignWellSandboxDraftCreateEnabled({
        SIGNWELL_SANDBOX_PROVIDER_CALL: 'true',
      }),
    ).toBe(true)
  })

  it('normalizes agreement document rows', () => {
    expect(
      normalizePrelaunchAgreementDocumentRows([
        {
          id: 'agreement-1',
          launch_build_id: 'build-1',
          waitlist_id: 'waitlist-1',
          intake_submission_id: 'intake-1',
          provider: 'signwell',
          mode: 'sandbox',
          gate_type: 'service_agreement',
          status: 'created',
          template_id: 'template_123',
          template_label: 'Sparkle Suite agreement',
          pricing_cohort: 'founder_first_20',
          provider_document_id: 'document_123',
          recipient_name: 'Demo Lead',
          recipient_email: 'demo@example.com',
          send_email: false,
          draft: true,
          test_mode: true,
          provider_status: 201,
          signed_at: null,
          signed_pdf_url: null,
          notes: 'Sandbox draft only.',
          metadata: {},
          updated_by_rep_id: 'operator-1',
          created_at: '2026-05-22T12:00:00Z',
          updated_at: '2026-05-22T12:01:00Z',
        },
      ]),
    ).toEqual([
      {
        id: 'agreement-1',
        launchBuildId: 'build-1',
        waitlistId: 'waitlist-1',
        intakeSubmissionId: 'intake-1',
        provider: 'signwell',
        mode: 'sandbox',
        gateType: 'service_agreement',
        status: 'created',
        templateId: 'template_123',
        templateLabel: 'Sparkle Suite agreement',
        pricingCohort: 'founder_first_20',
        providerDocumentId: 'document_123',
        recipientName: 'Demo Lead',
        recipientEmail: 'demo@example.com',
        sendEmail: false,
        draft: true,
        testMode: true,
        providerStatus: 201,
        signedAt: null,
        signedPdfUrl: null,
        notes: 'Sandbox draft only.',
        updatedByRepId: 'operator-1',
        createdAt: '2026-05-22T12:00:00Z',
        updatedAt: '2026-05-22T12:01:00Z',
      },
    ])
  })

  it('loads current agreement documents by launch build id', async () => {
    const selectMock = vi.fn()
    const inMock = vi.fn()
    const orderMock = vi.fn()

    fromMock.mockReturnValueOnce({ select: selectMock })
    selectMock.mockReturnValueOnce({ in: inMock })
    inMock.mockReturnValueOnce({ order: orderMock })
    orderMock.mockResolvedValueOnce({
      data: [
        {
          id: 'agreement-1',
          launch_build_id: 'build-1',
          waitlist_id: 'waitlist-1',
          intake_submission_id: 'intake-1',
          provider: 'signwell',
          mode: 'sandbox',
          gate_type: 'service_agreement',
          status: 'draft',
          template_id: 'template_123',
          template_label: 'Sparkle Suite agreement',
          pricing_cohort: 'founder_first_20',
          provider_document_id: null,
          recipient_name: 'Demo Lead',
          recipient_email: 'demo@example.com',
          send_email: false,
          draft: true,
          test_mode: true,
          provider_status: null,
          signed_at: null,
          signed_pdf_url: null,
          notes: '',
          metadata: {},
          updated_by_rep_id: null,
          created_at: '2026-05-22T12:00:00Z',
          updated_at: '2026-05-22T12:01:00Z',
        },
      ],
      error: null,
    })

    const documents = await loadPrelaunchAgreementDocumentsByBuildIds(['build-1'])

    expect(fromMock).toHaveBeenCalledWith('sparkle_suite_agreement_documents')
    expect(inMock).toHaveBeenCalledWith('launch_build_id', ['build-1'])
    expect(orderMock).toHaveBeenCalledWith('updated_at', { ascending: false })
    expect(documents[0].launchBuildId).toBe('build-1')
  })

  it('treats a missing agreement documents table as empty while migrations catch up', async () => {
    const selectMock = vi.fn()
    const inMock = vi.fn()
    const orderMock = vi.fn()

    fromMock.mockReturnValueOnce({ select: selectMock })
    selectMock.mockReturnValueOnce({ in: inMock })
    inMock.mockReturnValueOnce({ order: orderMock })
    orderMock.mockResolvedValueOnce({
      data: null,
      error: {
        code: 'PGRST205',
        message:
          "Could not find the table 'public.sparkle_suite_agreement_documents' in the schema cache",
      },
    })

    await expect(
      loadPrelaunchAgreementDocumentsByBuildIds(['build-1']),
    ).resolves.toEqual([])
  })

  it('upserts a sandbox draft tracker without sending anything', async () => {
    const buildSelectMock = vi.fn()
    const buildEqMock = vi.fn()
    const buildSingleMock = vi.fn()
    const upsertMock = vi.fn()
    const upsertSelectMock = vi.fn()
    const upsertSingleMock = vi.fn()

    fromMock
      .mockReturnValueOnce({ select: buildSelectMock })
      .mockReturnValueOnce({ upsert: upsertMock })
    buildSelectMock.mockReturnValueOnce({ eq: buildEqMock })
    buildEqMock.mockReturnValueOnce({ single: buildSingleMock })
    buildSingleMock.mockResolvedValueOnce({
      data: {
        id: 'build-1',
        waitlist_id: 'waitlist-1',
        intake_submission_id: 'intake-1',
        lead_name: 'Demo Lead',
        lead_email: 'demo@example.com',
      },
      error: null,
    })
    upsertMock.mockReturnValueOnce({ select: upsertSelectMock })
    upsertSelectMock.mockReturnValueOnce({ single: upsertSingleMock })
    upsertSingleMock.mockResolvedValueOnce({
      data: {
        id: 'agreement-1',
        launch_build_id: 'build-1',
        waitlist_id: 'waitlist-1',
        intake_submission_id: 'intake-1',
        provider: 'signwell',
        mode: 'sandbox',
        gate_type: 'service_agreement',
        status: 'created',
        template_id: 'template_123',
        template_label: 'Sparkle Suite service agreement',
        pricing_cohort: 'founder_first_20',
        provider_document_id: 'document_123',
        recipient_name: 'Demo Lead',
        recipient_email: 'demo@example.com',
        send_email: false,
        draft: true,
        test_mode: true,
        provider_status: 201,
        signed_at: null,
        signed_pdf_url: null,
        notes: 'Sandbox only.',
        metadata: {},
        updated_by_rep_id: 'operator-1',
        created_at: '2026-05-22T12:00:00Z',
        updated_at: '2026-05-22T12:01:00Z',
      },
      error: null,
    })

    const document = await createPrelaunchAgreementDraftTracker({
      launchBuildId: 'build-1',
      operatorRepId: 'operator-1',
      providerDocumentId: 'document_123',
      providerStatus: 201,
      notes: 'Sandbox only.',
      env: {
        SIGNWELL_API_KEY: 'signwell_api_key',
        SIGNWELL_API_BASE_URL: 'https://www.signwell.com/api/v1',
        SIGNWELL_TEMPLATE_ID: 'template_123',
      },
    })

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        launch_build_id: 'build-1',
        status: 'created',
        template_id: 'template_123',
        pricing_cohort: 'founder_first_20',
        provider_document_id: 'document_123',
        recipient_email: 'demo@example.com',
        send_email: false,
        draft: true,
        test_mode: true,
        provider_status: 201,
      }),
      { onConflict: 'launch_build_id,provider,mode,gate_type' },
    )
    expect(document.providerDocumentId).toBe('document_123')
  })

  it('creates a SignWell test-mode draft for a launch build and saves the returned document id', async () => {
    const firstBuildSelectMock = vi.fn()
    const firstBuildEqMock = vi.fn()
    const firstBuildSingleMock = vi.fn()
    const secondBuildSelectMock = vi.fn()
    const secondBuildEqMock = vi.fn()
    const secondBuildSingleMock = vi.fn()
    const upsertMock = vi.fn()
    const upsertSelectMock = vi.fn()
    const upsertSingleMock = vi.fn()
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      new Response(
        JSON.stringify({
          id: 'document_123',
          recipients: [{ id: 'sparkle_suite_rep' }],
        }),
        { status: 201 },
      ),
    )

    fromMock
      .mockReturnValueOnce({ select: firstBuildSelectMock })
      .mockReturnValueOnce({ select: secondBuildSelectMock })
      .mockReturnValueOnce({ upsert: upsertMock })
    firstBuildSelectMock.mockReturnValueOnce({ eq: firstBuildEqMock })
    firstBuildEqMock.mockReturnValueOnce({ single: firstBuildSingleMock })
    firstBuildSingleMock.mockResolvedValueOnce({
      data: {
        id: 'build-1',
        waitlist_id: 'waitlist-1',
        intake_submission_id: 'intake-1',
        lead_name: 'Demo Lead',
        lead_email: 'demo@example.com',
      },
      error: null,
    })
    secondBuildSelectMock.mockReturnValueOnce({ eq: secondBuildEqMock })
    secondBuildEqMock.mockReturnValueOnce({ single: secondBuildSingleMock })
    secondBuildSingleMock.mockResolvedValueOnce({
      data: {
        id: 'build-1',
        waitlist_id: 'waitlist-1',
        intake_submission_id: 'intake-1',
        lead_name: 'Demo Lead',
        lead_email: 'demo@example.com',
      },
      error: null,
    })
    upsertMock.mockReturnValueOnce({ select: upsertSelectMock })
    upsertSelectMock.mockReturnValueOnce({ single: upsertSingleMock })
    upsertSingleMock.mockResolvedValueOnce({
      data: {
        id: 'agreement-1',
        launch_build_id: 'build-1',
        waitlist_id: 'waitlist-1',
        intake_submission_id: 'intake-1',
        provider: 'signwell',
        mode: 'sandbox',
        gate_type: 'service_agreement',
        status: 'created',
        template_id: 'template_123',
        template_label: 'Sparkle Suite service agreement',
        pricing_cohort: 'founder_first_20',
        provider_document_id: 'document_123',
        recipient_name: 'Demo Lead',
        recipient_email: 'demo@example.com',
        send_email: false,
        draft: true,
        test_mode: true,
        provider_status: 201,
        signed_at: null,
        signed_pdf_url: null,
        notes: 'SignWell test-mode draft created. Email disabled.',
        metadata: {},
        updated_by_rep_id: 'operator-1',
        created_at: '2026-05-22T12:00:00Z',
        updated_at: '2026-05-22T12:01:00Z',
      },
      error: null,
    })

    const result = await createPrelaunchSignWellSandboxDraftForBuild({
      launchBuildId: 'build-1',
      operatorRepId: 'operator-1',
      env: {
        SIGNWELL_API_KEY: 'signwell_api_key',
        SIGNWELL_API_BASE_URL: 'https://www.signwell.com/api/v1',
        SIGNWELL_TEMPLATE_ID: 'template_123',
        SIGNWELL_TEMPLATE_RECIPIENT_PLACEHOLDER: 'Client',
        SIGNWELL_SANDBOX_DRAFT_CREATE_ENABLED: 'true',
      },
      fetchImpl,
    })

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://www.signwell.com/api/v1/document_templates/documents',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"send_email":false'),
      }),
    )
    const fetchRequest = fetchImpl.mock.calls[0]?.[1] as
      | { body?: BodyInit | null }
      | undefined
    expect(typeof fetchRequest?.body).toBe('string')
    expect(JSON.parse(fetchRequest?.body as string)).toMatchObject({
      test_mode: true,
      send_email: false,
      draft: true,
      template_id: 'template_123',
      recipients: [
        {
          placeholder_name: 'Client',
          name: 'Demo Lead',
          email: 'demo@example.com',
        },
      ],
    })
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'created',
        provider_document_id: 'document_123',
        provider_status: 201,
        send_email: false,
        draft: true,
        test_mode: true,
      }),
      { onConflict: 'launch_build_id,provider,mode,gate_type' },
    )
    expect(result.agreementDocument.providerDocumentId).toBe('document_123')
    expect(result.providerResult.sendEmail).toBe(false)
  })

  it('refuses to create a SignWell sandbox draft when the guard flag is off', async () => {
    await expect(
      createPrelaunchSignWellSandboxDraftForBuild({
        launchBuildId: 'build-1',
        env: {
          SIGNWELL_API_KEY: 'signwell_api_key',
          SIGNWELL_API_BASE_URL: 'https://www.signwell.com/api/v1',
          SIGNWELL_TEMPLATE_ID: 'template_123',
        },
        fetchImpl: vi.fn(),
      }),
    ).rejects.toThrow(
      'SignWell sandbox draft creation requires SIGNWELL_SANDBOX_DRAFT_CREATE_ENABLED=true.',
    )
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('records a sandbox agreement as signed without opening launch gates', async () => {
    const updateMock = vi.fn()
    const launchBuildEqMock = vi.fn()
    const providerEqMock = vi.fn()
    const modeEqMock = vi.fn()
    const gateTypeEqMock = vi.fn()
    const selectMock = vi.fn()
    const singleMock = vi.fn()

    fromMock.mockReturnValueOnce({ update: updateMock })
    updateMock.mockReturnValueOnce({ eq: launchBuildEqMock })
    launchBuildEqMock.mockReturnValueOnce({ eq: providerEqMock })
    providerEqMock.mockReturnValueOnce({ eq: modeEqMock })
    modeEqMock.mockReturnValueOnce({ eq: gateTypeEqMock })
    gateTypeEqMock.mockReturnValueOnce({ select: selectMock })
    selectMock.mockReturnValueOnce({ single: singleMock })
    singleMock.mockResolvedValueOnce({
      data: {
        id: 'agreement-1',
        launch_build_id: 'build-1',
        waitlist_id: 'waitlist-1',
        intake_submission_id: 'intake-1',
        provider: 'signwell',
        mode: 'sandbox',
        gate_type: 'service_agreement',
        status: 'signed',
        template_id: 'template_123',
        template_label: 'Sparkle Suite service agreement',
        pricing_cohort: 'founder_first_20',
        provider_document_id: 'document_123',
        recipient_name: 'Demo Lead',
        recipient_email: 'demo@example.com',
        send_email: false,
        draft: false,
        test_mode: true,
        provider_status: 201,
        signed_at: '2026-05-22T15:00:00Z',
        signed_pdf_url: 'https://storage.example/signed.pdf',
        notes: 'Signed proof received.',
        metadata: {},
        updated_by_rep_id: 'operator-1',
        created_at: '2026-05-22T12:00:00Z',
        updated_at: '2026-05-22T15:01:00Z',
      },
      error: null,
    })

    const document = await recordPrelaunchAgreementSigned({
      launchBuildId: 'build-1',
      operatorRepId: 'operator-1',
      signedAt: '2026-05-22T15:00:00Z',
      signedPdfUrl: 'https://storage.example/signed.pdf',
      notes: 'Signed proof received.',
    })

    expect(updateMock).toHaveBeenCalledWith({
      status: 'signed',
      signed_at: '2026-05-22T15:00:00Z',
      signed_pdf_url: 'https://storage.example/signed.pdf',
      draft: false,
      notes: 'Signed proof received.',
      updated_by_rep_id: 'operator-1',
    })
    expect(launchBuildEqMock).toHaveBeenCalledWith('launch_build_id', 'build-1')
    expect(providerEqMock).toHaveBeenCalledWith('provider', 'signwell')
    expect(modeEqMock).toHaveBeenCalledWith('mode', 'sandbox')
    expect(gateTypeEqMock).toHaveBeenCalledWith(
      'gate_type',
      'service_agreement',
    )
    expect(document.status).toBe('signed')
    expect(document.signedPdfUrl).toBe('https://storage.example/signed.pdf')
  })
})
