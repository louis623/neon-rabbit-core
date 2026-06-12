import { describe, expect, it } from 'vitest'
import packageJson from '@/package.json'
import {
  buildSupportReportSmokeSummary,
  parseSupportReportSmokeEnv,
} from '@/scripts/smoke-support-report'

describe('support report smoke script', () => {
  it('is registered as an explicit smoke command', () => {
    expect(packageJson.scripts['smoke:support-report']).toBe(
      'tsx scripts/smoke-support-report.ts',
    )
  })

  it('requires Supabase admin env and Google Chat webhook without exposing values', () => {
    const errors = parseSupportReportSmokeEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.example.test',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
      GOOGLE_CHAT_SUPPORT_WEBHOOK_URL: '',
    })

    expect(errors).toEqual([
      'GOOGLE_CHAT_SUPPORT_WEBHOOK_URL is required for support report smoke.',
    ])
    expect(JSON.stringify(errors)).not.toContain('service-role-secret')
  })

  it('summarizes report creation and cleanup without leaking webhook secrets', () => {
    const summary = buildSupportReportSmokeSummary({
      reportId: 'report-123',
      repId: 'rep-123',
      notificationStatus: 'delivered',
      profileVerified: true,
      auditStatus: 'completed',
      lessonCreated: true,
      cleanedUp: true,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://bqhzfkgkjyuhlsozpylf.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
        GOOGLE_CHAT_SUPPORT_WEBHOOK_URL:
          'https://chat.googleapis.com/v1/spaces/secret/messages?key=key&token=token',
      },
    })

    expect(summary).toBe(
      '[support-report-smoke] report=report-123 rep=rep-123 notification=delivered profile=true audit=completed lesson=true cleanup=true supabase_host=bqhzfkgkjyuhlsozpylf.supabase.co google_chat_configured=true',
    )
    expect(summary).not.toContain('service-role-secret')
    expect(summary).not.toContain('key=')
    expect(summary).not.toContain('token=')
  })
})
