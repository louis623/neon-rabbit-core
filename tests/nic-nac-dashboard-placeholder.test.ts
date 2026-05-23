import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  AccountBillingCard,
  BusinessCalculatorCard,
  DashboardPlaceholder,
  TradeBoardWorkspaceCard,
  CustomerRosterCard,
  SiteSettingsCard,
  ShowCalendarCard,
  WalletSummaryCard,
  buildShowCalendarCells,
  buildCustomerSparkleSiteHref,
  getAutoRechargeAmountOptions,
  getAutoRechargeDraft,
  getAutoRechargeThresholdOptions,
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
  calculateBusinessCalculator,
  calculateSingleShowCalculator,
  formatWalletAmount,
  needsFreshOptIn,
  sortRosterCustomers,
  searchRosterCustomers,
} from '@/app/nic-nac/components/DashboardPlaceholder'

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
    heroAnimationType: 'pan' as const,
    teamName: 'Moonstone Squad',
    showJoinPage: true,
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
  it('renders the Sparkle Suite Nic-Nac workspace shell', () => {
    const html = renderToStaticMarkup(createElement(DashboardPlaceholder))

    expect(html).toContain('Sparkle Suite')
    expect(html).toContain('Sparkle Suite workspace')
    expect(html).toContain('View live site')
    expect(html).toContain('href="/amethyst/Homepage.html"')
    expect(html).toContain('viewBox="0 0 64 64"')
    expect(html).toContain('Trade Board')
    expect(html).toContain('Jewelry Library')
    expect(html).toContain('Calendar')
    expect(html).toContain('Business Calculator')
    expect(html).toContain('Messages')
    expect(html).toContain('Site Settings')
    expect(html).toContain('Help &amp; Resources')
    expect(html).toContain('Account')
    expect(html).toContain('Request inbox')
    expect(html).toContain('Fulfillment queue')
    expect(html).not.toContain('I confirm I own the piece')
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

  it('renders the trade board as visual piece cards with a customer preview link', () => {
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
              topDesign: null,
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
        customerBoardHref: '/amethyst/Trade.html?c=rep-1',
      }),
    )

    expect(html).toContain('View customer board')
    expect(html).toContain('href="/amethyst/Trade.html?c=rep-1"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('src="https://cdn.example.com/sapphire-halo.jpg"')
    expect(html).toContain('alt="Sapphire Halo"')
    expect(html).toContain('Sapphire Halo')
    expect(html).toContain('RG100')
    expect(html).toContain('Rose Quartz Stack')
    expect(html).toContain('ST200')
    expect(html).toContain('ST')
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
              topDesign: null,
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
        statusMessage: 'Site settings saved.',
      }),
    )

    expect(html).toContain('Profile basics')
    expect(html).toContain('Display name')
    expect(html).toContain('Business name')
    expect(html).toContain('Banner and ticker')
    expect(html).toContain('Banner text')
    expect(html).toContain('Ticker text')
    expect(html).toContain('Hero image URL')
    expect(html).toContain('Hero animation')
    expect(html).toContain('Join page visible')
    expect(html).toContain('Instagram')
    expect(html).toContain('Facebook')
    expect(html).toContain('Save site settings')
    expect(html).toContain('Site settings saved.')
  })

  it('renders the account billing card with monthly status, payment method, and invoice history', () => {
    const html = renderToStaticMarkup(
      createElement(AccountBillingCard, {
        state: ACCOUNT_BILLING_READY_STATE,
        statusMessage: 'Opened Stripe billing portal.',
      }),
    )

    expect(html).toContain('Monthly plan')
    expect(html).toContain('Cancel anytime')
    expect(html).toContain('Active')
    expect(html).toContain('Scheduled to end')
    expect(html).toContain('visa ending in 4242')
    expect(html).toContain('Expires 12/2028')
    expect(html).toContain('Billing history')
    expect(html).toContain('$99.00')
    expect(html).toContain('Manage billing and cancel')
    expect(html).toContain('Opened Stripe billing portal.')
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
