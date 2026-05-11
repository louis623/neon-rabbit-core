import { beforeEach, describe, expect, it, vi } from 'vitest'

const createAdminClientMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

import { buildAllTools } from '@/lib/thumper/tools'
import {
  inputSchema,
  makeSendEmailNotificationTool,
  sendEmailNotificationTool,
} from '@/lib/thumper/tools/send-email-notification'
import { THUMPER_SYSTEM_PROMPT } from '@/lib/thumper/system-prompt'

interface ToolDef {
  execute: (input: unknown) => Promise<Record<string, unknown>>
}

const originalFetch = global.fetch
const originalResendApiKey = process.env.RESEND_API_KEY
const originalResendFromEmail = process.env.RESEND_FROM_EMAIL

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

beforeEach(() => {
  createAdminClientMock.mockReset()
  global.fetch = originalFetch
  process.env.RESEND_API_KEY = originalResendApiKey
  process.env.RESEND_FROM_EMAIL = originalResendFromEmail
})

describe('send_email_notification', () => {
  it('blocks a fourth manual email inside the rolling weekly window', async () => {
    process.env.RESEND_API_KEY = 're_test_key'
    process.env.RESEND_FROM_EMAIL = 'hello@sparklesuite.test'

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

    const fetchMock = vi.fn()
    global.fetch = fetchMock as typeof fetch

    const tool = makeSendEmailNotificationTool(makeCtx()) as unknown as ToolDef

    await expect(
      tool.execute({
        recipientEmail: 'customer@example.com',
        subject: 'Your order is ready',
        body: 'Pickup is available now.',
      }),
    ).rejects.toMatchObject({
      name: 'ThumperToolError',
      code: 'EMAIL_WEEKLY_LIMIT_REACHED',
      userMessage: "You've hit your weekly email limit.",
    })

    expect(admin.from).toHaveBeenCalledWith('message_log')
    expect(select).toHaveBeenCalledWith('id', { count: 'exact', head: true })
    expect(insert).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('blocks prohibited recruiting language before Resend send', async () => {
    process.env.RESEND_API_KEY = 're_test_key'
    process.env.RESEND_FROM_EMAIL = 'hello@sparklesuite.test'

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

    const tool = makeSendEmailNotificationTool(makeCtx()) as unknown as ToolDef

    await expect(
      tool.execute({
        recipientEmail: 'customer@example.com',
        subject: 'Ground floor opportunity',
        body: 'This is your shot at financial freedom.',
      }),
    ).rejects.toMatchObject({
      name: 'ThumperToolError',
      code: 'CONTENT_SCREENING_BLOCKED',
    })

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        rep_id: 'rep-1',
        channel: 'email',
        recipient: 'customer@example.com',
        screening_result: 'blocked',
        screening_notes: expect.stringContaining('financial freedom'),
        delivery_status: 'failed',
        is_automated: false,
      }),
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends a real email and records the successful delivery', async () => {
    process.env.RESEND_API_KEY = 're_test_key'
    process.env.RESEND_FROM_EMAIL = 'hello@sparklesuite.test'

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

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'email-1',
      }),
    })
    global.fetch = fetchMock as typeof fetch

    const tool = makeSendEmailNotificationTool(makeCtx()) as unknown as ToolDef

    const result = await tool.execute({
      recipientEmail: ' Customer@Example.com ',
      subject: 'Your order is ready',
      body: 'Pickup is available now.',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer re_test_key',
          'Content-Type': 'application/json',
        }),
      }),
    )
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
      from: 'hello@sparklesuite.test',
      to: ['customer@example.com'],
      subject: 'Your order is ready',
      text: 'Pickup is available now.',
    })
    expect(admin.from).toHaveBeenCalledWith('message_log')
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        rep_id: 'rep-1',
        channel: 'email',
        recipient: 'customer@example.com',
        content_preview: 'Pickup is available now.',
        screening_result: 'passed',
        delivery_status: 'queued',
        is_automated: false,
      }),
    )
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        delivery_status: 'sent',
        sent_at: expect.any(String),
      }),
    )
    expect(result).toEqual({
      success: true,
      emailId: 'email-1',
      deliveryStatus: 'sent',
      recipientEmail: 'customer@example.com',
    })
  })

  it('marks the log failed when Resend rejects the send', async () => {
    process.env.RESEND_API_KEY = 're_test_key'
    process.env.RESEND_FROM_EMAIL = 'hello@sparklesuite.test'

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

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        message: 'The sender domain is not verified.',
      }),
    })
    global.fetch = fetchMock as typeof fetch

    const tool = makeSendEmailNotificationTool(makeCtx()) as unknown as ToolDef

    await expect(
      tool.execute({
        recipientEmail: 'customer@example.com',
        subject: 'Your order is ready',
        body: 'Pickup is available now.',
      }),
    ).rejects.toMatchObject({
      name: 'ThumperToolError',
      code: 'EMAIL_DELIVERY_FAILED',
    })

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        delivery_status: 'failed',
      }),
    )
  })

  it('returns a tool error when Resend is not configured', async () => {
    delete process.env.RESEND_API_KEY
    delete process.env.RESEND_FROM_EMAIL

    const tool = makeSendEmailNotificationTool(makeCtx()) as unknown as ToolDef

    await expect(
      tool.execute({
        recipientEmail: 'customer@example.com',
        subject: 'Your order is ready',
        body: 'Pickup is available now.',
      }),
    ).rejects.toMatchObject({
      name: 'ThumperToolError',
      code: 'EMAIL_NOT_CONFIGURED',
    })
  })

  it('keeps the email tool in the registry and removes the old stub copy', () => {
    const tools = buildAllTools(makeCtx())
    const names = Object.keys(tools).sort()

    expect(names).toHaveLength(24)
    expect(names).toEqual(
      expect.arrayContaining([
        'send_sms_notification',
        'send_email_notification',
        'get_notification_preferences',
      ]),
    )
    expect(sendEmailNotificationTool.readOnly).toBe(false)
    expect(sendEmailNotificationTool.name).toBe('send_email_notification')
    expect(THUMPER_SYSTEM_PROMPT).toContain('send_email_notification')
    expect(THUMPER_SYSTEM_PROMPT).toContain(
      'Manual SMS and email sends are screened for prohibited recruiting language before they go out.',
    )
    expect(THUMPER_SYSTEM_PROMPT).not.toContain(
      'Email notifications are coming soon!',
    )
  })

  it('rejects an invalid email address', () => {
    const result = inputSchema.safeParse({
      recipientEmail: 'not-an-email',
      subject: 'Your order is ready',
      body: 'Pickup is available now.',
    })

    expect(result.success).toBe(false)
  })
})
