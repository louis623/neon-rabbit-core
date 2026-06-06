export const DEFAULT_REP_TIME_ZONE = 'America/New_York'

export function assertValidTimeZone(timeZone: string | undefined): string {
  const normalized = timeZone?.trim() || DEFAULT_REP_TIME_ZONE

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: normalized }).format(new Date())
  } catch {
    throw new Error('timeZone must be a valid IANA timezone')
  }

  return normalized
}

export function formatEventTimeForZone(eventTime: string, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
    timeZoneName: 'short',
  }).format(new Date(eventTime))
}

export function formatEventDateForZone(eventTime: string, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone,
  }).format(new Date(eventTime))
}
