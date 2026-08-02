import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`)
})

vi.mock('next/navigation', () => ({
  redirect: (path: string) => redirectMock(path),
}))

import StartPage, { metadata } from '@/app/start/page'

const originalReviewerMode = process.env.SPARKLE_REVIEWER_SMOKE_MODE
const originalVercelEnv = process.env.VERCEL_ENV

afterEach(() => {
  redirectMock.mockClear()
  if (originalReviewerMode === undefined) {
    delete process.env.SPARKLE_REVIEWER_SMOKE_MODE
  } else {
    process.env.SPARKLE_REVIEWER_SMOKE_MODE = originalReviewerMode
  }
  if (originalVercelEnv === undefined) {
    delete process.env.VERCEL_ENV
  } else {
    process.env.VERCEL_ENV = originalVercelEnv
  }
})

describe('Sparkle Suite public start route', () => {
  it('redirects public visitors to the existing waitlist', async () => {
    process.env.SPARKLE_REVIEWER_SMOKE_MODE = 'false'
    process.env.VERCEL_ENV = 'production'

    await expect(StartPage({})).rejects.toThrow(
      'NEXT_REDIRECT:/prelaunch#waitlist',
    )
    expect(redirectMock).toHaveBeenCalledWith('/prelaunch#waitlist')
  })

  it('preserves the protected reviewer-smoke controls in non-production review mode', async () => {
    process.env.SPARKLE_REVIEWER_SMOKE_MODE = 'true'
    process.env.VERCEL_ENV = 'preview'

    const page = await StartPage({})
    const html = renderToStaticMarkup(page)

    expect(metadata.title).toEqual({
      absolute: 'Sparkle Suite Reviewer Smoke',
    })
    expect(html).toContain('Review Sparkle Suite')
    expect(html).toContain('Reviewer smoke mode')
    expect(html).toContain('Start smoke checkout')
    expect(html).toContain('Open setup preview')
    expect(html).toContain('Open workspace preview')
    expect(html).not.toContain('Continue with Google')
    expect(html).not.toContain('Create account with a different email')
    expect(html).not.toContain('Start Sparkle Suite account creation')
  })

  it('contains no public self-serve signup or checkout wiring', () => {
    const source = readFileSync('app/start/StartSparkleSuiteForm.tsx', 'utf8')

    expect(source).toContain('/api/reviewer-smoke/session')
    expect(source).not.toContain('/api/self-serve/signup')
    expect(source).not.toContain('/api/stripe/create-checkout')
    expect(source).not.toContain('signInWithOAuth')
    expect(source).not.toContain('agreementAccepted')
    expect(source).not.toContain('referralCode')
  })
})
