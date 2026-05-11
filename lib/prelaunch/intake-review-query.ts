import {
  normalizePrelaunchIntakeReviewRows,
  type PrelaunchIntakeReviewRow,
  type PrelaunchIntakeReviewSubmission,
} from './intake-review'
import { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

export const PRELAUNCH_INTAKE_REVIEW_SELECT = [
  'id',
  'full_name',
  'email',
  'phone',
  'business_name',
  'tiktok_handle',
  'instagram_handle',
  'facebook_url',
  'team_name',
  'team_size',
  'primary_platform',
  'streaming_frequency',
  'current_setup',
  'setup_goal',
  'device_setup',
  'brand_vibe',
  'color_preferences',
  'special_requests',
  'intake_status',
  'prequalification_status',
  'fit_flags',
  'waitlist_id',
  'scout_input_status',
  'created_at',
  'updated_at',
].join(', ')

export async function loadPrelaunchIntakeReviewSubmissions(
  admin: AdminClient = createAdminClient(),
  limit = 50,
): Promise<PrelaunchIntakeReviewSubmission[]> {
  const { data, error } = await admin
    .from('sparkle_suite_intake_submissions')
    .select(PRELAUNCH_INTAKE_REVIEW_SELECT)
    .limit(limit)
    .order('created_at', { ascending: false })

  if (error) throw error

  return normalizePrelaunchIntakeReviewRows(
    (data ?? []) as unknown as PrelaunchIntakeReviewRow[],
  )
}
