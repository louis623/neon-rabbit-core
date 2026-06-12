import { readFileSync } from 'node:fs'
import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('vercel cron config', () => {
  it('keeps Vercel crons compatible with Hobby plan limits', () => {
    const config = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
      crons?: Array<{ path?: string; schedule?: string }>
    }

    expect(config.crons ?? []).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '/api/internal/show-reminders/pre-show/live',
        }),
      ]),
    )
    expect(config.crons ?? []).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          schedule: expect.stringContaining('*/'),
        }),
      ]),
    )
  })

  it('schedules pre-show reminders through GitHub Actions', () => {
    const workflowPath = '.github/workflows/sparkle-pre-show-reminders.yml'

    expect(existsSync(workflowPath)).toBe(true)

    const workflow = readFileSync(workflowPath, 'utf8')
    expect(workflow).toContain('*/10 * * * *')
    expect(workflow).toContain('/api/internal/show-reminders/pre-show/live')
    expect(workflow).toContain('SPARKLE_PRE_SHOW_CRON_SECRET')
    expect(workflow).toContain('SPARKLE_PRE_SHOW_CRON_SECRET is not configured')
    expect(workflow).toMatch(/SPARKLE_PRE_SHOW_CRON_SECRET is not configured[^\n]+/i)
    expect(workflow).toContain('exit 1')
    expect(workflow).not.toContain('skipping reminder trigger')
  })
})
