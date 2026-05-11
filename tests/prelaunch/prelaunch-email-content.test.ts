import { describe, expect, it } from 'vitest'

import {
  buildInitialPrelaunchNewsletterIssue,
  buildPrelaunchWaitlistWelcomeEmailContent,
} from '@/lib/prelaunch/email-content'

describe('prelaunch email content', () => {
  it('builds a short welcome email with unsubscribe language', () => {
    const email = buildPrelaunchWaitlistWelcomeEmailContent('Jamie Hart')

    expect(email.subject).toBe('Welcome to the Sparkle Suite waitlist')
    expect(email.text).toContain('Hi Jamie Hart,')
    expect(email.text).toContain(
      'better customer experience with less patchwork behind the scenes',
    )
    expect(email.text).toContain('Reply to this email any time')
    expect(email.text).toContain('unsubscribe')
  })

  it('builds a text-first prelaunch newsletter issue draft', () => {
    const issue = buildInitialPrelaunchNewsletterIssue()

    expect(issue.subject).toBe('A smoother rep setup starts with less patchwork')
    expect(issue.text).toContain(
      'A better customer experience starts with a better rep setup.',
    )
    expect(issue.text).toContain('Live event calendar')
    expect(issue.text).toContain('Email updates')
    expect(issue.text).toContain('join the waitlist')
  })
})
