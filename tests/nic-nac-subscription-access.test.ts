import { describe, expect, it, vi } from 'vitest'

import {
  assertPaidWorkspaceAccess,
  hasPaidWorkspaceAccess,
} from '@/lib/nic-nac/subscription-access'

function createSubscriptionClient(result: {
  data: { id: string; status: string } | null
  error: unknown
}) {
  const maybeSingle = vi.fn().mockResolvedValue(result)
  const limit = vi.fn(() => ({ maybeSingle }))
  const order = vi.fn(() => ({ limit }))
  const inFilter = vi.fn(() => ({ order }))
  const eq = vi.fn(() => ({ in: inFilter }))
  const select = vi.fn(() => ({ eq }))
  const from = vi.fn(() => ({ select }))

  return {
    client: { from },
    from,
    select,
    eq,
    inFilter,
    order,
    limit,
    maybeSingle,
  }
}

describe('Nic-Nac subscription access', () => {
  it('allows paid workspace access for an active subscription row', async () => {
    const supabase = createSubscriptionClient({
      data: { id: 'sub-1', status: 'active' },
      error: null,
    })

    await expect(
      hasPaidWorkspaceAccess(supabase.client as never, 'rep-1'),
    ).resolves.toBe(true)

    expect(supabase.from).toHaveBeenCalledWith('subscriptions')
    expect(supabase.select).toHaveBeenCalledWith('id, status')
    expect(supabase.eq).toHaveBeenCalledWith('rep_id', 'rep-1')
    expect(supabase.inFilter).toHaveBeenCalledWith('status', [
      'active',
      'trialing',
      'past_due',
    ])
  })

  it('denies paid workspace access when the rep has no active subscription', async () => {
    const supabase = createSubscriptionClient({
      data: null,
      error: null,
    })

    await expect(
      hasPaidWorkspaceAccess(supabase.client as never, 'rep-1'),
    ).resolves.toBe(false)
    await expect(
      assertPaidWorkspaceAccess(supabase.client as never, 'rep-1'),
    ).rejects.toMatchObject({
      code: 'SPARKLE_SUBSCRIPTION_REQUIRED',
      statusCode: 402,
    })
  })

  it('raises a service error when subscription lookup fails', async () => {
    const supabase = createSubscriptionClient({
      data: null,
      error: { message: 'database unavailable' },
    })

    await expect(
      assertPaidWorkspaceAccess(supabase.client as never, 'rep-1'),
    ).rejects.toMatchObject({
      code: 'SPARKLE_SUBSCRIPTION_LOOKUP_FAILED',
      statusCode: 500,
    })
  })
})
