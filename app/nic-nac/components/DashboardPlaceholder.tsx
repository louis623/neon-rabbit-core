'use client'

import Link from 'next/link'
import type { FormEvent } from 'react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type {
  AccountBillingDashboardResult,
  BoardResult,
  CalendarEvent,
  CustomerAudienceMember,
  CustomerAudienceSummary,
  FulfillmentQueueItem,
  HelpResource,
  JoinTeamMember,
  UpsertJoinTeamMemberInput,
  JewelryDatabaseResult,
  PublicSiteRecipe,
  RepMessagesDashboardResult,
  SiteSettingsDashboardResult,
  SiteAnalyticsDashboardResult,
  SiteAppearancePreset,
  TradeListingWithDesign,
  TradeRequestWithListing,
  TradeSwapCleanupItem,
  WalletDashboardResult,
  WalletTransactionSummary,
} from '@/lib/services/types'
import { SMS_CHARGE_MILS, walletMilsToUsd } from '@/lib/services/wallet-units'
import { NIC_NAC_WORKSPACE_REFRESH_EVENT } from '@/lib/nic-nac/workspace-refresh-events'
import { SparkleSeal } from '@/app/prelaunch/_components/PrelaunchVisuals'
import {
  DEFAULT_AMETHYST_APPEARANCE_PRESET,
  normalizeAmethystAppearancePreset,
} from '@/lib/amethyst/appearance-presets'
import { AMETHYST_SKIN_CARDS } from '@/lib/amethyst/skin-cards'
import {
  buildCustomerSparkleSiteHref,
  buildCustomerTradeBoardHref,
} from '@/lib/nic-nac/rep-links'
import { sparkleSuitePublicLandingContent } from '@/lib/sparkle-suite/public-landing-content'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Gem,
  HelpCircle,
  MessagesSquare,
  Search,
  Settings2,
  Sparkles,
  Users,
  WalletCards,
  Wrench,
  X,
} from 'lucide-react'
import { WorkspaceShell } from './WorkspaceShell'
import type { WorkspaceSectionTab } from './WorkspaceSectionTabs'
import { TradeBoardWorkspaceCard } from './TradeBoardWorkspaceCard'
import styles from './DashboardPlaceholder.module.css'

export {
  buildCustomerSparkleSiteHref,
  buildCustomerTradeBoardHref,
}

const WORKSPACE_SECTIONS = [
  {
    key: 'trade-board',
    label: 'Trade Board',
    shortLabel: 'Trade',
    icon: Gem,
  },
  {
    key: 'jewelry-library',
    label: 'Jewelry Library',
    shortLabel: 'Library',
    icon: Search,
  },
  {
    key: 'show-calendar',
    label: 'Calendar',
    shortLabel: 'Calendar',
    icon: CalendarDays,
  },
  {
    key: 'business-tools',
    label: 'Business Tools',
    shortLabel: 'Tools',
    icon: Wrench,
  },
  {
    key: 'team-management',
    label: 'Team Management',
    shortLabel: 'Team',
    icon: Users,
  },
  {
    key: 'messages',
    label: 'Messages',
    shortLabel: 'Messages',
    icon: MessagesSquare,
    comingSoon: true,
  },
  {
    key: 'site-settings',
    label: 'Site Settings',
    shortLabel: 'Site',
    icon: Settings2,
  },
  {
    key: 'recipes',
    label: 'Recipes',
    shortLabel: 'Recipes',
    icon: Sparkles,
  },
  {
    key: 'help-resources',
    label: 'Help & Resources',
    shortLabel: 'Help',
    icon: HelpCircle,
  },
  {
    key: 'account',
    label: 'Account',
    shortLabel: 'Account',
    icon: WalletCards,
  },
] as const satisfies readonly WorkspaceSectionTab<string>[]

const TRADE_WORKSPACE_REFRESH_MS = 15_000
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

export function buildSiteRecipesFetchUrl() {
  return '/api/nic-nac/site-recipes'
}

export function getJewelryLibrarySearchErrorMessage(_status?: number) {
  return 'Unable to search the jewelry library right now. Try again in a minute, or ask Nic-Nac to help look up the piece.'
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

export function formatHeaderRepName(displayName?: string | null) {
  return displayName?.trim() || 'Rep info loading'
}

export function formatHeaderShowName(businessName?: string | null) {
  return businessName?.trim() || 'Show info loading'
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

const BLING_KITCHEN_RECIPE_REP_IDS = new Set([
  '9a971c05-3631-443e-bcb8-4e9a26e15885',
])
const BLING_KITCHEN_RECIPE_SLUGS = new Set(['blingkitchen', 'bling-kitchen'])

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
  if (requested === 'business-calculator') return 'business-tools'
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

export function hasBlingKitchenRecipeWorkspaceAccess(input: {
  repId?: string | null
  publicSiteSlug?: string | null
}) {
  const repId = input.repId?.trim().toLowerCase() ?? ''
  const slug = input.publicSiteSlug?.trim().toLowerCase() ?? ''

  return (
    BLING_KITCHEN_RECIPE_REP_IDS.has(repId) ||
    BLING_KITCHEN_RECIPE_SLUGS.has(slug)
  )
}

export function getVisibleWorkspaceSections(
  _hasPaidWorkspace: boolean,
  hasRecipeWorkspaceAccess = false,
) {
  return WORKSPACE_SECTIONS.filter(
    (section) => section.key !== 'recipes' || hasRecipeWorkspaceAccess,
  )
}

export function resolveWorkspaceSectionForAccess(
  section: WorkspaceSectionKey,
  _hasPaidWorkspace: boolean,
  hasRecipeWorkspaceAccess = true,
): WorkspaceSectionKey {
  if (isComingSoonWorkspaceSection(section)) return 'trade-board'
  if (section === 'recipes' && !hasRecipeWorkspaceAccess) return 'trade-board'
  return section
}

export function shouldShowWorkspaceAccessNotice(
  section: WorkspaceSectionKey,
  hasPaidWorkspace: boolean,
  isAccessLoading = false,
) {
  return (
    !isAccessLoading &&
    !hasPaidWorkspace &&
    section !== 'help-resources' &&
    section !== 'account'
  )
}

export function shouldShowWorkspaceLoadingSkeleton(
  section: WorkspaceSectionKey,
  isAccessLoading: boolean,
) {
  return (
    isAccessLoading &&
    section !== 'help-resources' &&
    section !== 'account'
  )
}

function getWorkspaceSectionLabel(section: WorkspaceSectionKey) {
  return (
    WORKSPACE_SECTIONS.find((workspaceSection) => workspaceSection.key === section)
      ?.label ?? 'Workspace'
  )
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

type RecipesState = {
  status: 'idle' | 'loading' | 'ready' | 'error'
  recipes: PublicSiteRecipe[]
}

type RecipeActionState = {
  pendingKey: string | null
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

type TradeSwapCleanupState = {
  status: 'loading' | 'ready' | 'error'
  items?: TradeSwapCleanupItem[]
}

type JewelryLibraryState = {
  status: 'idle' | 'loading' | 'ready' | 'error'
  results?: JewelryDatabaseResult[]
  facets?: JewelryLibraryFacets
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

type TeamManagementAccess = {
  enabled: boolean
  status: 'not_enabled' | 'manual_beta' | 'active' | 'past_due' | 'disabled'
  source: 'manual_beta' | 'stripe_addon' | null
}

type TeamOnboardingParticipant = {
  id: string
  displayName: string
  contactEmail: string | null
  status: 'invited' | 'started' | 'needs_help' | 'completed' | 'archived'
  accessUrl?: string
  progress: {
    completed: number
    needsHelp: number
    total: number
  }
  unreadMessageCount: number
  lastActivityAt: string | null
  createdAt: string | null
}

type TeamManagementState =
  | {
      status: 'loading'
      access?: TeamManagementAccess
      participants?: TeamOnboardingParticipant[]
      publicTeamRoster?: JoinTeamMember[]
    }
  | {
      status: 'locked'
      access: TeamManagementAccess
      participants?: TeamOnboardingParticipant[]
      publicTeamRoster?: JoinTeamMember[]
    }
  | {
      status: 'ready'
      access: TeamManagementAccess
      participants: TeamOnboardingParticipant[]
      publicTeamRoster?: JoinTeamMember[]
    }
  | {
      status: 'error'
      access?: TeamManagementAccess
      participants?: TeamOnboardingParticipant[]
      publicTeamRoster?: JoinTeamMember[]
    }

type TeamManagementActionState = {
  pendingKey: string | null
  error: string | null
  helperMessage: string | null
}

type TeamManagementCreateDraft = {
  displayName: string
  contactEmail: string
}

export type JoinTeamRosterDraft = {
  id?: string
  displayName: string
  businessName: string
  state?: string
  city?: string
  initials?: string
  photoUrl: string
  photoAlt?: string
  imageClassName?: string
  bio?: string
  sortOrder?: number
  tiktok: string
  facebook: string
  instagram: string
  website: string
  youtube: string
  isVisible: boolean
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

export type RecipeDraft = {
  id?: string
  title: string
  slug: string
  description: string
  category: string
  prepTime: string
  servings: string
  imageUrl: string
  imageAlt: string
  imagePosition: string
  modalImageUrl: string
  modalImagePosition: string
  tiktokUrl: string
  ingredientsText: string
  stepsText: string
  note: string
  isVisible: boolean
  sourceRecipeId: string
  recipeCardImageUrls: string[]
}

type SiteRecipeBuilderDraft = {
  title?: string
  description?: string
  category?: string
  prepTime?: string
  servings?: number | null
  ingredients?: string[]
  steps?: string[]
  note?: string
  imageAlt?: string
  warnings?: string[]
}

const BLING_KITCHEN_RECIPE_CATEGORIES = [
  'Baking',
  'Italian Classics',
  'Weeknight Dinners',
  'No-Bake Treats',
  'Drinks & Extras',
  'Holiday Favorites',
  'Breakfast',
  'Dessert',
  'Appetizer',
]

type RecipeEditorMode = 'builder' | 'manual'

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
    secret_rep_id_number?: string | null
  }
}

type WalletResponsePayload = WalletDashboardResult
type SiteSettingsResponsePayload = SiteSettingsDashboardResult
type SiteRecipesResponsePayload = {
  recipes?: PublicSiteRecipe[]
  recipe?: PublicSiteRecipe
  draft?: SiteRecipeBuilderDraft
  error?: string
}
type AccountBillingResponsePayload = AccountBillingDashboardResult
type TradeBoardResponsePayload = BoardResult
type TradeRequestsResponsePayload = TradeRequestWithListing[]
type FulfillmentQueueResponsePayload = FulfillmentQueueItem[]
type TradeSwapCleanupResponsePayload = TradeSwapCleanupItem[]
type JewelryLibraryFacetOption = {
  value: string
  count: number
}
type JewelryLibraryFacets = {
  collections: JewelryLibraryFacetOption[]
  materials: JewelryLibraryFacetOption[]
  stones: JewelryLibraryFacetOption[]
  types: JewelryLibraryFacetOption[]
  labels: JewelryLibraryFacetOption[]
  years: JewelryLibraryFacetOption[]
}
type JewelryLibraryFilters = {
  q: string
  type: string
  collection: string
  material: string
  stone: string
  label: string
  year: string
  limit: number
}
type JewelryLibraryResponsePayload =
  | JewelryDatabaseResult[]
  | {
      items?: JewelryDatabaseResult[]
      facets?: Partial<JewelryLibraryFacets>
    }
type MessagesResponsePayload = RepMessagesDashboardResult
type TeamManagementResponsePayload = {
  access: TeamManagementAccess
  participants?: TeamOnboardingParticipant[]
  participant?: TeamOnboardingParticipant
  accessUrl?: string
  error?: string
}
type JoinTeamRosterResponsePayload = {
  members?: JoinTeamMember[]
  member?: JoinTeamMember
  error?: string
}
type ResourcesResponsePayload = HelpResource[]
type AnalyticsResponsePayload = SiteAnalyticsDashboardResult

const JEWELRY_LIBRARY_DEFAULT_LIMIT = 24
const EMPTY_JEWELRY_LIBRARY_FACETS: JewelryLibraryFacets = {
  collections: [],
  materials: [],
  stones: [],
  types: [],
  labels: [],
  years: [],
}
const EMPTY_JEWELRY_LIBRARY_FILTERS: JewelryLibraryFilters = {
  q: '',
  type: '',
  collection: '',
  material: '',
  stone: '',
  label: '',
  year: '',
  limit: JEWELRY_LIBRARY_DEFAULT_LIMIT,
}

const EMPTY_JOIN_TEAM_ROSTER_DRAFT: JoinTeamRosterDraft = {
  displayName: '',
  businessName: '',
  photoUrl: '',
  tiktok: '',
  facebook: '',
  instagram: '',
  website: '',
  youtube: '',
  isVisible: true,
}

function cleanOptionalText(value?: string | null) {
  return value?.trim() ?? ''
}

export function getJoinTeamRosterDraft(
  member?: JoinTeamMember | null,
): JoinTeamRosterDraft {
  if (!member) return { ...EMPTY_JOIN_TEAM_ROSTER_DRAFT }

  return {
    id: member.id,
    displayName: member.displayName,
    businessName: member.businessName,
    state: member.state,
    city: member.city,
    initials: member.initials,
    photoUrl: member.photoUrl,
    photoAlt: member.photoAlt,
    imageClassName: member.imageClassName,
    bio: member.bio,
    sortOrder: member.sortOrder,
    tiktok: member.links.tiktok ?? '',
    facebook: member.links.facebook ?? '',
    instagram: member.links.instagram ?? '',
    website: member.links.website ?? '',
    youtube: member.links.youtube ?? '',
    isVisible: member.isVisible,
  }
}

export function buildJoinTeamRosterSavePayload(
  draft: JoinTeamRosterDraft,
): UpsertJoinTeamMemberInput {
  const displayName = cleanOptionalText(draft.displayName)
  const links = {
    ...(cleanOptionalText(draft.tiktok)
      ? { tiktok: cleanOptionalText(draft.tiktok) }
      : {}),
    ...(cleanOptionalText(draft.facebook)
      ? { facebook: cleanOptionalText(draft.facebook) }
      : {}),
    ...(cleanOptionalText(draft.instagram)
      ? { instagram: cleanOptionalText(draft.instagram) }
      : {}),
    ...(cleanOptionalText(draft.website)
      ? { website: cleanOptionalText(draft.website) }
      : {}),
    ...(cleanOptionalText(draft.youtube)
      ? { youtube: cleanOptionalText(draft.youtube) }
      : {}),
  }

  return {
    ...(draft.id ? { id: draft.id } : {}),
    displayName,
    businessName: cleanOptionalText(draft.businessName),
    ...('state' in draft ? { state: cleanOptionalText(draft.state) } : {}),
    ...('city' in draft ? { city: cleanOptionalText(draft.city) } : {}),
    ...('initials' in draft ? { initials: cleanOptionalText(draft.initials) } : {}),
    photoUrl: cleanOptionalText(draft.photoUrl),
    photoAlt:
      cleanOptionalText(draft.photoAlt) ||
      (displayName ? `${displayName} team profile photo` : ''),
    ...('imageClassName' in draft
      ? { imageClassName: cleanOptionalText(draft.imageClassName) }
      : {}),
    ...('bio' in draft ? { bio: cleanOptionalText(draft.bio) } : {}),
    ...(draft.sortOrder !== undefined ? { sortOrder: draft.sortOrder } : {}),
    links,
    isVisible: draft.isVisible,
  }
}

export function moveJoinTeamRosterMember<T extends { id: string }>(
  members: T[],
  memberId: string,
  direction: 'up' | 'down',
) {
  const ids = members.map((member) => member.id)
  const index = ids.indexOf(memberId)
  if (index < 0) return ids

  const nextIndex = direction === 'up' ? index - 1 : index + 1
  if (nextIndex < 0 || nextIndex >= ids.length) return ids

  const next = [...ids]
  const [moved] = next.splice(index, 1)
  next.splice(nextIndex, 0, moved)
  return next
}

type JewelryLibraryFilterField =
  | 'q'
  | 'type'
  | 'collection'
  | 'material'
  | 'stone'
  | 'label'
  | 'year'

type JewelryLibraryActiveFilter = {
  field: JewelryLibraryFilterField
  label: string
  value: string
}

const JEWELRY_LIBRARY_FACET_GROUPS: Array<{
  ariaLabel: string
  field: JewelryLibraryFilterField
  key: keyof JewelryLibraryFacets
  searchPlaceholder: string
  title: string
}> = [
  {
    ariaLabel: 'Search collections',
    field: 'collection',
    key: 'collections',
    searchPlaceholder: 'Search collections',
    title: 'Collections',
  },
  {
    ariaLabel: 'Search materials',
    field: 'material',
    key: 'materials',
    searchPlaceholder: 'Search materials',
    title: 'Materials',
  },
  {
    ariaLabel: 'Search stones',
    field: 'stone',
    key: 'stones',
    searchPlaceholder: 'Search stones',
    title: 'Stone / gem',
  },
  {
    ariaLabel: 'Search types',
    field: 'type',
    key: 'types',
    searchPlaceholder: 'Search types',
    title: 'Type',
  },
  {
    ariaLabel: 'Search labels',
    field: 'label',
    key: 'labels',
    searchPlaceholder: 'Search labels',
    title: 'Label',
  },
  {
    ariaLabel: 'Search years',
    field: 'year',
    key: 'years',
    searchPlaceholder: 'Search years',
    title: 'Year',
  },
]

function countJewelryFacetValues(values: Array<string | null | undefined>) {
  const counts = new Map<string, number>()
  for (const value of values) {
    const trimmed = value?.trim()
    if (!trimmed) continue
    counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => left.value.localeCompare(right.value))
}

function formatJewelryLibraryType(typePrefix: JewelryDatabaseResult['typePrefix']) {
  const labels: Record<JewelryDatabaseResult['typePrefix'], string> = {
    BR: 'bracelet',
    ER: 'earrings',
    NK: 'necklace',
    RG: 'ring',
    ST: 'stack',
  }
  return labels[typePrefix] ?? typePrefix.toLowerCase()
}

function deriveJewelryLibraryLabel(result: JewelryDatabaseResult) {
  const explicitTags = (result.searchTags ?? []).map((tag) =>
    tag.trim().toLowerCase(),
  )
  if (explicitTags.includes('unicorn')) return 'unicorn'
  if (explicitTags.includes('diamond')) return 'diamond'
  return 'standard'
}

function deriveJewelryLibraryFacets(results: JewelryDatabaseResult[]): JewelryLibraryFacets {
  return {
    collections: countJewelryFacetValues(results.map((result) => result.collectionName)),
    materials: countJewelryFacetValues(results.map((result) => result.material)),
    stones: countJewelryFacetValues(results.map((result) => result.mainStone)),
    types: countJewelryFacetValues(results.map((result) => formatJewelryLibraryType(result.typePrefix))),
    labels: countJewelryFacetValues(results.map(deriveJewelryLibraryLabel)),
    years: countJewelryFacetValues(
      results.map((result) =>
        result.collectionYear ? String(result.collectionYear) : undefined,
      ),
    ),
  }
}

function normalizeJewelryLibraryFacetList(
  options: JewelryLibraryFacetOption[] | undefined,
) {
  return (options ?? []).flatMap((option) => {
    const value = option.value?.trim()
    const count = Number.isFinite(option.count) ? Math.max(0, option.count) : 0
    return value && count > 0 ? [{ value, count }] : []
  })
}

function normalizeJewelryLibraryFacets(
  facets: Partial<JewelryLibraryFacets> | undefined,
): JewelryLibraryFacets {
  return {
    collections: normalizeJewelryLibraryFacetList(facets?.collections),
    materials: normalizeJewelryLibraryFacetList(facets?.materials),
    stones: normalizeJewelryLibraryFacetList(facets?.stones),
    types: normalizeJewelryLibraryFacetList(facets?.types),
    labels: normalizeJewelryLibraryFacetList(facets?.labels),
    years: normalizeJewelryLibraryFacetList(facets?.years),
  }
}

function getJewelryLibraryActiveFilters(
  filters: JewelryLibraryFilters,
): JewelryLibraryActiveFilter[] {
  const values: JewelryLibraryActiveFilter[] = []
  if (filters.q.trim()) values.push({ field: 'q', label: 'Search', value: filters.q.trim() })
  if (filters.type) values.push({ field: 'type', label: 'Type', value: filters.type })
  if (filters.collection) {
    values.push({ field: 'collection', label: 'Collection', value: filters.collection })
  }
  if (filters.material) values.push({ field: 'material', label: 'Material', value: filters.material })
  if (filters.stone) values.push({ field: 'stone', label: 'Stone', value: filters.stone })
  if (filters.label) values.push({ field: 'label', label: 'Label', value: filters.label })
  if (filters.year) values.push({ field: 'year', label: 'Year', value: filters.year })
  return values
}

function formatJewelryFacetValue(field: JewelryLibraryFilterField, value: string) {
  if (field === 'type' || field === 'label') {
    return value.replace(/^\w/, (letter) => letter.toUpperCase())
  }
  return value
}

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
  details: string
}

const DEFAULT_SUPPORT_REPORT_FORM: HelpSupportReportForm = {
  details: '',
}

function inferSupportReportType(details: string): HelpSupportReportType {
  if (/\b(idea|suggest|suggestion|upgrade|feature|improve|improvement)\b/i.test(details)) {
    return 'suggested_upgrade'
  }
  if (/\b(workflow|process|steps|guide|how do i|how to)\b/i.test(details)) {
    return 'workflow_idea'
  }
  if (/\b(site|website|page|link|customer-facing|public)\b/i.test(details)) {
    return 'site_issue'
  }
  return 'bug'
}

function inferSupportReportUrgency(details: string): HelpSupportReportUrgency {
  if (/\b(live|show|showtime|right now|urgent|blocked|blocking|can't|cannot|stuck)\b/i.test(details)) {
    return 'blocking'
  }
  return 'normal'
}

function buildSupportReportTitle(details: string): string {
  const compact = details.replace(/\s+/g, ' ').trim()
  const firstSentence = compact.split(/[.!?]\s/)[0]?.trim() || compact
  const title = firstSentence.replace(/[.!?]+$/, '').slice(0, 120).trim()
  return title.length >= 3 ? title : 'Quick support report'
}

function buildSupportReportPayload(details: string) {
  const normalizedDetails = details.trim()
  return {
    reportType: inferSupportReportType(normalizedDetails),
    urgency: inferSupportReportUrgency(normalizedDetails),
    title: buildSupportReportTitle(normalizedDetails),
    details: normalizedDetails,
    contactOk: true,
  }
}

const SOCIAL_HANDLE_FIELDS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'youtube', label: 'YouTube' },
]

const WORKSPACE_APPEARANCE_PRESET: SiteAppearancePreset =
  DEFAULT_AMETHYST_APPEARANCE_PRESET
const SITE_APPEARANCE_PRESET_OPTIONS = AMETHYST_SKIN_CARDS.map((skin) => ({
  value: skin.id as SiteAppearancePreset,
  label: `${skin.label} (${skin.code})`,
}))

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

function joinRecipeLines(items?: string[]) {
  return (items ?? []).join('\n')
}

function splitRecipeLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function getRecipeDraft(recipe?: PublicSiteRecipe | null): RecipeDraft {
  return {
    id: recipe?.id,
    title: recipe?.title ?? '',
    slug: recipe?.slug ?? '',
    description: recipe?.description ?? '',
    category: recipe?.category ?? '',
    prepTime: recipe?.prepTime ?? '',
    servings:
      typeof recipe?.servings === 'number' && Number.isFinite(recipe.servings)
        ? String(recipe.servings)
        : '',
    imageUrl: recipe?.imageUrl ?? '',
    imageAlt: recipe?.imageAlt ?? '',
    imagePosition: recipe?.imagePosition ?? 'center',
    modalImageUrl: recipe?.modalImageUrl ?? '',
    modalImagePosition: recipe?.modalImagePosition ?? 'center',
    tiktokUrl: recipe?.tiktokUrl ?? '',
    ingredientsText: joinRecipeLines(recipe?.ingredients),
    stepsText: joinRecipeLines(recipe?.steps),
    note: recipe?.note ?? '',
    isVisible: recipe?.isVisible ?? true,
    sourceRecipeId: recipe?.sourceRecipeId ?? '',
    recipeCardImageUrls: [],
  }
}

export function getRecipeDraftSavePayload(
  draft: RecipeDraft,
  options: { sortOrder?: number } = {},
) {
  const servings = draft.servings.trim()
  const parsedServings = servings ? Number.parseInt(servings, 10) : null

  return {
    id: draft.id,
    title: draft.title.trim(),
    slug: draft.slug.trim() || undefined,
    description: draft.description.trim(),
    category: draft.category.trim(),
    prepTime: draft.prepTime.trim(),
    servings: Number.isFinite(parsedServings) ? parsedServings : null,
    imageUrl: draft.imageUrl.trim(),
    imageAlt: draft.imageAlt.trim(),
    imagePosition: draft.imagePosition.trim() || 'center',
    modalImageUrl: draft.modalImageUrl.trim(),
    modalImagePosition: draft.modalImagePosition.trim() || 'center',
    tiktokUrl: draft.tiktokUrl.trim(),
    ingredients: splitRecipeLines(draft.ingredientsText),
    steps: splitRecipeLines(draft.stepsText),
    note: draft.note.trim(),
    sortOrder: options.sortOrder,
    isVisible: draft.isVisible,
    sourceRecipeId: draft.sourceRecipeId.trim(),
  }
}

export function getRecipeSaveStatusText(actionState?: RecipeActionState) {
  if (actionState?.pendingKey) return 'Saving recipe changes...'
  if (actionState?.error) return 'Recipe changes need attention.'
  return actionState?.helperMessage ?? 'Add a recipe when you are ready.'
}

function sortRecipesByOrder(recipes: PublicSiteRecipe[]) {
  return [...recipes].sort((a, b) => {
    const orderDelta = a.sortOrder - b.sortOrder
    if (orderDelta !== 0) return orderDelta
    return a.title.localeCompare(b.title)
  })
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(String(reader.result ?? '')))
    reader.addEventListener('error', () => reject(reader.error ?? new Error('Unable to read image file.')))
    reader.readAsDataURL(file)
  })
}

export function getSiteSettingsDraft(
  settings: SiteSettingsDashboardResult,
): SiteSettingsDraft {
  return {
    ...settings,
    appearancePreset: normalizeAmethystAppearancePreset(
      settings.appearancePreset,
    ) as SiteAppearancePreset,
    socialHandles: { ...settings.socialHandles },
  }
}

export function getWorkspaceSkinPreset(
  settings?: Pick<SiteSettingsDashboardResult, 'appearancePreset'> | null,
  draft?: Pick<SiteSettingsDraft, 'appearancePreset'> | null,
): SiteAppearancePreset {
  return WORKSPACE_APPEARANCE_PRESET
}

export function getNormalizedSiteSettingsDraft(
  draft: SiteSettingsDraft,
): SiteSettingsDraft {
  return {
    ...draft,
    appearancePreset: normalizeAmethystAppearancePreset(
      draft.appearancePreset,
    ) as SiteAppearancePreset,
  }
}

export function hasSiteSettingsUnsavedChanges({
  settings,
  draft,
}: {
  settings?: SiteSettingsDashboardResult | null
  draft?: SiteSettingsDraft | null
}) {
  if (!settings || !draft) return false
  return JSON.stringify(getNormalizedSiteSettingsDraft(draft)) !== JSON.stringify(settings)
}

export function getSiteSettingsManualSaveStatusText({
  settings,
  draft,
  actionState,
  statusMessage,
}: {
  settings?: SiteSettingsDashboardResult | null
  draft?: SiteSettingsDraft | null
  actionState?: SiteSettingsActionState
  statusMessage?: string | null
}) {
  if (!settings || !draft) return null
  if (actionState?.error) return 'Changes need attention.'
  if (actionState?.pending) return 'Saving changes...'
  if (hasSiteSettingsUnsavedChanges({ settings, draft })) {
    return 'Unsaved changes.'
  }
  return statusMessage ?? 'No unsaved changes.'
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

function getCalendarEventStatusLabel(event: CalendarEvent) {
  switch (event.status) {
    case 'live':
      return 'Live now'
    case 'completed':
      return 'Completed'
    case 'cancelled':
      return 'Cancelled'
    case 'scheduled':
    default:
      return 'Scheduled'
  }
}

function getCalendarStatusClassName(event: CalendarEvent) {
  const statusClass =
    event.status === 'live'
      ? styles.calendarStatusLive
      : event.status === 'completed'
        ? styles.calendarStatusCompleted
        : event.status === 'cancelled'
          ? styles.calendarStatusCancelled
          : styles.calendarStatusScheduled

  return statusClass
}

export function getShowCalendarMetrics(
  upcomingEvents: CalendarEvent[],
  recentEvents: CalendarEvent[],
  referenceDate = new Date(),
  monthEvents: CalendarEvent[] = upcomingEvents,
) {
  const displayTimeZone = getCalendarDisplayTimeZone([...upcomingEvents, ...recentEvents])
  const monthStart = getMonthStartInTimeZone(referenceDate, displayTimeZone)
  const monthKey = getDateKeyInTimeZone(monthStart, 'UTC').slice(0, 7)

  const thisMonthCount = monthEvents.filter((event) => {
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
  events: CalendarEvent[],
  referenceDate = new Date(),
): CalendarDayCell[] {
  const displayTimeZone = getCalendarDisplayTimeZone(events)
  const monthStart = getMonthStartInTimeZone(referenceDate, displayTimeZone)
  const gridStart = new Date(monthStart)
  gridStart.setUTCDate(monthStart.getUTCDate() - monthStart.getUTCDay())

  const todayKey = getDateKeyInTimeZone(referenceDate, displayTimeZone)
  const eventsByDay = new Map<string, CalendarEvent[]>()

  for (const event of events) {
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

function addCalendarMonths(referenceDate: Date, monthDelta: number) {
  const next = new Date(referenceDate)
  next.setUTCDate(1)
  next.setUTCMonth(next.getUTCMonth() + monthDelta)
  return next
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

function formatCalendarEventEndTime(
  eventTime: string,
  durationMinutes: number,
  timeZone = DEFAULT_CALENDAR_TIME_ZONE,
) {
  const endTime = new Date(Date.parse(eventTime) + durationMinutes * 60_000)
  return endTime.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
    timeZoneName: 'short',
  })
}

function formatCalendarDuration(durationMinutes: number) {
  if (durationMinutes < 60) return `${durationMinutes} minutes`

  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60
  const hourLabel = `${hours} ${hours === 1 ? 'hour' : 'hours'}`
  if (minutes === 0) return hourLabel
  return `${hourLabel} ${minutes} minutes`
}

function formatCalendarRecurrence(event: CalendarEvent) {
  if (!event.isRecurring) return 'One-time show'

  const cadence =
    event.recurrenceRule === 'daily'
      ? 'Daily'
      : event.recurrenceRule === 'weekday'
        ? 'Weekday'
      : event.recurrenceRule === 'weekly'
        ? 'Weekly'
        : 'Recurring'
  return `${cadence} series`
}

type CalendarEventDetailGroup = {
  label: string
  value?: string
  items?: string[]
}

export function getCalendarEventDetailGroups(
  event: CalendarEvent,
): CalendarEventDetailGroup[] {
  const title = getCalendarEventTitle(event)
  const timeZone = event.timeZone ?? DEFAULT_CALENDAR_TIME_ZONE
  const discountCodes =
    event.discountCodes.length > 0
      ? event.discountCodes.map((discount) =>
          discount.description
            ? `${discount.code}: ${discount.description}`
            : discount.code,
        )
      : ['No discount codes listed']
  const featuredCollections =
    event.featuredCollections && event.featuredCollections.length > 0
      ? event.featuredCollections
      : ['No featured collections listed']

  return [
    { label: 'Title', value: title },
    { label: 'Status', value: getCalendarEventStatusLabel(event) },
    { label: 'Platform', value: event.platform },
    {
      label: 'Date and time',
      value: `${formatCalendarEventDate(event.eventTime, timeZone)} at ${formatCalendarEventTime(
        event.eventTime,
        timeZone,
      )}`,
    },
    {
      label: 'End time',
      value: formatCalendarEventEndTime(
        event.eventTime,
        event.durationMinutes,
        timeZone,
      ),
    },
    { label: 'Duration', value: formatCalendarDuration(event.durationMinutes) },
    { label: 'Time zone', value: timeZone },
    { label: 'Recurrence', value: formatCalendarRecurrence(event) },
    { label: 'Discount codes', items: discountCodes },
    { label: 'Featured collections', items: featuredCollections },
    { label: 'Description', value: event.description?.trim() || 'No description' },
  ]
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
  const [recipesState, setRecipesState] = useState<RecipesState>({
    status: 'idle',
    recipes: [],
  })
  const [recipeActionState, setRecipeActionState] =
    useState<RecipeActionState>({
      pendingKey: null,
      error: null,
      helperMessage: null,
    })
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const [recipeDraft, setRecipeDraft] = useState<RecipeDraft>(() =>
    getRecipeDraft(),
  )
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
  const siteSettingsDraftRef = useRef<SiteSettingsDraft | null>(
    siteSettingsDraft,
  )
  const siteSettingsSaveRequestRef = useRef(0)
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
  const [tradeSwapCleanupState, setTradeSwapCleanupState] =
    useState<TradeSwapCleanupState>({
      status: reviewWorkspaceMode ? 'ready' : 'loading',
      items: reviewWorkspaceMode ? [] : undefined,
    })
  const [jewelryLibraryState, setJewelryLibraryState] =
    useState<JewelryLibraryState>({
      status: 'idle',
      results: [],
      facets: EMPTY_JEWELRY_LIBRARY_FACETS,
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
  const [teamManagementState, setTeamManagementState] =
    useState<TeamManagementState>(() =>
      reviewWorkspaceMode
        ? {
            status: 'locked',
            access: { enabled: false, status: 'not_enabled', source: null },
            participants: [],
            publicTeamRoster: [],
          }
        : { status: 'loading' },
    )
  const [teamManagementActionState, setTeamManagementActionState] =
    useState<TeamManagementActionState>({
      pendingKey: null,
      error: null,
      helperMessage: null,
    })
  const [teamCreateDraft, setTeamCreateDraft] =
    useState<TeamManagementCreateDraft>({
      displayName: '',
      contactEmail: '',
    })
  const [publicTeamDraft, setPublicTeamDraft] = useState<JoinTeamRosterDraft>(
    () => getJoinTeamRosterDraft(),
  )
  const [teamReplyDraft, setTeamReplyDraft] = useState('')
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
  const [libraryFilters, setLibraryFilters] = useState<JewelryLibraryFilters>(
    EMPTY_JEWELRY_LIBRARY_FILTERS,
  )
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
    const response = await fetch('/api/nic-nac/calendar-summary?upcoming=180&history=60', {
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

  async function loadSiteRecipes(
    signal?: AbortSignal,
    options: { preferredRecipeId?: string | null } = {},
  ) {
    setRecipesState((current) => ({
      status: 'loading',
      recipes: current.recipes,
    }))

    const response = await fetch(buildSiteRecipesFetchUrl(), {
      credentials: 'include',
      signal,
    })
    const payload = (await response.json().catch(() => null)) as
      | SiteRecipesResponsePayload
      | null
    if (!response.ok) {
      throw new Error(payload?.error || 'Unable to load site recipes right now.')
    }

    const recipes = sortRecipesByOrder(payload?.recipes ?? [])
    setRecipesState({
      status: 'ready',
      recipes,
    })
    const preferredRecipeId =
      options.preferredRecipeId === undefined
        ? selectedRecipeId
        : options.preferredRecipeId
    const selectedRecipe = preferredRecipeId
      ? recipes.find((recipe) => recipe.id === preferredRecipeId)
      : undefined
    setSelectedRecipeId(selectedRecipe?.id ?? null)
    setRecipeDraft(getRecipeDraft(selectedRecipe ?? null))
    return recipes
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

  async function loadTeamManagement(signal?: AbortSignal) {
    const response = await fetch('/api/nic-nac/team-onboarding/participants', {
      credentials: 'include',
      signal,
    })
    const payload = (await response.json().catch(() => null)) as
      | TeamManagementResponsePayload
      | null

    if (response.status === 403 && payload?.access) {
      setTeamManagementState({
        status: 'locked',
        access: payload.access,
        participants: [],
        publicTeamRoster: [],
      })
      return
    }

    if (!response.ok || !payload?.access) {
      throw new Error(payload?.error || `team management request failed: ${response.status}`)
    }

    let publicTeamRoster: JoinTeamMember[] = []
    try {
      publicTeamRoster = await loadJoinTeamRoster(signal)
    } catch (error) {
      if ((error as { name?: string }).name === 'AbortError') throw error
      setTeamManagementActionState({
        pendingKey: null,
        error: null,
        helperMessage: 'Onboarding is loaded. Public team cards could not load yet.',
      })
    }
    setTeamManagementState({
      status: 'ready',
      access: payload.access,
      participants: payload.participants ?? [],
      publicTeamRoster,
    })
  }

  async function loadJoinTeamRoster(signal?: AbortSignal) {
    const response = await fetch('/api/nic-nac/join-team-roster', {
      credentials: 'include',
      signal,
    })
    const payload = (await response.json().catch(() => null)) as
      | JoinTeamRosterResponsePayload
      | null
    if (!response.ok) {
      throw new Error(payload?.error || 'Unable to load public team cards right now.')
    }

    return payload?.members ?? []
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

  async function loadJewelryLibrary(filters: JewelryLibraryFilters, signal?: AbortSignal) {
    setJewelryLibraryState({
      status: 'loading',
      results: [],
      facets: jewelryLibraryState.facets ?? EMPTY_JEWELRY_LIBRARY_FACETS,
    })

    const params = new URLSearchParams()
    params.set('limit', String(filters.limit))
    if (filters.q.trim()) params.set('query', filters.q.trim())
    if (filters.type) params.set('type', filters.type)
    if (filters.collection) params.set('collection', filters.collection)
    if (filters.material) params.set('material', filters.material)
    if (filters.stone) params.set('stone', filters.stone)
    if (filters.label) params.set('label', filters.label)
    if (filters.year) params.set('year', filters.year)

    const response = await fetch(`/api/nic-nac/jewelry-library?${params.toString()}`, {
      credentials: 'include',
      signal,
    })
    if (!response.ok) {
      throw new Error(getJewelryLibrarySearchErrorMessage(response.status))
    }

    const payload = (await response.json()) as JewelryLibraryResponsePayload
    const nextResults = Array.isArray(payload) ? payload : (payload.items ?? [])
    const nextFacets = Array.isArray(payload)
      ? deriveJewelryLibraryFacets(payload)
      : normalizeJewelryLibraryFacets(payload.facets)
    setJewelryLibraryState({
      status: 'ready',
      results: nextResults,
      facets: nextFacets,
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
      loadTradeSwapCleanup(signal).catch((error) => {
        if ((error as { name?: string }).name === 'AbortError') return
        setTradeSwapCleanupState({ status: 'error' })
      }),
      loadMessages(signal).catch((error) => {
        if ((error as { name?: string }).name === 'AbortError') return
        setMessagesState({ status: 'error' })
      }),
      loadTeamManagement(signal).catch((error) => {
        if ((error as { name?: string }).name === 'AbortError') return
        setTeamManagementState((current) => ({
          status: 'error',
          access: current.access,
          participants: current.participants,
          publicTeamRoster: current.publicTeamRoster,
        }))
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

  useEffect(() => {
    siteSettingsDraftRef.current = siteSettingsDraft
  }, [siteSettingsDraft])

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
    setSiteSettingsActionState((current) => ({
      pending: current.pending,
      error: null,
      helperMessage: null,
    }))
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
    setSiteSettingsActionState((current) => ({
      pending: current.pending,
      error: null,
      helperMessage: null,
    }))
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

  function refreshLiveSitePreviewAfterSiteSettingsSave() {
    if (workspacePreview.mode === 'live_site_preview') {
      setPreviewFrameKey((current) => current + 1)
    }
  }

  async function saveSiteSettingsDraft(draftToSave: SiteSettingsDraft) {
    const requestId = siteSettingsSaveRequestRef.current + 1
    siteSettingsSaveRequestRef.current = requestId
    const normalizedDraft = getNormalizedSiteSettingsDraft(draftToSave)

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
        body: JSON.stringify(normalizedDraft),
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
      const latestDraft = siteSettingsDraftRef.current
      if (
        !latestDraft ||
        JSON.stringify(latestDraft) === JSON.stringify(normalizedDraft)
      ) {
        setSiteSettingsDraft(getSiteSettingsDraft(payload.settings))
      }
      if (siteSettingsSaveRequestRef.current === requestId) {
        setSiteSettingsActionState({
          pending: false,
          error: null,
          helperMessage: 'Site settings saved.',
        })
      }
      refreshLiveSitePreviewAfterSiteSettingsSave()
    } catch (error) {
      if (siteSettingsSaveRequestRef.current === requestId) {
        setSiteSettingsActionState({
          pending: false,
          error:
            error instanceof Error ? error.message : 'Unable to save site settings.',
          helperMessage: null,
        })
      }
    }
  }

  function handleSaveSiteSettings() {
    if (siteSettingsState.status !== 'ready' || !siteSettingsState.settings) return
    if (!siteSettingsDraft) return
    if (
      !hasSiteSettingsUnsavedChanges({
        settings: siteSettingsState.settings,
        draft: siteSettingsDraft,
      })
    ) {
      setSiteSettingsActionState({
        pending: false,
        error: null,
        helperMessage: 'No unsaved changes.',
      })
      return
    }

    void saveSiteSettingsDraft(getNormalizedSiteSettingsDraft(siteSettingsDraft))
  }

  function handleRecipeDraftChange(patch: Partial<RecipeDraft>) {
    setRecipeActionState((current) => ({
      pendingKey: current.pendingKey,
      error: null,
      helperMessage: null,
    }))
    setRecipeDraft((current) => ({ ...current, ...patch }))
  }

  function handleSelectRecipe(recipeId: string) {
    const recipe = recipesState.recipes.find((item) => item.id === recipeId)
    if (!recipe) return
    setSelectedRecipeId(recipe.id)
    setRecipeDraft(getRecipeDraft(recipe))
    setRecipeActionState({
      pendingKey: null,
      error: null,
      helperMessage: null,
    })
  }

  function handleNewRecipeDraft() {
    setSelectedRecipeId(null)
    setRecipeDraft(getRecipeDraft())
    setRecipeActionState({
      pendingKey: null,
      error: null,
      helperMessage: null,
    })
  }

  async function handleSaveRecipe() {
    if (!recipeDraft.title.trim()) {
      setRecipeActionState({
        pendingKey: null,
        error: 'Recipe title is required.',
        helperMessage: null,
      })
      return
    }

    const existingRecipe = recipeDraft.id
      ? recipesState.recipes.find((recipe) => recipe.id === recipeDraft.id)
      : undefined
    const sortOrder = existingRecipe?.sortOrder ?? recipesState.recipes.length
    setRecipeActionState({
      pendingKey: 'save',
      error: null,
      helperMessage: null,
    })

    try {
      const response = await fetch(buildSiteRecipesFetchUrl(), {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert',
          recipe: getRecipeDraftSavePayload(recipeDraft, { sortOrder }),
        }),
      })
      const payload = (await response.json().catch(() => null)) as
        | SiteRecipesResponsePayload
        | null

      if (!response.ok || !payload?.recipe) {
        throw new Error(payload?.error || 'Unable to save this recipe right now.')
      }

      const wasNewRecipe = !recipeDraft.id
      setSelectedRecipeId(wasNewRecipe ? null : payload.recipe.id)
      setRecipeDraft(wasNewRecipe ? getRecipeDraft() : getRecipeDraft(payload.recipe))
      await loadSiteRecipes(undefined, {
        preferredRecipeId: wasNewRecipe ? null : payload.recipe.id,
      })
      setRecipeActionState({
        pendingKey: null,
        error: null,
        helperMessage: wasNewRecipe
          ? `${payload.recipe.title} saved. Add the next recipe when you are ready.`
          : `${payload.recipe.title} saved for the Pantry.`,
      })
      refreshLiveSitePreviewAfterSiteSettingsSave()
    } catch (error) {
      setRecipeActionState({
        pendingKey: null,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to save this recipe right now.',
        helperMessage: null,
      })
    }
  }

  async function handleRemoveRecipe(recipeId: string) {
    const recipe = recipesState.recipes.find((item) => item.id === recipeId)
    setRecipeActionState({
      pendingKey: `remove:${recipeId}`,
      error: null,
      helperMessage: null,
    })

    try {
      const response = await fetch(buildSiteRecipesFetchUrl(), {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          recipeId,
        }),
      })
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to remove this recipe right now.')
      }

      setSelectedRecipeId(null)
      setRecipeDraft(getRecipeDraft())
      await loadSiteRecipes(undefined, { preferredRecipeId: null })
      setRecipeActionState({
        pendingKey: null,
        error: null,
        helperMessage: `${recipe?.title ?? 'Recipe'} removed from the Pantry.`,
      })
      refreshLiveSitePreviewAfterSiteSettingsSave()
    } catch (error) {
      setRecipeActionState({
        pendingKey: null,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to remove this recipe right now.',
        helperMessage: null,
      })
    }
  }

  async function handleRecipeImageUpload(
    field: 'imageUrl' | 'modalImageUrl' | 'recipeCardImageUrls',
    file: File | null,
  ) {
    if (!file) return
    setRecipeActionState({
      pendingKey: `upload:${field}`,
      error: null,
      helperMessage: null,
    })

    try {
      const base64Data = await readFileAsDataUrl(file)
      const response = await fetch('/api/nic-nac/site-recipes/image', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          base64Data,
          filename: file.name,
        }),
      })
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; imageUrl?: string }
        | null
      if (!response.ok || !payload?.imageUrl) {
        throw new Error(payload?.error || 'Unable to upload this recipe image.')
      }

      setRecipeDraft((current) =>
        field === 'recipeCardImageUrls'
          ? {
              ...current,
              recipeCardImageUrls: [
                ...current.recipeCardImageUrls,
                payload.imageUrl ?? '',
              ].filter(Boolean),
            }
          : { ...current, [field]: payload.imageUrl ?? '' },
      )
      setRecipeActionState({
        pendingKey: null,
        error: null,
        helperMessage:
          field === 'recipeCardImageUrls'
            ? 'Recipe-card photo uploaded. Nic-Nac can use it to build the draft.'
            : 'Food photo uploaded. Save the recipe to publish it.',
      })
    } catch (error) {
      setRecipeActionState({
        pendingKey: null,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to upload this recipe image.',
        helperMessage: null,
      })
    }
  }

  async function handleBuildRecipeDraft() {
    if (!recipeDraft.title.trim()) {
      setRecipeActionState({
        pendingKey: null,
        error: 'Recipe title is required before Nic-Nac can build the draft.',
        helperMessage: null,
      })
      return
    }

    if (recipeDraft.recipeCardImageUrls.length === 0) {
      setRecipeActionState({
        pendingKey: null,
        error: 'Upload at least one readable recipe-card photo first.',
        helperMessage: null,
      })
      return
    }

    setRecipeActionState({
      pendingKey: 'build-draft',
      error: null,
      helperMessage: null,
    })

    try {
      const images = [
        recipeDraft.imageUrl.trim()
          ? { role: 'display_photo', url: recipeDraft.imageUrl.trim() }
          : null,
        recipeDraft.modalImageUrl.trim()
          ? { role: 'display_photo', url: recipeDraft.modalImageUrl.trim() }
          : null,
        ...recipeDraft.recipeCardImageUrls.map((url) => ({
          role: 'recipe_card',
          url,
        })),
      ].filter(Boolean)

      const response = await fetch('/api/nic-nac/site-recipes/draft', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: recipeDraft.title,
          images,
        }),
      })
      const payload = (await response.json().catch(() => null)) as
        | SiteRecipesResponsePayload
        | null

      if (!response.ok || !payload?.draft) {
        throw new Error(payload?.error || 'Unable to build this recipe draft.')
      }

      const draft = payload.draft
      setRecipeDraft((current) => ({
        ...current,
        title: draft.title?.trim() || current.title,
        description: draft.description?.trim() ?? current.description,
        category: draft.category?.trim() ?? current.category,
        prepTime: draft.prepTime?.trim() ?? current.prepTime,
        servings:
          typeof draft.servings === 'number' && Number.isFinite(draft.servings)
            ? String(draft.servings)
            : current.servings,
        ingredientsText: joinRecipeLines(draft.ingredients),
        stepsText: joinRecipeLines(draft.steps),
        note: draft.note?.trim() ?? current.note,
        imageAlt: draft.imageAlt?.trim() || current.imageAlt,
      }))
      setRecipeActionState({
        pendingKey: null,
        error: null,
        helperMessage:
          draft.warnings && draft.warnings.length > 0
            ? `Recipe draft built. Check: ${draft.warnings.join(' ')}`
            : 'Recipe draft built. Review it, then save when it looks right.',
      })
    } catch (error) {
      setRecipeActionState({
        pendingKey: null,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to build this recipe draft.',
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
    if (activeSection !== 'jewelry-library') return
    if (jewelryLibraryState.status !== 'idle') return

    void loadJewelryLibrary(libraryFilters).catch((error) => {
      setJewelryLibraryState({
        status: 'error',
        results: [],
        facets: EMPTY_JEWELRY_LIBRARY_FACETS,
      })
      setTradeBoardActionState((current) => ({
        ...current,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to search the jewelry library right now.',
      }))
    })
  }, [activeSection, jewelryLibraryState.status])

  useEffect(() => {
    if (activeSection !== 'recipes') return
    if (recipesState.status !== 'idle') return

    const controller = new AbortController()
    void loadSiteRecipes(controller.signal).catch((error) => {
      if ((error as { name?: string }).name === 'AbortError') return
      setRecipesState({ status: 'error', recipes: [] })
      setRecipeActionState({
        pendingKey: null,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to load site recipes right now.',
        helperMessage: null,
      })
    })

    return () => controller.abort()
  }, [activeSection])

  useEffect(() => {
    const refreshAfterNicNacMutation = (event: Event) => {
      const detail = (event as CustomEvent<{ topic?: 'trade' | 'site' | 'calendar' }>).detail
      const topic = detail?.topic
      if (topic !== 'trade' && topic !== 'site' && topic !== 'calendar') return
      if (document.visibilityState === 'hidden') return
      if (topic === 'trade' && !reviewWorkspaceMode) {
        void refreshTradeWorkspace()
      }
      if (topic === 'calendar' && !reviewWorkspaceMode) {
        void loadCalendar().catch(() => {
          setCalendarState({ status: 'error' })
        })
      }
      if (topic === 'site' && activeSection === 'recipes') {
        void loadSiteRecipes(undefined, {
          preferredRecipeId: selectedRecipeId,
        }).catch((error) => {
          setRecipesState({ status: 'error', recipes: [] })
          setRecipeActionState({
            pendingKey: null,
            error:
              error instanceof Error
                ? error.message
                : 'Unable to refresh site recipes right now.',
            helperMessage: null,
          })
        })
      }
      if (
        workspacePreview.mode === 'live_site_preview' &&
        (topic === 'trade' || topic === 'site' || topic === 'calendar')
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
  }, [activeSection, reviewWorkspaceMode, selectedRecipeId, workspacePreview.mode])

  useEffect(() => {
    if (reviewWorkspaceMode) return

    const controller = new AbortController()
    void loadPaidWorkspaceData(controller.signal)

    return () => controller.abort()
  }, [reviewWorkspaceMode])

  useEffect(() => {
    if (accountBillingState.status !== 'ready') return
    const hasPaidWorkspace = hasPaidWorkspaceSubscription(accountBillingState.summary)
    const isRecipeWorkspaceAccessKnown =
      Boolean(repIdOverride || publicSiteSlugOverride) ||
      repProfileState.status === 'ready' ||
      reviewWorkspaceMode
    const hasRecipeWorkspaceAccess = hasBlingKitchenRecipeWorkspaceAccess({
      repId: repIdOverride ?? repProfileState.repId,
      publicSiteSlug: publicSiteSlugOverride ?? repProfileState.publicSiteSlug,
    })
    if (
      activeSection === 'recipes' &&
      !hasRecipeWorkspaceAccess &&
      !isRecipeWorkspaceAccessKnown
    ) {
      return
    }
    const allowedSection = resolveWorkspaceSectionForAccess(
      activeSection,
      hasPaidWorkspace,
      hasRecipeWorkspaceAccess,
    )
    if (allowedSection !== activeSection) {
      setActiveSection(allowedSection)
    }
  }, [
    accountBillingState.status,
    accountBillingState.summary,
    activeSection,
    publicSiteSlugOverride,
    repIdOverride,
    repProfileState.status,
    repProfileState.publicSiteSlug,
    repProfileState.repId,
    reviewWorkspaceMode,
  ])

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
    const skippedRevealedItemNumber =
      action === 'approve' && !swap?.revealedItemNumber?.trim()

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
              : skippedRevealedItemNumber
                ? 'Trade approved. Add the revealed piece later with Nic-Nac when you are ready.'
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

  async function handleLibrarySearch(nextQuery = librarySearchQuery) {
    const nextFilters = {
      ...libraryFilters,
      q: nextQuery.trim(),
      limit: JEWELRY_LIBRARY_DEFAULT_LIMIT,
    }
    setLibrarySearchQuery(nextFilters.q)
    setLibraryFilters(nextFilters)
    try {
      await loadJewelryLibrary(nextFilters)
    } catch (error) {
      setJewelryLibraryState({
        status: 'error',
        results: [],
        facets: EMPTY_JEWELRY_LIBRARY_FACETS,
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

  async function handleLibraryFilterChange(
    field: JewelryLibraryFilterField,
    value: string,
  ) {
    const nextFilters = {
      ...libraryFilters,
      [field]: value,
      limit: JEWELRY_LIBRARY_DEFAULT_LIMIT,
    }
    if (field === 'q') {
      setLibrarySearchQuery(value)
    }
    setLibraryFilters(nextFilters)
    try {
      await loadJewelryLibrary(nextFilters)
    } catch (error) {
      setJewelryLibraryState({
        status: 'error',
        results: [],
        facets: EMPTY_JEWELRY_LIBRARY_FACETS,
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

  async function handleLibraryClear() {
    setLibrarySearchQuery('')
    setLibraryFilters(EMPTY_JEWELRY_LIBRARY_FILTERS)
    try {
      await loadJewelryLibrary(EMPTY_JEWELRY_LIBRARY_FILTERS)
    } catch (error) {
      setJewelryLibraryState({
        status: 'error',
        results: [],
        facets: EMPTY_JEWELRY_LIBRARY_FACETS,
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

      await Promise.all([refreshTradeWorkspace(), loadJewelryLibrary(libraryFilters)])
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

  function handleTeamCreateDraftChange(
    patch: Partial<TeamManagementCreateDraft>,
  ) {
    setTeamManagementActionState((current) => ({
      ...current,
      error: null,
      helperMessage: null,
    }))
    setTeamCreateDraft((current) => ({ ...current, ...patch }))
  }

  function handlePublicTeamDraftChange(patch: Partial<JoinTeamRosterDraft>) {
    setTeamManagementActionState((current) => ({
      ...current,
      error: null,
      helperMessage: null,
    }))
    setPublicTeamDraft((current) => ({ ...current, ...patch }))
  }

  async function handleSavePublicTeamMember() {
    if (!publicTeamDraft.displayName.trim()) {
      setTeamManagementActionState({
        pendingKey: null,
        error: 'Enter the first name before saving the public card.',
        helperMessage: null,
      })
      return
    }

    setTeamManagementActionState({
      pendingKey: 'public-team:save',
      error: null,
      helperMessage: null,
    })

    try {
      const response = await fetch('/api/nic-nac/join-team-roster', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert',
          member: buildJoinTeamRosterSavePayload(publicTeamDraft),
        }),
      })
      const payload = (await response.json().catch(() => null)) as
        | JoinTeamRosterResponsePayload
        | null
      if (!response.ok || !payload?.member) {
        throw new Error(payload?.error || 'Unable to save that public team card right now.')
      }

      const savedMember = payload.member
      setTeamManagementState((current) => {
        const roster = current.publicTeamRoster ?? []
        const nextRoster = roster.some((member) => member.id === savedMember.id)
          ? roster.map((member) =>
              member.id === savedMember.id ? savedMember : member,
            )
          : [...roster, savedMember]

        return {
          ...current,
          publicTeamRoster: nextRoster.sort((a, b) => a.sortOrder - b.sortOrder),
        }
      })
      setPublicTeamDraft(getJoinTeamRosterDraft())
      setTeamManagementActionState({
        pendingKey: null,
        error: null,
        helperMessage: 'Public team card saved to the Join Team page.',
      })
    } catch (error) {
      setTeamManagementActionState({
        pendingKey: null,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to save that public team card right now.',
        helperMessage: null,
      })
    }
  }

  function handleEditPublicTeamMember(member: JoinTeamMember) {
    setPublicTeamDraft(getJoinTeamRosterDraft(member))
    setTeamManagementActionState({
      pendingKey: null,
      error: null,
      helperMessage: `Editing ${member.displayName}'s public card.`,
    })
  }

  async function handleTogglePublicTeamMember(member: JoinTeamMember) {
    setTeamManagementActionState({
      pendingKey: `public-team:toggle:${member.id}`,
      error: null,
      helperMessage: null,
    })

    try {
      const response = await fetch('/api/nic-nac/join-team-roster', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert',
          member: {
            ...buildJoinTeamRosterSavePayload(getJoinTeamRosterDraft(member)),
            isVisible: !member.isVisible,
          },
        }),
      })
      const payload = (await response.json().catch(() => null)) as
        | JoinTeamRosterResponsePayload
        | null
      if (!response.ok || !payload?.member) {
        throw new Error(payload?.error || 'Unable to update that public card right now.')
      }

      setTeamManagementState((current) => ({
        ...current,
        publicTeamRoster: (current.publicTeamRoster ?? []).map((rosterMember) =>
          rosterMember.id === payload.member?.id ? payload.member : rosterMember,
        ),
      }))
      setTeamManagementActionState({
        pendingKey: null,
        error: null,
        helperMessage: payload.member.isVisible
          ? 'Public team card is visible on the Join Team page.'
          : 'Public team card is hidden from the Join Team page.',
      })
    } catch (error) {
      setTeamManagementActionState({
        pendingKey: null,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to update that public card right now.',
        helperMessage: null,
      })
    }
  }

  async function handleMovePublicTeamMember(
    memberId: string,
    direction: 'up' | 'down',
  ) {
    const roster = teamManagementState.publicTeamRoster ?? []
    const memberIds = moveJoinTeamRosterMember(roster, memberId, direction)
    if (memberIds.join('|') === roster.map((member) => member.id).join('|')) return

    setTeamManagementActionState({
      pendingKey: `public-team:move:${memberId}`,
      error: null,
      helperMessage: null,
    })

    try {
      const response = await fetch('/api/nic-nac/join-team-roster', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'reorder',
          memberIds,
        }),
      })
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to reorder public team cards right now.')
      }

      const byId = new Map(roster.map((member) => [member.id, member]))
      setTeamManagementState((current) => ({
        ...current,
        publicTeamRoster: memberIds
          .map((id, index) => {
            const member = byId.get(id)
            return member ? { ...member, sortOrder: index } : null
          })
          .filter((member): member is JoinTeamMember => member !== null),
      }))
      setTeamManagementActionState({
        pendingKey: null,
        error: null,
        helperMessage: 'Public team cards reordered.',
      })
    } catch (error) {
      setTeamManagementActionState({
        pendingKey: null,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to reorder public team cards right now.',
        helperMessage: null,
      })
    }
  }

  async function handleRemovePublicTeamMember(memberId: string) {
    setTeamManagementActionState({
      pendingKey: `public-team:remove:${memberId}`,
      error: null,
      helperMessage: null,
    })

    try {
      const response = await fetch('/api/nic-nac/join-team-roster', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          memberId,
        }),
      })
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to remove that public team card right now.')
      }

      setTeamManagementState((current) => ({
        ...current,
        publicTeamRoster: (current.publicTeamRoster ?? []).filter(
          (member) => member.id !== memberId,
        ),
      }))
      setTeamManagementActionState({
        pendingKey: null,
        error: null,
        helperMessage: 'Public team card removed from the Join Team page.',
      })
    } catch (error) {
      setTeamManagementActionState({
        pendingKey: null,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to remove that public team card right now.',
        helperMessage: null,
      })
    }
  }

  async function handleCreateTeamOnboardingParticipant() {
    if (!teamCreateDraft.displayName.trim()) {
      setTeamManagementActionState({
        pendingKey: null,
        error: 'Enter the new rep name first.',
        helperMessage: null,
      })
      return
    }

    setTeamManagementActionState({
      pendingKey: 'create',
      error: null,
      helperMessage: null,
    })

    try {
      const response = await fetch('/api/nic-nac/team-onboarding/participants', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(teamCreateDraft),
      })
      const payload = (await response.json().catch(() => null)) as
        | TeamManagementResponsePayload
        | null

      if (!response.ok || !payload?.participant || !payload.accessUrl) {
        throw new Error(payload?.error || 'Unable to create that onboarding link right now.')
      }

      const participant = {
        ...payload.participant,
        accessUrl: payload.accessUrl,
      }
      setTeamManagementState((current) => {
        const currentAccess =
          current.access ?? { enabled: true, status: 'manual_beta' as const, source: 'manual_beta' as const }
        const currentParticipants = current.participants ?? []
        return {
          status: 'ready',
          access: currentAccess,
          participants: [participant, ...currentParticipants],
          publicTeamRoster: current.publicTeamRoster,
        }
      })
      setTeamCreateDraft({ displayName: '', contactEmail: '' })
      setTeamManagementActionState({
        pendingKey: null,
        error: null,
        helperMessage: 'Onboarding link created. Copy it or open your email app to send it.',
      })
    } catch (error) {
      setTeamManagementActionState({
        pendingKey: null,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to create that onboarding link right now.',
        helperMessage: null,
      })
    }
  }

  async function handleCopyTeamOnboardingInvite(accessUrl?: string) {
    if (!accessUrl) {
      setTeamManagementActionState({
        pendingKey: null,
        error: 'Create a fresh onboarding link first.',
        helperMessage: null,
      })
      return
    }

    try {
      await navigator.clipboard.writeText(accessUrl)
      setTeamManagementActionState({
        pendingKey: null,
        error: null,
        helperMessage: 'Onboarding link copied.',
      })
    } catch {
      setTeamManagementActionState({
        pendingKey: null,
        error: null,
        helperMessage: 'Copy failed. Open the link and copy it manually.',
      })
    }
  }

  function handleEmailTeamOnboardingInvite(participant: TeamOnboardingParticipant) {
    if (!participant.accessUrl) {
      setTeamManagementActionState({
        pendingKey: null,
        error: 'Create a fresh onboarding link first.',
        helperMessage: null,
      })
      return
    }

    const subject = encodeURIComponent('Your Britt with Bling Start Strong link')
    const body = encodeURIComponent(
      `Hi ${participant.displayName},\n\nHere is your Start Strong onboarding link:\n${participant.accessUrl}\n\nKeep this handy while you are on the team.`,
    )
    const recipient = participant.contactEmail
      ? encodeURIComponent(participant.contactEmail)
      : ''
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`
    setTeamManagementActionState({
      pendingKey: null,
      error: null,
      helperMessage: 'Opening your email app with the onboarding link.',
    })
  }

  async function handleArchiveTeamOnboardingParticipant(participantId: string) {
    setTeamManagementActionState({
      pendingKey: `archive:${participantId}`,
      error: null,
      helperMessage: null,
    })

    try {
      const response = await fetch(
        `/api/nic-nac/team-onboarding/participants/${participantId}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action: 'archive' }),
        },
      )
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to archive that onboarding link right now.')
      }

      setTeamManagementState((current) => ({
        ...current,
        participants: (current.participants ?? []).map((participant) =>
          participant.id === participantId
            ? { ...participant, status: 'archived' }
            : participant,
        ),
      }))
      setTeamManagementActionState({
        pendingKey: null,
        error: null,
        helperMessage: 'Onboarding link archived.',
      })
    } catch (error) {
      setTeamManagementActionState({
        pendingKey: null,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to archive that onboarding link right now.',
        helperMessage: null,
      })
    }
  }

  async function handleSendTeamOnboardingReply(participantId: string) {
    if (!teamReplyDraft.trim()) {
      setTeamManagementActionState({
        pendingKey: null,
        error: 'Write a reply first.',
        helperMessage: null,
      })
      return
    }

    setTeamManagementActionState({
      pendingKey: `reply:${participantId}`,
      error: null,
      helperMessage: null,
    })

    try {
      const response = await fetch(
        `/api/nic-nac/team-onboarding/participants/${participantId}/messages`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ body: teamReplyDraft }),
        },
      )
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to send that reply right now.')
      }

      setTeamReplyDraft('')
      setTeamManagementActionState({
        pendingKey: null,
        error: null,
        helperMessage: 'Reply saved to the onboarding thread.',
      })
      void loadTeamManagement().catch(() => {})
    } catch (error) {
      setTeamManagementActionState({
        pendingKey: null,
        error:
          error instanceof Error ? error.message : 'Unable to send that reply right now.',
        helperMessage: null,
      })
    }
  }

  const customerSparkleSiteHref = buildCustomerSparkleSiteHref({
    repId: repIdOverride ?? repProfileState.repId,
    publicSiteSlug: publicSiteSlugOverride ?? repProfileState.publicSiteSlug,
  })
  const currentPublicSiteSlug =
    publicSiteSlugOverride ?? repProfileState.publicSiteSlug
  const currentRepId = repIdOverride ?? repProfileState.repId
  const customerJoinTeamHref = currentPublicSiteSlug
    ? `/${encodeURIComponent(currentPublicSiteSlug.trim().toLowerCase())}/join`
    : currentRepId
      ? `/amethyst/Join.html?c=${encodeURIComponent(currentRepId)}`
      : '/amethyst/Join.html'
  const customerTradeBoardHref = buildCustomerTradeBoardHref({
    repId: repIdOverride ?? repProfileState.repId,
    publicSiteSlug: publicSiteSlugOverride ?? repProfileState.publicSiteSlug,
  })
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
  const headerRepName = formatHeaderRepName(
    siteSettingsState.settings?.displayName ?? repProfileState.displayName,
  )
  const headerShowName = formatHeaderShowName(
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
  const hasRecipeWorkspaceAccess = hasBlingKitchenRecipeWorkspaceAccess({
    repId: repIdOverride ?? repProfileState.repId,
    publicSiteSlug: publicSiteSlugOverride ?? repProfileState.publicSiteSlug,
  })
  const isWorkspaceAccessLoading = accountBillingState.status !== 'ready'
  const canRenderWorkspaceSections = isWorkspaceAccessLoading || hasPaidWorkspace
  const visibleWorkspaceSections = getVisibleWorkspaceSections(
    hasPaidWorkspace,
    hasRecipeWorkspaceAccess,
  )
  const showWorkspaceAccessNotice = shouldShowWorkspaceAccessNotice(
    activeSection,
    hasPaidWorkspace,
    isWorkspaceAccessLoading,
  )
  const showWorkspaceLoadingSkeleton = shouldShowWorkspaceLoadingSkeleton(
    activeSection,
    isWorkspaceAccessLoading,
  )
  const isLiveSitePreview = workspacePreview.mode === 'live_site_preview'
  const activeWorkspacePreview = isLiveSitePreview ? workspacePreview : null
  const activeWorkspacePreviewSrc = activeWorkspacePreview
    ? `${activeWorkspacePreview.href}${
        activeWorkspacePreview.href.includes('?') ? '&' : '?'
      }previewRefresh=${previewFrameKey}`
    : null
  const siteSettingsHasUnsavedChanges = hasSiteSettingsUnsavedChanges({
    settings: siteSettingsState.settings,
    draft: siteSettingsDraft,
  })
  const siteSettingsSaveStatusText = getSiteSettingsManualSaveStatusText({
    settings: siteSettingsState.settings,
    draft: siteSettingsDraft,
    actionState: siteSettingsActionState,
    statusMessage: siteSettingsActionState.helperMessage,
  })
  const workspaceHeader = !isLiveSitePreview ? (
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
          <span className={styles.topbarInfoLabel}>Rep</span>
          <span className={styles.topbarInfoValue}>{headerRepName}</span>
        </div>
        <div className={styles.topbarInfoPill}>
          <span className={styles.topbarInfoLabel}>Show</span>
          <span className={styles.topbarInfoValue}>{headerShowName}</span>
        </div>
        <div className={styles.topbarInfoPill}>
          <span className={styles.topbarInfoLabel}>Secret Rep ID Number</span>
          <span className={`${styles.topbarInfoValue} ${styles.topbarInfoValueCode}`}>
            {headerLiveQueueSyncCode}
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
  ) : null
  const accessNotice = (
    <WorkspaceAccessNotice
      sectionLabel={getWorkspaceSectionLabel(activeSection)}
      state={accountBillingState}
      actionState={accountBillingActionState}
      onOpenAccount={() => setActiveSection('account')}
      onStartSubscription={() => handleAccountBillingAction('subscribe')}
      onManageBilling={() => handleAccountBillingAction('manage')}
      statusMessage={accountBillingActionState.helperMessage}
      agreementAccepted={subscriptionAgreementAccepted}
      onAgreementAcceptedChange={setSubscriptionAgreementAccepted}
    />
  )
  const renderActiveWorkspaceSection = () => {
    if (showWorkspaceLoadingSkeleton && !canRenderWorkspaceSections) {
      return (
        <div className={styles.cardFill}>
          <div className={styles.loadingLine} />
          <div className={styles.loadingLineShort} />
        </div>
      )
    }

    if (canRenderWorkspaceSections && activeSection === 'trade-board') {
      return (
        <TradeBoardWorkspaceCard
          tradeBoardState={tradeBoardState}
          tradeBoardSearchQuery={tradeBoardSearchQuery}
          onTradeBoardSearchQueryChange={setTradeBoardSearchQuery}
          quickAddItemNumber={quickAddItemNumber}
          onQuickAddItemNumberChange={setQuickAddItemNumber}
          actionState={tradeBoardActionState}
          tradeRequestsState={tradeRequestsState}
          fulfillmentQueueState={fulfillmentQueueState}
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
      )
    }

    if (canRenderWorkspaceSections && activeSection === 'jewelry-library') {
      return (
        <JewelryLibraryCard
          state={jewelryLibraryState}
          searchQuery={librarySearchQuery}
          filters={libraryFilters}
          onSearchQueryChange={setLibrarySearchQuery}
          onSearch={handleLibrarySearch}
          onFilterChange={handleLibraryFilterChange}
          onClear={handleLibraryClear}
          onAddToBoard={handleAddFromLibrary}
          actionState={tradeBoardActionState}
        />
      )
    }

    if (canRenderWorkspaceSections && activeSection === 'show-calendar') {
      return (
        <div className={styles.workspaceSectionStack}>
          <ShowCalendarCard state={calendarState} />
        </div>
      )
    }

    if (canRenderWorkspaceSections && activeSection === 'business-tools') {
      return <BusinessToolsCard />
    }

    if (canRenderWorkspaceSections && activeSection === 'team-management') {
      return (
        <div className={styles.workspaceSectionStack}>
          <TeamManagementCard
            state={teamManagementState}
            actionState={teamManagementActionState}
            createDraft={teamCreateDraft}
            publicTeamDraft={publicTeamDraft}
            replyDraft={teamReplyDraft}
            joinTeamPreviewHref={customerJoinTeamHref}
            onCreateDraftChange={handleTeamCreateDraftChange}
            onCreateParticipant={handleCreateTeamOnboardingParticipant}
            onCopyInvite={handleCopyTeamOnboardingInvite}
            onEmailInvite={handleEmailTeamOnboardingInvite}
            onArchiveParticipant={handleArchiveTeamOnboardingParticipant}
            onPublicTeamDraftChange={handlePublicTeamDraftChange}
            onSavePublicTeamMember={handleSavePublicTeamMember}
            onEditPublicTeamMember={handleEditPublicTeamMember}
            onTogglePublicTeamMember={handleTogglePublicTeamMember}
            onMovePublicTeamMember={handleMovePublicTeamMember}
            onRemovePublicTeamMember={handleRemovePublicTeamMember}
            onReplyDraftChange={setTeamReplyDraft}
            onSendReply={handleSendTeamOnboardingReply}
          />
        </div>
      )
    }

    if (canRenderWorkspaceSections && activeSection === 'messages') {
      return (
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
      )
    }

    if (canRenderWorkspaceSections && activeSection === 'site-settings') {
      return (
        <div className={styles.workspaceSectionStack}>
          <SiteSettingsCard
            state={siteSettingsState}
            draft={siteSettingsDraft}
            actionState={siteSettingsActionState}
            hasUnsavedChanges={siteSettingsHasUnsavedChanges}
            statusMessage={siteSettingsSaveStatusText}
            onDraftChange={handleSiteSettingsDraftChange}
            onSocialHandleChange={handleSocialHandleChange}
            onSave={handleSaveSiteSettings}
          />
        </div>
      )
    }

    if (
      canRenderWorkspaceSections &&
      activeSection === 'recipes' &&
      hasRecipeWorkspaceAccess
    ) {
      return (
        <div className={styles.workspaceSectionStack}>
          <RecipesCard
            state={recipesState}
            draft={recipeDraft}
            actionState={recipeActionState}
            statusMessage={getRecipeSaveStatusText(recipeActionState)}
            onDraftChange={handleRecipeDraftChange}
            onSelectRecipe={handleSelectRecipe}
            onNewRecipe={handleNewRecipeDraft}
            onSave={handleSaveRecipe}
            onRemove={handleRemoveRecipe}
            onUploadImage={handleRecipeImageUpload}
            onBuildDraft={handleBuildRecipeDraft}
          />
        </div>
      )
    }

    if (activeSection === 'help-resources') {
      return (
        <div className={styles.workspaceSectionStack}>
          <HelpResourcesCard
            state={resourcesState}
            hasPaidWorkspace={hasPaidWorkspace}
          />
        </div>
      )
    }

    if (activeSection === 'account') {
      return (
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
            <ReferralProgramCard referral={accountBillingState.summary.referral} />
          ) : null}
          {canRenderWorkspaceSections ? (
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
      )
    }

    return null
  }
  const renderedSection = renderActiveWorkspaceSection()
  return (
    <main
      className={`${styles.main} ${isLiveSitePreview ? styles.mainPreviewFocus : ''}`}
      data-workspace-skin={workspaceSkinPreset}
    >
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
            src={activeWorkspacePreviewSrc ?? activeWorkspacePreview.href}
            title="Sparkle Suite live site preview"
          />
        </section>
      ) : (
        <WorkspaceShell
          tabs={visibleWorkspaceSections}
          activeSection={activeSection}
          onSectionChange={(section) =>
            setActiveSection(
              resolveWorkspaceSectionForAccess(
                section,
                hasPaidWorkspace,
                hasRecipeWorkspaceAccess,
              ),
            )
          }
          header={workspaceHeader}
          notice={showWorkspaceAccessNotice ? accessNotice : null}
        >
          {renderedSection}
        </WorkspaceShell>
      )}
    </main>
  )
}

export function WorkspaceAccessNotice({
  sectionLabel,
  state,
  actionState,
  onOpenAccount,
  onStartSubscription,
  onManageBilling,
  statusMessage,
  agreementAccepted,
  onAgreementAcceptedChange,
}: {
  sectionLabel: string
  state: AccountBillingState
  actionState?: AccountBillingActionState
  onOpenAccount?: () => void
  onStartSubscription?: () => void
  onManageBilling?: () => void
  statusMessage?: string | null
  agreementAccepted?: boolean
  onAgreementAcceptedChange?: (accepted: boolean) => void
}) {
  const isLoading = state.status !== 'ready'
  return (
    <div className={styles.workspaceSectionStack}>
      <div className={styles.workspaceIntroCard}>
        <div>
          <div className={styles.cardTitle}>
            {isLoading ? 'Checking workspace access' : `${sectionLabel} needs account setup`}
          </div>
          <div className={styles.accountMuted}>
            {isLoading
              ? 'Sparkle Suite is loading your account status before showing this section.'
              : 'Your account page has the current checkout or billing step. Once access is active, this section will open here.'}
          </div>
        </div>
        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.helperButton}
            onClick={() => onOpenAccount?.()}
          >
            Open account
          </button>
        </div>
      </div>
      <AccountBillingCard
        state={state}
        actionState={actionState}
        onStartSubscription={onStartSubscription}
        onManageBilling={onManageBilling}
        statusMessage={statusMessage}
        agreementAccepted={agreementAccepted}
        onAgreementAcceptedChange={onAgreementAcceptedChange}
      />
    </div>
  )
}

export function JewelryLibraryCard({
  state,
  searchQuery,
  filters,
  onSearchQueryChange,
  onSearch,
  onFilterChange,
  onClear,
  onAddToBoard,
  actionState,
}: {
  state: JewelryLibraryState
  searchQuery: string
  filters: JewelryLibraryFilters
  onSearchQueryChange: (value: string) => void
  onSearch: (query: string) => void
  onFilterChange: (field: JewelryLibraryFilterField, value: string) => void
  onClear: () => void
  onAddToBoard: (itemNumber: string) => void
  actionState: TradeBoardActionState
}) {
  const results = state.results ?? []
  const facets = state.facets ?? EMPTY_JEWELRY_LIBRARY_FACETS
  const activeFilters = getJewelryLibraryActiveFilters(filters)
  const hasActiveFilters = activeFilters.length > 0

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    onSearch(String(formData.get('librarySearchQuery') ?? ''))
  }

  return (
    <div className={styles.workspaceSectionStack}>
      <div className={styles.workspaceSectionHeader}>
        <div>
          <div className={styles.cardTitle}>Master Jewelry Library</div>
          <div className={styles.cardSubtitle}>
            Search the Jewelry Library by piece, collection, type, material, stone, and Bomb Party label.
          </div>
        </div>
      </div>
      <div className={styles.librarySearchCard}>
        <form className={styles.librarySearchForm} onSubmit={handleSubmit}>
          <div className={styles.librarySearchPrimary}>
            <label className={styles.librarySearchLabel}>
              Search the Jewelry Library
              <input
                type="search"
                name="librarySearchQuery"
                className={`${styles.librarySearchInput} ph-no-capture`}
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                placeholder="Try a stone, collection, item number, or piece name"
              />
            </label>
            <p className={styles.librarySearchHint}>
              Not sure what it is called? Ask Nic-Nac from here.
            </p>
          </div>
          <div className={styles.librarySearchActions}>
            <button type="submit" className={styles.libraryPrimaryButton}>
              <Search aria-hidden="true" className={styles.libraryButtonIcon} strokeWidth={2} />
              Search
            </button>
            <a className={styles.librarySecondaryButton} href="#nic-nac-workspace-chat">
              <Sparkles aria-hidden="true" className={styles.libraryButtonIcon} strokeWidth={1.8} />
              Ask Nic-Nac
            </a>
            <button type="button" className={styles.libraryTertiaryButton} onClick={onClear}>
              <X aria-hidden="true" className={styles.libraryButtonIcon} strokeWidth={2} />
              Clear
            </button>
          </div>
        </form>
        {hasActiveFilters ? (
          <div className={styles.librarySelectedFilters}>
            <div className={styles.librarySelectedFiltersLabel}>Selected filters</div>
            <div className={styles.librarySelectedFilterList}>
              {activeFilters.map((filter) => (
                <button
                  type="button"
                  className={styles.librarySelectedFilter}
                  key={`${filter.field}:${filter.value}`}
                  onClick={() => onFilterChange(filter.field, '')}
                >
                  {filter.label}: {filter.value}
                  <X aria-hidden="true" className={styles.libraryChipIcon} strokeWidth={2} />
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <details className={styles.libraryFacetPanel}>
          <summary className={styles.libraryFacetSummary}>
            <span>Filters</span>
            <span className={styles.libraryFacetCount}>
              {activeFilters.length > 0 ? `${activeFilters.length} active` : 'Browse options'}
            </span>
          </summary>
          <div className={styles.libraryFacetGrid}>
            {JEWELRY_LIBRARY_FACET_GROUPS.map((group) => (
              <JewelryLibraryFacetGroup
                activeValue={filters[group.field] ?? ''}
                ariaLabel={group.ariaLabel}
                field={group.field}
                key={group.key}
                onFilterChange={onFilterChange}
                options={facets[group.key]}
                searchPlaceholder={group.searchPlaceholder}
                title={group.title}
              />
            ))}
          </div>
        </details>
        {actionState.error ? <div className={styles.actionError}>{actionState.error}</div> : null}
        {actionState.helperMessage ? (
          <div className={styles.helperMessage}>{actionState.helperMessage}</div>
        ) : null}
      </div>
      {state.status === 'idle' || state.status === 'loading' ? (
        <div className={styles.libraryGrid}>
          {Array.from({ length: 4 }, (_, index) => (
            <div className={styles.librarySkeletonCard} key={`library-skeleton-${index}`}>
              <div className={styles.librarySkeletonImage} />
              <div className={styles.loadingLine} />
              <div className={styles.loadingLineShort} />
            </div>
          ))}
        </div>
      ) : state.status === 'error' ? (
        <div className={styles.libraryEmptyState}>
          The library search is temporarily unavailable.
        </div>
      ) : results.length > 0 ? (
        <div className={styles.libraryGrid}>
          {results.map((result) => (
            <JewelryLibraryResultCard
              actionState={actionState}
              key={result.designId}
              onAddToBoard={onAddToBoard}
              result={result}
            />
          ))}
        </div>
      ) : hasActiveFilters ? (
        <div className={styles.libraryEmptyState}>
          <p>No library records match those filters.</p>
          <p>Not sure what it is called? Ask Nic-Nac to help broaden the search.</p>
        </div>
      ) : (
        <div className={styles.libraryEmptyState}>
          The shared Sparkle Suite jewelry catalog is not available in this environment yet.
        </div>
      )}
    </div>
  )
}

function JewelryLibraryFacetGroup({
  activeValue,
  ariaLabel,
  field,
  onFilterChange,
  options,
  searchPlaceholder,
  title,
}: {
  activeValue: string
  ariaLabel: string
  field: JewelryLibraryFilterField
  onFilterChange: (field: JewelryLibraryFilterField, value: string) => void
  options: JewelryLibraryFacetOption[]
  searchPlaceholder: string
  title: string
}) {
  const [facetSearch, setFacetSearch] = useState('')
  const visibleOptions = useMemo(() => {
    const normalized = facetSearch.trim().toLocaleLowerCase()
    if (!normalized) return options
    return options.filter((option) =>
      option.value.toLocaleLowerCase().includes(normalized),
    )
  }, [facetSearch, options])

  return (
    <section className={styles.libraryFacetGroup}>
      <h3 className={styles.libraryFacetTitle}>{title}</h3>
      <input
        aria-label={ariaLabel}
        className={`${styles.libraryFacetSearch} ph-no-capture`}
        onChange={(event) => setFacetSearch(event.target.value)}
        placeholder={searchPlaceholder}
        type="search"
        value={facetSearch}
      />
      <div className={styles.libraryFacetOptions}>
        {visibleOptions.length > 0 ? (
          visibleOptions.map((option) => {
            const isActive = activeValue === option.value

            return (
              <button
                type="button"
                aria-current={isActive ? 'true' : undefined}
                className={
                  isActive
                    ? styles.libraryFacetOptionActive
                    : styles.libraryFacetOption
                }
                key={`${field}:${option.value}`}
                onClick={() => onFilterChange(field, isActive ? '' : option.value)}
              >
                <span>{formatJewelryFacetValue(field, option.value)}</span>
                <span className={styles.libraryFacetOptionCount}>{option.count}</span>
              </button>
            )
          })
        ) : (
          <p className={styles.libraryFacetEmpty}>
            No available options in this group.
          </p>
        )}
      </div>
    </section>
  )
}

function JewelryLibraryResultCard({
  actionState,
  onAddToBoard,
  result,
}: {
  actionState: TradeBoardActionState
  onAddToBoard: (itemNumber: string) => void
  result: JewelryDatabaseResult
}) {
  const label = deriveJewelryLibraryLabel(result)
  const metadata = [
    result.activeListingsCount < 1
      ? 'No current listings'
      : result.activeListingsCount === 1
        ? '1 available'
        : `${result.activeListingsCount} available`,
    result.collectionYear ? String(result.collectionYear) : null,
    result.material,
    result.mainStone,
    ...(result.searchTags ?? []).slice(0, 2),
  ].filter((value): value is string => Boolean(value))

  return (
    <article className={styles.libraryResultCard}>
      <div className={styles.libraryResultImageFrame}>
        {result.canonicalPhotoUrl ? (
          <div
            aria-label={result.designName}
            className={styles.libraryResultImage}
            role="img"
            style={{ backgroundImage: `url("${result.canonicalPhotoUrl}")` }}
          />
        ) : (
          <Gem aria-hidden="true" className={styles.libraryGemIcon} strokeWidth={1.4} />
        )}
      </div>
      <div className={styles.libraryResultBody}>
        <div className={styles.libraryBadgeRow}>
          <span className={styles.libraryTypeBadge}>
            {formatJewelryLibraryType(result.typePrefix)}
          </span>
          {label !== 'standard' ? (
            <span className={styles.libraryRarityBadge}>{label}</span>
          ) : null}
        </div>
        <h2 className={styles.libraryResultTitle}>{result.designName}</h2>
        <p className={styles.libraryResultCollection}>
          {result.collectionName || 'Unassigned Collection'}
        </p>
        <p className={styles.libraryResultItemNumber}>{result.itemNumber}</p>
        <div className={styles.libraryMetadataList}>
          {metadata.map((value, index) => (
            <span
              className={styles.libraryMetadataChip}
              key={`${result.designId}:${value}:${index}`}
            >
              {value}
            </span>
          ))}
        </div>
        <button
          type="button"
          className={styles.libraryAddButton}
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
    </article>
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
          <div className={styles.messageList}>
            {state.inbox.messages.length > 0 ? (
              state.inbox.messages.map((message) => (
                <div key={message.id} className={styles.messageRow}>
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
  const supportReportDetailsRef = useRef<HTMLTextAreaElement | null>(null)
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
        body: JSON.stringify(buildSupportReportPayload(reportForm.details)),
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
    supportReportDetailsRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
    supportReportDetailsRef.current?.focus()
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
          Send a quick report
        </div>
        <div className={styles.helperNote}>
          Type what happened, what is confusing, or what would make Sparkle
          Suite better. Support will sort out the category and follow-up.
        </div>
      </div>
      <label className={styles.searchField}>
        <span className={styles.searchLabel}>Tell us what happened</span>
        <textarea
          ref={supportReportDetailsRef}
          className={styles.supportReportTextarea}
          value={reportForm.details}
          required
          minLength={10}
          maxLength={3000}
          onChange={(event) =>
            updateReportForm('details', event.target.value)
          }
          placeholder="Example: Trade Board froze when I tried to add ER13229, or I have an idea for show reminders."
        />
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
                      Use the guides when you want a walkthrough. If something
                      feels broken, confusing, or worth improving, send a quick
                      report.
                    </div>
                  </div>
                  <span className={styles.rosterTag}>Open section</span>
                </summary>
                <div className={styles.supportReportCallout}>
                  <div>
                    <div className={styles.walletSettingsTitle}>
                      Send a quick report
                    </div>
                    <div className={styles.helperNote}>
                      A short description is enough. Sparkle Suite will attach
                      your account context for support.
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
  hasUnsavedChanges = false,
  statusMessage,
  onDraftChange,
  onSocialHandleChange,
  onSave,
}: {
  state: SiteSettingsState
  draft?: SiteSettingsDraft | null
  actionState?: SiteSettingsActionState
  hasUnsavedChanges?: boolean
  statusMessage?: string | null
  onDraftChange?: (patch: Partial<SiteSettingsDraft>) => void
  onSocialHandleChange?: (platform: string, value: string) => void
  onSave?: () => void
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

  return (
    <div className={styles.siteSettingsCard}>
      <div className={styles.workspaceSectionHeader}>
        <div>
          <div className={styles.cardTitle}>Site Settings</div>
          <div className={styles.cardSubtitle}>
            Keep your public profile, customer pages, and brand details tuned up.
          </div>
        </div>
        <div className={styles.siteSettingsSaveActions}>
          <span
            className={styles.siteSettingsSaveStatus}
            data-testid="site-settings-save-status"
            role="status"
            aria-live="polite"
          >
            {statusMessage ?? 'No unsaved changes.'}
          </span>
          <button
            type="button"
            className={styles.siteSettingsSaveButton}
            onClick={onSave}
            disabled={actionState?.pending || !hasUnsavedChanges}
          >
            {actionState?.pending ? 'Saving...' : 'Save site settings'}
          </button>
        </div>
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
            <span className={styles.sortLabel}>Customer-facing site theme</span>
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
              Applies only to your public customer-facing site. Your Sparkle
              Suite workspace keeps the standard workspace theme.
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
    </div>
  )
}

export function RecipesCard({
  state,
  draft,
  actionState,
  initialEditorMode = 'builder',
  statusMessage,
  onDraftChange,
  onSelectRecipe,
  onNewRecipe,
  onSave,
  onRemove,
  onUploadImage,
  onBuildDraft,
}: {
  state: RecipesState
  draft: RecipeDraft
  actionState?: RecipeActionState
  initialEditorMode?: RecipeEditorMode
  statusMessage?: string | null
  onDraftChange?: (patch: Partial<RecipeDraft>) => void
  onSelectRecipe?: (recipeId: string) => void
  onNewRecipe?: () => void
  onSave?: () => void
  onRemove?: (recipeId: string) => void
  onUploadImage?: (
    field: 'imageUrl' | 'modalImageUrl' | 'recipeCardImageUrls',
    file: File | null,
  ) => Promise<void> | void
  onBuildDraft?: () => void
}) {
  const [editorMode, setEditorMode] =
    useState<RecipeEditorMode>(initialEditorMode)

  if (state.status === 'error') {
    return (
      <div className={styles.rosterFallback}>
        Recipes will appear here once the Pantry editor can load.
      </div>
    )
  }

  if (state.status === 'idle' || state.status === 'loading') {
    return (
      <div className={styles.cardFill}>
        <div className={styles.loadingLine} />
        <div className={styles.loadingLineShort} />
      </div>
    )
  }

  const pendingKey = actionState?.pendingKey
  const canRemove = Boolean(draft.id)
  const isBuilderMode = editorMode === 'builder'

  function handleEditorModeChange(nextMode: RecipeEditorMode) {
    setEditorMode(nextMode)
    if (nextMode === 'builder') {
      onNewRecipe?.()
    }
  }

  return (
    <div className={styles.siteSettingsCard}>
      <div className={styles.workspaceSectionHeader}>
        <div>
          <div className={styles.cardTitle}>Recipes</div>
          <div className={styles.cardSubtitle}>
            Add a title, upload food photos and recipe-card photos, then let Nic-Nac draft the Pantry recipe.
          </div>
        </div>
        <div className={styles.siteSettingsSaveActions}>
          <span
            className={styles.siteSettingsSaveStatus}
            data-testid="recipes-save-status"
            role="status"
            aria-live="polite"
          >
            {statusMessage ?? getRecipeSaveStatusText(actionState)}
          </span>
          {isBuilderMode ? (
            <button
              type="button"
              className={styles.siteSettingsSaveButton}
              onClick={onBuildDraft}
              disabled={Boolean(pendingKey)}
            >
              {pendingKey === 'build-draft'
                ? 'Building recipe...'
                : 'Build recipe with Nic-Nac'}
            </button>
          ) : null}
        </div>
      </div>

      {actionState?.helperMessage ? (
        <div className={styles.helperMessage}>{actionState.helperMessage}</div>
      ) : null}
      {actionState?.error ? (
        <div className={styles.actionError}>{actionState.error}</div>
      ) : null}

      <div className={styles.recipeEditorLayout}>
        <div className={styles.siteSettingsSection}>
          <div className={styles.calendarHeader}>
            <select
              className={styles.recipeModeSelect}
              value={editorMode}
              aria-label="Recipe editor mode"
              onChange={(event) =>
                handleEditorModeChange(event.target.value as RecipeEditorMode)
              }
            >
              <option value="builder">New Recipe Builder</option>
              <option value="manual">Manual Edit Recipes</option>
            </select>
            <span className={styles.rosterTag}>
              {draft.isVisible ? 'Visible in Pantry' : 'Hidden draft'}
            </span>
          </div>

          {isBuilderMode ? (
          <>
          <div className={styles.recipeBuilderPanel}>
            <label className={styles.searchField}>
              <span className={styles.searchLabel}>Title</span>
              <input
                className={styles.searchInput}
                placeholder="Chocolate-Dipped Strawberries"
                value={draft.title}
                onChange={(event) =>
                  onDraftChange?.({ title: event.target.value })
                }
              />
            </label>

            <div className={styles.siteSettingsGrid}>
              <label className={styles.searchField}>
                <span className={styles.searchLabel}>Category</span>
                <select
                  className={styles.searchInput}
                  value={draft.category}
                  onChange={(event) =>
                    onDraftChange?.({ category: event.target.value })
                  }
                >
                  <option value="">Let Nic-Nac choose</option>
                  {BLING_KITCHEN_RECIPE_CATEGORIES.map((category) => (
                    <option value={category} key={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.searchField}>
                <span className={styles.searchLabel}>Prep time</span>
                <input
                  className={styles.searchInput}
                  placeholder="20 minutes"
                  value={draft.prepTime}
                  onChange={(event) =>
                    onDraftChange?.({ prepTime: event.target.value })
                  }
                />
              </label>
              <label className={styles.searchField}>
                <span className={styles.searchLabel}>Servings</span>
                <input
                  className={styles.searchInput}
                  inputMode="numeric"
                  placeholder="12"
                  value={draft.servings}
                  onChange={(event) =>
                    onDraftChange?.({ servings: event.target.value })
                  }
                />
              </label>
            </div>

            <div className={styles.recipeBuilderImageGrid}>
              <RecipeImageField
                label="Food photo for Pantry card"
                field="imageUrl"
                imageUrl={draft.imageUrl}
                imageAlt={draft.imageAlt || draft.title}
                pendingKey={pendingKey}
                onDraftChange={onDraftChange}
                onUploadImage={onUploadImage}
              />
              <RecipeImageField
                label="Food photo for recipe view"
                field="modalImageUrl"
                imageUrl={draft.modalImageUrl}
                imageAlt={draft.imageAlt || draft.title}
                pendingKey={pendingKey}
                onDraftChange={onDraftChange}
                onUploadImage={onUploadImage}
              />
            </div>

            <RecipeCardSourceUploader
              imageUrls={draft.recipeCardImageUrls}
              pendingKey={pendingKey}
              onRemoveImage={(imageUrl) =>
                onDraftChange?.({
                  recipeCardImageUrls: draft.recipeCardImageUrls.filter(
                    (url) => url !== imageUrl,
                  ),
                })
              }
              onUploadImage={(file) => onUploadImage?.('recipeCardImageUrls', file)}
            />

            <div className={styles.recipeBuilderActions}>
              <button
                type="button"
                className={styles.siteSettingsSaveButton}
                onClick={onSave}
                disabled={Boolean(pendingKey)}
              >
                {pendingKey === 'save' ? 'Saving...' : 'Save recipe'}
              </button>
            </div>
          </div>

          <div className={styles.recipeDraftPreview}>
            <div className={styles.walletSettingsTitle}>Recipe Preview</div>
            {draft.description || draft.ingredientsText || draft.stepsText ? (
              <div className={styles.recipePreviewGrid}>
                {draft.description ? <p>{draft.description}</p> : null}
                {draft.ingredientsText ? (
                  <div>
                    <span className={styles.searchLabel}>Ingredients</span>
                    <ul>
                      {splitRecipeLines(draft.ingredientsText).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {draft.stepsText ? (
                  <div>
                    <span className={styles.searchLabel}>Steps</span>
                    <ol>
                      {splitRecipeLines(draft.stepsText).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ol>
                  </div>
                ) : null}
                {draft.note ? <p>{draft.note}</p> : null}
              </div>
            ) : (
              <div className={styles.emptyState}>
                Upload at least one readable recipe-card photo, then Nic-Nac can
                draft the description, ingredients, steps, and Heather-style note.
              </div>
            )}
          </div>

          </>
          ) : (
          <div className={styles.recipeManualEditPanel}>
            <div className={styles.siteSettingsGrid}>
              <label className={styles.sortFieldWide}>
                <span className={styles.searchLabel}>Recipe to edit</span>
                <select
                  className={styles.searchInput}
                  value={draft.id ?? ''}
                  onChange={(event) => {
                    const recipeId = event.target.value
                    if (recipeId) {
                      onSelectRecipe?.(recipeId)
                    } else {
                      onNewRecipe?.()
                    }
                  }}
                >
                  <option value="">New manual recipe</option>
                  {state.recipes.map((recipe) => (
                    <option value={recipe.id} key={recipe.id}>
                      {recipe.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.searchField}>
                <span className={styles.searchLabel}>Title</span>
                <input
                  className={styles.searchInput}
                  placeholder="Chocolate-Dipped Strawberries"
                  value={draft.title}
                  onChange={(event) =>
                    onDraftChange?.({ title: event.target.value })
                  }
                />
              </label>
              <label className={styles.searchField}>
                <span className={styles.searchLabel}>Category</span>
                <select
                  className={styles.searchInput}
                  value={draft.category}
                  onChange={(event) =>
                    onDraftChange?.({ category: event.target.value })
                  }
                >
                  <option value="">Choose category</option>
                  {BLING_KITCHEN_RECIPE_CATEGORIES.map((category) => (
                    <option value={category} key={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.searchField}>
                <span className={styles.searchLabel}>Prep time</span>
                <input
                  className={styles.searchInput}
                  placeholder="20 minutes"
                  value={draft.prepTime}
                  onChange={(event) =>
                    onDraftChange?.({ prepTime: event.target.value })
                  }
                />
              </label>
              <label className={styles.searchField}>
                <span className={styles.searchLabel}>Servings</span>
                <input
                  className={styles.searchInput}
                  inputMode="numeric"
                  placeholder="12"
                  value={draft.servings}
                  onChange={(event) =>
                    onDraftChange?.({ servings: event.target.value })
                  }
                />
              </label>
            </div>

            <div className={styles.siteSettingsGrid}>
              <label className={styles.searchField}>
                <span className={styles.searchLabel}>Slug</span>
                <input
                  className={styles.searchInput}
                  value={draft.slug}
                  placeholder="Auto-created from title"
                  onChange={(event) =>
                    onDraftChange?.({ slug: event.target.value })
                  }
                />
              </label>
            <label className={styles.walletToggleRow}>
              <span className={styles.searchLabel}>Visible in Pantry</span>
              <input
                type="checkbox"
                checked={draft.isVisible}
                onChange={(event) =>
                  onDraftChange?.({ isVisible: event.target.checked })
                }
              />
            </label>
              <label className={styles.sortFieldWide}>
                <span className={styles.searchLabel}>Description</span>
                <textarea
                  className={styles.siteSettingsTextarea}
                  value={draft.description}
                  onChange={(event) =>
                    onDraftChange?.({ description: event.target.value })
                  }
                />
              </label>
            </div>

            <div className={styles.siteSettingsGrid}>
              <label className={styles.sortFieldWide}>
                <span className={styles.searchLabel}>Ingredients</span>
                <textarea
                  className={styles.siteSettingsTextarea}
                  value={draft.ingredientsText}
                  placeholder="One ingredient per line"
                  onChange={(event) =>
                    onDraftChange?.({ ingredientsText: event.target.value })
                  }
                />
              </label>
              <label className={styles.sortFieldWide}>
                <span className={styles.searchLabel}>Steps</span>
                <textarea
                  className={styles.siteSettingsTextarea}
                  value={draft.stepsText}
                  placeholder="One step per line"
                  onChange={(event) =>
                    onDraftChange?.({ stepsText: event.target.value })
                  }
                />
              </label>
              <label className={styles.sortFieldWide}>
                <span className={styles.searchLabel}>Note</span>
                <textarea
                  className={styles.siteSettingsTextarea}
                  value={draft.note}
                  onChange={(event) =>
                    onDraftChange?.({ note: event.target.value })
                  }
                />
              </label>
            </div>

            <div className={styles.siteSettingsGrid}>
              <label className={styles.searchField}>
                <span className={styles.searchLabel}>Image alt text</span>
                <input
                  className={styles.searchInput}
                  value={draft.imageAlt}
                  onChange={(event) =>
                    onDraftChange?.({ imageAlt: event.target.value })
                  }
                />
              </label>
              <label className={styles.searchField}>
                <span className={styles.searchLabel}>Card crop position</span>
                <input
                  className={styles.searchInput}
                  value={draft.imagePosition}
                  onChange={(event) =>
                    onDraftChange?.({ imagePosition: event.target.value })
                  }
                />
              </label>
              <label className={styles.searchField}>
                <span className={styles.searchLabel}>Modal crop position</span>
                <input
                  className={styles.searchInput}
                  value={draft.modalImagePosition}
                  onChange={(event) =>
                    onDraftChange?.({ modalImagePosition: event.target.value })
                  }
                />
              </label>
              <label className={styles.searchField}>
                <span className={styles.searchLabel}>TikTok URL</span>
                <input
                  className={styles.searchInput}
                  value={draft.tiktokUrl}
                  onChange={(event) =>
                    onDraftChange?.({ tiktokUrl: event.target.value })
                  }
                />
              </label>
            </div>

            <div className={styles.actionRow}>
              <button
                type="button"
                className={styles.siteSettingsSaveButton}
                onClick={onSave}
                disabled={Boolean(pendingKey)}
              >
                {pendingKey === 'save' ? 'Saving...' : 'Save recipe'}
              </button>
              <button
                type="button"
                className={styles.secondaryActionButton}
                onClick={() => draft.id && onRemove?.(draft.id)}
                disabled={Boolean(pendingKey) || !canRemove}
              >
                Remove recipe
              </button>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RecipeCardSourceUploader({
  imageUrls,
  pendingKey,
  onRemoveImage,
  onUploadImage,
}: {
  imageUrls: string[]
  pendingKey?: string | null
  onRemoveImage?: (imageUrl: string) => void
  onUploadImage?: (file: File | null) => Promise<void> | void
}) {
  const isUploading = pendingKey === 'upload:recipeCardImageUrls'

  return (
    <div className={styles.recipeSourcePanel}>
      <div className={styles.calendarHeader}>
        <div>
          <div className={styles.walletSettingsTitle}>Recipe-card photos</div>
          <div className={styles.siteSettingsPreviewNote}>
            Upload the card or paper with the ingredients and directions.
          </div>
        </div>
        <label className={styles.recipeUploadButton}>
          {isUploading ? 'Uploading...' : 'Upload recipe card'}
          <input
            type="file"
            accept="image/*"
            disabled={Boolean(pendingKey)}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0] ?? null
              void onUploadImage?.(file)
              event.currentTarget.value = ''
            }}
          />
        </label>
      </div>
      {imageUrls.length > 0 ? (
        <div className={styles.recipeSourceImageGrid}>
          {imageUrls.map((imageUrl) => (
            <div className={styles.recipeSourceImageCard} key={imageUrl}>
              <img src={imageUrl} alt="Recipe card source" />
              <button
                type="button"
                className={styles.secondaryActionButton}
                onClick={() => onRemoveImage?.(imageUrl)}
                disabled={Boolean(pendingKey)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.recipeEditorImageEmpty}>
          No recipe-card photos uploaded yet.
        </div>
      )}
    </div>
  )
}

function RecipeImageField({
  label,
  field,
  imageUrl,
  imageAlt,
  pendingKey,
  onDraftChange,
  onUploadImage,
}: {
  label: string
  field: 'imageUrl' | 'modalImageUrl'
  imageUrl: string
  imageAlt: string
  pendingKey?: string | null
  onDraftChange?: (patch: Partial<RecipeDraft>) => void
  onUploadImage?: (
    field: 'imageUrl' | 'modalImageUrl',
    file: File | null,
  ) => Promise<void> | void
}) {
  const isUploading = pendingKey === `upload:${field}`

  return (
    <div className={styles.recipeImageField}>
      <div className={styles.recipeImageHeader}>
        <span className={styles.searchLabel}>{label}</span>
        <span className={styles.siteSettingsPreviewNote}>
          {imageUrl ? 'Uploaded to Sparkle storage' : 'Upload a photo'}
        </span>
      </div>
      {imageUrl ? (
        <img
          className={styles.recipeEditorImage}
          src={imageUrl}
          alt={imageAlt || label}
        />
      ) : (
        <div className={styles.recipeEditorImageEmpty}>No image selected.</div>
      )}
      <div className={styles.recipeImageActions}>
        <label className={styles.recipeUploadButton}>
          {isUploading ? 'Uploading...' : imageUrl ? 'Replace photo' : 'Upload photo'}
          <input
            type="file"
            accept="image/*"
            disabled={Boolean(pendingKey)}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0] ?? null
              void onUploadImage?.(field, file)
              event.currentTarget.value = ''
            }}
          />
        </label>
        {imageUrl ? (
          <button
            type="button"
            className={styles.secondaryActionButton}
            onClick={() =>
              onDraftChange?.({ [field]: '' } as Partial<RecipeDraft>)
            }
            disabled={Boolean(pendingKey)}
          >
            Remove photo
          </button>
        ) : null}
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

const WISPR_FLOW_INVITE_URL = 'https://wisprflow.ai/r?LOUIS20696'

const BUSINESS_TOOL_PLACEHOLDERS = ['Business Calculator', 'Business Cards'] as const

export function BusinessToolsCard() {
  return (
    <div className={styles.workspaceSectionStack}>
      <div className={styles.workspaceIntroCard}>
        <div className={styles.workspaceSectionHeader}>
          <div>
            <div className={styles.cardTitle}>Business Tools</div>
            <div className={styles.cardSubtitle}>
              Practical add-ons for reps, gathered in one workspace tab as each
              tool becomes ready.
            </div>
          </div>
          <span className={styles.rosterTag}>Tool hub</span>
        </div>
      </div>

      <section className={styles.wisprFlowPanel}>
        <div className={styles.workspaceSectionHeader}>
          <div>
            <div className={styles.walletSettingsTitle}>Wispr Flow</div>
            <p className={styles.businessToolBody}>
              Talk to Nic-Nac without typing during a live show. Wispr Flow turns
              spoken thoughts into polished text across apps, so reps can keep
              moving while they draft prompts, show notes, customer follow-ups,
              and support details.
            </p>
          </div>
          <span className={styles.rosterTag}>Optional</span>
        </div>

        <div className={styles.wisprFlowUseGrid}>
          <div className={styles.wisprFlowUseCard}>
            <div className={styles.wisprFlowUseLabel}>During a show</div>
            <p className={styles.businessToolBody}>
              Speak a Nic-Nac request, capture a customer note, or draft a quick
              follow-up without stopping to type.
            </p>
          </div>
          <div className={styles.wisprFlowUseCard}>
            <div className={styles.wisprFlowUseLabel}>Why it helps</div>
            <p className={styles.businessToolBody}>
              Flow is built for faster voice dictation, automatic cleanup, and
              ready-to-send formatting in everyday text boxes.
            </p>
          </div>
        </div>

        <div className={styles.wisprFlowInviteRow}>
          <a
            className={styles.helperLink}
            href={WISPR_FLOW_INVITE_URL}
            target="_blank"
            rel="noreferrer"
          >
            Open Louis&apos;s Wispr Flow invite
          </a>
          <span className={styles.wisprFlowInviteUrl}>{WISPR_FLOW_INVITE_URL}</span>
        </div>
      </section>

      <div className={styles.businessToolsGrid}>
        {BUSINESS_TOOL_PLACEHOLDERS.map((toolTitle) => (
          <section key={toolTitle} className={styles.businessToolCard}>
            <div className={styles.workspaceSectionHeader}>
              <div>
                <div className={styles.walletSettingsTitle}>{toolTitle}</div>
                <p className={styles.businessToolBody}>Coming Soon</p>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

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

export function TeamManagementCard({
  state = {
    status: 'locked',
    access: { enabled: false, status: 'not_enabled', source: null },
    participants: [],
  },
  actionState,
  createDraft = { displayName: '', contactEmail: '' },
  publicTeamDraft = getJoinTeamRosterDraft(),
  replyDraft = '',
  joinTeamPreviewHref = '/amethyst/Join.html',
  onCreateDraftChange,
  onCreateParticipant,
  onCopyInvite,
  onEmailInvite,
  onArchiveParticipant,
  onPublicTeamDraftChange,
  onSavePublicTeamMember,
  onEditPublicTeamMember,
  onTogglePublicTeamMember,
  onMovePublicTeamMember,
  onRemovePublicTeamMember,
  onReplyDraftChange,
  onSendReply,
}: {
  state?: TeamManagementState
  actionState?: TeamManagementActionState
  createDraft?: TeamManagementCreateDraft
  publicTeamDraft?: JoinTeamRosterDraft
  replyDraft?: string
  joinTeamPreviewHref?: string
  onCreateDraftChange?: (patch: Partial<TeamManagementCreateDraft>) => void
  onCreateParticipant?: () => void
  onCopyInvite?: (accessUrl?: string) => void
  onEmailInvite?: (participant: TeamOnboardingParticipant) => void
  onArchiveParticipant?: (participantId: string) => void
  onPublicTeamDraftChange?: (patch: Partial<JoinTeamRosterDraft>) => void
  onSavePublicTeamMember?: () => void
  onEditPublicTeamMember?: (member: JoinTeamMember) => void
  onTogglePublicTeamMember?: (member: JoinTeamMember) => void
  onMovePublicTeamMember?: (memberId: string, direction: 'up' | 'down') => void
  onRemovePublicTeamMember?: (memberId: string) => void
  onReplyDraftChange?: (value: string) => void
  onSendReply?: (participantId: string) => void
}) {
  const participants = state.participants ?? []
  const publicTeamRoster = state.publicTeamRoster ?? []
  const activeParticipants = participants.filter(
    (participant) => participant.status !== 'archived',
  )
  const selectedParticipant = activeParticipants[0]
  const isLocked = state.status === 'locked' || state.access?.enabled === false
  const isLoading = state.status === 'loading'

  if (isLocked) {
    return (
      <div className={styles.workspacePanel}>
        <div className={styles.workspaceSectionHeader}>
          <div>
            <div className={styles.cardTitle}>Team Management</div>
            <div className={styles.cardSubtitle}>
              Team Management is a paid upgrade. Stripe upgrade can unlock this
              workspace later.
            </div>
          </div>
          <span className={styles.rosterTag}>Paid add-on</span>
        </div>

        <div className={styles.teamUpgradeNotice}>
          <span>
            Create onboarding links, track rep progress, and answer onboarding
            questions after the add-on is active.
          </span>
          <Link className={styles.helperLink} href="/prelaunch">
            View upgrade options
          </Link>
        </div>

        <div className={styles.teamManagementGrid}>
          <section className={styles.teamManagementPanel}>
            <div className={styles.walletSettingsTitle}>Create onboarding link</div>
            <div className={styles.helperNote}>
              Future upgrade flow: open Team Management, confirm the paid add-on
              in Stripe, then this panel unlocks for the rep workspace.
            </div>
            <label className={styles.searchField}>
              <span className={styles.searchLabel}>Rep name</span>
              <input
                className={`${styles.searchInput} ph-no-capture`}
                placeholder="New rep name"
                disabled
              />
            </label>
            <button type="button" className={styles.actionButton} disabled>
              Create link after upgrade
            </button>
          </section>
          <section className={styles.teamManagementPanel}>
            <div className={styles.walletSettingsTitle}>Progress tracking</div>
            <div className={styles.emptyState}>
              New-rep progress appears here after the add-on is active.
            </div>
          </section>
          <section
            className={`${styles.teamManagementPanel} ${styles.teamPublicCardsPanel}`}
          >
            <div className={styles.walletSettingsTitle}>Public Team Cards</div>
            <div className={styles.emptyState}>
              Team member cards can be added to the public Join Team page after
              the add-on is active.
            </div>
          </section>
          <section className={styles.teamManagementPanel}>
            <div className={styles.walletSettingsTitle}>Onboarding messages</div>
            <div className={styles.emptyState}>
              Questions from onboarding sites appear here for the team lead to
              answer from the workspace.
            </div>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.workspacePanel}>
      <div className={styles.workspaceSectionHeader}>
        <div>
          <div className={styles.cardTitle}>Team Management</div>
          <div className={styles.cardSubtitle}>
            Create private Start Strong links, track onboarding progress, and
            answer new-rep questions from this workspace.
          </div>
        </div>
        <span className={styles.rosterTag}>
          {state.access?.status === 'manual_beta' ? 'Brittany beta' : 'Enabled'}
        </span>
      </div>

      {actionState?.error ? (
        <div className={styles.actionError}>{actionState.error}</div>
      ) : null}
      {actionState?.helperMessage ? (
        <div className={styles.helperMessage}>{actionState.helperMessage}</div>
      ) : null}

      <div className={styles.teamManagementGrid}>
        <section className={styles.teamManagementPanel}>
          <div className={styles.walletSettingsTitle}>Create onboarding link</div>
          <div className={styles.helperNote}>
            Enter the rep name, create the private link, then copy it or open
            your email app to send it yourself.
          </div>
          <div className={styles.teamInputGrid}>
            <label className={styles.searchField}>
              <span className={styles.searchLabel}>Rep name</span>
              <input
                className={`${styles.searchInput} ph-no-capture`}
                placeholder="New rep name"
                value={createDraft.displayName}
                onChange={(event) =>
                  onCreateDraftChange?.({ displayName: event.target.value })
                }
              />
            </label>
            <label className={styles.searchField}>
              <span className={styles.searchLabel}>Optional email</span>
              <input
                className={`${styles.searchInput} ph-no-capture`}
                placeholder="rep@example.com"
                value={createDraft.contactEmail}
                onChange={(event) =>
                  onCreateDraftChange?.({ contactEmail: event.target.value })
                }
              />
            </label>
          </div>
          <button
            type="button"
            className={styles.actionButton}
            disabled={actionState?.pendingKey === 'create' || isLoading}
            onClick={onCreateParticipant}
          >
            {actionState?.pendingKey === 'create'
              ? 'Creating link...'
              : 'Create onboarding link'}
          </button>
          <div className={styles.helperNote}>
            Link sharing stays in the team lead&apos;s hands. Sparkle Suite does
            not send team invite texts from this panel.
          </div>
        </section>

        <PublicTeamRosterPanel
          members={publicTeamRoster}
          draft={publicTeamDraft}
          actionState={actionState}
          joinTeamPreviewHref={joinTeamPreviewHref}
          isLoading={isLoading}
          onDraftChange={onPublicTeamDraftChange}
          onSave={onSavePublicTeamMember}
          onEdit={onEditPublicTeamMember}
          onToggle={onTogglePublicTeamMember}
          onMove={onMovePublicTeamMember}
          onRemove={onRemovePublicTeamMember}
        />

        <section className={styles.teamManagementPanel}>
          <div className={styles.walletSettingsTitle}>Rep progress</div>
          {isLoading ? (
            <div className={styles.emptyState}>Loading Team Management...</div>
          ) : activeParticipants.length === 0 ? (
            <div className={styles.emptyState}>
              No onboarding links yet. Create one when Brittany is ready to
              invite the next rep.
            </div>
          ) : (
            activeParticipants.map((participant) => (
              <div key={participant.id} className={styles.teamMessagePreview}>
                <div className={styles.workspaceSectionHeader}>
                  <div>
                    <strong>{participant.displayName}</strong>
                    <div className={styles.helperNote}>
                      {participant.progress.completed} of {participant.progress.total}{' '}
                      completed
                    </div>
                  </div>
                  {participant.unreadMessageCount > 0 ? (
                    <span className={styles.rosterTag}>
                      {participant.unreadMessageCount} new
                    </span>
                  ) : null}
                </div>
                {participant.progress.needsHelp > 0 ? (
                  <div className={styles.helperNote}>Needs help</div>
                ) : null}
                <div className={styles.workspaceInlineActions}>
                  <button
                    type="button"
                    className={styles.helperButton}
                    onClick={() => onCopyInvite?.(participant.accessUrl)}
                  >
                    Copy link
                  </button>
                  <button
                    type="button"
                    className={styles.helperButton}
                    onClick={() => onEmailInvite?.(participant)}
                  >
                    Email with my email app
                  </button>
                  <button
                    type="button"
                    className={styles.helperButton}
                    disabled={actionState?.pendingKey === `archive:${participant.id}`}
                    onClick={() => onArchiveParticipant?.(participant.id)}
                  >
                    Archive
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        <section className={styles.teamManagementPanel}>
          <div className={styles.workspaceSectionHeader}>
            <div className={styles.walletSettingsTitle}>
              {selectedParticipant
                ? `Reply to ${selectedParticipant.displayName}`
                : 'Onboarding messages'}
            </div>
            <span className={styles.rosterTag}>Workspace thread</span>
          </div>
          {selectedParticipant ? (
            <>
              <div className={styles.teamMessagePreview}>
                Questions from {selectedParticipant.displayName}&apos;s Start
                Strong site appear in this thread. Replies are saved back to
                the onboarding site.
              </div>
              <label className={styles.searchField}>
                <span className={styles.searchLabel}>Reply composer</span>
                <textarea
                  className={`${styles.siteSettingsTextarea} ph-no-capture`}
                  placeholder="Write a reply for the onboarding thread"
                  value={replyDraft}
                  onChange={(event) => onReplyDraftChange?.(event.target.value)}
                />
              </label>
              <button
                type="button"
                className={styles.actionButton}
                disabled={
                  actionState?.pendingKey === `reply:${selectedParticipant.id}`
                }
                onClick={() => onSendReply?.(selectedParticipant.id)}
              >
                {actionState?.pendingKey === `reply:${selectedParticipant.id}`
                  ? 'Saving reply...'
                  : 'Send reply'}
              </button>
            </>
          ) : (
            <div className={styles.emptyState}>
              Create a rep onboarding link to open the message thread.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function PublicTeamRosterPanel({
  members,
  draft,
  actionState,
  joinTeamPreviewHref,
  isLoading,
  onDraftChange,
  onSave,
  onEdit,
  onToggle,
  onMove,
  onRemove,
}: {
  members: JoinTeamMember[]
  draft: JoinTeamRosterDraft
  actionState?: TeamManagementActionState
  joinTeamPreviewHref: string
  isLoading: boolean
  onDraftChange?: (patch: Partial<JoinTeamRosterDraft>) => void
  onSave?: () => void
  onEdit?: (member: JoinTeamMember) => void
  onToggle?: (member: JoinTeamMember) => void
  onMove?: (memberId: string, direction: 'up' | 'down') => void
  onRemove?: (memberId: string) => void
}) {
  const saveLabel = draft.id ? 'Save card changes' : 'Save to Join Team page'

  return (
    <section
      className={`${styles.teamManagementPanel} ${styles.teamPublicCardsPanel}`}
    >
      <div className={styles.workspaceSectionHeader}>
        <div>
          <div className={styles.walletSettingsTitle}>Public Team Cards</div>
          <div className={styles.helperNote}>
            Onboarding links do not publish public cards automatically.
          </div>
        </div>
        <Link
          className={styles.helperLink}
          href={joinTeamPreviewHref}
          target="_blank"
          rel="noreferrer"
        >
          Preview Join Team page
        </Link>
      </div>

      <div className={styles.teamRosterWorkspace}>
        <div className={styles.teamRosterEditor}>
          <div className={styles.walletSettingsTitle}>Add team member card</div>
          <div className={styles.teamInputGrid}>
            <label className={styles.searchField}>
              <span className={styles.searchLabel}>First name</span>
              <input
                className={`${styles.searchInput} ph-no-capture`}
                placeholder="Lindsey"
                value={draft.displayName}
                onChange={(event) =>
                  onDraftChange?.({ displayName: event.target.value })
                }
              />
            </label>
            <label className={styles.searchField}>
              <span className={styles.searchLabel}>Show name</span>
              <input
                className={`${styles.searchInput} ph-no-capture`}
                placeholder="Mile High Fizz"
                value={draft.businessName}
                onChange={(event) =>
                  onDraftChange?.({ businessName: event.target.value })
                }
              />
            </label>
            <label className={styles.searchField}>
              <span className={styles.searchLabel}>Profile photo</span>
              <input
                className={`${styles.searchInput} ph-no-capture`}
                placeholder="/team/lindsey.jpg"
                value={draft.photoUrl}
                onChange={(event) =>
                  onDraftChange?.({ photoUrl: event.target.value })
                }
              />
            </label>
          </div>

          <div className={styles.teamSocialGrid}>
            <label className={styles.searchField}>
              <span className={styles.searchLabel}>TikTok</span>
              <input
                className={`${styles.searchInput} ph-no-capture`}
                placeholder="https://www.tiktok.com/@show"
                value={draft.tiktok}
                onChange={(event) => onDraftChange?.({ tiktok: event.target.value })}
              />
            </label>
            <label className={styles.searchField}>
              <span className={styles.searchLabel}>Facebook</span>
              <input
                className={`${styles.searchInput} ph-no-capture`}
                placeholder="VIP group or page"
                value={draft.facebook}
                onChange={(event) =>
                  onDraftChange?.({ facebook: event.target.value })
                }
              />
            </label>
            <label className={styles.searchField}>
              <span className={styles.searchLabel}>Instagram</span>
              <input
                className={`${styles.searchInput} ph-no-capture`}
                placeholder="https://www.instagram.com/show"
                value={draft.instagram}
                onChange={(event) =>
                  onDraftChange?.({ instagram: event.target.value })
                }
              />
            </label>
            <label className={styles.searchField}>
              <span className={styles.searchLabel}>Website</span>
              <input
                className={`${styles.searchInput} ph-no-capture`}
                placeholder="https://example.com"
                value={draft.website}
                onChange={(event) =>
                  onDraftChange?.({ website: event.target.value })
                }
              />
            </label>
            <label className={styles.searchField}>
              <span className={styles.searchLabel}>YouTube</span>
              <input
                className={`${styles.searchInput} ph-no-capture`}
                placeholder="https://www.youtube.com/@show"
                value={draft.youtube}
                onChange={(event) =>
                  onDraftChange?.({ youtube: event.target.value })
                }
              />
            </label>
          </div>

          <label className={styles.teamVisibilityToggle}>
            <input
              type="checkbox"
              checked={draft.isVisible}
              onChange={(event) =>
                onDraftChange?.({ isVisible: event.target.checked })
              }
            />
            <span>Visible on Join Team page</span>
          </label>

          <button
            type="button"
            className={styles.actionButton}
            disabled={actionState?.pendingKey === 'public-team:save' || isLoading}
            onClick={onSave}
          >
            {actionState?.pendingKey === 'public-team:save'
              ? 'Saving card...'
              : saveLabel}
          </button>
        </div>

        <div className={styles.teamRosterList} role="list">
          {members.length === 0 ? (
            <div className={styles.emptyState}>
              Public team cards will appear here before they show on the Join
              Team page.
            </div>
          ) : (
            members.map((member, index) => (
              <div key={member.id} className={styles.teamRosterCard} role="listitem">
                <div className={styles.teamRosterAvatar}>
                  {member.photoUrl ? (
                    <img src={member.photoUrl} alt={member.photoAlt || member.displayName} />
                  ) : (
                    <span>{member.initials || member.displayName.slice(0, 1)}</span>
                  )}
                </div>
                <div className={styles.teamRosterCardBody}>
                  <div className={styles.workspaceSectionHeader}>
                    <div>
                      <strong>{member.businessName || 'Show name missing'}</strong>
                      <div className={styles.helperNote}>{member.displayName}</div>
                    </div>
                    <span className={styles.rosterTag}>
                      {member.isVisible ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                  <div className={styles.teamRosterLinks}>
                    {member.links.tiktok ? <span>TikTok</span> : null}
                    {member.links.facebook ? <span>Facebook</span> : null}
                    {member.links.instagram ? <span>Instagram</span> : null}
                    {member.links.website ? <span>Website</span> : null}
                    {member.links.youtube ? <span>YouTube</span> : null}
                    {Object.values(member.links).every((value) => !value) ? (
                      <span>No links yet</span>
                    ) : null}
                  </div>
                  <div className={styles.workspaceInlineActions}>
                    <button
                      type="button"
                      className={styles.helperButton}
                      onClick={() => onEdit?.(member)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={styles.helperButton}
                      disabled={
                        actionState?.pendingKey ===
                        `public-team:toggle:${member.id}`
                      }
                      onClick={() => onToggle?.(member)}
                    >
                      {member.isVisible ? 'Hide' : 'Show'}
                    </button>
                    <button
                      type="button"
                      className={styles.helperButton}
                      disabled={
                        index === 0 ||
                        actionState?.pendingKey === `public-team:move:${member.id}`
                      }
                      onClick={() => onMove?.(member.id, 'up')}
                    >
                      Move up
                    </button>
                    <button
                      type="button"
                      className={styles.helperButton}
                      disabled={
                        index === members.length - 1 ||
                        actionState?.pendingKey === `public-team:move:${member.id}`
                      }
                      onClick={() => onMove?.(member.id, 'down')}
                    >
                      Move down
                    </button>
                    <button
                      type="button"
                      className={styles.helperButton}
                      disabled={
                        actionState?.pendingKey ===
                        `public-team:remove:${member.id}`
                      }
                      onClick={() => onRemove?.(member.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
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
            <Link
              className={styles.termsLink}
              href="/terms-and-conditions?returnTo=%2Fnic-nac%3Fsection%3Daccount"
            >
              Read Terms and Conditions
            </Link>
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
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [visibleMonthDate, setVisibleMonthDate] = useState(() => referenceDate ?? new Date())

  useEffect(() => {
    if (referenceDate) setVisibleMonthDate(referenceDate)
  }, [referenceDate])

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

  const calendarEvents = [
    ...state.summary.upcomingEvents,
    ...state.summary.recentEvents,
  ]
  const metrics = getShowCalendarMetrics(
    state.summary.upcomingEvents,
    state.summary.recentEvents,
    visibleMonthDate,
    calendarEvents,
  )
  const calendarCells = buildShowCalendarCells(
    calendarEvents,
    visibleMonthDate,
  )
  const selectedEventDetails = selectedEvent
    ? getCalendarEventDetailGroups(selectedEvent)
    : []

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
        <div className={styles.calendarNavControls} aria-label="Calendar month navigation">
          <button
            type="button"
            className={styles.calendarNavButton}
            onClick={() => setVisibleMonthDate((current) => addCalendarMonths(current, -1))}
            aria-label="Previous month"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.calendarNavButton}
            onClick={() => setVisibleMonthDate(new Date())}
            aria-label="Current month"
          >
            Today
          </button>
          <button
            type="button"
            className={styles.calendarNavButton}
            onClick={() => setVisibleMonthDate((current) => addCalendarMonths(current, 1))}
            aria-label="Next month"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
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
                <button
                  key={event.id}
                  type="button"
                  className={`${styles.calendarEventPill} ${getCalendarStatusClassName(event)}`}
                  onClick={() => setSelectedEvent(event)}
                  aria-label={`View details for ${getCalendarEventTitle(event)}`}
                >
                  {getCalendarEventStatusLabel(event)}: {getCalendarEventTitle(event)}
                </button>
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
                <button
                  key={event.id}
                  type="button"
                  className={`${styles.walletTransactionRow} ${styles.calendarEventDetailButton}`}
                  onClick={() => setSelectedEvent(event)}
                  aria-label={`View details for ${getCalendarEventTitle(event)}`}
                >
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
                  <div className={styles.timelineList}>
                    <span
                      className={`${styles.timelineItem} ${getCalendarStatusClassName(event)}`}
                    >
                      {getCalendarEventStatusLabel(event)}
                    </span>
                    {event.isRecurring ? (
                      <span className={styles.timelineItem}>Recurring</span>
                    ) : null}
                  </div>
                </button>
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
                <button
                  key={event.id}
                  type="button"
                  className={`${styles.walletTransactionRow} ${styles.calendarEventDetailButton}`}
                  onClick={() => setSelectedEvent(event)}
                  aria-label={`View details for ${getCalendarEventTitle(event)}`}
                >
                  <div className={styles.walletTransactionCopy}>
                    <span className={styles.walletTransactionTitle}>
                      {getCalendarEventTitle(event)}
                    </span>
                    <span className={styles.walletTransactionDate}>
                      {formatCalendarEventDate(event.eventTime, event.timeZone)} on{' '}
                      {event.platform}
                    </span>
                  </div>
                  <span
                    className={`${styles.timelineItem} ${getCalendarStatusClassName(event)}`}
                  >
                    {getCalendarEventStatusLabel(event)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
      {selectedEvent ? (
        <div
          className={styles.calendarEventDialogBackdrop}
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className={styles.calendarEventDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-event-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.calendarEventDialogHeader}>
              <div>
                <div
                  id="calendar-event-dialog-title"
                  className={styles.calendarEventDialogTitle}
                >
                  {getCalendarEventTitle(selectedEvent)}
                </div>
                <div className={styles.calendarEventDialogSubtitle}>
                  {formatCalendarEventDate(selectedEvent.eventTime, selectedEvent.timeZone)} at{' '}
                  {formatCalendarEventTime(selectedEvent.eventTime, selectedEvent.timeZone)}
                </div>
              </div>
              <button
                type="button"
                className={styles.calendarEventDialogClose}
                onClick={() => setSelectedEvent(null)}
                aria-label="Close event details"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <div className={styles.calendarEventDetailGrid}>
              {selectedEventDetails.map((detail) => (
                <div key={detail.label} className={styles.calendarEventDetailRow}>
                  <span className={styles.calendarEventDetailLabel}>{detail.label}</span>
                  {detail.items ? (
                    <ul className={styles.calendarEventDetailList}>
                      {detail.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className={styles.calendarEventDetailValue}>
                      {detail.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
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
