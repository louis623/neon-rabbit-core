import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedOperatorMock = vi.fn()
const createPrelaunchAgreementDraftTrackerMock = vi.fn()
const createPrelaunchSignWellSandboxDraftForBuildMock = vi.fn()
const isPrelaunchSignWellSandboxDraftCreateEnabledMock = vi.fn()
const recordPrelaunchAgreementSignedMock = vi.fn()

const { MockAuthError, MockOperatorAuthError } = vi.hoisted(() => ({
  MockAuthError: class MockAuthError extends Error {},
  MockOperatorAuthError: class MockOperatorAuthError extends Error {},
}))

vi.mock('@/lib/supabase/operator-auth', () => ({
  AuthError: MockAuthError,
  OperatorAuthError: MockOperatorAuthError,
  getAuthenticatedOperator: (...args: unknown[]) =>
    getAuthenticatedOperatorMock(...args),
}))

vi.mock('@/lib/prelaunch/agreement-documents', () => ({
  createPrelaunchAgreementDraftTracker: (...args: unknown[]) =>
    createPrelaunchAgreementDraftTrackerMock(...args),
  createPrelaunchSignWellSandboxDraftForBuild: (...args: unknown[]) =>
    createPrelaunchSignWellSandboxDraftForBuildMock(...args),
  isPrelaunchSignWellSandboxDraftCreateEnabled: (...args: unknown[]) =>
    isPrelaunchSignWellSandboxDraftCreateEnabledMock(...args),
  recordPrelaunchAgreementSigned: (...args: unknown[]) =>
    recordPrelaunchAgreementSignedMock(...args),
}))

import { POST } from '@/app/api/control-center/intake/agreement-document/route'

describe('POST /api/control-center/intake/agreement-document', () => {
  beforeEach(() => {
    getAuthenticatedOperatorMock.mockReset()
    createPrelaunchAgreementDraftTrackerMock.mockReset()
    createPrelaunchSignWellSandboxDraftForBuildMock.mockReset()
    isPrelaunchSignWellSandboxDraftCreateEnabledMock.mockReset()
    recordPrelaunchAgreementSignedMock.mockReset()
    isPrelaunchSignWellSandboxDraftCreateEnabledMock.mockReturnValue(false)
  })

  it('records an operator-only agreement draft tracker without provider actions', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })
    createPrelaunchAgreementDraftTrackerMock.mockResolvedValueOnce({
      id: 'agreement-1',
      launchBuildId: 'build-1',
      status: 'draft',
      sendEmail: false,
      draft: true,
      testMode: true,
    })

    const response = await POST(
      new Request('http://localhost/api/control-center/intake/agreement-document', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          launchBuildId: 'build-1',
          providerDocumentId: 'document_123',
          providerStatus: '201',
          notes: 'Sandbox draft only.',
        }),
      }),
    )

    expect(createPrelaunchAgreementDraftTrackerMock).toHaveBeenCalledWith({
      launchBuildId: 'build-1',
      operatorRepId: 'operator-1',
      providerDocumentId: 'document_123',
      providerStatus: 201,
      notes: 'Sandbox draft only.',
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      agreementDocument: {
        id: 'agreement-1',
        launchBuildId: 'build-1',
        status: 'draft',
        sendEmail: false,
        draft: true,
        testMode: true,
      },
    })
  })

  it('redirects form saves back to the launch gates panel', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })
    createPrelaunchAgreementDraftTrackerMock.mockResolvedValueOnce({
      id: 'agreement-1',
    })

    const form = new FormData()
    form.set('launchBuildId', 'build-1')
    form.set('providerDocumentId', 'document_123')
    form.set('returnTo', '/control-center/intake#launch-gates')

    const response = await POST(
      new Request('http://localhost/api/control-center/intake/agreement-document', {
        method: 'POST',
        body: form,
      }),
    )

    expect(createPrelaunchAgreementDraftTrackerMock).toHaveBeenCalledWith({
      launchBuildId: 'build-1',
      operatorRepId: 'operator-1',
      providerDocumentId: 'document_123',
      providerStatus: null,
      notes: '',
    })
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe(
      'http://localhost/control-center/intake#launch-gates',
    )
  })

  it('creates a guarded SignWell sandbox draft and records the provider document id', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })
    isPrelaunchSignWellSandboxDraftCreateEnabledMock.mockReturnValueOnce(true)
    createPrelaunchSignWellSandboxDraftForBuildMock.mockResolvedValueOnce({
      agreementDocument: {
        id: 'agreement-1',
        launchBuildId: 'build-1',
        status: 'created',
        providerDocumentId: 'document_123',
        sendEmail: false,
        draft: true,
        testMode: true,
      },
      providerResult: {
        providerStatus: 201,
        documentId: 'document_123',
        sendEmail: false,
        draft: true,
        testMode: true,
      },
    })

    const response = await POST(
      new Request('http://localhost/api/control-center/intake/agreement-document', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          launchBuildId: 'build-1',
          createSandboxDraft: true,
          notes: 'Create one SignWell test draft.',
        }),
      }),
    )

    expect(createPrelaunchAgreementDraftTrackerMock).not.toHaveBeenCalled()
    expect(createPrelaunchSignWellSandboxDraftForBuildMock).toHaveBeenCalledWith({
      launchBuildId: 'build-1',
      operatorRepId: 'operator-1',
      notes: 'Create one SignWell test draft.',
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      code: 'SIGNWELL_SANDBOX_DRAFT_CREATED',
      agreementDocument: {
        id: 'agreement-1',
        launchBuildId: 'build-1',
        status: 'created',
        providerDocumentId: 'document_123',
        sendEmail: false,
        draft: true,
        testMode: true,
      },
      providerResult: {
        providerStatus: 201,
        documentId: 'document_123',
        sendEmail: false,
        draft: true,
        testMode: true,
      },
    })
  })

  it('blocks sandbox provider draft creation unless the explicit guard is enabled', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })

    const response = await POST(
      new Request('http://localhost/api/control-center/intake/agreement-document', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          launchBuildId: 'build-1',
          createSandboxDraft: true,
        }),
      }),
    )

    expect(createPrelaunchAgreementDraftTrackerMock).not.toHaveBeenCalled()
    expect(createPrelaunchSignWellSandboxDraftForBuildMock).not.toHaveBeenCalled()
    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      code: 'SIGNWELL_SANDBOX_DRAFT_BLOCKED',
      error:
        'SignWell sandbox draft creation requires SIGNWELL_SANDBOX_DRAFT_CREATE_ENABLED=true.',
    })
  })

  it('records an operator-only signed agreement proof without provider actions', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })
    recordPrelaunchAgreementSignedMock.mockResolvedValueOnce({
      id: 'agreement-1',
      launchBuildId: 'build-1',
      status: 'signed',
      signedAt: '2026-05-22T15:00:00Z',
      signedPdfUrl: 'https://storage.example/signed.pdf',
      draft: false,
      testMode: true,
    })

    const response = await POST(
      new Request('http://localhost/api/control-center/intake/agreement-document', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          launchBuildId: 'build-1',
          markSigned: true,
          signedAt: '2026-05-22T15:00:00Z',
          signedPdfUrl: 'https://storage.example/signed.pdf',
          notes: 'Signed proof received.',
        }),
      }),
    )

    expect(createPrelaunchAgreementDraftTrackerMock).not.toHaveBeenCalled()
    expect(createPrelaunchSignWellSandboxDraftForBuildMock).not.toHaveBeenCalled()
    expect(recordPrelaunchAgreementSignedMock).toHaveBeenCalledWith({
      launchBuildId: 'build-1',
      operatorRepId: 'operator-1',
      signedAt: '2026-05-22T15:00:00Z',
      signedPdfUrl: 'https://storage.example/signed.pdf',
      notes: 'Signed proof received.',
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      code: 'AGREEMENT_SIGNATURE_RECORDED',
      agreementDocument: {
        id: 'agreement-1',
        launchBuildId: 'build-1',
        status: 'signed',
        signedAt: '2026-05-22T15:00:00Z',
        signedPdfUrl: 'https://storage.example/signed.pdf',
        draft: false,
        testMode: true,
      },
    })
  })

  it('rejects missing build id before writing', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })

    const response = await POST(
      new Request('http://localhost/api/control-center/intake/agreement-document', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ providerDocumentId: 'document_123' }),
      }),
    )

    expect(createPrelaunchAgreementDraftTrackerMock).not.toHaveBeenCalled()
    expect(response.status).toBe(400)
  })

  it('returns 401 for unauthenticated requests without writing', async () => {
    getAuthenticatedOperatorMock.mockRejectedValueOnce(
      new MockAuthError('missing session'),
    )

    const response = await POST(
      new Request('http://localhost/api/control-center/intake/agreement-document', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ launchBuildId: 'build-1' }),
      }),
    )

    expect(createPrelaunchAgreementDraftTrackerMock).not.toHaveBeenCalled()
    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'unauthenticated' })
  })
})
