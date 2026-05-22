import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedOperatorMock = vi.fn()
const createPrelaunchAgreementDraftTrackerMock = vi.fn()

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
}))

import { POST } from '@/app/api/control-center/intake/agreement-document/route'

describe('POST /api/control-center/intake/agreement-document', () => {
  beforeEach(() => {
    getAuthenticatedOperatorMock.mockReset()
    createPrelaunchAgreementDraftTrackerMock.mockReset()
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
