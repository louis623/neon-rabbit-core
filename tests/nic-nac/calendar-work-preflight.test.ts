import { describe, expect, it } from 'vitest'

import { makePrepareCalendarWorkTool } from '@/lib/nic-nac/tools/prepare-calendar-work'

function makeTool() {
  return makePrepareCalendarWorkTool()
}

async function prepare(requestText: string, input = {}) {
  const tool = makeTool()
  return tool.execute?.(
    {
      requestText,
      ...input,
    },
    { toolCallId: 'call-calendar-preflight', messages: [] },
  )
}

describe('prepare_calendar_work', () => {
  it('preflights a sick-night skip as a single occurrence cancellation', async () => {
    const result = await prepare(
      'ugh i am sick tonight can you just skip whatever live i had',
    )

    expect(result).toMatchObject({
      intent: 'skip_occurrence',
      scope: 'occurrence',
      needsEventId: true,
      needsPauseUntil: false,
      needsApproval: true,
      sendsTriggered: false,
      recommendedTools: ['list_my_shows', 'skip_show_occurrence'],
      missingFields: ['eventId'],
})
    expect(result.hardRules).toContain(
      'skip_show_occurrence cancels exactly one occurrence and preserves the rest of a recurring series.',
    )
  })

  it('preflights a titled one-time show cancellation as cancel_show', async () => {
    const result = await prepare(
      'Cancel the one-time show titled Codex Pressure Bonus. Reason: smoke cleanup.',
    )

    expect(result).toMatchObject({
      intent: 'cancel_show',
      scope: 'event',
      needsEventId: true,
      needsPauseUntil: false,
      needsApproval: true,
      sendsTriggered: false,
      recommendedTools: ['list_my_shows', 'cancel_show'],
      missingFields: ['eventId'],
    })
    expect(result.hardRules).toContain(
      'cancel_show cancels one scheduled/live show entry. Use it for one-time, specific, or titled show cancellation when the rep is not asking to preserve a recurring series occurrence.',
    )
  })

  it('preflights a bounded recurring pause', async () => {
    const result = await prepare('pause Tuesdays for two weeks, i cannot deal lol')

    expect(result).toMatchObject({
      intent: 'pause_series_range',
      scope: 'series_range',
      needsEventId: true,
      needsPauseUntil: true,
      needsApproval: true,
      sendsTriggered: false,
      recommendedTools: ['list_my_shows', 'pause_show_series'],
      missingFields: ['eventId', 'pauseUntil'],
    })
    expect(result.hardRules).toContain(
      'pause_show_series needs a bounded pauseUntil date and cancels only scheduled occurrences inside that window.',
    )
  })

  it('preflights per-show reminder overrides without triggering sends', async () => {
    const result = await prepare('turn off SMS reminders for tonight but keep email')

    expect(result).toMatchObject({
      intent: 'show_reminder_override',
      scope: 'event',
      needsEventId: true,
      needsPauseUntil: false,
      needsApproval: true,
      sendsTriggered: false,
      recommendedTools: ['list_my_shows', 'set_show_reminder_override'],
      missingFields: ['eventId'],
    })
    expect(result.parsedReminderPatch).toEqual({
      channels: ['email'],
      enabled: true,
    })
  })

  it('preflights default show reminder preferences as saved settings only', async () => {
    const result = await prepare('text my people 45 before every show')

    expect(result).toMatchObject({
      intent: 'default_reminder_preferences',
      scope: 'rep_default',
      needsEventId: false,
      needsPauseUntil: false,
      needsApproval: true,
      sendsTriggered: false,
      recommendedTools: [
        'get_notification_preferences',
        'set_notification_preferences',
      ],
      missingFields: [],
      parsedReminderPatch: {
        channels: ['sms'],
        leadMinutes: 45,
        enabled: true,
      },
    })
    expect(result.hardRules).toContain(
      'Reminder preference tools only save future scheduled-job settings; they do not send SMS or email immediately.',
    )
    expect(result.hardRules).toContain(
      'When needsApproval is true, call the recommended approval-gated write tool; the tool emits the confirmation dialog. Do not ask a separate natural-language confirmation first.',
    )
    expect(result.nextAction).toContain('call set_notification_preferences')
    expect(result.nextAction).toContain('approval dialog is the confirmation step')
  })

  it('preflights series discount updates without allowing eventTime edits', async () => {
    const result = await prepare('change the code for all Friday lives to PARTY10')

    expect(result).toMatchObject({
      intent: 'series_update',
      scope: 'series_future',
      needsEventId: true,
      needsPauseUntil: false,
      needsApproval: false,
      sendsTriggered: false,
      recommendedTools: ['list_my_shows', 'update_show'],
      missingFields: ['eventId'],
      parsedShowPatch: {
        applyToSeries: true,
        discountCodes: [{ code: 'PARTY10' }],
      },
    })
    expect(result.hardRules).toContain(
      'Do not combine applyToSeries:true with eventTime. Series-wide edits can update details, codes, collections, platform, duration, title, description, and timezone only.',
    )
  })

  it('classifies replace-with-new one-time show as add_show when no event id is known', async () => {
    const result = await prepare(
      'Replace the current Friday show with a new one-time show called BlingKitchen Live at 8 PM EDT. Discount code bling123 and featured collection July Birthday Collection.',
      {
        knownTimeZone: 'America/New_York',
        knownEventId: '00000000-0000-0000-0000-000000000000',
      },
    )

    expect(result).toMatchObject({
      intent: 'add_show',
      scope: 'calendar',
      needsEventId: false,
      recommendedTools: ['add_show'],
    })
    expect(result.missingFields).not.toContain('description')
  })

  it('does not treat featured collection on a new show as series_update', async () => {
    const result = await prepare(
      'Add a one-time show on TikTok for Friday, July 3 at 8 PM EDT with code bling123 and featured collection July Birthday Collection.',
      { knownTimeZone: 'America/New_York' },
    )

    expect(result).toMatchObject({
      intent: 'add_show',
      recommendedTools: ['add_show'],
    })
  })

  it('preflights misspelled reoccurring show setup as add_show', async () => {
    const result = await prepare(
      'Create a reoccurring show on Wednesday mornings for the foreseeable future called Coffee and Fizz.',
      { knownTimeZone: 'America/New_York' },
    )

    expect(result).toMatchObject({
      intent: 'add_show',
      scope: 'calendar',
      recommendedTools: ['add_show'],
      sendsTriggered: false,
    })
  })

  it('honors already-known event and pause fields', async () => {
    const result = await prepare('pause Tuesdays for two weeks', {
      knownEventId: '9ec8f40c-7c38-4d95-8d2a-0f06790d7c55',
      knownPauseUntil: '2026-07-07',
    })

    expect(result.missingFields).toEqual([])
    expect(result.nextAction).toContain('Call pause_show_series')
  })

  it('does not treat the all-zero UUID as a known event', async () => {
    const result = await prepare('turn off SMS reminders for tonight but keep email', {
      knownEventId: '00000000-0000-0000-0000-000000000000',
    })

    expect(result).toMatchObject({
      intent: 'show_reminder_override',
      needsEventId: true,
      recommendedTools: ['list_my_shows', 'set_show_reminder_override'],
      missingFields: ['eventId'],
    })
  })
})
