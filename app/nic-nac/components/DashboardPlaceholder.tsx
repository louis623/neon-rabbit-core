'use client'

import type { FormEvent } from 'react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
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
  TradeSwapCleanupItem,
  WalletDashboardResult,
  WalletTransactionSummary,
} from '@/lib/services/types'
import { SMS_CHARGE_MILS, walletMilsToUsd } from '@/lib/services/wallet-units'
import { NIC_NAC_WORKSPACE_REFRESH_EVENT } from '@/lib/nic-nac/workspace-refresh-events'
import { SparkleSeal } from '@/app/prelaunch/_components/PrelaunchVisuals'
import { normalizeAmethystAppearancePreset } from '@/lib/amethyst/appearance-presets'
import { AMETHYST_SKIN_CARDS } from '@/lib/amethyst/skin-cards'
import {
  buildCustomerSparkleSiteHref,
  buildCustomerTradeBoardHref,
} from '@/lib/nic-nac/rep-links'
import {
  getBoardInventoryOptions,
  getBoardInventoryResults,
  getCarouselWindow,
  hasActiveBoardInventoryBrowse,
} from '@/lib/nic-nac/board-inventory-view'
import { sparkleSuitePublicLandingContent } from '@/lib/sparkle-suite/public-landing-content'
import styles from './DashboardPlaceholder.module.css'

export {
  buildCustomerSparkleSiteHref,
  buildCustomerTradeBoardHref,
}

const WORKSPACE_SECTIONS = [
  { key: 'trade-board', label: 'Trade Board', subtitle: 'Listings, requests, queue, and history' },
  { key: 'jewelry-library', label: 'Jewelry Library', subtitle: 'Search the shared catalog and add pieces' },
  { key: 'show-calendar', label: 'Calendar', subtitle: 'Upcoming shows and recent history' },
  { key: 'business-calculator', label: 'Business Calculator', subtitle: 'Estimate show and monthly take-home', comingSoon: true },
  { key: 'team-management', label: 'Team Management', subtitle: 'Team onboarding and shared customer workflows', comingSoon: true },
  { key: 'messages', label: 'Messages', subtitle: 'Announcements, reports, and audience backup tools', comingSoon: true },
  { key: 'site-settings', label: 'Site Settings', subtitle: 'Public page copy and branding' },
  { key: 'help-resources', label: 'Help & Resources', subtitle: 'Quick operating guides for reps' },
  { key: 'account', label: 'Account', subtitle: 'Billing, wallet, and site analytics' },
] as const

const TRADE_WORKSPACE_REFRESH_MS = 15_000
const TRADE_BOARD_PAGE_SIZE = 12
const BOARD_INVENTORY_MOBILE_QUERY = '(max-width: 840px)'

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

export function getJewelryLibrarySearchErrorMessage(_status?: number) {
  return 'Unable to search the jewelry library right now. Try again in a minute, or ask Nic-Nac to help look up the piece.'
}

function subscribeBoardInventoryViewport(callback: () => void) {
  if (typeof window === 'undefined') return () => {}

  const mediaQuery = window.matchMedia(BOARD_INVENTORY_MOBILE_QUERY)
  mediaQuery.addEventListener('change', callback)
  return () => mediaQuery.removeEventListener('change', callback)
}

function getBoardInventoryPageSizeSnapshot() {
  if (typeof window === 'undefined') return 3
  return window.matchMedia(BOARD_INVENTORY_MOBILE_QUERY).matches ? 1 : 3
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

const COMING_SOON_WORKSPACE_SECTIONS = new Set<WorkspaceSectionKey>(
  WORKSPACE_SECTIONS.filter((section) => 'comingSoon' in section && section.comingSoon)
    .map((section) => section.key),
)

export function isComingSoonWorkspaceSection(section: WorkspaceSectionKey) {
  return COMING_SOON_WORKSPACE_SECTIONS.has(section)
}

export function getInitialWorkspaceSection(search: string): WorkspaceSectionKey {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const requested = params.get('section')?.trim() ?? ''
  if (WORKSPACE_SECTION_KEYS.has(requested)) {
    const section = requested as WorkspaceSectionKey
    return isComingSoonWorkspaceSection(section) ? 'trade-board' : section
  }
  return 'trade-board'
}

export function hasPaidWorkspaceSubscription(
  summary: AccountBillingDashboardResult | null | undefined,
) {
  const status = summary?.subscription?.status
  return status === 'active' || status === 'trialing' || status === 'past_due'
}

export function getVisibleWorkspaceSections(_hasPaidWorkspace: boolean) {
  return WORKSPACE_SECTIONS
}

export function resolveWorkspaceSectionForAccess(
  section: WorkspaceSectionKey,
  _hasPaidWorkspace: boolean,
): WorkspaceSectionKey {
  if (isComingSoonWorkspaceSection(section)) return 'trade-board'
  return section
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
  publicSiteSlug?: string | null
  liveQueueSyncCode?: string | null
  timeZone?: string | null
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

type TradeSwapCleanupState = {
  status: 'loading' | 'ready' | 'error'
  items?: TradeSwapCleanupItem[]
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
    public_site_slug?: string | null
    time_zone?: string | null
    live_queue_sync_code?: string | null
  }
}

type WalletResponsePayload = WalletDashboardResult
type SiteSettingsResponsePayload = SiteSettingsDashboardResult
type AccountBillingResponsePayload = AccountBillingDashboardResult
type TradeBoardResponsePayload = BoardResult
type TradeRequestsResponsePayload = TradeRequestWithListing[]
type FulfillmentQueueResponsePayload = FulfillmentQueueItem[]
type TradeHistoryResponsePayload = TradeHistoryResult
type TradeSwapCleanupResponsePayload = TradeSwapCleanupItem[]
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
const DEFAULT_CALENDAR_TIME_ZONE = 'America/New_York'

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

const HELP_RESOURCE_GROUP_ORDER = [
  'Setup',
  'Live Shows',
  'Trade Board',
  'Customers & Account',
  'Help',
] as const

type HelpSupportReportType =
  | 'site_issue'
  | 'bug'
  | 'suggested_upgrade'
  | 'workflow_idea'

type HelpSupportReportUrgency = 'normal' | 'blocking' | 'showtime_urgent'

type HelpSupportReportForm = {
  reportType: HelpSupportReportType
  urgency: HelpSupportReportUrgency
  workflowChecked: boolean
  pageOrWorkflow: string
  title: string
  details: string
  expectedResult: string
  actualResult: string
  contactOk: boolean
}

const SUPPORT_REPORT_TYPE_OPTIONS: Array<{
  value: HelpSupportReportType
  label: string
}> = [
  { value: 'site_issue', label: 'Site issue' },
  { value: 'bug', label: 'Bug' },
  { value: 'suggested_upgrade', label: 'Suggested upgrade' },
  { value: 'workflow_idea', label: 'Workflow idea' },
]

const SUPPORT_REPORT_URGENCY_OPTIONS: Array<{
  value: HelpSupportReportUrgency
  label: string
}> = [
  { value: 'normal', label: 'Normal' },
  { value: 'blocking', label: 'Blocking me' },
  { value: 'showtime_urgent', label: 'Show-time urgent' },
]

const DEFAULT_SUPPORT_REPORT_FORM: HelpSupportReportForm = {
  reportType: 'site_issue',
  urgency: 'normal',
  workflowChecked: false,
  pageOrWorkflow: '',
  title: '',
  details: '',
  expectedResult: '',
  actualResult: '',
  contactOk: true,
}

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

const SIGNUP_FORM_PATH = '/amethyst/Homepage.html#signup'
const MESSAGE_TYPE_LABELS: Record<string, string> = {
  monthly_report: 'Monthly report',
  newsletter: 'Newsletter',
  announcement: 'Announcement',
  support_request: 'Support request',
  support_response: 'Support reply',
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

function getTimeZoneParts(input: Date | string, timeZone: string) {
  const date = typeof input === 'string' ? new Date(input) : input
  const parts = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: '2-digit',
    timeZone,
    year: 'numeric',
  }).formatToParts(date)
  const byType = new Map(parts.map((part) => [part.type, part.value]))

  return {
    year: Number(byType.get('year')),
    month: Number(byType.get('month')),
    day: Number(byType.get('day')),
  }
}

function getDateKeyInTimeZone(
  input: Date | string,
  timeZone = DEFAULT_CALENDAR_TIME_ZONE,
) {
  const { year, month, day } = getTimeZoneParts(input, timeZone)
  return `${year}-${`${month}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`
}

function getCalendarDisplayTimeZone(events: CalendarEvent[]) {
  return events.find((event) => event.timeZone)?.timeZone ?? DEFAULT_CALENDAR_TIME_ZONE
}

function getMonthStartInTimeZone(referenceDate: Date, timeZone: string) {
  const { year, month } = getTimeZoneParts(referenceDate, timeZone)
  return new Date(Date.UTC(year, month - 1, 1))
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
  const displayTimeZone = getCalendarDisplayTimeZone(upcomingEvents)
  const monthStart = getMonthStartInTimeZone(referenceDate, displayTimeZone)
  const monthKey = getDateKeyInTimeZone(monthStart, 'UTC').slice(0, 7)

  const thisMonthCount = upcomingEvents.filter((event) => {
    const eventMonthKey = getDateKeyInTimeZone(
      event.eventTime,
      event.timeZone ?? displayTimeZone,
    ).slice(0, 7)
    return eventMonthKey === monthKey
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
  const displayTimeZone = getCalendarDisplayTimeZone(upcomingEvents)
  const monthStart = getMonthStartInTimeZone(referenceDate, displayTimeZone)
  const gridStart = new Date(monthStart)
  gridStart.setUTCDate(monthStart.getUTCDate() - monthStart.getUTCDay())

  const todayKey = getDateKeyInTimeZone(referenceDate, displayTimeZone)
  const eventsByDay = new Map<string, CalendarEvent[]>()

  for (const event of upcomingEvents) {
    const key = getDateKeyInTimeZone(
      event.eventTime,
      event.timeZone ?? displayTimeZone,
    )
    const existing = eventsByDay.get(key) ?? []
    existing.push(event)
    eventsByDay.set(key, existing)
  }

  return Array.from({ length: 35 }, (_, index) => {
    const cellDate = new Date(gridStart)
    cellDate.setUTCDate(gridStart.getUTCDate() + index)

    const isoDate = getDateKeyInTimeZone(cellDate, 'UTC')
    return {
      isoDate,
      dayNumber: cellDate.getUTCDate(),
      isCurrentMonth: cellDate.getUTCMonth() === monthStart.getUTCMonth(),
      isToday: isoDate === todayKey,
      events: eventsByDay.get(isoDate) ?? [],
    }
  })
}

function formatCalendarEventDate(
  eventTime: string,
  timeZone = DEFAULT_CALENDAR_TIME_ZONE,
) {
  return new Date(eventTime).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone,
  })
}

function formatCalendarEventTime(
  eventTime: string,
  timeZone = DEFAULT_CALENDAR_TIME_ZONE,
) {
  return new Date(eventTime).toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
    timeZoneName: 'short',
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
  publicSiteSlugOverride?: string | null
  liveQueueSyncCodeOverride?: string | null
  initialSiteSettings?: SiteSettingsDashboardResult
  reviewWorkspaceMode?: boolean
}

type WorkspacePreviewState =
  | { mode: 'workspace' }
  | {
      mode: 'live_site_preview'
      href: string
      title: 'Live Site Preview' | 'Customer Trade Board Preview'
    }

export function DashboardPlaceholder(props: DashboardPlaceholderProps = {}) {
  const {
    repIdOverride,
    publicSiteSlugOverride,
    liveQueueSyncCodeOverride,
    initialSiteSettings,
    reviewWorkspaceMode = false,
  } = props
  const [activeSection, setActiveSection] =
    useState<WorkspaceSectionKey>(() =>
      typeof window === 'undefined'
        ? 'trade-board'
        : getInitialWorkspaceSection(window.location.search),
    )
  const [workspacePreview, setWorkspacePreview] = useState<WorkspacePreviewState>({
    mode: 'workspace',
  })
  const [previewFrameKey, setPreviewFrameKey] = useState(0)
  const [previewUnavailableMessage, setPreviewUnavailableMessage] = useState<
    string | null
  >(null)
  const [repProfileState, setRepProfileState] = useState<RepProfileState>({
    status: reviewWorkspaceMode ? 'ready' : 'loading',
    repId: repIdOverride,
    displayName: initialSiteSettings?.displayName,
    publicSiteSlug: publicSiteSlugOverride ?? null,
    liveQueueSyncCode: liveQueueSyncCodeOverride ?? null,
  })
  const [audienceState, setAudienceState] = useState<AudienceState>({
    status: reviewWorkspaceMode ? 'ready' : 'loading',
    summary: reviewWorkspaceMode
      ? {
          totalCustomers: 0,
          smsReachableCount: 0,
          emailReachableCount: 0,
          marketingConsentCount: 0,
          smsOptedOutCount: 0,
          emailOptedOutCount: 0,
          addedLast30DaysCount: 0,
        }
      : undefined,
    customers: reviewWorkspaceMode ? [] : undefined,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const requestedSection = getInitialWorkspaceSection(window.location.search)
    setActiveSection((currentSection) =>
      currentSection === requestedSection ? currentSection : requestedSection,
    )
  }, [])
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
    status: reviewWorkspaceMode ? 'ready' : 'loading',
    summary: reviewWorkspaceMode
      ? {
          balanceMils: 0,
          balanceUsd: 0,
          estimatedTextsRemaining: 0,
          messagesSentThisMonth: 0,
          messagesSpendThisMonthMils: 0,
          messagesSpendThisMonthUsd: 0,
          autoRechargeEnabled: false,
          autoRechargePending: false,
          autoRechargeThresholdMils: 10000,
          autoRechargeThresholdUsd: 10,
          autoRechargeAmountMils: 25000,
          autoRechargeAmountUsd: 25,
          minimumLoadAmountMils: 25000,
          minimumLoadAmountUsd: 25,
          lastLoadedAt: null,
          recentTransactions: [],
        }
      : undefined,
  })
  const [calendarState, setCalendarState] = useState<CalendarState>({
    status: reviewWorkspaceMode ? 'ready' : 'loading',
    summary: reviewWorkspaceMode
      ? {
          upcomingEvents: [],
          recentEvents: [],
        }
      : undefined,
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
      status: reviewWorkspaceMode ? 'ready' : 'loading',
      summary: reviewWorkspaceMode
        ? {
            stripeConfigured: false,
            checkoutMode: 'test_buyer',
            subscription: {
              status: 'active',
              planType: 'monthly',
              currentPeriodEnd: null,
              cancelAtPeriodEnd: false,
              cancelledAt: null,
              livemode: false,
            },
            paymentMethod: null,
            invoices: [],
            referral: {
              code: null,
              link: null,
              pendingCount: 0,
              earnedCount: 0,
              creditedCount: 0,
            },
            canStartSubscription: false,
            canManageBilling: false,
          }
        : undefined,
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
    status: reviewWorkspaceMode ? 'ready' : 'loading',
    board: reviewWorkspaceMode
      ? {
          listings: [],
          summary: {
            totalPieces: 0,
            totalMsrp: 0,
            pendingRequestCount: 0,
            typeBreakdown: {
              RG: 0,
              NK: 0,
              ER: 0,
              ST: 0,
              BR: 0,
            },
          },
        }
      : undefined,
    hasMoreListings: reviewWorkspaceMode ? false : undefined,
  })
  const [tradeBoardActionState, setTradeBoardActionState] =
    useState<TradeBoardActionState>({
      pendingKey: null,
      error: null,
      helperMessage: null,
    })
  const inventoryBrowseLoadPromiseRef = useRef<Promise<void> | null>(null)
  const inventoryBrowseFailedOffsetRef = useRef<number | null>(null)
  const [tradeRequestsState, setTradeRequestsState] = useState<TradeRequestsState>({
    status: reviewWorkspaceMode ? 'ready' : 'loading',
    requests: reviewWorkspaceMode ? [] : undefined,
  })
  const [fulfillmentQueueState, setFulfillmentQueueState] =
    useState<FulfillmentQueueState>({
      status: reviewWorkspaceMode ? 'ready' : 'loading',
      items: reviewWorkspaceMode ? [] : undefined,
    })
  const [tradeHistoryState, setTradeHistoryState] = useState<TradeHistoryState>({
    status: reviewWorkspaceMode ? 'ready' : 'loading',
    history: reviewWorkspaceMode
      ? {
          items: [],
          summary: {
            totalCompleted: 0,
            totalMsrpTraded: 0,
            avgFulfillmentDays: null,
            repeatCustomers: [],
          },
        }
      : undefined,
  })
  const [tradeSwapCleanupState, setTradeSwapCleanupState] =
    useState<TradeSwapCleanupState>({
      status: reviewWorkspaceMode ? 'ready' : 'loading',
      items: reviewWorkspaceMode ? [] : undefined,
    })
  const [jewelryLibraryState, setJewelryLibraryState] =
    useState<JewelryLibraryState>({
      status: 'idle',
      results: [],
    })
  const [messagesState, setMessagesState] = useState<MessagesState>({
    status: reviewWorkspaceMode ? 'ready' : 'loading',
    inbox: reviewWorkspaceMode
      ? {
          unreadCount: 0,
          messages: [],
        }
      : undefined,
  })
  const [messagesActionState, setMessagesActionState] =
    useState<MessagesActionState>({
      pendingKey: null,
      error: null,
      helperMessage: null,
    })
  const [resourcesState, setResourcesState] = useState<ResourcesState>({
    status: reviewWorkspaceMode ? 'ready' : 'loading',
    resources: reviewWorkspaceMode ? [] : undefined,
  })
  const [analyticsState, setAnalyticsState] = useState<AnalyticsState>({
    status: reviewWorkspaceMode ? 'ready' : 'loading',
    analytics: reviewWorkspaceMode
      ? {
          configured: false,
          privacy: {
            disablesIpCapture: true,
            masksSensitiveInputs: true,
            identifiesAfterLoginOnly: true,
          },
          overview: {
            pageViews30d: null,
            uniqueVisitors30d: null,
            topTrafficSource: null,
            topDeviceType: null,
          },
          topPages: [],
          trafficSources: [],
          deviceMix: [],
          operationalSnapshot: {
            activeListings: 0,
            pendingRequests: 0,
            upcomingShows: 0,
            reachableCustomers: 0,
          },
        }
      : undefined,
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
      publicSiteSlug: payload.rep?.public_site_slug ?? null,
      liveQueueSyncCode: payload.rep?.live_queue_sync_code ?? null,
      timeZone: payload.rep?.time_zone ?? null,
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
    return payload
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

  async function loadTradeSwapCleanup(signal?: AbortSignal) {
    const response = await fetch('/api/nic-nac/trade-swap-cleanup', {
      credentials: 'include',
      signal,
    })
    if (!response.ok) {
      throw new Error(`trade swap cleanup request failed: ${response.status}`)
    }

    const payload = (await response.json()) as TradeSwapCleanupResponsePayload
    setTradeSwapCleanupState({
      status: 'ready',
      items: payload,
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
      throw new Error(getJewelryLibrarySearchErrorMessage(response.status))
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
      loadTradeSwapCleanup(signal).catch((error) => {
        if ((error as { name?: string }).name === 'AbortError') return
        setTradeSwapCleanupState({ status: 'error' })
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
    if (reviewWorkspaceMode) return

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
  }, [reviewWorkspaceMode])

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
    if (reviewWorkspaceMode) return

    await Promise.all([
      loadTradeBoard(),
      loadTradeRequests(),
      loadFulfillmentQueue(),
      loadTradeHistory(),
      loadTradeSwapCleanup(),
      loadAnalytics(),
    ])
  }

  async function refreshTradeWorkspaceSettled() {
    if (reviewWorkspaceMode) return []

    return Promise.allSettled([
      loadTradeBoard(),
      loadTradeRequests(),
      loadFulfillmentQueue(),
      loadTradeHistory(),
      loadTradeSwapCleanup(),
      loadAnalytics(),
    ])
  }

  const handleEnsureInventoryBrowseLoaded = useCallback(async () => {
    if (reviewWorkspaceMode) return
    if (tradeBoardActionState.pendingKey === 'load-more-listings') return

    let offset = tradeBoardState.board?.listings.length ?? 0
    if (offset <= 0 || tradeBoardState.hasMoreListings !== true) return
    if (inventoryBrowseLoadPromiseRef.current) {
      return inventoryBrowseLoadPromiseRef.current
    }
    if (inventoryBrowseFailedOffsetRef.current === offset) return

    setTradeBoardActionState({
      pendingKey: 'load-more-listings',
      error: null,
      helperMessage: null,
    })

    inventoryBrowseLoadPromiseRef.current = (async () => {
      try {
        let hasMore = true
        while (hasMore) {
          const payload = await loadTradeBoard(undefined, { offset, append: true })
          const fetchedCount = payload.listings.length
          hasMore = fetchedCount === TRADE_BOARD_PAGE_SIZE
          offset += fetchedCount
          if (fetchedCount === 0) break
        }
        inventoryBrowseFailedOffsetRef.current = null
        setTradeBoardActionState({
          pendingKey: null,
          error: null,
          helperMessage: null,
        })
      } catch (error) {
        inventoryBrowseFailedOffsetRef.current =
          tradeBoardState.board?.listings.length ?? null
        setTradeBoardActionState({
          pendingKey: null,
          error:
            error instanceof Error
              ? error.message
              : 'Unable to load more listings right now.',
          helperMessage: null,
        })
      } finally {
        inventoryBrowseLoadPromiseRef.current = null
      }
    })()

    return inventoryBrowseLoadPromiseRef.current
  }, [
    reviewWorkspaceMode,
    tradeBoardActionState.pendingKey,
    tradeBoardState.board?.listings.length,
    tradeBoardState.hasMoreListings,
  ])

  useEffect(() => {
    if (activeSection !== 'trade-board') return
    if (reviewWorkspaceMode) return

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
  }, [activeSection, reviewWorkspaceMode])

  useEffect(() => {
    const refreshAfterNicNacMutation = (event: Event) => {
      const detail = (event as CustomEvent<{ topic?: string }>).detail
      const topic = detail?.topic
      if (topic !== 'trade' && topic !== 'site') return
      if (document.visibilityState === 'hidden') return
      if (topic === 'trade' && !reviewWorkspaceMode) {
        void refreshTradeWorkspace()
      }
      if (
        workspacePreview.mode === 'live_site_preview' &&
        (topic === 'trade' || topic === 'site')
      ) {
        setPreviewFrameKey((current) => current + 1)
      }
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
  }, [reviewWorkspaceMode, workspacePreview.mode])

  useEffect(() => {
    if (reviewWorkspaceMode) return
    if (accountBillingState.status !== 'ready') return
    if (!hasPaidWorkspaceSubscription(accountBillingState.summary)) return

    const controller = new AbortController()
    void loadPaidWorkspaceData(controller.signal)

    return () => controller.abort()
  }, [accountBillingState.status, accountBillingState.summary, reviewWorkspaceMode])

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
    swap?: { revealedItemNumber?: string; revealedRingSize?: string },
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
          ...(swap?.revealedItemNumber
            ? {
                revealedItemNumber: swap.revealedItemNumber,
                revealedRingSize: swap.revealedRingSize,
              }
            : {}),
        }),
      })
      const payload = (await response.json().catch(() => null)) as
        | {
            error?: string
            result?: {
              replacementStatus?: string
            }
          }
        | null
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to update that request right now.')
      }

      await refreshTradeWorkspace()
      const replacementStatus = payload?.result?.replacementStatus
      const approveMessage =
        replacementStatus === 'added_to_board'
          ? 'Trade approved. Added the revealed piece back to your board.'
          : replacementStatus === 'needs_ring_size'
            ? 'Trade approved. I saved the item number to this swap; add the ring size after the show to put it on the board.'
            : replacementStatus === 'needs_catalog_details'
              ? 'Trade approved. I saved the item number to this swap; finish the catalog details after the show.'
              : 'Trade request approved.'
      setTradeBoardActionState({
        pendingKey: null,
        error: null,
        helperMessage:
          action === 'approve'
            ? approveMessage
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
          addToBoard: nextStatus === 'completed',
        }),
      })
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to advance fulfillment right now.')
      }

      const refreshResults = await refreshTradeWorkspaceSettled()
      const refreshFailed = refreshResults.some(
        (result) => result.status === 'rejected',
      )
      setTradeBoardActionState({
        pendingKey: null,
        error: refreshFailed
          ? 'Fulfillment updated, but part of the workspace did not refresh.'
          : null,
        helperMessage:
          nextStatus === 'shipped'
            ? 'Fulfillment moved to shipped.'
            : 'Fulfillment marked completed. Add the received piece to your board when you are ready.',
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

  const customerSparkleSiteHref = buildCustomerSparkleSiteHref({
    repId: repIdOverride ?? repProfileState.repId,
    publicSiteSlug: publicSiteSlugOverride ?? repProfileState.publicSiteSlug,
  })
  const customerTradeBoardHref = buildCustomerTradeBoardHref(
    repIdOverride ?? repProfileState.repId,
  )
  const openWorkspacePreview = (nextPreview: Extract<WorkspacePreviewState, { mode: 'live_site_preview' }>) => {
    setPreviewUnavailableMessage(null)
    setWorkspacePreview(nextPreview)
    setPreviewFrameKey((current) => current + 1)
  }
  const handleOpenLiveSitePreview = () => {
    openWorkspacePreview({
      mode: 'live_site_preview',
      href: customerSparkleSiteHref,
      title: 'Live Site Preview',
    })
  }
  const handleOpenTradeBoardPreview = () => {
    openWorkspacePreview({
      mode: 'live_site_preview',
      href: customerTradeBoardHref,
      title: 'Customer Trade Board Preview',
    })
  }
  const headerRepShow = formatHeaderRepShow(
    siteSettingsState.settings?.displayName ?? repProfileState.displayName,
    siteSettingsState.settings?.businessName,
  )
  const headerLiveQueueSyncCode =
    liveQueueSyncCodeOverride ?? repProfileState.liveQueueSyncCode ?? 'Not assigned yet'
  const workspaceSkinPreset = getWorkspaceSkinPreset(
    siteSettingsState.settings,
    siteSettingsDraft,
  )
  const hasPaidWorkspace = hasPaidWorkspaceSubscription(
    accountBillingState.summary,
  )
  const visibleWorkspaceSections = getVisibleWorkspaceSections(hasPaidWorkspace)
  const isLiveSitePreview = workspacePreview.mode === 'live_site_preview'
  const activeWorkspacePreview = isLiveSitePreview ? workspacePreview : null

  return (
    <main
      className={`${styles.main} ${isLiveSitePreview ? styles.mainPreviewFocus : ''}`}
      data-workspace-skin={workspaceSkinPreset}
    >
      {!isLiveSitePreview ? (
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
            <span className={styles.topbarInfoLabel}>Live Queue sync code</span>
            <span className={`${styles.topbarInfoValue} ${styles.topbarInfoValueCode}`}>
              {headerLiveQueueSyncCode}
            </span>
            <span className={styles.topbarInfoHint}>
              Saved here for future extension setup.
            </span>
          </div>
          {hasPaidWorkspace ? (
            <button
              type="button"
              className={styles.liveSiteButton}
              onClick={handleOpenLiveSitePreview}
            >
              View live site
            </button>
          ) : null}
        </div>
      </header>
      ) : null}
      {previewUnavailableMessage ? (
        <div className={styles.previewUnavailableNotice}>
          {previewUnavailableMessage}
        </div>
      ) : null}
      {activeWorkspacePreview ? (
        <section className={styles.previewFocusShell} aria-label={activeWorkspacePreview.title}>
          <div className={styles.previewFocusBar}>
            <div className={styles.previewToolbarCopy}>
              <span className={styles.previewKicker}>Live Site Preview</span>
              <span className={styles.previewTitle}>{activeWorkspacePreview.title}</span>
            </div>
            <div className={styles.previewFocusActions}>
              <button
                type="button"
                className={styles.helperButton}
                onClick={() => {
                  setWorkspacePreview({ mode: 'workspace' })
                  setPreviewUnavailableMessage(null)
                }}
              >
                Back to workspace
              </button>
              <button
                type="button"
                className={styles.liveSiteButton}
                onClick={() => setPreviewFrameKey((current) => current + 1)}
              >
                Refresh preview
              </button>
              <a
                className={styles.helperLink}
                href={activeWorkspacePreview.href}
                target="_blank"
                rel="noreferrer"
              >
                Open full site
              </a>
            </div>
          </div>
          <iframe
            key={`${previewFrameKey}:${activeWorkspacePreview.href}`}
            className={styles.previewFocusFrame}
            src={activeWorkspacePreview.href}
            title="Sparkle Suite live site preview"
          />
        </section>
      ) : (
      <div className={styles.workspaceShell}>
        <aside className={styles.workspaceSidebar}>
          <div className={styles.workspaceSidebarTitle}>Dashboard</div>
          <div className={styles.workspaceSidebarIntro}>
            Manage the live workspace, customer site, trade tools, messages, and account settings.
          </div>
          <nav className={styles.workspaceNav}>
            {visibleWorkspaceSections.map((section) => {
              const isComingSoonSection =
                'comingSoon' in section && section.comingSoon
              return (
                <button
                  key={section.key}
                  type="button"
                  className={`${styles.workspaceNavButton} ${
                    activeSection === section.key
                      ? styles.workspaceNavButtonActive
                      : ''
                  } ${
                    isComingSoonSection ? styles.workspaceNavButtonComingSoon : ''
                  }`}
                  disabled={isComingSoonSection}
                  aria-disabled={isComingSoonSection}
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
                    {isComingSoonSection ? (
                      <span className={styles.workspaceNavStatusTag}>
                        Coming soon
                      </span>
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
          {hasPaidWorkspace && activeSection === 'trade-board' ? (
            <TradeBoardWorkspaceCard
              tradeBoardState={tradeBoardState}
              tradeBoardSearchQuery={tradeBoardSearchQuery}
              onTradeBoardSearchQueryChange={setTradeBoardSearchQuery}
              quickAddItemNumber={quickAddItemNumber}
              onQuickAddItemNumberChange={setQuickAddItemNumber}
              actionState={tradeBoardActionState}
              tradeRequestsState={tradeRequestsState}
              fulfillmentQueueState={fulfillmentQueueState}
              tradeHistoryState={tradeHistoryState}
              tradeSwapCleanupState={tradeSwapCleanupState}
              onQuickAddListing={handleQuickAddListing}
              onRemoveListing={handleRemoveTradeListing}
              onApproveRequest={(requestId, swap) =>
                handleTradeRequestDecision(requestId, 'approve', swap)
              }
              onRejectRequest={(requestId) =>
                handleTradeRequestDecision(requestId, 'reject')
              }
              onAdvanceFulfillment={handleAdvanceFulfillment}
              customerBoardHref={customerTradeBoardHref}
              onOpenCustomerBoardPreview={handleOpenTradeBoardPreview}
              hasMoreListings={tradeBoardState.hasMoreListings === true}
              onEnsureInventoryBrowseLoaded={handleEnsureInventoryBrowseLoaded}
              isInventoryBrowseLoading={
                tradeBoardActionState.pendingKey === 'load-more-listings'
              }
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
              {accountBillingState.status === 'ready' &&
              accountBillingState.summary ? (
                <ReferralProgramCard
                  referral={accountBillingState.summary.referral}
                />
              ) : null}
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
      )}
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
  tradeSwapCleanupState = { status: 'ready', items: [] },
  onQuickAddListing,
  onRemoveListing,
  onApproveRequest,
  onRejectRequest,
  onAdvanceFulfillment,
  customerBoardHref = buildCustomerTradeBoardHref(),
  onOpenCustomerBoardPreview,
  hasMoreListings = false,
  onEnsureInventoryBrowseLoaded,
  isInventoryBrowseLoading = false,
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
  tradeSwapCleanupState?: TradeSwapCleanupState
  onQuickAddListing: () => void
  onRemoveListing: (listingId: string) => void
  onApproveRequest: (
    requestId: string,
    swap?: { revealedItemNumber?: string; revealedRingSize?: string },
  ) => void
  onRejectRequest: (requestId: string) => void
  onAdvanceFulfillment: (
    requestId: string,
    nextStatus: 'shipped' | 'completed',
  ) => void
  customerBoardHref?: string
  onOpenCustomerBoardPreview?: () => void
  hasMoreListings?: boolean
  onEnsureInventoryBrowseLoaded?: () => Promise<void>
  isInventoryBrowseLoading?: boolean
}) {
  const [previewListing, setPreviewListing] = useState<TradeListingWithDesign | null>(
    null,
  )
  const [swapApprovalDraft, setSwapApprovalDraft] = useState<{
    requestId: string
    customerName: string
  } | null>(null)
  const [revealedItemNumber, setRevealedItemNumber] = useState('')
  const [revealedRingSize, setRevealedRingSize] = useState('')
  const [inventoryJewelryType, setInventoryJewelryType] = useState('')
  const [inventoryCollection, setInventoryCollection] = useState('')
  const [inventoryCarouselIndex, setInventoryCarouselIndex] = useState(0)
  const boardSummary = tradeBoardState.board?.summary
  const boardListings = (visibleListings ?? tradeBoardState.board?.listings ?? []).filter(
    (listing) => listing.status === 'available',
  )
  const inventoryFilters = {
    search: tradeBoardSearchQuery,
    jewelryType: inventoryJewelryType,
    collection: inventoryCollection,
  }
  const hasActiveInventoryBrowse = hasActiveBoardInventoryBrowse(inventoryFilters)
  const inventoryOptions = getBoardInventoryOptions(boardListings)
  const inventoryResults = getBoardInventoryResults(boardListings, inventoryFilters)
  const inventoryCarouselPageSize = useSyncExternalStore(
    subscribeBoardInventoryViewport,
    getBoardInventoryPageSizeSnapshot,
    () => 3,
  )
  const carousel = getCarouselWindow(
    inventoryResults,
    inventoryCarouselIndex,
    inventoryCarouselPageSize,
  )
  const requests = tradeRequestsState.requests ?? []
  const queueItems = fulfillmentQueueState.items ?? []
  const history = tradeHistoryState.history
  const cleanupItems = tradeSwapCleanupState.items ?? []
  const normalizedRevealedItemNumber = revealedItemNumber.trim().toUpperCase()
  const approvingSwap = swapApprovalDraft
    ? actionState.pendingKey === `approve:${swapApprovalDraft.requestId}`
    : false

  useEffect(() => {
    if (!hasMoreListings) return
    void onEnsureInventoryBrowseLoaded?.()
  }, [hasMoreListings, onEnsureInventoryBrowseLoaded])

  function handleResetInventoryBrowse() {
    onTradeBoardSearchQueryChange('')
    setInventoryJewelryType('')
    setInventoryCollection('')
    setInventoryCarouselIndex(0)
  }

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
            {onOpenCustomerBoardPreview ? (
              <button
                type="button"
                className={styles.helperButton}
                onClick={onOpenCustomerBoardPreview}
              >
                View customer board
              </button>
            ) : (
              <a
                className={styles.helperLink}
                href={customerBoardHref}
                target="_blank"
                rel="noreferrer"
              >
                View customer board
              </a>
            )}
            <span className={styles.rosterTag}>Default landing section</span>
          </div>
        </div>
        {actionState.error ? <div className={styles.actionError}>{actionState.error}</div> : null}
        {actionState.helperMessage ? (
          <div className={styles.helperMessage}>{actionState.helperMessage}</div>
        ) : null}
      </div>

      {swapApprovalDraft ? (
        <div
          className={styles.imagePreviewMask}
          role="dialog"
          aria-modal="true"
          aria-label={`Approve trade swap for ${swapApprovalDraft.customerName}`}
          onClick={() => {
            if (approvingSwap) return
            setSwapApprovalDraft(null)
          }}
        >
          <div
            className={styles.imagePreviewDialog}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.imagePreviewClose}
              onClick={() => setSwapApprovalDraft(null)}
              disabled={approvingSwap}
            >
              Close
            </button>
            <div className={styles.walletSettingsTitle}>Approve trade</div>
            <p className={styles.helperNote}>
              {swapApprovalDraft.customerName} gets the board piece. Capture
              the item number just revealed so the swap can stay tied together.
            </p>
            <label className={styles.searchField}>
              <span className={styles.searchLabel}>
                Which item number was just revealed for the customer?
              </span>
              <input
                type="text"
                className={`${styles.searchInput} ph-no-capture`}
                value={revealedItemNumber}
                onChange={(event) =>
                  setRevealedItemNumber(event.target.value.toUpperCase())
                }
                placeholder="RG12345"
                disabled={approvingSwap}
              />
            </label>
            {normalizedRevealedItemNumber.startsWith('RG') ? (
              <label className={styles.searchField}>
                <span className={styles.searchLabel}>Ring size</span>
                <input
                  type="text"
                  className={`${styles.searchInput} ph-no-capture`}
                  value={revealedRingSize}
                  onChange={(event) => setRevealedRingSize(event.target.value)}
                  placeholder="8"
                  disabled={approvingSwap}
                />
              </label>
            ) : null}
            <div className={styles.actionRow}>
              <button
                type="button"
                className={styles.helperButton}
                onClick={() => setSwapApprovalDraft(null)}
                disabled={approvingSwap}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.actionButton}
                disabled={!normalizedRevealedItemNumber || approvingSwap}
                onClick={() => {
                  onApproveRequest(swapApprovalDraft.requestId, {
                    revealedItemNumber: normalizedRevealedItemNumber,
                    revealedRingSize,
                  })
                  setSwapApprovalDraft(null)
                }}
              >
                {approvingSwap ? 'Approving...' : 'Approve trade'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className={styles.workspaceSectionGrid}>
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
                requests.map((request) => {
                  const ruleCheckTarget = request.listing.design.collectionName
                    ? `${request.listing.design.typePrefix} / ${request.listing.design.collectionName}`
                    : request.listing.design.typePrefix

                  return (
                    <div key={request.id} className={styles.tradeRow}>
                      <div className={styles.tradeIdentity}>
                        <div className={styles.customerName}>{request.customerName}</div>
                        <div className={styles.customerDate}>
                          Wants {request.listing.design.itemNumber} - {request.listing.design.designName}
                        </div>
                        <div className={styles.helperNote}>{request.customerDescription}</div>
                        <div className={styles.helperNote}>
                          Rule check: compare against {ruleCheckTarget}
                        </div>
                      </div>
                      <div className={styles.actionRow}>
                        <button
                          type="button"
                          className={styles.actionButton}
                          disabled={actionState.pendingKey === `approve:${request.id}`}
                          onClick={() => {
                            setSwapApprovalDraft({
                              requestId: request.id,
                              customerName: request.customerName,
                            })
                            setRevealedItemNumber('')
                            setRevealedRingSize('')
                          }}
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
                  )
                })
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
            <div className={styles.walletSettingsTitle}>Swap cleanup</div>
            <span className={styles.rosterTag}>
              {tradeSwapCleanupState.status === 'ready'
                ? `${cleanupItems.length} to finish`
                : 'Loading'}
            </span>
          </div>
          {tradeSwapCleanupState.status === 'ready' ? (
            <div className={styles.tradeList}>
              {cleanupItems.length > 0 ? (
                cleanupItems.map((item) => (
                  <div key={item.swapId} className={styles.tradeRow}>
                    <div className={styles.tradeIdentity}>
                      <div className={styles.customerName}>{item.customerName}</div>
                      <div className={styles.customerDate}>
                        Revealed item number: {item.revealedItemNumber}
                      </div>
                      <div className={styles.helperNote}>
                        {item.replacementStatus === 'needs_ring_size'
                          ? 'Add ring size to put this reveal back on the board.'
                          : 'Finish catalog details after the show to put this reveal back on the board.'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  No trade swaps need cleanup right now.
                </div>
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
            <div className={styles.walletSettingsTitle}>Board Inventory</div>
            <span className={styles.rosterTag}>
              {tradeBoardState.status === 'ready' && boardSummary
                ? `${boardSummary.totalPieces} live pieces`
                : 'Loading board'}
            </span>
          </div>
          {tradeBoardState.status === 'ready' && boardSummary ? (
            <>
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
                  onChange={(event) => {
                    setInventoryCarouselIndex(0)
                    onTradeBoardSearchQueryChange(event.target.value)
                  }}
                  placeholder="Search by item number, design, or collection"
                />
              </label>
              <div className={styles.boardInventoryControls}>
                <select
                  aria-label="Jewelry Type"
                  value={inventoryJewelryType}
                  className={styles.boardInventorySelect}
                  disabled={boardListings.length === 0}
                  onChange={(event) => {
                    setInventoryCarouselIndex(0)
                    setInventoryJewelryType(event.target.value)
                  }}
                >
                  <option value="">Jewelry Type</option>
                  {inventoryOptions.jewelryTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Collection"
                  value={inventoryCollection}
                  className={styles.boardInventorySelect}
                  disabled={boardListings.length === 0}
                  onChange={(event) => {
                    setInventoryCarouselIndex(0)
                    setInventoryCollection(event.target.value)
                  }}
                >
                  <option value="">Collection</option>
                  {inventoryOptions.collections.map((collection) => (
                    <option key={collection} value={collection}>
                      {collection}
                    </option>
                  ))}
                </select>
                {hasActiveInventoryBrowse ? (
                  <button
                    type="button"
                    className={styles.boardInventoryReset}
                    onClick={handleResetInventoryBrowse}
                  >
                    Reset
                  </button>
                ) : null}
              </div>
              {hasActiveInventoryBrowse ? (
                inventoryResults.length > 0 ? (
                  <div
                    className={styles.boardInventoryCarousel}
                    aria-label="Filtered active board pieces"
                  >
                    <div className={styles.boardInventoryCarouselHeader}>
                      <span className={styles.helperNote}>{carousel.rangeLabel}</span>
                      <div className={styles.boardInventoryArrowGroup}>
                        <button
                          type="button"
                          className={styles.boardInventoryArrow}
                          disabled={!carousel.canGoPrevious}
                          onClick={() =>
                            setInventoryCarouselIndex(
                              Math.max(
                                0,
                                carousel.startIndex - inventoryCarouselPageSize,
                              ),
                            )
                          }
                          aria-label="Previous board inventory pieces"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          className={styles.boardInventoryArrow}
                          disabled={!carousel.canGoNext}
                          onClick={() =>
                            setInventoryCarouselIndex(
                              carousel.startIndex + inventoryCarouselPageSize,
                            )
                          }
                          aria-label="Next board inventory pieces"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                    {isInventoryBrowseLoading ? (
                      <div className={styles.helperNote}>Loading board pieces...</div>
                    ) : null}
                    <div className={styles.boardInventoryCarouselGrid}>
                      {carousel.visibleItems.map((listing) => {
                        const photoUrl = getTradeListingPhotoUrl(listing)
                        return (
                          <div key={listing.id} className={styles.boardInventoryPieceCard}>
                            <button
                              type="button"
                              className={styles.boardInventoryMediaButton}
                              aria-label={`Open image preview for ${listing.design.design_name}`}
                              onClick={() => setPreviewListing(listing)}
                            >
                              <span className={styles.boardInventoryMedia}>
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
                            <div className={styles.boardInventoryPieceBody}>
                              <div className={styles.customerName}>
                                {listing.design.design_name}
                              </div>
                              <div className={styles.tradePieceMetaLine}>
                                {listing.design.item_number}
                              </div>
                              <div className={styles.tradePieceMetaLine}>
                                {listing.design.type_prefix}
                                {listing.design.collection?.name
                                  ? ` - ${listing.design.collection.name}`
                                  : ''}
                              </div>
                              <div className={styles.timelineItem}>
                                {formatTradeMoney(listing.design.bp_msrp)}
                              </div>
                            </div>
                            <button
                              type="button"
                              className={styles.boardInventoryRemoveButton}
                              disabled={actionState.pendingKey === `remove:${listing.id}`}
                              onClick={() => onRemoveListing(listing.id)}
                            >
                              {actionState.pendingKey === `remove:${listing.id}`
                                ? 'Removing...'
                                : 'Remove'}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    {isInventoryBrowseLoading
                      ? 'Loading board pieces...'
                      : 'No board pieces match this search.'}
                  </div>
                )
              ) : (
                <div className={styles.emptyState}>
                  Use search or filters to browse pieces currently on your board.
                </div>
              )}
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
                          {item.itemNumber} - {item.designName}
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
                    {history.summary.avgFulfillmentDays?.toFixed(1) ?? '-'}
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
                          {item.design.itemNumber} - {item.design.designName}
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
            {state.results.map((result) => {
              const collectionLabel = [
                result.collectionName,
                result.collectionYear ? String(result.collectionYear) : null,
              ]
                .filter(Boolean)
                .join(' - ')
              const visibleTags = (result.searchTags ?? []).slice(0, 4)

              return (
                <div key={result.designId} className={styles.tradeRow}>
                  <div className={styles.tradeIdentity}>
                    <div className={styles.customerName}>{result.designName}</div>
                    <div className={styles.customerDate}>
                      {result.itemNumber}
                      {collectionLabel ? ` - ${collectionLabel}` : ''}
                      {result.material ? ` - ${result.material}` : ''}
                    </div>
                    {visibleTags.length > 0 ? (
                      <div className={styles.libraryTagList}>
                        {visibleTags.map((tag) => (
                          <span key={`${result.designId}:${tag}`} className={styles.libraryTag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
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
              )
            })}
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
                      {MESSAGE_TYPE_LABELS[message.messageType]} - {formatCompactDateTime(message.createdAt)}
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

function getResourcesByType(
  resources: HelpResource[] | undefined,
  type: HelpResource['type'],
) {
  return resources?.filter((resource) => resource.type === type) ?? []
}

function getWorkflowResourcesByGroup(resources: HelpResource[] | undefined) {
  const workflows = getResourcesByType(resources, 'workflow')

  return HELP_RESOURCE_GROUP_ORDER.map((group) => ({
    group,
    resources: workflows.filter((resource) => resource.group === group),
  })).filter((section) => section.resources.length > 0)
}

function getRecommendedCustomerSiteLooks() {
  return FIRST_START_SKIN_RECOMMENDATIONS.map((recommendation) => {
    const skin = AMETHYST_SKIN_CARDS.find((candidate) => candidate.id === recommendation.id)
    return skin ? { ...recommendation, skin } : null
  }).filter((item): item is NonNullable<typeof item> => item !== null)
}

function CustomerSiteLooksReference() {
  const recommendedSkins = getRecommendedCustomerSiteLooks()

  return (
    <details className={styles.customerSiteLooks}>
      <summary className={styles.playbookGroupSummary}>
        <span className={styles.disclosureChevron} aria-hidden="true">&gt;</span>
        <div>
          <div className={styles.walletSettingsTitle}>Customer Site Looks</div>
          <div className={styles.helperNote}>
            Reference polished customer-site looks when you want a refreshed storefront.
          </div>
        </div>
        <span className={styles.rosterTag}>Open section</span>
      </summary>
      <div className={styles.customerSiteLooksBody}>
        <div className={styles.calendarHeader}>
          <div>
            <div className={styles.walletSettingsTitle}>Recommended first picks</div>
            <div className={styles.helperNote}>
              Good starting points when you want a clean, customer-ready look.
            </div>
          </div>
          <span className={styles.rosterTag}>Quick reference</span>
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
                <span className={styles.timelineItem}>Select in Site appearance</span>
                <span className={styles.timelineItem}>{skin.label}</span>
              </div>
            </div>
          ))}
        </div>
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
    </details>
  )
}

export function HelpResourcesCard({
  state,
  hasPaidWorkspace: _hasPaidWorkspace,
}: {
  state: ResourcesState
  hasPaidWorkspace: boolean
}) {
  const [reportForm, setReportForm] = useState<HelpSupportReportForm>(
    DEFAULT_SUPPORT_REPORT_FORM,
  )
  const [reportSubmitState, setReportSubmitState] = useState<{
    pending: boolean
    error: string | null
    message: string | null
  }>({ pending: false, error: null, message: null })
  const supportReportTitleRef = useRef<HTMLInputElement | null>(null)
  const workflowGroups = getWorkflowResourcesByGroup(state.resources)
  const featureReferences = getResourcesByType(state.resources, 'feature_reference')
    .filter((resource) => resource.group === 'Feature Index')
  async function submitSupportReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setReportSubmitState({ pending: true, error: null, message: null })

    try {
      const response = await fetch('/api/nic-nac/support-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: reportForm.reportType,
          urgency: reportForm.urgency,
          pageOrWorkflow: reportForm.pageOrWorkflow.trim() || undefined,
          title: reportForm.title.trim(),
          details: reportForm.details.trim(),
          expectedResult: reportForm.expectedResult.trim() || undefined,
          actualResult: reportForm.actualResult.trim() || undefined,
          contactOk: reportForm.contactOk,
        }),
      })
      const result = await response.json().catch(() => ({})) as {
        notificationStatus?: 'delivered' | 'not_configured' | 'failed'
        error?: string
      }

      if (!response.ok) {
        throw new Error(result.error ?? 'Support report could not be saved right now.')
      }

      const notificationStatus = result.notificationStatus
      const message =
        notificationStatus === 'not_configured' || notificationStatus === 'failed'
          ? 'Report saved. The automatic Google Chat notification needs attention, so support may need to review the saved report manually.'
          : 'Report saved. Support has the details.'

      setReportSubmitState({ pending: false, error: null, message })
      setReportForm(DEFAULT_SUPPORT_REPORT_FORM)
    } catch (error) {
      setReportSubmitState({
        pending: false,
        error:
          error instanceof Error
            ? error.message
            : 'Support report could not be saved right now.',
        message: null,
      })
    }
  }

  function focusSupportReportForm() {
    supportReportTitleRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
    supportReportTitleRef.current?.focus()
  }

  function updateReportForm<Field extends keyof HelpSupportReportForm>(
    field: Field,
    value: HelpSupportReportForm[Field],
  ) {
    setReportForm((current) => ({ ...current, [field]: value }))
  }

  const supportReportForm = (
    <form
      className={styles.supportReportForm}
      onSubmit={submitSupportReport}
    >
      <div>
        <div className={styles.walletSettingsTitle}>
          Submit a support report
        </div>
        <div className={styles.helperNote}>
          Use this after you have started with the workflow guide, followed the
          steps that apply, and asked Nic-Nac if you are still blocked.
        </div>
      </div>
      <label className={styles.supportReportAcknowledgement}>
        <input
          type="checkbox"
          required
          checked={reportForm.workflowChecked}
          onChange={(event) =>
            updateReportForm('workflowChecked', event.target.checked)
          }
        />
        <span>
          I started at the top of Help & Resources, used the relevant workflow
          guide, followed the steps that applied, and still need support.
        </span>
      </label>
      <fieldset className={styles.supportReportFieldset}>
        <legend className={styles.searchLabel}>Report type</legend>
        <div className={styles.supportReportChoiceGrid}>
          {SUPPORT_REPORT_TYPE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={styles.supportReportChoice}
            >
              <input
                type="radio"
                name="support-report-type"
                value={option.value}
                checked={reportForm.reportType === option.value}
                onChange={() =>
                  updateReportForm('reportType', option.value)
                }
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className={styles.supportReportFieldset}>
        <legend className={styles.searchLabel}>Urgency</legend>
        <div className={styles.supportReportChoiceGrid}>
          {SUPPORT_REPORT_URGENCY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={styles.supportReportChoice}
            >
              <input
                type="radio"
                name="support-report-urgency"
                value={option.value}
                checked={reportForm.urgency === option.value}
                onChange={() =>
                  updateReportForm('urgency', option.value)
                }
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className={styles.supportReportFieldGrid}>
        <label className={styles.searchField}>
          <span className={styles.searchLabel}>Page or workflow</span>
          <input
            type="text"
            className={styles.searchInput}
            value={reportForm.pageOrWorkflow}
            onChange={(event) =>
              updateReportForm('pageOrWorkflow', event.target.value)
            }
            placeholder="Trade Board, Site Settings, Live Queue"
          />
        </label>
        <label className={styles.searchField}>
          <span className={styles.searchLabel}>Short title</span>
          <input
            ref={supportReportTitleRef}
            type="text"
            className={styles.searchInput}
            value={reportForm.title}
            required
            minLength={3}
            maxLength={160}
            onChange={(event) =>
              updateReportForm('title', event.target.value)
            }
            placeholder="What should support call this?"
          />
        </label>
      </div>
      <label className={styles.searchField}>
        <span className={styles.searchLabel}>Details</span>
        <textarea
          className={styles.supportReportTextarea}
          value={reportForm.details}
          required
          minLength={10}
          maxLength={3000}
          onChange={(event) =>
            updateReportForm('details', event.target.value)
          }
          placeholder="What happened? Include steps, links, or timing if it helps."
        />
      </label>
      <div className={styles.supportReportFieldGrid}>
        <label className={styles.searchField}>
          <span className={styles.searchLabel}>Expected result</span>
          <textarea
            className={styles.supportReportTextarea}
            value={reportForm.expectedResult}
            maxLength={1200}
            onChange={(event) =>
              updateReportForm('expectedResult', event.target.value)
            }
            placeholder="What did you expect to happen?"
          />
        </label>
        <label className={styles.searchField}>
          <span className={styles.searchLabel}>Actual result</span>
          <textarea
            className={styles.supportReportTextarea}
            value={reportForm.actualResult}
            maxLength={1200}
            onChange={(event) =>
              updateReportForm('actualResult', event.target.value)
            }
            placeholder="What happened instead?"
          />
        </label>
      </div>
      <label className={styles.supportReportContactToggle}>
        <input
          type="checkbox"
          checked={reportForm.contactOk}
          onChange={(event) =>
            updateReportForm('contactOk', event.target.checked)
          }
        />
        <span>Okay to contact me about this report</span>
      </label>
      {reportSubmitState.error ? (
        <div className={styles.actionError}>
          {reportSubmitState.error}
        </div>
      ) : null}
      {reportSubmitState.message ? (
        <div className={styles.helperMessage}>
          {reportSubmitState.message}
        </div>
      ) : null}
      <div className={styles.actionRow}>
        <button
          type="submit"
          className={styles.actionButton}
          disabled={reportSubmitState.pending}
        >
          {reportSubmitState.pending ? 'Saving...' : 'Send report'}
        </button>
      </div>
    </form>
  )

  return (
    <div className={styles.workspacePanel}>
      <div className={styles.workspaceSectionHeader}>
        <div>
          <div className={styles.cardTitle}>Help & Resources</div>
          <div className={styles.cardSubtitle}>
            Pick what you are trying to do. Nic-Nac can walk you through the steps when you want help.
          </div>
        </div>
      </div>
      {
        <>
          {state.status === 'ready' && state.resources ? (
            <div className={styles.playbookStack}>
              <div className={styles.playbookIntro}>
                <div>
                  <div className={styles.walletSettingsTitle}>Workflow Playbook</div>
                  <div className={styles.helperNote}>
                    Start with the outcome, then follow the same simple recipe every time.
                  </div>
                </div>
                <span className={styles.rosterTag}>Start here</span>
              </div>

              {workflowGroups.map((section) => (
                <details key={section.group} className={styles.playbookGroup}>
                  <summary className={styles.playbookGroupSummary}>
                    <span className={styles.disclosureChevron} aria-hidden="true">&gt;</span>
                    <span className={styles.playbookSummaryCopy}>
                      <span className={styles.customerName}>{section.group}</span>
                      <span className={styles.helperNote}>
                        {section.resources.length} guides
                      </span>
                    </span>
                    <span className={styles.rosterTag}>Open section</span>
                  </summary>
                  <div className={styles.playbookGuideList}>
                    {section.resources.map((resource) => (
                      <details key={resource.id} className={styles.playbookGuide}>
                        <summary className={styles.playbookGuideSummary}>
                          <span>
                            <span className={styles.customerName}>{resource.title}</span>
                            <span className={styles.helperNote}>{resource.summary}</span>
                          </span>
                          <span className={styles.rosterTag}>Open guide</span>
                        </summary>
                        <div className={styles.playbookGuideBody}>
                          <div className={styles.guideField}>
                            <span className={styles.searchLabel}>Goal</span>
                            <p>{resource.goal}</p>
                          </div>
                          <div className={styles.guideField}>
                            <span className={styles.searchLabel}>Use this when</span>
                            <p>{resource.useWhen}</p>
                          </div>
                          <div className={styles.guideField}>
                            <span className={styles.searchLabel}>Before you start</span>
                            <ul>
                              {resource.beforeYouStart.map((item) => (
                                <li key={`${resource.id}-before-${item}`}>{item}</li>
                              ))}
                            </ul>
                          </div>
                          <div className={styles.guideField}>
                            <span className={styles.searchLabel}>Steps</span>
                            <ol>
                              {resource.steps.map((step) => (
                                <li key={`${resource.id}-step-${step}`}>{step}</li>
                              ))}
                            </ol>
                          </div>
                          <div className={styles.guideField}>
                            <span className={styles.searchLabel}>Good result</span>
                            <p>{resource.goodResult}</p>
                          </div>
                          <div className={styles.guideField}>
                            <span className={styles.searchLabel}>Ask Nic-Nac</span>
                            <p>{resource.nicNacPrompt}</p>
                          </div>
                          <div className={styles.guideField}>
                            <span className={styles.searchLabel}>Still stuck</span>
                            <p>{resource.stillStuck}</p>
                          </div>
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
                        </div>
                      </details>
                    ))}
                  </div>
                </details>
              ))}

              <details className={styles.featureIndex}>
                <summary className={styles.playbookGroupSummary}>
                  <span className={styles.disclosureChevron} aria-hidden="true">&gt;</span>
                  <div>
                    <div className={styles.walletSettingsTitle}>Feature Index</div>
                    <div className={styles.helperNote}>
                      Use this when you already know which Sparkle Suite tool you need.
                    </div>
                  </div>
                  <span className={styles.rosterTag}>Open section</span>
                </summary>
                <div className={styles.featureIndexGrid}>
                  {featureReferences.map((resource) => (
                    <div key={resource.id} className={styles.featureIndexItem}>
                      <div className={styles.customerName}>{resource.title}</div>
                      <div className={styles.helperNote}>{resource.summary}</div>
                    </div>
                  ))}
                </div>
              </details>

              <details className={styles.supportPath} open>
                <summary className={styles.playbookGroupSummary}>
                  <span className={styles.disclosureChevron} aria-hidden="true">&gt;</span>
                  <div>
                    <div className={styles.walletSettingsTitle}>Support Path</div>
                    <div className={styles.helperNote}>
                      Start at the top of Help & Resources. Open the guide for
                      the workflow you were trying to complete, follow the
                      steps, then ask Nic-Nac if you are still blocked.
                    </div>
                  </div>
                  <span className={styles.rosterTag}>Open section</span>
                </summary>
                <div className={styles.supportReportCallout}>
                  <div>
                    <div className={styles.walletSettingsTitle}>
                      Send a report after the workflow steps
                    </div>
                    <div className={styles.helperNote}>
                      If the guide and Nic-Nac do not solve it, send the page,
                      expected result, and actual result so support has the full
                      trail.
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={focusSupportReportForm}
                  >
                    Start report
                  </button>
                </div>
                {supportReportForm}
              </details>
            </div>
          ) : state.status === 'error' ? (
            <div className={styles.playbookStack}>
              <div className={styles.emptyState}>
                Help resources are temporarily unavailable.
              </div>
              {supportReportForm}
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
      <div className={styles.workspaceSectionHeader}>
        <div>
          <div className={styles.cardTitle}>Site Settings</div>
          <div className={styles.cardSubtitle}>
            Keep your public profile, customer pages, and brand details tuned up.
          </div>
        </div>
        <span className={styles.rosterTag}>
          Preview updates before your customer site changes.
        </span>
      </div>
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
          <span className={styles.searchLabel}>Show name</span>
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
      </div>

      <div className={styles.siteSettingsSection}>
        <div className={styles.walletSettingsTitle}>Ticker and join page</div>
        <div className={styles.siteSettingsGrid}>
          <label className={styles.sortFieldWide}>
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
          <label className={styles.sortFieldWide}>
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
          <label className={styles.sortField}>
            <span className={styles.sortLabel}>Hero motion</span>
            <select
              className={styles.sortSelect}
              value={draft.heroAnimationType}
              onChange={(event) =>
                onDraftChange?.({
                  heroAnimationType: event.target.value as SiteSettingsDashboardResult['heroAnimationType'],
                })
              }
            >
              <option value="sparkle_rise">Sparkle rise</option>
              <option value="soft_glow">Soft glow</option>
              <option value="still">Still</option>
            </select>
            <span className={styles.siteSettingsPreviewNote}>
              Hero visuals stay curated by your site appearance so the page keeps
              its polish on desktop and mobile.
            </span>
          </label>
        </div>
        <CustomerSiteLooksReference />
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
          {actionState?.pending ? 'Saving...' : 'Save site settings'}
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
      <div className={styles.workspaceSectionHeader}>
        <div>
          <div className={styles.cardTitle}>Account</div>
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
                        {formatAccountBillingDate(invoice.createdAt)} -{' '}
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
              href="/terms-and-conditions?returnTo=%2Fnic-nac%3Fsection%3Daccount"
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

export function ReferralProgramCard({
  referral,
}: {
  referral: AccountBillingDashboardResult['referral']
}) {
  const [copiedTarget, setCopiedTarget] = useState<'code' | 'link' | null>(null)
  const canCopyCode = Boolean(referral.code)
  const canCopyLink = Boolean(referral.link)

  async function copyReferralValue(
    target: 'code' | 'link',
    value: string | null,
  ) {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopiedTarget(target)
    window.setTimeout(() => setCopiedTarget(null), 1800)
  }

  return (
    <div className={styles.referralCard}>
      <div className={styles.workspaceSectionHeader}>
        <div>
          <div className={styles.cardTitle}>Referral program</div>
          <div className={styles.accountMuted}>
            Share your code. After a referred rep has three paid subscription
            months, your account gets one month credited.
          </div>
        </div>
      </div>

      <div className={styles.referralCodePanel}>
        <div className={styles.referralCodeBlock}>
          <span className={styles.walletTransactionDate}>Your code</span>
          <strong>{referral.code ?? 'Generating soon'}</strong>
        </div>
        <div className={styles.referralActions}>
          <button
            type="button"
            className={styles.secondaryActionButton}
            disabled={!canCopyCode}
            onClick={() => copyReferralValue('code', referral.code)}
          >
            {copiedTarget === 'code' ? 'Copied' : 'Copy code'}
          </button>
          <button
            type="button"
            className={styles.secondaryActionButton}
            disabled={!canCopyLink}
            onClick={() => copyReferralValue('link', referral.link)}
          >
            {copiedTarget === 'link' ? 'Copied' : 'Copy link'}
          </button>
        </div>
      </div>

      {referral.link ? (
        <div className={styles.referralLinkValue}>{referral.link}</div>
      ) : null}

      <div className={styles.referralStats} aria-label="Referral status counts">
        <span>{referral.pendingCount} pending</span>
        <span>{referral.earnedCount} earned</span>
        <span>{referral.creditedCount} credited</span>
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
      <div className={styles.workspaceSectionHeader}>
        <div>
          <div className={styles.cardTitle}>Calendar</div>
          <div className={styles.cardSubtitle}>
            Review upcoming shows, recent history, and what is visible on the public calendar.
          </div>
        </div>
        <span className={styles.rosterTag}>
          Read-only here. Ask Nic-Nac to add or edit shows.
        </span>
      </div>
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
                      {formatCalendarEventDate(event.eventTime, event.timeZone)} at{' '}
                      {formatCalendarEventTime(event.eventTime, event.timeZone)} on{' '}
                      {event.platform}
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
                      {formatCalendarEventDate(event.eventTime, event.timeZone)} on{' '}
                      {event.platform}
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
      <div className={styles.workspaceSectionHeader}>
        <div>
          <div className={styles.cardTitle}>SMS Wallet</div>
          <div className={styles.cardSubtitle}>
            Monitor text balance, reloads, and auto-recharge from one account view.
          </div>
        </div>
        <span className={styles.rosterTag}>
          {summary.autoRechargeEnabled ? 'Auto-recharge on' : 'Auto-recharge off'}
        </span>
      </div>
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
