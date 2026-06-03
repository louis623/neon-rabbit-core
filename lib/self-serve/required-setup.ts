type JsonObject = Record<string, unknown>

export const REQUIRED_SETUP_STEPS = [
  { id: 'account_basics', label: 'Account basics', required: true },
  { id: 'site_skin', label: 'Site skin', required: true },
  { id: 'welcome_copy', label: 'Welcome copy', required: true },
  { id: 'about_page', label: 'About page', required: true },
  { id: 'show_schedule', label: 'Show schedule', required: true },
  {
    id: 'customer_site_orientation',
    label: 'Customer site orientation',
    required: true,
  },
  {
    id: 'live_queue_orientation',
    label: 'Live queue orientation',
    required: true,
  },
  {
    id: 'trade_board_orientation',
    label: 'Trade board orientation',
    required: true,
  },
  {
    id: 'final_preview_approval',
    label: 'Final preview approval',
    required: true,
  },
] as const

export type RequiredSetupStepId = (typeof REQUIRED_SETUP_STEPS)[number]['id']

export type RequiredSetupStatus =
  | 'checkout_required'
  | 'payment_pending'
  | 'required_setup'
  | 'setup_blocked'
  | 'dashboard_unlocked'

export type RequiredSetupSessionRow = {
  id: string
  rep_id: string
  status: string | null
  current_step: string | null
  completed_steps: unknown
  answers: unknown
  generated_copy: unknown
  support_state: unknown
  dashboard_unlocked_at: string | null
  created_at: string | null
  updated_at: string | null
}

export type RequiredSetupState = {
  id: string | null
  repId: string | null
  status: RequiredSetupStatus
  currentStep: RequiredSetupStepId
  completedSteps: RequiredSetupStepId[]
  steps: typeof REQUIRED_SETUP_STEPS
  answers: JsonObject
  generatedCopy: JsonObject
  supportState: JsonObject
  dashboardUnlockedAt: string | null
  createdAt: string | null
  updatedAt: string | null
  nextStep: RequiredSetupStepId | null
  canUnlockDashboard: boolean
}

export type SaveRequiredSetupAnswerOptions = {
  generatedCopyPatch?: JsonObject
  supportStatePatch?: JsonObject
}

const REQUIRED_SETUP_STEP_IDS = REQUIRED_SETUP_STEPS.map((step) => step.id)
const REQUIRED_SETUP_STATUSES: RequiredSetupStatus[] = [
  'checkout_required',
  'payment_pending',
  'required_setup',
  'setup_blocked',
  'dashboard_unlocked',
]

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeJsonObject(value: unknown): JsonObject {
  return isJsonObject(value) ? value : {}
}

function normalizeRequiredSetupStatus(value: string | null | undefined) {
  return REQUIRED_SETUP_STATUSES.includes(value as RequiredSetupStatus)
    ? (value as RequiredSetupStatus)
    : 'checkout_required'
}

function normalizeCompletedSteps(value: unknown): RequiredSetupStepId[] {
  if (!Array.isArray(value)) return []

  return value.filter(
    (step, index, steps): step is RequiredSetupStepId =>
      isRequiredSetupStepId(step) && steps.indexOf(step) === index,
  )
}

function assertRequiredSetupStepId(value: unknown): asserts value is RequiredSetupStepId {
  if (!isRequiredSetupStepId(value)) {
    throw new Error(`Unsupported required setup step: ${String(value)}`)
  }
}

function mergeStepPatch(
  collection: unknown,
  stepId: RequiredSetupStepId,
  patch: JsonObject,
): JsonObject {
  const normalizedCollection = normalizeJsonObject(collection)
  const currentStepValue = normalizedCollection[stepId]
  const currentStepObject = normalizeJsonObject(currentStepValue)

  return {
    ...normalizedCollection,
    [stepId]: {
      ...currentStepObject,
      ...patch,
    },
  }
}

export function isRequiredSetupStepId(
  value: unknown,
): value is RequiredSetupStepId {
  return REQUIRED_SETUP_STEP_IDS.includes(value as RequiredSetupStepId)
}

export function getNextRequiredSetupStep(
  completedSteps: readonly unknown[],
): RequiredSetupStepId | null {
  const completed = new Set(normalizeCompletedSteps([...completedSteps]))
  return REQUIRED_SETUP_STEP_IDS.find((step) => !completed.has(step)) ?? null
}

export function canUnlockRequiredSetup(completedSteps: readonly unknown[]) {
  return getNextRequiredSetupStep(completedSteps) === null
}

export function normalizeRequiredSetupSession(
  row: RequiredSetupSessionRow | null | undefined,
): RequiredSetupState {
  if (!row) {
    const completedSteps: RequiredSetupStepId[] = []
    return {
      id: null,
      repId: null,
      status: 'checkout_required',
      currentStep: 'account_basics',
      completedSteps,
      steps: REQUIRED_SETUP_STEPS,
      answers: {},
      generatedCopy: {},
      supportState: {},
      dashboardUnlockedAt: null,
      createdAt: null,
      updatedAt: null,
      nextStep: getNextRequiredSetupStep(completedSteps),
      canUnlockDashboard: canUnlockRequiredSetup(completedSteps),
    }
  }

  const completedSteps = normalizeCompletedSteps(row.completed_steps)
  const nextStep = getNextRequiredSetupStep(completedSteps)

  return {
    id: row.id,
    repId: row.rep_id,
    status: normalizeRequiredSetupStatus(row.status),
    currentStep: isRequiredSetupStepId(row.current_step)
      ? row.current_step
      : 'account_basics',
    completedSteps,
    steps: REQUIRED_SETUP_STEPS,
    answers: normalizeJsonObject(row.answers),
    generatedCopy: normalizeJsonObject(row.generated_copy),
    supportState: normalizeJsonObject(row.support_state),
    dashboardUnlockedAt: row.dashboard_unlocked_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    nextStep,
    canUnlockDashboard: nextStep === null,
  }
}

async function loadRequiredSetupSessionRow(
  admin: ReturnType<
    typeof import('@/lib/supabase/admin')['createAdminClient']
  >,
  repId: string,
) {
  const { data, error } = await admin
    .from('self_serve_setup_sessions')
    .select('*')
    .eq('rep_id', repId)
    .maybeSingle()

  if (error) throw error
  return data as RequiredSetupSessionRow | null
}

async function updateRequiredSetupSession(
  admin: ReturnType<
    typeof import('@/lib/supabase/admin')['createAdminClient']
  >,
  repId: string,
  patch: Record<string, unknown>,
) {
  const { data, error } = await admin
    .from('self_serve_setup_sessions')
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq('rep_id', repId)
    .select('*')
    .single()

  if (error) throw error
  return normalizeRequiredSetupSession(data as RequiredSetupSessionRow)
}

function requireExistingRequiredSetupSession(
  row: RequiredSetupSessionRow | null,
  repId: string,
) {
  if (!row) {
    throw new Error(`Required setup session not found for rep ${repId}.`)
  }

  return row
}

export async function getRequiredSetupState(repId: string) {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()
  const row = await loadRequiredSetupSessionRow(admin, repId)
  return normalizeRequiredSetupSession(row)
}

export async function ensureRequiredSetupSession(
  repId: string,
  status: RequiredSetupStatus = 'checkout_required',
) {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()
  const existingRow = await loadRequiredSetupSessionRow(admin, repId)

  if (existingRow) {
    return normalizeRequiredSetupSession(existingRow)
  }

  const { data, error } = await admin
    .from('self_serve_setup_sessions')
    .insert(
      {
        rep_id: repId,
        status,
        current_step: 'account_basics',
        updated_at: new Date().toISOString(),
      },
    )
    .select('*')
    .single()

  if (error) throw error
  return normalizeRequiredSetupSession(data as RequiredSetupSessionRow)
}

export async function saveRequiredSetupAnswer(
  repId: string,
  stepId: RequiredSetupStepId,
  answerPatch: JsonObject,
  options: SaveRequiredSetupAnswerOptions = {},
) {
  assertRequiredSetupStepId(stepId)

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()
  const row = requireExistingRequiredSetupSession(
    await loadRequiredSetupSessionRow(admin, repId),
    repId,
  )
  const patch: Record<string, unknown> = {
    answers: mergeStepPatch(row.answers, stepId, answerPatch),
  }

  if (options.generatedCopyPatch) {
    patch.generated_copy = mergeStepPatch(
      row.generated_copy,
      stepId,
      options.generatedCopyPatch,
    )
  }

  if (options.supportStatePatch) {
    patch.support_state = mergeStepPatch(
      row.support_state,
      stepId,
      options.supportStatePatch,
    )
  }

  return updateRequiredSetupSession(admin, repId, patch)
}

export async function completeRequiredSetupStep(
  repId: string,
  stepId: RequiredSetupStepId,
  answerPatch?: JsonObject,
) {
  assertRequiredSetupStepId(stepId)

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()
  const row = requireExistingRequiredSetupSession(
    await loadRequiredSetupSessionRow(admin, repId),
    repId,
  )
  const completedSteps = normalizeCompletedSteps(row.completed_steps)
  const nextCompletedSteps = completedSteps.includes(stepId)
    ? completedSteps
    : [...completedSteps, stepId]
  const nextStep = getNextRequiredSetupStep(nextCompletedSteps)
  const patch: Record<string, unknown> = {
    status: 'required_setup',
    completed_steps: nextCompletedSteps,
    current_step: nextStep ?? stepId,
  }

  if (answerPatch) {
    patch.answers = mergeStepPatch(row.answers, stepId, answerPatch)
  }

  return updateRequiredSetupSession(admin, repId, patch)
}

export async function unlockRequiredSetup(repId: string) {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()
  const row = requireExistingRequiredSetupSession(
    await loadRequiredSetupSessionRow(admin, repId),
    repId,
  )
  const completedSteps = normalizeCompletedSteps(row.completed_steps)
  const state = normalizeRequiredSetupSession(row)

  if (!canUnlockRequiredSetup(completedSteps)) {
    throw new Error(
      'Required setup is incomplete; complete all required steps before unlocking dashboard.',
    )
  }

  if (state.status === 'dashboard_unlocked') {
    return state
  }

  if (state.status !== 'required_setup') {
    throw new Error(`Cannot unlock required setup from ${state.status}.`)
  }

  return updateRequiredSetupSession(admin, repId, {
    status: 'dashboard_unlocked',
    dashboard_unlocked_at: new Date().toISOString(),
  })
}
