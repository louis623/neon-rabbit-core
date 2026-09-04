import { beforeEach, describe, expect, it } from 'vitest'

import { ServiceError } from '@/lib/services/errors'
import {
  buildTeamOnboardingAccessUrl,
  createTeamOnboardingInviteSlug,
  resolveTeamOnboardingBaseUrl,
} from '@/lib/team-onboarding/invite-url'

describe('team onboarding invite URLs', () => {
  beforeEach(() => {
    process.env.TEAM_ONBOARDING_BASE_URL =
      'https://brittany-start-strong.chatgpt.site'
    process.env.TEAM_ONBOARDING_ALLOWED_ORIGINS =
      'https://brittany-start-strong.chatgpt.site'
    delete process.env.TEAM_ONBOARDING_CUSTOM_DOMAIN_ENABLED
  })

  it('includes the new rep first name, sending lead identity, optional team, and opaque query token', () => {
    const result = buildTeamOnboardingAccessUrl({
      baseUrl: 'https://brittany-start-strong.chatgpt.site',
      token: 'opaque-token-value',
      participantDisplayName: 'Alex Rivera',
      leadDisplayName: 'Brittany James',
      teamName: 'The Virtuous Fizzers',
    })

    expect(result).toBe(
      'https://brittany-start-strong.chatgpt.site/alex-brittany-virtuous-fizzers?invite=opaque-token-value',
    )
    expect(result).not.toContain('rivera')
    expect(result).not.toContain('james')
  })

  it('rejects missing, attacker-controlled, and retired personal bases', () => {
    delete process.env.TEAM_ONBOARDING_BASE_URL
    expect(() => resolveTeamOnboardingBaseUrl()).toThrowError(
      expect.objectContaining({ code: 'TEAM_ONBOARDING_HOST_NOT_CONFIGURED' }),
    )

    process.env.TEAM_ONBOARDING_BASE_URL =
      'https://brittany-start-strong.chatgpt.site'
    expect(() =>
      resolveTeamOnboardingBaseUrl('https://evil.example/collect'),
    ).toThrowError(expect.objectContaining({ code: 'INVALID_INPUT' }))
    expect(() =>
      resolveTeamOnboardingBaseUrl(
        'https://brittany-start-strong.chatgpt.site/alex@example.com',
      ),
    ).toThrowError(expect.objectContaining({ code: 'INVALID_INPUT' }))

    process.env.TEAM_ONBOARDING_BASE_URL =
      'https://brittwithbling-start-strong.louis526569.chatgpt.site'
    process.env.TEAM_ONBOARDING_ALLOWED_ORIGINS =
      'https://brittwithbling-start-strong.louis526569.chatgpt.site'
    expect(() => resolveTeamOnboardingBaseUrl()).toThrowError(
      expect.objectContaining({ code: 'TEAM_ONBOARDING_HOST_RETIRED' }),
    )
  })

  it('rejects email or phone identities and omits contact-like optional team text', () => {
    const unsafeIdentities = [
      { participantDisplayName: 'alex@example.com', leadDisplayName: 'Brittany' },
      { participantDisplayName: 'Alex', leadDisplayName: '+1 (555) 123-4567' },
    ]

    for (const identity of unsafeIdentities) {
      expect(() => createTeamOnboardingInviteSlug(identity)).toThrowError(
        ServiceError,
      )
    }

    expect(
      createTeamOnboardingInviteSlug({
        participantDisplayName: 'Alex Rivera',
        leadDisplayName: 'Brittany James',
        teamName: 'Call 555-123-4567',
      }),
    ).toBe('alex-brittany')
  })
})
