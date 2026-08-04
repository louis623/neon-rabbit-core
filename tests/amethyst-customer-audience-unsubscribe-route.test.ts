import { beforeEach, describe, expect, it, vi } from 'vitest'

const createAdminClientMock = vi.fn()
const unsubscribeCustomerAudienceByContactMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

vi.mock('@/lib/services/customer-audience', () => ({
  unsubscribeCustomerAudienceByContact: (...args: unknown[]) =>
    unsubscribeCustomerAudienceByContactMock(...args),
}))

import { POST } from '@/app/api/amethyst/customer-audience/unsubscribe/route'

function makeAdminClient({ repId = 'rep-preview' }: { repId?: string | null } = {}) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: repId ? { id: repId } : null,
    error: null,
  })
  const eq = vi.fn().mockReturnValue({ maybeSingle })
  const selectRep = vi.fn().mockReturnValue({ eq })

  const from = vi.fn((table: string) => {
    if (table !== 'reps') throw new Error(`Unexpected table ${table}`)
    return { select: selectRep }
  })

  return {
    client: { from } as never,
    spies: { eq },
  }
}

function makeTargetedAdminClient() {
  const repMaybeSingle = vi.fn().mockResolvedValue({
    data: { id: 'rep-clean' },
    error: null,
  })
  const repEq = vi.fn().mockReturnValue({ maybeSingle: repMaybeSingle })
  const selectRep = vi.fn().mockReturnValue({ eq: repEq })

  const subscriptionMaybeSingle = vi.fn().mockResolvedValue({
    data: { id: 'subscription-1', status: 'active' },
    error: null,
  })
  const subscriptionEq = vi.fn().mockReturnValue({
    maybeSingle: subscriptionMaybeSingle,
  })
  const selectSubscription = vi.fn().mockReturnValue({ eq: subscriptionEq })

  const from = vi.fn((table: string) => {
    if (table === 'reps') return { select: selectRep }
    if (table === 'subscriptions') return { select: selectSubscription }
    if (table === 'workspace_trials') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      }
    }
    throw new Error(`Unexpected table ${table}`)
  })

  return {
    client: { from } as never,
    spies: { repEq },
  }
}

describe('POST /api/amethyst/customer-audience/unsubscribe', () => {
  beforeEach(() => {
    createAdminClientMock.mockReset()
    unsubscribeCustomerAudienceByContactMock.mockReset()
    process.env.AMETHYST_HOMEPAGE_PREVIEW_EMAIL = 'preview@example.com'
  })

  it('routes public unsubscribe requests to the preview rep audience service', async () => {
    const { client, spies } = makeAdminClient()
    createAdminClientMock.mockReturnValue(client)
    unsubscribeCustomerAudienceByContactMock.mockResolvedValueOnce({
      updatedCount: 1,
      smsUpdatedCount: 1,
      emailUpdatedCount: 0,
    })

    const response = await POST(
      new Request('http://localhost/api/amethyst/customer-audience/unsubscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          phone: '(555) 555-1212',
          unsubscribeSms: true,
        }),
      }),
    )

    expect(spies.eq).toHaveBeenCalledWith('email', 'preview@example.com')
    expect(unsubscribeCustomerAudienceByContactMock).toHaveBeenCalledWith(
      client,
      {
        repId: 'rep-preview',
        phone: '(555) 555-1212',
        email: '',
        unsubscribeSms: true,
        unsubscribeEmail: false,
      },
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
  })

  it('returns 503 if the preview rep cannot be resolved', async () => {
    const { client } = makeAdminClient({ repId: null })
    createAdminClientMock.mockReturnValue(client)

    const response = await POST(
      new Request('http://localhost/api/amethyst/customer-audience/unsubscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'jamie@example.com',
          unsubscribeEmail: true,
        }),
      }),
    )

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: 'Unsubscribe is temporarily unavailable right now.',
    })
  })

  it('resolves targeted unsubscribe requests from the current customer site rep', async () => {
    const { client, spies } = makeTargetedAdminClient()
    createAdminClientMock.mockReturnValue(client)
    unsubscribeCustomerAudienceByContactMock.mockResolvedValueOnce({
      updatedCount: 1,
      smsUpdatedCount: 0,
      emailUpdatedCount: 1,
    })

    const response = await POST(
      new Request(
        'http://localhost/api/amethyst/customer-audience/unsubscribe?c=rep-clean',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            email: 'customer@example.com',
            unsubscribeEmail: true,
          }),
        },
      ),
    )

    expect(spies.repEq).toHaveBeenCalledWith('id', 'rep-clean')
    expect(unsubscribeCustomerAudienceByContactMock).toHaveBeenCalledWith(
      client,
      {
        repId: 'rep-clean',
        phone: '',
        email: 'customer@example.com',
        unsubscribeSms: false,
        unsubscribeEmail: true,
      },
    )
    expect(response.status).toBe(200)
  })
})
