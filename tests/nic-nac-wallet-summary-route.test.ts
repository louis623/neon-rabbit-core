import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedRepMock = vi.fn()
const getWalletDashboardMock = vi.fn()

vi.mock('@/lib/nic-nac/auth', () => ({
  AuthError: class AuthError extends Error {},
  getPaidNicNacContext: (...args: unknown[]) =>
    getAuthenticatedRepMock(...args),
}))

vi.mock('@/lib/services/wallet-dashboard', () => ({
  getWalletDashboard: (...args: unknown[]) => getWalletDashboardMock(...args),
}))

import { GET } from '@/app/api/nic-nac/wallet-summary/route'
import { AuthError } from '@/lib/nic-nac/auth'

describe('GET /api/nic-nac/wallet-summary', () => {
  beforeEach(() => {
    getAuthenticatedRepMock.mockReset()
    getWalletDashboardMock.mockReset()
  })

  it('returns the authenticated rep wallet summary', async () => {
    getAuthenticatedRepMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { id: 'rep-1' },
    })
    getWalletDashboardMock.mockResolvedValueOnce({
      balanceMils: 24991,
      balanceUsd: 24.991,
      estimatedTextsRemaining: 2776,
      messagesSentThisMonth: 7,
      messagesSpendThisMonthMils: 63,
      messagesSpendThisMonthUsd: 0.063,
      autoRechargeEnabled: true,
      autoRechargePending: false,
      autoRechargeThresholdMils: 5000,
      autoRechargeThresholdUsd: 5,
      autoRechargeAmountMils: 25000,
      autoRechargeAmountUsd: 25,
      minimumLoadAmountMils: 25000,
      minimumLoadAmountUsd: 25,
      lastLoadedAt: '2026-05-05T12:00:00Z',
      recentTransactions: [
        {
          id: 'tx-1',
          type: 'load',
          amountMils: 25000,
          description: 'Wallet load',
          createdAt: '2026-05-05T12:00:00Z',
        },
      ],
    })

    const response = await GET(
      new Request('http://localhost/api/nic-nac/wallet-summary?limit=5'),
    )

    expect(getWalletDashboardMock).toHaveBeenCalledWith('rep-1', { limit: 5 })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      balanceMils: 24991,
      balanceUsd: 24.991,
      estimatedTextsRemaining: 2776,
      messagesSentThisMonth: 7,
      messagesSpendThisMonthMils: 63,
      messagesSpendThisMonthUsd: 0.063,
      autoRechargeEnabled: true,
      autoRechargePending: false,
      autoRechargeThresholdMils: 5000,
      autoRechargeThresholdUsd: 5,
      autoRechargeAmountMils: 25000,
      autoRechargeAmountUsd: 25,
      minimumLoadAmountMils: 25000,
      minimumLoadAmountUsd: 25,
      lastLoadedAt: '2026-05-05T12:00:00Z',
      recentTransactions: [
        {
          id: 'tx-1',
          type: 'load',
          amountMils: 25000,
          description: 'Wallet load',
          createdAt: '2026-05-05T12:00:00Z',
        },
      ],
    })
  })

  it('returns 400 for an invalid limit', async () => {
    const response = await GET(
      new Request('http://localhost/api/nic-nac/wallet-summary?limit=nope'),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'limit must be a whole number.',
    })
  })

  it('returns 401 when the rep is not signed in', async () => {
    getAuthenticatedRepMock.mockRejectedValueOnce(new AuthError('Not authenticated'))

    const response = await GET(
      new Request('http://localhost/api/nic-nac/wallet-summary'),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: 'unauthenticated',
    })
  })
})
