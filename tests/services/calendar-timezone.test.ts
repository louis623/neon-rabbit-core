import { describe, expect, it } from 'vitest'
import {
  assertValidTimeZone,
  formatEventTimeForZone,
} from '@/lib/services/calendar-timezone'

describe('calendar timezone helpers', () => {
  it('formats an Eastern-hosted show in Eastern for the rep and Central for a Chicago viewer', () => {
    const eventTime = '2026-06-07T00:00:00.000Z'

    expect(formatEventTimeForZone(eventTime, 'America/New_York')).toContain('8:00 PM')
    expect(formatEventTimeForZone(eventTime, 'America/New_York')).toMatch(/EDT|Eastern/)
    expect(formatEventTimeForZone(eventTime, 'America/Chicago')).toContain('7:00 PM')
    expect(formatEventTimeForZone(eventTime, 'America/Chicago')).toMatch(/CDT|Central/)
  })

  it('rejects invalid timezone names', () => {
    expect(() => assertValidTimeZone('Eastern Standard Time')).toThrow(
      'timeZone must be a valid IANA timezone',
    )
    expect(() => assertValidTimeZone('America/New_York')).not.toThrow()
  })
})
