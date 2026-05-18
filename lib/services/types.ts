// Source of truth for shared service-layer types. Imports flow OUT of this
// file; nothing in `types.ts` imports from another service file. trade-board.ts,
// trade-requests.ts, trade-fulfillment.ts, and jewelry-database.ts all import
// types from here. trade-board.ts re-exports the legacy types for backward
// compatibility with the existing 4 callers of @/lib/services/trade-board.

// ============================================================================
// Postgres enums — mirrored verbatim from supabase/migrations/006_*.sql
// Do NOT add values that don't exist in the DB.
// ============================================================================

export type ListingStatus = 'available' | 'pending_trade' | 'traded' | 'removed'
export type TradeRequestStatus = 'pending' | 'approved' | 'denied' | 'cancelled'
export type FulfillmentStatus = 'approved' | 'shipped' | 'completed'
export type JewelryType = 'RG' | 'NK' | 'ER' | 'ST' | 'BR'
export type RemovalReason = 'sold' | 'keeping' | 'mistake' | 'other'
export type RejectionReason = 'msrp_mismatch' | 'not_interested' | 'changed_mind' | 'other'

// ============================================================================
// trade-board domain — existing types (preserved shape)
// ============================================================================

export interface TradeListingWithDesign {
  id: string
  rep_id: string
  status: ListingStatus
  rep_notes: string | null
  trade_preferences: string | null
  listing_photo_url: string | null
  uses_canonical_photo: boolean
  listed_at: string | null
  removal_reason: RemovalReason | null
  deleted_at: string | null
  created_at: string
  updated_at: string
  design: {
    id: string
    item_number: string
    design_name: string
    material: string | null
    main_stone: string | null
    bp_msrp: number | null
    canonical_photo_url: string | null
    type_prefix: JewelryType
    collection: { id: string; name: string } | null
  }
}

export interface BoardResult {
  listings: TradeListingWithDesign[]
  summary: {
    totalPieces: number
    totalMsrp: number
    typeBreakdown: Record<JewelryType, number>
    pendingRequestCount: number
  }
}

export interface RemoveListingResult {
  listingId: string
  designName: string
  previousStatus: ListingStatus
  cancelledRequestId?: string
  cancelledRequestCustomerName?: string
}

export interface RestoreListingInput {
  listingId?: string
  itemNumber?: string
}

export interface RestoreListingResult {
  listingId: string
  designName: string
  status: 'available'
  deletedAt: string
  recoveryWindowDays: 7 | 30
}

export interface PurgeRemovedListingsResult {
  purgedCount: number
  cutoffIso: string
}

export interface GetMyBoardFilters {
  statusFilter?: ListingStatus
  collectionFilter?: string
  typeFilter?: JewelryType
  sortBy?: 'created_at' | 'listed_at' | 'msrp' | 'design_name' | 'collection'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// ============================================================================
// trade-board domain — new types
// ============================================================================

export interface AddListingInput {
  itemNumber: string
  clickwrapAccepted: boolean
  collectionName?: string
  repNotes?: string
  tradePreferences?: string
  listingPhotoUrl?: string // when omitted, falls back to canonical photo
}

export interface AddListingResult {
  listingId: string
  designId: string
  itemNumber: string
  designName: string
  status: ListingStatus
  usesCanonicalPhoto: boolean
}

export interface BatchListingItem {
  itemNumber: string
  repNotes?: string
  tradePreferences?: string
  listingPhotoUrl?: string
}

export interface AddListingBatchInput {
  items: BatchListingItem[]
  clickwrapAccepted: boolean
}

export interface AddListingBatchResult {
  added: AddListingResult[]
  pending: {
    needCollection: Array<{
      itemNumber: string
      designId: string
      designName: string
    }>
    needFullInfo: Array<{ itemNumber: string }>
  }
}

export interface UpdateListingInput {
  repNotes?: string | null
  tradePreferences?: string | null
  listingPhotoUrl?: string | null
  // When true, clears listing_photo_url and sets uses_canonical_photo=true
  useCanonicalPhoto?: boolean
}

export interface UpdateListingResult {
  listingId: string
  status: ListingStatus
}

// ============================================================================
// calendar / show management domain
// ============================================================================

export type EventStatus = 'scheduled' | 'live' | 'completed' | 'cancelled'

export interface DiscountCode {
  code: string
  description: string
}

export interface RecurringShowInput {
  cadence: 'daily' | 'weekly'
  duration: '1_month' | '3_months' | 'ongoing'
}

export interface CalendarEvent {
  id: string
  repId: string
  platform: string
  eventTime: string
  durationMinutes: number
  title: string | null
  description: string | null
  discountCodes: DiscountCode[]
  featuredCollections: string[] | null
  isRecurring: boolean
  recurrenceGroupId: string | null
  recurrenceRule: string | null
  status: EventStatus
  createdAt: string
  updatedAt: string
}

export interface AddShowInput {
  platform: string
  eventTime: string
  durationMinutes?: number
  title?: string
  description?: string
  discountCodes?: DiscountCode[]
  featuredCollections?: string[]
  recurring?: RecurringShowInput
}

export interface AddShowResult {
  events: CalendarEvent[]
  count: number
}

export interface ListShowsInput {
  status?: EventStatus | EventStatus[]
  upcoming?: boolean
  limit?: number
}

export interface ListShowsResult {
  events: CalendarEvent[]
  totalCount: number
}

export interface UpdateShowInput {
  platform?: string
  eventTime?: string
  durationMinutes?: number
  title?: string
  description?: string
  discountCodes?: DiscountCode[]
  featuredCollections?: string[]
  applyToSeries?: boolean
}

export interface UpdateShowResult {
  event: CalendarEvent
  updatedCount: number
}

export interface CancelShowResult {
  event: CalendarEvent
}

// ============================================================================
// trade-requests domain
// ============================================================================

export interface SubmitTradeRequestInput {
  listingId: string
  customerName: string
  customerDescription: string
  clickwrapAcknowledged: boolean
}

export interface SubmitTradeRequestResult {
  requestId: string
  listingId: string
}

export interface CustomerAudienceSignupInput {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  smsConsent: boolean
  emailConsent: boolean
  marketingConsent: boolean
}

export interface CustomerAudienceSignupResult {
  audienceId: string
}

export interface CustomerAudienceUnsubscribeInput {
  repId: string
  phone?: string
  email?: string
  unsubscribeSms: boolean
  unsubscribeEmail: boolean
}

export interface CustomerAudienceUnsubscribeResult {
  updatedCount: number
  smsUpdatedCount: number
  emailUpdatedCount: number
}

export type CustomerAudienceChannel = 'all' | 'sms' | 'email' | 'marketing'

export interface GetCustomerAudienceFilters {
  channelFilter?: CustomerAudienceChannel
  limit?: number
}

export interface CustomerAudienceMember {
  id: string
  name: string
  phone: string | null
  email: string | null
  smsConsent: boolean
  emailConsent: boolean
  marketingConsent: boolean
  canReceiveSms: boolean
  canReceiveEmail: boolean
  consentDate: string | null
  createdAt: string
  smsOptedOutAt: string | null
  emailOptedOutAt: string | null
  stopKeywordReceivedAt: string | null
}

export interface CustomerAudienceSummary {
  totalCustomers: number
  smsReachableCount: number
  emailReachableCount: number
  marketingConsentCount: number
  smsOptedOutCount: number
  emailOptedOutCount: number
  addedLast30DaysCount: number
}

export interface CustomerAudienceResult {
  summary: CustomerAudienceSummary
  customers: CustomerAudienceMember[]
}

export type WalletTransactionType =
  | 'load'
  | 'sms_charge'
  | 'refund'
  | 'adjustment'
  | 'auto_recharge'

export interface WalletTransactionSummary {
  id: string
  type: WalletTransactionType
  amountMils: number
  description: string | null
  createdAt: string
}

export interface WalletDashboardResult {
  balanceMils: number
  balanceUsd: number
  estimatedTextsRemaining: number
  messagesSentThisMonth: number
  messagesSpendThisMonthMils: number
  messagesSpendThisMonthUsd: number
  autoRechargeEnabled: boolean
  autoRechargePending: boolean
  autoRechargeThresholdMils: number
  autoRechargeThresholdUsd: number
  autoRechargeAmountMils: number
  autoRechargeAmountUsd: number
  minimumLoadAmountMils: number
  minimumLoadAmountUsd: number
  lastLoadedAt: string | null
  recentTransactions: WalletTransactionSummary[]
}

export type HeroAnimationType = 'zoom' | 'pan'

export interface SiteSettingsDashboardResult {
  displayName: string
  businessName: string
  email: string
  phone: string
  bannerText: string
  bannerVisible: boolean
  tickerText: string
  tickerVisible: boolean
  tagline: string
  heroImageUrl: string
  heroAnimationType: HeroAnimationType
  teamName: string
  showJoinPage: boolean
  socialHandles: Record<string, string>
}

export interface UpdateSiteSettingsDashboardInput {
  displayName?: string
  businessName?: string
  email?: string
  phone?: string
  bannerText?: string
  bannerVisible?: boolean
  tickerText?: string
  tickerVisible?: boolean
  tagline?: string
  heroImageUrl?: string
  heroAnimationType?: HeroAnimationType
  teamName?: string
  showJoinPage?: boolean
  socialHandles?: Record<string, string>
}

export type AccountBillingSubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'paused'
  | 'trialing'

export interface AccountBillingSubscriptionSummary {
  status: AccountBillingSubscriptionStatus
  planType: 'monthly'
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  cancelledAt: string | null
  livemode: boolean
}

export interface AccountBillingPaymentMethodSummary {
  brand: string
  last4: string
  expMonth: number
  expYear: number
}

export interface AccountBillingInvoiceSummary {
  id: string
  createdAt: string
  amountPaidCents: number
  currency: string
  status: string | null
  hostedInvoiceUrl: string | null
  invoicePdfUrl: string | null
}

export interface AccountBillingDashboardResult {
  stripeConfigured: boolean
  subscription: AccountBillingSubscriptionSummary | null
  paymentMethod: AccountBillingPaymentMethodSummary | null
  invoices: AccountBillingInvoiceSummary[]
  canStartSubscription: boolean
  canManageBilling: boolean
}

export type RepMessageType =
  | 'monthly_report'
  | 'newsletter'
  | 'announcement'
  | 'support_request'
  | 'support_response'

export type MessageDirection = 'nr_to_rep' | 'rep_to_nr'

export interface RepMessageSummary {
  id: string
  messageType: RepMessageType
  direction: MessageDirection
  subject: string | null
  body: string
  isRead: boolean
  readAt: string | null
  createdAt: string
}

export interface GetRepMessagesFilters {
  limit?: number
  messageType?: RepMessageType
  unreadOnly?: boolean
}

export interface RepMessagesDashboardResult {
  unreadCount: number
  messages: RepMessageSummary[]
}

export interface CreateRepSupportMessageInput {
  subject: string
  body: string
}

export interface HelpResource {
  id: string
  category: string
  title: string
  summary: string
  body: string
  quickActions: string[]
}

export interface SiteAnalyticsPrivacySummary {
  disablesIpCapture: boolean
  masksSensitiveInputs: boolean
  identifiesAfterLoginOnly: boolean
}

export interface SiteAnalyticsOverview {
  pageViews30d: number | null
  uniqueVisitors30d: number | null
  topTrafficSource: string | null
  topDeviceType: string | null
}

export interface SiteAnalyticsBreakdownItem {
  label: string
  value: number
}

export interface SiteAnalyticsOperationalSnapshot {
  activeListings: number
  pendingRequests: number
  upcomingShows: number
  reachableCustomers: number
}

export interface SiteAnalyticsDashboardResult {
  configured: boolean
  privacy: SiteAnalyticsPrivacySummary
  overview: SiteAnalyticsOverview
  topPages: SiteAnalyticsBreakdownItem[]
  trafficSources: SiteAnalyticsBreakdownItem[]
  deviceMix: SiteAnalyticsBreakdownItem[]
  operationalSnapshot: SiteAnalyticsOperationalSnapshot
}

export interface LiveQueueSnapshot {
  syncCode: string
  queue: string[]
  queueLength: number
  currentCustomer: string | null
  onDeckCustomer: string | null
  lastUpdated: string | null
  ageSeconds: number | null
  staleAfterSeconds: number
  isFresh: boolean
}

export interface PrelaunchWaitlistInput {
  name: string
  email: string
  phone: string
  tiktokHandle: string
  teamRepName: string
  setupPain?: string
  smsConsent: boolean
  emailConsent: boolean
}

export interface PrelaunchWaitlistInsert {
  name: string
  email: string
  phone: string | null
  tiktok_handle: string
  team_rep_name: string
  setup_pain: string | null
  sms_consent: boolean
  email_consent: boolean
  source: 'prelaunch_site'
}

export type PrelaunchWaitlistWelcomeEmailStatus =
  | 'not_attempted'
  | 'sent'
  | 'skipped'
  | 'failed'

export interface PrelaunchIntakeInput {
  fullName: string
  email: string
  phone: string
  businessName: string
  tiktokHandle: string
  instagramHandle: string
  facebookUrl: string
  teamName?: string
  teamSize: string
  primaryPlatform: string
  streamingFrequency: string
  currentSetup: string
  setupGoal: string
  deviceSetup: string
  brandVibe?: string
  colorPreferences?: string
  specialRequests?: string
  smsConsent: boolean
  emailConsent: boolean
}

export interface PrelaunchIntakeValidated {
  fullName: string
  email: string
  phone: string
  businessName: string
  tiktokHandle?: string
  instagramHandle?: string
  facebookUrl?: string
  teamName?: string
  teamSize: string
  primaryPlatform: string
  streamingFrequency: string
  currentSetup: string
  setupGoal: string
  deviceSetup: string
  brandVibe?: string
  colorPreferences?: string
  specialRequests?: string
  smsConsent: true
  emailConsent: true
}

export type PrelaunchPrequalificationStatus = 'qualified' | 'needs_review'

export interface PrelaunchIntakeInsert {
  full_name: string
  email: string
  phone: string
  business_name: string
  tiktok_handle: string | null
  instagram_handle: string | null
  facebook_url: string | null
  team_name: string | null
  team_size: string
  primary_platform: string
  streaming_frequency: string
  current_setup: string
  setup_goal: string
  device_setup: string
  brand_vibe: string | null
  color_preferences: string | null
  special_requests: string | null
  sms_consent: boolean
  email_consent: boolean
  prequalification_status: PrelaunchPrequalificationStatus
  fit_flags: string[]
  waitlist_id: string | null
  scout_input_status: 'ready'
  warmup_sequence_status: 'intake_received'
  source: 'prelaunch_intake'
}

export interface GetTradeRequestsFilters {
  statusFilter?: TradeRequestStatus // default: 'pending'
  limit?: number
}

export interface TradeRequestWithListing {
  id: string
  status: TradeRequestStatus
  customerName: string
  customerDescription: string
  rejectionReason: RejectionReason | null
  repNotes: string | null
  createdAt: string
  updatedAt: string
  listing: {
    id: string
    repId: string
    listingPhotoUrl: string | null
    usesCanonicalPhoto: boolean
    design: {
      id: string
      itemNumber: string
      designName: string
      collectionName: string | null
      material: string | null
      mainStone: string | null
      bpMsrp: number | null
      canonicalPhotoUrl: string | null
      typePrefix: JewelryType
    }
  }
}

export interface TradeRequestNotificationSummary {
  requestId: string
  repId: string
  customerName: string
  customerDescription: string
  listing: {
    id: string
    itemNumber: string
    designName: string
    collectionName: string | null
    typePrefix: JewelryType
    bpMsrp: number | null
  }
}

export interface ApproveTradeResult {
  requestId: string
  fulfillmentId: string
  listingId: string
  customerName: string
}

export interface RejectTradeResult {
  requestId: string
  listingId: string
  listingRestored: boolean
}

export interface GetTradeHistoryOptions {
  limit?: number
}

export interface TradeHistoryItem {
  requestId: string
  listingId: string
  customerName: string
  status: TradeRequestStatus
  fulfillmentStatus: FulfillmentStatus | null
  createdAt: string
  completedAt: string | null
  fulfillmentDays: number | null
  design: {
    itemNumber: string
    designName: string
    bpMsrp: number | null
    typePrefix: JewelryType
    collectionName: string | null
  }
}

export interface TradeHistoryResult {
  items: TradeHistoryItem[]
  summary: {
    totalCompleted: number
    totalMsrpTraded: number
    avgFulfillmentDays: number | null
    topDesign: { itemNumber: string; designName: string; count: number } | null
    repeatCustomers: Array<{ customerName: string; count: number }>
  }
}

// ============================================================================
// trade-fulfillment domain
// ============================================================================

export type UpdateFulfillmentInput =
  | {
      requestId: string
      nextStatus: FulfillmentStatus
      shippingNotes?: string
      addToBoard?: boolean
    }
  | {
      customerName: string
      nextStatus: FulfillmentStatus
      shippingNotes?: string
      addToBoard?: boolean
    }

export interface UpdateFulfillmentResult {
  fulfillmentId: string
  requestId: string
  previousStatus: FulfillmentStatus
  status: FulfillmentStatus
  completedAt: string | null
  shouldPromptAddToBoard: boolean
}

export interface FulfillmentQueueItem {
  fulfillmentId: string
  requestId: string
  status: FulfillmentStatus
  customerName: string
  designName: string
  itemNumber: string
  statusUpdatedAt: string
  daysSinceLastUpdate: number
}

// ============================================================================
// jewelry-database domain
// ============================================================================

export interface SearchJewelryInput {
  query: string
  limit?: number
}

export interface JewelryDatabaseResult {
  designId: string
  itemNumber: string
  designName: string
  material: string | null
  mainStone: string | null
  bpMsrp: number | null
  canonicalPhotoUrl: string | null
  typePrefix: JewelryType
  collectionName: string | null
  isOnMyBoard: boolean
  activeListingsCount: number
}

export type ResolveItemNumberResult =
  | { found: false; itemNumber: string }
  | {
      found: true
      design: {
        id: string
        itemNumber: string
        designName: string
        material: string | null
        mainStone: string | null
        bpMsrp: number | null
        canonicalPhotoUrl: string | null
        typePrefix: JewelryType
        collectionId: string | null
        collectionName: string | null
      }
      hasCollection: boolean
    }

export interface CreateDesignInput {
  itemNumber: string
  designName: string
  piecePhotoUrl: string
  material?: string
  mainStone?: string
  bpMsrp?: number
  collectionName?: string
  specialFeatures?: string
  lengthInfo?: string
  photoPipeline?: PhotoPipelineStatePatch
}

export interface CreateDesignResult {
  designId: string
  itemNumber: string
  collectionId: string | null
  collectionName: string | null
  typePrefix: JewelryType
}

export interface UpdateDesignCollectionInput {
  designId: string
  collectionName: string
}

export interface UpdateDesignCollectionResult {
  designId: string
  collectionId: string
  collectionName: string
}

export interface UpdateCanonicalPhotoResult {
  designId: string
  canonicalPhotoUrl: string
}

export type PhotoPipelineStatus =
  | 'pending'
  | 'staged'
  | 'preflight_failed'
  | 'ready'
  | 'processing'
  | 'qa_review'
  | 'approved'
  | 'rejected'
  | 'published'
  | 'error'

export interface PhotoPipelineStatePatch {
  originalPath?: string | null
  originalUrl?: string | null
  enhancedUrl?: string | null
  provider?: string | null
  status?: PhotoPipelineStatus
  preflightScore?: number | null
  preflightIssues?: unknown[] | null
  qaDecision?: 'approve' | 'review' | 'hold' | 'reject' | null
  qaConfidence?: number | null
  processedAt?: string | null
}

export interface UpdatePhotoPipelineStateResult {
  designId: string
  photoPipelineStatus: PhotoPipelineStatus
  enhancedPhotoUrl: string | null
}
