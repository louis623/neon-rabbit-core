import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('vercel cron config', () => {
  it('schedules the live pre-show reminder job', () => {
    const config = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
      crons?: Array<{ path?: string; schedule?: string }>
    }

    expect(config.crons).toEqual(
      expect.arrayContaining([
        {
          path: '/api/internal/show-reminders/pre-show/live',
          schedule: '*/10 * * * *',
        },
      ]),
    )
  })
})
