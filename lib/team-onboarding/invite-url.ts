import { ServiceError, errors } from '@/lib/services/errors'

const OPTIONAL_SUITE_ONBOARDING_ORIGIN =
  'https://onboarding.yoursparklesuite.com'
const RETIRED_PERSONAL_ONBOARDING_ORIGIN =
  'https://brittwithbling-start-strong.louis526569.chatgpt.site'

function normalizedText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function isAllowedProtocol(url: URL) {
  if (url.protocol === 'https:') return true
  if (process.env.NODE_ENV === 'production' || url.protocol !== 'http:') {
    return false
  }
  return url.hostname === 'localhost' || url.hostname === '127.0.0.1'
}

function parseBaseUrl(value: unknown, source: 'configuration'): URL
function parseBaseUrl(value: unknown, source: 'request'): URL | null
function parseBaseUrl(value: unknown, source: 'configuration' | 'request') {
  const text = normalizedText(value)
  if (!text) {
    if (source === 'request') return null
    throw new ServiceError({
      code: 'TEAM_ONBOARDING_HOST_NOT_CONFIGURED',
      message: 'TEAM_ONBOARDING_BASE_URL is not configured',
      userMessage:
        'New Rep Onboarding needs its approved ChatGPT Sites address before a private link can be created.',
      statusCode: 503,
    })
  }

  try {
    const url = new URL(text)
    if (!isAllowedProtocol(url) || url.username || url.password) {
      throw new Error('onboarding base URL must use an approved HTTPS origin')
    }
    url.search = ''
    url.hash = ''
    return url
  } catch (cause) {
    if (source === 'request') {
      throw errors.INVALID_INPUT(
        'unapproved onboarding base URL',
        'That onboarding Site is not approved for private Sparkle Suite links.',
      )
    }
    throw new ServiceError({
      code: 'TEAM_ONBOARDING_HOST_INVALID',
      message: 'TEAM_ONBOARDING_BASE_URL is invalid',
      userMessage:
        'New Rep Onboarding needs a valid approved ChatGPT Sites address before a private link can be created.',
      statusCode: 503,
      cause,
    })
  }
}

function parseAllowedOrigin(value: string) {
  try {
    const url = new URL(value.trim())
    if (!isAllowedProtocol(url) || url.username || url.password) return null
    return url.origin
  } catch {
    return null
  }
}

export function getTeamOnboardingAllowedOrigins() {
  const configured = (process.env.TEAM_ONBOARDING_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map(parseAllowedOrigin)
    .filter((value): value is string => Boolean(value))
  const configuredBaseUrl = parseAllowedOrigin(
    process.env.TEAM_ONBOARDING_BASE_URL ?? '',
  )

  return new Set([
    ...configured,
    ...(configuredBaseUrl ? [configuredBaseUrl] : []),
    ...(process.env.TEAM_ONBOARDING_CUSTOM_DOMAIN_ENABLED === 'true'
      ? [OPTIONAL_SUITE_ONBOARDING_ORIGIN]
      : []),
  ])
}

export function resolveTeamOnboardingBaseUrl(requestedBaseUrl?: unknown) {
  const requested = parseBaseUrl(requestedBaseUrl, 'request')
  const configured = parseBaseUrl(
    process.env.TEAM_ONBOARDING_BASE_URL,
    'configuration',
  )
  const selected = requested ?? configured

  if (selected.origin === RETIRED_PERSONAL_ONBOARDING_ORIGIN) {
    if (requested) {
      throw errors.INVALID_INPUT(
        'retired personal onboarding host',
        'That personal onboarding Site cannot be used for a new team invite.',
      )
    }
    throw new ServiceError({
      code: 'TEAM_ONBOARDING_HOST_RETIRED',
      message: 'configured onboarding base URL is a retired personal Site',
      userMessage:
        'New Rep Onboarding needs the approved lead-specific ChatGPT Sites address before a private link can be created.',
      statusCode: 503,
    })
  }

  if (!getTeamOnboardingAllowedOrigins().has(selected.origin)) {
    if (requested) {
      throw errors.INVALID_INPUT(
        'unapproved onboarding base URL origin',
        'That onboarding Site is not approved for private Sparkle Suite links.',
      )
    }
    throw new ServiceError({
      code: 'TEAM_ONBOARDING_HOST_NOT_ALLOWED',
      message: 'configured onboarding base URL origin is not allowed',
      userMessage:
        'New Rep Onboarding needs an approved ChatGPT Sites address before a private link can be created.',
      statusCode: 503,
    })
  }

  if (requested) {
    const approvedPath =
      requested.origin === configured.origin ? configured.pathname : '/'
    const normalizePath = (pathname: string) =>
      pathname === '/' ? '/' : pathname.replace(/\/+$/u, '')
    if (normalizePath(requested.pathname) !== normalizePath(approvedPath)) {
      throw errors.INVALID_INPUT(
        'unapproved onboarding base URL path',
        'Use the approved onboarding Site address without adding another path.',
      )
    }
    selected.pathname = approvedPath
  }

  return selected.toString()
}

export function createTeamOnboardingUrlSlug(value: unknown) {
  return normalizedText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^the-/, '')
    .slice(0, 64)
}

function firstName(value: unknown) {
  return normalizedText(value).split(/\s+/u)[0] ?? ''
}

function looksLikeContactInformation(value: unknown) {
  const text = normalizedText(value)
  return /\S+@\S+/u.test(text) || (text.match(/\d/gu)?.length ?? 0) >= 7
}

export function createTeamOnboardingInviteSlug(input: {
  participantDisplayName: unknown
  leadDisplayName: unknown
  teamName?: unknown
}) {
  if (
    looksLikeContactInformation(input.participantDisplayName) ||
    looksLikeContactInformation(input.leadDisplayName)
  ) {
    throw errors.INVALID_INPUT(
      'contact information cannot appear in onboarding URL identity fields',
      'Use the new rep first name and team lead name, without an email address or phone number.',
    )
  }
  const participant = createTeamOnboardingUrlSlug(
    firstName(input.participantDisplayName),
  )
  const lead = createTeamOnboardingUrlSlug(firstName(input.leadDisplayName))
  if (!participant || !lead) {
    throw errors.INVALID_INPUT(
      'participant first name and team lead identity required',
      'Add the new rep first name and team lead name before creating this private link.',
    )
  }

  const team = looksLikeContactInformation(input.teamName)
    ? ''
    : createTeamOnboardingUrlSlug(input.teamName)
  const parts = [participant, lead]
  if (team && !parts.includes(team)) parts.push(team)
  return parts.join('-').slice(0, 120).replace(/-+$/g, '')
}

export function buildTeamOnboardingAccessUrl(input: {
  baseUrl?: unknown
  token: string
  participantDisplayName: unknown
  leadDisplayName: unknown
  teamName?: unknown
}) {
  const url = new URL(resolveTeamOnboardingBaseUrl(input.baseUrl))
  const basePath = url.pathname.replace(/\/+$/, '')
  const inviteSlug = createTeamOnboardingInviteSlug(input)
  url.pathname = `${basePath}/${inviteSlug}`
  url.searchParams.set('invite', input.token)
  return url.toString()
}
