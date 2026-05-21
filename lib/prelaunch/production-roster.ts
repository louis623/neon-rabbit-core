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

function assertDemoRosterConnectAllowed(
  build: LaunchBuildRosterGateRow,
  rep: ProductionRosterRepRow,
) {
  const demoRepEmail = process.env.DEMO_REP_EMAIL?.trim().toLowerCase()
  const leadEmail = build.lead_email.trim().toLowerCase()
  const leadName = build.lead_name.trim().toLowerCase()

  if (demoRepEmail && rep.email.trim().toLowerCase() !== demoRepEmail) {
    throw new Error('Only the configured demo rep can be connected here.')
  }

  if (
    !demoRepEmail &&
    !leadEmail.endsWith('@yoursparklesuite.com') &&
    !leadEmail.includes('demo') &&
    !leadName.includes('demo')
  ) {
    throw new Error('Only demo launch builds can be connected here.')
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

  assertDemoRosterConnectAllowed(gateRow, rep)

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
