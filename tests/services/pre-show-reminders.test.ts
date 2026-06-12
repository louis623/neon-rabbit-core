import { describe, expect, it, vi } from 'vitest'

import {
  buildPreShowReminderPlans,
  processDuePreShowReminders,
} from '@/lib/services/pre-show-reminders'
import type {
  CalendarEvent,
  CustomerAudienceMember,
} from '@/lib/services/types'

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'event-1',
    repId: 'rep-1',
    platform: 'TikTok',
    eventTime: '2026-05-17T20:30:00.000Z',
    durationMinutes: 60,
    title: 'Sunday Sparkles',
    description: null,
    discountCodes: [],
    featuredCollections: null,
    isRecurring: false,
    recurrenceGroupId: null,
    recurrenceRule: null,
    status: 'scheduled',
    createdAt: '2026-05-17T12:00:00.000Z',
    updatedAt: '2026-05-17T12:00:00.000Z',
    ...overrides,
  }
}

function makeAudience(
  overrides: Partial<CustomerAudienceMember> = {},
): CustomerAudienceMember {
  return {
    id: 'aud-1',
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

describe('pre-show reminders', () => {
  it('builds deterministic SMS plans for scheduled shows inside the lead window', () => {
    const plans = buildPreShowReminderPlans({
      now: new Date('2026-05-17T20:00:00.000Z'),
      leadMinutes: 30,
      events: [
        makeEvent(),
        makeEvent({
          id: 'event-too-late',
          eventTime: '2026-05-17T20:31:00.000Z',
        }),
        makeEvent({
          id: 'event-live',
          status: 'live',
          eventTime: '2026-05-17T20:20:00.000Z',
        }),
        makeEvent({
          id: 'event-started',
          eventTime: '2026-05-17T19:59:00.000Z',
        }),
      ],
      audienceByRepId: {
        'rep-1': [
          makeAudience(),
          makeAudience({
            id: 'aud-opted-out',
            phone: '+15555550102',
            canReceiveSms: false,
            smsOptedOutAt: '2026-05-10T12:00:00.000Z',
          }),
          makeAudience({
            id: 'aud-email-only',
            phone: null,
            smsConsent: false,
            canReceiveSms: false,
          }),
        ],
      },
    })

    expect(plans).toEqual([
      {
        audienceId: 'aud-1',
        automationKey: 'show:event-1:audience:aud-1:pre-show-sms',
        channel: 'sms',
        eventId: 'event-1',
        eventTime: '2026-05-17T20:30:00.000Z',
        message:
          'Sparkle Suite: Reminder - Sunday Sparkles starts soon on TikTok. Reply STOP to unsubscribe or HELP for help. Msg&data rates may apply.',
        recipient: '+15555550101',
        repId: 'rep-1',
        scheduledFor: '2026-05-17T20:00:00.000Z',
      },
    ])
  })

  it('normalizes local 10-digit customer phones before sending reminders', () => {
    const plans = buildPreShowReminderPlans({
      now: new Date('2026-05-17T20:00:00.000Z'),
      leadMinutes: 30,
      events: [makeEvent()],
      audienceByRepId: {
        'rep-1': [
          makeAudience({
            phone: '720-629-6507',
          }),
        ],
      },
    })

    expect(plans).toHaveLength(1)
    expect(plans[0].recipient).toBe('+17206296507')
  })

  it('uses one automation key per show customer so multiple recipients can receive the same show reminder', () => {
    const plans = buildPreShowReminderPlans({
      now: new Date('2026-05-17T20:00:00.000Z'),
      leadMinutes: 30,
      events: [makeEvent()],
      audienceByRepId: {
        'rep-1': [
          makeAudience({ id: 'aud-1', phone: '+15555550101' }),
          makeAudience({ id: 'aud-2', phone: '+15555550102' }),
        ],
      },
    })

    expect(plans.map((plan) => plan.automationKey)).toEqual([
      'show:event-1:audience:aud-1:pre-show-sms',
      'show:event-1:audience:aud-2:pre-show-sms',
    ])
  })

  it('blocks live processing unless pre-show SMS sends are explicitly enabled', async () => {
    const sender = vi.fn()

    await expect(
      processDuePreShowReminders({} as never, {
        dryRun: false,
        sendSms: sender,
      }),
    ).rejects.toMatchObject({
      code: 'PRE_SHOW_REMINDER_SEND_DISABLED',
    })

    expect(sender).not.toHaveBeenCalled()
  })
})
