import { describe, expect, it, vi } from 'vitest'

import {
  assertPaidWorkspaceAccess,
  hasPaidWorkspaceAccess,
} from '@/lib/nic-nac/subscription-access'

function createSubscriptionClient(result: {
  data: { id: string; status: string } | null
  error: unknown
}) {
  const subscriptionMaybeSingle = vi.fn().mockResolvedValue(result)
  const trialMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
  const eq = vi.fn(() => ({ maybeSingle: subscriptionMaybeSingle }))
  const select = vi.fn(() => ({ eq }))
  const from = vi.fn((table: string) => {
    if (table === 'subscriptions') return { select }
    if (table === 'workspace_trials') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle: trialMaybeSingle })),
        })),
      }
    }
    throw new Error(`Unexpected table ${table}`)
  })

  return {
    client: { from },
    from,
    select,
    eq,
    subscriptionMaybeSingle,
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
    expect(supabase.select).toHaveBeenCalledWith('status')
    expect(supabase.eq).toHaveBeenCalledWith('rep_id', 'rep-1')
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
      code: 'WORKSPACE_ACCESS_LOOKUP_FAILED',
      statusCode: 500,
    })
  })

  it('denies past-due subscription access', async () => {
    const supabase = createSubscriptionClient({
      data: { id: 'sub-1', status: 'past_due' },
      error: null,
    })

    await expect(
      hasPaidWorkspaceAccess(supabase.client as never, 'rep-1'),
    ).resolves.toBe(false)
  })
})
