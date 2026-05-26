export type CancellationSmokeState =
  | 'ends_at_period_end'
  | 'already_cancelled'
  | 'not_scheduled'
  | 'missing'

export type CancellationSmokeStepId =
  | 'load_subscription_state'
  | 'end_of_period_state'
  | 'stripe_live_guard'

export interface CancellationSmokeProviderActions {
  retrieveStripeSubscription: false
  cancelStripeSubscription: false
  createStripeRefund: false
  createBillingPortalSession: false
  constructStripeWebhook: false
}

export interface CancellationSmokeStep {
  id: CancellationSmokeStepId
  label: string
  ok: boolean
  providerAction: false
  details: Record<string, unknown>
}

export interface CancellationSmokeSubscriptionState {
  repId: string
  status: string
  planType: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  cancelledAt: string | null
  livemode: boolean
}

export interface CancellationSmokeReport {
  ok: boolean
  cancellationState: CancellationSmokeState
  steps: CancellationSmokeStep[]
  providerActions: CancellationSmokeProviderActions
  nextEvidenceSuggestions: string[]
}

export interface CancellationSmokeDependencyInput {
  repId: string
  now: Date
  providerFree: true
}

export interface CancellationSmokeDependencies {
  loadSubscriptionState?: (
    input: CancellationSmokeDependencyInput,
  ) => Promise<CancellationSmokeSubscriptionState | null>
}

export interface CancellationSmokeInput {
  repId: string
  now?: Date
  dependencies?: CancellationSmokeDependencies & Record<string, unknown>
}

const PROVIDER_ACTIONS: CancellationSmokeProviderActions = {
  retrieveStripeSubscription: false,
  cancelStripeSubscription: false,
  createStripeRefund: false,
  createBillingPortalSession: false,
  constructStripeWebhook: false,
}

function step(
  id: CancellationSmokeStepId,
  label: string,
  ok: boolean,
  details: Record<string, unknown>,
): CancellationSmokeStep {
  return {
    id,
    label,
    ok,
    providerAction: false,
    details,
  }
}

async function defaultSubscriptionState() {
  return null
}

function classifyCancellationState(
  subscription: CancellationSmokeSubscriptionState | null,
): CancellationSmokeState {
  if (!subscription) return 'missing'
  if (subscription.status === 'cancelled' || subscription.cancelledAt) {
    return 'already_cancelled'
  }
  if (subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd) {
    return 'ends_at_period_end'
  }
  return 'not_scheduled'
}

function evidenceSuggestions(state: CancellationSmokeState): string[] {
  const suggestions = [
    'Attach this report to the cancellation Phase 11 evidence bundle.',
    'Keep the providerActions block in the smoke artifact for launch signoff.',
  ]

  if (state === 'missing') {
    suggestions.push(
      'Seed or select a test subscription row before using this as launch evidence.',
    )
  }

  if (state === 'not_scheduled') {
    suggestions.push(
      'Use an offline/test-mode subscription that has cancelAtPeriodEnd=true before launch signoff.',
    )
  }

  return suggestions
}

export async function runCancellationSmoke(
  input: CancellationSmokeInput,
): Promise<CancellationSmokeReport> {
  const dependencies = input.dependencies ?? {}
  const dependencyInput: CancellationSmokeDependencyInput = {
    repId: input.repId,
    now: input.now ?? new Date(),
    providerFree: true,
  }

  const subscription = await (
    dependencies.loadSubscriptionState ?? defaultSubscriptionState
  )(dependencyInput)
  const cancellationState = classifyCancellationState(subscription)
  const liveStripeBlocked = subscription?.livemode !== true

  const steps: CancellationSmokeStep[] = [
    step('load_subscription_state', 'Load subscription state', Boolean(subscription), {
      repId: input.repId,
      providerFree: true,
      found: Boolean(subscription),
      status: subscription?.status ?? null,
      planType: subscription?.planType ?? null,
    }),
    step(
      'end_of_period_state',
      'End-of-period cancellation state',
      cancellationState === 'ends_at_period_end',
      {
        cancellationState,
        currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
        cancelledAt: subscription?.cancelledAt ?? null,
      },
    ),
    step('stripe_live_guard', 'Stripe live-call guard', liveStripeBlocked, {
      providerFree: true,
      stripeLivemode: subscription?.livemode ?? null,
      liveStripeCallsAllowed: false,
    }),
  ]

  return {
    ok: steps.every((item) => item.ok),
    cancellationState,
    steps,
    providerActions: PROVIDER_ACTIONS,
    nextEvidenceSuggestions: evidenceSuggestions(cancellationState),
  }
}
