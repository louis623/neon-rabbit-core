import { beforeEach, describe, expect, it, vi } from 'vitest'

const getControlCenterAccessMock = vi.fn()
const createAdminClientMock = vi.fn()
const upsertMock = vi.fn()

const { MockAuthError, MockOperatorAuthError } = vi.hoisted(() => ({
  MockAuthError: class MockAuthError extends Error {},
  MockOperatorAuthError: class MockOperatorAuthError extends Error {},
}))

vi.mock('@/lib/supabase/operator-auth', () => ({
  AuthError: MockAuthError,
  OperatorAuthError: MockOperatorAuthError,
  getControlCenterAccess: (...args: unknown[]) => getControlCenterAccessMock(...args),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

import { PATCH } from '@/app/api/control-center/onboarding-checklist/route'

describe('/api/control-center/onboarding-checklist', () => {
  beforeEach(() => {
    getControlCenterAccessMock.mockReset()
    createAdminClientMock.mockReset()
    upsertMock.mockReset()
    getControlCenterAccessMock.mockResolvedValue({ operator: { repId: 'operator-1' } })
    upsertMock.mockReturnValue({
      select: () => ({
        single: async () => ({
          data: { item_key: 'about_section_intake', status: 'complete', evidence_summary: 'Questions sent.', updated_at: '2026-09-03T12:00:00.000Z', completed_at: '2026-09-03T12:00:00.000Z' },
          error: null,
        }),
      }),
    })
    createAdminClientMock.mockReturnValue({
      from: () => ({ upsert: upsertMock }),
    })
  })

  it('writes a known item through the owner-only service route', async () => {
    const response = await PATCH(new Request('http://localhost/api/control-center/onboarding-checklist', {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ repId: 'rep-1', itemKey: 'about_section_intake', status: 'complete', evidenceSummary: 'Questions sent.' }),
    }))
    expect(response.status).toBe(200)
    expect(upsertMock).toHaveBeenCalledWith(expect.objectContaining({
      rep_id: 'rep-1', item_key: 'about_section_intake', status: 'complete', updated_by_rep_id: 'operator-1',
    }), { onConflict: 'rep_id,item_key' })
    await expect(response.json()).resolves.toEqual({ item: {
      itemKey: 'about_section_intake', status: 'complete', evidenceSummary: 'Questions sent.', updatedAt: '2026-09-03T12:00:00.000Z', completedAt: '2026-09-03T12:00:00.000Z',
    } })
  })

  it('rejects unknown item keys before a database write', async () => {
    const response = await PATCH(new Request('http://localhost/api/control-center/onboarding-checklist', {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ repId: 'rep-1', itemKey: 'customer_answers', status: 'complete' }),
    }))
    expect(response.status).toBe(400)
    expect(upsertMock).not.toHaveBeenCalled()
  })

  it('does not expose a write path to unauthenticated callers', async () => {
    getControlCenterAccessMock.mockRejectedValueOnce(new MockAuthError('missing'))
    const response = await PATCH(new Request('http://localhost/api/control-center/onboarding-checklist', { method: 'PATCH' }))
    expect(response.status).toBe(401)
    expect(upsertMock).not.toHaveBeenCalled()
  })
})
