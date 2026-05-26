import type { LiveQueueSnapshot } from '@/lib/services/types'

export type LiveShowSmokeQueueState = 'fresh' | 'stale' | 'empty'

export type LiveShowSmokeStepId =
  | 'pre_show_reminders'
  | 'live_queue_snapshot'
  | 'customer_site_action'
  | 'nic_nac_show_session_event'
  | 'fulfillment_status'

export interface LiveShowSmokeProviderActions {
  sendSms: false
  sendEmail: false
  chargeStripe: false
  sendSignWellLiveAgreement: false
  callPhotoroom: false
  callPostHog: false
}

export interface LiveShowSmokeStep {
  id: LiveShowSmokeStepId
  label: string
  ok: boolean
  providerAction: false
  details: Record<string, unknown>
}

export interface LiveShowSmokeReport {
  ok: boolean
  queueState: LiveShowSmokeQueueState
  steps: LiveShowSmokeStep[]
  providerActions: LiveShowSmokeProviderActions
  nextEvidenceSuggestions: string[]
}

export interface LiveShowSmokePreShowReminderPlan {
  dryRun: boolean
  plannedCount: number
  plans?: unknown[]
}

export interface LiveShowSmokeCustomerSiteAction {
  action: string
  requestId: string
  listingId?: string
  customerName: string
}

export interface LiveShowSmokeShowSessionEvent {
  eventId: string
  eventType: string
  summary: string
}

export interface LiveShowSmokeFulfillmentStatus {
  status: string
  fulfillmentId?: string
  requestId?: string
  nextAction?: string
}

export interface LiveShowSmokeDependencyInput {
  repId: string
  sessionId: string
  syncCode?: string
  now: Date
  providerFree: true
}

export interface LiveShowSmokeDependencies {
  buildPreShowReminderPlan?: (
    input: LiveShowSmokeDependencyInput,
  ) => Promise<LiveShowSmokePreShowReminderPlan>
  loadLiveQueueSnapshot?: (
    input: LiveShowSmokeDependencyInput,
  ) => Promise<LiveQueueSnapshot | null>
  submitCustomerSiteAction?: (
    input: LiveShowSmokeDependencyInput & {
      customerName: string
      listingId: string
      customerDescription: string
    },
  ) => Promise<LiveShowSmokeCustomerSiteAction>
  recordShowSessionEvent?: (
    input: LiveShowSmokeDependencyInput & {
      eventType: 'customer_request'
      summary: string
      payload: Record<string, unknown>
    },
  ) => Promise<LiveShowSmokeShowSessionEvent>
  loadFulfillmentStatus?: (
    input: LiveShowSmokeDependencyInput & {
      requestId: string
      customerName: string
    },
  ) => Promise<LiveShowSmokeFulfillmentStatus>
}

export interface LiveShowSmokeInput {
  repId: string
  sessionId: string
  syncCode?: string
  now?: Date
  listingId?: string
  customerDescription?: string
  dependencies?: LiveShowSmokeDependencies & Record<string, unknown>
}

const PROVIDER_ACTIONS: LiveShowSmokeProviderActions = {
  sendSms: false,
  sendEmail: false,
  chargeStripe: false,
  sendSignWellLiveAgreement: false,
  callPhotoroom: false,
  callPostHog: false,
}

function baseDependencyInput(
  input: LiveShowSmokeInput,
): LiveShowSmokeDependencyInput {
  return {
    repId: input.repId,
    sessionId: input.sessionId,
    syncCode: input.syncCode,
    now: input.now ?? new Date(),
    providerFree: true,
  }
}

function step(
  id: LiveShowSmokeStepId,
  label: string,
  ok: boolean,
  details: Record<string, unknown>,
): LiveShowSmokeStep {
  return {
    id,
    label,
    ok,
    providerAction: false,
    details,
  }
}

function classifyQueue(
  snapshot: LiveQueueSnapshot | null,
): LiveShowSmokeQueueState {
  if (!snapshot || snapshot.queueLength === 0) return 'empty'
  return snapshot.isFresh ? 'fresh' : 'stale'
}

async function defaultPreShowReminderPlan() {
  return {
    dryRun: true,
    plannedCount: 0,
    plans: [],
  }
}

async function defaultLiveQueueSnapshot() {
  return null
}

async function defaultCustomerSiteAction(
  input: LiveShowSmokeDependencyInput & {
    customerName: string
    listingId: string
    customerDescription: string
  },
) {
  return {
    action: 'trade_request_submitted',
    requestId: `provider-free-${input.sessionId}`,
    listingId: input.listingId,
    customerName: input.customerName,
  }
}

async function defaultShowSessionEvent(
  input: LiveShowSmokeDependencyInput & {
    eventType: 'customer_request'
    summary: string
    payload: Record<string, unknown>
  },
) {
  return {
    eventId: `provider-free-${input.sessionId}`,
    eventType: input.eventType,
    summary: input.summary,
  }
}

async function defaultFulfillmentStatus(
  input: LiveShowSmokeDependencyInput & {
    requestId: string
    customerName: string
  },
): Promise<LiveShowSmokeFulfillmentStatus> {
  return {
    status: 'approved',
    requestId: input.requestId,
    nextAction: 'ship_trade',
  }
}

function evidenceSuggestions(queueState: LiveShowSmokeQueueState): string[] {
  const suggestions = [
    'Attach this report to the live-show Phase 11 evidence bundle.',
    'Keep the providerActions block in the smoke artifact for launch signoff.',
  ]

  if (queueState === 'empty') {
    suggestions.push(
      'Capture a fresh live queue snapshot with at least one customer before launch signoff.',
    )
  }

  if (queueState === 'stale') {
    suggestions.push(
      'Refresh the live queue sync and rerun the composed smoke while the queue is fresh.',
    )
  }

  return suggestions
}

export async function runLiveShowSmoke(
  input: LiveShowSmokeInput,
): Promise<LiveShowSmokeReport> {
  const dependencies = input.dependencies ?? {}
  const dependencyInput = baseDependencyInput(input)
  const steps: LiveShowSmokeStep[] = []

  const reminderPlan = await (
    dependencies.buildPreShowReminderPlan ?? defaultPreShowReminderPlan
  )(dependencyInput)
  steps.push(
    step('pre_show_reminders', 'Pre-show reminder plan', true, {
      dryRun: reminderPlan.dryRun,
      plannedCount: reminderPlan.plannedCount,
      providerFree: true,
    }),
  )

  const queueSnapshot = await (
    dependencies.loadLiveQueueSnapshot ?? defaultLiveQueueSnapshot
  )(dependencyInput)
  const queueState = classifyQueue(queueSnapshot)
  steps.push(
    step(
      'live_queue_snapshot',
      'Live queue snapshot',
      queueState === 'fresh',
      {
        queueState,
        syncCode: queueSnapshot?.syncCode ?? input.syncCode ?? null,
        queueLength: queueSnapshot?.queueLength ?? 0,
        currentCustomer: queueSnapshot?.currentCustomer ?? null,
        ageSeconds: queueSnapshot?.ageSeconds ?? null,
      },
    ),
  )

  if (queueState === 'empty' || !queueSnapshot?.currentCustomer) {
    return {
      ok: false,
      queueState,
      steps,
      providerActions: PROVIDER_ACTIONS,
      nextEvidenceSuggestions: evidenceSuggestions(queueState),
    }
  }

  const customerName = queueSnapshot.currentCustomer
  const customerAction = await (
    dependencies.submitCustomerSiteAction ?? defaultCustomerSiteAction
  )({
    ...dependencyInput,
    customerName,
    listingId: input.listingId ?? 'provider-free-live-show-listing',
    customerDescription:
      input.customerDescription ??
      `Provider-free live-show smoke request for ${customerName}.`,
  })
  steps.push(
    step('customer_site_action', 'Customer-site trade/request action', true, {
      action: customerAction.action,
      requestId: customerAction.requestId,
      listingId: customerAction.listingId ?? null,
      customerName: customerAction.customerName,
    }),
  )

  const eventSummary = `${customerName} requested a trade during the provider-free live-show smoke.`
  const showSessionEvent = await (
    dependencies.recordShowSessionEvent ?? defaultShowSessionEvent
  )({
    ...dependencyInput,
    eventType: 'customer_request',
    summary: eventSummary,
    payload: {
      providerFree: true,
      queueState,
      queue: queueSnapshot.queue,
      requestId: customerAction.requestId,
      listingId: customerAction.listingId ?? null,
      customerName,
    },
  })
  steps.push(
    step(
      'nic_nac_show_session_event',
      'Nic-Nac show-session event',
      true,
      {
        eventId: showSessionEvent.eventId,
        eventType: showSessionEvent.eventType,
        summary: showSessionEvent.summary,
      },
    ),
  )

  const fulfillmentStatus = await (
    dependencies.loadFulfillmentStatus ?? defaultFulfillmentStatus
  )({
    ...dependencyInput,
    requestId: customerAction.requestId,
    customerName,
  })
  steps.push(
    step('fulfillment_status', 'Fulfillment/post-show status', true, {
      status: fulfillmentStatus.status,
      fulfillmentId: fulfillmentStatus.fulfillmentId ?? null,
      requestId: fulfillmentStatus.requestId ?? customerAction.requestId,
      nextAction: fulfillmentStatus.nextAction ?? null,
    }),
  )

  return {
    ok: queueState === 'fresh' && steps.every((item) => item.ok),
    queueState,
    steps,
    providerActions: PROVIDER_ACTIONS,
    nextEvidenceSuggestions: evidenceSuggestions(queueState),
  }
}
