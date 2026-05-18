import { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

export interface PrelaunchWaitlistReviewRow {
  id: string
  name: string
  email: string
  phone: string | null
  tiktok_handle: string
  team_rep_name: string
  setup_pain: string | null
  sms_consent: boolean
  email_consent: boolean
  lead_status: string
  welcome_email_status: string
  welcome_email_sent_at: string | null
  welcome_email_error: string | null
  handoff_status: string
  warmup_status: string
  intake_submission_id: string | null
  created_at: string
}

export interface PrelaunchWaitlistReviewLead {
  id: string
  name: string
  email: string
  phone: string | null
  tiktokHandle: string
  teamRepName: string
  setupPain: string | null
  smsConsent: boolean
  emailConsent: boolean
  leadStatus: string
  welcomeEmailStatus: string
  welcomeEmailSentAt: string | null
  welcomeEmailError: string | null
  handoffStatus: string
  warmupStatus: string
  intakeSubmissionId: string | null
  createdAt: string
}

export const PRELAUNCH_WAITLIST_REVIEW_SELECT = [
  'id',
  'name',
  'email',
  'phone',
  'tiktok_handle',
  'team_rep_name',
  'setup_pain',
  'sms_consent',
  'email_consent',
  'lead_status',
  'welcome_email_status',
  'welcome_email_sent_at',
  'welcome_email_error',
  'handoff_status',
  'warmup_status',
  'intake_submission_id',
  'created_at',
].join(', ')

export function normalizePrelaunchWaitlistReviewRows(
  rows: PrelaunchWaitlistReviewRow[],
): PrelaunchWaitlistReviewLead[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    tiktokHandle: row.tiktok_handle,
    teamRepName: row.team_rep_name,
    setupPain: row.setup_pain,
    smsConsent: row.sms_consent,
    emailConsent: row.email_consent,
    leadStatus: row.lead_status,
    welcomeEmailStatus: row.welcome_email_status,
    welcomeEmailSentAt: row.welcome_email_sent_at,
    welcomeEmailError: row.welcome_email_error,
    handoffStatus: row.handoff_status,
    warmupStatus: row.warmup_status,
    intakeSubmissionId: row.intake_submission_id,
    createdAt: row.created_at,
  }))
}

export async function loadPrelaunchWaitlistReviewLeads(
  admin: AdminClient = createAdminClient(),
  limit = 50,
): Promise<PrelaunchWaitlistReviewLead[]> {
  const { data, error } = await admin
    .from('sparkle_suite_waitlist')
    .select(PRELAUNCH_WAITLIST_REVIEW_SELECT)
    .limit(limit)
    .order('created_at', { ascending: false })

  if (error) throw error

  return normalizePrelaunchWaitlistReviewRows(
    (data ?? []) as unknown as PrelaunchWaitlistReviewRow[],
  )
}
