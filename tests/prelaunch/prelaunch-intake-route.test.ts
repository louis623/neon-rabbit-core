import { beforeEach, describe, expect, it, vi } from 'vitest'

const insertMock = vi.fn()
const intakeWriteSingleMock = vi.fn()
const intakeWriteSelectMock = vi.fn(() => ({ single: intakeWriteSingleMock }))
const waitlistMaybeSingleMock = vi.fn()
const waitlistLimitMock = vi.fn(() => ({ maybeSingle: waitlistMaybeSingleMock }))
const waitlistOrderMock = vi.fn(() => ({ limit: waitlistLimitMock }))
const waitlistEqMock = vi.fn(() => ({ order: waitlistOrderMock }))
const waitlistSelectMock = vi.fn(() => ({ eq: waitlistEqMock }))
const waitlistUpdateEqMock = vi.fn()
const waitlistUpdateMock = vi.fn(() => ({ eq: waitlistUpdateEqMock }))
const intakeMaybeSingleMock = vi.fn()
const intakeEqMock = vi.fn(() => ({ maybeSingle: intakeMaybeSingleMock }))
const intakeSelectMock = vi.fn(() => ({ eq: intakeEqMock }))
const intakeUpdateEqMock = vi.fn()
const intakeUpdateMock = vi.fn(() => ({ eq: intakeUpdateEqMock }))
const runPrelaunchScoutForIntakeMock = vi.fn()
const fromMock = vi.fn((table: string) => {
  if (table === 'sparkle_suite_waitlist') {
    return { select: waitlistSelectMock, update: waitlistUpdateMock }
  }
  return {
    insert: insertMock,
    select: intakeSelectMock,
    update: intakeUpdateMock,
  }
})

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: fromMock,
  }),
}))

vi.mock('@/lib/prelaunch/scout', () => ({
  runPrelaunchScoutForIntake: (...args: unknown[]) =>
    runPrelaunchScoutForIntakeMock(...args),
}))

import { POST } from '@/app/api/prelaunch/intake/route'
import { resetPrelaunchRequestGuardForTests } from '@/lib/prelaunch/request-guard'

describe('POST /api/prelaunch/intake', () => {
  beforeEach(() => {
    resetPrelaunchRequestGuardForTests()
    fromMock.mockClear()
    insertMock.mockReset()
    intakeWriteSingleMock.mockReset()
    intakeWriteSelectMock.mockClear()
    waitlistMaybeSingleMock.mockReset()
    waitlistLimitMock.mockClear()
    waitlistOrderMock.mockClear()
    waitlistEqMock.mockClear()
    waitlistSelectMock.mockClear()
    waitlistUpdateEqMock.mockReset()
    waitlistUpdateMock.mockClear()
    intakeMaybeSingleMock.mockReset()
    intakeEqMock.mockClear()
    intakeSelectMock.mockClear()
    intakeUpdateEqMock.mockReset()
    intakeUpdateMock.mockClear()
    runPrelaunchScoutForIntakeMock.mockReset()
    runPrelaunchScoutForIntakeMock.mockResolvedValue({
      runKey: 'scout:intake-1:2026-05-10T20:00:00.000Z',
      output: {
        briefTitle: 'Scout brief: Jamie Hart Jewelry',
        recommendedNextStep: 'book_discovery_call',
      },
    })
  })

  it('stores a native intake and pre-qualification submission', async () => {
    waitlistMaybeSingleMock.mockResolvedValueOnce({
      data: { id: 'waitlist-1' },
      error: null,
    })
    intakeMaybeSingleMock.mockResolvedValueOnce({ data: null, error: null })
    insertMock.mockReturnValueOnce({ select: intakeWriteSelectMock })
    intakeWriteSingleMock.mockResolvedValueOnce({
      data: { id: 'intake-1' },
      error: null,
    })
    waitlistUpdateEqMock.mockResolvedValueOnce({ error: null })

    const response = await POST(
      new Request('http://localhost/api/prelaunch/intake', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Jamie Hart',
          email: 'jamie@example.com',
          phone: '303-555-0123',
          businessName: 'Jamie Hart Jewelry',
          tiktokHandle: '@jamieh',
          instagramHandle: '@jamiebling',
          facebookUrl: '',
          teamName: 'Lindsey Team',
          teamSize: '6-20',
          primaryPlatform: 'tiktok',
          streamingFrequency: 'weekly',
          currentSetup: 'TikTok bio link and DMs',
          setupGoal: 'Cleaner hub before launch nights',
          deviceSetup: 'phone_and_computer',
          brandVibe: 'polished and warm',
          colorPreferences: 'plum and pearl',
          specialRequests: 'Needs help organizing show links',
          smsConsent: true,
          emailConsent: true,
        }),
      }),
    )

    expect(fromMock).toHaveBeenCalledWith('sparkle_suite_intake_submissions')
    expect(insertMock).toHaveBeenCalledWith({
      full_name: 'Jamie Hart',
      email: 'jamie@example.com',
      phone: '303-555-0123',
      business_name: 'Jamie Hart Jewelry',
      tiktok_handle: '@jamieh',
      instagram_handle: '@jamiebling',
      facebook_url: null,
      team_name: 'Lindsey Team',
      team_size: '6-20',
      primary_platform: 'tiktok',
      streaming_frequency: 'weekly',
      current_setup: 'TikTok bio link and DMs',
      setup_goal: 'Cleaner hub before launch nights',
      device_setup: 'phone_and_computer',
      brand_vibe: 'polished and warm',
      color_preferences: 'plum and pearl',
      special_requests: 'Needs help organizing show links',
      sms_consent: true,
      email_consent: true,
      prequalification_status: 'qualified',
      fit_flags: [],
      waitlist_id: 'waitlist-1',
      scout_input_status: 'ready',
      warmup_sequence_status: 'intake_received',
      source: 'prelaunch_intake',
    })
    expect(waitlistUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        intake_submission_id: 'intake-1',
        handoff_status: 'intake_received',
        warmup_status: 'active',
      }),
    )
    expect(waitlistUpdateEqMock).toHaveBeenCalledWith('id', 'waitlist-1')
    expect(runPrelaunchScoutForIntakeMock).toHaveBeenCalledWith({
      admin: { from: fromMock },
      intakeId: 'intake-1',
      operatorRepId: null,
      triggerSource: 'intake_submission',
    })
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      mode: 'created',
      waitlistLinked: true,
      prequalificationStatus: 'qualified',
      fitFlags: [],
      scoutRun: {
        status: 'completed',
        runKey: 'scout:intake-1:2026-05-10T20:00:00.000Z',
      },
    })
  })

  it('updates an existing intake row for the same email instead of duplicating it', async () => {
    waitlistMaybeSingleMock.mockResolvedValueOnce({ data: null, error: null })
    intakeMaybeSingleMock.mockResolvedValueOnce({
      data: { id: 'intake-1' },
      error: null,
    })
    intakeUpdateEqMock.mockReturnValueOnce({ select: intakeWriteSelectMock })
    intakeWriteSingleMock.mockResolvedValueOnce({
      data: { id: 'intake-1' },
      error: null,
    })

    const response = await POST(
      new Request('http://localhost/api/prelaunch/intake', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Jamie Hart',
          email: 'jamie@example.com',
          phone: '303-555-0123',
          businessName: 'Jamie Hart Jewelry',
          tiktokHandle: '@jamieh',
          teamSize: '1-5',
          primaryPlatform: 'tiktok',
          streamingFrequency: 'weekly',
          currentSetup: 'Bio link',
          setupGoal: 'Cleaner hub',
          deviceSetup: 'phone_and_computer',
          smsConsent: true,
          emailConsent: true,
        }),
      }),
    )

    expect(insertMock).not.toHaveBeenCalled()
    const updatePayload = (
      intakeUpdateMock.mock.calls as unknown as Array<
        [Record<string, unknown>]
      >
    )[0]?.[0]
    expect(updatePayload).not.toHaveProperty('scout_input_status')
    expect(intakeUpdateEqMock).toHaveBeenCalledWith('id', 'intake-1')
    expect(runPrelaunchScoutForIntakeMock).toHaveBeenCalledWith({
      admin: { from: fromMock },
      intakeId: 'intake-1',
      operatorRepId: null,
      triggerSource: 'intake_submission',
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      mode: 'updated',
      waitlistLinked: false,
      prequalificationStatus: 'qualified',
      fitFlags: [],
      scoutRun: {
        status: 'completed',
        runKey: 'scout:intake-1:2026-05-10T20:00:00.000Z',
      },
    })
  })

  it('keeps intake submission successful when the automatic Scout run fails', async () => {
    waitlistMaybeSingleMock.mockResolvedValueOnce({ data: null, error: null })
    intakeMaybeSingleMock.mockResolvedValueOnce({ data: null, error: null })
    insertMock.mockReturnValueOnce({ select: intakeWriteSelectMock })
    intakeWriteSingleMock.mockResolvedValueOnce({
      data: { id: 'intake-1' },
      error: null,
    })
    runPrelaunchScoutForIntakeMock.mockRejectedValueOnce(
      new Error('Scout unavailable'),
    )

    const response = await POST(
      new Request('http://localhost/api/prelaunch/intake', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Jamie Hart',
          email: 'jamie@example.com',
          phone: '303-555-0123',
          businessName: 'Jamie Hart Jewelry',
          tiktokHandle: '@jamieh',
          teamSize: '1-5',
          primaryPlatform: 'tiktok',
          streamingFrequency: 'weekly',
          currentSetup: 'Bio link',
          setupGoal: 'Cleaner hub',
          deviceSetup: 'phone_and_computer',
          smsConsent: true,
          emailConsent: true,
        }),
      }),
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      mode: 'created',
      waitlistLinked: false,
      prequalificationStatus: 'qualified',
      fitFlags: [],
      scoutRun: {
        status: 'failed',
      },
    })
  })

  it('returns a validation error without contact consent', async () => {
    const response = await POST(
      new Request('http://localhost/api/prelaunch/intake', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Jamie Hart',
          email: 'jamie@example.com',
          phone: '303-555-0123',
          businessName: 'Jamie Hart Jewelry',
          tiktokHandle: '@jamieh',
          teamSize: '1-5',
          primaryPlatform: 'tiktok',
          streamingFrequency: 'weekly',
          currentSetup: 'Bio link',
          setupGoal: 'Cleaner hub',
          deviceSetup: 'phone_and_computer',
          smsConsent: false,
          emailConsent: true,
        }),
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      code: 'INVALID_INPUT',
      error: 'Please agree to get intake follow-up by text.',
    })
  })

  it('rejects a bot-trap submission before writing intake data', async () => {
    const response = await POST(
      new Request('http://localhost/api/prelaunch/intake', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '198.51.100.9',
        },
        body: JSON.stringify({
          fullName: 'Jamie Hart',
          email: 'jamie@example.com',
          phone: '303-555-0123',
          businessName: 'Jamie Hart Jewelry',
          tiktokHandle: '@jamieh',
          teamSize: '1-5',
          primaryPlatform: 'tiktok',
          streamingFrequency: 'weekly',
          currentSetup: 'Bio link',
          setupGoal: 'Cleaner hub',
          deviceSetup: 'phone_and_computer',
          website: 'https://spam.example',
          smsConsent: true,
          emailConsent: true,
        }),
      }),
    )

    expect(waitlistMaybeSingleMock).not.toHaveBeenCalled()
    expect(insertMock).not.toHaveBeenCalled()
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      code: 'SPAM_SUBMISSION',
      error: 'Submission could not be saved.',
    })
  })

  it('rate limits rapid repeat intake submissions from one address', async () => {
    const buildRequest = () =>
      new Request('http://localhost/api/prelaunch/intake', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '203.0.113.23',
        },
        body: JSON.stringify({
          fullName: 'Jamie Hart',
          email: 'jamie@example.com',
          phone: '303-555-0123',
          businessName: 'Jamie Hart Jewelry',
          tiktokHandle: '@jamieh',
          teamSize: '1-5',
          primaryPlatform: 'tiktok',
          streamingFrequency: 'weekly',
          currentSetup: 'Bio link',
          setupGoal: 'Cleaner hub',
          deviceSetup: 'phone_and_computer',
          smsConsent: true,
          emailConsent: true,
        }),
      })

    for (let index = 0; index < 5; index += 1) {
      waitlistMaybeSingleMock.mockResolvedValueOnce({ data: null, error: null })
      intakeMaybeSingleMock.mockResolvedValueOnce({ data: null, error: null })
      insertMock.mockReturnValueOnce({ select: intakeWriteSelectMock })
      intakeWriteSingleMock.mockResolvedValueOnce({
        data: { id: `intake-${index}` },
        error: null,
      })

      expect((await POST(buildRequest())).status).toBe(201)
    }

    const response = await POST(buildRequest())

    expect(response.status).toBe(429)
    await expect(response.json()).resolves.toEqual({
      code: 'RATE_LIMITED',
      error: 'Please wait a minute and try again.',
    })
  })

  it('returns 500 when the insert fails', async () => {
    waitlistMaybeSingleMock.mockResolvedValueOnce({ data: null, error: null })
    intakeMaybeSingleMock.mockResolvedValueOnce({ data: null, error: null })
    insertMock.mockReturnValueOnce({ select: intakeWriteSelectMock })
    intakeWriteSingleMock.mockResolvedValueOnce({
      data: null,
      error: new Error('database unavailable'),
    })

    const response = await POST(
      new Request('http://localhost/api/prelaunch/intake', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Jamie Hart',
          email: 'jamie@example.com',
          phone: '303-555-0123',
          businessName: 'Jamie Hart Jewelry',
          tiktokHandle: '@jamieh',
          teamSize: '1-5',
          primaryPlatform: 'tiktok',
          streamingFrequency: 'weekly',
          currentSetup: 'Bio link',
          setupGoal: 'Cleaner hub',
          deviceSetup: 'phone_and_computer',
          smsConsent: true,
          emailConsent: true,
        }),
      }),
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: 'Failed to save your intake right now.',
    })
  })
})
