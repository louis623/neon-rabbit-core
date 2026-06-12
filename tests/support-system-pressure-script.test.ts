import { describe, expect, it } from 'vitest'
import packageJson from '@/package.json'
import { buildSupportPressureSummary } from '@/scripts/pressure-support-system'

describe('support system pressure script', () => {
  it('is registered as an explicit pressure command', () => {
    expect(packageJson.scripts['pressure:support-system']).toBe(
      'tsx scripts/pressure-support-system.ts',
    )
  })

  it('summarizes pressure results without exposing webhook secrets', () => {
    const summary = buildSupportPressureSummary({
      repsCreated: 3,
      reportsCreated: 14,
      alertsCaptured: 14,
      auditsCompleted: 14,
      notificationFailuresVerified: 1,
      lessonsCreated: 1,
      cleanupResiduals: 0,
    })

    expect(summary).toBe(
      '[support-pressure] reps=3 reports=14 alerts=14 audits=14 notification_failures=1 lessons=1 cleanup_residuals=0',
    )
    expect(summary).not.toContain('chat.googleapis.com')
  })
})
