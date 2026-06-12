import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createAdminClientMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

import {
  assertMessageSendAllowed,
  mapAutomatedMessageLogInsertError,
} from '@/lib/services/message-send-limits'

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
        automationKey: 'show:event-1:audience:aud-1:pre-show-sms',
      }),
    ).rejects.toMatchObject({
      code: 'AUTOMATED_MESSAGE_ALREADY_SENT',
      userMessage: 'That automated text reminder already went out for this show.',
      statusCode: 409,
    })

    expect(chain.eqAutomationKey).toHaveBeenCalledWith(
      'automation_key',
      'show:event-1:audience:aud-1:pre-show-sms',
    )
  })

  it('maps database duplicate automation-key races to the automated reminder duplicate error', () => {
    const mapped = mapAutomatedMessageLogInsertError(
      {
        code: '23505',
        message:
          'duplicate key value violates unique constraint "idx_messages_automation_key_unique"',
      },
      {
        channel: 'sms',
        isAutomated: true,
        automationKey: 'show:event-1:audience:aud-1:pre-show-sms',
      },
    )

    expect(mapped).toMatchObject({
      code: 'AUTOMATED_MESSAGE_ALREADY_SENT',
      userMessage: 'That automated text reminder already went out for this show.',
      statusCode: 409,
    })
  })

  it('does not map non-automated insert failures to reminder duplicates', () => {
    const mapped = mapAutomatedMessageLogInsertError(
      { code: '23505', message: 'duplicate key value violates unique constraint' },
      {
        channel: 'sms',
        isAutomated: false,
      },
    )

    expect(mapped).toBeNull()
  })

  it('keeps a database-level partial unique guard for automated reminders', () => {
    const migration = [
      readFileSync('supabase/migrations/039_ss_message_log_automation_key.sql', 'utf8'),
      readFileSync(
        'supabase/migrations/20260612181500_ss_message_log_automation_key_unique.sql',
        'utf8',
      ),
    ].join('\n')

    expect(migration).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS/i)
    expect(migration).toMatch(/ROW_NUMBER\(\)\s+OVER/i)
    expect(migration).toMatch(/PARTITION BY automation_key/i)
    expect(migration).toContain('idx_messages_automation_key_unique')
    expect(migration).toMatch(
      /ON\s+message_log\s*\(\s*automation_key\s*\)/i,
    )
    expect(migration).toMatch(
      /WHERE\s+is_automated\s+IS\s+TRUE\s+AND\s+automation_key\s+IS\s+NOT\s+NULL\s+AND\s+delivery_status\s+IN\s*\(\s*'queued'\s*,\s*'sent'\s*,\s*'delivered'\s*\)/i,
    )
  })
})
