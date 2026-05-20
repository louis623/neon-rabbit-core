import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedOperatorMock = vi.fn()
const updateMock = vi.fn()
const eqIdMock = vi.fn()
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

import { POST } from '@/app/api/control-center/intake/waitlist-start-work-ready/route'

describe('POST /api/control-center/intake/waitlist-start-work-ready', () => {
  beforeEach(() => {
    getAuthenticatedOperatorMock.mockReset()
    fromMock.mockClear()
    updateMock.mockReset()
    eqIdMock.mockReset()
    eqHandoffMock.mockReset()
    eqLeadStatusMock.mockReset()
    isIntakeMock.mockReset()
    selectMock.mockReset()
    singleMock.mockReset()

    updateMock.mockReturnValue({ eq: eqIdMock })
    eqIdMock.mockReturnValue({ eq: eqLeadStatusMock })
    eqLeadStatusMock.mockReturnValue({ eq: eqHandoffMock })
    eqHandoffMock.mockReturnValue({ is: isIntakeMock })
    isIntakeMock.mockReturnValue({ select: selectMock })
    selectMock.mockReturnValue({ single: singleMock })
  })

  it('marks a drafted setup profile lead as start work ready without provider actions', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })
    singleMock.mockResolvedValueOnce({
      data: { id: 'waitlist-1', lead_status: 'start_work_ready' },
      error: null,
    })

    const response = await POST(
      new Request(
        'http://localhost/api/control-center/intake/waitlist-start-work-ready',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ leadId: 'waitlist-1' }),
        },
      ),
    )

    expect(fromMock).toHaveBeenCalledWith('sparkle_suite_waitlist')
    expect(updateMock).toHaveBeenCalledWith({
      lead_status: 'start_work_ready',
      updated_at: expect.any(String),
    })
    expect(eqIdMock).toHaveBeenCalledWith('id', 'waitlist-1')
    expect(eqLeadStatusMock).toHaveBeenCalledWith(
      'lead_status',
      'setup_profile_drafted',
    )
    expect(eqHandoffMock).toHaveBeenCalledWith('handoff_status', 'not_started')
    expect(isIntakeMock).toHaveBeenCalledWith('intake_submission_id', null)
    expect(selectMock).toHaveBeenCalledWith('id, lead_status')
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      leadId: 'waitlist-1',
      leadStatus: 'start_work_ready',
    })
  })

  it('redirects form submissions back to the start work ready view', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })
    singleMock.mockResolvedValueOnce({
      data: { id: 'waitlist-1', lead_status: 'start_work_ready' },
      error: null,
    })

    const form = new FormData()
    form.set('leadId', 'waitlist-1')
    form.set('returnTo', '/control-center/intake?waitlist=start_work_ready')

    const response = await POST(
      new Request(
        'http://localhost/api/control-center/intake/waitlist-start-work-ready',
        {
          method: 'POST',
          body: form,
        },
      ),
    )

    expect(updateMock).toHaveBeenCalledWith({
      lead_status: 'start_work_ready',
      updated_at: expect.any(String),
    })
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe(
      'http://localhost/control-center/intake?waitlist=start_work_ready',
    )
  })

  it('rejects missing lead ids before writing', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })

    const response = await POST(
      new Request(
        'http://localhost/api/control-center/intake/waitlist-start-work-ready',
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

  it('returns 409 when the setup profile is not currently drafted', async () => {
    getAuthenticatedOperatorMock.mockResolvedValueOnce({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })
    singleMock.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116' },
    })

    const response = await POST(
      new Request(
        'http://localhost/api/control-center/intake/waitlist-start-work-ready',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ leadId: 'waitlist-1' }),
        },
      ),
    )

    expect(updateMock).toHaveBeenCalledWith({
      lead_status: 'start_work_ready',
      updated_at: expect.any(String),
    })
    expect(eqLeadStatusMock).toHaveBeenCalledWith(
      'lead_status',
      'setup_profile_drafted',
    )
    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      error: 'This lead is not ready to mark as Start Work ready.',
    })
  })

  it('returns 401 for unauthenticated requests without writing', async () => {
    getAuthenticatedOperatorMock.mockRejectedValueOnce(
      new MockAuthError('missing session'),
    )

    const response = await POST(
      new Request(
        'http://localhost/api/control-center/intake/waitlist-start-work-ready',
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
