import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedRepMock = vi.fn()
vi.mock('@/lib/supabase/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/supabase/auth')>('@/lib/supabase/auth')
  return { ...actual, getAuthenticatedRep: (...args: unknown[]) => getAuthenticatedRepMock(...args) }
})

import { AuthError } from '@/lib/supabase/auth'
import { POST } from '@/app/api/nic-nac/support-reports/route'

describe('legacy Help support route', () => {
  beforeEach(() => getAuthenticatedRepMock.mockResolvedValue({ repId: 'rep-1', rep: { email: 'jamie@example.com' } }))

  it('returns an editable Message Center draft without submitting', async () => {
    const response = await POST(new Request('http://localhost/api/nic-nac/support-reports', { method: 'POST', body: JSON.stringify({ reportType: 'bug', urgency: 'blocking', pageOrWorkflow: 'Calendar', title: 'Calendar save fails', details: 'Clicking save does nothing after I edit a show.' }) }))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      submitted: false,
      action: 'open_support_composer',
      href: '/nic-nac?section=messages&compose=support&source=help',
      draft: { type: 'bug', urgency: 'blocking', source: 'Calendar', summary: 'Calendar save fails' },
    })
  })

  it('keeps authentication and validation boundaries', async () => {
    getAuthenticatedRepMock.mockRejectedValueOnce(new AuthError('Not authenticated'))
    const unauthorized = await POST(new Request('http://localhost/api/nic-nac/support-reports', { method: 'POST', body: JSON.stringify({ details: 'A long enough support question.' }) }))
    expect(unauthorized.status).toBe(401)
    getAuthenticatedRepMock.mockResolvedValueOnce({ repId: 'rep-1', rep: {} })
    const invalid = await POST(new Request('http://localhost/api/nic-nac/support-reports', { method: 'POST', body: JSON.stringify({ details: 'short' }) }))
    expect(invalid.status).toBe(400)
  })
})
