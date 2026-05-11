import { beforeEach, describe, expect, it, vi } from 'vitest'

const createAdminClientMock = vi.fn()
const ensureWalletMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

vi.mock('@/lib/services/wallet', () => ({
  ensureWallet: (...args: unknown[]) => ensureWalletMock(...args),
}))

import { getWalletDashboard } from '@/lib/services/wallet-dashboard'

describe('getWalletDashboard', () => {
  beforeEach(() => {
    createAdminClientMock.mockReset()
    ensureWalletMock.mockReset()
  })

  it('returns wallet balance, monthly SMS totals, and recent transactions', async () => {
    ensureWalletMock.mockResolvedValueOnce({
      id: 'wallet-1',
      balance_mils: 24991,
      auto_recharge_enabled: true,
      auto_recharge_pending: false,
      auto_recharge_threshold_mils: 5000,
      auto_recharge_amount_mils: 25000,
      minimum_load_amount_mils: 25000,
      last_loaded_at: '2026-05-05T12:00:00Z',
    })

    const walletTransactionsQuery = {
      select: vi.fn(() => walletTransactionsQuery),
      eq: vi.fn(() => walletTransactionsQuery),
      order: vi.fn(() => walletTransactionsQuery),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'tx-1',
            type: 'load',
            amount_mils: 25000,
            description: 'Wallet load',
            created_at: '2026-05-05T12:00:00Z',
          },
        ],
        error: null,
      }),
    }

    const messageLogQuery = {
      select: vi.fn(() => messageLogQuery),
      eq: vi.fn(() => messageLogQuery),
      gte: vi.fn(() => messageLogQuery),
      lt: vi.fn().mockResolvedValue({
        data: [
          { cost: 0.009, delivery_status: 'queued' },
          { cost: 0.009, delivery_status: 'sent' },
          { cost: 0.009, delivery_status: 'failed' },
        ],
        error: null,
      }),
    }

    createAdminClientMock.mockReturnValue({
      from: (table: string) => {
        if (table === 'wallet_transactions') {
          return walletTransactionsQuery
        }

        if (table === 'message_log') {
          return messageLogQuery
        }

        throw new Error(`Unexpected table ${table}`)
      },
    })

    const result = await getWalletDashboard('rep-1', { limit: 5 })

    expect(result).toEqual({
      balanceMils: 24991,
      balanceUsd: 24.991,
      estimatedTextsRemaining: 2776,
      messagesSentThisMonth: 2,
      messagesSpendThisMonthMils: 18,
      messagesSpendThisMonthUsd: 0.018,
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
})
