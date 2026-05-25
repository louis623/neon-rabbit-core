import { beforeEach, describe, expect, it, vi } from 'vitest'

const createAdminClientMock = vi.fn()
const processDuePreShowRemindersMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

vi.mock('@/lib/services/pre-show-reminders', () => ({
  processDuePreShowReminders: (...args: unknown[]) =>
    processDuePreShowRemindersMock(...args),
}))

import { GET } from '@/app/api/internal/show-reminders/pre-show/route'

describe('GET /api/internal/show-reminders/pre-show', () => {
  beforeEach(() => {
    createAdminClientMock.mockReset()
    processDuePreShowRemindersMock.mockReset()
    delete process.env.CRON_SECRET
    delete process.env.SPARKLE_PRE_SHOW_SMS_ENABLED
  })

  it('returns 503 when CRON_SECRET is missing', async () => {
    const response = await GET(
      new Request('http://localhost/api/internal/show-reminders/pre-show'),
    )

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: 'show reminder cron secret is not configured.',
    })
  })

  it('returns 401 when the bearer secret does not match', async () => {
    process.env.CRON_SECRET = 'secret-123'

    const response = await GET(
      new Request('http://localhost/api/internal/show-reminders/pre-show', {
        headers: { authorization: 'Bearer wrong-secret' },
      }),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: 'unauthorized',
    })
  })

  it('returns 400 for an invalid limit', async () => {
    process.env.CRON_SECRET = 'secret-123'

    const response = await GET(
      new Request(
        'http://localhost/api/internal/show-reminders/pre-show?limit=nope',
        {
          headers: { authorization: 'Bearer secret-123' },
        },
      ),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'limit must be a positive whole number.',
    })
  })

  it('runs due reminder planning in dry-run mode by default', async () => {
    process.env.CRON_SECRET = 'secret-123'
    createAdminClientMock.mockReturnValueOnce({ marker: 'admin' })
    processDuePreShowRemindersMock.mockResolvedValueOnce({
      dryRun: true,
      plannedCount: 1,
      sentCount: 0,
      skippedCount: 0,
      plans: [],
      sends: [],
      skipped: [],
    })

    const response = await GET(
      new Request(
        'http://localhost/api/internal/show-reminders/pre-show?limit=12',
        {
          headers: { authorization: 'Bearer secret-123' },
        },
      ),
    )

    expect(processDuePreShowRemindersMock).toHaveBeenCalledWith(
      { marker: 'admin' },
      { limit: 12, dryRun: true, liveSendsEnabled: false },
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      result: {
        dryRun: true,
        plannedCount: 1,
        sentCount: 0,
        skippedCount: 0,
        plans: [],
        sends: [],
        skipped: [],
      },
    })
  })

  it('rejects an invalid mode', async () => {
    process.env.CRON_SECRET = 'secret-123'

    const response = await GET(
      new Request(
        'http://localhost/api/internal/show-reminders/pre-show?mode=banana',
        {
          headers: { authorization: 'Bearer secret-123' },
        },
      ),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'mode must be dry-run or live.',
    })
    expect(processDuePreShowRemindersMock).not.toHaveBeenCalled()
  })

  it('keeps dry-run mode as the default even when live env is enabled', async () => {
    process.env.CRON_SECRET = 'secret-123'
    process.env.SPARKLE_PRE_SHOW_SMS_ENABLED = 'true'
    createAdminClientMock.mockReturnValueOnce({ marker: 'admin' })
    processDuePreShowRemindersMock.mockResolvedValueOnce({
      dryRun: true,
      plannedCount: 1,
      sentCount: 0,
      skippedCount: 0,
      plans: [],
      sends: [],
      skipped: [],
    })

    const response = await GET(
      new Request('http://localhost/api/internal/show-reminders/pre-show', {
        headers: { authorization: 'Bearer secret-123' },
      }),
    )

    expect(processDuePreShowRemindersMock).toHaveBeenCalledWith(
      { marker: 'admin' },
      { limit: 25, dryRun: true, liveSendsEnabled: true },
    )
    expect(response.status).toBe(200)
  })

  it('runs live mode only when explicitly requested and enabled', async () => {
    process.env.CRON_SECRET = 'secret-123'
    process.env.SPARKLE_PRE_SHOW_SMS_ENABLED = 'true'
    createAdminClientMock.mockReturnValueOnce({ marker: 'admin' })
    processDuePreShowRemindersMock.mockResolvedValueOnce({
      dryRun: false,
      plannedCount: 1,
      sentCount: 1,
      skippedCount: 0,
      plans: [],
      sends: [],
      skipped: [],
    })

    const response = await GET(
      new Request(
        'http://localhost/api/internal/show-reminders/pre-show?mode=live',
        {
          headers: { authorization: 'Bearer secret-123' },
        },
      ),
    )

    expect(processDuePreShowRemindersMock).toHaveBeenCalledWith(
      { marker: 'admin' },
      { limit: 25, dryRun: false, liveSendsEnabled: true },
    )
    expect(response.status).toBe(200)
  })
})
