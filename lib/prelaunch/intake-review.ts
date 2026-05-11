export interface PrelaunchIntakeReviewRow {
  id: string
  full_name: string
  email: string
  phone: string
  business_name: string
  tiktok_handle: string | null
  instagram_handle: string | null
  facebook_url: string | null
  team_name: string | null
  team_size: string
  primary_platform: string
  streaming_frequency: string
  current_setup: string
  setup_goal: string
  device_setup: string
  brand_vibe: string | null
  color_preferences: string | null
  special_requests: string | null
  intake_status: string
  prequalification_status: string
  fit_flags: string[]
  waitlist_id: string | null
  scout_input_status: string
  created_at: string
  updated_at: string
}

export interface PrelaunchIntakeReviewSubmission {
  id: string
  name: string
  email: string
  phone: string
  businessName: string
  social: {
    tiktok: string | null
    instagram: string | null
    facebook: string | null
  }
  team: {
    name: string | null
    size: string
  }
  primaryPlatform: string
  streamingFrequency: string
  currentSetup: string
  setupGoal: string
  deviceSetup: string
  brandVibe: string | null
  colorPreferences: string | null
  specialRequests: string | null
  intakeStatus: string
  prequalificationStatus: string
  fitFlags: string[]
  waitlistId: string | null
  scoutInputStatus: string
  createdAt: string
  updatedAt: string
}

export function normalizePrelaunchIntakeReviewRows(
  rows: PrelaunchIntakeReviewRow[],
): PrelaunchIntakeReviewSubmission[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.full_name,
    email: row.email,
    phone: row.phone,
    businessName: row.business_name,
    social: {
      tiktok: row.tiktok_handle,
      instagram: row.instagram_handle,
      facebook: row.facebook_url,
    },
    team: {
      name: row.team_name,
      size: row.team_size,
    },
    primaryPlatform: row.primary_platform,
    streamingFrequency: row.streaming_frequency,
    currentSetup: row.current_setup,
    setupGoal: row.setup_goal,
    deviceSetup: row.device_setup,
    brandVibe: row.brand_vibe,
    colorPreferences: row.color_preferences,
    specialRequests: row.special_requests,
    intakeStatus: row.intake_status,
    prequalificationStatus: row.prequalification_status,
    fitFlags: row.fit_flags,
    waitlistId: row.waitlist_id,
    scoutInputStatus: row.scout_input_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export function buildPrelaunchScoutInput(
  submission: PrelaunchIntakeReviewSubmission,
) {
  return {
    intakeId: submission.id,
    prospect: {
      name: submission.name,
      email: submission.email,
      phone: submission.phone,
      businessName: submission.businessName,
    },
    socialHandles: submission.social,
    streamingContext: {
      primaryPlatform: submission.primaryPlatform,
      streamingFrequency: submission.streamingFrequency,
      currentSetup: submission.currentSetup,
      deviceSetup: submission.deviceSetup,
    },
    teamContext: {
      teamName: submission.team.name,
      teamSize: submission.team.size,
    },
    brandContext: {
      brandVibe: submission.brandVibe,
      colorPreferences: submission.colorPreferences,
      setupGoal: submission.setupGoal,
      specialRequests: submission.specialRequests,
    },
    prequalification: {
      status: submission.prequalificationStatus,
      fitFlags: submission.fitFlags,
    },
  }
}
