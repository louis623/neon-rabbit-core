import type {
  WalletDashboardResult,
  WalletTransactionSummary,
} from '@/lib/services/types'
import { createAdminClient } from '@/lib/supabase/admin'
import { SMS_CHARGE_MILS, walletMilsToUsd } from './wallet-units'
import { ensureWallet } from './wallet'

type WalletTransactionRow = {
  id: string
  type: WalletTransactionSummary['type']
  amount_mils: number
  description: string | null
  created_at: string
}

type MessageLogRow = {
  cost: number | null
  delivery_status: string | null
}

function clampLimit(limit?: number) {
  if (!limit || !Number.isFinite(limit)) return 5
  return Math.max(1, Math.min(10, Math.trunc(limit)))
}

function getCurrentMonthBounds() {
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const nextMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  )

  return {
    monthStartIso: monthStart.toISOString(),
    nextMonthStartIso: nextMonthStart.toISOString(),
  }
}

export async function getWalletDashboard(
  repId: string,
  options?: { limit?: number },
): Promise<WalletDashboardResult> {
  const admin = createAdminClient()
  const wallet = await ensureWallet(repId)
  const limit = clampLimit(options?.limit)
  const { monthStartIso, nextMonthStartIso } = getCurrentMonthBounds()

  const { data, error } = await admin
    .from('wallet_transactions')
    .select('id, type, amount_mils, description, created_at')
    .eq('wallet_id', wallet.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  const recentTransactions = ((data ?? []) as WalletTransactionRow[]).map(
    (row) => ({
      id: row.id,
      type: row.type,
      amountMils: row.amount_mils,
      description: row.description,
      createdAt: row.created_at,
    }),
  )

  const { data: messageLogData, error: messageLogError } = await admin
    .from('message_log')
    .select('cost, delivery_status')
    .eq('rep_id', repId)
    .eq('channel', 'sms')
    .gte('created_at', monthStartIso)
    .lt('created_at', nextMonthStartIso)

  if (messageLogError) {
    throw messageLogError
  }

  const deliveredOrAcceptedMessages = ((messageLogData ?? []) as MessageLogRow[]).filter(
    (row) => row.delivery_status !== 'failed',
  )
  const messagesSpendThisMonthMils = deliveredOrAcceptedMessages.reduce(
    (total, row) => total + Math.round((row.cost ?? 0) * 1000),
    0,
  )

  return {
    balanceMils: wallet.balance_mils,
    balanceUsd: walletMilsToUsd(wallet.balance_mils),
    estimatedTextsRemaining: Math.floor(wallet.balance_mils / SMS_CHARGE_MILS),
    messagesSentThisMonth: deliveredOrAcceptedMessages.length,
    messagesSpendThisMonthMils,
    messagesSpendThisMonthUsd: walletMilsToUsd(messagesSpendThisMonthMils),
    autoRechargeEnabled: wallet.auto_recharge_enabled,
    autoRechargePending: wallet.auto_recharge_pending,
    autoRechargeThresholdMils: wallet.auto_recharge_threshold_mils,
    autoRechargeThresholdUsd: walletMilsToUsd(wallet.auto_recharge_threshold_mils),
    autoRechargeAmountMils: wallet.auto_recharge_amount_mils,
    autoRechargeAmountUsd: walletMilsToUsd(wallet.auto_recharge_amount_mils),
    minimumLoadAmountMils: wallet.minimum_load_amount_mils,
    minimumLoadAmountUsd: walletMilsToUsd(wallet.minimum_load_amount_mils),
    lastLoadedAt: wallet.last_loaded_at,
    recentTransactions,
  }
}
