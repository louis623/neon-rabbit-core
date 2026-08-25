import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAccess = vi.fn()
const createAdmin = vi.fn(() => ({ marker: 'admin' }))
const listQueue = vi.fn()
const finalizeReview = vi.fn()

vi.mock('@/lib/supabase/operator-auth', () => ({
  AuthError: class AuthError extends Error {},
  OperatorAuthError: class OperatorAuthError extends Error {},
  getControlCenterAccess: (...args: unknown[]) => getAccess(...args),
}))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => createAdmin() }))
vi.mock('@/lib/sparkle-finder/studio-intake-v2', () => ({
  listSparkleFinderStudioReviewQueue: (...args: unknown[]) => listQueue(...args),
  finalizeSparkleFinderStudioReviewV2: (...args: unknown[]) => finalizeReview(...args),
}))

import { GET, PATCH } from '@/app/api/control-center/finder-studio-reviews/route'
import { AuthError, OperatorAuthError } from '@/lib/supabase/operator-auth'

describe('Control Center Finder Studio review route', () => {
  beforeEach(() => {
    getAccess.mockReset()
    createAdmin.mockClear()
    listQueue.mockReset()
    finalizeReview.mockReset()
    getAccess.mockResolvedValue({
      operator: {
        email: 'operator@example.com',
        repId: '99999999-9999-4999-8999-999999999999',
      },
    })
  })

  it('authenticates before listing a bounded pending review queue', async () => {
    listQueue.mockResolvedValue({ items: [{ finderSubmissionId: 'submission-1' }], hasMore: false })

    const response = await GET(new Request(
      'http://localhost/api/control-center/finder-studio-reviews?limit=12',
    ))

    expect(response.status).toBe(200)
    expect(getAccess).toHaveBeenCalledOnce()
    expect(listQueue).toHaveBeenCalledWith({ supabase: { marker: 'admin' }, limit: 12 })
    await expect(response.json()).resolves.toEqual({
      items: [{ finderSubmissionId: 'submission-1' }],
      hasMore: false,
    })
  })

  it('records the authenticated operator when finalizing an exact Suite design', async () => {
    finalizeReview.mockResolvedValue({
      schemaVersion: 2,
      ok: true,
      status: 'accepted',
      retryable: false,
      mutationReplayed: false,
      suiteDesignId: '44444444-4444-4444-8444-444444444444',
    })

    const response = await PATCH(new Request(
      'http://localhost/api/control-center/finder-studio-reviews',
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          finderSubmissionId: '11111111-1111-4111-8111-111111111111',
          suiteDesignId: '44444444-4444-4444-8444-444444444444',
          reviewNote: 'Matched against both original photos.',
        }),
      },
    ))

    expect(response.status).toBe(200)
    expect(finalizeReview).toHaveBeenCalledWith({
      supabase: { marker: 'admin' },
      finderSubmissionId: '11111111-1111-4111-8111-111111111111',
      suiteDesignId: '44444444-4444-4444-8444-444444444444',
      reviewerEmail: 'operator@example.com',
      reviewerRepId: '99999999-9999-4999-8999-999999999999',
      reviewNote: 'Matched against both original photos.',
    })
  })

  it('rejects unauthenticated, malformed, and oversized review requests', async () => {
    getAccess.mockRejectedValueOnce(new AuthError('sign in'))
    const unauthorized = await GET(new Request(
      'http://localhost/api/control-center/finder-studio-reviews',
    ))
    expect(unauthorized.status).toBe(401)
    expect(createAdmin).not.toHaveBeenCalled()

    getAccess.mockResolvedValueOnce({
      operator: { email: 'operator@example.com', repId: '99999999-9999-4999-8999-999999999999' },
    })
    const invalid = await PATCH(new Request(
      'http://localhost/api/control-center/finder-studio-reviews',
      { method: 'PATCH', body: JSON.stringify({ reviewNote: 'x'.repeat(2_001) }) },
    ))
    expect(invalid.status).toBe(400)
    expect(finalizeReview).not.toHaveBeenCalled()

    const oversized = await PATCH(new Request(
      'http://localhost/api/control-center/finder-studio-reviews',
      { method: 'PATCH', body: JSON.stringify({ padding: 'x'.repeat(9_000) }) },
    ))
    expect(oversized.status).toBe(413)
    expect(finalizeReview).not.toHaveBeenCalled()
  })

  it('preserves the Control Center forbidden boundary', async () => {
    getAccess.mockRejectedValueOnce(new OperatorAuthError('forbidden'))

    const response = await GET(new Request(
      'http://localhost/api/control-center/finder-studio-reviews',
    ))

    expect(response.status).toBe(403)
    expect(createAdmin).not.toHaveBeenCalled()
  })
})
