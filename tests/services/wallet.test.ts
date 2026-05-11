import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const createAdminClientMock = vi.fn()
const afterMock = vi.fn()

vi.mock('next/server', () => ({
  after: (...args: unknown[]) => afterMock(...args),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

vi.mock('@/lib/stripe/client', () => ({
  getStripe: vi.fn(),
}))

import {
  deductSmsCharge,
  ensureWallet,
  refundSmsCharge,
} from '@/lib/services/wallet'
import { SMS_CHARGE_MILS } from '@/lib/services/wallet-units'

const walletRow = {
  id: 'wallet-1',
  rep_id: 'rep-1',
  balance_mils: 25000,
  auto_recharge_enabled: true,
  auto_recharge_threshold_mils: 5000,
  auto_recharge_amount_mils: 25000,
  minimum_load_amount_mils: 25000,
  auto_recharge_pending: false,
  auto_recharge_attempt_id: null,
  last_loaded_at: null,
  created_at: '2026-05-07T00:00:00Z',
  updated_at: '2026-05-07T00:00:00Z',
}

function makeWalletTable(singleResults: Array<{ data: unknown; error: unknown }>) {
  const single = vi.fn()
  for (const result of singleResults) {
    single.mockResolvedValueOnce(result)
  }

  const eq = vi.fn(() => ({ single }))
  const select = vi.fn(() => ({ eq }))
  const upsert = vi.fn().mockResolvedValue({ error: null })

  return {
    table: {
      select,
      upsert,
    },
    select,
    eq,
    single,
    upsert,
  }
}

describe('wallet service', () => {
  beforeEach(() => {
    createAdminClientMock.mockReset()
    afterMock.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('ensures the wallet exists and returns the wallet row', async () => {
    const walletTable = makeWalletTable([{ data: walletRow, error: null }])
    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'sms_wallet') {
          return walletTable.table
        }
        throw new Error(`Unexpected table ${table}`)
      }),
    })

    const result = await ensureWallet('rep-1')

    expect(walletTable.upsert).toHaveBeenCalledWith(
      { rep_id: 'rep-1' },
      { onConflict: 'rep_id', ignoreDuplicates: true },
    )
    expect(walletTable.select).toHaveBeenCalledWith('*')
    expect(walletTable.eq).toHaveBeenCalledWith('rep_id', 'rep-1')
    expect(result).toEqual(walletRow)
  })

  it('deducts one SMS charge atomically and returns the new balance', async () => {
    const walletTable = makeWalletTable([{ data: walletRow, error: null }])
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          new_balance_mils: 24991,
          should_recharge: false,
          attempt_id: null,
        },
      ],
      error: null,
    })

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'sms_wallet') {
          return walletTable.table
        }
        throw new Error(`Unexpected table ${table}`)
      }),
      rpc,
    })

    const result = await deductSmsCharge('rep-1')

    expect(rpc).toHaveBeenCalledWith('deduct_wallet_balance', {
      p_wallet_id: 'wallet-1',
      p_amount: SMS_CHARGE_MILS,
    })
    expect(afterMock).not.toHaveBeenCalled()
    expect(result).toEqual({
      success: true,
      new_balance_mils: 24991,
    })
  })

  it('returns a fresh balance when the debit RPC reports insufficient funds', async () => {
    const walletTable = makeWalletTable([
      { data: walletRow, error: null },
      { data: { balance_mils: 8 }, error: null },
    ])
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: new Error('INSUFFICIENT_FUNDS: balance=8 amount=9'),
    })

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'sms_wallet') {
          return walletTable.table
        }
        throw new Error(`Unexpected table ${table}`)
      }),
      rpc,
    })

    const result = await deductSmsCharge('rep-1')

    expect(result).toEqual({
      success: false,
      new_balance_mils: 8,
    })
    expect(afterMock).not.toHaveBeenCalled()
  })

  it('credits a refund back to the wallet through the credit RPC', async () => {
    const walletTable = makeWalletTable([{ data: walletRow, error: null }])
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          new_balance_mils: 25000,
          credited: true,
        },
      ],
      error: null,
    })

    createAdminClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'sms_wallet') {
          return walletTable.table
        }
        throw new Error(`Unexpected table ${table}`)
      }),
      rpc,
    })

    const result = await refundSmsCharge('rep-1', 'SMS refund after send failure')

    expect(rpc).toHaveBeenCalledWith('credit_wallet', {
      p_wallet_id: 'wallet-1',
      p_rep_id: 'rep-1',
      p_amount: SMS_CHARGE_MILS,
      p_type: 'refund',
      p_stripe_pi: null,
      p_stripe_fee: null,
      p_description: 'SMS refund after send failure',
      p_attempt_id: null,
    })
    expect(result).toEqual({
      new_balance_mils: 25000,
      credited: true,
    })
  })
})
