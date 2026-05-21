import { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

export type PrelaunchLaunchBuildStage =
  | 'draft'
  | 'setup_profile'
  | 'building'
  | 'checks'
  | 'ready_for_launch'
  | 'launched'
  | 'closed'

export type PrelaunchLaunchBuildStatus = 'blocked' | 'active' | 'ready' | 'closed'

export type PrelaunchLaunchBuildGateStatus =
  | 'not_started'
  | 'drafted'
  | 'disabled'
  | 'ready'
  | 'passed'
  | 'connected'

export interface PrelaunchLaunchBuildRow {
  id: string
  waitlist_id: string | null
  intake_submission_id: string | null
  rep_id: string | null
  stage: PrelaunchLaunchBuildStage
  status: PrelaunchLaunchBuildStatus
  lead_name: string
  lead_email: string
  setup_profile_status: PrelaunchLaunchBuildGateStatus
  payment_gate_status: PrelaunchLaunchBuildGateStatus
  agreement_gate_status: PrelaunchLaunchBuildGateStatus
  build_check_status: PrelaunchLaunchBuildGateStatus
  production_roster_status: PrelaunchLaunchBuildGateStatus
  blockers: string[]
  created_at: string
  updated_at: string
}

export interface PrelaunchLaunchBuild {
  id: string
  waitlistId: string | null
  intakeSubmissionId: string | null
  repId: string | null
  stage: PrelaunchLaunchBuildStage
  status: PrelaunchLaunchBuildStatus
  leadName: string
  leadEmail: string
  setupProfileStatus: PrelaunchLaunchBuildGateStatus
  paymentGateStatus: PrelaunchLaunchBuildGateStatus
  agreementGateStatus: PrelaunchLaunchBuildGateStatus
  buildCheckStatus: PrelaunchLaunchBuildGateStatus
  productionRosterStatus: PrelaunchLaunchBuildGateStatus
  blockers: string[]
  createdAt: string
  updatedAt: string
}

interface CreatePrelaunchLaunchBuildDraftInput {
  waitlistId?: string | null
  intakeSubmissionId?: string | null
  operatorRepId: string | null
}

interface PrelaunchLaunchBuildReadinessInput {
  setupProfileStatus: PrelaunchLaunchBuildGateStatus
  paymentGateStatus: PrelaunchLaunchBuildGateStatus
  agreementGateStatus: PrelaunchLaunchBuildGateStatus
  buildCheckStatus: PrelaunchLaunchBuildGateStatus
  productionRosterStatus: PrelaunchLaunchBuildGateStatus
}

interface StartWorkReadyWaitlistRow {
  id: string
  name: string
  email: string
  intake_submission_id: string | null
}

export const PRELAUNCH_LAUNCH_BUILD_SELECT = [
  'id',
  'waitlist_id',
  'intake_submission_id',
  'rep_id',
  'stage',
  'status',
  'lead_name',
  'lead_email',
  'setup_profile_status',
  'payment_gate_status',
  'agreement_gate_status',
  'build_check_status',
  'production_roster_status',
  'blockers',
  'created_at',
  'updated_at',
].join(', ')

export function normalizePrelaunchLaunchBuildRows(
  rows: PrelaunchLaunchBuildRow[],
): PrelaunchLaunchBuild[] {
  return rows.map((row) => ({
    id: row.id,
    waitlistId: row.waitlist_id,
    intakeSubmissionId: row.intake_submission_id,
    repId: row.rep_id,
    stage: row.stage,
    status: row.status,
    leadName: row.lead_name,
    leadEmail: row.lead_email,
    setupProfileStatus: row.setup_profile_status,
    paymentGateStatus: row.payment_gate_status,
    agreementGateStatus: row.agreement_gate_status,
    buildCheckStatus: row.build_check_status,
    productionRosterStatus: row.production_roster_status,
    blockers: row.blockers,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export function buildPrelaunchLaunchBuildReadiness(
  input: PrelaunchLaunchBuildReadinessInput,
) {
  const blockers: string[] = []

  if (input.setupProfileStatus !== 'drafted') {
    blockers.push('Setup profile needs operator review.')
  }

  if (input.paymentGateStatus !== 'ready') {
    blockers.push('Payment gate is disabled.')
  }

  if (input.agreementGateStatus !== 'ready') {
    blockers.push('Agreement gate is disabled.')
  }

  if (input.buildCheckStatus !== 'passed') {
    blockers.push('Build checks have not started.')
  }

  if (input.productionRosterStatus !== 'connected') {
    blockers.push('Production roster is not connected.')
  }

  return {
    status: blockers.length > 0 ? 'blocked' : 'ready',
    blockers,
  } satisfies {
    status: PrelaunchLaunchBuildStatus
    blockers: string[]
  }
}

export async function loadPrelaunchLaunchBuilds(
  admin: AdminClient = createAdminClient(),
  limit = 20,
): Promise<PrelaunchLaunchBuild[]> {
  const { data, error } = await admin
    .from('sparkle_suite_launch_builds')
    .select(PRELAUNCH_LAUNCH_BUILD_SELECT)
    .neq('stage', 'launched')
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) {
    if ('code' in error && error.code === 'PGRST205') {
      return []
    }

    throw error
  }

  return normalizePrelaunchLaunchBuildRows(
    (data ?? []) as unknown as PrelaunchLaunchBuildRow[],
  )
}

async function loadStartWorkReadyWaitlistLead(
  admin: AdminClient,
  waitlistId: string,
) {
  const { data, error } = await admin
    .from('sparkle_suite_waitlist')
    .select('id, name, email, intake_submission_id')
    .eq('id', waitlistId)
    .eq('lead_status', 'start_work_ready')
    .single()

  if (error) throw error

  return data as unknown as StartWorkReadyWaitlistRow
}

export async function createPrelaunchLaunchBuildDraft(
  input: CreatePrelaunchLaunchBuildDraftInput,
  admin: AdminClient = createAdminClient(),
): Promise<PrelaunchLaunchBuild> {
  if (!input.waitlistId && !input.intakeSubmissionId) {
    throw new Error('waitlistId or intakeSubmissionId is required.')
  }

  if (!input.waitlistId) {
    throw new Error('waitlistId is required for the first launch-build draft.')
  }

  const lead = await loadStartWorkReadyWaitlistLead(admin, input.waitlistId)
  const readiness = buildPrelaunchLaunchBuildReadiness({
    setupProfileStatus: 'drafted',
    paymentGateStatus: 'disabled',
    agreementGateStatus: 'disabled',
    buildCheckStatus: 'not_started',
    productionRosterStatus: 'not_started',
  })
  const { data, error } = await admin
    .from('sparkle_suite_launch_builds')
    .insert({
      waitlist_id: lead.id,
      intake_submission_id: input.intakeSubmissionId ?? lead.intake_submission_id,
      operator_rep_id: input.operatorRepId,
      stage: 'draft',
      status: readiness.status,
      lead_name: lead.name,
      lead_email: lead.email,
      setup_profile_status: 'drafted',
      payment_gate_status: 'disabled',
      agreement_gate_status: 'disabled',
      build_check_status: 'not_started',
      production_roster_status: 'not_started',
      blockers: readiness.blockers,
    })
    .select(PRELAUNCH_LAUNCH_BUILD_SELECT)
    .single()

  if (error) throw error

  return normalizePrelaunchLaunchBuildRows([
    data as unknown as PrelaunchLaunchBuildRow,
  ])[0]
}
