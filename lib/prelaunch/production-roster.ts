import {
  buildPrelaunchLaunchBuildReadiness,
  normalizePrelaunchLaunchBuildRows,
  PRELAUNCH_LAUNCH_BUILD_SELECT,
  type PrelaunchLaunchBuild,
  type PrelaunchLaunchBuildGateStatus,
  type PrelaunchLaunchBuildRow,
} from '@/lib/prelaunch/launch-builds'
import { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

interface ConnectPrelaunchLaunchBuildToProductionRepInput {
  launchBuildId: string
  repId: string
  notes?: string
  operatorRepId?: string | null
}

interface LaunchBuildRosterGateRow {
  lead_name: string
  lead_email: string
  setup_profile_status: PrelaunchLaunchBuildGateStatus
  payment_gate_status: PrelaunchLaunchBuildGateStatus
  agreement_gate_status: PrelaunchLaunchBuildGateStatus
  build_check_status: PrelaunchLaunchBuildGateStatus
}

interface ProductionRosterRepRow {
  id: string
  email: string
}

interface ProductionRosterSetupProfileRow {
  custom_domain: string | null
}

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

function cleanDomain(value: string | null | undefined) {
  const cleaned = value?.trim().toLowerCase() ?? ''
  return cleaned.length > 0 ? cleaned : null
}

async function loadLaunchBuildRosterGateRow(
  launchBuildId: string,
  admin: AdminClient,
) {
  const { data, error } = await admin
    .from('sparkle_suite_launch_builds')
    .select(
      'lead_name, lead_email, setup_profile_status, payment_gate_status, agreement_gate_status, build_check_status',
    )
    .eq('id', launchBuildId)
    .single()

  if (error) throw error
  return data as unknown as LaunchBuildRosterGateRow
}

async function loadProductionRosterRep(repId: string, admin: AdminClient) {
  const { data, error } = await admin
    .from('reps')
    .select('id, email')
    .eq('id', repId)
    .single()

  if (error) throw error
  return data as unknown as ProductionRosterRepRow
}

async function loadProductionRosterSetupProfile(
  launchBuildId: string,
  admin: AdminClient,
) {
  const { data, error } = await admin
    .from('sparkle_suite_launch_setup_profiles')
    .select('custom_domain')
    .eq('launch_build_id', launchBuildId)
    .maybeSingle()

  if (error) throw error
  return data as unknown as ProductionRosterSetupProfileRow | null
}

async function maybeUpdateRepCustomDomain(
  repId: string,
  customDomain: string | null,
  admin: AdminClient,
) {
  if (!customDomain) return

  const { error } = await admin
    .from('reps')
    .update({ custom_domain: customDomain })
    .eq('id', repId)

  if (error) throw error
}

function assertProductionRosterConnectAllowed(build: LaunchBuildRosterGateRow) {
  if (
    build.setup_profile_status !== 'ready' ||
    build.payment_gate_status !== 'ready' ||
    build.agreement_gate_status !== 'ready' ||
    build.build_check_status !== 'passed'
  ) {
    throw new Error(
      'Production roster requires setup, payment, agreement, and build checks to be ready.',
    )
  }
}

export async function connectPrelaunchLaunchBuildToProductionRep(
  input: ConnectPrelaunchLaunchBuildToProductionRepInput,
  admin: AdminClient = createAdminClient(),
): Promise<PrelaunchLaunchBuild> {
  const launchBuildId = cleanRequiredString(
    input.launchBuildId,
    'launchBuildId',
  )
  const repId = cleanRequiredString(input.repId, 'repId')
  const [gateRow, rep] = await Promise.all([
    loadLaunchBuildRosterGateRow(launchBuildId, admin),
    loadProductionRosterRep(repId, admin),
  ])

  assertProductionRosterConnectAllowed(gateRow)
  const profile = await loadProductionRosterSetupProfile(launchBuildId, admin)
  await maybeUpdateRepCustomDomain(
    rep.id,
    cleanDomain(profile?.custom_domain),
    admin,
  )

  const readiness = buildPrelaunchLaunchBuildReadiness({
    setupProfileStatus: gateRow.setup_profile_status,
    paymentGateStatus: gateRow.payment_gate_status,
    agreementGateStatus: gateRow.agreement_gate_status,
    buildCheckStatus: gateRow.build_check_status,
    productionRosterStatus: 'connected',
  })

  const { data, error } = await admin
    .from('sparkle_suite_launch_builds')
    .update({
      rep_id: repId,
      production_roster_status: 'connected',
      stage: readiness.status === 'ready' ? 'ready_for_launch' : 'checks',
      status: readiness.status,
      blockers: readiness.blockers,
      notes: cleanText(input.notes),
    })
    .eq('id', launchBuildId)
    .select(PRELAUNCH_LAUNCH_BUILD_SELECT)
    .single()

  if (error) throw error

  return normalizePrelaunchLaunchBuildRows([
    data as unknown as PrelaunchLaunchBuildRow,
  ])[0]
}
