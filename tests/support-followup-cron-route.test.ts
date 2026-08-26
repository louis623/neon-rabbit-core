import { beforeEach, describe, expect, it, vi } from 'vitest'
import vercelConfig from '../vercel.json'

const createAdminClientMock = vi.fn()
const processPendingMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => createAdminClientMock(),
}))

vi.mock('@/lib/services/workspace-support-conversations', () => ({
  processPendingSupportConversationFollowups: (...args: unknown[]) =>
    processPendingMock(...args),
}))

describe('support follow-up cron route', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env.CRON_SECRET = 'test-cron-secret'
    createAdminClientMock.mockReturnValue({ kind: 'admin' })
    processPendingMock.mockResolvedValue({
      scanned: 1,
      processed: 1,
      delivered: 1,
      notConfigured: 0,
      failed: 0,
      skipped: 0,
      results: [],
    })
  })

  it('rejects a request without the configured bearer secret', async () => {
    const { GET } = await import('@/app/api/internal/support-followups/process/route')
    const response = await GET(new Request('https://suite.test/api/internal/support-followups/process'))

    expect(response.status).toBe(401)
    expect(processPendingMock).not.toHaveBeenCalled()
  })

  it('processes a bounded pending batch for an authorized cron request', async () => {
    const { GET } = await import('@/app/api/internal/support-followups/process/route')
    const response = await GET(new Request('https://suite.test/api/internal/support-followups/process', {
      headers: { authorization: 'Bearer test-cron-secret' },
    }))

    expect(response.status).toBe(200)
    expect(processPendingMock).toHaveBeenCalledWith({ kind: 'admin' }, { limit: 10 })
    await expect(response.json()).resolves.toMatchObject({ ok: true })
  })

  it('uses the daily recovery cadence supported by the production Vercel plan', () => {
    expect(vercelConfig.crons).toContainEqual({
      path: '/api/internal/support-followups/process',
      schedule: '15 18 * * *',
    })
  })
})
