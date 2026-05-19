import { Buffer } from 'node:buffer'

import { describe, expect, it, vi } from 'vitest'

import {
  generateTemporaryDemoPassword,
  runPreviewSmokeWithTemporaryDemoPassword,
} from '@/scripts/smoke-preview-with-temporary-demo-password'
import type { DemoSeedPlan, DemoSeedResult } from '@/scripts/seed-demo-rep'
import type {
  LaunchSmokeOptions,
  LaunchSmokeReport,
} from '@/scripts/smoke-demo-readiness'

describe('preview smoke temporary demo password helper', () => {
  it('generates a temporary password with the complexity Supabase accepts', () => {
    const password = generateTemporaryDemoPassword(() => Buffer.alloc(24, 7))

    expect(password.length).toBeGreaterThan(24)
    expect(password).toMatch(/[A-Z]/)
    expect(password).toMatch(/[a-z]/)
    expect(password).toMatch(/[0-9]/)
    expect(password).toMatch(/[^A-Za-z0-9]/)
  })

  it('rotates the demo password only inside the smoke run and does not return it', async () => {
    const env: Record<string, string | undefined> = {
      DEMO_REP_EMAIL: 'Louis+Sparkle-Demo@NeonRabbit.net',
      DEMO_REP_PASSWORD: 'previous-local-demo-password',
      NEXT_PUBLIC_APP_URL: 'https://preview.example.test',
    }
    let passwordDuringLaunch: string | undefined
    let emailDuringLaunch: string | undefined
    let targetDuringLaunch: string | undefined

    const seedDemoRep = vi.fn(async (_plan: DemoSeedPlan): Promise<DemoSeedResult> => ({
      repId: 'rep_1',
      siteSettingsId: 'site_1',
      designIds: [],
      listingIds: [],
      showIds: [],
      audienceIds: [],
    }))
    const runLaunchSmoke = vi.fn(
      async (
        options: LaunchSmokeOptions,
        smokeEnv: Record<string, string | undefined>,
      ): Promise<LaunchSmokeReport> => {
        passwordDuringLaunch = smokeEnv.DEMO_REP_PASSWORD
        emailDuringLaunch = smokeEnv.DEMO_REP_EMAIL
        targetDuringLaunch = smokeEnv.NEXT_PUBLIC_APP_URL
        return {
          generatedAt: '2026-05-19T18:00:00.000Z',
          target: options.target,
          ok: true,
          categories: [
            {
              category: 'protected_preview_routes',
              ok: true,
              results: [
                {
                  id: 'protected_preview_routes',
                  ok: true,
                  detail: 'preview smoke passed',
                },
              ],
            },
          ],
        }
      },
    )
    const writeLaunchSmokeReport = vi.fn(async () => '.local/report.json')

    const result = await runPreviewSmokeWithTemporaryDemoPassword({
      env,
      dependencies: {
        seedDemoRep,
        runLaunchSmoke,
        writeLaunchSmokeReport,
      },
    })

    expect(seedDemoRep).toHaveBeenCalledOnce()
    expect(seedDemoRep.mock.calls[0]?.[0].rep.email).toBe(
      'louis+sparkle-demo@neonrabbit.net',
    )
    expect(runLaunchSmoke.mock.calls[0]?.[0]).toEqual({
      target: 'preview',
      categories: ['protected_preview_routes'],
      json: true,
      writeReport: true,
    })
    expect(emailDuringLaunch).toBe('louis+sparkle-demo@neonrabbit.net')
    expect(targetDuringLaunch).toBe('https://preview.example.test')
    expect(passwordDuringLaunch).toBeTruthy()
    expect(passwordDuringLaunch).not.toBe('previous-local-demo-password')
    expect(JSON.stringify(result)).not.toContain(String(passwordDuringLaunch))
    expect(env.DEMO_REP_PASSWORD).toBe('previous-local-demo-password')
    expect(env.DEMO_REP_EMAIL).toBe('Louis+Sparkle-Demo@NeonRabbit.net')
    expect(result).toMatchObject({
      ok: true,
      target: 'https://preview.example.test',
      temporaryPasswordRotated: true,
      reportPath: '.local/report.json',
    })
  })
})
