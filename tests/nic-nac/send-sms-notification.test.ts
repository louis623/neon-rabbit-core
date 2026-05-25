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

import { buildAllTools } from '@/lib/nic-nac/tools'
import {
  inputSchema,
  makeSendSmsNotificationTool,
  sendSmsNotificationTool,
} from '@/lib/nic-nac/tools/send-sms-notification'
import { NIC_NAC_SYSTEM_PROMPT } from '@/lib/nic-nac/system-prompt'

interface ToolDef {
  execute: (input: unknown) => Promise<Record<string, unknown>>
}

const originalFetch = global.fetch
const originalTelnyxApiKey = process.env.TELNYX_API_KEY
const originalTelnyxSmsFrom = process.env.TELNYX_SMS_FROM
const originalSmsCampaignApproved = process.env.SPARKLE_SMS_CAMPAIGN_APPROVED

function makeCtx() {
  return {
    repId: 'rep-1',
    supabase: {} as never,
    conversationId: 'conv-1',
    runId: 'run-1',
  }
}

function makeAllowedSendCountSelect() {
  const gte = vi.fn().mockResolvedValue({
    count: 0,
    error: null,
  })
  const inFilter = vi.fn(() => ({ gte }))
  const eqAutomated = vi.fn(() => ({ in: inFilter }))
  const eqChannel = vi.fn(() => ({ eq: eqAutomated }))
  const eqRep = vi.fn(() => ({ eq: eqChannel }))

  return vi.fn(() => ({ eq: eqRep }))
}

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key]
  } else {
    process.env[key] = value
  }
}

beforeEach(() => {
  createAdminClientMock.mockReset()
  deductSmsChargeMock.mockReset()
  refundSmsChargeMock.mockReset()
  global.fetch = originalFetch
  restoreEnv('TELNYX_API_KEY', originalTelnyxApiKey)
  restoreEnv('TELNYX_SMS_FROM', originalTelnyxSmsFrom)
  restoreEnv('SPARKLE_SMS_CAMPAIGN_APPROVED', originalSmsCampaignApproved)
})

describe('send_sms_notification', () => {
  it('blocks SMS while 10DLC approval is pending even when Telnyx credentials exist', async () => {
    process.env.TELNYX_API_KEY = 'telnyx-api-key'
    process.env.TELNYX_SMS_FROM = '+15551230000'
    delete process.env.SPARKLE_SMS_CAMPAIGN_APPROVED

    const fetchMock = vi.fn()
    global.fetch = fetchMock as typeof fetch

    const tool = makeSendSmsNotificationTool(makeCtx()) as unknown as ToolDef

    await expect(
      tool.execute({
        recipientPhone: '+15551112222',
        message: 'Reminder for tonight.',
      }),
    ).rejects.toMatchObject({
      name: 'NicNacToolError',
      code: 'SMS_CAMPAIGN_PENDING',
      userMessage:
        "SMS sending is blocked until the Telnyx 10DLC campaign is approved. I can help draft the text, but I can't send it yet.",
    })

    expect(createAdminClientMock).not.toHaveBeenCalled()
    expect(deductSmsChargeMock).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('blocks a fourth manual text inside the rolling weekly window', async () => {
    process.env.TELNYX_API_KEY = 'telnyx-api-key'
    process.env.TELNYX_SMS_FROM = '+15551230000'
    process.env.SPARKLE_SMS_CAMPAIGN_APPROVED = 'true'

    const gte = vi.fn().mockResolvedValue({
      count: 3,
      error: null,
    })
    const inFilter = vi.fn(() => ({ gte }))
    const eqAutomated = vi.fn(() => ({ in: inFilter }))
    const eqChannel = vi.fn(() => ({ eq: eqAutomated }))
    const eqRep = vi.fn(() => ({ eq: eqChannel }))
    const select = vi.fn(() => ({ eq: eqRep }))
    const insert = vi.fn()
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

    const fetchMock = vi.fn()
    global.fetch = fetchMock as typeof fetch

    const tool = makeSendSmsNotificationTool(makeCtx()) as unknown as ToolDef

    await expect(
      tool.execute({
        recipientPhone: '+15551112222',
        message: 'Reminder for tonight.',
      }),
    ).rejects.toMatchObject({
      name: 'NicNacToolError',
      code: 'SMS_WEEKLY_LIMIT_REACHED',
      userMessage: "You've hit your weekly text limit.",
    })

    expect(admin.from).toHaveBeenCalledWith('message_log')
    expect(select).toHaveBeenCalledWith('id', { count: 'exact', head: true })
    expect(deductSmsChargeMock).not.toHaveBeenCalled()
    expect(insert).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('blocks the send when the SMS wallet is too low before any log insert or Telnyx call', async () => {
    process.env.TELNYX_API_KEY = 'telnyx-api-key'
    process.env.TELNYX_SMS_FROM = '+15551230000'
    process.env.SPARKLE_SMS_CAMPAIGN_APPROVED = 'true'

    const select = makeAllowedSendCountSelect()
    const insert = vi.fn()
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
      success: false,
      new_balance_mils: 8,
    })

    const fetchMock = vi.fn()
    global.fetch = fetchMock as typeof fetch

    const tool = makeSendSmsNotificationTool(makeCtx()) as unknown as ToolDef

    await expect(
      tool.execute({
        recipientPhone: '+15551112222',
        message: 'Reminder for tonight.',
      }),
    ).rejects.toMatchObject({
      name: 'NicNacToolError',
      code: 'INSUFFICIENT_SMS_WALLET',
      userMessage: "There's not enough in the SMS wallet to send that text right now.",
    })

    expect(deductSmsChargeMock).toHaveBeenCalledWith('rep-1')
    expect(insert).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('blocks prohibited recruiting language before wallet debit or Telnyx send', async () => {
    process.env.TELNYX_API_KEY = 'telnyx-api-key'
    process.env.TELNYX_SMS_FROM = '+15551230000'
    process.env.SPARKLE_SMS_CAMPAIGN_APPROVED = 'true'

    const insertSingle = vi.fn().mockResolvedValue({
      data: { id: 'log-blocked-1' },
      error: null,
    })
    const insertSelect = vi.fn(() => ({ single: insertSingle }))
    const insert = vi.fn(() => ({ select: insertSelect }))
    const admin = {
      from: vi.fn(() => ({
        insert,
      })),
    }
    createAdminClientMock.mockReturnValue(admin)

    const fetchMock = vi.fn()
    global.fetch = fetchMock as typeof fetch

    const tool = makeSendSmsNotificationTool(makeCtx()) as unknown as ToolDef

    await expect(
      tool.execute({
        recipientPhone: '+15551112222',
        message: 'Join my team for financial freedom.',
      }),
    ).rejects.toMatchObject({
      name: 'NicNacToolError',
      code: 'CONTENT_SCREENING_BLOCKED',
    })

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        rep_id: 'rep-1',
        channel: 'sms',
        recipient: '+15551112222',
        screening_result: 'blocked',
        screening_notes: expect.stringContaining('financial freedom'),
        delivery_status: 'failed',
        is_automated: false,
      }),
    )
    expect(deductSmsChargeMock).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends an approved SMS, deducts the wallet, and records the queued send', async () => {
    process.env.TELNYX_API_KEY = 'telnyx-api-key'
    process.env.TELNYX_SMS_FROM = '+15551230000'
    process.env.SPARKLE_SMS_CAMPAIGN_APPROVED = 'true'

    const select = makeAllowedSendCountSelect()
    const insertSingle = vi.fn().mockResolvedValue({
      data: { id: 'log-1' },
      error: null,
    })
    const insertSelect = vi.fn(() => ({ single: insertSingle }))
    const insert = vi.fn(() => ({ select: insertSelect }))
    const updateEq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn(() => ({ eq: updateEq }))
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
    refundSmsChargeMock.mockResolvedValue({ new_balance_mils: 25000, credited: true })

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          id: 'telnyx-msg-1',
          to: [{ status: 'queued' }],
          sent_at: null,
        },
      }),
    })
    global.fetch = fetchMock as typeof fetch

    const tool = makeSendSmsNotificationTool(makeCtx()) as unknown as ToolDef

    const result = await tool.execute({
      recipientPhone: '+15551112222',
      message: 'Your order is ready.',
    })

    expect(deductSmsChargeMock).toHaveBeenCalledWith('rep-1')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.telnyx.com/v2/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer telnyx-api-key',
          'Content-Type': 'application/json',
        }),
      }),
    )
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
      from: '+15551230000',
      to: '+15551112222',
      text: 'Your order is ready.',
      type: 'SMS',
    })
    expect(admin.from).toHaveBeenCalledWith('message_log')
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        rep_id: 'rep-1',
        channel: 'sms',
        recipient: '+15551112222',
        content_preview: 'Your order is ready.',
        screening_result: 'passed',
        delivery_status: 'queued',
        cost: 0.009,
        is_automated: false,
      }),
    )
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        delivery_status: 'queued',
        sent_at: expect.any(String),
      }),
    )
    expect(refundSmsChargeMock).not.toHaveBeenCalled()
    expect(result).toEqual({
      success: true,
      messageId: 'telnyx-msg-1',
      deliveryStatus: 'queued',
      recipientPhone: '+15551112222',
      remainingBalanceMils: 24991,
      remainingBalanceUsd: 24.991,
    })
  })

  it('refunds the wallet and marks the log failed when Telnyx rejects the send', async () => {
    process.env.TELNYX_API_KEY = 'telnyx-api-key'
    process.env.TELNYX_SMS_FROM = '+15551230000'
    process.env.SPARKLE_SMS_CAMPAIGN_APPROVED = 'true'

    const select = makeAllowedSendCountSelect()
    const insertSingle = vi.fn().mockResolvedValue({
      data: { id: 'log-1' },
      error: null,
    })
    const insertSelect = vi.fn(() => ({ single: insertSingle }))
    const insert = vi.fn(() => ({ select: insertSelect }))
    const updateEq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn(() => ({ eq: updateEq }))
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
    refundSmsChargeMock.mockResolvedValue({ new_balance_mils: 25000, credited: true })

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        errors: [{ detail: 'Carrier blocked the message.' }],
      }),
    })
    global.fetch = fetchMock as typeof fetch

    const tool = makeSendSmsNotificationTool(makeCtx()) as unknown as ToolDef

    await expect(
      tool.execute({
        recipientPhone: '+15551112222',
        message: 'Your order is ready.',
      }),
    ).rejects.toMatchObject({
      name: 'NicNacToolError',
      code: 'SMS_DELIVERY_FAILED',
    })

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        delivery_status: 'failed',
      }),
    )
    expect(refundSmsChargeMock).toHaveBeenCalledWith(
      'rep-1',
      expect.stringContaining('Carrier blocked the message.'),
    )
  })

  it('returns a tool error when Telnyx is not configured', async () => {
    delete process.env.TELNYX_API_KEY
    delete process.env.TELNYX_SMS_FROM
    process.env.SPARKLE_SMS_CAMPAIGN_APPROVED = 'true'

    const tool = makeSendSmsNotificationTool(makeCtx()) as unknown as ToolDef

    await expect(
      tool.execute({
        recipientPhone: '+15551112222',
        message: 'Your order is ready.',
      }),
    ).rejects.toMatchObject({
      name: 'NicNacToolError',
      code: 'SMS_NOT_CONFIGURED',
    })

    expect(createAdminClientMock).not.toHaveBeenCalled()
    expect(deductSmsChargeMock).not.toHaveBeenCalled()
  })

  it('keeps the SMS tool in the registry but removes the old coming-soon stub copy', () => {
    const tools = buildAllTools(makeCtx())
    const names = Object.keys(tools).sort()

    expect(names).toHaveLength(28)
    expect(names).toEqual(
      expect.arrayContaining([
        'send_sms_notification',
        'send_email_notification',
        'get_notification_preferences',
      ]),
    )
    expect(sendSmsNotificationTool.readOnly).toBe(false)
    expect(sendSmsNotificationTool.name).toBe('send_sms_notification')

    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'You have twenty-eight tools available right now:',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('send_sms_notification')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('send_email_notification')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('get_notification_preferences')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'Telnyx campaign C7BAANX is active, but live SMS still requires number assignment and handset smoke proof.',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'Do not call this before number assignment and handset smoke proof are complete.',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).not.toContain(
      'SMS notifications are coming soon!',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'Sending show reminders or notifications to subscribers — Not yet.',
    )
  })

  it('rejects a missing recipientPhone', () => {
    const result = inputSchema.safeParse({
      message: 'Your order is ready.',
    })

    expect(result.success).toBe(false)
  })
})
