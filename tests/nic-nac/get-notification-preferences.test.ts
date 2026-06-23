import { describe, expect, it, vi, beforeEach } from 'vitest'

const getShowReminderPreferencesMock = vi.fn()
const setShowReminderPreferencesMock = vi.fn()
const setShowReminderOverrideMock = vi.fn()

vi.mock('@/lib/services/show-reminder-preferences', () => ({
  getShowReminderPreferences: (...args: unknown[]) =>
    getShowReminderPreferencesMock(...args),
  setShowReminderPreferences: (...args: unknown[]) =>
    setShowReminderPreferencesMock(...args),
  setShowReminderOverride: (...args: unknown[]) =>
    setShowReminderOverrideMock(...args),
}))

import {
  getNotificationPreferencesTool,
  inputSchema,
  makeGetNotificationPreferencesTool,
} from '@/lib/nic-nac/tools/get-notification-preferences'
import {
  makeSetNotificationPreferencesTool,
  setNotificationPreferencesTool,
} from '@/lib/nic-nac/tools/set-notification-preferences'
import {
  makeSetShowReminderOverrideTool,
  setShowReminderOverrideTool,
} from '@/lib/nic-nac/tools/set-show-reminder-override'

interface ToolDef {
  execute: (input: unknown) => Promise<Record<string, unknown>>
}

function makeCtx() {
  return {
    repId: 'rep-1',
    supabase: {} as never,
    conversationId: 'conv-1',
    runId: 'run-1',
  }
}

beforeEach(() => {
  getShowReminderPreferencesMock.mockReset()
  setShowReminderPreferencesMock.mockReset()
  setShowReminderOverrideMock.mockReset()
})

describe('get_notification_preferences', () => {
  it('returns saved/default show reminder preferences from app-owned state', async () => {
    getShowReminderPreferencesMock.mockResolvedValueOnce({
      repId: 'rep-1',
      enabled: true,
      channels: ['sms', 'email'],
      leadMinutes: 45,
      includeDiscountCodes: true,
      includeFeaturedCollections: false,
      source: 'saved',
      createdAt: '2099-04-01T12:00:00.000Z',
      updatedAt: '2099-04-01T12:30:00.000Z',
    })
    const tool = makeGetNotificationPreferencesTool(
      makeCtx(),
    ) as unknown as ToolDef

    const result = await tool.execute({})

    expect(getShowReminderPreferencesMock).toHaveBeenCalledWith(
      expect.anything(),
      'rep-1',
    )
    expect(result).toMatchObject({
      success: true,
      preferences: {
        enabled: true,
        channels: ['sms', 'email'],
        leadMinutes: 45,
        includeFeaturedCollections: false,
        source: 'saved',
      },
    })
    expect(getNotificationPreferencesTool.readOnly).toBe(true)
    expect(getNotificationPreferencesTool.name).toBe(
      'get_notification_preferences',
    )
  })

  it('accepts an empty input because the rep comes from tool context', () => {
    const result = inputSchema.safeParse({})

    expect(result.success).toBe(true)
  })
})

describe('set_notification_preferences', () => {
  it('saves show reminder defaults for sms and email without sending anything', async () => {
    setShowReminderPreferencesMock.mockResolvedValueOnce({
      repId: 'rep-1',
      enabled: true,
      channels: ['sms', 'email'],
      leadMinutes: 45,
      includeDiscountCodes: true,
      includeFeaturedCollections: true,
      source: 'saved',
    })
    const tool = makeSetNotificationPreferencesTool(
      makeCtx(),
    ) as unknown as ToolDef

    const result = await tool.execute({
      enabled: true,
      channels: ['sms', 'email'],
      leadMinutes: 45,
      includeDiscountCodes: true,
      includeFeaturedCollections: true,
    })

    expect(tool.needsApproval).toBe(true)
    expect(setShowReminderPreferencesMock).toHaveBeenCalledWith(
      expect.anything(),
      'rep-1',
      {
        enabled: true,
        channels: ['sms', 'email'],
        leadMinutes: 45,
        includeDiscountCodes: true,
        includeFeaturedCollections: true,
      },
    )
    expect(result).toMatchObject({
      success: true,
      preferences: {
        channels: ['sms', 'email'],
        leadMinutes: 45,
      },
      sendsTriggered: false,
    })
    expect(setNotificationPreferencesTool.name).toBe('set_notification_preferences')
  })
})

describe('set_show_reminder_override', () => {
  it('saves a per-show reminder override without sending anything', async () => {
    setShowReminderOverrideMock.mockResolvedValueOnce({
      eventId: '11111111-1111-4111-8111-111111111111',
      repId: 'rep-1',
      enabled: true,
      channels: ['email'],
      leadMinutes: 45,
      includeDiscountCodes: false,
      includeFeaturedCollections: true,
      source: 'event_override',
    })
    const tool = makeSetShowReminderOverrideTool(
      makeCtx(),
    ) as unknown as ToolDef

    const result = await tool.execute({
      eventId: '11111111-1111-4111-8111-111111111111',
      enabled: true,
      channels: ['email'],
      leadMinutes: 45,
      includeDiscountCodes: false,
      includeFeaturedCollections: true,
    })

    expect(tool.needsApproval).toBe(true)
    expect(setShowReminderOverrideMock).toHaveBeenCalledWith(
      expect.anything(),
      'rep-1',
      '11111111-1111-4111-8111-111111111111',
      {
        enabled: true,
        channels: ['email'],
        leadMinutes: 45,
        includeDiscountCodes: false,
        includeFeaturedCollections: true,
      },
    )
    expect(result).toMatchObject({
      success: true,
      override: {
        eventId: '11111111-1111-4111-8111-111111111111',
        channels: ['email'],
        source: 'event_override',
      },
      sendsTriggered: false,
    })
    expect(setShowReminderOverrideTool.name).toBe('set_show_reminder_override')
  })
})
