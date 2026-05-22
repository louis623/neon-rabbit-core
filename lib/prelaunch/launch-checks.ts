import { createAdminClient } from '@/lib/supabase/admin'
import { buildPrelaunchLaunchBuildReadiness } from '@/lib/prelaunch/launch-builds'

type AdminClient = ReturnType<typeof createAdminClient>

export type PrelaunchLaunchCheckStatus = 'not_started' | 'blocked' | 'passed'

export interface PrelaunchLaunchCheckDefinition {
  key: string
  label: string
  detail: string
}

export interface PrelaunchLaunchCheckRow {
  id: string
  launch_build_id: string
  check_key: string
  label: string
  status: PrelaunchLaunchCheckStatus
  notes: string
  checked_at: string | null
  created_at: string
  updated_at: string
}

export interface PrelaunchLaunchCheck {
  id: string | null
  launchBuildId: string
  checkKey: string
  label: string
  detail?: string
  status: PrelaunchLaunchCheckStatus
  notes: string
  checkedAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

interface UpsertPrelaunchLaunchCheckInput {
  launchBuildId: string
  checkKey: string
  status?: PrelaunchLaunchCheckStatus
  notes?: string
}

interface LaunchBuildGateRow {
  setup_profile_status: 'not_started' | 'drafted' | 'ready'
  payment_gate_status: 'not_started' | 'disabled' | 'ready'
  agreement_gate_status: 'not_started' | 'disabled' | 'ready'
  production_roster_status: 'not_started' | 'connected'
}

export const DEFAULT_PRELAUNCH_LAUNCH_CHECKS: PrelaunchLaunchCheckDefinition[] = [
  {
    key: 'setup_profile_ready',
    label: 'Setup profile ready',
    detail: 'Business name, launch notes, and open questions are reviewed.',
  },
  {
    key: 'site_shell_review',
    label: 'Site shell review',
    detail: 'Draft site shell exists and matches the setup profile.',
  },
  {
    key: 'demo_account_review',
    label: 'Client account review',
    detail: 'Client account can open the working Sparkle Suite surface.',
  },
  {
    key: 'operator_final_review',
    label: 'Operator final review',
    detail: 'Louis or an operator confirms this is still blocked from production.',
  },
]

export const PRELAUNCH_LAUNCH_CHECK_SELECT = [
  'id',
  'launch_build_id',
  'check_key',
  'label',
  'status',
  'notes',
  'checked_at',
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

function findCheckDefinition(checkKey: string) {
  return DEFAULT_PRELAUNCH_LAUNCH_CHECKS.find(
    (definition) => definition.key === checkKey,
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

export function normalizePrelaunchLaunchCheckRows(
  rows: PrelaunchLaunchCheckRow[],
): PrelaunchLaunchCheck[] {
  return rows.map((row) => ({
    id: row.id,
    launchBuildId: row.launch_build_id,
    checkKey: row.check_key,
    label: row.label,
    status: row.status,
    notes: row.notes,
    checkedAt: row.checked_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export function buildPrelaunchLaunchCheckItems(
  launchBuildId: string,
  savedChecks: PrelaunchLaunchCheck[],
): PrelaunchLaunchCheck[] {
  return DEFAULT_PRELAUNCH_LAUNCH_CHECKS.map((definition) => {
    const saved = savedChecks.find((check) => check.checkKey === definition.key)

    return {
      id: saved?.id ?? null,
      launchBuildId,
      checkKey: definition.key,
      label: definition.label,
      detail: definition.detail,
      status: saved?.status ?? 'not_started',
      notes: saved?.notes ?? '',
      checkedAt: saved?.checkedAt ?? null,
      createdAt: saved?.createdAt ?? null,
      updatedAt: saved?.updatedAt ?? null,
    }
  })
}

export async function loadPrelaunchLaunchChecksByBuildIds(
  launchBuildIds: string[],
  admin: AdminClient = createAdminClient(),
): Promise<PrelaunchLaunchCheck[]> {
  const uniqueIds = Array.from(
    new Set(launchBuildIds.map((id) => id.trim()).filter(Boolean)),
  )

  if (uniqueIds.length === 0) return []

  const { data, error } = await admin
    .from('sparkle_suite_launch_checks')
    .select(PRELAUNCH_LAUNCH_CHECK_SELECT)
    .in('launch_build_id', uniqueIds)

  if (error) {
    if (isMissingSchemaTable(error)) return []
    throw error
  }

  return normalizePrelaunchLaunchCheckRows(
    (data ?? []) as unknown as PrelaunchLaunchCheckRow[],
  )
}

async function loadLaunchBuildChecks(
  launchBuildId: string,
  admin: AdminClient,
) {
  const { data, error } = await admin
    .from('sparkle_suite_launch_checks')
    .select(PRELAUNCH_LAUNCH_CHECK_SELECT)
    .eq('launch_build_id', launchBuildId)

  if (error) throw error

  return normalizePrelaunchLaunchCheckRows(
    (data ?? []) as unknown as PrelaunchLaunchCheckRow[],
  )
}

async function loadLaunchBuildGateRow(launchBuildId: string, admin: AdminClient) {
  const { data, error } = await admin
    .from('sparkle_suite_launch_builds')
    .select(
      'setup_profile_status, payment_gate_status, agreement_gate_status, production_roster_status',
    )
    .eq('id', launchBuildId)
    .single()

  if (error) throw error
  return data as unknown as LaunchBuildGateRow
}

async function refreshLaunchBuildCheckStatus(
  launchBuildId: string,
  admin: AdminClient,
) {
  const [savedChecks, gateRow] = await Promise.all([
    loadLaunchBuildChecks(launchBuildId, admin),
    loadLaunchBuildGateRow(launchBuildId, admin),
  ])
  const checkItems = buildPrelaunchLaunchCheckItems(launchBuildId, savedChecks)
  const allChecksPassed = checkItems.every((check) => check.status === 'passed')
  const buildCheckStatus = allChecksPassed ? 'passed' : 'not_started'
  const readiness = buildPrelaunchLaunchBuildReadiness({
    setupProfileStatus: gateRow.setup_profile_status,
    paymentGateStatus: gateRow.payment_gate_status,
    agreementGateStatus: gateRow.agreement_gate_status,
    buildCheckStatus,
    productionRosterStatus: gateRow.production_roster_status,
  })

  const { error } = await admin
    .from('sparkle_suite_launch_builds')
    .update({
      build_check_status: buildCheckStatus,
      stage: 'checks',
      status: readiness.status,
      blockers: readiness.blockers,
    })
    .eq('id', launchBuildId)

  if (error) throw error
}

export async function upsertPrelaunchLaunchCheck(
  input: UpsertPrelaunchLaunchCheckInput,
  admin: AdminClient = createAdminClient(),
): Promise<PrelaunchLaunchCheck> {
  const launchBuildId = cleanRequiredString(
    input.launchBuildId,
    'launchBuildId',
  )
  const checkKey = cleanRequiredString(input.checkKey, 'checkKey')
  const definition = findCheckDefinition(checkKey)

  if (!definition) {
    throw new Error(`Unknown launch check: ${checkKey}.`)
  }

  const status = input.status ?? 'not_started'
  const { data, error } = await admin
    .from('sparkle_suite_launch_checks')
    .upsert(
      {
        launch_build_id: launchBuildId,
        check_key: definition.key,
        label: definition.label,
        status,
        notes: cleanText(input.notes),
        checked_at: status === 'passed' ? new Date().toISOString() : null,
      },
      { onConflict: 'launch_build_id,check_key' },
    )
    .select(PRELAUNCH_LAUNCH_CHECK_SELECT)
    .single()

  if (error) throw error

  await refreshLaunchBuildCheckStatus(launchBuildId, admin)

  return normalizePrelaunchLaunchCheckRows([
    data as unknown as PrelaunchLaunchCheckRow,
  ])[0]
}
