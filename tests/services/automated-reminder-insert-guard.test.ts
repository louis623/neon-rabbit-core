import { beforeEach, describe, expect, it, vi } from 'vitest'

const createAdminClientMock = vi.fn()
const deductSmsChargeMock = vi.fn()
const refundSmsChargeMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

vi.mock('@/lib/services/wallet', () => ({
  deductSmsCharge: (...args: unknown[]) => deductSmsChargeMock(...args),
  refundSmsCharge: (...args: unknown[]) => refundSmsChargeMock(...args),
}))

import { sendSmsNotification } from '@/lib/services/sms-notifications'

const originalFetch = global.fetch
const originalTelnyxApiKey = process.env.TELNYX_API_KEY
const originalTelnyxSmsFrom = process.env.TELNYX_SMS_FROM
const originalSmsCampaignApproved = process.env.SPARKLE_SMS_CAMPAIGN_APPROVED
const originalSmsNumberAssigned = process.env.SPARKLE_SMS_NUMBER_ASSIGNED

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key]
  } else {
    process.env[key] = value
  }
}

function makeAllowedAutomatedSendCountSelect() {
  const eqAutomationKey = vi.fn().mockResolvedValue({
    count: 0,
    error: null,
  })
  const inFilter = vi.fn(() => ({ eq: eqAutomationKey }))
  const eqAutomated = vi.fn(() => ({ in: inFilter }))
  const eqChannel = vi.fn(() => ({ eq: eqAutomated }))
  const eqRep = vi.fn(() => ({ eq: eqChannel }))

  return vi.fn(() => ({ eq: eqRep }))
}

describe('automated reminder insert guard', () => {
  beforeEach(() => {
    createAdminClientMock.mockReset()
    deductSmsChargeMock.mockReset()
    refundSmsChargeMock.mockReset()
    global.fetch = originalFetch
    restoreEnv('TELNYX_API_KEY', originalTelnyxApiKey)
    restoreEnv('TELNYX_SMS_FROM', originalTelnyxSmsFrom)
    restoreEnv('SPARKLE_SMS_CAMPAIGN_APPROVED', originalSmsCampaignApproved)
    restoreEnv('SPARKLE_SMS_NUMBER_ASSIGNED', originalSmsNumberAssigned)
  })

  it('maps an automated reminder message_log unique violation without sending SMS', async () => {
    process.env.TELNYX_API_KEY = 'telnyx-api-key'
    process.env.TELNYX_SMS_FROM = '+15551230000'
    process.env.SPARKLE_SMS_CAMPAIGN_APPROVED = 'true'
    process.env.SPARKLE_SMS_NUMBER_ASSIGNED = 'true'

    const select = makeAllowedAutomatedSendCountSelect()
    const insertSingle = vi.fn().mockResolvedValue({
      data: null,
      error: {
        code: '23505',
        message:
          'duplicate key value violates unique constraint "idx_messages_automation_key_unique"',
      },
    })
    const insertSelect = vi.fn(() => ({ single: insertSingle }))
    const insert = vi.fn(() => ({ select: insertSelect }))
    const update = vi.fn()
    const admin = {
      from: vi.fn(() => ({
        select,
        insert,
        update,
      })),
    }
    createAdminClientMock.mockReturnValue(admin)
    deductSmsChargeMock.mockResolvedValue({
      success: true,
      new_balance_mils: 24991,
    })
    refundSmsChargeMock.mockResolvedValue({
      credited: true,
      new_balance_mils: 25000,
    })

    const fetchMock = vi.fn()
    global.fetch = fetchMock as typeof fetch

    await expect(
      sendSmsNotification(
        'rep-1',
        {
          recipientPhone: '+15551112222',
          message: 'Sparkle Suite: Reminder - Sunday Sparkles starts soon.',
        },
        {
          isAutomated: true,
          automationKey: 'show:event-1:audience:aud-1:pre-show-sms',
          now: new Date('2026-05-17T20:00:00.000Z'),
        },
      ),
    ).rejects.toMatchObject({
      code: 'AUTOMATED_MESSAGE_ALREADY_SENT',
      userMessage: 'That automated text reminder already went out for this show.',
    })

    expect(deductSmsChargeMock).toHaveBeenCalledWith('rep-1')
    expect(refundSmsChargeMock).toHaveBeenCalledWith(
      'rep-1',
      expect.stringContaining('duplicate automated SMS reminder'),
    )
    expect(fetchMock).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
  })
})
