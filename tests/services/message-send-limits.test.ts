import { beforeEach, describe, expect, it, vi } from 'vitest'

const createAdminClientMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

import { assertMessageSendAllowed } from '@/lib/services/message-send-limits'

function makeManualLimitChain(count: number) {
  const gte = vi.fn().mockResolvedValue({
    count,
    error: null,
  })
  const inFilter = vi.fn(() => ({ gte }))
  const eqAutomated = vi.fn(() => ({ in: inFilter }))
  const eqChannel = vi.fn(() => ({ eq: eqAutomated }))
  const eqRep = vi.fn(() => ({ eq: eqChannel }))
  const select = vi.fn(() => ({ eq: eqRep }))

  return {
    select,
    gte,
  }
}

function makeAutomatedLimitChain(count: number) {
  const eqAutomationKey = vi.fn().mockResolvedValue({
    count,
    error: null,
  })
  const inFilter = vi.fn(() => ({ eq: eqAutomationKey }))
  const eqAutomated = vi.fn(() => ({ in: inFilter }))
  const eqChannel = vi.fn(() => ({ eq: eqAutomated }))
  const eqRep = vi.fn(() => ({ eq: eqChannel }))
  const select = vi.fn(() => ({ eq: eqRep }))

  return {
    select,
    eqAutomationKey,
  }
}

describe('message send limits', () => {
  beforeEach(() => {
    createAdminClientMock.mockReset()
  })

  it('blocks a fourth manual SMS in the trailing 7-day window', async () => {
    const chain = makeManualLimitChain(3)
    createAdminClientMock.mockReturnValue({
      from: vi.fn(() => ({
        select: chain.select,
      })),
    })

    await expect(
      assertMessageSendAllowed('rep-1', {
        channel: 'sms',
        now: new Date('2026-05-07T16:00:00.000Z'),
      }),
    ).rejects.toMatchObject({
      code: 'SMS_WEEKLY_LIMIT_REACHED',
      userMessage: "You've hit your weekly text limit.",
      statusCode: 429,
    })

    expect(chain.gte).toHaveBeenCalledWith('sent_at', '2026-04-30T16:00:00.000Z')
  })

  it('requires an automation key for automated reminder sends', async () => {
    await expect(
      assertMessageSendAllowed('rep-1', {
        channel: 'sms',
        isAutomated: true,
      }),
    ).rejects.toMatchObject({
      code: 'AUTOMATION_KEY_REQUIRED',
    })

    expect(createAdminClientMock).not.toHaveBeenCalled()
  })

  it('blocks a duplicate automated reminder for the same show key', async () => {
    const chain = makeAutomatedLimitChain(1)
    createAdminClientMock.mockReturnValue({
      from: vi.fn(() => ({
        select: chain.select,
      })),
    })

    await expect(
      assertMessageSendAllowed('rep-1', {
        channel: 'sms',
        isAutomated: true,
        automationKey: 'show:event-1:pre-show-sms',
      }),
    ).rejects.toMatchObject({
      code: 'AUTOMATED_MESSAGE_ALREADY_SENT',
      userMessage: 'That automated text reminder already went out for this show.',
      statusCode: 409,
    })

    expect(chain.eqAutomationKey).toHaveBeenCalledWith(
      'automation_key',
      'show:event-1:pre-show-sms',
    )
  })
})
