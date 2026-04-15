import { after } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe/client'

const SMS_CHARGE_CENTS = 9

export interface WalletRow {
  id: string
  rep_id: string
  balance_cents: number
  auto_recharge_enabled: boolean
  auto_recharge_threshold_cents: number
  auto_recharge_amount_cents: number
  minimum_load_amount_cents: number
  auto_recharge_pending: boolean
  auto_recharge_attempt_id: string | null
  last_loaded_at: string | null
  created_at: string
  updated_at: string
}

export async function ensureWallet(repId: string): Promise<WalletRow> {
  const admin = createAdminClient()
  const { error: upsertError } = await admin
    .from('sms_wallet')
    .upsert({ rep_id: repId }, { onConflict: 'rep_id', ignoreDuplicates: true })
  if (upsertError) {
    throw upsertError
  }

  const { data, error } = await admin
    .from('sms_wallet')
    .select('*')
    .eq('rep_id', repId)
    .single()
  if (error || !data) {
    throw error ?? new Error('WALLET_NOT_FOUND_AFTER_ENSURE')
  }
  return data as WalletRow
}

export async function deductSmsCharge(
  repId: string
): Promise<{ success: boolean; new_balance_cents: number }> {
  const admin = createAdminClient()
  const wallet = await ensureWallet(repId)

  const { data, error } = await admin.rpc('deduct_wallet_balance', {
    p_wallet_id: wallet.id,
    p_amount: SMS_CHARGE_CENTS,
  })

  if (error) {
    if (/INSUFFICIENT_FUNDS/.test(error.message)) {
      // Fresh read — do not return the stale pre-RPC value.
      const { data: fresh } = await admin
        .from('sms_wallet')
        .select('balance_cents')
        .eq('id', wallet.id)
        .single()
      return {
        success: false,
        new_balance_cents: fresh?.balance_cents ?? wallet.balance_cents,
      }
    }
    throw error
  }

  // Supabase RPCs returning TABLE come back as an array of one row.
  const row = Array.isArray(data) ? data[0] : data
  const newBalance = row?.new_balance_cents as number
  const shouldRecharge = Boolean(row?.should_recharge)
  const attemptId = row?.attempt_id as string | null

  if (shouldRecharge && attemptId) {
    after(() =>
      triggerAutoRecharge(wallet.id, repId, attemptId).catch((err: unknown) => {
        console.error('[wallet] auto-recharge failed', err)
      })
    )
  }

  return { success: true, new_balance_cents: newBalance }
}

async function releaseLock(walletId: string, attemptId: string): Promise<void> {
  const admin = createAdminClient()
  await admin.rpc('release_wallet_recharge_lock', {
    p_wallet_id: walletId,
    p_attempt_id: attemptId,
  })
}

async function triggerAutoRecharge(
  walletId: string,
  repId: string,
  attemptId: string
): Promise<void> {
  const admin = createAdminClient()

  // Fresh read — the wallet row may have changed since the deduct RPC returned.
  const { data: wallet, error: walletErr } = await admin
    .from('sms_wallet')
    .select('*')
    .eq('id', walletId)
    .single()
  if (walletErr || !wallet) {
    console.error('[wallet] auto-recharge aborted — wallet not found', walletId)
    return
  }
  if (wallet.auto_recharge_attempt_id !== attemptId) {
    console.warn('[wallet] auto-recharge aborted — attempt_id drift', { walletId, attemptId })
    return
  }

  // Customer id: prefer reps.stripe_customer_id; fall back to active|trialing subscription.
  let customerId: string | null = null
  const { data: rep } = await admin
    .from('reps')
    .select('stripe_customer_id')
    .eq('id', repId)
    .single()
  if (rep?.stripe_customer_id) {
    customerId = rep.stripe_customer_id
  } else {
    const { data: sub } = await admin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('rep_id', repId)
      .in('status', ['active', 'trialing'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    customerId = sub?.stripe_customer_id ?? null
  }

  if (!customerId) {
    console.warn('[wallet] auto-recharge skipped — no stripe_customer_id', { repId, walletId })
    await releaseLock(walletId, attemptId)
    return
  }

  const stripe = getStripe()

  // Resolve payment method: prefer customer.invoice_settings.default_payment_method,
  // fall back to an active|trialing subscription's default_payment_method.
  let paymentMethodId: string | null = null
  try {
    const customer = await stripe.customers.retrieve(customerId, {
      expand: ['invoice_settings.default_payment_method'],
    })
    if (!customer.deleted) {
      const pm = customer.invoice_settings?.default_payment_method
      paymentMethodId = typeof pm === 'string' ? pm : pm?.id ?? null
    }
  } catch (err) {
    console.error('[wallet] customer retrieve failed', err)
  }

  if (!paymentMethodId) {
    try {
      const subs = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 5,
      })
      const live = subs.data
        .filter((s) => s.status === 'active' || s.status === 'trialing')
        .sort((a, b) => b.created - a.created)[0]
      const pm = live?.default_payment_method
      paymentMethodId = typeof pm === 'string' ? pm : pm?.id ?? null
    } catch (err) {
      console.error('[wallet] subscription list failed', err)
    }
  }

  if (!paymentMethodId) {
    console.warn('[wallet] auto-recharge skipped — no payment method', { repId, walletId })
    await releaseLock(walletId, attemptId)
    return
  }

  try {
    await stripe.paymentIntents.create(
      {
        amount: wallet.auto_recharge_amount_cents,
        currency: 'usd',
        customer: customerId,
        payment_method: paymentMethodId,
        confirm: true,
        off_session: true,
        metadata: {
          rep_id: repId,
          wallet_id: walletId,
          auto_recharge: 'true',
          attempt_id: attemptId,
        },
      },
      { idempotencyKey: `auto-recharge-${attemptId}` }
    )
    // Credit happens in the webhook, not here.
  } catch (err) {
    console.error('[wallet] auto-recharge PI create failed', err)
    await releaseLock(walletId, attemptId)
  }
}
