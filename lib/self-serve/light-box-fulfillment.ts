import { sendLouisAlert } from '@/lib/ops/louis-alerts'
import { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

export interface CreateLightBoxFulfillmentTaskInput {
  repId: string
  repEmail: string | null
  repName: string | null
  stripeCheckoutSessionId: string
  stripeSubscriptionId: string | null
  paidAtIso: string
  shippingName: string | null
  shippingAddress: Record<string, unknown>
}

export interface CreateLightBoxFulfillmentTaskResult {
  created: boolean
  skipped: boolean
}

interface ExistingLightBoxTask {
  status: string
  alert_sent_at: string | null
}

function formatRepLine(input: CreateLightBoxFulfillmentTaskInput) {
  const name = input.repName?.trim() || 'Unknown rep'
  const email = input.repEmail?.trim()
  return email ? `Rep: ${name} <${email}>` : `Rep: ${name}`
}

function formatShippingAddress(address: Record<string, unknown>) {
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim())

  return parts.length > 0 ? parts.join(', ') : 'Not provided'
}

function buildLightBoxAlert(input: CreateLightBoxFulfillmentTaskInput, dueAt: string) {
  return {
    title: 'Order light box within 24 hours',
    severity: 'info' as const,
    lines: [
      formatRepLine(input),
      `Rep ID: ${input.repId}`,
      `Checkout: ${input.stripeCheckoutSessionId}`,
      `Paid: ${input.paidAtIso}`,
      `Due: ${dueAt}`,
      `Ship to: ${input.shippingName ?? 'Name not provided'}`,
      formatShippingAddress(input.shippingAddress),
    ],
  }
}

async function updateLightBoxAlertState(
  admin: AdminClient,
  stripeCheckoutSessionId: string,
  values: Record<string, string | null>,
) {
  const { error } = await admin
    .from('light_box_fulfillment_tasks')
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_checkout_session_id', stripeCheckoutSessionId)

  if (error) throw error
}

export async function createLightBoxFulfillmentTask(
  input: CreateLightBoxFulfillmentTaskInput,
  admin: AdminClient = createAdminClient(),
): Promise<CreateLightBoxFulfillmentTaskResult> {
  const dueAt = new Date(
    new Date(input.paidAtIso).getTime() + 24 * 60 * 60 * 1000,
  ).toISOString()
  const now = new Date().toISOString()
  const { data: existing, error: existingError } = await admin
    .from('light_box_fulfillment_tasks')
    .select('status, alert_sent_at')
    .eq('stripe_checkout_session_id', input.stripeCheckoutSessionId)
    .maybeSingle<ExistingLightBoxTask>()

  if (existingError) throw existingError
  if (existing && existing.status !== 'needs_order') {
    return { created: false, skipped: true }
  }

  const { error } = await admin.from('light_box_fulfillment_tasks').upsert(
    {
      rep_id: input.repId,
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      stripe_subscription_id: input.stripeSubscriptionId,
      status: 'needs_order',
      shipping_name: input.shippingName,
      shipping_address: input.shippingAddress,
      due_at: dueAt,
      updated_at: now,
    },
    { onConflict: 'stripe_checkout_session_id' },
  )

  if (error) throw error

  if (existing?.alert_sent_at) {
    return { created: false, skipped: false }
  }

  try {
    const alertResult = await sendLouisAlert(buildLightBoxAlert(input, dueAt))
    if (!alertResult.delivered) {
      await updateLightBoxAlertState(admin, input.stripeCheckoutSessionId, {
        alert_error: alertResult.reason,
      })
      return { created: !existing, skipped: false }
    }
  } catch (error) {
    try {
      await updateLightBoxAlertState(admin, input.stripeCheckoutSessionId, {
        alert_error: error instanceof Error ? error.message : 'Unknown error',
      })
    } catch (updateError) {
      console.error('[light-box-fulfillment] Failed to record alert error:', updateError)
    }
    throw error
  }

  try {
    await updateLightBoxAlertState(admin, input.stripeCheckoutSessionId, {
      alert_sent_at: new Date().toISOString(),
      alert_error: null,
    })
  } catch (error) {
    console.error('[light-box-fulfillment] Failed to record alert delivery:', error)
  }

  return { created: !existing, skipped: false }
}
