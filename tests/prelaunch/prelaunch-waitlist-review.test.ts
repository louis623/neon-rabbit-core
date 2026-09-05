import { describe, expect, it, vi } from 'vitest'

import {
  loadPrelaunchWaitlistReviewLeads,
  normalizePrelaunchWaitlistReviewRows,
} from '@/lib/prelaunch/waitlist-review'

describe('prelaunch waitlist review helpers', () => {
  it('normalizes waitlist rows for operator review', () => {
    expect(
      normalizePrelaunchWaitlistReviewRows([
        {
          id: 'waitlist-1',
          name: 'Kim Hart',
          email: 'kim@example.com',
          phone: '919-555-0101',
          tiktok_handle: '@kimslivejewelry',
          team_rep_name: 'Lindsey',
          setup_pain: 'Getting my live setup organized',
          sms_consent: true,
          email_consent: true,
          lead_status: 'new',
          welcome_email_status: 'sent',
          welcome_email_sent_at: '2026-05-13T20:26:34.729Z',
          welcome_email_error: null,
          handoff_status: 'not_started',
          warmup_status: 'not_started',
          intake_submission_id: null,
          created_at: '2026-05-13T20:26:34.527Z',
        },
      ]),
    ).toEqual([
      {
        id: 'waitlist-1',
        name: 'Kim Hart',
        email: 'kim@example.com',
        phone: '919-555-0101',
        tiktokHandle: '@kimslivejewelry',
        teamRepName: 'Lindsey',
        setupPain: 'Getting my live setup organized',
        smsConsent: true,
        emailConsent: true,
        leadStatus: 'new',
        welcomeEmailStatus: 'sent',
        welcomeEmailSentAt: '2026-05-13T20:26:34.729Z',
        welcomeEmailError: null,
        handoffStatus: 'not_started',
        warmupStatus: 'not_started',
        intakeSubmissionId: null,
        createdAt: '2026-05-13T20:26:34.527Z',
      },
    ])
  })

  it('loads recent waitlist leads with welcome email status', async () => {
    const orderMock = vi.fn().mockResolvedValueOnce({
      data: [
        {
          id: 'waitlist-1',
          name: 'Kim Hart',
          email: 'kim@example.com',
          phone: '919-555-0101',
          tiktok_handle: '@kimslivejewelry',
          team_rep_name: 'Lindsey',
          setup_pain: 'Getting my live setup organized',
          sms_consent: true,
          email_consent: true,
          lead_status: 'new',
          welcome_email_status: 'sent',
          welcome_email_sent_at: '2026-05-13T20:26:34.729Z',
          welcome_email_error: null,
          handoff_status: 'not_started',
          warmup_status: 'not_started',
          intake_submission_id: null,
          created_at: '2026-05-13T20:26:34.527Z',
        },
      ],
      error: null,
    })
    const limitMock = vi.fn(() => ({ order: orderMock }))
    const sourceMock = vi.fn(() => ({ limit: limitMock }))
    const selectMock = vi.fn(() => ({ neq: sourceMock }))
    const fromMock = vi.fn(() => ({ select: selectMock }))

    const leads = await loadPrelaunchWaitlistReviewLeads(
      { from: fromMock } as never,
      25,
    )

    expect(fromMock).toHaveBeenCalledWith('sparkle_suite_waitlist')
    expect(selectMock).toHaveBeenCalledWith(
      'id, name, email, phone, tiktok_handle, team_rep_name, setup_pain, sms_consent, email_consent, lead_status, welcome_email_status, welcome_email_sent_at, welcome_email_error, handoff_status, warmup_status, intake_submission_id, created_at',
    )
    expect(limitMock).toHaveBeenCalledWith(25)
    expect(sourceMock).toHaveBeenCalledWith('source', 'public_nic_nac')
    expect(leads[0]).toEqual(
      expect.objectContaining({
        name: 'Kim Hart',
        welcomeEmailStatus: 'sent',
        welcomeEmailSentAt: '2026-05-13T20:26:34.729Z',
      }),
    )
  })
})
