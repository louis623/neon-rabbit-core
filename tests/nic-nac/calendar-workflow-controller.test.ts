import { describe, expect, it } from 'vitest'
import {
  computeCalendarWorkflowReadiness,
  mergeCalendarKnownFieldsFromText,
} from '@/lib/nic-nac/workflows/calendar-workflow-controller'

describe('calendar workflow controller', () => {
  it('does not require description for add_show readiness', () => {
    const state = computeCalendarWorkflowReadiness({
      intent: 'add_show',
      knownFields: {
        title: 'BlingKitchen Live',
        platform: 'TikTok',
        eventTime: '2026-07-04T00:00:00.000Z',
        timeZone: 'America/New_York',
        durationMinutes: 150,
      },
      candidateEventIds: [],
    })

    expect(state.phase).toBe('ready_to_add')
    expect(state.missingFields).not.toContain('description')
  })

  it('retains add_show details when a rep rejects optional description', () => {
    const merged = mergeCalendarKnownFieldsFromText(
      {
        title: 'BlingKitchen Live',
        platform: 'TikTok',
        eventTime: '2026-07-04T00:00:00.000Z',
        timeZone: 'America/New_York',
        durationMinutes: 150,
      },
      "No, you don't need a short description of the event.",
    )

    expect(merged.description).toBeNull()
    expect(merged.platform).toBe('TikTok')
    expect(merged.durationMinutes).toBe(150)
  })

  it('extracts platform and duration from a natural follow-up', () => {
    const merged = mergeCalendarKnownFieldsFromText(
      {
        title: 'BlingKitchen Live',
        eventTime: '2026-07-04T00:00:00.000Z',
        timeZone: 'America/New_York',
      },
      "It's going to be on TikTok, and it is going to be 2.5 hours.",
    )

    expect(merged.platform).toBe('TikTok')
    expect(merged.durationMinutes).toBe(150)
  })

  it('extracts the quick-chip add-show details from Louis real replay', () => {
    const afterTime = mergeCalendarKnownFieldsFromText(
      {},
      'Tiktok July 4 7p Est',
    )
    const afterTitleAndDuration = mergeCalendarKnownFieldsFromText(
      afterTime,
      'Bling party and 3 hrs',
    )
    const readiness = computeCalendarWorkflowReadiness({
      intent: 'add_show',
      knownFields: afterTitleAndDuration,
      candidateEventIds: [],
    })

    expect(afterTitleAndDuration).toMatchObject({
      title: 'Bling Party',
      platform: 'TikTok',
      eventTime: '2026-07-04T19:00:00-04:00',
      timeZone: 'America/New_York',
      durationMinutes: 180,
    })
    expect(readiness).toEqual({
      phase: 'ready_to_add',
      missingFields: [],
    })
  })

  it('keeps update intent in identify_existing_event when an event id is missing', () => {
    const state = computeCalendarWorkflowReadiness({
      intent: 'update_show',
      knownFields: {
        title: 'BlingKitchen Live',
        eventTime: '2026-07-04T00:00:00.000Z',
        timeZone: 'America/New_York',
      },
      candidateEventIds: [],
    })

    expect(state.phase).toBe('identify_existing_event')
    expect(state.missingFields).toContain('eventId')
  })
})
