import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  AccountBillingCard,
  BusinessCalculatorCard,
  DashboardPlaceholder,
  HelpResourcesCard,
  ReferralProgramCard,
  TradeBoardWorkspaceCard,
  CustomerRosterCard,
  SiteSettingsCard,
  ShowCalendarCard,
  TeamManagementCard,
  WalletSummaryCard,
  WorkspaceAccessNotice,
  buildShowCalendarCells,
  buildCustomerSparkleSiteHref,
  getAutoRechargeAmountOptions,
  getAutoRechargeDraft,
  getAutoRechargeThresholdOptions,
  getInitialWorkspaceSection,
  getVisibleWorkspaceSections,
  hasPaidWorkspaceSubscription,
  isComingSoonWorkspaceSection,
  resolveWorkspaceSectionForAccess,
  shouldShowWorkspaceLoadingSkeleton,
  shouldShowWorkspaceAccessNotice,
  filterRosterCustomers,
  getWalletBannerMessage,
  getWalletLoadOptions,
  getCustomerOutreachActions,
  getCustomerActions,
  getCustomerChannelStatuses,
  getCustomerDuplicateSummary,
  getVisibleContactValues,
  getCustomerRecoveryActions,
  getCustomerTimeline,
  getEstimatedTextsRemaining,
  getShowCalendarMetrics,
  getWorkspaceSkinPreset,
  calculateBusinessCalculator,
  calculateSingleShowCalculator,
  buildTradeBoardFetchUrl,
  getJewelryLibrarySearchErrorMessage,
  type DashboardPlaceholderProps,
  formatHeaderRepName,
  formatHeaderRepShow,
  formatHeaderShowName,
  formatWalletAmount,
  needsFreshOptIn,
  sortRosterCustomers,
  searchRosterCustomers,
} from '@/app/nic-nac/components/DashboardPlaceholder'
import { getHelpResources } from '@/lib/services/help-resources'

const READY_STATE = {
  status: 'ready' as const,
  summary: {
    totalCustomers: 3,
    smsReachableCount: 1,
    emailReachableCount: 2,
    marketingConsentCount: 2,
    smsOptedOutCount: 1,
    emailOptedOutCount: 0,
    addedLast30DaysCount: 2,
  },
  customers: [
    {
      id: 'aud-1',
      name: 'Jamie Lane',
      phone: '+15555550101',
      email: 'jamie@example.com',
      smsConsent: true,
      emailConsent: true,
      marketingConsent: true,
      canReceiveSms: true,
      canReceiveEmail: true,
      consentDate: '2026-05-05T12:00:00Z',
      createdAt: '2026-05-05T12:00:00Z',
      smsOptedOutAt: null,
      emailOptedOutAt: null,
      stopKeywordReceivedAt: null,
    },
    {
      id: 'aud-2',
      name: 'Morgan Lee',
      phone: '+15555550102',
      email: null,
      smsConsent: true,
      emailConsent: false,
      marketingConsent: false,
      canReceiveSms: false,
      canReceiveEmail: false,
      consentDate: '2026-05-04T12:00:00Z',
      createdAt: '2026-05-04T12:00:00Z',
      smsOptedOutAt: '2026-05-05T14:00:00Z',
      emailOptedOutAt: null,
      stopKeywordReceivedAt: '2026-05-05T14:00:00Z',
    },
    {
      id: 'aud-3',
      name: 'Taylor Brooks',
      phone: null,
      email: 'taylor@example.com',
      smsConsent: false,
      emailConsent: true,
      marketingConsent: true,
      canReceiveSms: false,
      canReceiveEmail: true,
      consentDate: '2026-05-03T12:00:00Z',
      createdAt: '2026-05-03T12:00:00Z',
      smsOptedOutAt: null,
      emailOptedOutAt: null,
      stopKeywordReceivedAt: null,
    },
  ],
}

describe('workspace request error copy', () => {
  it('keeps jewelry library search failures plain-English for reps', () => {
    expect(getJewelryLibrarySearchErrorMessage(500)).toBe(
      'Unable to search the jewelry library right now. Try again in a minute, or ask Nic-Nac to help look up the piece.',
    )
    expect(getJewelryLibrarySearchErrorMessage(401)).not.toContain('401')
    expect(getJewelryLibrarySearchErrorMessage(500)).not.toContain(
      'jewelry library request failed',
    )
  })
})

const DUPLICATE_CUSTOMERS = [
  {
    id: 'dup-1',
    name: 'Jamie Lane',
    phone: '+15555550101',
    email: 'jamie@example.com',
    smsConsent: true,
    emailConsent: true,
    marketingConsent: true,
    canReceiveSms: true,
    canReceiveEmail: true,
    consentDate: '2026-05-05T12:00:00Z',
    createdAt: '2026-05-05T12:00:00Z',
    smsOptedOutAt: null,
    emailOptedOutAt: null,
    stopKeywordReceivedAt: null,
  },
  {
    id: 'dup-2',
    name: 'Jamie Lane Alt',
    phone: '+1 (555) 555-0101',
    email: 'JAMIE@example.com',
    smsConsent: true,
    emailConsent: true,
    marketingConsent: true,
    canReceiveSms: true,
    canReceiveEmail: true,
    consentDate: '2026-05-04T12:00:00Z',
    createdAt: '2026-05-04T12:00:00Z',
    smsOptedOutAt: null,
    emailOptedOutAt: null,
    stopKeywordReceivedAt: null,
  },
]

const WALLET_READY_STATE = {
  status: 'ready' as const,
  summary: {
    balanceMils: 24991,
    balanceUsd: 24.991,
    estimatedTextsRemaining: 2776,
    messagesSentThisMonth: 7,
    messagesSpendThisMonthMils: 63,
    messagesSpendThisMonthUsd: 0.063,
    autoRechargeEnabled: true,
    autoRechargePending: false,
    autoRechargeThresholdMils: 5000,
    autoRechargeThresholdUsd: 5,
    autoRechargeAmountMils: 25000,
    autoRechargeAmountUsd: 25,
    minimumLoadAmountMils: 25000,
    minimumLoadAmountUsd: 25,
    lastLoadedAt: '2026-05-05T12:00:00Z',
    recentTransactions: [
      {
        id: 'tx-1',
        type: 'load' as const,
        amountMils: 25000,
        description: 'Wallet load',
        createdAt: '2026-05-05T12:00:00Z',
      },
      {
        id: 'tx-2',
        type: 'sms_charge' as const,
        amountMils: 9,
        description: 'SMS send',
        createdAt: '2026-05-05T14:00:00Z',
      },
    ],
  },
}

const CALENDAR_READY_STATE = {
  status: 'ready' as const,
  summary: {
    upcomingEvents: [
      {
        id: 'show-1',
        repId: 'rep-1',
        platform: 'Facebook Live',
        eventTime: '2026-05-15T19:00:00.000Z',
        timeZone: 'America/New_York',
        durationMinutes: 60,
        title: 'Thursday reveal',
        description: null,
        discountCodes: [],
        featuredCollections: null,
        isRecurring: true,
        recurrenceGroupId: 'group-1',
        recurrenceRule: 'FREQ=WEEKLY',
        status: 'scheduled' as const,
        createdAt: '2026-05-01T10:00:00.000Z',
        updatedAt: '2026-05-01T10:00:00.000Z',
      },
      {
        id: 'show-2',
        repId: 'rep-1',
        platform: 'TikTok Live',
        eventTime: '2026-05-18T20:30:00.000Z',
        timeZone: 'America/New_York',
        durationMinutes: 90,
        title: '',
        description: 'Sunday party',
        discountCodes: [],
        featuredCollections: null,
        isRecurring: false,
        recurrenceGroupId: null,
        recurrenceRule: null,
        status: 'scheduled' as const,
        createdAt: '2026-05-02T10:00:00.000Z',
        updatedAt: '2026-05-02T10:00:00.000Z',
      },
    ],
    recentEvents: [
      {
        id: 'show-3',
        repId: 'rep-1',
        platform: 'Facebook Live',
        eventTime: '2026-05-05T19:00:00.000Z',
        timeZone: 'America/New_York',
        durationMinutes: 60,
        title: 'Launch party',
        description: null,
        discountCodes: [],
        featuredCollections: null,
        isRecurring: false,
        recurrenceGroupId: null,
        recurrenceRule: null,
        status: 'completed' as const,
        createdAt: '2026-05-01T10:00:00.000Z',
        updatedAt: '2026-05-05T21:00:00.000Z',
      },
    ],
  },
}

const SITE_SETTINGS_READY_STATE = {
  status: 'ready' as const,
  settings: {
    displayName: 'Louis',
    businessName: 'Sparkle by Sasha',
    email: 'hello@sparklebysasha.com',
    phone: '+19045551234',
    bannerText: 'Going live tonight',
    bannerVisible: true,
    tickerText: 'Fresh reveals every Tuesday',
    tickerVisible: false,
    tagline: 'Live sparkle, zero stress.',
    heroImageUrl: 'https://cdn.example.com/hero.jpg',
    heroAnimationType: 'soft_glow' as const,
    teamName: 'Moonstone Squad',
    showJoinPage: true,
    customerSiteTemplate: 'amethyst' as const,
    appearancePreset: 'amethyst' as const,
    socialHandles: {
      instagram: '@sparklebysasha',
      facebook: 'sparklebysasha',
    },
  },
}

const ACCOUNT_BILLING_READY_STATE = {
  status: 'ready' as const,
  summary: {
    stripeConfigured: true,
    checkoutMode: 'standard' as const,
    subscription: {
      status: 'active' as const,
      planType: 'monthly' as const,
      currentPeriodEnd: '2026-06-01T00:00:00Z',
      cancelAtPeriodEnd: true,
      cancelledAt: null,
      livemode: false,
    },
    paymentMethod: {
      brand: 'visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2028,
    },
    invoices: [
      {
        id: 'in_1',
        createdAt: '2026-05-01T12:00:00Z',
        amountPaidCents: 9900,
        currency: 'usd',
        status: 'paid',
        hostedInvoiceUrl: 'https://stripe.test/in_1',
        invoicePdfUrl: 'https://stripe.test/in_1.pdf',
      },
    ],
    referral: {
      code: 'SS-K7M4Q9',
      link: 'https://sparkle-suite.example/start?ref=SS-K7M4Q9',
      pendingCount: 2,
      earnedCount: 1,
      creditedCount: 3,
    },
    canStartSubscription: false,
    canManageBilling: true,
  },
}

const TRADE_BOARD_READY_STATE = {
  status: 'ready' as const,
  board: {
    summary: {
      totalPieces: 2,
      totalMsrp: 78,
      typeBreakdown: { RG: 1, NK: 0, ER: 0, ST: 1, BR: 0 },
      pendingRequestCount: 0,
    },
    listings: [
      {
        id: 'listing-1',
        rep_id: 'rep-1',
        status: 'available' as const,
        rep_notes: null,
        trade_preferences: null,
        listing_photo_url: 'https://cdn.example.com/sapphire-halo.jpg',
        uses_canonical_photo: false,
        listed_at: '2026-05-05T12:00:00Z',
        removal_reason: null,
        deleted_at: null,
        created_at: '2026-05-05T12:00:00Z',
        updated_at: '2026-05-05T12:00:00Z',
        design: {
          id: 'design-1',
          item_number: 'RG100',
          design_name: 'Sapphire Halo',
          material: 'Sterling',
          main_stone: 'Sapphire',
          bp_msrp: 39,
          canonical_photo_url: null,
          type_prefix: 'RG' as const,
          collection: { id: 'collection-1', name: 'Birthday' },
        },
      },
      {
        id: 'listing-2',
        rep_id: 'rep-1',
        status: 'available' as const,
        rep_notes: null,
        trade_preferences: null,
        listing_photo_url: null,
        uses_canonical_photo: true,
        listed_at: '2026-05-06T12:00:00Z',
        removal_reason: null,
        deleted_at: null,
        created_at: '2026-05-06T12:00:00Z',
        updated_at: '2026-05-06T12:00:00Z',
        design: {
          id: 'design-2',
          item_number: 'ST200',
          design_name: 'Rose Quartz Stack',
          material: 'Rose gold',
          main_stone: 'Quartz',
          bp_msrp: 39,
          canonical_photo_url: null,
          type_prefix: 'ST' as const,
          collection: { id: 'collection-2', name: 'OG' },
        },
      },
    ],
  },
}

describe('DashboardPlaceholder', () => {
  it('keeps help resources out of old first-run checklist framing', () => {
    const helpText = getHelpResources()
      .flatMap((resource) => [
        resource.title,
        resource.summary,
        resource.body,
        ...resource.quickActions,
      ])
      .join(' ')

    expect(helpText).not.toContain('after checkout')
    expect(helpText).not.toContain('setup checklist')
    expect(helpText).not.toContain('Start setup checklist')
  })

  it('renders the Sparkle Suite Nic-Nac workspace shell', () => {
    const html = renderToStaticMarkup(createElement(DashboardPlaceholder))

    expect(html).toContain('Sparkle Suite')
    expect(html).toContain('Workspace')
    expect(html).not.toContain('Sparkle Suite workspace')
    expect(html).toContain('>Rep<')
    expect(html).toContain('>Show<')
    expect(html).not.toContain('Rep / show')
    expect(html).toContain('Live Queue sync code')
    expect(html).not.toContain('Saved here for future extension setup.')
    expect(html).not.toContain('Checking workspace access')
    expect(html).not.toContain('Open account')
    expect(html).toContain('Track active pieces, requests, fulfillment, and trade history from one place.')
    expect(html).toContain('Request inbox')
    expect(html).toContain('Loading board')
    expect(html).not.toContain('View live site')
    expect(html).not.toContain('href="/amethyst/Homepage.html"')
    expect(html).toContain('viewBox="0 0 64 64"')
    expect(html).not.toContain('Setup Checklist')
    expect(html).not.toContain('Confirm business/profile basics')
    expect(html).not.toContain('Understand the Chrome extension and Live Queue')
    expect(html).toContain('Trade Board</span>')
    expect(html).toContain('Jewelry Library')
    expect(html).toContain('Calendar</span>')
    expect(html).toContain('Business Calculator')
    expect(html).toContain('Team Management')
    expect(html).toContain('Messages</span>')
    expect((html.match(/Coming soon/g) ?? []).length).toBe(3)
    expect(html).not.toContain('Locked</span>')
    expect(html).toContain('Public page copy and branding')
    expect(html).toContain('Help &amp; Resources')
    expect(html).toContain('Account')
    expect(html).toContain('Listings, requests, queue, and history')
    expect(html).not.toContain('I confirm I own the piece')
  })

  it('renders Help & Resources as a workflow playbook with a secondary feature index', () => {
    const html = renderToStaticMarkup(
      createElement(HelpResourcesCard, {
        state: { status: 'ready', resources: getHelpResources() },
        hasPaidWorkspace: true,
      }),
    )

    expect(html).toContain('Pick what you are trying to do')
    expect(html).toContain('Workflow Playbook')
    expect(html).toContain('Start here: Learn your Sparkle Suite workspace')
    expect(html).toContain('Add jewelry to your Trade Board')
    expect(html).toContain('Goal')
    expect(html).toContain('Use this when')
    expect(html).toContain('Before you start')
    expect(html).toContain('Good result')
    expect(html).toContain('Ask Nic-Nac')
    expect(html).toContain('Still stuck')
    expect(html).toContain('Feature Index')
    expect(html).toContain('Support Path')
    expect(html).not.toContain('Choose your look')
    expect(html).not.toContain('Customer Site Looks')
    expect(html).not.toContain('Full skin gallery')
    expect(html).not.toContain('Classic Sparkle')
  })

  it('keeps Help & Resources scannable with collapsed section disclosures', () => {
    const html = renderToStaticMarkup(
      createElement(HelpResourcesCard, {
        state: { status: 'ready', resources: getHelpResources() },
        hasPaidWorkspace: true,
      }),
    )

    expect(html).toContain('<details class="')
    expect(html).toContain('Setup')
    expect(html).toContain('Live Shows')
    expect(html).toContain('Feature Index')
    expect(html).toContain('Support Path')
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('Open section')
    expect(html).not.toContain('<section class="')
  })

  it('deep-links workspace sections without self-serve-started first-run routing', () => {
    expect(getInitialWorkspaceSection('?section=account')).toBe('account')
    expect(getInitialWorkspaceSection('?section=trade-board')).toBe('trade-board')
    expect(getInitialWorkspaceSection('?section=business-calculator')).toBe(
      'trade-board',
    )
    expect(getInitialWorkspaceSection('?section=team-management')).toBe(
      'trade-board',
    )
    expect(getInitialWorkspaceSection('?section=messages')).toBe('trade-board')
    expect(getInitialWorkspaceSection('?section=unknown')).toBe('trade-board')
    expect(getInitialWorkspaceSection('?onboarding=self-serve-started')).toBe(
      'trade-board',
    )
  })

  it('keeps the dashboard section list complete for unlocked workspace reps', () => {
    expect(hasPaidWorkspaceSubscription(null)).toBe(false)
    expect(
      hasPaidWorkspaceSubscription({
        ...ACCOUNT_BILLING_READY_STATE.summary,
        subscription: null,
      }),
    ).toBe(false)
    expect(
      hasPaidWorkspaceSubscription({
        ...ACCOUNT_BILLING_READY_STATE.summary,
        subscription: {
          ...ACCOUNT_BILLING_READY_STATE.summary.subscription!,
          status: 'active',
        },
      }),
    ).toBe(true)
    expect(getVisibleWorkspaceSections(false).map((section) => section.key)).toEqual([
      'trade-board',
      'jewelry-library',
      'show-calendar',
      'business-calculator',
      'team-management',
      'messages',
      'site-settings',
      'help-resources',
      'account',
    ])
    expect(resolveWorkspaceSectionForAccess('trade-board', false)).toBe('trade-board')
    expect(resolveWorkspaceSectionForAccess('help-resources', false)).toBe('help-resources')
    expect(isComingSoonWorkspaceSection('business-calculator')).toBe(true)
    expect(isComingSoonWorkspaceSection('team-management')).toBe(true)
    expect(isComingSoonWorkspaceSection('messages')).toBe(true)
    expect(isComingSoonWorkspaceSection('jewelry-library')).toBe(false)
    expect(resolveWorkspaceSectionForAccess('business-calculator', true)).toBe(
      'trade-board',
    )
    expect(resolveWorkspaceSectionForAccess('team-management', true)).toBe(
      'trade-board',
    )
    expect(resolveWorkspaceSectionForAccess('messages', true)).toBe('trade-board')
  })

  it('shows account access guidance instead of a blank panel for locked workspace sections', () => {
    expect(shouldShowWorkspaceAccessNotice('trade-board', false)).toBe(true)
    expect(shouldShowWorkspaceAccessNotice('trade-board', false, true)).toBe(false)
    expect(shouldShowWorkspaceAccessNotice('show-calendar', false)).toBe(true)
    expect(shouldShowWorkspaceAccessNotice('help-resources', false)).toBe(false)
    expect(shouldShowWorkspaceAccessNotice('account', false)).toBe(false)
    expect(shouldShowWorkspaceAccessNotice('trade-board', true)).toBe(false)
    expect(shouldShowWorkspaceLoadingSkeleton('trade-board', true)).toBe(true)
    expect(shouldShowWorkspaceLoadingSkeleton('account', true)).toBe(false)
    expect(shouldShowWorkspaceLoadingSkeleton('help-resources', true)).toBe(false)
    expect(shouldShowWorkspaceLoadingSkeleton('trade-board', false)).toBe(false)

    const html = renderToStaticMarkup(
      createElement(WorkspaceAccessNotice, {
        sectionLabel: 'Trade Board',
        state: {
          status: 'ready',
          summary: {
            ...ACCOUNT_BILLING_READY_STATE.summary,
            subscription: null,
            paymentMethod: null,
            invoices: [],
            canStartSubscription: true,
            canManageBilling: true,
          },
        },
        agreementAccepted: false,
      }),
    )

    expect(html).toContain('Trade Board needs account setup')
    expect(html).toContain('Your account page has the current checkout or billing step.')
    expect(html).toContain('Open account')
    expect(html).toContain('Continue to secure Stripe checkout')
  })

  it('starts workspace section data loading without waiting on billing access data', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'app/nic-nac/components/DashboardPlaceholder.tsx'),
      'utf8',
    )
    const loadEffectStart = source.indexOf('void loadPaidWorkspaceData(controller.signal)')
    const loadEffectSource = source.slice(
      source.lastIndexOf('useEffect(() => {', loadEffectStart),
      source.indexOf('}, [reviewWorkspaceMode])', loadEffectStart),
    )

    expect(loadEffectStart).toBeGreaterThan(-1)
    expect(loadEffectSource).not.toContain("accountBillingState.status !== 'ready'")
    expect(loadEffectSource).not.toContain('hasPaidWorkspaceSubscription(accountBillingState.summary)')
  })

  it('renders the locked team management add-on skeleton', () => {
    const html = renderToStaticMarkup(createElement(TeamManagementCard))

    expect(html).toContain('Team Management')
    expect(html).toContain('Paid add-on locked')
    expect(html).toContain('Upgrade to manage your team on this platform.')
    expect(html).toContain('href="/prelaunch"')
    expect(html).toContain('Team member intake')
    expect(html).toContain('Name')
    expect(html).toContain('Phone number')
    expect(html).toContain('Email')
    expect(html).toContain('Team name')
    expect(html).toContain('Social link 1')
    expect(html).toContain('Social link 2')
    expect(html).toContain('Social link 3')
    expect(html).toContain('Team directory')
    expect(html).toContain('Onboarding website messages')
    expect(html).toContain('Reply composer')
    expect(html).toContain('disabled=""')
  })

  it('formats the workspace header rep/show label without deriving sync codes from rep ids', () => {
    expect(formatHeaderRepShow('Louis', 'Sparkle by Sasha')).toBe(
      'Louis / Sparkle by Sasha',
    )
    expect(formatHeaderRepShow('', 'Sparkle by Sasha')).toBe('Sparkle by Sasha')
    expect(formatHeaderRepShow(undefined, undefined)).toBe('Rep info loading')
    expect(formatHeaderRepName('Louis')).toBe('Louis')
    expect(formatHeaderRepName(undefined)).toBe('Rep info loading')
    expect(formatHeaderShowName('Sparkle by Sasha')).toBe('Sparkle by Sasha')
    expect(formatHeaderShowName(undefined)).toBe('Show info loading')
    const source = readFileSync(
      resolve(process.cwd(), 'app/nic-nac/components/DashboardPlaceholder.tsx'),
      'utf8',
    )
    expect(source).not.toContain('formatExtensionRepId(')
  })

  it('renders the saved Live Queue sync code in the workspace topbar', () => {
    const html = renderToStaticMarkup(
      createElement<DashboardPlaceholderProps>(DashboardPlaceholder, {
        liveQueueSyncCodeOverride: 'MHF-7342',
      }),
    )
    const css = readFileSync(
      resolve(process.cwd(), 'app/nic-nac/components/DashboardPlaceholder.module.css'),
      'utf8',
    )

    expect(html).toContain('Live Queue sync code')
    expect(html).toContain('MHF-7342')
    expect(html).toContain('>Rep<')
    expect(html).toContain('>Show<')
    expect(html).not.toContain('Rep / show')
    expect(html).not.toContain('Saved here for future extension setup.')
    expect(html).not.toContain('Extension code')
    expect(css).toContain('align-items: center;')
    expect(css).toContain('min-height: 52px;')
    expect(css).toContain('font-size: 14px;')
    expect(css).toContain('text-align: center;')
  })

  it('keeps the workspace shell on the Morganite Sparkle Suite skin regardless of saved or draft appearance rows', () => {
    expect(getWorkspaceSkinPreset()).toBe('sparkle_suite_morganite')
    expect(
      getWorkspaceSkinPreset({
        ...SITE_SETTINGS_READY_STATE.settings,
        appearancePreset: 'velvet',
      }),
    ).toBe('sparkle_suite_morganite')
    expect(
      getWorkspaceSkinPreset(
        {
          ...SITE_SETTINGS_READY_STATE.settings,
          appearancePreset: 'rose_gold',
        },
        {
          ...SITE_SETTINGS_READY_STATE.settings,
          appearancePreset: 'black_diamond',
        },
      ),
    ).toBe('sparkle_suite_morganite')
    expect(
      getWorkspaceSkinPreset({
        ...SITE_SETTINGS_READY_STATE.settings,
        appearancePreset: 'softGlam' as never,
      }),
    ).toBe('sparkle_suite_morganite')
  })

  it('marks the workspace shell with the normalized site appearance preset', () => {
    const html = renderToStaticMarkup(
      createElement<DashboardPlaceholderProps>(DashboardPlaceholder, {
        initialSiteSettings: {
          ...SITE_SETTINGS_READY_STATE.settings,
          appearancePreset: 'velvet',
        },
      }),
    )

    expect(html).toContain('data-workspace-skin="sparkle_suite_morganite"')
    expect(html).not.toContain('data-nic-nac-skin="velvet"')
  })

  it('keeps workspace skin tokens scoped away from Nic-Nac brand tokens', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'app/nic-nac/components/DashboardPlaceholder.tsx'),
      'utf8',
    )
    const styles = readFileSync(
      resolve(
        process.cwd(),
        'app/nic-nac/components/DashboardPlaceholder.module.css',
      ),
      'utf8',
    )

    expect(source).toContain('data-workspace-skin={workspaceSkinPreset}')
    expect(styles).toContain(".main[data-workspace-skin='velvet']")
    expect(styles).toContain('--workspace-accent')
    expect(styles).not.toContain('--nic-nac-accent: #9333EA')
    expect(styles).not.toContain(".main[data-workspace-skin='velvet'] .nic")
  })

  it('refreshes an open live-site preview after saving site settings', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'app/nic-nac/components/DashboardPlaceholder.tsx'),
      'utf8',
    )

    expect(source).toContain('refreshLiveSitePreviewAfterSiteSettingsSave')
    expect(source).toContain("workspacePreview.mode === 'live_site_preview'")
    expect(source).toContain('setPreviewFrameKey((current) => current + 1)')
  })

  it('keeps Black Diamond workspace surfaces readable with dark-theme overrides', () => {
    const css = readFileSync(
      resolve(
        process.cwd(),
        'app/nic-nac/components/DashboardPlaceholder.module.css',
      ),
      'utf8',
    )

    const siteSettingsBaseIndex = css.indexOf('.siteSettingsTextarea:focus')
    const blackDiamondSiteSettingsIndex = css.lastIndexOf(
      ".main[data-workspace-skin='black_diamond'] .siteSettingsCard",
    )

    expect(blackDiamondSiteSettingsIndex).toBeGreaterThan(
      siteSettingsBaseIndex,
    )
    expect(css).toContain(
      ".main[data-workspace-skin='black_diamond'] .topbar",
    )
    expect(css).toContain(
      ".main[data-workspace-skin='black_diamond'] .workspaceSidebar",
    )
    expect(css).toContain(
      ".main[data-workspace-skin='black_diamond'] .timelineItem",
    )
    expect(css).toContain(
      ".main[data-workspace-skin='black_diamond'] .rosterTag",
    )
    expect(css).toContain(
      ".main[data-workspace-skin='black_diamond'] .workspaceNavStatusTag",
    )
    expect(css).toContain(
      ".main[data-workspace-skin='black_diamond'] .emptyState",
    )
    expect(css).toContain(
      ".main[data-workspace-skin='black_diamond'] .searchInput",
    )
    expect(css).toContain(
      ".main[data-workspace-skin='black_diamond'] .sortSelect",
    )
    expect(css).toContain(
      ".main[data-workspace-skin='black_diamond'] .siteSettingsTextarea",
    )
    expect(css).toContain(
      ".main[data-workspace-skin='black_diamond'] .siteSettingsPreviewNote",
    )
    expect(css).toContain(
      ".main[data-workspace-skin='black_diamond'] .customerSiteLooks",
    )
    expect(css).toContain(
      ".main[data-workspace-skin='black_diamond'] .accountBillingCard",
    )
    expect(css).toContain(
      ".main[data-workspace-skin='black_diamond'] .referralCard",
    )
    expect(css).toContain(
      ".main[data-workspace-skin='black_diamond'] .accountDetailRow",
    )
    expect(css).toContain(
      ".main[data-workspace-skin='black_diamond'] .referralCodePanel",
    )
    expect(css).toContain(
      ".main[data-workspace-skin='black_diamond'] .playbookGroup",
    )
    expect(css).toContain(
      ".main[data-workspace-skin='black_diamond'] .supportPath",
    )
    expect(css).toContain(
      ".main[data-workspace-skin='black_diamond'] .supportReportChoice",
    )
    expect(css).toContain(
      ".main[data-workspace-skin='black_diamond'] .supportReportTextarea",
    )
    expect(css).toContain('#15110f')
    expect(css).toContain('#211c18')
    expect(css).toContain('color: #f8efe4')
    expect(css).toContain('color: #d8cbbd')
  })

  it('keeps the workspace Nic-Nac glyph backed by the shared mark', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'app/nic-nac/components/NicNacGlyph.tsx'),
      'utf8',
    )

    expect(source).toContain("from '@/app/_components/nic-nac-mark'")
    expect(source).toContain('NicNacMark')
  })

  it('wires idle refresh hooks for the trade workspace', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'app/nic-nac/components/DashboardPlaceholder.tsx'),
      'utf8',
    )

    expect(source).toContain('TRADE_WORKSPACE_REFRESH_MS')
    expect(source).toContain("activeSection !== 'trade-board'")
    expect(source).toContain("document.addEventListener('visibilitychange'")
    expect(source).toContain("window.addEventListener('focus'")
    expect(source).toContain('window.setInterval(')
    expect(source).toContain('refreshIfTradeBoardActive')
  })

  it('wires Nic-Nac mutation refresh events into the trade workspace', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'app/nic-nac/components/DashboardPlaceholder.tsx'),
      'utf8',
    )

    expect(source).toContain('NIC_NAC_WORKSPACE_REFRESH_EVENT')
    expect(source).toContain('refreshAfterNicNacMutation')
    expect(source).toContain("topic === 'trade'")
    expect(source).toContain("topic === 'site'")
    expect(source).toContain('void refreshTradeWorkspace()')
    expect(source).toContain('setPreviewFrameKey')
    expect(source).toContain('window.addEventListener(\n      NIC_NAC_WORKSPACE_REFRESH_EVENT')
    expect(source).not.toContain("if (activeSection !== 'trade-board') return\n\n    const refreshAfterNicNacMutation")
  })

  it('keeps live site and customer board previews inside the Nic-Nac workspace shell', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'app/nic-nac/components/DashboardPlaceholder.tsx'),
      'utf8',
    )

    expect(source).toContain('type WorkspacePreviewState')
    expect(source).toContain('handleOpenLiveSitePreview')
    expect(source).toContain('handleOpenTradeBoardPreview')
    expect(source).toContain('workspacePreview.mode === \'live_site_preview\'')
    expect(source).toContain('Live Site Preview')
    expect(source).toContain('Back to workspace')
    expect(source).toContain('Refresh preview')
    expect(source).toContain('<iframe')
    expect(source).toContain('title="Sparkle Suite live site preview"')
    expect(source).not.toContain('href={customerSparkleSiteHref}\n              target="_blank"')
  })

  it('keeps live site focus preview available on narrow workspaces', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'app/nic-nac/components/DashboardPlaceholder.tsx'),
      'utf8',
    )
    const css = readFileSync(
      resolve(process.cwd(), 'app/nic-nac/components/DashboardPlaceholder.module.css'),
      'utf8',
    )

    expect(source).toContain('styles.previewFocusFrame')
    expect(source).toContain('Open full site')
    expect(source).not.toContain('LIVE_SITE_PREVIEW_MIN_WIDTH_QUERY')
    expect(source).not.toContain('canUseEmbeddedLiveSitePreview')
    expect(source).not.toContain('Use a wider screen to preview and edit the live site with Nic-Nac side by side.')
    expect(css).not.toMatch(/\.previewFrame\s*{[^}]*display:\s*none/s)
    expect(css).toContain('min-height: 68vh')
  })

  it('renders board inventory piece cards after active search with a customer preview link', () => {
    const html = renderToStaticMarkup(
      createElement(TradeBoardWorkspaceCard, {
        tradeBoardState: TRADE_BOARD_READY_STATE,
        tradeRequestsState: { status: 'ready', requests: [] },
        fulfillmentQueueState: { status: 'ready', items: [] },
        tradeHistoryState: {
          status: 'ready',
          history: {
            items: [],
            summary: {
              totalCompleted: 0,
              totalMsrpTraded: 0,
              avgFulfillmentDays: null,
              repeatCustomers: [],
            },
          },
        },
        tradeBoardSearchQuery: 'RG',
        onTradeBoardSearchQueryChange: () => {},
        quickAddItemNumber: '',
        onQuickAddItemNumberChange: () => {},
        actionState: { pendingKey: null, error: null, helperMessage: null },
        onQuickAddListing: () => {},
        onRemoveListing: () => {},
        onApproveRequest: () => {},
        onRejectRequest: () => {},
        onAdvanceFulfillment: () => {},
        customerBoardHref: '/amethyst/Trade.html?c=rep-1',
      }),
    )

    expect(html).toContain('View customer board')
    expect(html).toContain('href="/amethyst/Trade.html?c=rep-1"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('src="https://cdn.example.com/sapphire-halo.jpg"')
    expect(html).toContain('Open image preview for Sapphire Halo')
    expect(html).toContain('type="button"')
    expect(html).toContain('aria-label="Filtered active board pieces"')
    expect(html).toContain('alt="Sapphire Halo"')
    expect(html).toContain('Sapphire Halo')
    expect(html).toContain('RG100')
    expect(html).toContain('Showing 1-1 of 1')
    expect(html).toContain('Remove')
    expect(html).toContain('Reset')
    expect(html).not.toContain('Rose Quartz Stack')
  })

  it('keeps board inventory quiet by default while still showing browse filters', () => {
    const html = renderToStaticMarkup(
      createElement(TradeBoardWorkspaceCard, {
        tradeBoardState: TRADE_BOARD_READY_STATE,
        tradeRequestsState: { status: 'ready', requests: [] },
        fulfillmentQueueState: { status: 'ready', items: [] },
        tradeHistoryState: {
          status: 'ready',
          history: {
            items: [],
            summary: {
              totalCompleted: 0,
              totalMsrpTraded: 0,
              avgFulfillmentDays: null,
              repeatCustomers: [],
            },
          },
        },
        tradeBoardSearchQuery: '',
        onTradeBoardSearchQueryChange: () => {},
        quickAddItemNumber: '',
        onQuickAddItemNumberChange: () => {},
        actionState: { pendingKey: null, error: null, helperMessage: null },
        onQuickAddListing: () => {},
        onRemoveListing: () => {},
        onApproveRequest: () => {},
        onRejectRequest: () => {},
        onAdvanceFulfillment: () => {},
        hasMoreListings: true,
        isInventoryBrowseLoading: true,
      }),
    )

    expect(html).toContain('Jewelry Type')
    expect(html).toContain('Collection')
    expect(html).toContain('Use search or filters to browse pieces currently on your board.')
    expect(html).not.toContain('Load more')
    expect(html).not.toContain('Loading board pieces...')
  })

  it('renders swap cleanup items in the Trade Board workspace', () => {
    const html = renderToStaticMarkup(
      createElement(TradeBoardWorkspaceCard, {
        tradeBoardState: TRADE_BOARD_READY_STATE,
        tradeRequestsState: { status: 'ready', requests: [] },
        fulfillmentQueueState: { status: 'ready', items: [] },
        tradeHistoryState: {
          status: 'ready',
          history: {
            items: [],
            summary: {
              totalCompleted: 0,
              totalMsrpTraded: 0,
              avgFulfillmentDays: null,
              repeatCustomers: [],
            },
          },
        },
        tradeSwapCleanupState: {
          status: 'ready',
          items: [
            {
              swapId: 'swap-1',
              requestId: 'request-1',
              customerName: 'Jamie',
              outgoingListingId: 'listing-1',
              revealedItemNumber: 'ER00001',
              revealedRingSize: null,
              replacementStatus: 'needs_catalog_details',
              createdAt: '2026-06-11T20:00:00.000Z',
            },
          ],
        },
        tradeBoardSearchQuery: '',
        onTradeBoardSearchQueryChange: () => {},
        quickAddItemNumber: '',
        onQuickAddItemNumberChange: () => {},
        actionState: { pendingKey: null, error: null, helperMessage: null },
        onQuickAddListing: () => {},
        onRemoveListing: () => {},
        onApproveRequest: () => {},
        onRejectRequest: () => {},
        onAdvanceFulfillment: () => {},
      }),
    )

    expect(html).toContain('Swap cleanup')
    expect(html).toContain('1 to finish')
    expect(html).toContain('Revealed item number: ER00001')
    expect(html).toContain(
      'Finish catalog details after the show to put this reveal back on the board.',
    )
  })

  it('wires dashboard trade approval through revealed item capture', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'app/nic-nac/components/DashboardPlaceholder.tsx'),
      'utf8',
    )

    expect(source).toContain('/api/nic-nac/trade-swap-cleanup')
    expect(source).toContain('Swap cleanup')
    expect(source).toContain('No trade swaps need cleanup right now.')
    expect(source).toContain(
      'Which item number was just revealed for the customer?',
    )
    expect(source).toContain('revealedItemNumber')
    expect(source).toContain('revealedRingSize')
    expect(source).toContain(
      'Trade approved. Added the revealed piece back to your board.',
    )
    expect(source).toContain(
      'I saved the item number to this swap; finish the catalog details after the show.',
    )
  })

  it('does not render the retired trade-history Top design metric', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'app/nic-nac/components/DashboardPlaceholder.tsx'),
      'utf8',
    )

    expect(source).not.toContain('Top design')
    expect(source).not.toContain('topDesign')
  })

  it('builds active trade board fetch URLs with limit and offset', () => {
    expect(buildTradeBoardFetchUrl()).toBe(
      '/api/nic-nac/trade-board?status=available&limit=12',
    )
    expect(buildTradeBoardFetchUrl({ offset: 24 })).toBe(
      '/api/nic-nac/trade-board?status=available&limit=12&offset=24',
    )
  })

  it('keeps removed listings out of the active trade board cards', () => {
    const html = renderToStaticMarkup(
      createElement(TradeBoardWorkspaceCard, {
        tradeBoardState: {
          status: 'ready',
          board: {
            ...TRADE_BOARD_READY_STATE.board,
            listings: [
              ...TRADE_BOARD_READY_STATE.board.listings,
              {
                ...TRADE_BOARD_READY_STATE.board.listings[0],
                id: 'listing-removed',
                status: 'removed' as const,
                design: {
                  ...TRADE_BOARD_READY_STATE.board.listings[0].design,
                  item_number: 'RG999',
                  design_name: 'Removed Clutter Piece',
                },
              },
            ],
          },
        },
        tradeRequestsState: { status: 'ready', requests: [] },
        fulfillmentQueueState: { status: 'ready', items: [] },
        tradeHistoryState: {
          status: 'ready',
          history: {
            items: [],
            summary: {
              totalCompleted: 0,
              totalMsrpTraded: 0,
              avgFulfillmentDays: null,
              repeatCustomers: [],
            },
          },
        },
        tradeBoardSearchQuery: 'RG',
        onTradeBoardSearchQueryChange: () => {},
        quickAddItemNumber: '',
        onQuickAddItemNumberChange: () => {},
        actionState: { pendingKey: null, error: null, helperMessage: null },
        onQuickAddListing: () => {},
        onRemoveListing: () => {},
        onApproveRequest: () => {},
        onRejectRequest: () => {},
        onAdvanceFulfillment: () => {},
      }),
    )

    expect(html).not.toContain('Removed Clutter Piece')
    expect(html).not.toContain('RG999')
  })

  it('builds the rep customer-facing Sparkle Suite homepage link', () => {
    expect(buildCustomerSparkleSiteHref()).toBe('/amethyst/Homepage.html')
    expect(buildCustomerSparkleSiteHref('rep-1')).toBe(
      '/amethyst/Homepage.html?c=rep-1',
    )
  })

  it('allows required setup review mode to preview the claimed public show link', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'app/nic-nac/components/DashboardPlaceholder.tsx'),
      'utf8',
    )

    expect(source).toContain('publicSiteSlugOverride?: string | null')
    expect(source).toContain('publicSiteSlug: publicSiteSlugOverride ?? null')
    expect(source).toContain(
      'publicSiteSlug: publicSiteSlugOverride ?? repProfileState.publicSiteSlug',
    )
  })

  it('filters the roster down to opted-out customers', () => {
    expect(filterRosterCustomers(READY_STATE.customers, 'opted_out')).toEqual([
      READY_STATE.customers[1],
    ])
  })

  it('searches the roster across name, phone, and email', () => {
    expect(searchRosterCustomers(READY_STATE.customers, 'jamie')).toEqual([
      READY_STATE.customers[0],
    ])
    expect(searchRosterCustomers(READY_STATE.customers, '55550102')).toEqual([
      READY_STATE.customers[1],
    ])
    expect(searchRosterCustomers(READY_STATE.customers, 'taylor@example')).toEqual([
      READY_STATE.customers[2],
    ])
  })

  it('sorts the roster by newest, oldest, and name', () => {
    expect(
      sortRosterCustomers(READY_STATE.customers, 'newest').map((customer) => customer.id),
    ).toEqual(['aud-1', 'aud-2', 'aud-3'])
    expect(
      sortRosterCustomers(READY_STATE.customers, 'oldest').map((customer) => customer.id),
    ).toEqual(['aud-3', 'aud-2', 'aud-1'])
    expect(
      sortRosterCustomers(READY_STATE.customers, 'name_asc').map((customer) => customer.id),
    ).toEqual(['aud-1', 'aud-2', 'aud-3'])
  })

  it('renders a useful customer roster with statuses and contact details', () => {
    const html = renderToStaticMarkup(
      createElement(CustomerRosterCard, {
        state: READY_STATE,
        activeFilter: 'all',
        onFilterChange: () => {},
        searchQuery: '',
        sortOrder: 'newest',
        activeComposerAudienceId: 'aud-1',
        composerSubject: 'Your order is ready',
        composerBody: 'Pickup is available now.',
      }),
    )

    expect(html).toContain('Filter roster')
    expect(html).toContain('Search customers')
    expect(html).toContain('Sort roster')
    expect(html).toContain('Newest first')
    expect(html).toContain('Copy visible SMS')
    expect(html).toContain('Copy visible emails')
    expect(html).toContain('Jamie Lane')
    expect(html).toContain('+15555550101')
    expect(html).toContain('jamie@example.com')
    expect(html).toContain('SMS opted in')
    expect(html).toContain('Email reachable')
    expect(html).toContain('STOP received')
    expect(html).toContain('Joined 2026-05-05')
    expect(html).toContain('Unsubscribe SMS')
    expect(html).toContain('Unsubscribe email')
    expect(html).toContain('Email customer')
    expect(html).toContain('Open signup form')
    expect(html).toContain('Copy signup link')
    expect(html).toContain('Fresh consent must come from the customer.')
    expect(html).toContain('SMS status')
    expect(html).toContain('Email status')
    expect(html).toContain('SMS opted in')
    expect(html).toContain('Opted out')
    expect(html).toContain('Consent captured 2026-05-04')
    expect(html).toContain('STOP received 2026-05-05')
    expect(html).toContain('Email subject')
    expect(html).toContain('Email message')
    expect(html).toContain('Send email')
    expect(html).toContain('Cancel')
  })

  it('shows an empty message when a filter has no matching customers', () => {
    const html = renderToStaticMarkup(
      createElement(CustomerRosterCard, {
        state: READY_STATE,
        activeFilter: 'email_reachable',
        onFilterChange: () => {},
        customersOverride: [],
        searchQuery: 'nobody',
        sortOrder: 'newest',
      }),
    )

    expect(html).toContain('No customers match this filter yet.')
  })

  it('only offers unsubscribe actions for channels that are still active', () => {
    expect(getCustomerActions(READY_STATE.customers[0])).toEqual([
      { channel: 'sms', label: 'Unsubscribe SMS' },
      { channel: 'email', label: 'Unsubscribe email' },
    ])
    expect(getCustomerActions(READY_STATE.customers[1])).toEqual([])
    expect(getCustomerActions(READY_STATE.customers[2])).toEqual([
      { channel: 'email', label: 'Unsubscribe email' },
    ])
  })

  it('only offers email outreach actions for customers who can still receive email', () => {
    expect(getCustomerOutreachActions(READY_STATE.customers[0])).toEqual([
      { kind: 'email', label: 'Email customer' },
    ])
    expect(getCustomerOutreachActions(READY_STATE.customers[1])).toEqual([])
    expect(getCustomerOutreachActions(READY_STATE.customers[2])).toEqual([
      { kind: 'email', label: 'Email customer' },
    ])
  })

  it('flags customers who need a fresh opt-in helper', () => {
    expect(needsFreshOptIn(READY_STATE.customers[0])).toBe(false)
    expect(needsFreshOptIn(READY_STATE.customers[1])).toBe(true)
    expect(getCustomerRecoveryActions(READY_STATE.customers[1])).toEqual([
      { kind: 'open_signup', label: 'Open signup form' },
      { kind: 'copy_signup', label: 'Copy signup link' },
    ])
  })

  it('derives clear per-channel statuses and timeline entries', () => {
    expect(getCustomerChannelStatuses(READY_STATE.customers[0])).toEqual({
      sms: 'SMS opted in',
      email: 'Reachable',
    })
    expect(getCustomerChannelStatuses(READY_STATE.customers[1])).toEqual({
      sms: 'Opted out',
      email: 'No consent',
    })
    expect(getCustomerChannelStatuses(READY_STATE.customers[2])).toEqual({
      sms: 'No consent',
      email: 'Reachable',
    })

    expect(getCustomerTimeline(READY_STATE.customers[1])).toEqual([
      'Consent captured 2026-05-04',
      'STOP received 2026-05-05',
      'Joined 2026-05-04',
    ])
  })

  it('derives export-ready visible contacts by channel', () => {
    expect(getVisibleContactValues(READY_STATE.customers, 'sms')).toEqual([
      '+15555550101',
    ])
    expect(getVisibleContactValues(READY_STATE.customers, 'email')).toEqual([
      'jamie@example.com',
      'taylor@example.com',
    ])
  })

  it('flags likely duplicate audience rows by shared phone or email', () => {
    expect(
      getCustomerDuplicateSummary(DUPLICATE_CUSTOMERS[0], DUPLICATE_CUSTOMERS),
    ).toBe('Possible duplicate: shares phone or email with 1 other record.')

    const html = renderToStaticMarkup(
      createElement(CustomerRosterCard, {
        state: {
          ...READY_STATE,
          customers: DUPLICATE_CUSTOMERS,
        },
        activeFilter: 'all',
        onFilterChange: () => {},
        searchQuery: '',
        sortOrder: 'newest',
      }),
    )

    expect(html).toContain('Possible duplicate')
    expect(html).toContain('shares phone or email with 1 other record')
  })

  it('renders a wallet summary card with balance, recharge status, and recent transactions', () => {
    const html = renderToStaticMarkup(
      createElement(WalletSummaryCard, {
        state: WALLET_READY_STATE,
        statusMessage: null,
        autoRechargeDraft: getAutoRechargeDraft(WALLET_READY_STATE.summary),
      }),
    )

    expect(html).toContain('Current balance')
    expect(html).toContain('SMS Wallet')
    expect(html).toContain('Monitor text balance, reloads, and auto-recharge')
    expect(html).toContain('$24.99')
    expect(html).toContain('Texts left')
    expect(html).toContain('2776')
    expect(html).toContain('Tracked texts this month')
    expect(html).toContain('7')
    expect(html).toContain('SMS spend')
    expect(html).toContain('$0.06')
    expect(html).toContain('Auto-recharge on')
    expect(html).toContain('Threshold $5.00')
    expect(html).toContain('Reload $25.00')
    expect(html).toContain('Load $25')
    expect(html).toContain('Load $50')
    expect(html).toContain('Load $100')
    expect(html).toContain('Wallet load')
    expect(html).toContain('Auto-recharge settings')
    expect(html).toContain('Enable auto-recharge')
    expect(html).toContain('Threshold trigger')
    expect(html).toContain('Reload amount')
    expect(html).toContain('Save settings')
    expect(html).toContain('Billing reference')
    expect(html).toContain('Approved SMS sends cost $0.009')
    expect(html).toContain('Minimum wallet load is $25.00')
    expect(html).toContain('Reload history')
  })

  it('renders the site settings card with profile, copy, and social controls', () => {
    const html = renderToStaticMarkup(
      createElement(SiteSettingsCard, {
        state: SITE_SETTINGS_READY_STATE,
        draft: SITE_SETTINGS_READY_STATE.settings,
        statusMessage: 'All changes saved.',
      }),
    )

    expect(html).toContain('Profile basics')
    expect(html).toContain('Display name')
    expect(html).toContain('Show name')
    expect(html).not.toContain('Business name')
    expect(html).not.toContain('Phone</span>')
    expect(html).toContain('Ticker and join page')
    expect(html).not.toContain('Banner and ticker')
    expect(html).not.toContain('Banner text')
    expect(html).not.toContain('Banner visible')
    expect(html).toContain('Ticker text')
    expect(html).not.toContain('Hero image URL')
    expect(html).toContain('Hero motion')
    expect(html).toContain('Sparkle rise')
    expect(html).toContain('Soft glow')
    expect(html).toContain('Still')
    expect(html).toContain('Customer-facing site theme')
    expect(html).not.toContain('Customer Site Looks')
    expect(html).not.toContain('Morganite is locked in for every Sparkle Suite workspace and Amethyst customer site.')
    expect(html).not.toContain('Reference polished customer-site looks')
    expect(html).not.toContain('Recommended first picks')
    expect(html).not.toContain('Full skin gallery')
    expect(html).not.toContain('Site template')
    expect(html).toContain('Amethyst')
    expect(html).toContain('Sparkle Suite/Morganite')
    expect(html).toContain('Black Diamond')
    expect(html).toContain('Rose Gold')
    expect(html).toContain('Garnet')
    expect(html).toContain('Amber')
    expect(html).toContain('Velvet')
    expect(html).toContain('Rose Quartz')
    expect(html).not.toContain('Editorial')
    expect(html).not.toContain('Soft Glam')
    expect(html).not.toContain('Sparkle Party')
    expect(html).not.toContain('Maximum')
    expect(html).toContain(
      'Applies only to your public customer-facing site.',
    )
    expect(html).toContain('Join page visible')
    expect(html).toContain('Instagram')
    expect(html).toContain('Facebook')
    expect(html).not.toContain('Save site settings')
    expect(html).toContain('All changes saved.')
    expect(html).toContain('All changes saved.')
  })

  it('shows an auto-save cue without a manual save control for changed site settings drafts', () => {
    const html = renderToStaticMarkup(
      createElement(SiteSettingsCard, {
        state: SITE_SETTINGS_READY_STATE,
        draft: {
          ...SITE_SETTINGS_READY_STATE.settings,
          tagline: 'Fresh draft tagline',
        },
        actionState: { pending: false, error: null, helperMessage: null },
      }),
    )

    expect(html).toContain('Changes will auto-save.')
    expect(html).not.toContain('Save site settings')
    expect(html).not.toContain('No unsaved changes')
    expect(html).not.toContain('disabled=""')
  })

  it('keeps the site settings auto-save indicator inline instead of a sticky bottom save bar', () => {
    const styles = readFileSync(
      resolve(
        process.cwd(),
        'app/nic-nac/components/DashboardPlaceholder.module.css',
      ),
      'utf8',
    )

    expect(styles).toContain('.siteSettingsAutoSaveStatus')
    expect(styles).not.toContain('.siteSettingsSaveBar')
    expect(styles).not.toContain('.siteSettingsSaveButton')
    expect(styles).not.toContain('calc(96px + env(safe-area-inset-bottom))')
  })

  it('renders the account billing card with monthly status, payment method, and invoice history', () => {
    const html = renderToStaticMarkup(
      createElement(AccountBillingCard, {
        state: ACCOUNT_BILLING_READY_STATE,
        statusMessage: 'Opened Stripe billing portal.',
      }),
    )

    expect(html).toContain('Build fee + monthly plan')
    expect(html).toContain('Account')
    expect(html).toContain('cancel anytime')
    expect(html).toContain('Active')
    expect(html).toContain('Scheduled to end')
    expect(html).toContain('visa ending in 4242')
    expect(html).toContain('Expires 12/2028')
    expect(html).toContain('Billing history')
    expect(html).toContain('$99.00')
    expect(html).toContain('Manage billing and cancel')
    expect(html).toContain('Opened Stripe billing portal.')
  })

  it('renders the referral program card with code, link, and status counts', () => {
    const html = renderToStaticMarkup(
      createElement(ReferralProgramCard, {
        referral: ACCOUNT_BILLING_READY_STATE.summary.referral,
      }),
    )

    expect(html).toContain('Referral program')
    expect(html).toContain('SS-K7M4Q9')
    expect(html).toContain('https://sparkle-suite.example/start?ref=SS-K7M4Q9')
    expect(html).toContain('2 pending')
    expect(html).toContain('1 earned')
    expect(html).toContain('3 credited')
    expect(html).toContain('Copy code')
    expect(html).toContain('Copy link')
  })

  it('renders terms acceptance before subscription checkout can start', () => {
    const html = renderToStaticMarkup(
      createElement(AccountBillingCard, {
        state: {
          status: 'ready',
          summary: {
            ...ACCOUNT_BILLING_READY_STATE.summary,
            subscription: null,
            paymentMethod: null,
            invoices: [],
            canStartSubscription: true,
            canManageBilling: true,
          },
        },
        agreementAccepted: false,
      }),
    )

    expect(html).toContain('Build fee + monthly plan')
    expect(html).toContain('Before checkout')
    expect(html).toContain('Review your Sparkle Suite plan')
    expect(html).toContain('$49.99 build fee + $74.99/month first month')
    expect(html).toContain('Stripe itemizes the build fee and monthly subscription')
    expect(html).toContain('$74.99/month after the first checkout until cancelled.')
    expect(html).toContain('Cancel anytime from billing.')
    expect(html).toContain('After checkout unlocks')
    expect(html).toContain('Customer-facing site')
    expect(html).toContain('Trade board / dance floor')
    expect(html).toContain('Checkout alone does not send customer texts')
    expect(html).toContain('Read the Sparkle Suite terms before checkout.')
    expect(html).toContain('Read Terms and Conditions')
    expect(html).toContain(
      'I understand today&#x27;s charge, the monthly renewal, and the cancel policy',
    )
    expect(html).toContain('_termsLink_')
    expect(html).toContain(
      'href="/terms-and-conditions?returnTo=%2Fnic-nac%3Fsection%3Daccount"',
    )
    expect(html).not.toContain('target="_blank"')
    expect(html).toContain('Continue to secure Stripe checkout')
    expect(html).not.toContain('Manage billing and cancel')
    expect(html).toContain('disabled=""')
  })

  it('hides empty billing admin states during unpaid checkout review', () => {
    const html = renderToStaticMarkup(
      createElement(AccountBillingCard, {
        state: {
          status: 'ready',
          summary: {
            ...ACCOUNT_BILLING_READY_STATE.summary,
            subscription: null,
            paymentMethod: null,
            invoices: [],
            canStartSubscription: true,
            canManageBilling: true,
          },
        },
        agreementAccepted: false,
      }),
    )

    expect(html).toContain('Review your Sparkle Suite plan')
    expect(html).not.toContain('Subscription</span>')
    expect(html).not.toContain('Payment method')
    expect(html).not.toContain('Billing history')
    expect(html).not.toContain('No card on file yet.')
    expect(html).not.toContain('Billing history will appear after your first Stripe invoice.')
  })

  it('does not render first-run checklist rows from the unlocked dashboard', () => {
    const html = renderToStaticMarkup(createElement(DashboardPlaceholder))

    expect(html).not.toContain('Locked until checkout')
    expect(html).not.toContain('Ready after checkout')
    expect(html).not.toContain('Continue in Site Settings')
    expect(html).not.toContain('After checkout')
    expect(html).not.toContain('Ask Nic-Nac')
  })

  it('keeps customer site looks in Site Settings instead of Help & Resources', () => {
    const previousWindow = globalThis.window
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { location: { search: '?section=help-resources' } },
    })

    try {
      const html = renderToStaticMarkup(createElement(DashboardPlaceholder))

      expect(html).toContain('Help &amp; Resources')
      expect(html).not.toContain('Choose your look')
      expect(html).not.toContain('Customer Site Looks')
      expect(html).not.toContain('Full skin gallery')
      expect(html).not.toContain('Classic Sparkle')
      expect(html).not.toContain('Guided first-start')
      expect(html).not.toContain('after checkout')
      expect(html).not.toContain('Ready after checkout')
    } finally {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: previousWindow,
      })
    }
  })

  it('renders local test buyer checkout pricing when the billing summary is in test mode', () => {
    const html = renderToStaticMarkup(
      createElement(AccountBillingCard, {
        state: {
          status: 'ready',
          summary: {
            ...ACCOUNT_BILLING_READY_STATE.summary,
            checkoutMode: 'test_buyer',
            subscription: null,
            paymentMethod: null,
            invoices: [],
            canStartSubscription: true,
            canManageBilling: false,
          },
        },
        agreementAccepted: false,
      }),
    )

    expect(html).toContain('50 cents in Stripe test mode. No real money moves.')
    expect(html).toContain(
      'Use this local-only path to feel the buyer flow before real checkout is turned on.',
    )
    expect(html).toContain(
      '50 cents per month in Stripe test mode until cancelled.',
    )
  })

  it('syncs Stripe billing when returning from subscription checkout', () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        'app/nic-nac/components/DashboardPlaceholder.tsx',
      ),
      'utf8',
    )

    expect(source).toContain("params.get('billing') !== 'subscription-success'")
    expect(source).toContain("params.get('session_id')?.trim()")
    expect(source).toContain("fetch('/api/stripe/sync'")
    expect(source).toContain('body: JSON.stringify({ sessionId })')
    expect(source).toContain('await loadAccountBilling()')
  })

  it('keeps customer-facing skin selection separate from workspace skin state', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'app/nic-nac/components/DashboardPlaceholder.tsx'),
      'utf8',
    )

    expect(source).toContain('Customer-facing site theme')
    expect(source).toContain('WORKSPACE_APPEARANCE_PRESET')
    expect(source).toContain('AMETHYST_SKIN_CARDS')
    expect(source).not.toContain('Full skin gallery')
    expect(source).toContain('skin.code')
    expect(source).toContain('normalizeAmethystAppearancePreset')
  })

  it('calculates show and monthly take-home estimates from manual inputs', () => {
    const result = calculateBusinessCalculator({
      averageShowSales: 1200,
      commissionRate: 25,
      showsPerMonth: 8,
      perShowExpenses: 30,
      monthlyExpenses: 150,
      monthlyProfitGoal: 2500,
    })

    expect(result.grossSalesPerMonth).toBe(9600)
    expect(result.takeHomePerShowBeforeMonthlyExpenses).toBe(270)
    expect(result.estimatedMonthlyTakeHome).toBe(2010)
    expect(result.salesNeededPerMonthForGoal).toBe(11560)
    expect(result.salesNeededPerShowForGoal).toBe(1445)
    expect(result.estimatedMarginPercent).toBe(20.94)
  })

  it('calculates a single show take-home estimate', () => {
    const result = calculateSingleShowCalculator({
      showSales: 1600,
      commissionRate: 25,
      showExpenses: 45,
    })

    expect(result.grossCommission).toBe(400)
    expect(result.estimatedShowTakeHome).toBe(355)
    expect(result.expenseImpactPercent).toBe(11.25)
    expect(result.estimatedMarginPercent).toBe(22.19)
  })

  it('renders the business calculator with inputs and strategic outputs', () => {
    const html = renderToStaticMarkup(createElement(BusinessCalculatorCard))

    expect(html).toContain('Business Calculator')
    expect(html).toContain('Monthly Planner')
    expect(html).toContain('Single Show')
    expect(html).toContain('Average show sales')
    expect(html).toContain('Shows per month')
    expect(html).toContain('Estimated monthly take-home')
    expect(html).toContain('Sales needed per show')
  })

  it('formats wallet amounts and estimated texts for display', () => {
    expect(formatWalletAmount(25000)).toBe('$25.00')
    expect(formatWalletAmount(9)).toBe('$0.009')
    expect(getEstimatedTextsRemaining(24991)).toBe(2776)
  })

  it('derives wallet load options and banner messages from wallet state', () => {
    expect(getWalletLoadOptions(WALLET_READY_STATE.summary)).toEqual([
      { amountCents: 2500, label: 'Load $25' },
      { amountCents: 5000, label: 'Load $50' },
      { amountCents: 10000, label: 'Load $100' },
    ])
    expect(getWalletBannerMessage('wallet=success')).toBe(
      'Wallet load completed. Your balance will refresh in a moment.',
    )
    expect(getWalletBannerMessage('wallet=cancelled')).toBe(
      'Wallet load was cancelled.',
    )
    expect(getWalletBannerMessage('foo=bar')).toBe(null)
  })

  it('derives auto-recharge form defaults and safe option lists from wallet state', () => {
    expect(getAutoRechargeDraft(WALLET_READY_STATE.summary)).toEqual({
      enabled: true,
      thresholdCents: 500,
      amountCents: 2500,
    })

    expect(getAutoRechargeThresholdOptions(WALLET_READY_STATE.summary)).toEqual([
      { amountCents: 500, label: 'Recharge below $5' },
      { amountCents: 1000, label: 'Recharge below $10' },
      { amountCents: 1500, label: 'Recharge below $15' },
      { amountCents: 2000, label: 'Recharge below $20' },
    ])

    expect(getAutoRechargeAmountOptions(WALLET_READY_STATE.summary, 500)).toEqual([
      { amountCents: 2500, label: 'Reload $25' },
      { amountCents: 5000, label: 'Reload $50' },
      { amountCents: 10000, label: 'Reload $100' },
    ])
  })

  it('renders the show calendar card with a month grid and event summaries', () => {
    const html = renderToStaticMarkup(
      createElement(ShowCalendarCard, {
        state: CALENDAR_READY_STATE,
        referenceDate: new Date('2026-05-10T12:00:00.000Z'),
      }),
    )

    expect(html).toContain('Upcoming')
    expect(html).toContain('May 2026')
    expect(html).toContain('Read-only here. Ask Nic-Nac to add or edit shows.')
    expect(html).toContain('Thursday reveal')
    expect(html).toContain('Sunday party')
    expect(html).toContain('Recently wrapped')
    expect(html).toContain('Launch party')
    expect(html).toContain('Recurring')
  })

  it('renders rep calendar event times in the event timezone instead of UTC', () => {
    const html = renderToStaticMarkup(
      createElement(ShowCalendarCard, {
        state: {
          status: 'ready',
          summary: {
            upcomingEvents: [
              {
                id: 'show-eastern',
                repId: 'rep-1',
                platform: 'TikTok Live',
                eventTime: '2026-06-07T00:00:00.000Z',
                timeZone: 'America/New_York',
                durationMinutes: 60,
                title: 'Eastern smoke show',
                description: null,
                discountCodes: [],
                featuredCollections: null,
                isRecurring: false,
                recurrenceGroupId: null,
                recurrenceRule: null,
                status: 'scheduled' as const,
                createdAt: '2026-06-01T10:00:00.000Z',
                updatedAt: '2026-06-01T10:00:00.000Z',
              },
            ],
            recentEvents: [],
          },
        },
        referenceDate: new Date('2026-06-10T12:00:00.000Z'),
      }),
    )

    expect(html).toContain('Eastern smoke show')
    expect(html).toContain('8:00 PM')
    expect(html).toMatch(/EDT|Eastern/)
  })

  it('labels live, scheduled, completed, and cancelled calendar shows distinctly', () => {
    const show = CALENDAR_READY_STATE.summary.upcomingEvents[0]
    const recentShow = CALENDAR_READY_STATE.summary.recentEvents[0]
    const html = renderToStaticMarkup(
      createElement(ShowCalendarCard, {
        state: {
          status: 'ready',
          summary: {
            upcomingEvents: [
              {
                ...show,
                id: 'show-live',
                title: 'Live tray sale',
                status: 'live' as const,
              },
              {
                ...show,
                id: 'show-scheduled',
                title: 'Scheduled sparkle drop',
                status: 'scheduled' as const,
                isRecurring: false,
              },
            ],
            recentEvents: [
              {
                ...recentShow,
                id: 'show-completed',
                title: 'Completed tray sale',
                status: 'completed' as const,
              },
              {
                ...recentShow,
                id: 'show-cancelled',
                title: 'Cancelled tray sale',
                status: 'cancelled' as const,
              },
            ],
          },
        },
        referenceDate: new Date('2026-05-10T12:00:00.000Z'),
      }),
    )

    expect(html).toContain('Live now')
    expect(html).toContain('Scheduled')
    expect(html).toContain('Completed')
    expect(html).toContain('Cancelled')
  })

  it('builds a five-week calendar grid anchored to the reference month', () => {
    const cells = buildShowCalendarCells(
      CALENDAR_READY_STATE.summary.upcomingEvents,
      new Date('2026-05-10T12:00:00.000Z'),
    )

    expect(cells).toHaveLength(35)
    expect(cells[0].isoDate).toBe('2026-04-26')
    expect(cells[34].isoDate).toBe('2026-05-30')
    expect(cells.find((cell) => cell.isoDate === '2026-05-15')?.events).toHaveLength(1)
  })

  it('derives the calendar metrics from upcoming and recent shows', () => {
    expect(
      getShowCalendarMetrics(
        CALENDAR_READY_STATE.summary.upcomingEvents,
        CALENDAR_READY_STATE.summary.recentEvents,
        new Date('2026-05-10T12:00:00.000Z'),
      ),
    ).toEqual({
      monthLabel: 'May 2026',
      upcomingCount: 2,
      thisMonthCount: 2,
      recurringCount: 1,
      recentCount: 1,
    })
  })
})
