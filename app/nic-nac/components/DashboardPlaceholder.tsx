'use client'

import { useEffect, useState } from 'react'
import type {
  AccountBillingDashboardResult,
  BoardResult,
  CalendarEvent,
  CustomerAudienceMember,
  CustomerAudienceSummary,
  FulfillmentQueueItem,
  HelpResource,
  JewelryDatabaseResult,
  RepMessagesDashboardResult,
  SiteSettingsDashboardResult,
  SiteAnalyticsDashboardResult,
  SiteAppearancePreset,
  TradeHistoryResult,
  TradeListingWithDesign,
  TradeRequestWithListing,
  WalletDashboardResult,
  WalletTransactionSummary,
} from '@/lib/services/types'
import { SMS_CHARGE_MILS, walletMilsToUsd } from '@/lib/services/wallet-units'
import { getSelfServeOnboardingChecklist } from '@/lib/services/self-serve-onboarding'
import { NIC_NAC_WORKSPACE_REFRESH_EVENT } from '@/lib/nic-nac/workspace-refresh-events'
import { SparkleSeal } from '@/app/prelaunch/_components/PrelaunchVisuals'
import { normalizeAmethystAppearancePreset } from '@/lib/amethyst/appearance-presets'
import { AMETHYST_SKIN_CARDS } from '@/lib/amethyst/skin-cards'
import { sparkleSuitePublicLandingContent } from '@/lib/sparkle-suite/public-landing-content'
import styles from './DashboardPlaceholder.module.css'

const WORKSPACE_SECTIONS = [
  { key: 'setup-checklist', label: 'Setup Checklist', subtitle: 'First-run setup path with Nic-Nac' },
  { key: 'trade-board', label: 'Trade Board', subtitle: 'Listings, requests, queue, and history' },
  { key: 'jewelry-library', label: 'Jewelry Library', subtitle: 'Search the shared catalog and add pieces' },
  { key: 'show-calendar', label: 'Calendar', subtitle: 'Upcoming shows and recent history' },
  { key: 'business-calculator', label: 'Business Calculator', subtitle: 'Estimate show and monthly take-home' },
  { key: 'team-management', label: 'Team Management', subtitle: 'Paid add-on for team onboarding and messages', locked: true },
  { key: 'messages', label: 'Messages', subtitle: 'Announcements, reports, and audience backup tools' },
  { key: 'site-settings', label: 'Site Settings', subtitle: 'Public page copy and branding' },
  { key: 'help-resources', label: 'Help & Resources', subtitle: 'Quick operating guides for reps' },
  { key: 'account', label: 'Account', subtitle: 'Billing, wallet, and site analytics' },
] as const

const TRADE_WORKSPACE_REFRESH_MS = 45_000
const TRADE_BOARD_PAGE_SIZE = 12

export function buildTradeBoardFetchUrl(options: { offset?: number } = {}) {
  const params = new URLSearchParams({
    status: 'available',
    limit: String(TRADE_BOARD_PAGE_SIZE),
  })
  if (options.offset && options.offset > 0) {
    params.set('offset', String(options.offset))
  }
  return `/api/nic-nac/trade-board?${params.toString()}`
}

export function formatHeaderRepShow(
  displayName?: string | null,
  businessName?: string | null,
) {
  const rep = displayName?.trim()
  const show = businessName?.trim()
  if (rep && show) return `${rep} / ${show}`
  return rep || show || 'Rep info loading'
}

export function formatExtensionRepId(repId?: string | null) {
  const rawId = repId?.trim()
  if (!rawId) return 'Waiting for code'
  if (/^\d{6}$/.test(rawId)) return rawId

  let hash = 2166136261
  for (const char of rawId) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619) >>> 0
  }

  return String(hash % 1_000_000).padStart(6, '0')
}

function mergeTradeBoardResults(
  current: BoardResult | undefined,
  next: BoardResult,
): BoardResult {
  if (!current) return next

  const typeBreakdown = { ...current.summary.typeBreakdown }
  for (const [type, count] of Object.entries(next.summary.typeBreakdown)) {
    typeBreakdown[type as keyof typeof typeBreakdown] =
      (typeBreakdown[type as keyof typeof typeBreakdown] ?? 0) + count
  }

  return {
    listings: [...current.listings, ...next.listings],
    summary: {
      totalPieces: current.summary.totalPieces + next.summary.totalPieces,
      totalMsrp: current.summary.totalMsrp + next.summary.totalMsrp,
      pendingRequestCount:
        current.summary.pendingRequestCount + next.summary.pendingRequestCount,
      typeBreakdown,
    },
  }
}

type WorkspaceSectionKey = (typeof WORKSPACE_SECTIONS)[number]['key']

const WORKSPACE_SECTION_KEYS = new Set<string>(
  WORKSPACE_SECTIONS.map((section) => section.key),
)

const UNPAID_WORKSPACE_SECTION_KEYS = new Set<WorkspaceSectionKey>([
  'setup-checklist',
  'help-resources',
  'account',
])

export function getInitialWorkspaceSection(search: string): WorkspaceSectionKey {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const requested = params.get('section')?.trim() ?? ''
  if (WORKSPACE_SECTION_KEYS.has(requested)) {
    return requested as WorkspaceSectionKey
  }
  if (params.get('onboarding') === 'self-serve-started') {
    return 'account'
  }
  return 'setup-checklist'
}

export function hasPaidWorkspaceSubscription(
  summary: AccountBillingDashboardResult | null | undefined,
) {
  const status = summary?.subscription?.status
  return status === 'active' || status === 'trialing' || status === 'past_due'
}

export function getVisibleWorkspaceSections(hasPaidWorkspace: boolean) {
  if (hasPaidWorkspace) return WORKSPACE_SECTIONS
  return WORKSPACE_SECTIONS.filter((section) =>
    UNPAID_WORKSPACE_SECTION_KEYS.has(section.key),
  )
}

export function resolveWorkspaceSectionForAccess(
  section: WorkspaceSectionKey,
  hasPaidWorkspace: boolean,
): WorkspaceSectionKey {
  if (hasPaidWorkspace || UNPAID_WORKSPACE_SECTION_KEYS.has(section)) {
    return section
  }
  return 'account'
}

export type RosterFilter =
  | 'all'
  | 'sms_reachable'
  | 'email_reachable'
  | 'opted_out'

export type RosterSort = 'newest' | 'oldest' | 'name_asc'

type AudienceState = {
  status: 'loading' | 'ready' | 'error'
  summary?: CustomerAudienceSummary
  customers?: CustomerAudienceMember[]
}

type AudienceActionState = {
  pendingKey: string | null
  error: string | null
  helperMessage: string | null
}

type EmailComposerState = {
  audienceId: string | null
  subject: string
  body: string
  pending: boolean
}

type WalletState = {
  status: 'loading' | 'ready' | 'error'
  summary?: WalletDashboardResult
}

type WalletActionState = {
  pendingAmountCents: number | null
  pendingSettings: boolean
  error: string | null
  helperMessage: string | null
}

type CalendarState = {
  status: 'loading' | 'ready' | 'error'
  summary?: CalendarResponsePayload
}

type SiteSettingsState = {
  status: 'loading' | 'ready' | 'error'
  settings?: SiteSettingsDashboardResult
}

type SiteSettingsActionState = {
  pending: boolean
  error: string | null
  helperMessage: string | null
}

type AccountBillingState = {
  status: 'loading' | 'ready' | 'error'
  summary?: AccountBillingDashboardResult
}

type AccountBillingActionState = {
  pendingAction: 'subscribe' | 'manage' | null
  error: string | null
  helperMessage: string | null
}

type TradeBoardState = {
  status: 'loading' | 'ready' | 'error'
  board?: BoardResult
  hasMoreListings?: boolean
}

type RepProfileState = {
  status: 'loading' | 'ready' | 'error'
  repId?: string
  displayName?: string
}

type TradeBoardActionState = {
  pendingKey: string | null
  error: string | null
  helperMessage: string | null
}

type TradeRequestsState = {
  status: 'loading' | 'ready' | 'error'
  requests?: TradeRequestWithListing[]
}

type FulfillmentQueueState = {
  status: 'loading' | 'ready' | 'error'
  items?: FulfillmentQueueItem[]
}

type TradeHistoryState = {
  status: 'loading' | 'ready' | 'error'
  history?: TradeHistoryResult
}

type JewelryLibraryState = {
  status: 'idle' | 'loading' | 'ready' | 'error'
  results?: JewelryDatabaseResult[]
}

type MessagesState = {
  status: 'loading' | 'ready' | 'error'
  inbox?: RepMessagesDashboardResult
}

type MessagesActionState = {
  pendingKey: string | null
  error: string | null
  helperMessage: string | null
}

type ResourcesState = {
  status: 'loading' | 'ready' | 'error'
  resources?: HelpResource[]
}

type AnalyticsState = {
  status: 'loading' | 'ready' | 'error'
  analytics?: SiteAnalyticsDashboardResult
}

export type WalletAutoRechargeDraft = {
  enabled: boolean
  thresholdCents: number
  amountCents: number
}

export type SiteSettingsDraft = SiteSettingsDashboardResult

type AudienceResponsePayload = {
  summary: CustomerAudienceSummary
  customers: CustomerAudienceMember[]
}

type CalendarResponsePayload = {
  upcomingEvents: CalendarEvent[]
  recentEvents: CalendarEvent[]
}

type MeResponsePayload = {
  rep?: {
    id?: string
    display_name?: string
  }
}

type WalletResponsePayload = WalletDashboardResult
type SiteSettingsResponsePayload = SiteSettingsDashboardResult
type AccountBillingResponsePayload = AccountBillingDashboardResult
type TradeBoardResponsePayload = BoardResult
type TradeRequestsResponsePayload = TradeRequestWithListing[]
type FulfillmentQueueResponsePayload = FulfillmentQueueItem[]
type TradeHistoryResponsePayload = TradeHistoryResult
type JewelryLibraryResponsePayload = JewelryDatabaseResult[]
type MessagesResponsePayload = RepMessagesDashboardResult
type ResourcesResponsePayload = HelpResource[]
type AnalyticsResponsePayload = SiteAnalyticsDashboardResult

type CalendarDayCell = {
  isoDate: string
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  events: CalendarEvent[]
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const FILTER_OPTIONS: Array<{ value: RosterFilter; label: string }> = [
  { value: 'all', label: 'All customers' },
  { value: 'sms_reachable', label: 'SMS opted in' },
  { value: 'email_reachable', label: 'Email reachable' },
  { value: 'opted_out', label: 'Opted out' },
]

const SORT_OPTIONS: Array<{ value: RosterSort; label: string }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name_asc', label: 'Name A-Z' },
]

const SOCIAL_HANDLE_FIELDS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'youtube', label: 'YouTube' },
]

const SITE_APPEARANCE_PRESET_OPTIONS: Array<{
  value: SiteAppearancePreset
  label: string
}> = [
  { value: 'amethyst', label: 'Amethyst' },
  { value: 'sparkle_suite_morganite', label: 'Sparkle Suite/Morganite' },
  { value: 'black_diamond', label: 'Black Diamond' },
  { value: 'rose_gold', label: 'Rose Gold' },
  { value: 'garnet', label: 'Garnet' },
  { value: 'amber', label: 'Amber' },
  { value: 'velvet', label: 'Velvet' },
  { value: 'rose_quartz', label: 'Rose Quartz' },
]

const SITE_SKIN_GALLERY_FEATURED_CODES = [
  'SS-01',
  'BD-01',
  'RG-01',
  'GN-01',
  'AB-01',
  'VE-01',
  'RQ-01',
] as const

const FIRST_START_SKIN_RECOMMENDATIONS = [
  {
    id: 'sparkle_suite_morganite',
    label: 'Classic Sparkle',
    reason: 'Best default for a polished Sparkle Suite launch.',
  },
  {
    id: 'black_diamond',
    label: 'Black Diamond',
    reason: 'Stronger reveal-night contrast for bold live sellers.',
  },
  {
    id: 'rose_gold',
    label: 'Rose Gold',
    reason: 'Soft, jewelry-forward warmth for boutique styling.',
  },
  {
    id: 'garnet',
    label: 'Garnet',
    reason: 'Confident red accents for high-energy show branding.',
  },
] as const

const SETUP_ACTION_BY_ID: Record<string, { label: string; target: WorkspaceSectionKey }> = {
  'business-profile': { label: 'Continue in Site Settings', target: 'site-settings' },
  'skin-and-branding': { label: 'Open Help & Resources', target: 'help-resources' },
  'public-links': { label: 'Continue in Site Settings', target: 'site-settings' },
  'site-copy': { label: 'Continue in Site Settings', target: 'site-settings' },
  shows: { label: 'Open Calendar', target: 'show-calendar' },
  'trade-board': { label: 'Open Trade Board', target: 'trade-board' },
  calculator: { label: 'Open Calculator', target: 'business-calculator' },
  'chrome-extension-live-queue': {
    label: 'Open Help & Resources',
    target: 'help-resources',
  },
  'publish-readiness': { label: 'Review live site', target: 'site-settings' },
}

const SIGNUP_FORM_PATH = '/amethyst/Homepage.html#signup'
const MESSAGE_TYPE_LABELS: Record<string, string> = {
  monthly_report: 'Monthly report',
  newsletter: 'Newsletter',
  announcement: 'Announcement',
  support_request: 'Support request',
  support_response: 'Support reply',
}

function formatCompactDate(value: string | null) {
  return value ? value.slice(0, 10) : 'Unknown'
}

function formatCompactDateTime(value: string | null) {
  if (!value) return 'Unknown'
  return value.replace('T', ' ').slice(0, 16)
}

function formatTradeMoney(value: number | null | undefined) {
  return typeof value === 'number' ? `$${value.toFixed(2)}` : 'MSRP unavailable'
}

export type BusinessCalculatorInput = {
  averageShowSales: number
  commissionRate: number
  showsPerMonth: number
  perShowExpenses: number
  monthlyExpenses: number
  monthlyProfitGoal: number
}

export type SingleShowCalculatorInput = {
  showSales: number
  commissionRate: number
  showExpenses: number
}

export function calculateBusinessCalculator(input: BusinessCalculatorInput) {
  const showsPerMonth = Math.max(0, input.showsPerMonth)
  const commissionRate = Math.max(0, input.commissionRate) / 100
  const grossSalesPerMonth = input.averageShowSales * showsPerMonth
  const grossCommissionPerShow = input.averageShowSales * commissionRate
  const takeHomePerShowBeforeMonthlyExpenses =
    grossCommissionPerShow - input.perShowExpenses
  const estimatedMonthlyTakeHome =
    takeHomePerShowBeforeMonthlyExpenses * showsPerMonth - input.monthlyExpenses
  const salesNeededPerMonthForGoal =
    commissionRate > 0
      ? (input.monthlyProfitGoal + input.monthlyExpenses + input.perShowExpenses * showsPerMonth) /
        commissionRate
      : 0
  const salesNeededPerShowForGoal =
    showsPerMonth > 0 ? salesNeededPerMonthForGoal / showsPerMonth : 0
  const estimatedMarginPercent =
    grossSalesPerMonth > 0 ? (estimatedMonthlyTakeHome / grossSalesPerMonth) * 100 : 0

  return {
    grossSalesPerMonth: roundMoney(grossSalesPerMonth),
    takeHomePerShowBeforeMonthlyExpenses: roundMoney(
      takeHomePerShowBeforeMonthlyExpenses,
    ),
    estimatedMonthlyTakeHome: roundMoney(estimatedMonthlyTakeHome),
    salesNeededPerMonthForGoal: roundMoney(salesNeededPerMonthForGoal),
    salesNeededPerShowForGoal: roundMoney(salesNeededPerShowForGoal),
    estimatedMarginPercent: roundPercent(estimatedMarginPercent),
  }
}

export function calculateSingleShowCalculator(input: SingleShowCalculatorInput) {
  const commissionRate = Math.max(0, input.commissionRate) / 100
  const showSales = Math.max(0, input.showSales)
  const showExpenses = Math.max(0, input.showExpenses)
  const grossCommission = showSales * commissionRate
  const estimatedShowTakeHome = grossCommission - showExpenses
  const expenseImpactPercent =
    grossCommission > 0 ? (showExpenses / grossCommission) * 100 : 0
  const estimatedMarginPercent =
    showSales > 0 ? (estimatedShowTakeHome / showSales) * 100 : 0

  return {
    grossCommission: roundMoney(grossCommission),
    estimatedShowTakeHome: roundMoney(estimatedShowTakeHome),
    expenseImpactPercent: roundPercent(expenseImpactPercent),
    estimatedMarginPercent: roundPercent(estimatedMarginPercent),
  }
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

function roundPercent(value: number) {
  return Math.round(value * 100) / 100
}

export function filterRosterCustomers(
  customers: CustomerAudienceMember[],
  activeFilter: RosterFilter,
) {
  if (activeFilter === 'sms_reachable') {
    return customers.filter((customer) => customer.canReceiveSms)
  }

  if (activeFilter === 'email_reachable') {
    return customers.filter((customer) => customer.canReceiveEmail)
  }

  if (activeFilter === 'opted_out') {
    return customers.filter(
      (customer) =>
        customer.smsOptedOutAt !== null ||
        customer.stopKeywordReceivedAt !== null ||
        customer.emailOptedOutAt !== null,
    )
  }

  return customers
}

export function searchRosterCustomers(
  customers: CustomerAudienceMember[],
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return customers

  return customers.filter((customer) => {
    const searchableParts = [
      customer.name,
      customer.phone ?? '',
      customer.email ?? '',
    ]

    return searchableParts.some((part) =>
      part.toLowerCase().includes(normalizedQuery),
    )
  })
}

export function sortRosterCustomers(
  customers: CustomerAudienceMember[],
  sortOrder: RosterSort,
) {
  const next = [...customers]

  if (sortOrder === 'oldest') {
    next.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    return next
  }

  if (sortOrder === 'name_asc') {
    next.sort((a, b) => a.name.localeCompare(b.name))
    return next
  }

  next.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return next
}

export function getVisibleContactValues(
  customers: CustomerAudienceMember[],
  channel: 'sms' | 'email',
) {
  const rawValues = customers
    .filter((customer) =>
      channel === 'sms' ? customer.canReceiveSms : customer.canReceiveEmail,
    )
    .map((customer) => (channel === 'sms' ? customer.phone : customer.email))
    .filter((value): value is string => Boolean(value))

  return [...new Set(rawValues)]
}

function normalizeDuplicatePhone(value: string | null) {
  const digits = (value ?? '').replace(/\D/g, '')
  if (!digits) return null
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1)
  }
  return digits
}

function normalizeDuplicateEmail(value: string | null) {
  const normalized = value?.trim().toLowerCase() ?? ''
  return normalized || null
}

function formatRosterDate(value: string) {
  return value.slice(0, 10)
}

function formatWalletDate(value: string | null) {
  return value ? value.slice(0, 10) : 'Never'
}

export function formatWalletAmount(mils: number) {
  const usd = walletMilsToUsd(mils)
  return usd < 0.01 ? `$${usd.toFixed(3)}` : `$${usd.toFixed(2)}`
}

export function getEstimatedTextsRemaining(balanceMils: number) {
  return Math.floor(balanceMils / SMS_CHARGE_MILS)
}

export function getWalletLoadOptions(summary: WalletDashboardResult) {
  const minimumLoadCents = Math.max(
    100,
    Math.round(summary.minimumLoadAmountMils / 10),
  )
  const candidateAmounts = [minimumLoadCents, 5000, 10000]
  const uniqueAmounts = [...new Set(candidateAmounts)].sort((a, b) => a - b)

  return uniqueAmounts.map((amountCents) => ({
    amountCents,
    label: `Load $${amountCents / 100}`,
  }))
}

export function getAutoRechargeDraft(
  summary: WalletDashboardResult,
): WalletAutoRechargeDraft {
  return {
    enabled: summary.autoRechargeEnabled,
    thresholdCents: Math.round(summary.autoRechargeThresholdMils / 10),
    amountCents: Math.round(summary.autoRechargeAmountMils / 10),
  }
}

export function getAutoRechargeThresholdOptions(summary: WalletDashboardResult) {
  const currentThresholdCents = Math.round(summary.autoRechargeThresholdMils / 10)
  const candidateAmounts = [500, 1000, 1500, 2000, currentThresholdCents]
  const uniqueAmounts = [...new Set(candidateAmounts)].sort((a, b) => a - b)

  return uniqueAmounts.map((amountCents) => ({
    amountCents,
    label: `Recharge below $${amountCents / 100}`,
  }))
}

export function getSiteSettingsDraft(
  settings: SiteSettingsDashboardResult,
): SiteSettingsDraft {
  return {
    ...settings,
    socialHandles: { ...settings.socialHandles },
  }
}

export function getWorkspaceSkinPreset(
  settings?: Pick<SiteSettingsDashboardResult, 'appearancePreset'> | null,
  draft?: Pick<SiteSettingsDraft, 'appearancePreset'> | null,
): SiteAppearancePreset {
  return normalizeAmethystAppearancePreset(
    draft?.appearancePreset ?? settings?.appearancePreset,
  )
}

export function formatAccountBillingAmount(amountCents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountCents / 100)
}

export function formatAccountBillingDate(value: string | null) {
  if (!value) return 'Not set'
  return value.slice(0, 10)
}

export function getAccountBillingBannerMessage(search: string) {
  const params = new URLSearchParams(search)
  const value = params.get('billing')
  if (value === 'subscription-success') {
    return 'Subscription checkout completed. Billing status will refresh in a moment.'
  }
  if (value === 'subscription-cancelled') {
    return 'Subscription checkout was cancelled.'
  }
  if (value === 'portal-returned') {
    return 'Returned from Stripe billing portal.'
  }
  return null
}

export function buildCustomerTradeBoardHref(repId?: string | null) {
  const cleanedRepId = repId?.trim()
  if (!cleanedRepId) return '/amethyst/Trade.html'
  return `/amethyst/Trade.html?c=${encodeURIComponent(cleanedRepId)}`
}

export function buildCustomerSparkleSiteHref(repId?: string | null) {
  const cleanedRepId = repId?.trim()
  if (!cleanedRepId) return '/amethyst/Homepage.html'
  return `/amethyst/Homepage.html?c=${encodeURIComponent(cleanedRepId)}`
}

export function getTradeListingPhotoUrl(listing: TradeListingWithDesign) {
  return listing.listing_photo_url ?? listing.design.canonical_photo_url
}

export function getTradeListingPhotoSourceLabel(listing: TradeListingWithDesign) {
  if (listing.listing_photo_url) return 'custom listing photo'
  if (listing.design.canonical_photo_url && listing.uses_canonical_photo) {
    return 'catalog photo'
  }
  return 'no photo yet'
}

export function getAutoRechargeAmountOptions(
  summary: WalletDashboardResult,
  thresholdCents: number,
) {
  const minimumLoadCents = Math.max(
    2500,
    Math.round(summary.minimumLoadAmountMils / 10),
  )
  const currentAmountCents = Math.round(summary.autoRechargeAmountMils / 10)
  const candidateAmounts = [minimumLoadCents, 5000, 10000, currentAmountCents]
  const uniqueAmounts = [...new Set(candidateAmounts)]
    .filter((amountCents) => amountCents > thresholdCents)
    .sort((a, b) => a - b)

  return uniqueAmounts.map((amountCents) => ({
    amountCents,
    label: `Reload $${amountCents / 100}`,
  }))
}

export function getWalletBannerMessage(search: string) {
  const normalized = search.startsWith('?') ? search.slice(1) : search
  const params = new URLSearchParams(normalized)
  const walletStatus = params.get('wallet')

  if (walletStatus === 'success') {
    return 'Wallet load completed. Your balance will refresh in a moment.'
  }

  if (walletStatus === 'cancelled') {
    return 'Wallet load was cancelled.'
  }

  return null
}

function getUtcDateKey(input: Date | string) {
  const date = typeof input === 'string' ? new Date(input) : input
  const year = date.getUTCFullYear()
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${date.getUTCDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getUtcMonthStart(referenceDate: Date) {
  return new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1))
}

function getCalendarEventTitle(event: CalendarEvent) {
  const title = event.title?.trim()
  if (title) return title

  const description = event.description?.trim()
  if (description) return description

  return `${event.platform} live`
}

export function getShowCalendarMetrics(
  upcomingEvents: CalendarEvent[],
  recentEvents: CalendarEvent[],
  referenceDate = new Date(),
) {
  const monthStart = getUtcMonthStart(referenceDate)
  const nextMonthStart = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() + 1, 1),
  )

  const thisMonthCount = upcomingEvents.filter((event) => {
    const eventDate = new Date(event.eventTime)
    return eventDate >= monthStart && eventDate < nextMonthStart
  }).length

  return {
    monthLabel: monthStart.toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }),
    upcomingCount: upcomingEvents.length,
    thisMonthCount,
    recurringCount: upcomingEvents.filter((event) => event.isRecurring).length,
    recentCount: recentEvents.length,
  }
}

export function buildShowCalendarCells(
  upcomingEvents: CalendarEvent[],
  referenceDate = new Date(),
): CalendarDayCell[] {
  const monthStart = getUtcMonthStart(referenceDate)
  const gridStart = new Date(monthStart)
  gridStart.setUTCDate(monthStart.getUTCDate() - monthStart.getUTCDay())

  const todayKey = getUtcDateKey(referenceDate)
  const eventsByDay = new Map<string, CalendarEvent[]>()

  for (const event of upcomingEvents) {
    const key = getUtcDateKey(event.eventTime)
    const existing = eventsByDay.get(key) ?? []
    existing.push(event)
    eventsByDay.set(key, existing)
  }

  return Array.from({ length: 35 }, (_, index) => {
    const cellDate = new Date(gridStart)
    cellDate.setUTCDate(gridStart.getUTCDate() + index)

    const isoDate = getUtcDateKey(cellDate)
    return {
      isoDate,
      dayNumber: cellDate.getUTCDate(),
      isCurrentMonth: cellDate.getUTCMonth() === monthStart.getUTCMonth(),
      isToday: isoDate === todayKey,
      events: eventsByDay.get(isoDate) ?? [],
    }
  })
}

function formatCalendarEventDate(eventTime: string) {
  return new Date(eventTime).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function formatCalendarEventTime(eventTime: string) {
  return new Date(eventTime).toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  })
}

function getWalletTransactionLabel(transaction: WalletTransactionSummary) {
  if (transaction.description) return transaction.description

  const fallbackLabels: Record<WalletTransactionSummary['type'], string> = {
    load: 'Wallet load',
    auto_recharge: 'Auto-recharge',
    sms_charge: 'SMS send',
    refund: 'Refund',
    adjustment: 'Adjustment',
  }

  return fallbackLabels[transaction.type]
}

function getWalletTransactionAmountPrefix(type: WalletTransactionSummary['type']) {
  if (type === 'sms_charge') return '-'
  return '+'
}

function getWalletReloadHistory(transactions: WalletTransactionSummary[]) {
  return transactions.filter(
    (transaction) =>
      transaction.type === 'load' || transaction.type === 'auto_recharge',
  )
}

export function getCustomerDuplicateSummary(
  customer: CustomerAudienceMember,
  customers: CustomerAudienceMember[],
) {
  const phone = normalizeDuplicatePhone(customer.phone)
  const email = normalizeDuplicateEmail(customer.email)

  const duplicates = customers.filter((candidate) => {
    if (candidate.id === customer.id) return false

    const phoneMatches =
      phone !== null && normalizeDuplicatePhone(candidate.phone) === phone
    const emailMatches =
      email !== null && normalizeDuplicateEmail(candidate.email) === email

    return phoneMatches || emailMatches
  })

  if (duplicates.length === 0) {
    return null
  }

  return `Possible duplicate: shares phone or email with ${duplicates.length} other record${duplicates.length === 1 ? '' : 's'}.`
}

export function getCustomerChannelStatuses(customer: CustomerAudienceMember) {
  const sms = customer.canReceiveSms
    ? 'SMS opted in'
    : customer.stopKeywordReceivedAt || customer.smsOptedOutAt
      ? 'Opted out'
      : customer.smsConsent
        ? customer.phone
          ? 'Blocked'
          : 'No phone'
        : 'No consent'

  const email = customer.canReceiveEmail
    ? 'Reachable'
    : customer.emailOptedOutAt
      ? 'Opted out'
      : customer.emailConsent
        ? customer.email
          ? 'Blocked'
          : 'No email'
        : 'No consent'

  return { sms, email }
}

export function getCustomerTimeline(customer: CustomerAudienceMember) {
  const entries = [`Consent captured ${formatRosterDate(customer.consentDate ?? customer.createdAt)}`]

  if (customer.stopKeywordReceivedAt) {
    entries.push(`STOP received ${formatRosterDate(customer.stopKeywordReceivedAt)}`)
  } else if (customer.smsOptedOutAt) {
    entries.push(`SMS opted out ${formatRosterDate(customer.smsOptedOutAt)}`)
  }

  if (customer.emailOptedOutAt) {
    entries.push(`Email opted out ${formatRosterDate(customer.emailOptedOutAt)}`)
  }

  entries.push(`Joined ${formatRosterDate(customer.createdAt)}`)
  return entries
}

function getCustomerBadges(customer: CustomerAudienceMember) {
  const badges: Array<{ tone: 'neutral' | 'positive' | 'warning'; text: string }> =
    []

  if (customer.canReceiveSms) {
    badges.push({ tone: 'positive', text: 'SMS opted in' })
  } else if (customer.stopKeywordReceivedAt) {
    badges.push({ tone: 'warning', text: 'STOP received' })
  } else if (customer.smsOptedOutAt) {
    badges.push({ tone: 'warning', text: 'SMS opted out' })
  } else if (customer.smsConsent) {
    badges.push({ tone: 'neutral', text: 'SMS consent on file' })
  }

  if (customer.canReceiveEmail) {
    badges.push({ tone: 'positive', text: 'Email reachable' })
  } else if (customer.emailOptedOutAt) {
    badges.push({ tone: 'warning', text: 'Email opted out' })
  } else if (customer.emailConsent) {
    badges.push({ tone: 'neutral', text: 'Email consent on file' })
  }

  if (customer.marketingConsent) {
    badges.push({ tone: 'neutral', text: 'Marketing ok' })
  }

  return badges
}

export function getCustomerActions(customer: CustomerAudienceMember) {
  const actions: Array<{ channel: 'sms' | 'email'; label: string }> = []

  if (customer.canReceiveSms) {
    actions.push({ channel: 'sms', label: 'Unsubscribe SMS' })
  }

  if (customer.canReceiveEmail) {
    actions.push({ channel: 'email', label: 'Unsubscribe email' })
  }

  return actions
}

export function getCustomerOutreachActions(customer: CustomerAudienceMember) {
  if (!customer.canReceiveEmail) {
    return []
  }

  return [{ kind: 'email' as const, label: 'Email customer' }]
}

export function needsFreshOptIn(customer: CustomerAudienceMember) {
  return Boolean(
    customer.smsOptedOutAt ||
      customer.stopKeywordReceivedAt ||
      customer.emailOptedOutAt,
  )
}

export function getCustomerRecoveryActions(customer: CustomerAudienceMember) {
  if (!needsFreshOptIn(customer)) {
    return []
  }

  return [
    { kind: 'open_signup' as const, label: 'Open signup form' },
    { kind: 'copy_signup' as const, label: 'Copy signup link' },
  ]
}

export type DashboardPlaceholderProps = {
  repIdOverride?: string
  initialSiteSettings?: SiteSettingsDashboardResult
}

export function DashboardPlaceholder(props: DashboardPlaceholderProps = {}) {
  const { repIdOverride, initialSiteSettings } = props
  const [activeSection, setActiveSection] =
    useState<WorkspaceSectionKey>(() =>
      typeof window === 'undefined'
        ? 'setup-checklist'
        : getInitialWorkspaceSection(window.location.search),
    )
  const [repProfileState, setRepProfileState] = useState<RepProfileState>({
    status: 'loading',
  })
  const [audienceState, setAudienceState] = useState<AudienceState>({
    status: 'loading',
  })
  const [rosterFilter, setRosterFilter] = useState<RosterFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<RosterSort>('newest')
  const [actionState, setActionState] = useState<AudienceActionState>({
    pendingKey: null,
    error: null,
    helperMessage: null,
  })
  const [emailComposer, setEmailComposer] = useState<EmailComposerState>({
    audienceId: null,
    subject: '',
    body: '',
    pending: false,
  })
  const [walletState, setWalletState] = useState<WalletState>({
    status: 'loading',
  })
  const [calendarState, setCalendarState] = useState<CalendarState>({
    status: 'loading',
  })
  const [siteSettingsState, setSiteSettingsState] = useState<SiteSettingsState>(
    initialSiteSettings
      ? {
          status: 'ready',
          settings: initialSiteSettings,
        }
      : {
          status: 'loading',
        },
  )
  const [accountBillingState, setAccountBillingState] =
    useState<AccountBillingState>({
      status: 'loading',
    })
  const [walletActionState, setWalletActionState] = useState<WalletActionState>({
    pendingAmountCents: null,
    pendingSettings: false,
    error: null,
    helperMessage: null,
  })
  const [siteSettingsActionState, setSiteSettingsActionState] =
    useState<SiteSettingsActionState>({
      pending: false,
      error: null,
      helperMessage: null,
    })
  const [accountBillingActionState, setAccountBillingActionState] =
    useState<AccountBillingActionState>({
      pendingAction: null,
      error: null,
      helperMessage: null,
    })
  const [subscriptionAgreementAccepted, setSubscriptionAgreementAccepted] =
    useState(false)
  const [autoRechargeDraft, setAutoRechargeDraft] =
    useState<WalletAutoRechargeDraft | null>(null)
  const [siteSettingsDraft, setSiteSettingsDraft] =
    useState<SiteSettingsDraft | null>(
      initialSiteSettings ? getSiteSettingsDraft(initialSiteSettings) : null,
    )
  const [tradeBoardState, setTradeBoardState] = useState<TradeBoardState>({
    status: 'loading',
  })
  const [tradeBoardActionState, setTradeBoardActionState] =
    useState<TradeBoardActionState>({
      pendingKey: null,
      error: null,
      helperMessage: null,
    })
  const [tradeRequestsState, setTradeRequestsState] = useState<TradeRequestsState>({
    status: 'loading',
  })
  const [fulfillmentQueueState, setFulfillmentQueueState] =
    useState<FulfillmentQueueState>({
      status: 'loading',
    })
  const [tradeHistoryState, setTradeHistoryState] = useState<TradeHistoryState>({
    status: 'loading',
  })
  const [jewelryLibraryState, setJewelryLibraryState] =
    useState<JewelryLibraryState>({
      status: 'idle',
      results: [],
    })
  const [messagesState, setMessagesState] = useState<MessagesState>({
    status: 'loading',
  })
  const [messagesActionState, setMessagesActionState] =
    useState<MessagesActionState>({
      pendingKey: null,
      error: null,
      helperMessage: null,
    })
  const [resourcesState, setResourcesState] = useState<ResourcesState>({
    status: 'loading',
  })
  const [analyticsState, setAnalyticsState] = useState<AnalyticsState>({
    status: 'loading',
  })
  const [tradeBoardSearchQuery, setTradeBoardSearchQuery] = useState('')
  const [quickAddItemNumber, setQuickAddItemNumber] = useState('')
  const [librarySearchQuery, setLibrarySearchQuery] = useState('')
  const [supportSubject, setSupportSubject] = useState('Need help from Neon Rabbit')
  const [supportBody, setSupportBody] = useState('')

  async function loadRepProfile(signal?: AbortSignal) {
    const response = await fetch('/api/nic-nac/me', {
      credentials: 'include',
      signal,
    })
    if (!response.ok) {
      throw new Error(`rep profile request failed: ${response.status}`)
    }

    const payload = (await response.json()) as MeResponsePayload
    setRepProfileState({
      status: 'ready',
      repId: payload.rep?.id,
      displayName: payload.rep?.display_name,
    })
  }

  async function loadAudience(signal?: AbortSignal) {
    const response = await fetch('/api/nic-nac/customer-audience?limit=25', {
      credentials: 'include',
      signal,
    })
    if (!response.ok) {
      throw new Error(`audience request failed: ${response.status}`)
    }

    const payload = (await response.json()) as AudienceResponsePayload
    setAudienceState({
      status: 'ready',
      summary: payload.summary,
      customers: payload.customers,
    })
  }

  async function loadWallet(signal?: AbortSignal) {
    const response = await fetch('/api/nic-nac/wallet-summary?limit=5', {
      credentials: 'include',
      signal,
    })
    if (!response.ok) {
      throw new Error(`wallet request failed: ${response.status}`)
    }

    const payload = (await response.json()) as WalletResponsePayload
    setWalletState({
      status: 'ready',
      summary: payload,
    })
  }

  async function loadCalendar(signal?: AbortSignal) {
    const response = await fetch('/api/nic-nac/calendar-summary?upcoming=8&history=4', {
      credentials: 'include',
      signal,
    })
    if (!response.ok) {
      throw new Error(`calendar request failed: ${response.status}`)
    }

    const payload = (await response.json()) as CalendarResponsePayload
    setCalendarState({
      status: 'ready',
      summary: payload,
    })
  }

  async function loadSiteSettings(signal?: AbortSignal) {
    const response = await fetch('/api/nic-nac/site-settings', {
      credentials: 'include',
      signal,
    })
    if (!response.ok) {
      throw new Error(`site settings request failed: ${response.status}`)
    }

    const payload = (await response.json()) as SiteSettingsResponsePayload
    setSiteSettingsState({
      status: 'ready',
      settings: payload,
    })
  }

  async function loadAccountBilling(signal?: AbortSignal) {
    const response = await fetch('/api/nic-nac/account-billing', {
      credentials: 'include',
      signal,
    })
    if (!response.ok) {
      throw new Error(`account billing request failed: ${response.status}`)
    }

    const payload = (await response.json()) as AccountBillingResponsePayload
    setAccountBillingState({
      status: 'ready',
      summary: payload,
    })
  }

  async function loadTradeBoard(
    signal?: AbortSignal,
    options: { offset?: number; append?: boolean } = {},
  ) {
    const response = await fetch(buildTradeBoardFetchUrl({ offset: options.offset }), {
      credentials: 'include',
      signal,
    })
    if (!response.ok) {
      throw new Error(`trade board request failed: ${response.status}`)
    }

    const payload = (await response.json()) as TradeBoardResponsePayload
    setTradeBoardState((current) => {
      const board = options.append
        ? mergeTradeBoardResults(current.board, payload)
        : payload
      return {
        status: 'ready',
        board,
        hasMoreListings: payload.listings.length === TRADE_BOARD_PAGE_SIZE,
      }
    })
  }

  async function loadTradeRequests(signal?: AbortSignal) {
    const response = await fetch('/api/nic-nac/trade-requests?status=pending&limit=8', {
      credentials: 'include',
      signal,
    })
    if (!response.ok) {
      throw new Error(`trade requests request failed: ${response.status}`)
    }

    const payload = (await response.json()) as TradeRequestsResponsePayload
    setTradeRequestsState({
      status: 'ready',
      requests: payload,
    })
  }

  async function loadFulfillmentQueue(signal?: AbortSignal) {
    const response = await fetch('/api/nic-nac/fulfillment-queue', {
      credentials: 'include',
      signal,
    })
    if (!response.ok) {
      throw new Error(`fulfillment queue request failed: ${response.status}`)
    }

    const payload = (await response.json()) as FulfillmentQueueResponsePayload
    setFulfillmentQueueState({
      status: 'ready',
      items: payload,
    })
  }

  async function loadTradeHistory(signal?: AbortSignal) {
    const response = await fetch('/api/nic-nac/trade-history?limit=12', {
      credentials: 'include',
      signal,
    })
    if (!response.ok) {
      throw new Error(`trade history request failed: ${response.status}`)
    }

    const payload = (await response.json()) as TradeHistoryResponsePayload
    setTradeHistoryState({
      status: 'ready',
      history: payload,
    })
  }

  async function loadMessages(signal?: AbortSignal) {
    const response = await fetch('/api/nic-nac/messages?limit=10', {
      credentials: 'include',
      signal,
    })
    if (!response.ok) {
      throw new Error(`messages request failed: ${response.status}`)
    }

    const payload = (await response.json()) as MessagesResponsePayload
    setMessagesState({
      status: 'ready',
      inbox: payload,
    })
  }

  async function loadResources(signal?: AbortSignal) {
    const response = await fetch('/api/nic-nac/resources', {
      credentials: 'include',
      signal,
    })
    if (!response.ok) {
      throw new Error(`resources request failed: ${response.status}`)
    }

    const payload = (await response.json()) as ResourcesResponsePayload
    setResourcesState({
      status: 'ready',
      resources: payload,
    })
  }

  async function loadAnalytics(signal?: AbortSignal) {
    const response = await fetch('/api/nic-nac/site-analytics', {
      credentials: 'include',
      signal,
    })
    if (!response.ok) {
      throw new Error(`analytics request failed: ${response.status}`)
    }

    const payload = (await response.json()) as AnalyticsResponsePayload
    setAnalyticsState({
      status: 'ready',
      analytics: payload,
    })
  }

  async function loadJewelryLibrary(query: string, signal?: AbortSignal) {
    const trimmed = query.trim()
    if (!trimmed) {
      setJewelryLibraryState({
        status: 'idle',
        results: [],
      })
      return
    }

    setJewelryLibraryState({
      status: 'loading',
      results: [],
    })

    const response = await fetch(
      `/api/nic-nac/jewelry-library?query=${encodeURIComponent(trimmed)}&limit=16`,
      {
        credentials: 'include',
        signal,
      },
    )
    if (!response.ok) {
      throw new Error(`jewelry library request failed: ${response.status}`)
    }

    const payload = (await response.json()) as JewelryLibraryResponsePayload
    setJewelryLibraryState({
      status: 'ready',
      results: payload,
    })
  }

  async function loadPaidWorkspaceData(signal?: AbortSignal) {
    await Promise.all([
      loadAudience(signal).catch((error) => {
        if ((error as { name?: string }).name === 'AbortError') return
        setAudienceState({ status: 'error' })
      }),
      loadWallet(signal).catch((error) => {
        if ((error as { name?: string }).name === 'AbortError') return
        setWalletState({ status: 'error' })
      }),
      loadCalendar(signal).catch((error) => {
        if ((error as { name?: string }).name === 'AbortError') return
        setCalendarState({ status: 'error' })
      }),
      loadSiteSettings(signal).catch((error) => {
        if ((error as { name?: string }).name === 'AbortError') return
        setSiteSettingsState({ status: 'error' })
      }),
      loadTradeBoard(signal).catch((error) => {
        if ((error as { name?: string }).name === 'AbortError') return
        setTradeBoardState({ status: 'error' })
      }),
      loadTradeRequests(signal).catch((error) => {
        if ((error as { name?: string }).name === 'AbortError') return
        setTradeRequestsState({ status: 'error' })
      }),
      loadFulfillmentQueue(signal).catch((error) => {
        if ((error as { name?: string }).name === 'AbortError') return
        setFulfillmentQueueState({ status: 'error' })
      }),
      loadTradeHistory(signal).catch((error) => {
        if ((error as { name?: string }).name === 'AbortError') return
        setTradeHistoryState({ status: 'error' })
      }),
      loadMessages(signal).catch((error) => {
        if ((error as { name?: string }).name === 'AbortError') return
        setMessagesState({ status: 'error' })
      }),
      loadAnalytics(signal).catch((error) => {
        if ((error as { name?: string }).name === 'AbortError') return
        setAnalyticsState({ status: 'error' })
      }),
    ])
  }

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    ;(async () => {
      await Promise.all([
        loadRepProfile(controller.signal).catch((error) => {
          if (cancelled) return
          if ((error as { name?: string }).name === 'AbortError') return
          setRepProfileState({ status: 'error' })
        }),
        loadAccountBilling(controller.signal).catch((error) => {
          if (cancelled) return
          if ((error as { name?: string }).name === 'AbortError') return
          setAccountBillingState({ status: 'error' })
        }),
        loadResources(controller.signal).catch((error) => {
          if (cancelled) return
          if ((error as { name?: string }).name === 'AbortError') return
          setResourcesState({ status: 'error' })
        }),
      ])
    })()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const bannerMessage = getWalletBannerMessage(window.location.search)
    const billingBannerMessage = getAccountBillingBannerMessage(
      window.location.search,
    )

    if (bannerMessage) {
      setWalletActionState((current) => ({
        ...current,
        helperMessage: current.helperMessage ?? bannerMessage,
      }))
    }

    if (billingBannerMessage) {
      setAccountBillingActionState((current) => ({
        ...current,
        helperMessage: current.helperMessage ?? billingBannerMessage,
      }))
    }

    const params = new URLSearchParams(window.location.search)
    if (params.get('billing') !== 'subscription-success') return
    const sessionId = params.get('session_id')?.trim()

    ;(async () => {
      setAccountBillingActionState((current) => ({
        ...current,
        helperMessage:
          current.helperMessage ?? 'Subscription checkout completed. Syncing billing status...',
      }))

      try {
        const response = await fetch('/api/stripe/sync', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })
        if (!response.ok) return
        await loadAccountBilling()
      } catch {
        setAccountBillingActionState((current) => ({
          ...current,
          helperMessage:
            current.helperMessage ??
            'Subscription checkout completed. Billing status will refresh in a moment.',
        }))
      }
    })()
  }, [])

  useEffect(() => {
    if (walletState.status !== 'ready' || !walletState.summary) return

    setAutoRechargeDraft(getAutoRechargeDraft(walletState.summary))
  }, [walletState.status, walletState.summary])

  useEffect(() => {
    if (siteSettingsState.status !== 'ready' || !siteSettingsState.settings) return

    setSiteSettingsDraft(getSiteSettingsDraft(siteSettingsState.settings))
  }, [siteSettingsState.status, siteSettingsState.settings])

  async function handleUnsubscribe(
    audienceId: string,
    channel: 'sms' | 'email',
  ) {
    const pendingKey = `${audienceId}:${channel}`
    setActionState({ pendingKey, error: null, helperMessage: null })

    try {
      const response = await fetch('/api/nic-nac/customer-audience', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          audienceId,
          unsubscribeSms: channel === 'sms',
          unsubscribeEmail: channel === 'email',
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null
        throw new Error(payload?.error || 'Unable to update customer audience.')
      }

      await loadAudience()
      setActionState({ pendingKey: null, error: null, helperMessage: null })
    } catch (error) {
      setActionState({
        pendingKey: null,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to update customer audience.',
        helperMessage: null,
      })
    }
  }

  async function handleCopySignupLink() {
    const signupUrl = `${window.location.origin}${SIGNUP_FORM_PATH}`

    try {
      await navigator.clipboard.writeText(signupUrl)
      setActionState({
        pendingKey: null,
        error: null,
        helperMessage: 'Signup link copied.',
      })
    } catch {
      setActionState({
        pendingKey: null,
        error: null,
        helperMessage: 'Copy failed. Open the signup form and copy the URL manually.',
      })
    }
  }

  async function handleCopyVisibleContacts(
    customers: CustomerAudienceMember[],
    channel: 'sms' | 'email',
  ) {
    const values = getVisibleContactValues(customers, channel)
    if (values.length === 0) {
      setActionState({
        pendingKey: null,
        error: null,
        helperMessage:
          channel === 'sms'
            ? 'No visible phone numbers to copy.'
            : 'No visible email addresses to copy.',
      })
      return
    }

    try {
      await navigator.clipboard.writeText(values.join('\n'))
      setActionState({
        pendingKey: null,
        error: null,
        helperMessage:
          channel === 'sms'
            ? 'Visible phone numbers copied.'
            : 'Visible email addresses copied.',
      })
    } catch {
      setActionState({
        pendingKey: null,
        error: null,
        helperMessage: 'Copy failed. Please copy the visible contacts manually.',
      })
    }
  }

  function handleOpenEmailComposer(customer: CustomerAudienceMember) {
    setActionState((current) => ({
      ...current,
      error: null,
      helperMessage: null,
    }))
    setEmailComposer({
      audienceId: customer.id,
      subject: 'Quick update',
      body: '',
      pending: false,
    })
  }

  function handleCloseEmailComposer() {
    setEmailComposer({
      audienceId: null,
      subject: '',
      body: '',
      pending: false,
    })
  }

  async function handleSendEmail() {
    if (!emailComposer.audienceId) return

    setEmailComposer((current) => ({ ...current, pending: true }))
    setActionState({ pendingKey: null, error: null, helperMessage: null })

    try {
      const response = await fetch('/api/nic-nac/send-email', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          audienceId: emailComposer.audienceId,
          subject: emailComposer.subject,
          body: emailComposer.body,
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; customer?: { email?: string } }
        | null

      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to send that email right now.')
      }

      setActionState({
        pendingKey: null,
        error: null,
        helperMessage: payload?.customer?.email
          ? `Email sent to ${payload.customer.email}.`
          : 'Email sent.',
      })
      handleCloseEmailComposer()
    } catch (error) {
      setActionState({
        pendingKey: null,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to send that email right now.',
        helperMessage: null,
      })
      setEmailComposer((current) => ({ ...current, pending: false }))
    }
  }

  async function handleWalletLoad(amountCents: number) {
    setWalletActionState({
      pendingAmountCents: amountCents,
      pendingSettings: false,
      error: null,
      helperMessage: null,
    })

    try {
      const response = await fetch('/api/stripe/wallet/load', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ amount_cents: amountCents }),
      })

      const payload = (await response.json().catch(() => null)) as
        | {
            error?: string
            url?: string
            minimum_load_amount_cents?: number
          }
        | null

      if (!response.ok || !payload?.url) {
        const minimumLoadMessage =
          payload?.minimum_load_amount_cents && amountCents < payload.minimum_load_amount_cents
            ? `Minimum wallet load is ${formatWalletAmount(payload.minimum_load_amount_cents * 10)}.`
            : null

        throw new Error(
          minimumLoadMessage ??
            payload?.error ??
            'Unable to start wallet checkout right now.',
        )
      }

      setWalletActionState({
        pendingAmountCents: null,
        pendingSettings: false,
        error: null,
        helperMessage: 'Opening Stripe checkout...',
      })
      window.location.href = payload.url
    } catch (error) {
      setWalletActionState({
        pendingAmountCents: null,
        pendingSettings: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to start wallet checkout right now.',
        helperMessage: null,
      })
    }
  }

  function handleAutoRechargeDraftChange(
    patch: Partial<WalletAutoRechargeDraft>,
  ) {
    const summary = walletState.summary
    if (!summary) return

    setAutoRechargeDraft((current) => {
      if (!current) return current

      const next = { ...current, ...patch }
      const validAmountOptions = getAutoRechargeAmountOptions(
        summary,
        next.thresholdCents,
      )

      if (
        validAmountOptions.length > 0 &&
        !validAmountOptions.some(
          (option) => option.amountCents === next.amountCents,
        )
      ) {
        next.amountCents = validAmountOptions[0].amountCents
      }

      return next
    })
  }

  async function handleSaveAutoRechargeSettings() {
    if (!autoRechargeDraft) return

    setWalletActionState({
      pendingAmountCents: null,
      pendingSettings: true,
      error: null,
      helperMessage: null,
    })

    try {
      const response = await fetch('/api/stripe/wallet/auto-recharge', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          enabled: autoRechargeDraft.enabled,
          threshold_cents: autoRechargeDraft.thresholdCents,
          amount_cents: autoRechargeDraft.amountCents,
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to save auto-recharge settings.')
      }

      await loadWallet()
      setWalletActionState({
        pendingAmountCents: null,
        pendingSettings: false,
        error: null,
        helperMessage: 'Auto-recharge settings saved.',
      })
    } catch (error) {
      setWalletActionState({
        pendingAmountCents: null,
        pendingSettings: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to save auto-recharge settings.',
        helperMessage: null,
      })
    }
  }

  function handleSiteSettingsDraftChange(
    patch: Partial<SiteSettingsDraft>,
  ) {
    setSiteSettingsDraft((current) => {
      if (!current) return current
      return {
        ...current,
        ...patch,
        socialHandles: patch.socialHandles
          ? { ...patch.socialHandles }
          : current.socialHandles,
      }
    })
  }

  function handleSocialHandleChange(platform: string, value: string) {
    setSiteSettingsDraft((current) => {
      if (!current) return current
      return {
        ...current,
        socialHandles: {
          ...current.socialHandles,
          [platform]: value,
        },
      }
    })
  }

  async function handleSaveSiteSettings() {
    if (!siteSettingsDraft) return

    setSiteSettingsActionState({
      pending: true,
      error: null,
      helperMessage: null,
    })

    try {
      const response = await fetch('/api/nic-nac/site-settings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(siteSettingsDraft),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; settings?: SiteSettingsDashboardResult }
        | null

      if (!response.ok || !payload?.settings) {
        throw new Error(payload?.error || 'Unable to save site settings.')
      }

      setSiteSettingsState({
        status: 'ready',
        settings: payload.settings,
      })
      setSiteSettingsDraft(getSiteSettingsDraft(payload.settings))
      setSiteSettingsActionState({
        pending: false,
        error: null,
        helperMessage: 'Site settings saved.',
      })
    } catch (error) {
      setSiteSettingsActionState({
        pending: false,
        error:
          error instanceof Error ? error.message : 'Unable to save site settings.',
        helperMessage: null,
      })
    }
  }

  async function handleAccountBillingAction(action: 'subscribe' | 'manage') {
    setAccountBillingActionState({
      pendingAction: action,
      error: null,
      helperMessage: null,
    })

    try {
      const endpoint =
        action === 'subscribe'
          ? '/api/stripe/create-checkout'
          : '/api/stripe/create-portal-session'
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body:
          action === 'subscribe'
            ? JSON.stringify({ agreementAccepted: subscriptionAgreementAccepted })
            : undefined,
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; url?: string }
        | null

      if (!response.ok || !payload?.url) {
        throw new Error(
          payload?.error ||
            (action === 'subscribe'
              ? 'Unable to start subscription checkout.'
              : 'Unable to open the Stripe billing portal.'),
        )
      }

      setAccountBillingActionState({
        pendingAction: null,
        error: null,
        helperMessage:
          action === 'subscribe'
            ? 'Opening Stripe checkout...'
            : 'Opening Stripe billing portal...',
      })
      window.location.href = payload.url
    } catch (error) {
      setAccountBillingActionState({
        pendingAction: null,
        error:
          error instanceof Error
            ? error.message
            : action === 'subscribe'
              ? 'Unable to start subscription checkout.'
              : 'Unable to open the Stripe billing portal.',
        helperMessage: null,
      })
    }
  }

  async function refreshTradeWorkspace() {
    await Promise.all([
      loadTradeBoard(),
      loadTradeRequests(),
      loadFulfillmentQueue(),
      loadTradeHistory(),
      loadAnalytics(),
    ])
  }

  async function handleLoadMoreTradeListings() {
    const offset = tradeBoardState.board?.listings.length ?? 0
    if (offset <= 0) return

    setTradeBoardActionState({
      pendingKey: 'load-more-listings',
      error: null,
      helperMessage: null,
    })

    try {
      await loadTradeBoard(undefined, { offset, append: true })
      setTradeBoardActionState({
        pendingKey: null,
        error: null,
        helperMessage: null,
      })
    } catch (error) {
      setTradeBoardActionState({
        pendingKey: null,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to load more listings right now.',
        helperMessage: null,
      })
    }
  }

  useEffect(() => {
    if (activeSection !== 'trade-board') return

    const refreshIfTradeBoardActive = () => {
      if (document.visibilityState === 'hidden') return
      void refreshTradeWorkspace()
    }
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        void refreshTradeWorkspace()
      }
    }

    document.addEventListener('visibilitychange', refreshWhenVisible)
    window.addEventListener('focus', refreshIfTradeBoardActive)
    const intervalId = window.setInterval(
      refreshIfTradeBoardActive,
      TRADE_WORKSPACE_REFRESH_MS,
    )

    return () => {
      document.removeEventListener('visibilitychange', refreshWhenVisible)
      window.removeEventListener('focus', refreshIfTradeBoardActive)
      window.clearInterval(intervalId)
    }
  }, [activeSection])

  useEffect(() => {
    const refreshAfterNicNacMutation = (event: Event) => {
      const detail = (event as CustomEvent<{ topic?: string }>).detail
      if (detail?.topic !== 'trade') return
      if (document.visibilityState === 'hidden') return
      void refreshTradeWorkspace()
    }

    window.addEventListener(
      NIC_NAC_WORKSPACE_REFRESH_EVENT,
      refreshAfterNicNacMutation,
    )
    return () => {
      window.removeEventListener(
        NIC_NAC_WORKSPACE_REFRESH_EVENT,
        refreshAfterNicNacMutation,
      )
    }
  }, [])

  useEffect(() => {
    if (accountBillingState.status !== 'ready') return
    if (!hasPaidWorkspaceSubscription(accountBillingState.summary)) return

    const controller = new AbortController()
    void loadPaidWorkspaceData(controller.signal)

    return () => controller.abort()
  }, [accountBillingState.status, accountBillingState.summary])

  useEffect(() => {
    if (accountBillingState.status !== 'ready') return
    const hasPaidWorkspace = hasPaidWorkspaceSubscription(accountBillingState.summary)
    const allowedSection = resolveWorkspaceSectionForAccess(
      activeSection,
      hasPaidWorkspace,
    )
    if (allowedSection !== activeSection) {
      setActiveSection(allowedSection)
    }
  }, [accountBillingState.status, accountBillingState.summary, activeSection])

  async function handleQuickAddListing() {
    if (!quickAddItemNumber.trim()) {
      setTradeBoardActionState({
        pendingKey: null,
        error: 'Enter an item number first.',
        helperMessage: null,
      })
      return
    }

    setTradeBoardActionState({
      pendingKey: 'quick-add',
      error: null,
      helperMessage: null,
    })

    try {
      const response = await fetch('/api/nic-nac/trade-board', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          itemNumber: quickAddItemNumber,
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to add that listing right now.')
      }

      setQuickAddItemNumber('')
      await refreshTradeWorkspace()
      setTradeBoardActionState({
        pendingKey: null,
        error: null,
        helperMessage: 'Listing added to your board.',
      })
    } catch (error) {
      setTradeBoardActionState({
        pendingKey: null,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to add that listing right now.',
        helperMessage: null,
      })
    }
  }

  async function handleRemoveTradeListing(listingId: string) {
    setTradeBoardActionState({
      pendingKey: `remove:${listingId}`,
      error: null,
      helperMessage: null,
    })

    try {
      const response = await fetch('/api/nic-nac/trade-board', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          listingId,
          reason: 'other',
        }),
      })
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to remove that listing right now.')
      }

      await refreshTradeWorkspace()
      setTradeBoardActionState({
        pendingKey: null,
        error: null,
        helperMessage: 'Listing removed from your board.',
      })
    } catch (error) {
      setTradeBoardActionState({
        pendingKey: null,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to remove that listing right now.',
        helperMessage: null,
      })
    }
  }

  async function handleTradeRequestDecision(
    requestId: string,
    action: 'approve' | 'reject',
  ) {
    setTradeBoardActionState({
      pendingKey: `${action}:${requestId}`,
      error: null,
      helperMessage: null,
    })

    try {
      const response = await fetch('/api/nic-nac/trade-requests', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action,
          requestId,
          ...(action === 'reject' ? { reason: 'not_interested' } : {}),
        }),
      })
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to update that request right now.')
      }

      await refreshTradeWorkspace()
      setTradeBoardActionState({
        pendingKey: null,
        error: null,
        helperMessage:
          action === 'approve'
            ? 'Trade request approved.'
            : 'Trade request denied.',
      })
    } catch (error) {
      setTradeBoardActionState({
        pendingKey: null,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to update that request right now.',
        helperMessage: null,
      })
    }
  }

  async function handleAdvanceFulfillment(
    requestId: string,
    nextStatus: 'shipped' | 'completed',
  ) {
    setTradeBoardActionState({
      pendingKey: `fulfillment:${requestId}`,
      error: null,
      helperMessage: null,
    })

    try {
      const response = await fetch('/api/nic-nac/fulfillment-queue', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          requestId,
          nextStatus,
        }),
      })
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to advance fulfillment right now.')
      }

      await refreshTradeWorkspace()
      setTradeBoardActionState({
        pendingKey: null,
        error: null,
        helperMessage:
          nextStatus === 'shipped'
            ? 'Fulfillment moved to shipped.'
            : 'Fulfillment marked completed.',
      })
    } catch (error) {
      setTradeBoardActionState({
        pendingKey: null,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to advance fulfillment right now.',
        helperMessage: null,
      })
    }
  }

  async function handleLibrarySearch() {
    try {
      await loadJewelryLibrary(librarySearchQuery)
    } catch (error) {
      setJewelryLibraryState({
        status: 'error',
        results: [],
      })
      setTradeBoardActionState((current) => ({
        ...current,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to search the jewelry library right now.',
      }))
    }
  }

  async function handleAddFromLibrary(itemNumber: string) {
    setTradeBoardActionState({
      pendingKey: `library:${itemNumber}`,
      error: null,
      helperMessage: null,
    })

    try {
      const response = await fetch('/api/nic-nac/jewelry-library', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          itemNumber,
        }),
      })
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to add that piece right now.')
      }

      await Promise.all([refreshTradeWorkspace(), loadJewelryLibrary(librarySearchQuery)])
      setTradeBoardActionState({
        pendingKey: null,
        error: null,
        helperMessage: `${itemNumber} added to your board.`,
      })
    } catch (error) {
      setTradeBoardActionState({
        pendingKey: null,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to add that piece right now.',
        helperMessage: null,
      })
    }
  }

  async function handleMarkMessageRead(messageId: string) {
    setMessagesActionState({
      pendingKey: `read:${messageId}`,
      error: null,
      helperMessage: null,
    })

    try {
      const response = await fetch('/api/nic-nac/messages', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_read',
          messageId,
        }),
      })
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to update that message right now.')
      }

      await loadMessages()
      setMessagesActionState({
        pendingKey: null,
        error: null,
        helperMessage: 'Message marked read.',
      })
    } catch (error) {
      setMessagesActionState({
        pendingKey: null,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to update that message right now.',
        helperMessage: null,
      })
    }
  }

  async function handleCreateSupportRequest() {
    setMessagesActionState({
      pendingKey: 'support-request',
      error: null,
      helperMessage: null,
    })

    try {
      const response = await fetch('/api/nic-nac/messages', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'create_support_request',
          subject: supportSubject,
          body: supportBody,
        }),
      })
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to send that support note right now.')
      }

      setSupportBody('')
      await loadMessages()
      setMessagesActionState({
        pendingKey: null,
        error: null,
        helperMessage: 'Support message sent to Neon Rabbit.',
      })
    } catch (error) {
      setMessagesActionState({
        pendingKey: null,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to send that support note right now.',
        helperMessage: null,
      })
    }
  }

  const visibleTradeListings =
    tradeBoardState.board?.listings.filter((listing) =>
      listing.status === 'available' &&
      [listing.design.item_number, listing.design.design_name, listing.design.collection?.name ?? '']
        .join(' ')
        .toLowerCase()
        .includes(tradeBoardSearchQuery.trim().toLowerCase()),
    ) ?? []
  const customerSparkleSiteHref = buildCustomerSparkleSiteHref(
    repIdOverride ?? repProfileState.repId,
  )
  const headerRepShow = formatHeaderRepShow(
    siteSettingsState.settings?.displayName ?? repProfileState.displayName,
    siteSettingsState.settings?.businessName,
  )
  const headerExtensionId = formatExtensionRepId(repIdOverride ?? repProfileState.repId)
  const workspaceSkinPreset = getWorkspaceSkinPreset(
    siteSettingsState.settings,
    siteSettingsDraft,
  )
  const hasPaidWorkspace = hasPaidWorkspaceSubscription(
    accountBillingState.summary,
  )
  const visibleWorkspaceSections = getVisibleWorkspaceSections(hasPaidWorkspace)

  return (
    <main className={styles.main} data-workspace-skin={workspaceSkinPreset}>
      <header className={styles.topbar}>
        <div className={styles.topbarCopy}>
          <SparkleSeal className={styles.brandSeal} />
          <div className={styles.brandText}>
            <span className={styles.brand}>Sparkle Suite</span>
            <span className={styles.topbarSubtitle}>Workspace</span>
          </div>
        </div>
        <div className={styles.topbarActions}>
          <div className={styles.topbarInfoPill}>
            <span className={styles.topbarInfoLabel}>Rep / show</span>
            <span className={styles.topbarInfoValue}>{headerRepShow}</span>
          </div>
          <div className={styles.topbarInfoPill}>
            <span className={styles.topbarInfoLabel}>Extension code</span>
            <span className={`${styles.topbarInfoValue} ${styles.topbarInfoValueCode}`}>
              {headerExtensionId}
            </span>
          </div>
          {hasPaidWorkspace ? (
            <a
              className={styles.liveSiteButton}
              href={customerSparkleSiteHref}
              target="_blank"
              rel="noreferrer"
            >
              View live site
            </a>
          ) : null}
        </div>
      </header>
      <div className={styles.workspaceShell}>
        <aside className={styles.workspaceSidebar}>
          <div className={styles.workspaceSidebarTitle}>Dashboard</div>
          <div className={styles.workspaceSidebarIntro}>
            Start with checkout review, then unlock the guided setup steps for your public site.
          </div>
          <nav className={styles.workspaceNav}>
            {visibleWorkspaceSections.map((section) => {
              const isLockedSection = 'locked' in section && section.locked
              return (
                <button
                  key={section.key}
                  type="button"
                  className={`${styles.workspaceNavButton} ${
                    activeSection === section.key
                      ? styles.workspaceNavButtonActive
                      : ''
                  } ${
                    isLockedSection ? styles.workspaceNavButtonLocked : ''
                  }`}
                  onClick={() =>
                    setActiveSection(
                      resolveWorkspaceSectionForAccess(
                        section.key,
                        hasPaidWorkspace,
                      ),
                    )
                  }
                >
                  <span className={styles.workspaceNavLabelRow}>
                    <span className={styles.workspaceNavLabel}>{section.label}</span>
                    {isLockedSection ? (
                      <span className={styles.workspaceNavLockTag}>Locked</span>
                    ) : null}
                  </span>
                  <span className={styles.workspaceNavSubtitle}>
                    {section.subtitle}
                  </span>
                </button>
              )
            })}
          </nav>
        </aside>
        <section className={styles.workspaceContent}>
          {activeSection === 'setup-checklist' ? (
            <div className={styles.workspaceSectionStack}>
              <SetupChecklistCard
                hasPaidWorkspace={hasPaidWorkspace}
                onSelectSection={setActiveSection}
              />
            </div>
          ) : null}

          {hasPaidWorkspace && activeSection === 'trade-board' ? (
            <TradeBoardWorkspaceCard
              tradeBoardState={tradeBoardState}
              visibleListings={visibleTradeListings}
              tradeBoardSearchQuery={tradeBoardSearchQuery}
              onTradeBoardSearchQueryChange={setTradeBoardSearchQuery}
              quickAddItemNumber={quickAddItemNumber}
              onQuickAddItemNumberChange={setQuickAddItemNumber}
              actionState={tradeBoardActionState}
              tradeRequestsState={tradeRequestsState}
              fulfillmentQueueState={fulfillmentQueueState}
              tradeHistoryState={tradeHistoryState}
              onQuickAddListing={handleQuickAddListing}
              onRemoveListing={handleRemoveTradeListing}
              onApproveRequest={(requestId) =>
                handleTradeRequestDecision(requestId, 'approve')
              }
              onRejectRequest={(requestId) =>
                handleTradeRequestDecision(requestId, 'reject')
              }
              onAdvanceFulfillment={handleAdvanceFulfillment}
              customerBoardHref={buildCustomerTradeBoardHref(repProfileState.repId)}
              hasMoreListings={tradeBoardState.hasMoreListings === true}
              onLoadMoreListings={handleLoadMoreTradeListings}
            />
          ) : null}

          {hasPaidWorkspace && activeSection === 'jewelry-library' ? (
            <JewelryLibraryCard
              state={jewelryLibraryState}
              searchQuery={librarySearchQuery}
              onSearchQueryChange={setLibrarySearchQuery}
              onSearch={handleLibrarySearch}
              onAddToBoard={handleAddFromLibrary}
              actionState={tradeBoardActionState}
            />
          ) : null}

          {hasPaidWorkspace && activeSection === 'show-calendar' ? (
            <div className={styles.workspaceSectionStack}>
              <ShowCalendarCard state={calendarState} />
            </div>
          ) : null}

          {hasPaidWorkspace && activeSection === 'business-calculator' ? (
            <div className={styles.workspaceSectionStack}>
              <BusinessCalculatorCard />
            </div>
          ) : null}

          {hasPaidWorkspace && activeSection === 'team-management' ? (
            <div className={styles.workspaceSectionStack}>
              <TeamManagementCard />
            </div>
          ) : null}

          {hasPaidWorkspace && activeSection === 'messages' ? (
            <div className={styles.workspaceSectionStack}>
              <MessagesCenterCard
                state={messagesState}
                actionState={messagesActionState}
                supportSubject={supportSubject}
                supportBody={supportBody}
                onSupportSubjectChange={setSupportSubject}
                onSupportBodyChange={setSupportBody}
                onCreateSupportRequest={handleCreateSupportRequest}
                onMarkRead={handleMarkMessageRead}
              />
              <CustomerRosterCard
                state={audienceState}
                activeFilter={rosterFilter}
                onFilterChange={setRosterFilter}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
                actionState={actionState}
                onUnsubscribe={handleUnsubscribe}
                onCopySignupLink={handleCopySignupLink}
                onCopyVisibleContacts={handleCopyVisibleContacts}
                activeComposerAudienceId={emailComposer.audienceId}
                composerSubject={emailComposer.subject}
                composerBody={emailComposer.body}
                composerPending={emailComposer.pending}
                onOpenEmailComposer={handleOpenEmailComposer}
                onCloseEmailComposer={handleCloseEmailComposer}
                onComposerSubjectChange={(value) =>
                  setEmailComposer((current) => ({ ...current, subject: value }))
                }
                onComposerBodyChange={(value) =>
                  setEmailComposer((current) => ({ ...current, body: value }))
                }
                onSendEmail={handleSendEmail}
              />
            </div>
          ) : null}

          {hasPaidWorkspace && activeSection === 'site-settings' ? (
            <div className={styles.workspaceSectionStack}>
              <SiteSettingsCard
                state={siteSettingsState}
                draft={siteSettingsDraft}
                actionState={siteSettingsActionState}
                onDraftChange={handleSiteSettingsDraftChange}
                onSocialHandleChange={handleSocialHandleChange}
                onSave={handleSaveSiteSettings}
                statusMessage={siteSettingsActionState.helperMessage}
              />
            </div>
          ) : null}

          {activeSection === 'help-resources' ? (
            <div className={styles.workspaceSectionStack}>
              <HelpResourcesCard
                state={resourcesState}
                hasPaidWorkspace={hasPaidWorkspace}
              />
            </div>
          ) : null}

          {activeSection === 'account' ? (
            <div className={styles.workspaceSectionStack}>
              <AccountBillingCard
                state={accountBillingState}
                actionState={accountBillingActionState}
                onStartSubscription={() => handleAccountBillingAction('subscribe')}
                onManageBilling={() => handleAccountBillingAction('manage')}
                statusMessage={accountBillingActionState.helperMessage}
                agreementAccepted={subscriptionAgreementAccepted}
                onAgreementAcceptedChange={setSubscriptionAgreementAccepted}
              />
              {hasPaidWorkspace ? (
                <>
                  <WalletSummaryCard
                    state={walletState}
                    actionState={walletActionState}
                    autoRechargeDraft={autoRechargeDraft}
                    onAutoRechargeDraftChange={handleAutoRechargeDraftChange}
                    onSaveAutoRechargeSettings={handleSaveAutoRechargeSettings}
                    onLoadWallet={handleWalletLoad}
                    statusMessage={walletActionState.helperMessage}
                  />
                  <SiteAnalyticsCard state={analyticsState} />
                </>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}

function getNextFulfillmentStatus(status: FulfillmentQueueItem['status']) {
  if (status === 'approved') return 'shipped'
  if (status === 'shipped') return 'completed'
  return null
}

export function TradeBoardWorkspaceCard({
  tradeBoardState,
  visibleListings,
  tradeBoardSearchQuery,
  onTradeBoardSearchQueryChange,
  quickAddItemNumber,
  onQuickAddItemNumberChange,
  actionState,
  tradeRequestsState,
  fulfillmentQueueState,
  tradeHistoryState,
  onQuickAddListing,
  onRemoveListing,
  onApproveRequest,
  onRejectRequest,
  onAdvanceFulfillment,
  customerBoardHref = buildCustomerTradeBoardHref(),
  hasMoreListings = false,
  onLoadMoreListings,
}: {
  tradeBoardState: TradeBoardState
  visibleListings?: TradeListingWithDesign[]
  tradeBoardSearchQuery: string
  onTradeBoardSearchQueryChange: (value: string) => void
  quickAddItemNumber: string
  onQuickAddItemNumberChange: (value: string) => void
  actionState: TradeBoardActionState
  tradeRequestsState: TradeRequestsState
  fulfillmentQueueState: FulfillmentQueueState
  tradeHistoryState: TradeHistoryState
  onQuickAddListing: () => void
  onRemoveListing: (listingId: string) => void
  onApproveRequest: (requestId: string) => void
  onRejectRequest: (requestId: string) => void
  onAdvanceFulfillment: (
    requestId: string,
    nextStatus: 'shipped' | 'completed',
  ) => void
  customerBoardHref?: string
  hasMoreListings?: boolean
  onLoadMoreListings?: () => void
}) {
  const [previewListing, setPreviewListing] = useState<TradeListingWithDesign | null>(
    null,
  )
  const boardSummary = tradeBoardState.board?.summary
  const boardListings = (visibleListings ?? tradeBoardState.board?.listings ?? []).filter(
    (listing) => listing.status === 'available',
  )
  const requests = tradeRequestsState.requests ?? []
  const queueItems = fulfillmentQueueState.items ?? []
  const history = tradeHistoryState.history

  return (
    <div className={styles.workspaceSectionStack}>
      <div className={styles.workspaceIntroCard}>
        <div className={styles.workspaceSectionHeader}>
          <div>
            <div className={styles.cardTitle}>Trade Board</div>
            <div className={styles.cardSubtitle}>
              Track active pieces, requests, fulfillment, and trade history from one place.
            </div>
          </div>
          <div className={styles.headerActions}>
            <a
              className={styles.helperLink}
              href={customerBoardHref}
              target="_blank"
              rel="noreferrer"
            >
              View customer board
            </a>
            <span className={styles.rosterTag}>Default landing section</span>
          </div>
        </div>
        {actionState.error ? <div className={styles.actionError}>{actionState.error}</div> : null}
        {actionState.helperMessage ? (
          <div className={styles.helperMessage}>{actionState.helperMessage}</div>
        ) : null}
      </div>

      <div className={styles.workspaceSectionGrid}>
        <div className={styles.workspacePanel}>
          <div className={styles.calendarHeader}>
            <div className={styles.walletSettingsTitle}>Board overview</div>
            <span className={styles.rosterTag}>
              {tradeBoardState.status === 'ready' && boardSummary
                ? `${boardSummary.totalPieces} live pieces`
                : 'Loading board'}
            </span>
          </div>
          {tradeBoardState.status === 'ready' && boardSummary ? (
            <>
              <div className={styles.metricGrid}>
                <div className={styles.metricBlock}>
                  <span className={styles.metricLabel}>Active pieces</span>
                  <span className={styles.metricValue}>{boardSummary.totalPieces}</span>
                </div>
                <div className={styles.metricBlock}>
                  <span className={styles.metricLabel}>Board MSRP</span>
                  <span className={styles.metricValue}>
                    {formatTradeMoney(boardSummary.totalMsrp)}
                  </span>
                </div>
                <div className={styles.metricBlock}>
                  <span className={styles.metricLabel}>Pending requests</span>
                  <span className={styles.metricValue}>{boardSummary.pendingRequestCount}</span>
                </div>
                <div className={styles.metricBlock}>
                  <span className={styles.metricLabel}>Top type</span>
                  <span className={styles.metricValue}>
                    {Object.entries(boardSummary.typeBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] ??
                      '—'}
                  </span>
                </div>
              </div>
              <div className={styles.workspaceFormRow}>
                <label className={styles.searchField}>
                  <span className={styles.searchLabel}>Quick add by item number</span>
                  <input
                    type="text"
                    className={`${styles.searchInput} ph-no-capture`}
                    value={quickAddItemNumber}
                    onChange={(event) =>
                      onQuickAddItemNumberChange(event.target.value.toUpperCase())
                    }
                    placeholder="RG100"
                  />
                </label>
                <button
                  type="button"
                  className={styles.actionButton}
                  disabled={actionState.pendingKey === 'quick-add'}
                  onClick={onQuickAddListing}
                >
                  {actionState.pendingKey === 'quick-add' ? 'Adding...' : 'Add to board'}
                </button>
              </div>
              <label className={styles.searchField}>
                <span className={styles.searchLabel}>Search your active board</span>
                <input
                  type="text"
                  className={`${styles.searchInput} ph-no-capture`}
                  value={tradeBoardSearchQuery}
                  onChange={(event) =>
                    onTradeBoardSearchQueryChange(event.target.value)
                  }
                  placeholder="Search by item number, design, or collection"
                />
              </label>
              <div
                className={styles.tradePieceGrid}
                aria-label="Active trade board pieces"
              >
                {boardListings.length > 0 ? (
                  boardListings.map((listing) => {
                    const photoUrl = getTradeListingPhotoUrl(listing)
                    return (
                    <div key={listing.id} className={styles.tradePieceCard}>
                      <button
                        type="button"
                        className={styles.tradePieceMediaButton}
                        aria-label={`Open image preview for ${listing.design.design_name}`}
                        onClick={() => setPreviewListing(listing)}
                      >
                        <span className={styles.tradePieceMedia}>
                          {photoUrl ? (
                            <img
                              className={styles.tradePieceImage}
                              src={photoUrl}
                              alt={listing.design.design_name}
                              loading="lazy"
                            />
                          ) : (
                            <span className={styles.tradePieceFallback}>
                              {listing.design.type_prefix}
                            </span>
                          )}
                        </span>
                      </button>
                      <div className={styles.tradePieceBody}>
                        <div className={styles.customerName}>
                          {listing.design.design_name}
                        </div>
                        <div className={styles.tradePieceMetaLine}>
                          {listing.design.item_number}
                          {' '}
                          {listing.design.type_prefix}
                          {listing.design.collection?.name
                            ? ` · ${listing.design.collection.name}`
                            : ''}
                          {listing.listed_at ? ` · Listed ${formatCompactDate(listing.listed_at)}` : ''}
                        </div>
                        <div className={styles.helperNote}>
                          Image source: {getTradeListingPhotoSourceLabel(listing)}
                        </div>
                      </div>
                      <div className={styles.tradeMeta}>
                        <span className={styles.statusBadgePositive}>{listing.status}</span>
                        <span className={styles.timelineItem}>
                          {formatTradeMoney(listing.design.bp_msrp)}
                        </span>
                      </div>
                      <div className={styles.actionRow}>
                        <button
                          type="button"
                          className={styles.actionButton}
                          disabled={actionState.pendingKey === `remove:${listing.id}`}
                          onClick={() => onRemoveListing(listing.id)}
                        >
                          {actionState.pendingKey === `remove:${listing.id}`
                            ? 'Removing...'
                            : 'Remove'}
                        </button>
                      </div>
                    </div>
                  )})
                ) : (
                  <div className={styles.emptyState}>
                    {tradeBoardSearchQuery.trim()
                      ? 'No board listings match this search yet.'
                      : 'No pieces on your board yet. Add your first item above.'}
                  </div>
                )}
              </div>
              {hasMoreListings && !tradeBoardSearchQuery.trim() ? (
                <button
                  type="button"
                  className={styles.secondaryActionButton}
                  disabled={actionState.pendingKey === 'load-more-listings'}
                  onClick={onLoadMoreListings}
                >
                  {actionState.pendingKey === 'load-more-listings'
                    ? 'Loading...'
                    : 'Load more'}
                </button>
              ) : null}
              {previewListing ? (
                <div
                  className={styles.imagePreviewMask}
                  role="dialog"
                  aria-modal="true"
                  aria-label={`${previewListing.design.design_name} image preview`}
                  onClick={() => setPreviewListing(null)}
                >
                  <div
                    className={styles.imagePreviewDialog}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      className={styles.imagePreviewClose}
                      aria-label="Close image preview"
                      onClick={() => setPreviewListing(null)}
                    >
                      x
                    </button>
                    <div className={styles.imagePreviewFrame}>
                      {getTradeListingPhotoUrl(previewListing) ? (
                        <img
                          src={getTradeListingPhotoUrl(previewListing) ?? undefined}
                          alt={previewListing.design.design_name}
                          className={styles.imagePreviewImage}
                        />
                      ) : (
                        <div className={styles.tradePieceFallback}>
                          {previewListing.design.type_prefix}
                        </div>
                      )}
                    </div>
                    <div className={styles.walletSettingsTitle}>
                      {previewListing.design.design_name}
                    </div>
                    <div className={styles.helperNote}>
                      Image source: {getTradeListingPhotoSourceLabel(previewListing)}
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className={styles.cardFill}>
              <div className={styles.loadingLine} />
              <div className={styles.loadingLineShort} />
            </div>
          )}
        </div>

        <div className={styles.workspacePanel}>
          <div className={styles.calendarHeader}>
            <div className={styles.walletSettingsTitle}>Request inbox</div>
            <span className={styles.rosterTag}>
              {tradeRequestsState.status === 'ready' ? `${requests.length} pending` : 'Loading'}
            </span>
          </div>
          {tradeRequestsState.status === 'ready' ? (
            <div className={styles.tradeList}>
              {requests.length > 0 ? (
                requests.map((request) => (
                  <div key={request.id} className={styles.tradeRow}>
                    <div className={styles.tradeIdentity}>
                      <div className={styles.customerName}>{request.customerName}</div>
                      <div className={styles.customerDate}>
                        Wants {request.listing.design.itemNumber} · {request.listing.design.designName}
                      </div>
                      <div className={styles.helperNote}>{request.customerDescription}</div>
                    </div>
                    <div className={styles.actionRow}>
                      <button
                        type="button"
                        className={styles.actionButton}
                        disabled={actionState.pendingKey === `approve:${request.id}`}
                        onClick={() => onApproveRequest(request.id)}
                      >
                        {actionState.pendingKey === `approve:${request.id}`
                          ? 'Approving...'
                          : 'Approve'}
                      </button>
                      <button
                        type="button"
                        className={styles.helperButton}
                        disabled={actionState.pendingKey === `reject:${request.id}`}
                        onClick={() => onRejectRequest(request.id)}
                      >
                        {actionState.pendingKey === `reject:${request.id}`
                          ? 'Denying...'
                          : 'Deny'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>No pending trade requests right now.</div>
              )}
            </div>
          ) : (
            <div className={styles.cardFill}>
              <div className={styles.loadingLine} />
              <div className={styles.loadingLineShort} />
            </div>
          )}
        </div>

        <div className={styles.workspacePanel}>
          <div className={styles.calendarHeader}>
            <div className={styles.walletSettingsTitle}>Fulfillment queue</div>
            <span className={styles.rosterTag}>
              {fulfillmentQueueState.status === 'ready'
                ? `${queueItems.length} active swaps`
                : 'Loading'}
            </span>
          </div>
          {fulfillmentQueueState.status === 'ready' ? (
            <div className={styles.tradeList}>
              {queueItems.length > 0 ? (
                queueItems.map((item) => {
                  const nextStatus = getNextFulfillmentStatus(item.status)
                  return (
                    <div key={item.fulfillmentId} className={styles.tradeRow}>
                      <div className={styles.tradeIdentity}>
                        <div className={styles.customerName}>{item.customerName}</div>
                        <div className={styles.customerDate}>
                          {item.itemNumber} · {item.designName}
                        </div>
                        <div className={styles.helperNote}>
                          {item.daysSinceLastUpdate} day(s) since last update
                        </div>
                      </div>
                      <div className={styles.tradeMeta}>
                        <span className={styles.statusBadgeWarning}>{item.status}</span>
                      </div>
                      <div className={styles.actionRow}>
                        {nextStatus ? (
                          <button
                            type="button"
                            className={styles.actionButton}
                            disabled={
                              actionState.pendingKey === `fulfillment:${item.requestId}`
                            }
                            onClick={() =>
                              onAdvanceFulfillment(item.requestId, nextStatus)
                            }
                          >
                            {actionState.pendingKey === `fulfillment:${item.requestId}`
                              ? 'Saving...'
                              : nextStatus === 'shipped'
                                ? 'Mark shipped'
                                : 'Mark completed'}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className={styles.emptyState}>No open fulfillment work right now.</div>
              )}
            </div>
          ) : (
            <div className={styles.cardFill}>
              <div className={styles.loadingLine} />
              <div className={styles.loadingLineShort} />
            </div>
          )}
        </div>

        <div className={styles.workspacePanel}>
          <div className={styles.calendarHeader}>
            <div className={styles.walletSettingsTitle}>Trade history</div>
            <span className={styles.rosterTag}>
              {tradeHistoryState.status === 'ready' && history
                ? `${history.summary.totalCompleted} completed`
                : 'Loading'}
            </span>
          </div>
          {tradeHistoryState.status === 'ready' && history ? (
            <>
              <div className={styles.metricGrid}>
                <div className={styles.metricBlock}>
                  <span className={styles.metricLabel}>Completed</span>
                  <span className={styles.metricValue}>{history.summary.totalCompleted}</span>
                </div>
                <div className={styles.metricBlock}>
                  <span className={styles.metricLabel}>MSRP traded</span>
                  <span className={styles.metricValue}>
                    {formatTradeMoney(history.summary.totalMsrpTraded)}
                  </span>
                </div>
                <div className={styles.metricBlock}>
                  <span className={styles.metricLabel}>Avg days</span>
                  <span className={styles.metricValue}>
                    {history.summary.avgFulfillmentDays?.toFixed(1) ?? '—'}
                  </span>
                </div>
                <div className={styles.metricBlock}>
                  <span className={styles.metricLabel}>Top design</span>
                  <span className={styles.metricValue}>
                    {history.summary.topDesign?.itemNumber ?? '—'}
                  </span>
                </div>
              </div>
              <div className={styles.tradeList}>
                {history.items.length > 0 ? (
                  history.items.map((item) => (
                    <div key={item.requestId} className={styles.tradeRow}>
                      <div className={styles.tradeIdentity}>
                        <div className={styles.customerName}>{item.customerName}</div>
                        <div className={styles.customerDate}>
                          {item.design.itemNumber} · {item.design.designName}
                        </div>
                      </div>
                      <div className={styles.tradeMeta}>
                        <span className={styles.timelineItem}>{item.status}</span>
                        <span className={styles.timelineItem}>
                          {item.fulfillmentStatus ?? 'No fulfillment'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState}>No trade history yet.</div>
                )}
              </div>
            </>
          ) : (
            <div className={styles.cardFill}>
              <div className={styles.loadingLine} />
              <div className={styles.loadingLineShort} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function JewelryLibraryCard({
  state,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  onAddToBoard,
  actionState,
}: {
  state: JewelryLibraryState
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  onSearch: () => void
  onAddToBoard: (itemNumber: string) => void
  actionState: TradeBoardActionState
}) {
  return (
    <div className={styles.workspaceSectionStack}>
      <div className={styles.workspaceIntroCard}>
        <div className={styles.workspaceSectionHeader}>
          <div>
            <div className={styles.cardTitle}>Jewelry Library</div>
            <div className={styles.cardSubtitle}>
              Search the shared catalog, spot pieces already on your board, and use the fallback button to list something fast.
            </div>
          </div>
        </div>
        <div className={styles.workspaceFormRow}>
          <label className={styles.searchField}>
            <span className={styles.searchLabel}>Search designs or item numbers</span>
            <input
              type="text"
              className={`${styles.searchInput} ph-no-capture`}
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="Aurora, birthday, RG100"
            />
          </label>
          <button type="button" className={styles.actionButton} onClick={onSearch}>
            Search library
          </button>
        </div>
        {actionState.error ? <div className={styles.actionError}>{actionState.error}</div> : null}
        {actionState.helperMessage ? (
          <div className={styles.helperMessage}>{actionState.helperMessage}</div>
        ) : null}
      </div>
      <div className={styles.workspacePanel}>
        {state.status === 'idle' ? (
          <div className={styles.emptyState}>
            Start with a design name, collection word, stone, or item number.
          </div>
        ) : state.status === 'loading' ? (
          <div className={styles.cardFill}>
            <div className={styles.loadingLine} />
            <div className={styles.loadingLineShort} />
          </div>
        ) : state.status === 'error' ? (
          <div className={styles.emptyState}>
            The library search is temporarily unavailable.
          </div>
        ) : state.results && state.results.length > 0 ? (
          <div className={styles.tradeList}>
            {state.results.map((result) => (
              <div key={result.designId} className={styles.tradeRow}>
                <div className={styles.tradeIdentity}>
                  <div className={styles.customerName}>{result.designName}</div>
                  <div className={styles.customerDate}>
                    {result.itemNumber}
                    {result.collectionName ? ` · ${result.collectionName}` : ''}
                    {result.material ? ` · ${result.material}` : ''}
                  </div>
                </div>
                <div className={styles.tradeMeta}>
                  <span className={styles.timelineItem}>
                    {result.isOnMyBoard ? 'Already on my board' : 'Not on my board'}
                  </span>
                  <span className={styles.timelineItem}>
                    {result.activeListingsCount} active board{result.activeListingsCount === 1 ? '' : 's'}
                  </span>
                </div>
                <div className={styles.actionRow}>
                  <button
                    type="button"
                    className={styles.actionButton}
                    disabled={
                      result.isOnMyBoard ||
                      actionState.pendingKey === `library:${result.itemNumber}`
                    }
                    onClick={() => onAddToBoard(result.itemNumber)}
                  >
                    {actionState.pendingKey === `library:${result.itemNumber}`
                      ? 'Adding...'
                      : result.isOnMyBoard
                        ? 'Already listed'
                        : 'Add to board'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>No catalog matches for that search yet.</div>
        )}
      </div>
    </div>
  )
}

function MessagesCenterCard({
  state,
  actionState,
  supportSubject,
  supportBody,
  onSupportSubjectChange,
  onSupportBodyChange,
  onCreateSupportRequest,
  onMarkRead,
}: {
  state: MessagesState
  actionState: MessagesActionState
  supportSubject: string
  supportBody: string
  onSupportSubjectChange: (value: string) => void
  onSupportBodyChange: (value: string) => void
  onCreateSupportRequest: () => void
  onMarkRead: (messageId: string) => void
}) {
  return (
    <div className={styles.workspacePanel}>
      <div className={styles.workspaceSectionHeader}>
        <div>
          <div className={styles.cardTitle}>Messages / Notifications</div>
          <div className={styles.cardSubtitle}>
            Monthly reports, Neon Rabbit announcements, and the backup support lane.
          </div>
        </div>
        <span className={styles.rosterTag}>
          {state.status === 'ready' && state.inbox
            ? `${state.inbox.unreadCount} unread`
            : 'Loading'}
        </span>
      </div>
      {actionState.error ? <div className={styles.actionError}>{actionState.error}</div> : null}
      {actionState.helperMessage ? (
        <div className={styles.helperMessage}>{actionState.helperMessage}</div>
      ) : null}
      {state.status === 'ready' && state.inbox ? (
        <>
          <div className={styles.tradeList}>
            {state.inbox.messages.length > 0 ? (
              state.inbox.messages.map((message) => (
                <div key={message.id} className={styles.tradeRow}>
                  <div className={styles.tradeIdentity}>
                    <div className={styles.customerName}>
                      {message.subject || MESSAGE_TYPE_LABELS[message.messageType]}
                    </div>
                    <div className={styles.customerDate}>
                      {MESSAGE_TYPE_LABELS[message.messageType]} · {formatCompactDateTime(message.createdAt)}
                    </div>
                    <div className={styles.helperNote}>{message.body}</div>
                  </div>
                  <div className={styles.actionRow}>
                    {message.isRead ? (
                      <span className={styles.timelineItem}>Read</span>
                    ) : (
                      <button
                        type="button"
                        className={styles.actionButton}
                        disabled={actionState.pendingKey === `read:${message.id}`}
                        onClick={() => onMarkRead(message.id)}
                      >
                        {actionState.pendingKey === `read:${message.id}`
                          ? 'Saving...'
                          : 'Mark read'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>No messages in the dashboard yet.</div>
            )}
          </div>
          <div className={styles.emailComposer}>
            <div className={styles.walletSettingsTitle}>Backup support request</div>
            <label className={styles.searchField}>
              <span className={styles.searchLabel}>Subject</span>
              <input
                type="text"
                className={`${styles.searchInput} ph-no-capture`}
                value={supportSubject}
                onChange={(event) => onSupportSubjectChange(event.target.value)}
              />
            </label>
            <label className={styles.searchField}>
              <span className={styles.searchLabel}>What do you need help with?</span>
              <textarea
                className={`${styles.emailComposerTextarea} ph-no-capture`}
                value={supportBody}
                onChange={(event) => onSupportBodyChange(event.target.value)}
              />
            </label>
            <div className={styles.actionRow}>
              <button
                type="button"
                className={styles.actionButton}
                disabled={actionState.pendingKey === 'support-request'}
                onClick={onCreateSupportRequest}
              >
                {actionState.pendingKey === 'support-request'
                  ? 'Sending...'
                  : 'Send support request'}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className={styles.cardFill}>
          <div className={styles.loadingLine} />
          <div className={styles.loadingLineShort} />
        </div>
      )}
    </div>
  )
}

function HelpResourcesCard({
  state,
  hasPaidWorkspace,
}: {
  state: ResourcesState
  hasPaidWorkspace: boolean
}) {
  const recommendedSkins = FIRST_START_SKIN_RECOMMENDATIONS.map((recommendation) => {
    const skin = AMETHYST_SKIN_CARDS.find((candidate) => candidate.id === recommendation.id)
    return skin ? { ...recommendation, skin } : null
  }).filter((item): item is NonNullable<typeof item> => item !== null)

  return (
    <div className={styles.workspacePanel}>
      <div className={styles.workspaceSectionHeader}>
        <div>
          <div className={styles.cardTitle}>Help & Resources</div>
          <div className={styles.cardSubtitle}>
            Guided first-start steps first, then the full operating library.
          </div>
        </div>
      </div>
      {
        <>
          <div className={styles.siteSettingsSection}>
            <div className={styles.calendarHeader}>
              <div>
                <div className={styles.walletSettingsTitle}>Choose your look</div>
                <div className={styles.helperNote}>
                  Start with one of these recommended customer-site skins. You can
                  tune the full gallery after checkout.
                </div>
              </div>
              <span className={styles.rosterTag}>Recommended first picks</span>
            </div>
            <div className={styles.skinGallery}>
              {recommendedSkins.map(({ label, reason, skin }) => (
                <div key={skin.id} className={styles.skinCard}>
                  <div className={styles.skinCardHeader}>
                    <span className={styles.rosterTag}>{skin.code}</span>
                    <span className={styles.customerName}>{label}</span>
                  </div>
                  <div className={styles.skinPreview} aria-hidden="true">
                    <span
                      className={styles.skinPreviewHero}
                      style={{ background: skin.swatches[0]?.value }}
                    />
                    <span
                      className={styles.skinPreviewCard}
                      style={{
                        borderColor: skin.swatches[1]?.value,
                        background: skin.swatches[2]?.value,
                      }}
                    />
                  </div>
                  <div className={styles.helperNote}>{reason}</div>
                  <div className={styles.timelineList}>
                    <span className={styles.timelineItem}>
                      {hasPaidWorkspace ? 'Ready to apply' : 'Ready after checkout'}
                    </span>
                    <span className={styles.timelineItem}>{skin.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.siteSettingsSection}>
            <div className={styles.calendarHeader}>
              <div className={styles.walletSettingsTitle}>Full skin gallery</div>
              <span className={styles.rosterTag}>
                Featured {SITE_SKIN_GALLERY_FEATURED_CODES.join(' / ')}
              </span>
            </div>
            <div className={styles.skinGallery}>
              {AMETHYST_SKIN_CARDS.map((skin) => (
                <div key={skin.id} className={styles.skinCard}>
                  <div className={styles.skinCardHeader}>
                    <span className={styles.rosterTag}>{skin.code}</span>
                    <span className={styles.customerName}>{skin.label}</span>
                  </div>
                  <div className={styles.skinPreview} aria-hidden="true">
                    <span
                      className={styles.skinPreviewHero}
                      style={{ background: skin.swatches[0]?.value }}
                    />
                    <span
                      className={styles.skinPreviewCard}
                      style={{
                        borderColor: skin.swatches[1]?.value,
                        background: skin.swatches[2]?.value,
                      }}
                    />
                  </div>
                  <div className={styles.helperNote}>{skin.description}</div>
                  <div className={styles.skinSwatches}>
                    {skin.swatches.map((swatch) => (
                      <span
                        key={`${skin.id}-${swatch.label}`}
                        className={styles.skinSwatch}
                        style={{ background: swatch.value }}
                        title={`${swatch.label}: ${swatch.value}`}
                      />
                    ))}
                  </div>
                  <div className={styles.timelineList}>
                    <span className={styles.timelineItem}>
                      {skin.headingFont} / {skin.bodyFont}
                    </span>
                    <span className={styles.timelineItem}>{skin.surfaceNote}</span>
                    <span className={styles.timelineItem}>{skin.motionNote}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {state.status === 'ready' && state.resources ? (
            <div className={styles.resourceList}>
              {state.resources.map((resource) => (
                <div key={resource.id} className={styles.resourceCard}>
                  <div className={styles.badgeRow}>
                    <span className={styles.rosterTag}>{resource.category}</span>
                  </div>
                  <div className={styles.customerName}>{resource.title}</div>
                  <div className={styles.helperNote}>{resource.summary}</div>
                  <div className={styles.customerDate}>{resource.body}</div>
                  {resource.video ? (
                    <div className={styles.timelineList}>
                      <span className={styles.timelineItem}>
                        Video: {resource.video.title}
                      </span>
                      <span className={styles.timelineItem}>
                        {resource.video.status === 'ready'
                          ? 'Ready to watch'
                          : 'Video slot ready'}
                      </span>
                    </div>
                  ) : null}
                  <div className={styles.actionRow}>
                    {resource.quickActions.map((action) => (
                      <span key={`${resource.id}-${action}`} className={styles.timelineItem}>
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : state.status === 'error' ? (
            <div className={styles.emptyState}>
              Help resources are temporarily unavailable.
            </div>
          ) : (
            <div className={styles.cardFill}>
              <div className={styles.loadingLine} />
              <div className={styles.loadingLineShort} />
            </div>
          )}
        </>
      }
    </div>
  )
}

function SetupChecklistCard({
  hasPaidWorkspace,
  onSelectSection,
}: {
  hasPaidWorkspace: boolean
  onSelectSection: (section: WorkspaceSectionKey) => void
}) {
  const checklist = getSelfServeOnboardingChecklist()

  return (
    <div className={styles.workspacePanel}>
      <div className={styles.workspaceSectionHeader}>
        <div>
          <div className={styles.cardTitle}>Setup Checklist</div>
          <div className={styles.cardSubtitle}>
            First-run setup path for self-serve reps after purchase.
          </div>
        </div>
        <span className={styles.rosterTag}>After checkout</span>
      </div>
      <div className={styles.resourceList}>
        {checklist.map((item, index) => {
          const action = SETUP_ACTION_BY_ID[item.id] ?? {
            label: 'Open setup step',
            target: 'setup-checklist' as WorkspaceSectionKey,
          }
          const statusLabel = hasPaidWorkspace
            ? 'Ready now'
            : index < 3
              ? 'Ready after checkout'
              : 'Locked until checkout'

          return (
            <div key={item.id} className={styles.resourceCard}>
              <div className={styles.badgeRow}>
                <span className={styles.rosterTag}>Step {index + 1}</span>
                <span className={styles.statusBadge}>{statusLabel}</span>
              </div>
              <div className={styles.customerName}>{item.title}</div>
              <div className={styles.helperNote}>{item.description}</div>
              <div className={styles.actionRow}>
                <button
                  type="button"
                  className={styles.helperButton}
                  disabled={!hasPaidWorkspace}
                  onClick={() => onSelectSection(action.target)}
                >
                  {hasPaidWorkspace ? action.label : `${action.label} after checkout`}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SiteAnalyticsCard({ state }: { state: AnalyticsState }) {
  if (state.status === 'error') {
    return (
      <div className={styles.workspacePanel}>
        <div className={styles.emptyState}>
          Site analytics are temporarily unavailable.
        </div>
      </div>
    )
  }

  if (state.status !== 'ready' || !state.analytics) {
    return (
      <div className={styles.workspacePanel}>
        <div className={styles.cardFill}>
          <div className={styles.loadingLine} />
          <div className={styles.loadingLineShort} />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.workspacePanel}>
      <div className={styles.workspaceSectionHeader}>
        <div>
          <div className={styles.cardTitle}>Site analytics</div>
          <div className={styles.cardSubtitle}>
            PostHog-ready traffic slot plus a local operating snapshot.
          </div>
        </div>
        <span className={styles.rosterTag}>
          {state.analytics.configured ? 'PostHog configured' : 'Awaiting PostHog keys'}
        </span>
      </div>
      {!state.analytics.configured ? (
        <div className={styles.helperNote}>
          Traffic charts will light up after PostHog keys are present in the environment. Privacy is already locked to no early identity linking and masked sensitive inputs.
        </div>
      ) : null}
      <div className={styles.metricGrid}>
        <div className={styles.metricBlock}>
          <span className={styles.metricLabel}>Active listings</span>
          <span className={styles.metricValue}>
            {state.analytics.operationalSnapshot.activeListings}
          </span>
        </div>
        <div className={styles.metricBlock}>
          <span className={styles.metricLabel}>Pending requests</span>
          <span className={styles.metricValue}>
            {state.analytics.operationalSnapshot.pendingRequests}
          </span>
        </div>
        <div className={styles.metricBlock}>
          <span className={styles.metricLabel}>Upcoming shows</span>
          <span className={styles.metricValue}>
            {state.analytics.operationalSnapshot.upcomingShows}
          </span>
        </div>
        <div className={styles.metricBlock}>
          <span className={styles.metricLabel}>Reachable customers</span>
          <span className={styles.metricValue}>
            {state.analytics.operationalSnapshot.reachableCustomers}
          </span>
        </div>
      </div>
      <div className={styles.timelineList}>
        <span className={styles.timelineItem}>
          Disable IP capture: {state.analytics.privacy.disablesIpCapture ? 'Yes' : 'No'}
        </span>
        <span className={styles.timelineItem}>
          Mask sensitive inputs: {state.analytics.privacy.masksSensitiveInputs ? 'Yes' : 'No'}
        </span>
        <span className={styles.timelineItem}>
          Identify after login only: {state.analytics.privacy.identifiesAfterLoginOnly ? 'Yes' : 'No'}
        </span>
      </div>
    </div>
  )
}

export function SiteSettingsCard({
  state,
  draft,
  actionState,
  onDraftChange,
  onSocialHandleChange,
  onSave,
  statusMessage,
}: {
  state: SiteSettingsState
  draft?: SiteSettingsDraft | null
  actionState?: SiteSettingsActionState
  onDraftChange?: (patch: Partial<SiteSettingsDraft>) => void
  onSocialHandleChange?: (platform: string, value: string) => void
  onSave?: () => void
  statusMessage?: string | null
}) {
  if (state.status === 'error') {
    return (
      <div className={styles.rosterFallback}>
        Site settings will appear here once your public profile data loads.
      </div>
    )
  }

  if (state.status !== 'ready' || !state.settings || !draft) {
    return (
      <div className={styles.cardFill}>
        <div className={styles.loadingLine} />
        <div className={styles.loadingLineShort} />
      </div>
    )
  }

  const hasUnsavedChanges =
    JSON.stringify(draft) !== JSON.stringify(state.settings)
  const saveStatusText = actionState?.pending
    ? 'Saving...'
    : hasUnsavedChanges
      ? 'Unsaved changes'
      : 'No unsaved changes'

  return (
    <div className={styles.siteSettingsCard}>
      <div className={styles.calendarHeader}>
        <div className={styles.walletSettingsTitle}>Profile basics</div>
        <span className={styles.rosterTag}>
          Update what shoppers and recruits see across your public pages.
        </span>
      </div>
      <div className={styles.siteSettingsGrid}>
        <label className={styles.searchField}>
          <span className={styles.searchLabel}>Display name</span>
          <input
            className={styles.searchInput}
            value={draft.displayName}
            onChange={(event) =>
              onDraftChange?.({ displayName: event.target.value })
            }
          />
        </label>
        <label className={styles.searchField}>
          <span className={styles.searchLabel}>Business name</span>
          <input
            className={styles.searchInput}
            value={draft.businessName}
            onChange={(event) =>
              onDraftChange?.({ businessName: event.target.value })
            }
          />
        </label>
        <label className={styles.searchField}>
          <span className={styles.searchLabel}>Email</span>
          <input
            className={styles.searchInput}
            value={draft.email}
            onChange={(event) => onDraftChange?.({ email: event.target.value })}
          />
        </label>
        <label className={styles.searchField}>
          <span className={styles.searchLabel}>Phone</span>
          <input
            className={styles.searchInput}
            value={draft.phone}
            onChange={(event) => onDraftChange?.({ phone: event.target.value })}
          />
        </label>
      </div>

      <div className={styles.siteSettingsSection}>
        <div className={styles.walletSettingsTitle}>Banner and ticker</div>
        <div className={styles.siteSettingsGrid}>
          <label className={styles.searchField}>
            <span className={styles.searchLabel}>Banner text</span>
            <textarea
              className={styles.siteSettingsTextarea}
              value={draft.bannerText}
              onChange={(event) =>
                onDraftChange?.({ bannerText: event.target.value })
              }
            />
          </label>
          <label className={styles.searchField}>
            <span className={styles.searchLabel}>Ticker text</span>
            <textarea
              className={styles.siteSettingsTextarea}
              value={draft.tickerText}
              onChange={(event) =>
                onDraftChange?.({ tickerText: event.target.value })
              }
            />
          </label>
        </div>
        <div className={styles.siteSettingsToggleGrid}>
          <label className={styles.walletToggleRow}>
            <span className={styles.searchLabel}>Banner visible</span>
            <input
              type="checkbox"
              checked={draft.bannerVisible}
              onChange={(event) =>
                onDraftChange?.({ bannerVisible: event.target.checked })
              }
            />
          </label>
          <label className={styles.walletToggleRow}>
            <span className={styles.searchLabel}>Ticker visible</span>
            <input
              type="checkbox"
              checked={draft.tickerVisible}
              onChange={(event) =>
                onDraftChange?.({ tickerVisible: event.target.checked })
              }
            />
          </label>
          <label className={styles.walletToggleRow}>
            <span className={styles.searchLabel}>Join page visible</span>
            <input
              type="checkbox"
              checked={draft.showJoinPage}
              onChange={(event) =>
                onDraftChange?.({ showJoinPage: event.target.checked })
              }
            />
          </label>
        </div>
      </div>

      <div className={styles.siteSettingsSection}>
        <div className={styles.walletSettingsTitle}>Branding and visuals</div>
        <div className={styles.siteSettingsGrid}>
          <label className={styles.sortField}>
            <span className={styles.sortLabel}>Site template</span>
            <select
              className={styles.sortSelect}
              value={draft.customerSiteTemplate}
              onChange={() =>
                onDraftChange?.({ customerSiteTemplate: 'amethyst' })
              }
            >
              <option value="amethyst">Amethyst</option>
            </select>
          </label>
          <label className={styles.sortField}>
            <span className={styles.sortLabel}>Site appearance</span>
            <select
              className={styles.sortSelect}
              value={draft.appearancePreset}
              onChange={(event) =>
                onDraftChange?.({
                  appearancePreset: event.target.value as SiteAppearancePreset,
                })
              }
            >
              {SITE_APPEARANCE_PRESET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className={styles.siteSettingsPreviewNote}>
              Your workspace preview updates right away. Tap Save site settings to
              update your customer site.
            </span>
          </label>
          <label className={styles.searchField}>
            <span className={styles.searchLabel}>Team name</span>
            <input
              className={styles.searchInput}
              value={draft.teamName}
              onChange={(event) =>
                onDraftChange?.({ teamName: event.target.value })
              }
            />
          </label>
          <label className={styles.searchField}>
            <span className={styles.searchLabel}>Tagline</span>
            <input
              className={styles.searchInput}
              value={draft.tagline}
              onChange={(event) =>
                onDraftChange?.({ tagline: event.target.value })
              }
            />
          </label>
          <label className={styles.searchField}>
            <span className={styles.searchLabel}>Hero image URL</span>
            <input
              className={styles.searchInput}
              value={draft.heroImageUrl}
              onChange={(event) =>
                onDraftChange?.({ heroImageUrl: event.target.value })
              }
            />
          </label>
          <label className={styles.sortField}>
            <span className={styles.sortLabel}>Hero animation</span>
            <select
              className={styles.sortSelect}
              value={draft.heroAnimationType}
              onChange={(event) =>
                onDraftChange?.({
                  heroAnimationType: event.target.value as 'zoom' | 'pan',
                })
              }
            >
              <option value="zoom">zoom</option>
              <option value="pan">pan</option>
            </select>
          </label>
        </div>
      </div>

      <div className={styles.siteSettingsSection}>
        <div className={styles.walletSettingsTitle}>Social handles</div>
        <div className={styles.siteSettingsGrid}>
          {SOCIAL_HANDLE_FIELDS.map((field) => (
            <label key={field.key} className={styles.searchField}>
              <span className={styles.searchLabel}>{field.label}</span>
              <input
                className={styles.searchInput}
                value={draft.socialHandles[field.key] ?? ''}
                onChange={(event) =>
                  onSocialHandleChange?.(field.key, event.target.value)
                }
              />
            </label>
          ))}
        </div>
      </div>

      {actionState?.error ? (
        <div className={styles.actionError}>{actionState.error}</div>
      ) : null}
      {statusMessage ? (
        <div className={styles.helperMessage}>{statusMessage}</div>
      ) : null}

      <div className={styles.siteSettingsSaveBar}>
        <span className={styles.siteSettingsSaveStatus}>{saveStatusText}</span>
        <button
          type="button"
          className={`${styles.actionButton} ${styles.siteSettingsSaveButton}`}
          onClick={() => onSave?.()}
          disabled={actionState?.pending || !hasUnsavedChanges}
        >
          {actionState?.pending ? 'Saving…' : 'Save site settings'}
        </button>
      </div>
    </div>
  )
}

const DEFAULT_BUSINESS_CALCULATOR_INPUT: BusinessCalculatorInput = {
  averageShowSales: 1200,
  commissionRate: 25,
  showsPerMonth: 8,
  perShowExpenses: 30,
  monthlyExpenses: 150,
  monthlyProfitGoal: 2500,
}

const DEFAULT_SINGLE_SHOW_CALCULATOR_INPUT: SingleShowCalculatorInput = {
  showSales: 1200,
  commissionRate: 25,
  showExpenses: 30,
}

const BUSINESS_CALCULATOR_FIELDS: Array<{
  key: keyof BusinessCalculatorInput
  label: string
  prefix?: string
  suffix?: string
  min?: number
  step?: number
}> = [
  { key: 'averageShowSales', label: 'Average show sales', prefix: '$', min: 0, step: 25 },
  { key: 'commissionRate', label: 'Commission rate', suffix: '%', min: 0, step: 1 },
  { key: 'showsPerMonth', label: 'Shows per month', min: 0, step: 1 },
  { key: 'perShowExpenses', label: 'Per-show expenses', prefix: '$', min: 0, step: 5 },
  { key: 'monthlyExpenses', label: 'Monthly expenses', prefix: '$', min: 0, step: 10 },
  { key: 'monthlyProfitGoal', label: 'Monthly take-home goal', prefix: '$', min: 0, step: 50 },
]

const SINGLE_SHOW_CALCULATOR_FIELDS: Array<{
  key: keyof SingleShowCalculatorInput
  label: string
  prefix?: string
  suffix?: string
  min?: number
  step?: number
}> = [
  { key: 'showSales', label: 'Show sales', prefix: '$', min: 0, step: 25 },
  { key: 'commissionRate', label: 'Commission rate', suffix: '%', min: 0, step: 1 },
  { key: 'showExpenses', label: 'Show expenses', prefix: '$', min: 0, step: 5 },
]

type BusinessCalculatorTab = 'monthly' | 'single-show'

export function BusinessCalculatorCard() {
  const [input, setInput] = useState<BusinessCalculatorInput>(
    DEFAULT_BUSINESS_CALCULATOR_INPUT,
  )
  const [singleShowInput, setSingleShowInput] =
    useState<SingleShowCalculatorInput>(DEFAULT_SINGLE_SHOW_CALCULATOR_INPUT)
  const [activeTab, setActiveTab] = useState<BusinessCalculatorTab>('monthly')
  const result = calculateBusinessCalculator(input)
  const singleShowResult = calculateSingleShowCalculator(singleShowInput)

  function updateInput(key: keyof BusinessCalculatorInput, value: string) {
    const next = Number.parseFloat(value)
    setInput((current) => ({
      ...current,
      [key]: Number.isFinite(next) ? next : 0,
    }))
  }

  function updateSingleShowInput(
    key: keyof SingleShowCalculatorInput,
    value: string,
  ) {
    const next = Number.parseFloat(value)
    setSingleShowInput((current) => ({
      ...current,
      [key]: Number.isFinite(next) ? next : 0,
    }))
  }

  return (
    <div className={styles.workspaceSectionStack}>
      <div className={styles.workspaceIntroCard}>
        <div className={styles.workspaceSectionHeader}>
          <div>
            <div className={styles.cardTitle}>Business Calculator</div>
            <div className={styles.cardSubtitle}>
              Estimate show take-home, monthly take-home, and the sales pace needed
              to hit a goal.
            </div>
          </div>
          <span className={styles.rosterTag}>Manual estimate</span>
        </div>
      </div>

      <div className={styles.calculatorTabs} role="tablist" aria-label="Calculator mode">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'monthly'}
          className={`${styles.calculatorTabButton} ${
            activeTab === 'monthly' ? styles.calculatorTabButtonActive : ''
          }`}
          onClick={() => setActiveTab('monthly')}
        >
          Monthly Planner
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'single-show'}
          className={`${styles.calculatorTabButton} ${
            activeTab === 'single-show' ? styles.calculatorTabButtonActive : ''
          }`}
          onClick={() => setActiveTab('single-show')}
        >
          Single Show
        </button>
      </div>

      {activeTab === 'monthly' ? (
      <div className={styles.calculatorLayout}>
        <div className={styles.workspacePanel}>
          <div className={styles.walletSettingsTitle}>Your numbers</div>
          <div className={styles.calculatorInputGrid}>
            {BUSINESS_CALCULATOR_FIELDS.map((field) => (
              <label key={field.key} className={styles.calculatorField}>
                <span className={styles.searchLabel}>{field.label}</span>
                <span className={styles.calculatorInputShell}>
                  {field.prefix ? (
                    <span className={styles.calculatorAdornment}>{field.prefix}</span>
                  ) : null}
                  <input
                    type="number"
                    aria-label={field.label}
                    min={field.min}
                    step={field.step}
                    className={`${styles.calculatorInput} ph-no-capture`}
                    value={input[field.key]}
                    onChange={(event) => updateInput(field.key, event.target.value)}
                  />
                  {field.suffix ? (
                    <span className={styles.calculatorAdornment}>{field.suffix}</span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.workspacePanel}>
          <div className={styles.walletSettingsTitle}>Estimate</div>
          <div className={styles.calculatorResultList}>
            <CalculatorResultRow
              label="Estimated take-home per show"
              value={formatCalculatorMoney(
                result.takeHomePerShowBeforeMonthlyExpenses,
              )}
            />
            <CalculatorResultRow
              label="Estimated monthly take-home"
              value={formatCalculatorMoney(result.estimatedMonthlyTakeHome)}
              strong
            />
            <CalculatorResultRow
              label="Monthly gross volume"
              value={formatCalculatorMoney(result.grossSalesPerMonth)}
            />
            <CalculatorResultRow
              label="Estimated margin"
              value={`${result.estimatedMarginPercent.toFixed(2)}%`}
            />
            <CalculatorResultRow
              label="Sales needed per show"
              value={formatCalculatorMoney(result.salesNeededPerShowForGoal)}
            />
            <CalculatorResultRow
              label="Sales needed per month"
              value={formatCalculatorMoney(result.salesNeededPerMonthForGoal)}
            />
          </div>
          <div className={styles.helperNote}>
            Estimates use the numbers entered here only. Actual payouts, inventory,
            taxes, fees, and policies can vary.
          </div>
        </div>
      </div>
      ) : (
        <div className={styles.calculatorLayout}>
          <div className={styles.workspacePanel}>
            <div className={styles.walletSettingsTitle}>Show numbers</div>
            <div className={styles.calculatorInputGrid}>
              {SINGLE_SHOW_CALCULATOR_FIELDS.map((field) => (
                <label key={field.key} className={styles.calculatorField}>
                  <span className={styles.searchLabel}>{field.label}</span>
                  <span className={styles.calculatorInputShell}>
                    {field.prefix ? (
                      <span className={styles.calculatorAdornment}>{field.prefix}</span>
                    ) : null}
                    <input
                      type="number"
                      aria-label={field.label}
                      min={field.min}
                      step={field.step}
                      className={`${styles.calculatorInput} ph-no-capture`}
                      value={singleShowInput[field.key]}
                      onChange={(event) =>
                        updateSingleShowInput(field.key, event.target.value)
                      }
                    />
                    {field.suffix ? (
                      <span className={styles.calculatorAdornment}>{field.suffix}</span>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.workspacePanel}>
            <div className={styles.walletSettingsTitle}>Single show estimate</div>
            <div className={styles.calculatorResultList}>
              <CalculatorResultRow
                label="Estimated show take-home"
                value={formatCalculatorMoney(singleShowResult.estimatedShowTakeHome)}
                strong
              />
              <CalculatorResultRow
                label="Gross commission"
                value={formatCalculatorMoney(singleShowResult.grossCommission)}
              />
              <CalculatorResultRow
                label="Expense impact"
                value={`${singleShowResult.expenseImpactPercent.toFixed(2)}%`}
              />
              <CalculatorResultRow
                label="Effective margin"
                value={`${singleShowResult.estimatedMarginPercent.toFixed(2)}%`}
              />
            </div>
            <div className={styles.helperNote}>
              Use this after a specific show to sanity-check what the show likely
              produced before broader monthly expenses.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function TeamManagementCard() {
  return (
    <div className={styles.workspacePanel}>
      <div className={styles.workspaceSectionHeader}>
        <div>
          <div className={styles.cardTitle}>Team Management</div>
          <div className={styles.cardSubtitle}>
            Upgrade to manage team members, onboarding site messages, and replies
            from this workspace.
          </div>
        </div>
        <span className={styles.rosterTag}>Paid add-on locked</span>
      </div>

      <div className={styles.teamUpgradeNotice}>
        <span>Upgrade to manage your team on this platform.</span>
        <a className={styles.helperLink} href="/prelaunch">
          View upgrade options
        </a>
      </div>

      <div className={styles.teamManagementGrid}>
        <section className={styles.teamManagementPanel}>
          <div className={styles.walletSettingsTitle}>Team member intake</div>
          <div className={styles.teamInputGrid}>
            {[
              'Name',
              'Phone number',
              'Email',
              'Team name',
              'Social link 1',
              'Social link 2',
              'Social link 3',
            ].map((label) => (
              <label key={label} className={styles.searchField}>
                <span className={styles.searchLabel}>{label}</span>
                <input
                  className={`${styles.searchInput} ph-no-capture`}
                  placeholder={label}
                  disabled
                />
              </label>
            ))}
          </div>
          <button type="button" className={styles.actionButton} disabled>
            Save team member (locked)
          </button>
        </section>

        <section className={styles.teamManagementPanel}>
          <div className={styles.walletSettingsTitle}>Team directory</div>
          <div className={styles.emptyState}>
            Team members will appear here after the add-on is unlocked.
          </div>
        </section>

        <section className={styles.teamManagementPanel}>
          <div className={styles.workspaceSectionHeader}>
            <div className={styles.walletSettingsTitle}>
              Onboarding website messages
            </div>
            <span className={styles.rosterTag}>Not wired yet</span>
          </div>
          <div className={styles.teamMessagePreview}>
            New-rep questions from onboarding websites will land here when this
            add-on is connected.
          </div>
          <label className={styles.searchField}>
            <span className={styles.searchLabel}>Reply composer</span>
            <textarea
              className={`${styles.siteSettingsTextarea} ph-no-capture`}
              placeholder="Write a reply after the add-on is unlocked"
              disabled
            />
          </label>
          <button type="button" className={styles.actionButton} disabled>
            Send reply (locked)
          </button>
        </section>
      </div>
    </div>
  )
}

function CalculatorResultRow({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div
      className={`${styles.calculatorResultRow} ${
        strong ? styles.calculatorResultRowStrong : ''
      }`}
    >
      <span className={styles.calculatorResultLabel}>{label}</span>
      <span className={styles.calculatorResultValue}>{value}</span>
    </div>
  )
}

function formatCalculatorMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)
}

function isSparkleSuiteTestBuyerPreview() {
  const mode = process.env.NEXT_PUBLIC_SPARKLE_STRIPE_TEST_BUYER_MODE
  return mode === 'true' || mode === '1'
}

function getSparkleSuiteCheckoutReview(
  checkoutMode?: AccountBillingDashboardResult['checkoutMode'],
) {
  const { pricing } = sparkleSuitePublicLandingContent
  const testBuyerPreview =
    checkoutMode === 'test_buyer' ||
    (checkoutMode === undefined && isSparkleSuiteTestBuyerPreview())

  return {
    dueToday: testBuyerPreview
      ? '50 cents in Stripe test mode. No real money moves.'
      : `${pricing.buildFee.price} build fee + ${pricing.standard.price} first month before taxes or Stripe-calculated extras.`,
    dueTodayNote: testBuyerPreview
      ? 'Use this local-only path to feel the buyer flow before real checkout is turned on.'
      : 'Stripe itemizes the build fee and monthly subscription before you pay.',
    renewal: testBuyerPreview
      ? '50 cents per month in Stripe test mode until cancelled.'
      : `${pricing.standard.price} after the first checkout until cancelled.`,
    cancellation: 'Cancel anytime from billing. Access continues through the paid billing period.',
    included: [
      'Customer-facing site',
      'Trade board / dance floor',
      'LiveQ',
      ...pricing.included.slice(3),
    ],
  }
}

export function AccountBillingCard({
  state,
  actionState,
  onStartSubscription,
  onManageBilling,
  statusMessage,
  agreementAccepted = false,
  onAgreementAcceptedChange,
}: {
  state: AccountBillingState
  actionState?: AccountBillingActionState
  onStartSubscription?: () => void
  onManageBilling?: () => void
  statusMessage?: string | null
  agreementAccepted?: boolean
  onAgreementAcceptedChange?: (accepted: boolean) => void
}) {
  if (state.status === 'error') {
    return (
      <div className={styles.walletFallback}>
        Account and billing details will show here once Stripe data loads.
      </div>
    )
  }

  if (state.status !== 'ready' || !state.summary) {
    return (
      <div className={styles.cardFill}>
        <div className={styles.loadingLine} />
        <div className={styles.loadingLineShort} />
      </div>
    )
  }

  const { summary } = state
  const subscriptionStatus = summary.subscription
    ? summary.subscription.status.replace('_', ' ')
    : 'No active subscription'
  const subscriptionTitle = summary.subscription
    ? subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)
    : 'Not active yet'
  const nextBillingDate = formatAccountBillingDate(
    summary.subscription?.currentPeriodEnd ?? null,
  )
  const subscriptionDetail = summary.subscription
    ? summary.subscription.cancelAtPeriodEnd
      ? `Scheduled to end ${formatAccountBillingDate(summary.subscription.currentPeriodEnd)}`
      : `Renews through ${formatAccountBillingDate(summary.subscription.currentPeriodEnd)}`
    : 'Monthly billing is available when you are ready.'
  const paymentMethodLabel = summary.paymentMethod
    ? `${summary.paymentMethod.brand} ending in ${summary.paymentMethod.last4}`
    : 'No card on file yet.'
  const checkoutReview = getSparkleSuiteCheckoutReview(summary.checkoutMode)

  return (
    <div className={styles.accountBillingCard}>
      <div className={styles.accountBillingHeader}>
        <div>
          <div className={styles.walletSettingsTitle}>Billing</div>
          <div className={styles.accountMuted}>
            Build fee + monthly plan - cancel anytime
          </div>
        </div>
        <span className={styles.accountStatusBadge}>{subscriptionTitle}</span>
      </div>

      {!summary.canStartSubscription ? (
        <>
      <div className={styles.accountDetailList}>
        <div className={styles.accountDetailRow}>
          <div className={styles.walletTransactionCopy}>
            <span className={styles.walletTransactionTitle}>Subscription</span>
            <span className={styles.walletTransactionDate}>{subscriptionDetail}</span>
          </div>
          <span className={styles.accountDetailValue}>{nextBillingDate}</span>
        </div>
        <div className={styles.accountDetailRow}>
          <div className={styles.walletTransactionCopy}>
            <span className={styles.walletTransactionTitle}>Payment method</span>
            <span className={styles.walletTransactionDate}>
              {summary.paymentMethod
                ? `Expires ${String(summary.paymentMethod.expMonth).padStart(2, '0')}/${summary.paymentMethod.expYear}`
                : 'Add or update your card in Stripe.'}
            </span>
          </div>
          <span className={styles.accountDetailValue}>{paymentMethodLabel}</span>
        </div>
      </div>

      <div className={styles.siteSettingsSection}>
        <div className={styles.walletSettingsTitle}>Billing history</div>
        <div className={styles.walletTransactionList}>
          {summary.invoices.length === 0 ? (
            <div className={styles.emptyState}>
              Billing history will appear after your first Stripe invoice.
            </div>
          ) : (
            summary.invoices.map((invoice) => (
              <div key={invoice.id} className={styles.walletTransactionRow}>
                <div className={styles.walletTransactionCopy}>
                  <span className={styles.walletTransactionTitle}>
                    {formatAccountBillingAmount(invoice.amountPaidCents)}
                  </span>
                  <span className={styles.walletTransactionDate}>
                    {formatAccountBillingDate(invoice.createdAt)} ·{' '}
                    {invoice.status ?? 'unknown'}
                  </span>
                </div>
                {invoice.hostedInvoiceUrl ? (
                  <a
                    className={styles.helperLink}
                    href={invoice.hostedInvoiceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View invoice
                  </a>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
        </>
      ) : null}

      {actionState?.error ? (
        <div className={styles.actionError}>{actionState.error}</div>
      ) : null}
      {statusMessage ? (
        <div className={styles.helperMessage}>{statusMessage}</div>
      ) : null}

      {summary.canStartSubscription ? (
        <div className={styles.termsAcceptance}>
          <section
            className={styles.checkoutReview}
            aria-label="Sparkle Suite checkout review"
          >
            <div className={styles.checkoutReviewHeader}>
              <span className={styles.checkoutReviewKicker}>Before checkout</span>
              <h3 className={styles.checkoutReviewTitle}>
                Review your Sparkle Suite plan
              </h3>
              <p className={styles.checkoutReviewCopy}>
                Stripe shows the final checkout details before you pay. Checkout
                alone does not send customer texts, emails, calendar changes, or
                provider messages.
              </p>
            </div>

            <div className={styles.checkoutReviewList}>
              <div className={styles.checkoutReviewItem}>
                <span className={styles.checkoutReviewLabel}>Due today</span>
                <span className={styles.checkoutReviewValue}>
                  {checkoutReview.dueToday}
                </span>
                <span className={styles.checkoutReviewNote}>
                  {checkoutReview.dueTodayNote}
                </span>
              </div>
              <div className={styles.checkoutReviewItem}>
                <span className={styles.checkoutReviewLabel}>Renews</span>
                <span className={styles.checkoutReviewValue}>
                  {checkoutReview.renewal}
                </span>
              </div>
              <div className={styles.checkoutReviewItem}>
                <span className={styles.checkoutReviewLabel}>Cancel policy</span>
                <span className={styles.checkoutReviewValue}>
                  {checkoutReview.cancellation}
                </span>
              </div>
            </div>

            <div className={styles.checkoutUnlocks}>
              <span className={styles.checkoutReviewLabel}>
                After checkout unlocks
              </span>
              <ul className={styles.checkoutUnlockList}>
                {checkoutReview.included.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <div className={styles.termsReadRow}>
            <span>Read the Sparkle Suite terms before checkout.</span>
            <a
              className={styles.termsLink}
              href="/terms-and-conditions?returnTo=%2Fnic-nac%3Fsection%3Daccount%26onboarding%3Dself-serve-started"
            >
              Read Terms and Conditions
            </a>
          </div>
          <label className={styles.siteSettingsToggle}>
            <input
              type="checkbox"
              checked={agreementAccepted}
              onChange={(event) =>
                onAgreementAcceptedChange?.(event.currentTarget.checked)
              }
            />
            <span>
              I understand today&apos;s charge, the monthly renewal, and the
              cancel policy, and I accept the Sparkle Suite terms.
            </span>
          </label>
        </div>
      ) : null}

      <div className={styles.actionRow}>
        {summary.canStartSubscription ? (
          <button
            type="button"
            className={styles.actionButton}
            onClick={() => onStartSubscription?.()}
            disabled={actionState?.pendingAction !== null || !agreementAccepted}
          >
            {actionState?.pendingAction === 'subscribe'
              ? 'Opening checkout...'
              : 'Continue to secure Stripe checkout'}
          </button>
        ) : null}
        {summary.canManageBilling && !summary.canStartSubscription ? (
          <button
            type="button"
            className={styles.actionButton}
            onClick={() => onManageBilling?.()}
            disabled={actionState?.pendingAction !== null}
          >
            {actionState?.pendingAction === 'manage'
              ? 'Opening portal...'
              : 'Manage billing and cancel'}
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function ShowCalendarCard({
  state,
  referenceDate,
}: {
  state: CalendarState
  referenceDate?: Date
}) {
  if (state.status === 'error') {
    return (
      <div className={styles.calendarFallback}>
        Show calendar will appear here once calendar data loads.
      </div>
    )
  }

  if (state.status !== 'ready' || !state.summary) {
    return (
      <div className={styles.cardFill}>
        <div className={styles.loadingLine} />
        <div className={styles.loadingLineShort} />
      </div>
    )
  }

  const metrics = getShowCalendarMetrics(
    state.summary.upcomingEvents,
    state.summary.recentEvents,
    referenceDate,
  )
  const calendarCells = buildShowCalendarCells(
    state.summary.upcomingEvents,
    referenceDate,
  )

  return (
    <div className={styles.calendarCard}>
      <div className={styles.metricGrid}>
        <div className={styles.metricBlock}>
          <span className={styles.metricLabel}>Upcoming</span>
          <span className={styles.metricValue}>{metrics.upcomingCount}</span>
        </div>
        <div className={styles.metricBlock}>
          <span className={styles.metricLabel}>This month</span>
          <span className={styles.metricValue}>{metrics.thisMonthCount}</span>
        </div>
        <div className={styles.metricBlock}>
          <span className={styles.metricLabel}>Recurring</span>
          <span className={styles.metricValue}>{metrics.recurringCount}</span>
        </div>
        <div className={styles.metricBlock}>
          <span className={styles.metricLabel}>Recently wrapped</span>
          <span className={styles.metricValue}>{metrics.recentCount}</span>
        </div>
      </div>
      <div className={styles.calendarHeader}>
        <div className={styles.walletSettingsTitle}>{metrics.monthLabel}</div>
        <span className={styles.rosterTag}>
          Read-only here. Ask Nic-Nac to add or edit shows.
        </span>
      </div>
      <div className={styles.calendarWeekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className={styles.calendarWeekday}>
            {label}
          </span>
        ))}
      </div>
      <div className={styles.calendarGrid}>
        {calendarCells.map((cell) => (
          <div
            key={cell.isoDate}
            className={`${styles.calendarCell} ${
              cell.isCurrentMonth ? '' : styles.calendarCellMuted
            } ${cell.events.length > 0 ? styles.calendarCellActive : ''} ${
              cell.isToday ? styles.calendarCellToday : ''
            }`}
          >
            <span className={styles.calendarCellDay}>{cell.dayNumber}</span>
            <div className={styles.calendarCellEvents}>
              {cell.events.slice(0, 2).map((event) => (
                <span key={event.id} className={styles.calendarEventPill}>
                  {getCalendarEventTitle(event)}
                </span>
              ))}
              {cell.events.length > 2 ? (
                <span className={styles.calendarEventMore}>
                  +{cell.events.length - 2} more
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      <div className={styles.calendarPanels}>
        <div className={styles.calendarPanel}>
          <div className={styles.walletSettingsTitle}>Next up</div>
          <div className={styles.walletTransactionList}>
            {state.summary.upcomingEvents.length === 0 ? (
              <div className={styles.emptyState}>No upcoming shows on the calendar yet.</div>
            ) : (
              state.summary.upcomingEvents.slice(0, 4).map((event) => (
                <div key={event.id} className={styles.walletTransactionRow}>
                  <div className={styles.walletTransactionCopy}>
                    <span className={styles.walletTransactionTitle}>
                      {getCalendarEventTitle(event)}
                    </span>
                    <span className={styles.walletTransactionDate}>
                      {formatCalendarEventDate(event.eventTime)} at{' '}
                      {formatCalendarEventTime(event.eventTime)} on {event.platform}
                    </span>
                  </div>
                  {event.isRecurring ? (
                    <span className={styles.timelineItem}>Recurring</span>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
        <div className={styles.calendarPanel}>
          <div className={styles.walletSettingsTitle}>Recently wrapped</div>
          <div className={styles.walletTransactionList}>
            {state.summary.recentEvents.length === 0 ? (
              <div className={styles.emptyState}>No completed or cancelled shows yet.</div>
            ) : (
              state.summary.recentEvents.map((event) => (
                <div key={event.id} className={styles.walletTransactionRow}>
                  <div className={styles.walletTransactionCopy}>
                    <span className={styles.walletTransactionTitle}>
                      {getCalendarEventTitle(event)}
                    </span>
                    <span className={styles.walletTransactionDate}>
                      {formatCalendarEventDate(event.eventTime)} on {event.platform}
                    </span>
                  </div>
                  <span className={styles.timelineItem}>
                    {event.status === 'completed' ? 'Completed' : 'Cancelled'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function WalletSummaryCard({
  state,
  actionState,
  autoRechargeDraft,
  onAutoRechargeDraftChange,
  onSaveAutoRechargeSettings,
  onLoadWallet,
  statusMessage,
}: {
  state: WalletState
  actionState?: WalletActionState
  autoRechargeDraft?: WalletAutoRechargeDraft | null
  onAutoRechargeDraftChange?: (
    patch: Partial<WalletAutoRechargeDraft>,
  ) => void
  onSaveAutoRechargeSettings?: () => void
  onLoadWallet?: (amountCents: number) => void
  statusMessage?: string | null
}) {
  if (state.status === 'error') {
    return (
      <div className={styles.walletFallback}>
        Wallet details will show here once billing data loads.
      </div>
    )
  }

  if (state.status !== 'ready' || !state.summary) {
    return (
      <div className={styles.cardFill}>
        <div className={styles.loadingLine} />
        <div className={styles.loadingLineShort} />
      </div>
    )
  }

  const summary = {
    ...state.summary,
    estimatedTextsRemaining: getEstimatedTextsRemaining(state.summary.balanceMils),
  }
  const loadOptions = getWalletLoadOptions(summary)
  const thresholdOptions = getAutoRechargeThresholdOptions(summary)
  const amountOptions = getAutoRechargeAmountOptions(
    summary,
    autoRechargeDraft?.thresholdCents ?? getAutoRechargeDraft(summary).thresholdCents,
  )
  const reloadHistory = getWalletReloadHistory(summary.recentTransactions)

  return (
    <div className={styles.walletCard}>
      <div className={styles.metricGrid}>
        <div className={styles.metricBlock}>
          <span className={styles.metricLabel}>Current balance</span>
          <span className={styles.metricValue}>
            {formatWalletAmount(summary.balanceMils)}
          </span>
        </div>
        <div className={styles.metricBlock}>
          <span className={styles.metricLabel}>Texts left</span>
          <span className={styles.metricValue}>
            {summary.estimatedTextsRemaining}
          </span>
        </div>
        <div className={styles.metricBlock}>
          <span className={styles.metricLabel}>Threshold</span>
          <span className={styles.metricValue}>
            {formatWalletAmount(summary.autoRechargeThresholdMils)}
          </span>
        </div>
        <div className={styles.metricBlock}>
          <span className={styles.metricLabel}>Reload</span>
          <span className={styles.metricValue}>
            {formatWalletAmount(summary.autoRechargeAmountMils)}
          </span>
        </div>
        <div className={styles.metricBlock}>
          <span className={styles.metricLabel}>Tracked texts this month</span>
          <span className={styles.metricValue}>
            {summary.messagesSentThisMonth}
          </span>
        </div>
        <div className={styles.metricBlock}>
          <span className={styles.metricLabel}>SMS spend</span>
          <span className={styles.metricValue}>
            {formatWalletAmount(summary.messagesSpendThisMonthMils)}
          </span>
        </div>
      </div>
      <div className={styles.walletMetaRow}>
        <span className={styles.rosterTag}>
          {summary.autoRechargeEnabled ? 'Auto-recharge on' : 'Auto-recharge off'}
        </span>
        <span className={styles.rosterTag}>
          Threshold {formatWalletAmount(summary.autoRechargeThresholdMils)}
        </span>
        <span className={styles.rosterTag}>
          Reload {formatWalletAmount(summary.autoRechargeAmountMils)}
        </span>
        <span className={styles.rosterTag}>
          Min load {formatWalletAmount(summary.minimumLoadAmountMils)}
        </span>
        {summary.autoRechargePending ? (
          <span className={styles.walletPendingTag}>Recharge pending</span>
        ) : null}
      </div>
      <div className={styles.walletTimeline}>
        <span className={styles.walletTimelineLabel}>
          Last load {formatWalletDate(summary.lastLoadedAt)}
        </span>
      </div>
      {autoRechargeDraft ? (
        <div className={styles.walletSettingsPanel}>
          <div className={styles.walletSettingsTitle}>Auto-recharge settings</div>
          <label className={styles.walletToggleRow}>
            <span className={styles.searchLabel}>Enable auto-recharge</span>
            <input
              type="checkbox"
              checked={autoRechargeDraft.enabled}
              onChange={(event) =>
                onAutoRechargeDraftChange?.({ enabled: event.target.checked })
              }
            />
          </label>
          <div className={styles.walletSettingsGrid}>
            <label className={styles.sortField}>
              <span className={styles.sortLabel}>Threshold trigger</span>
              <select
                value={autoRechargeDraft.thresholdCents}
                className={styles.sortSelect}
                onChange={(event) =>
                  onAutoRechargeDraftChange?.({
                    thresholdCents: Number.parseInt(event.target.value, 10),
                  })
                }
              >
                {thresholdOptions.map((option) => (
                  <option key={option.amountCents} value={option.amountCents}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.sortField}>
          <span className={styles.sortLabel}>Reload amount</span>
              <select
                value={autoRechargeDraft.amountCents}
                className={styles.sortSelect}
                onChange={(event) =>
                  onAutoRechargeDraftChange?.({
                    amountCents: Number.parseInt(event.target.value, 10),
                  })
                }
              >
                {amountOptions.map((option) => (
                  <option key={option.amountCents} value={option.amountCents}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className={styles.bulkActions}>
            <button
              type="button"
              className={styles.bulkActionButton}
              disabled={actionState?.pendingSettings || !onSaveAutoRechargeSettings}
              onClick={() => onSaveAutoRechargeSettings?.()}
            >
              {actionState?.pendingSettings ? 'Saving...' : 'Save settings'}
            </button>
          </div>
        </div>
      ) : null}
      <div className={styles.walletReferencePanel}>
        <div className={styles.walletSettingsTitle}>Billing reference</div>
        <div className={styles.walletReferenceList}>
          <span className={styles.timelineItem}>
            Approved SMS sends cost {formatWalletAmount(SMS_CHARGE_MILS)}
          </span>
          <span className={styles.timelineItem}>
            Minimum wallet load is {formatWalletAmount(summary.minimumLoadAmountMils)}
          </span>
          <span className={styles.timelineItem}>
            This month: {summary.messagesSentThisMonth} texts for{' '}
            {formatWalletAmount(summary.messagesSpendThisMonthMils)}
          </span>
        </div>
      </div>
      {actionState?.error ? (
        <div className={styles.actionError}>{actionState.error}</div>
      ) : null}
      {statusMessage ? (
        <div className={styles.helperMessage}>{statusMessage}</div>
      ) : null}
      <div className={styles.bulkActions}>
        {loadOptions.map((option) => (
          <button
            key={option.amountCents}
            type="button"
            className={styles.bulkActionButton}
            disabled={
              !onLoadWallet || actionState?.pendingAmountCents === option.amountCents
            }
            onClick={() => onLoadWallet?.(option.amountCents)}
          >
            {actionState?.pendingAmountCents === option.amountCents
              ? 'Opening...'
              : option.label}
          </button>
        ))}
      </div>
      <div className={styles.walletSettingsTitle}>Reload history</div>
      <div className={styles.walletTransactionList}>
        {reloadHistory.length === 0 ? (
          <div className={styles.emptyState}>No reload history yet.</div>
        ) : (
          reloadHistory.map((transaction) => (
            <div key={transaction.id} className={styles.walletTransactionRow}>
              <div className={styles.walletTransactionCopy}>
                <span className={styles.walletTransactionTitle}>
                  {getWalletTransactionLabel(transaction)}
                </span>
                <span className={styles.walletTransactionDate}>
                  {formatWalletDate(transaction.createdAt)}
                </span>
              </div>
              <span className={styles.walletTransactionAmount}>
                {getWalletTransactionAmountPrefix(transaction.type)}
                {formatWalletAmount(transaction.amountMils)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export function CustomerRosterCard({
  state,
  activeFilter,
  onFilterChange,
  customersOverride,
  searchQuery = '',
  onSearchQueryChange,
  sortOrder = 'newest',
  onSortOrderChange,
  actionState,
  onUnsubscribe,
  onCopySignupLink,
  onCopyVisibleContacts,
  activeComposerAudienceId,
  composerSubject,
  composerBody,
  composerPending,
  onOpenEmailComposer,
  onCloseEmailComposer,
  onComposerSubjectChange,
  onComposerBodyChange,
  onSendEmail,
}: {
  state: AudienceState
  activeFilter: RosterFilter
  onFilterChange: (filter: RosterFilter) => void
  customersOverride?: CustomerAudienceMember[]
  searchQuery?: string
  onSearchQueryChange?: (value: string) => void
  sortOrder?: RosterSort
  onSortOrderChange?: (value: RosterSort) => void
  actionState?: AudienceActionState
  onUnsubscribe?: (audienceId: string, channel: 'sms' | 'email') => void
  onCopySignupLink?: () => void
  onCopyVisibleContacts?: (
    customers: CustomerAudienceMember[],
    channel: 'sms' | 'email',
  ) => void
  activeComposerAudienceId?: string | null
  composerSubject?: string
  composerBody?: string
  composerPending?: boolean
  onOpenEmailComposer?: (customer: CustomerAudienceMember) => void
  onCloseEmailComposer?: () => void
  onComposerSubjectChange?: (value: string) => void
  onComposerBodyChange?: (value: string) => void
  onSendEmail?: () => void
}) {
  if (state.status === 'error') {
    return (
      <div className={styles.rosterFallback}>
        Customer audience will show here once it loads.
      </div>
    )
  }

  if (state.status !== 'ready' || !state.summary) {
    return (
      <div className={styles.cardFill}>
        <div className={styles.loadingLine} />
        <div className={styles.loadingLineShort} />
      </div>
    )
  }

  const filteredCustomers = sortRosterCustomers(
    searchRosterCustomers(
      customersOverride ?? filterRosterCustomers(state.customers ?? [], activeFilter),
      searchQuery,
    ),
    sortOrder,
  )
  const duplicateSourceCustomers = customersOverride ?? state.customers ?? []
  const optedOutCount =
    state.summary.smsOptedOutCount + state.summary.emailOptedOutCount

  return (
    <div className={styles.rosterCard}>
      <div className={styles.metricGrid}>
        <div className={styles.metricBlock}>
          <span className={styles.metricLabel}>Total</span>
          <span className={styles.metricValue}>{state.summary.totalCustomers}</span>
        </div>
        <div className={styles.metricBlock}>
          <span className={styles.metricLabel}>SMS</span>
          <span className={styles.metricValue}>
            {state.summary.smsReachableCount}
          </span>
        </div>
        <div className={styles.metricBlock}>
          <span className={styles.metricLabel}>Email</span>
          <span className={styles.metricValue}>
            {state.summary.emailReachableCount}
          </span>
        </div>
        <div className={styles.metricBlock}>
          <span className={styles.metricLabel}>Opted out</span>
          <span className={styles.metricValue}>{optedOutCount}</span>
        </div>
      </div>
      <div className={styles.rosterMetaRow}>
        <span className={styles.rosterTag}>
          +{state.summary.addedLast30DaysCount} in last 30 days
        </span>
        <div className={styles.filterBar} role="toolbar" aria-label="Filter roster">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.filterButton} ${
                activeFilter === option.value ? styles.filterButtonActive : ''
              }`}
              onClick={() => onFilterChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <label className={styles.searchField}>
        <span className={styles.searchLabel}>Search customers</span>
        <input
          type="search"
          value={searchQuery}
          className={styles.searchInput}
          placeholder="Name, phone, or email"
          onChange={(event) => onSearchQueryChange?.(event.target.value)}
        />
      </label>
      <label className={styles.sortField}>
        <span className={styles.sortLabel}>Sort roster</span>
        <select
          value={sortOrder}
          className={styles.sortSelect}
          onChange={(event) => onSortOrderChange?.(event.target.value as RosterSort)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <div className={styles.bulkActions}>
        <button
          type="button"
          className={styles.bulkActionButton}
          onClick={() => onCopyVisibleContacts?.(filteredCustomers, 'sms')}
        >
          Copy visible SMS
        </button>
        <button
          type="button"
          className={styles.bulkActionButton}
          onClick={() => onCopyVisibleContacts?.(filteredCustomers, 'email')}
        >
          Copy visible emails
        </button>
      </div>
      <div className={styles.customerList} role="list" aria-label="Customer roster">
        {actionState?.error ? (
          <div className={styles.actionError}>{actionState.error}</div>
        ) : null}
        {actionState?.helperMessage ? (
          <div className={styles.helperMessage}>{actionState.helperMessage}</div>
        ) : null}
        {filteredCustomers.length === 0 ? (
          <div className={styles.emptyState}>No customers match this filter yet.</div>
        ) : (
          filteredCustomers.map((customer) => {
            const statuses = getCustomerChannelStatuses(customer)
            const timelineEntries = getCustomerTimeline(customer)
            const duplicateSummary = getCustomerDuplicateSummary(
              customer,
              duplicateSourceCustomers,
            )
            const isComposerOpen = activeComposerAudienceId === customer.id

            return (
              <div key={customer.id} className={styles.customerRow} role="listitem">
              <div className={styles.customerIdentity}>
                <span className={styles.customerName}>{customer.name}</span>
                <span className={styles.customerDate}>
                  Joined {formatRosterDate(customer.createdAt)}
                </span>
              </div>
              <div className={styles.customerContact}>
                <span>{customer.phone ?? 'No phone saved'}</span>
                <span>{customer.email ?? 'No email saved'}</span>
              </div>
              <div className={styles.badgeRow}>
                {getCustomerBadges(customer).map((badge) => (
                  <span
                    key={`${customer.id}-${badge.text}`}
                    className={`${styles.statusBadge} ${
                      badge.tone === 'positive'
                        ? styles.statusBadgePositive
                        : badge.tone === 'warning'
                          ? styles.statusBadgeWarning
                          : styles.statusBadgeNeutral
                    }`}
                  >
                    {badge.text}
                  </span>
                ))}
              </div>
              <div className={styles.statusGrid}>
                <div className={styles.statusDetail}>
                  <span className={styles.statusDetailLabel}>SMS status</span>
                  <span className={styles.statusDetailValue}>{statuses.sms}</span>
                </div>
                <div className={styles.statusDetail}>
                  <span className={styles.statusDetailLabel}>Email status</span>
                  <span className={styles.statusDetailValue}>{statuses.email}</span>
                </div>
              </div>
              <div className={styles.actionRow}>
                {getCustomerActions(customer).map((action) => {
                  const actionKey = `${customer.id}:${action.channel}`
                  return (
                    <button
                      key={actionKey}
                      type="button"
                      className={styles.actionButton}
                      disabled={
                        !onUnsubscribe || actionState?.pendingKey === actionKey
                      }
                      onClick={() => onUnsubscribe?.(customer.id, action.channel)}
                    >
                      {actionState?.pendingKey === actionKey
                        ? 'Saving...'
                        : action.label}
                    </button>
                  )
                })}
                {getCustomerOutreachActions(customer).map((action) => (
                  <button
                    key={`${customer.id}-${action.kind}`}
                    type="button"
                    className={styles.helperButton}
                    disabled={!onOpenEmailComposer}
                    onClick={() => onOpenEmailComposer?.(customer)}
                  >
                    {action.label}
                  </button>
                ))}
                {getCustomerRecoveryActions(customer).map((action) =>
                  action.kind === 'open_signup' ? (
                    <a
                      key={`${customer.id}-${action.kind}`}
                      className={styles.helperLink}
                      href={SIGNUP_FORM_PATH}
                      rel="noreferrer noopener"
                      target="_blank"
                    >
                      {action.label}
                    </a>
                  ) : (
                    <button
                      key={`${customer.id}-${action.kind}`}
                      type="button"
                      className={styles.helperButton}
                      onClick={() => onCopySignupLink?.()}
                    >
                      {action.label}
                    </button>
                  ),
                )}
              </div>
              {isComposerOpen ? (
                <div className={styles.emailComposer}>
                  <label className={styles.searchField}>
                    <span className={styles.searchLabel}>Email subject</span>
                    <input
                      type="text"
                      className={styles.searchInput}
                      value={composerSubject ?? ''}
                      onChange={(event) =>
                        onComposerSubjectChange?.(event.target.value)
                      }
                    />
                  </label>
                  <label className={styles.searchField}>
                    <span className={styles.searchLabel}>Email message</span>
                    <textarea
                      className={styles.emailComposerTextarea}
                      value={composerBody ?? ''}
                      onChange={(event) =>
                        onComposerBodyChange?.(event.target.value)
                      }
                    />
                  </label>
                  <div className={styles.actionRow}>
                    <button
                      type="button"
                      className={styles.actionButton}
                      disabled={!onSendEmail || composerPending}
                      onClick={() => onSendEmail?.()}
                    >
                      {composerPending ? 'Sending...' : 'Send email'}
                    </button>
                    <button
                      type="button"
                      className={styles.helperButton}
                      disabled={composerPending}
                      onClick={() => onCloseEmailComposer?.()}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
              <div className={styles.timelineList}>
                {timelineEntries.map((entry) => (
                  <span key={`${customer.id}-${entry}`} className={styles.timelineItem}>
                    {entry}
                  </span>
                ))}
              </div>
              {needsFreshOptIn(customer) ? (
                <div className={styles.helperNote}>
                  Fresh consent must come from the customer.
                </div>
              ) : null}
              {duplicateSummary ? (
                <div className={styles.duplicateWarning}>{duplicateSummary}</div>
              ) : null}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
