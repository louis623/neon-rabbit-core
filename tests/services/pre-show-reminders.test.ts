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
    timeZone: 'America/New_York',
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

  it('builds email reminder plans from saved rep reminder preferences without reusing SMS automation keys', () => {
    const plans = buildPreShowReminderPlans({
      now: new Date('2026-05-17T20:00:00.000Z'),
      events: [
        makeEvent({
          discountCodes: [{ code: 'PARTY10', description: '10% off' }],
          featuredCollections: ['July Birthday 2026'],
        }),
      ],
      audienceByRepId: {
        'rep-1': [
          makeAudience({
            id: 'aud-1',
            phone: '+15555550101',
            email: 'jamie@example.com',
          }),
        ],
      },
      preferencesByRepId: {
        'rep-1': {
          repId: 'rep-1',
          enabled: true,
          channels: ['sms', 'email'],
          leadMinutes: 45,
          includeDiscountCodes: true,
          includeFeaturedCollections: true,
          source: 'saved',
        },
      },
    })

    expect(plans.map((plan) => [plan.channel, plan.automationKey])).toEqual([
      ['sms', 'show:event-1:audience:aud-1:pre-show-sms'],
      ['email', 'show:event-1:audience:aud-1:pre-show-email'],
    ])
    expect(plans[1]).toMatchObject({
      channel: 'email',
      recipient: 'jamie@example.com',
      subject: 'Reminder: Sunday Sparkles starts soon',
    })
    expect(plans[1].message).toContain('PARTY10')
    expect(plans[1].message).toContain('July Birthday 2026')
  })

  it('lets an event-level override disable reminders for one show only', () => {
    const plans = buildPreShowReminderPlans({
      now: new Date('2026-05-17T20:00:00.000Z'),
      events: [
        makeEvent({ id: 'event-disabled' }),
        makeEvent({ id: 'event-normal', eventTime: '2026-05-17T20:20:00.000Z' }),
      ],
      audienceByRepId: {
        'rep-1': [makeAudience()],
      },
      preferencesByRepId: {
        'rep-1': {
          repId: 'rep-1',
          enabled: true,
          channels: ['sms'],
          leadMinutes: 45,
          includeDiscountCodes: true,
          includeFeaturedCollections: true,
          source: 'saved',
        },
      },
      overridesByEventId: {
        'event-disabled': {
          eventId: 'event-disabled',
          repId: 'rep-1',
          enabled: false,
          channels: ['sms'],
          leadMinutes: 45,
          includeDiscountCodes: true,
          includeFeaturedCollections: true,
          source: 'event_override',
        },
      },
    })

    expect(plans.map((plan) => plan.eventId)).toEqual(['event-normal'])
  })

  it('plans email reminders for email-only subscribers when email reminders are enabled', () => {
    const plans = buildPreShowReminderPlans({
      now: new Date('2026-05-17T20:00:00.000Z'),
      events: [makeEvent()],
      audienceByRepId: {
        'rep-1': [
          makeAudience({
            id: 'aud-email-only',
            phone: null,
            smsConsent: false,
            canReceiveSms: false,
            email: 'email-only@example.com',
            emailConsent: true,
            canReceiveEmail: true,
          }),
        ],
      },
      preferencesByRepId: {
        'rep-1': {
          repId: 'rep-1',
          enabled: true,
          channels: ['email'],
          leadMinutes: 45,
          includeDiscountCodes: true,
          includeFeaturedCollections: true,
          source: 'saved',
        },
      },
    })

    expect(plans).toHaveLength(1)
    expect(plans[0]).toMatchObject({
      channel: 'email',
      recipient: 'email-only@example.com',
      automationKey: 'show:event-1:audience:aud-email-only:pre-show-email',
    })
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

  it('lets email-only live processing skip SMS plans without sending them', async () => {
    const eventChain = {
      eq: vi.fn(() => eventChain),
      gt: vi.fn(() => eventChain),
      lte: vi.fn(() => eventChain),
      order: vi.fn(() => eventChain),
      limit: vi.fn(() =>
        Promise.resolve({
          data: [
            {
              id: 'event-1',
              rep_id: 'rep-1',
              platform: 'TikTok',
              event_time: '2026-05-17T20:30:00.000Z',
              time_zone: 'America/New_York',
              duration_minutes: 60,
              title: 'Sunday Sparkles',
              description: null,
              discount_codes: [],
              featured_collections: [],
              is_recurring: false,
              recurrence_group_id: null,
              recurrence_rule: null,
              status: 'scheduled',
              created_at: '2026-05-17T12:00:00.000Z',
              updated_at: '2026-05-17T12:00:00.000Z',
            },
          ],
          error: null,
        }),
      ),
    }
    const audienceChain = {
      in: vi.fn(() =>
        Promise.resolve({
          data: [
            {
              id: 'aud-1',
              rep_id: 'rep-1',
              name: 'Jamie Lane',
              phone: '+15555550101',
              email: 'jamie@example.com',
              sms_consent: true,
              email_consent: true,
              marketing_consent: true,
              consent_date: '2026-05-01T12:00:00.000Z',
              created_at: '2026-05-01T12:00:00.000Z',
              sms_opted_out_at: null,
              email_opted_out_at: null,
              stop_keyword_received_at: null,
            },
          ],
          error: null,
        }),
      ),
    }
    const preferenceChain = {
      eq: vi.fn(() => preferenceChain),
      maybeSingle: vi.fn(() =>
        Promise.resolve({
          data: {
            rep_id: 'rep-1',
            enabled: true,
            channels: ['sms', 'email'],
            lead_minutes: 45,
            include_discount_codes: true,
            include_featured_collections: true,
            created_at: '2026-05-01T12:00:00.000Z',
            updated_at: '2026-05-01T12:00:00.000Z',
          },
          error: null,
        }),
      ),
    }
    const overrideChain = {
      in: vi.fn(() => Promise.resolve({ data: [], error: null })),
    }
    const runInsertSingle = vi.fn(() =>
      Promise.resolve({ data: { id: 'run-1' }, error: null }),
    )
    const runInsertSelect = vi.fn(() => ({ single: runInsertSingle }))
    const runInsert = vi.fn(() => ({ select: runInsertSelect }))
    const itemInsert = vi.fn(() => Promise.resolve({ error: null }))
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'calendar_events') return { select: vi.fn(() => eventChain) }
        if (table === 'customer_audience') return { select: vi.fn(() => audienceChain) }
        if (table === 'show_reminder_preferences') {
          return { select: vi.fn(() => preferenceChain) }
        }
        if (table === 'show_reminder_overrides') {
          return { select: vi.fn(() => overrideChain) }
        }
        if (table === 'show_reminder_runs') return { insert: runInsert }
        if (table === 'show_reminder_run_items') return { insert: itemInsert }
        return {}
      }),
    } as never
    const sendSms = vi.fn()
    const sendEmail = vi.fn(() => Promise.resolve({ ok: true }))

    const result = await processDuePreShowReminders(supabase, {
      dryRun: false,
      liveSendsEnabled: false,
      liveEmailSendsEnabled: true,
      sendSms: sendSms as never,
      sendEmail: sendEmail as never,
      now: new Date('2026-05-17T20:00:00.000Z'),
    })

    expect(sendSms).not.toHaveBeenCalled()
    expect(sendEmail).toHaveBeenCalledOnce()
    expect(result.reminderRunId).toBe('run-1')
    expect(result.sentCount).toBe(1)
    expect(result.skipped).toHaveLength(1)
    expect(result.skipped[0].error).toBe('pre-show SMS sends are disabled')
    expect(runInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        run_mode: 'live',
        status: 'completed',
        rep_ids: ['rep-1'],
        live_sms_enabled: false,
        live_email_enabled: true,
        planned_count: 2,
        sent_count: 1,
        skipped_count: 1,
      }),
    )
    expect(itemInsert).toHaveBeenCalledWith([
      expect.objectContaining({
        run_id: 'run-1',
        rep_id: 'rep-1',
        event_id: 'event-1',
        audience_id: 'aud-1',
        channel: 'sms',
        automation_key: 'show:event-1:audience:aud-1:pre-show-sms',
        status: 'skipped',
        error: 'pre-show SMS sends are disabled',
      }),
      expect.objectContaining({
        run_id: 'run-1',
        rep_id: 'rep-1',
        event_id: 'event-1',
        audience_id: 'aud-1',
        channel: 'email',
        automation_key: 'show:event-1:audience:aud-1:pre-show-email',
        status: 'sent',
        error: null,
      }),
    ])
  })

  it('loads the full supported reminder window so saved 45-minute preferences are not missed', async () => {
    const state = {
      lte: [] as Array<[string, unknown]>,
    }
    const eventChain = {
      eq: vi.fn(() => eventChain),
      gt: vi.fn(() => eventChain),
      lte: vi.fn((column: string, value: unknown) => {
        state.lte.push([column, value])
        return eventChain
      }),
      order: vi.fn(() => eventChain),
      limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
    }
    const runInsertSingle = vi.fn(() =>
      Promise.resolve({ data: { id: 'run-empty' }, error: null }),
    )
    const runInsertSelect = vi.fn(() => ({ single: runInsertSingle }))
    const runInsert = vi.fn(() => ({ select: runInsertSelect }))
    const supabase = {
      from: vi.fn((table: string) =>
        table === 'show_reminder_runs'
          ? { insert: runInsert }
          : { select: vi.fn(() => eventChain) },
      ),
    } as never

    await processDuePreShowReminders(supabase, {
      dryRun: true,
      now: new Date('2026-05-17T20:00:00.000Z'),
    })

    expect(state.lte).toEqual([['event_time', '2026-05-17T23:00:00.000Z']])
  })
})
