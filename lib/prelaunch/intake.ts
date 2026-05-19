import { errors } from '@/lib/services/errors'
import { normalizeSparkleSuiteReferralCode } from '@/lib/services/sparkle-suite-referrals'
import type {
  PrelaunchIntakeInput,
  PrelaunchIntakeInsert,
  PrelaunchIntakeValidated,
  PrelaunchPrequalificationStatus,
} from '@/lib/services/types'

const TEAM_SIZES = new Set(['1-5', '6-20', '21-50', '51-plus'])
const PRIMARY_PLATFORMS = new Set([
  'tiktok',
  'facebook',
  'instagram',
  'multiple',
  'not_sure',
])
const STREAMING_FREQUENCIES = new Set([
  'not_live_yet',
  'occasional',
  'weekly',
  'multiple_weekly',
])
const DEVICE_SETUPS = new Set([
  'phone_only',
  'phone_and_computer',
  'phone_and_tablet',
  'not_sure',
])

function readString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function readBoolean(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return (
      normalized === 'true' ||
      normalized === '1' ||
      normalized === 'yes' ||
      normalized === 'on'
    )
  }
  return false
}

type SocialProfilePlatform = 'tiktok' | 'instagram' | 'facebook'

function looksLikeSchemeLessSocialProfileUrl(value: string) {
  return /^(?:www\.)?(?:tiktok\.com|instagram\.com|facebook\.com|fb\.com)\//i.test(
    value,
  )
}

function normalizeSocialProfileUrl(
  value: string,
  platform: SocialProfilePlatform,
) {
  const withoutAccidentalAt =
    value.startsWith('@') && looksLikeSchemeLessSocialProfileUrl(value.slice(1))
      ? value.slice(1)
      : value
  const candidate = /^https?:\/\//i.test(withoutAccidentalAt)
    ? withoutAccidentalAt
    : looksLikeSchemeLessSocialProfileUrl(withoutAccidentalAt)
      ? `https://${withoutAccidentalAt}`
      : null

  if (!candidate) return null

  try {
    const parsed = new URL(candidate)
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '')
    const pathname = parsed.pathname.replace(/\/+$/, '')

    if (platform === 'tiktok' && hostname === 'tiktok.com') {
      return `https://www.tiktok.com${pathname}`
    }

    if (platform === 'instagram' && hostname === 'instagram.com') {
      return `https://www.instagram.com${pathname}/`
    }

    if (
      platform === 'facebook' &&
      (hostname === 'facebook.com' || hostname === 'fb.com')
    ) {
      return `https://www.facebook.com${pathname}`
    }
  } catch {
    return null
  }

  return /^https?:\/\//i.test(withoutAccidentalAt) ? withoutAccidentalAt : null
}

function normalizeHandle(
  value: string | undefined,
  platform: 'tiktok' | 'instagram',
) {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const profileUrl = normalizeSocialProfileUrl(trimmed, platform)
  if (profileUrl) return profileUrl
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`
}

function optionalText(value: string | undefined) {
  if (!value) return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

function requireEnum(value: string, allowed: Set<string>, label: string) {
  const normalized = value.trim()
  if (!allowed.has(normalized)) {
    throw errors.INVALID_INPUT(`${label} invalid`, `${label} is required.`)
  }
  return normalized
}

export function parsePrelaunchIntakeInput(value: unknown): PrelaunchIntakeInput {
  const body =
    value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : {}

  return {
    fullName: readString(body.fullName ?? body.full_name),
    email: readString(body.email),
    phone: readString(body.phone),
    businessName: readString(body.businessName ?? body.business_name),
    tiktokHandle: readString(body.tiktokHandle ?? body.tiktok_handle),
    instagramHandle: readString(
      body.instagramHandle ?? body.instagram_handle,
    ),
    facebookUrl: readString(body.facebookUrl ?? body.facebook_url),
    teamName: readString(body.teamName ?? body.team_name),
    teamSize: readString(body.teamSize ?? body.team_size),
    primaryPlatform: readString(
      body.primaryPlatform ?? body.primary_platform,
    ),
    streamingFrequency: readString(
      body.streamingFrequency ?? body.streaming_frequency,
    ),
    currentSetup: readString(body.currentSetup ?? body.current_setup),
    setupGoal: readString(body.setupGoal ?? body.setup_goal),
    deviceSetup: readString(body.deviceSetup ?? body.device_setup),
    brandVibe: readString(body.brandVibe ?? body.brand_vibe),
    colorPreferences: readString(
      body.colorPreferences ?? body.color_preferences,
    ),
    specialRequests: readString(body.specialRequests ?? body.special_requests),
    referralCode: readString(body.referralCode ?? body.referral_code),
    smsConsent: readBoolean(body.smsConsent ?? body.sms_consent),
    emailConsent: readBoolean(body.emailConsent ?? body.email_consent),
  }
}

export function validatePrelaunchIntakeInput(
  input: PrelaunchIntakeInput,
): PrelaunchIntakeValidated {
  const fullName = input.fullName.trim()
  const email = input.email.trim().toLowerCase()
  const phone = input.phone.trim()
  const businessName = input.businessName.trim()
  const tiktokHandle = normalizeHandle(input.tiktokHandle, 'tiktok')
  const instagramHandle = normalizeHandle(input.instagramHandle, 'instagram')
  const rawFacebookUrl = optionalText(input.facebookUrl)
  const facebookUrl = rawFacebookUrl
    ? (normalizeSocialProfileUrl(rawFacebookUrl, 'facebook') ?? rawFacebookUrl)
    : undefined
  const teamName = optionalText(input.teamName)
  const currentSetup = input.currentSetup.trim()
  const setupGoal = input.setupGoal.trim()
  const referralCode = input.referralCode
    ? normalizeSparkleSuiteReferralCode(input.referralCode)
    : undefined

  if (!fullName) {
    throw errors.INVALID_INPUT('fullName required', 'Name is required.')
  }
  if (!email || !email.includes('@')) {
    throw errors.INVALID_INPUT(
      'valid email required',
      'A valid email is required.',
    )
  }
  if (!phone) {
    throw errors.INVALID_INPUT('phone required', 'Phone is required.')
  }
  if (!businessName) {
    throw errors.INVALID_INPUT(
      'business name required',
      'Business name is required.',
    )
  }
  if (!tiktokHandle && !instagramHandle && !facebookUrl) {
    throw errors.INVALID_INPUT(
      'social handle required',
      'At least one social or streaming handle is required.',
    )
  }
  if (!currentSetup) {
    throw errors.INVALID_INPUT(
      'current setup required',
      'Please tell us what you are using online today.',
    )
  }
  if (!setupGoal) {
    throw errors.INVALID_INPUT(
      'setup goal required',
      'Please tell us what you want Sparkle Suite to help with.',
    )
  }
  if (!input.smsConsent) {
    throw errors.INVALID_INPUT(
      'sms consent required',
      'Please agree to get intake follow-up by text.',
    )
  }
  if (!input.emailConsent) {
    throw errors.INVALID_INPUT(
      'email consent required',
      'Please agree to get intake follow-up by email.',
    )
  }

  return {
    fullName,
    email,
    phone,
    businessName,
    tiktokHandle,
    instagramHandle,
    facebookUrl,
    teamName,
    teamSize: requireEnum(input.teamSize, TEAM_SIZES, 'Team size'),
    primaryPlatform: requireEnum(
      input.primaryPlatform,
      PRIMARY_PLATFORMS,
      'Primary live platform',
    ),
    streamingFrequency: requireEnum(
      input.streamingFrequency,
      STREAMING_FREQUENCIES,
      'Streaming frequency',
    ),
    currentSetup,
    setupGoal,
    deviceSetup: requireEnum(
      input.deviceSetup,
      DEVICE_SETUPS,
      'Device setup',
    ),
    brandVibe: optionalText(input.brandVibe),
    colorPreferences: optionalText(input.colorPreferences),
    specialRequests: optionalText(input.specialRequests),
    referralCode: referralCode ?? undefined,
    smsConsent: true,
    emailConsent: true,
  }
}

function buildFitFlags(input: PrelaunchIntakeValidated) {
  const flags: string[] = []
  if (input.deviceSetup === 'phone_only') flags.push('phone_only_setup')
  if (input.deviceSetup === 'not_sure') flags.push('device_setup_unknown')
  if (input.streamingFrequency === 'not_live_yet') flags.push('not_live_yet')
  if (input.primaryPlatform === 'not_sure') flags.push('platform_unknown')
  return flags
}

function getPrequalificationStatus(
  flags: string[],
): PrelaunchPrequalificationStatus {
  return flags.length > 0 ? 'needs_review' : 'qualified'
}

export function buildPrelaunchIntakeInsert(
  input: PrelaunchIntakeInput,
  options: { waitlistId?: string | null } = {},
): PrelaunchIntakeInsert {
  const validated = validatePrelaunchIntakeInput(input)
  const fitFlags = buildFitFlags(validated)

  return {
    full_name: validated.fullName,
    email: validated.email,
    phone: validated.phone,
    business_name: validated.businessName,
    tiktok_handle: validated.tiktokHandle ?? null,
    instagram_handle: validated.instagramHandle ?? null,
    facebook_url: validated.facebookUrl ?? null,
    team_name: validated.teamName ?? null,
    team_size: validated.teamSize,
    primary_platform: validated.primaryPlatform,
    streaming_frequency: validated.streamingFrequency,
    current_setup: validated.currentSetup,
    setup_goal: validated.setupGoal,
    device_setup: validated.deviceSetup,
    brand_vibe: validated.brandVibe ?? null,
    color_preferences: validated.colorPreferences ?? null,
    special_requests: validated.specialRequests ?? null,
    referral_code: validated.referralCode ?? null,
    sms_consent: validated.smsConsent,
    email_consent: validated.emailConsent,
    prequalification_status: getPrequalificationStatus(fitFlags),
    fit_flags: fitFlags,
    waitlist_id: options.waitlistId ?? null,
    scout_input_status: 'ready',
    warmup_sequence_status: 'intake_received',
    source: 'prelaunch_intake',
  }
}
