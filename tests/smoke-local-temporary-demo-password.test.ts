import { describe, expect, it, vi } from 'vitest'

import { runLocalSmokeWithTemporaryDemoPassword } from '@/scripts/smoke-local-with-temporary-demo-password'
import type { DemoSeedPlan, DemoSeedResult } from '@/scripts/seed-demo-rep'
import type {
  LaunchSmokeOptions,
  LaunchSmokeReport,
} from '@/scripts/smoke-demo-readiness'

describe('local launch smoke temporary demo password helper', () => {
  it('seeds a temporary local demo rep and runs the safe local launch smoke without returning the password', async () => {
    const env: Record<string, string | undefined> = {
      NEXT_PUBLIC_LOCAL_APP_URL: 'http://localhost:3000',
    }
    let passwordDuringLaunch: string | undefined
    let emailDuringLaunch: string | undefined
    let localUrlDuringLaunch: string | undefined

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
        localUrlDuringLaunch = smokeEnv.NEXT_PUBLIC_LOCAL_APP_URL
        return {
          generatedAt: '2026-05-22T18:00:00.000Z',
          target: options.target,
          ok: true,
          categories: options.categories.map((category) => ({
            category,
            ok: true,
            results: [
              {
                id: category,
                ok: true,
                detail: `${category} smoke passed`,
              },
            ],
          })),
        }
      },
    )
    const writeLaunchSmokeReport = vi.fn(async () => '.local/report.json')

    const result = await runLocalSmokeWithTemporaryDemoPassword({
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
      target: 'local',
      categories: [
        'local_static',
        'supabase_demo',
        'local_app',
        'stripe_test',
        'stripe_local_routes',
        'stripe_webhook_local_signature',
        'signwell_sandbox',
      ],
      json: true,
      writeReport: true,
    })
    expect(emailDuringLaunch).toBe('louis+sparkle-demo@neonrabbit.net')
    expect(localUrlDuringLaunch).toBe('http://localhost:3000')
    expect(passwordDuringLaunch).toBeTruthy()
    expect(JSON.stringify(result)).not.toContain(String(passwordDuringLaunch))
    expect(env.DEMO_REP_EMAIL).toBeUndefined()
    expect(env.DEMO_REP_PASSWORD).toBeUndefined()
    expect(result).toMatchObject({
      ok: true,
      target: 'http://localhost:3000',
      email: 'louis+sparkle-demo@neonrabbit.net',
      temporaryPasswordRotated: true,
      reportPath: '.local/report.json',
    })
  })
})
