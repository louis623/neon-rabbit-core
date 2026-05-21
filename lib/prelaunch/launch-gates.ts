import { createAdminClient } from '@/lib/supabase/admin'
import { buildPrelaunchLaunchBuildReadiness } from '@/lib/prelaunch/launch-builds'

type AdminClient = ReturnType<typeof createAdminClient>

export type PrelaunchLaunchGateKey = 'payment' | 'agreement'
export type PrelaunchLaunchGateMode = 'test' | 'sandbox'
export type PrelaunchLaunchGateStatus = 'disabled' | 'ready'

export interface PrelaunchLaunchGateDefinition {
  key: PrelaunchLaunchGateKey
  label: string
  mode: PrelaunchLaunchGateMode
  detail: string
}

export interface PrelaunchLaunchGateRow {
  id: string
  launch_build_id: string
  gate_key: PrelaunchLaunchGateKey
  label: string
  mode: PrelaunchLaunchGateMode
  status: PrelaunchLaunchGateStatus
  notes: string
  updated_by_rep_id: string | null
  created_at: string
  updated_at: string
}

export interface PrelaunchLaunchGate {
  id: string | null
  launchBuildId: string
  gateKey: PrelaunchLaunchGateKey
  label: string
  mode: PrelaunchLaunchGateMode
  detail?: string
  status: PrelaunchLaunchGateStatus
  notes: string
  updatedByRepId: string | null
  createdAt: string | null
  updatedAt: string | null
}

interface UpsertPrelaunchLaunchGateInput {
  launchBuildId: string
  gateKey: string
  status?: PrelaunchLaunchGateStatus
  notes?: string
  operatorRepId?: string | null
}

interface LaunchBuildGateRow {
  setup_profile_status: 'not_started' | 'drafted' | 'ready'
  payment_gate_status: 'not_started' | 'disabled' | 'ready'
  agreement_gate_status: 'not_started' | 'disabled' | 'ready'
  build_check_status: 'not_started' | 'passed'
  production_roster_status: 'not_started' | 'connected'
}

export const DEFAULT_PRELAUNCH_LAUNCH_GATES: PrelaunchLaunchGateDefinition[] = [
  {
    key: 'payment',
    label: 'Payment gate',
    mode: 'test',
    detail: 'Stripe test mode only. No checkout or charge is created.',
  },
  {
    key: 'agreement',
    label: 'Agreement gate',
    mode: 'sandbox',
    detail: 'SignWell sandbox only. No document is sent.',
  },
]

export const PRELAUNCH_LAUNCH_GATE_SELECT = [
  'id',
  'launch_build_id',
  'gate_key',
  'label',
  'mode',
  'status',
  'notes',
  'updated_by_rep_id',
  'created_at',
  'updated_at',
].join(', ')

function cleanRequiredString(value: string, label: string) {
  const cleaned = value.trim()

  if (!cleaned) {
    throw new Error(`${label} is required.`)
  }

  return cleaned
}

function cleanText(value: string | null | undefined) {
  return value?.trim() ?? ''
}

function findGateDefinition(gateKey: string) {
  return DEFAULT_PRELAUNCH_LAUNCH_GATES.find(
    (definition) => definition.key === gateKey,
  )
}

function isMissingSchemaTable(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'PGRST205'
  )
}

export function normalizePrelaunchLaunchGateRows(
  rows: PrelaunchLaunchGateRow[],
): PrelaunchLaunchGate[] {
  return rows.map((row) => ({
    id: row.id,
    launchBuildId: row.launch_build_id,
    gateKey: row.gate_key,
    label: row.label,
    mode: row.mode,
    status: row.status,
    notes: row.notes,
    updatedByRepId: row.updated_by_rep_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export function buildPrelaunchLaunchGateItems(
  launchBuildId: string,
  savedGates: PrelaunchLaunchGate[],
): PrelaunchLaunchGate[] {
  return DEFAULT_PRELAUNCH_LAUNCH_GATES.map((definition) => {
    const saved = savedGates.find((gate) => gate.gateKey === definition.key)

    return {
      id: saved?.id ?? null,
      launchBuildId,
      gateKey: definition.key,
      label: definition.label,
      mode: definition.mode,
      detail: definition.detail,
      status: saved?.status ?? 'disabled',
      notes: saved?.notes ?? '',
      updatedByRepId: saved?.updatedByRepId ?? null,
      createdAt: saved?.createdAt ?? null,
      updatedAt: saved?.updatedAt ?? null,
    }
  })
}

export async function loadPrelaunchLaunchGatesByBuildIds(
  launchBuildIds: string[],
  admin: AdminClient = createAdminClient(),
): Promise<PrelaunchLaunchGate[]> {
  const uniqueIds = Array.from(
    new Set(launchBuildIds.map((id) => id.trim()).filter(Boolean)),
  )

  if (uniqueIds.length === 0) return []

  const { data, error } = await admin
    .from('sparkle_suite_launch_gates')
    .select(PRELAUNCH_LAUNCH_GATE_SELECT)
    .in('launch_build_id', uniqueIds)

  if (error) {
    if (isMissingSchemaTable(error)) return []
    throw error
  }

  return normalizePrelaunchLaunchGateRows(
    (data ?? []) as unknown as PrelaunchLaunchGateRow[],
  )
}

async function loadLaunchBuildGateRow(launchBuildId: string, admin: AdminClient) {
  const { data, error } = await admin
    .from('sparkle_suite_launch_builds')
    .select(
      'setup_profile_status, payment_gate_status, agreement_gate_status, build_check_status, production_roster_status',
    )
    .eq('id', launchBuildId)
    .single()

  if (error) throw error
  return data as unknown as LaunchBuildGateRow
}

async function refreshLaunchBuildGateStatus(
  launchBuildId: string,
  gateKey: PrelaunchLaunchGateKey,
  gateStatus: PrelaunchLaunchGateStatus,
  admin: AdminClient,
) {
  const gateRow = await loadLaunchBuildGateRow(launchBuildId, admin)
  const readyStatus = gateStatus === 'ready' ? 'ready' : 'disabled'
  const paymentGateStatus =
    gateKey === 'payment' ? readyStatus : gateRow.payment_gate_status
  const agreementGateStatus =
    gateKey === 'agreement' ? readyStatus : gateRow.agreement_gate_status
  const readiness = buildPrelaunchLaunchBuildReadiness({
    setupProfileStatus: gateRow.setup_profile_status,
    paymentGateStatus,
    agreementGateStatus,
    buildCheckStatus: gateRow.build_check_status,
    productionRosterStatus: gateRow.production_roster_status,
  })

  const { error } = await admin
    .from('sparkle_suite_launch_builds')
    .update({
      payment_gate_status: paymentGateStatus,
      agreement_gate_status: agreementGateStatus,
      status: readiness.status,
      blockers: readiness.blockers,
    })
    .eq('id', launchBuildId)

  if (error) throw error
}

export async function upsertPrelaunchLaunchGate(
  input: UpsertPrelaunchLaunchGateInput,
  admin: AdminClient = createAdminClient(),
): Promise<PrelaunchLaunchGate> {
  const launchBuildId = cleanRequiredString(
    input.launchBuildId,
    'launchBuildId',
  )
  const gateKey = cleanRequiredString(input.gateKey, 'gateKey')
  const definition = findGateDefinition(gateKey)

  if (!definition) {
    throw new Error(`Unknown launch gate: ${gateKey}.`)
  }

  const status = input.status === 'ready' ? 'ready' : 'disabled'
  const { data, error } = await admin
    .from('sparkle_suite_launch_gates')
    .upsert(
      {
        launch_build_id: launchBuildId,
        gate_key: definition.key,
        label: definition.label,
        mode: definition.mode,
        status,
        notes: cleanText(input.notes),
        updated_by_rep_id: input.operatorRepId ?? null,
      },
      { onConflict: 'launch_build_id,gate_key' },
    )
    .select(PRELAUNCH_LAUNCH_GATE_SELECT)
    .single()

  if (error) throw error

  await refreshLaunchBuildGateStatus(
    launchBuildId,
    definition.key,
    status,
    admin,
  )

  return normalizePrelaunchLaunchGateRows([
    data as unknown as PrelaunchLaunchGateRow,
  ])[0]
}
