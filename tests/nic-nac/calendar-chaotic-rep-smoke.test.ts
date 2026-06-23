import { describe, expect, it } from 'vitest'

import {
  getToolIntentsForText,
  listToolNamesForIntents,
} from '@/lib/nic-nac/tools'
import {
  buildPreShowReminderPlans,
} from '@/lib/services/pre-show-reminders'
import type {
  CalendarEvent,
  CustomerAudienceMember,
  ShowReminderPreferences,
} from '@/lib/services/types'

function event(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'event-chaos-1',
    repId: 'rep-chaos',
    platform: 'TikTok',
    eventTime: '2026-05-17T20:45:00.000Z',
    timeZone: 'America/New_York',
    durationMinutes: 60,
    title: 'Friday Chaos Sparkles',
    description: null,
    discountCodes: [{ code: 'PARTY10', description: '10% off' }],
    featuredCollections: ['July Birthday 2026'],
    isRecurring: true,
    recurrenceGroupId: 'series-chaos',
    recurrenceRule: 'weekly',
    status: 'scheduled',
    createdAt: '2026-05-01T12:00:00.000Z',
    updatedAt: '2026-05-01T12:00:00.000Z',
    ...overrides,
  }
}

function audience(overrides: Partial<CustomerAudienceMember> = {}): CustomerAudienceMember {
  return {
    id: 'aud-chaos-1',
    name: 'Jamie Lane',
    phone: '+15555550101',
    email: 'jamie@example.com',
    smsConsent: true,
    emailConsent: true,
    marketingConsent: true,
    canReceiveSms: true,
    canReceiveEmail: true,
    consentDate: '2026-05-01T12:00:00.000Z',
    createdAt: '2026-05-01T12:00:00.000Z',
    smsOptedOutAt: null,
    emailOptedOutAt: null,
    stopKeywordReceivedAt: null,
    ...overrides,
  }
}

function prefs(overrides: Partial<ShowReminderPreferences> = {}): ShowReminderPreferences {
  return {
    repId: 'rep-chaos',
    enabled: true,
    channels: ['sms', 'email'],
    leadMinutes: 45,
    includeDiscountCodes: true,
    includeFeaturedCollections: true,
    source: 'saved',
    ...overrides,
  }
}

describe('chaotic rep Nic-Nac calendar smoke', () => {
  it.each([
    [
      'ugh i am sick tonight can you just skip whatever live i had',
      ['calendar'],
      ['prepare_calendar_work', 'list_my_shows', 'skip_show_occurrence'],
    ],
    [
      'pause Tuesdays for two weeks, i cannot deal lol',
      ['calendar'],
      ['prepare_calendar_work', 'list_my_shows', 'skip_show_occurrence', 'cancel_show_series', 'pause_show_series'],
    ],
    [
      'change the code for all Friday lives to PARTY10',
      ['calendar'],
      ['prepare_calendar_work', 'list_my_shows', 'update_show'],
    ],
    [
      'text my people 45 before every show',
      ['notification'],
      ['prepare_calendar_work', 'get_notification_preferences', 'set_notification_preferences'],
    ],
    [
      'turn off SMS reminders for tonight but keep email',
      ['calendar', 'notification'],
      ['prepare_calendar_work', 'list_my_shows', 'set_show_reminder_override'],
    ],
  ])('routes "%s" to the tools Nic-Nac needs', (text, expectedIntents, expectedTools) => {
    const intents = getToolIntentsForText(text)
    const tools = listToolNamesForIntents(intents)

    for (const intent of expectedIntents) expect(intents).toContain(intent)
    for (const toolName of expectedTools) expect(tools).toContain(toolName)
  })

  it('keeps personal live-show reminders out of customer notification tools', () => {
    const intents = getToolIntentsForText(
      'remember this for future shows: remind me to confirm tray count before customer follow-up notes',
    )

    expect(intents).toContain('memory')
    expect(intents).toContain('show_memory')
    expect(intents).not.toContain('notification')
  })

  it('plans SMS and future email reminders with show details without sending anything', () => {
    const plans = buildPreShowReminderPlans({
      now: new Date('2026-05-17T20:00:00.000Z'),
      events: [event()],
      audienceByRepId: {
        'rep-chaos': [audience()],
      },
      preferencesByRepId: {
        'rep-chaos': prefs(),
      },
    })

    expect(plans.map((plan) => [plan.channel, plan.automationKey])).toEqual([
      ['sms', 'show:event-chaos-1:audience:aud-chaos-1:pre-show-sms'],
      ['email', 'show:event-chaos-1:audience:aud-chaos-1:pre-show-email'],
    ])
    expect(plans.every((plan) => plan.message.includes('PARTY10'))).toBe(true)
    expect(plans.every((plan) => plan.message.includes('July Birthday 2026'))).toBe(true)
  })
})
