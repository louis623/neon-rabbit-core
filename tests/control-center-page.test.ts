import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedOperatorMock = vi.fn()
const createAdminClientMock = vi.fn()
const listOperatorSupportReportsMock = vi.fn()
const listOperatorCustomerProfilesMock = vi.fn()
const redirectMock = vi.fn((target: string) => {
  throw new Error(`redirect:${target}`)
})

const { MockAuthError, MockOperatorAuthError } = vi.hoisted(() => ({
  MockAuthError: class MockAuthError extends Error {},
  MockOperatorAuthError: class MockOperatorAuthError extends Error {},
}))

vi.mock('next/navigation', () => ({
  redirect: (target: string) => redirectMock(target),
}))

vi.mock('@/lib/supabase/operator-auth', () => ({
  AuthError: MockAuthError,
  OperatorAuthError: MockOperatorAuthError,
  getAuthenticatedOperator: (...args: unknown[]) =>
    getAuthenticatedOperatorMock(...args),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

vi.mock('@/lib/services/support-reports', () => ({
  listOperatorSupportReports: (...args: unknown[]) =>
    listOperatorSupportReportsMock(...args),
}))

vi.mock('@/lib/services/client-account-profiles', () => ({
  listOperatorCustomerProfiles: (...args: unknown[]) =>
    listOperatorCustomerProfilesMock(...args),
}))

vi.mock(
  '@/app/internal/prelaunch/intake/_components/ControlCenterThemeToggle',
  () => ({
    ControlCenterThemeToggle: () => createElement('div', null, 'Theme toggle'),
  }),
)

import SparkleSuiteControlCenterPage from '@/app/control-center/page'

function customerProfile(overrides: Record<string, unknown> = {}) {
  const billing =
    typeof overrides.billing === 'object' && overrides.billing !== null
      ? (overrides.billing as Record<string, unknown>)
      : {}

  return {
    repId: 'rep-default',
    clientName: 'Default Rep',
    showName: 'Default Show',
    primaryContactName: 'Default Rep',
    email: 'default@example.com',
    phone: '555-000-0000',
    referral: {
      code: null,
      usageCount: 0,
    },
    accountStatus: 'active',
    subscriptionStatus: 'active',
    supportTier: 'founder',
    publicSiteSlug: 'defaultshow',
    customDomain: null,
    shopLink: null,
    streamingLinks: {},
    socialHandles: {},
    internalNotes: null,
    setupStatus: 'dashboard_unlocked',
    setupCurrentStep: 'final_preview_approval',
    billing: {
      status: 'active',
      planTier: 'monthly',
      pricingTier: 'founder',
      monthlyAmount: 49,
      currentPeriodEnd: null,
      stripeCustomerId: null,
      ...billing,
    },
    ...overrides,
  }
}

describe('SparkleSuiteControlCenterPage', () => {
  beforeEach(() => {
    getAuthenticatedOperatorMock.mockReset()
    createAdminClientMock.mockReset()
    listOperatorSupportReportsMock.mockReset()
    listOperatorCustomerProfilesMock.mockReset()
    redirectMock.mockClear()
    getAuthenticatedOperatorMock.mockResolvedValue({
      repId: 'operator-1',
      rep: { email: 'louis@neonrabbit.net' },
    })
    createAdminClientMock.mockReturnValue({ from: vi.fn() })
    listOperatorSupportReportsMock.mockResolvedValue([
      {
        id: 'report-1',
        report_type: 'bug',
        urgency: 'blocking',
        status: 'open',
        audit_status: 'completed',
        source: 'help_form',
        title: 'Trade Board item vanished',
        page_or_workflow: 'Trade Board',
        details: 'The replacement listing did not show after approval.',
        client_snapshot: {
          clientName: 'Jane Roberts',
          showName: "Jane's Sparkle Party",
          phone: '555-123-4567',
          email: 'jane@example.com',
        },
        created_at: '2026-06-12T17:00:00.000Z',
      },
    ])
    listOperatorCustomerProfilesMock.mockResolvedValue([
      {
        repId: 'rep-1',
        clientName: 'Jane Roberts',
        showName: "Jane's Sparkle Party",
        primaryContactName: 'Jane Roberts',
        email: 'jane@example.com',
        phone: '555-123-4567',
        referral: {
          code: 'SS-JANE12',
          usageCount: 3,
        },
        accountStatus: 'active',
        subscriptionStatus: 'active',
        supportTier: 'founder',
        publicSiteSlug: 'janesparkleparty',
        customDomain: 'jane.example',
        shopLink: 'https://shop.example/jane',
        streamingLinks: { tiktok: 'https://www.tiktok.com/@janesparkle' },
        socialHandles: { instagram: '@janesparkle' },
        internalNotes: 'Prefers text for urgent billing questions.',
        setupStatus: 'dashboard_unlocked',
        setupCurrentStep: 'final_preview_approval',
        billing: {
          status: 'active',
          planTier: 'monthly',
          pricingTier: 'founder',
          monthlyAmount: 49,
          currentPeriodEnd: '2026-07-12T17:00:00.000Z',
          stripeCustomerId: 'cus_123',
        },
      },
    ])
  })

  it('renders the Sparkle Suite Control Center with support and customer database sections', async () => {
    const page = await SparkleSuiteControlCenterPage()
    const html = renderToStaticMarkup(page)

    expect(redirectMock).not.toHaveBeenCalled()
    expect(getAuthenticatedOperatorMock).toHaveBeenCalledOnce()
    expect(listOperatorSupportReportsMock).toHaveBeenCalledWith(
      { from: expect.any(Function) },
      { limit: 50 },
    )
    expect(listOperatorCustomerProfilesMock).toHaveBeenCalledWith(
      { from: expect.any(Function) },
      { limit: 200 },
    )
    expect(html).toContain('Sparkle Suite Control Center')
    expect(html).not.toContain('Support Command Center')
    expect(html).toContain('Control Center Options')
    expect(html).toContain('Support Inbox')
    expect(html).toContain('Customer Database')
    expect(html).toContain('Report Detail')
    expect(html).toContain('Rep Profile')
    expect(html).toContain('Resolution')
    expect(html).toContain('Trade Board item vanished')
    expect(html).toContain('Jane Roberts')
    expect(html).toContain("Jane&#x27;s Sparkle Party")
    expect(html).toContain('Founder')
    expect(html).toContain('Phone')
    expect(html).toContain('555-123-4567')
    expect(html).toContain('Promo code')
    expect(html).toContain('SS-JANE12')
    expect(html).toContain('Promo uses')
    expect(html).toContain('3')
    expect(html).toContain('jane.example')
    expect(html).toContain('Prefers text for urgent billing questions.')
    expect(html).toContain('aria-label="Expand Jane Roberts profile"')
  })

  it('separates active customer accounts from demo accounts', async () => {
    listOperatorCustomerProfilesMock.mockResolvedValueOnce([
      customerProfile({
        repId: 'rep-mile-high-fizz',
        clientName: 'Lindsey',
        showName: 'Mile High Fizz',
        publicSiteSlug: 'milehighfizz',
      }),
      customerProfile({
        repId: 'rep-britt-with-bling',
        clientName: 'Brittany',
        showName: 'Britt With Bling',
        publicSiteSlug: 'brittwithbling',
      }),
      customerProfile({
        repId: 'rep-blingkitchen',
        clientName: 'Heather',
        showName: 'BlingKitchen',
        publicSiteSlug: 'blingkitchen',
      }),
      customerProfile({
        repId: 'rep-demo',
        clientName: 'Demo Sparkle Rep',
        showName: 'Demo Sparkle Show',
        publicSiteSlug: 'demo-sparkle-show',
      }),
    ])

    const page = await SparkleSuiteControlCenterPage()
    const html = renderToStaticMarkup(page)

    expect(html).toContain('href="#customer-database"')
    expect(html).toContain('href="#demo-database"')
    expect(html).toContain('Customer Database')
    expect(html).toContain('Demo Database')
    expect(html).toContain('3 customer accounts')
    expect(html).toContain('1 demo account')
    expect(html).toContain('Mile High Fizz')
    expect(html).toContain('Britt With Bling')
    expect(html).toContain('BlingKitchen')
    expect(html).toContain('Demo Sparkle Rep')
    expect(html).toContain('Demo Sparkle Show')
    expect(html).toContain('Demo Account')
  })

  it('redirects unauthenticated operators to login', async () => {
    getAuthenticatedOperatorMock.mockRejectedValueOnce(
      new MockAuthError('missing session'),
    )

    await expect(SparkleSuiteControlCenterPage()).rejects.toThrow(
      'redirect:/login?redirect=%2Fcontrol-center',
    )

    expect(listOperatorSupportReportsMock).not.toHaveBeenCalled()
    expect(listOperatorCustomerProfilesMock).not.toHaveBeenCalled()
  })

  it('renders an operator access required message for non-operators', async () => {
    getAuthenticatedOperatorMock.mockRejectedValueOnce(
      new MockOperatorAuthError('not operator'),
    )

    const page = await SparkleSuiteControlCenterPage()
    const html = renderToStaticMarkup(page)

    expect(html).toContain('Operator access required')
    expect(listOperatorSupportReportsMock).not.toHaveBeenCalled()
    expect(listOperatorCustomerProfilesMock).not.toHaveBeenCalled()
  })
})
