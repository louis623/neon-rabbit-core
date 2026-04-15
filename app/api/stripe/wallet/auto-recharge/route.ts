import { NextResponse } from 'next/server'
import { getAuthenticatedRep, AuthError } from '@/lib/supabase/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { ensureWallet } from '@/lib/services/wallet'

interface Body {
  enabled?: unknown
  threshold_cents?: unknown
  amount_cents?: unknown
}

export async function POST(request: Request) {
  try {
    const { repId } = await getAuthenticatedRep()
    const body = (await request.json()) as Body

    if (typeof body.enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled must be a boolean' }, { status: 400 })
    }

    let thresholdCents: number | undefined
    if (body.threshold_cents !== undefined) {
      if (
        typeof body.threshold_cents !== 'number' ||
        !Number.isInteger(body.threshold_cents) ||
        body.threshold_cents < 0
      ) {
        return NextResponse.json(
          { error: 'threshold_cents must be a non-negative integer' },
          { status: 400 }
        )
      }
      thresholdCents = body.threshold_cents
    }

    let amountCents: number | undefined
    if (body.amount_cents !== undefined) {
      if (
        typeof body.amount_cents !== 'number' ||
        !Number.isInteger(body.amount_cents) ||
        body.amount_cents < 2500
      ) {
        return NextResponse.json(
          { error: 'amount_cents must be an integer >= 2500' },
          { status: 400 }
        )
      }
      amountCents = body.amount_cents
    }

    // Make sure a row exists — reps without a wallet row must still be able to configure settings.
    const wallet = await ensureWallet(repId)

    const mergedThreshold = thresholdCents ?? wallet.auto_recharge_threshold_cents
    const mergedAmount = amountCents ?? wallet.auto_recharge_amount_cents
    if (mergedAmount <= mergedThreshold) {
      return NextResponse.json(
        { error: 'amount_cents must be strictly greater than threshold_cents' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()
    const updates: Record<string, unknown> = {
      auto_recharge_enabled: body.enabled,
      updated_at: new Date().toISOString(),
    }
    if (thresholdCents !== undefined) updates.auto_recharge_threshold_cents = thresholdCents
    if (amountCents !== undefined) updates.auto_recharge_amount_cents = amountCents

    const { data, error } = await admin
      .from('sms_wallet')
      .update(updates)
      .eq('rep_id', repId)
      .select('auto_recharge_enabled, auto_recharge_threshold_cents, auto_recharge_amount_cents, minimum_load_amount_cents, balance_cents')
      .single()

    if (error || !data) {
      console.error('[stripe/wallet/auto-recharge] update failed', error)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json({ wallet: data })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('[stripe/wallet/auto-recharge] Error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
