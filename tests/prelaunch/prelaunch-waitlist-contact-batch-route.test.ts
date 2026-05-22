import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedOperatorMock = vi.fn()
const updateMock = vi.fn()
const eqIdMock = vi.fn()
const inWelcomeMock = vi.fn()
const eqHandoffMock = vi.fn()
const eqLeadStatusMock = vi.fn()
const isIntakeMock = vi.fn()
const selectMock = vi.fn()
const singleMock = vi.fn()
const fromMock = vi.fn(() => ({
  update: updateMock,
}))

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

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: fromMock,
  }),
}))

import { POST } from '@/app/api/control-center/intake/waitlist-contact-batch/route'

describe('POST /api/control-center/intake/waitlist-contact-batch', () => {
  beforeEach(() => {
    getAuthenticatedOperatorMock.mockReset()
    fromMock.mockClear()
    updateMock.mockReset()
    eqIdMock.mockReset()
    inWelcomeMock.mockReset()
    eqHandoffMock.mockReset()
    eqLeadStatusMock.mockReset()
    isIntakeMock.mockReset()
    selectMock.mockReset()
    singleMock.mockReset()

    updateMock.mockReturnValue({ eq: eqIdMock })
    eqIdMock.mockReturnValue({ in: inWelcomeMock })
    inWelcomeMock.mockReturnValue({ eq: eqHandoffMock })
    eqHandoffMock.mockReturnValue({ is: isIntakeMock })
    isIntakeMock.mockReturnValue({ eq: eqLeadStatusMock })
    eqLeadStatusMock.mockReturnValue({ select: selectMock })
    selectMock.mockReturnValue({ single: singleMock })
  })

  it('marks a ready waitlist lead as selected for manual contact batching', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })
    singleMock.mockResolvedValueOnce({
      data: { id: 'waitlist-1', lead_status: 'contact_batch_selected' },
      error: null,
    })

    const response = await POST(
      new Request(
        'http://localhost/api/control-center/intake/waitlist-contact-batch',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ leadId: 'waitlist-1' }),
        },
      ),
    )

    expect(fromMock).toHaveBeenCalledWith('sparkle_suite_waitlist')
    expect(updateMock).toHaveBeenCalledWith({
      lead_status: 'contact_batch_selected',
      updated_at: expect.any(String),
    })
    expect(eqIdMock).toHaveBeenCalledWith('id', 'waitlist-1')
    expect(inWelcomeMock).toHaveBeenCalledWith('welcome_email_status', [
      'sent',
      'skipped',
    ])
    expect(eqHandoffMock).toHaveBeenCalledWith('handoff_status', 'not_started')
    expect(isIntakeMock).toHaveBeenCalledWith('intake_submission_id', null)
    expect(eqLeadStatusMock).toHaveBeenCalledWith('lead_status', 'new')
    expect(selectMock).toHaveBeenCalledWith('id, lead_status')
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      leadId: 'waitlist-1',
      leadStatus: 'contact_batch_selected',
    })
  })

  it('rejects missing lead ids before writing', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })

    const response = await POST(
      new Request(
        'http://localhost/api/control-center/intake/waitlist-contact-batch',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({}),
        },
      ),
    )

    expect(updateMock).not.toHaveBeenCalled()
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'leadId is required.',
    })
  })

  it('returns 401 for unauthenticated requests without writing', async () => {
    getAuthenticatedOperatorMock.mockRejectedValueOnce(
      new MockAuthError('missing session'),
    )

    const response = await POST(
      new Request(
        'http://localhost/api/control-center/intake/waitlist-contact-batch',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ leadId: 'waitlist-1' }),
        },
      ),
    )

    expect(updateMock).not.toHaveBeenCalled()
    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'unauthenticated' })
  })
})
