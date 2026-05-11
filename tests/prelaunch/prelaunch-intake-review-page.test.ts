import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { PrelaunchIntakeReviewPageContent } from '@/app/internal/prelaunch/intake/_components/PrelaunchIntakeReviewPageContent'
import type { PrelaunchIntakeReviewSubmission } from '@/lib/prelaunch/intake-review'

const submission: PrelaunchIntakeReviewSubmission = {
  id: 'intake-1',
  name: 'Jamie Hart',
  email: 'jamie@example.com',
  phone: '303-555-0123',
  businessName: 'Jamie Hart Jewelry',
  social: {
    tiktok: '@jamieh',
    instagram: '@jamiebling',
    facebook: null,
  },
  team: {
    name: 'Lindsey Team',
    size: '6-20',
  },
  primaryPlatform: 'tiktok',
  streamingFrequency: 'multiple_weekly',
  currentSetup: 'TikTok bio link and DMs',
  setupGoal: 'Cleaner show-night hub',
  deviceSetup: 'phone_only',
  brandVibe: 'polished and warm',
  colorPreferences: 'plum and pearl',
  specialRequests: 'Needs help with launch links',
  intakeStatus: 'submitted',
  prequalificationStatus: 'needs_review',
  fitFlags: ['phone_only_setup'],
  waitlistId: 'waitlist-1',
  scoutInputStatus: 'ready',
  createdAt: '2026-05-09T18:00:00Z',
  updatedAt: '2026-05-09T18:00:00Z',
}

describe('PrelaunchIntakeReviewPageContent', () => {
  it('renders operator summary counts and intake cards', () => {
    const html = renderToStaticMarkup(
      createElement(PrelaunchIntakeReviewPageContent, {
        submissions: [
          submission,
          {
            ...submission,
            id: 'intake-2',
            email: 'morgan@example.com',
            prequalificationStatus: 'qualified',
            fitFlags: [],
            waitlistId: null,
          },
        ],
      }),
    )

    expect(html).toContain('Prelaunch intake review')
    expect(html).toContain('2 total')
    expect(html).toContain('1 needs review')
    expect(html).toContain('1 qualified')
    expect(html).toContain('2 Scout ready')
    expect(html).toContain('Jamie Hart Jewelry')
    expect(html).toContain('jamie@example.com')
    expect(html).toContain('phone_only_setup')
    expect(html).toContain('Waitlist linked')
    expect(html).toContain('Run Scout')
    expect(html).toContain('&quot;intakeId&quot;: &quot;intake-1&quot;')
  })

  it('renders a clear empty state when there are no submissions yet', () => {
    const html = renderToStaticMarkup(
      createElement(PrelaunchIntakeReviewPageContent, { submissions: [] }),
    )

    expect(html).toContain('No intake submissions yet')
    expect(html).toContain('New /prelaunch intake forms will appear here')
  })
})
