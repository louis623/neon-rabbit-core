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
        automationKey: 'show:event-1:pre-show-sms',
        channel: 'sms',
        eventId: 'event-1',
        eventTime: '2026-05-17T20:30:00.000Z',
        message:
          'Reminder: Sunday Sparkles starts at 2026-05-17T20:30:00.000Z on TikTok.',
        recipient: '+15555550101',
        repId: 'rep-1',
        scheduledFor: '2026-05-17T20:00:00.000Z',
      },
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
