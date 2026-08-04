import type { SupabaseClient } from '@supabase/supabase-js'

import { errors } from './errors'
import type {
  CustomerAudienceChannel,
  CustomerAudienceChangeContext,
  CustomerAudienceContactCreateInput,
  CustomerAudienceContactUpdateInput,
  CustomerAudienceMember,
  CustomerAudienceProfileInput,
  CustomerAudienceResult,
  CustomerAudienceSignupInput,
  CustomerAudienceSignupResult,
  CustomerAudienceUnsubscribeInput,
  CustomerAudienceUnsubscribeResult,
  GetCustomerAudienceFilters,
} from './types'

function normalizeText(value: string | undefined) {
  const trimmed = value?.trim() ?? ''
  return trimmed.length > 0 ? trimmed : null
}

function normalizeEmail(value: string | undefined) {
  const normalized = normalizeText(value)
  return normalized ? normalized.toLowerCase() : null
}

function normalizePhoneDigits(value: string | undefined) {
  const digits = (value ?? '').replace(/\D/g, '')
  if (!digits) return null
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1)
  }
  return digits
}

type CustomerAudienceRow = {
  id: string
  name: string
  rep_id?: string
  phone: string | null
  email: string | null
  address: string | null
  birthday_month: number | null
  birthday_day: number | null
  favorite_gem_or_stone: string | null
  favorite_material: string | null
  favorite_cut: string | null
  favorite_collection: string | null
  notes: string | null
  tags: string[] | null
  sms_consent: boolean | null
  email_consent: boolean | null
  marketing_consent: boolean | null
  consent_date: string | null
  sms_opted_out_at: string | null
  email_opted_out_at: string | null
  stop_keyword_received_at: string | null
  created_at: string
}

const CUSTOMER_AUDIENCE_SELECT_COLUMNS = [
  'id',
  'rep_id',
  'name',
  'phone',
  'email',
  'address',
  'birthday_month',
  'birthday_day',
  'favorite_gem_or_stone',
  'favorite_material',
  'favorite_cut',
  'favorite_collection',
  'notes',
  'tags',
  'sms_consent',
  'email_consent',
  'marketing_consent',
  'consent_date',
  'sms_opted_out_at',
  'email_opted_out_at',
  'stop_keyword_received_at',
  'created_at',
] as const

type NormalizedBirthday = { month: number; day: number } | null

function normalizeBirthday(value: string | null | undefined): NormalizedBirthday {
  const normalized = normalizeText(value ?? undefined)
  if (!normalized) return null

  const match = /^(\d{2})-(\d{2})$/.exec(normalized)
  if (!match) {
    throw errors.INVALID_INPUT(
      'birthday must use MM-DD',
      'Birthday must use month and day in MM-DD format.',
    )
  }

  const month = Number(match[1])
  const day = Number(match[2])
  const candidate = new Date(Date.UTC(2024, month - 1, day))
  if (
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    throw errors.INVALID_INPUT(
      'birthday must be a calendar date',
      'Birthday must be a real month and day.',
    )
  }

  return { month, day }
}

function formatBirthday(month: number | null | undefined, day: number | null | undefined) {
  if (!Number.isInteger(month) || !Number.isInteger(day)) return null
  return `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function normalizeTags(values: string[] | undefined) {
  if (!values) return []
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

function getProfileValues(input: CustomerAudienceProfileInput) {
  const name = normalizeText(input.name)
  if (!name) {
    throw errors.INVALID_INPUT('name required', 'Customer name is required.')
  }

  const birthday = normalizeBirthday(input.birthday)
  return {
    name,
    phone: normalizeText(input.phone ?? undefined),
    email: normalizeEmail(input.email ?? undefined),
    address: normalizeText(input.address ?? undefined),
    birthday_month: birthday?.month ?? null,
    birthday_day: birthday?.day ?? null,
    favorite_gem_or_stone: normalizeText(input.favoriteGemOrStone ?? undefined),
    favorite_material: normalizeText(input.favoriteMaterial ?? undefined),
    favorite_cut: normalizeText(input.favoriteCut ?? undefined),
    favorite_collection: normalizeText(input.favoriteCollection ?? undefined),
    notes: normalizeText(input.notes ?? undefined),
    tags: normalizeTags(input.tags),
  }
}

function getProfileUpdateValues(input: CustomerAudienceContactUpdateInput) {
  const values: Record<string, unknown> = {}

  if ('name' in input) {
    const name = normalizeText(input.name ?? undefined)
    if (!name) {
      throw errors.INVALID_INPUT('name cannot be blank', 'Customer name cannot be blank.')
    }
    values.name = name
  }
  if ('phone' in input) values.phone = normalizeText(input.phone ?? undefined)
  if ('email' in input) values.email = normalizeEmail(input.email ?? undefined)
  if ('address' in input) values.address = normalizeText(input.address ?? undefined)
  if ('birthday' in input) {
    const birthday = normalizeBirthday(input.birthday)
    values.birthday_month = birthday?.month ?? null
    values.birthday_day = birthday?.day ?? null
  }
  if ('favoriteGemOrStone' in input) {
    values.favorite_gem_or_stone = normalizeText(input.favoriteGemOrStone ?? undefined)
  }
  if ('favoriteMaterial' in input) {
    values.favorite_material = normalizeText(input.favoriteMaterial ?? undefined)
  }
  if ('favoriteCut' in input) {
    values.favorite_cut = normalizeText(input.favoriteCut ?? undefined)
  }
  if ('favoriteCollection' in input) {
    values.favorite_collection = normalizeText(input.favoriteCollection ?? undefined)
  }
  if ('notes' in input) values.notes = normalizeText(input.notes ?? undefined)
  if ('tags' in input) values.tags = normalizeTags(input.tags)

  if (Object.keys(values).length === 0) {
    throw errors.INVALID_INPUT(
      'profile update required',
      'Include at least one customer detail to update.',
    )
  }

  return values
}

async function appendCustomerAudienceChange(
  supabase: SupabaseClient,
  input: {
    audienceId: string
    repId: string
    action: 'created' | 'profile_updated'
    changes: Record<string, unknown>
    context: CustomerAudienceChangeContext
  },
) {
  const { error } = await supabase.from('customer_audience_change_log').insert({
    audience_id: input.audienceId,
    rep_id: input.repId,
    actor_kind: input.context.actorKind,
    actor_rep_id: input.context.actorRepId ?? null,
    nic_nac_conversation_id: input.context.nicNacConversationId ?? null,
    nic_nac_run_id: input.context.nicNacRunId ?? null,
    action: input.action,
    changes: input.changes,
  })

  if (error) throw error
}

function clampLimit(value: number | undefined) {
  if (!value || Number.isNaN(value)) return 25
  return Math.max(1, Math.min(100, Math.trunc(value)))
}

function mapAudienceRow(row: CustomerAudienceRow): CustomerAudienceMember {
  const smsConsent = Boolean(row.sms_consent)
  const emailConsent = Boolean(row.email_consent)
  const marketingConsent = Boolean(row.marketing_consent)
  const smsOptedOutAt = row.sms_opted_out_at
  const stopKeywordReceivedAt = row.stop_keyword_received_at
  const emailOptedOutAt = row.email_opted_out_at
  const smsBlocked = Boolean(smsOptedOutAt || stopKeywordReceivedAt)
  const emailBlocked = Boolean(emailOptedOutAt)
  const hasProfileColumns =
    row.address !== undefined ||
    row.birthday_month !== undefined ||
    row.birthday_day !== undefined ||
    row.favorite_gem_or_stone !== undefined ||
    row.favorite_material !== undefined ||
    row.favorite_cut !== undefined ||
    row.favorite_collection !== undefined ||
    row.notes !== undefined ||
    row.tags !== undefined

  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    ...(hasProfileColumns
      ? {
          address: row.address ?? null,
          birthday: formatBirthday(row.birthday_month, row.birthday_day),
          favoriteGemOrStone: row.favorite_gem_or_stone ?? null,
          favoriteMaterial: row.favorite_material ?? null,
          favoriteCut: row.favorite_cut ?? null,
          favoriteCollection: row.favorite_collection ?? null,
          notes: row.notes ?? null,
          tags: row.tags ?? [],
        }
      : {}),
    smsConsent,
    emailConsent,
    marketingConsent,
    canReceiveSms: smsConsent && Boolean(row.phone) && !smsBlocked,
    canReceiveEmail: emailConsent && Boolean(row.email) && !emailBlocked,
    consentDate: row.consent_date,
    createdAt: row.created_at,
    smsOptedOutAt,
    emailOptedOutAt,
    stopKeywordReceivedAt,
  }
}

function matchesChannel(
  customer: CustomerAudienceMember,
  channelFilter: CustomerAudienceChannel,
) {
  if (channelFilter === 'sms') return customer.canReceiveSms
  if (channelFilter === 'email') return customer.canReceiveEmail
  if (channelFilter === 'marketing') return customer.marketingConsent
  return true
}

function summarizeAudience(customers: CustomerAudienceMember[]) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  return {
    totalCustomers: customers.length,
    smsReachableCount: customers.filter((customer) => customer.canReceiveSms).length,
    emailReachableCount: customers.filter((customer) => customer.canReceiveEmail)
      .length,
    marketingConsentCount: customers.filter((customer) => customer.marketingConsent)
      .length,
    smsOptedOutCount: customers.filter(
      (customer) =>
        customer.smsOptedOutAt !== null ||
        customer.stopKeywordReceivedAt !== null,
    ).length,
    emailOptedOutCount: customers.filter(
      (customer) => customer.emailOptedOutAt !== null,
    ).length,
    addedLast30DaysCount: customers.filter(
      (customer) => new Date(customer.createdAt) >= thirtyDaysAgo,
    ).length,
  }
}

function createEmptyUnsubscribeResult(): CustomerAudienceUnsubscribeResult {
  return {
    updatedCount: 0,
    smsUpdatedCount: 0,
    emailUpdatedCount: 0,
  }
}

async function listCustomerAudienceRows(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('customer_audience')
    .select(CUSTOMER_AUDIENCE_SELECT_COLUMNS.join(', '))
    .not('id', 'is', null)

  if (error) throw error
  return (data ?? []) as unknown as CustomerAudienceRow[]
}

async function getCustomerAudienceRowForRep(
  supabase: SupabaseClient,
  repId: string,
  audienceId: string,
) {
  const { data, error } = await supabase
    .from('customer_audience')
    .select(CUSTOMER_AUDIENCE_SELECT_COLUMNS.join(', '))
    .eq('id', audienceId)
    .eq('rep_id', repId)
    .maybeSingle()

  if (error) throw error
  return (data ?? null) as unknown as CustomerAudienceRow | null
}

export async function createCustomerAudienceSignup(
  supabase: SupabaseClient,
  repId: string,
  input: CustomerAudienceSignupInput,
): Promise<CustomerAudienceSignupResult> {
  if (!repId) {
    throw errors.UNAUTHORIZED('repId required')
  }

  const firstName = normalizeText(input.firstName)
  const lastName = normalizeText(input.lastName)
  const email = normalizeText(input.email)
  const phone = normalizeText(input.phone)

  if (!firstName) {
    throw errors.INVALID_INPUT('firstName required', 'First name is required.')
  }

  if (!lastName) {
    throw errors.INVALID_INPUT('lastName required', 'Last name is required.')
  }

  if (!input.smsConsent && !input.emailConsent) {
    throw errors.INVALID_INPUT(
      'at least one contact channel is required',
      'Choose SMS, email, or both before signing up.',
    )
  }

  if (input.smsConsent && !phone) {
    throw errors.INVALID_INPUT(
      'phone required when sms_consent is true',
      'A phone number is required if the customer wants SMS updates.',
    )
  }

  if (input.emailConsent && !email) {
    throw errors.INVALID_INPUT(
      'email required when email_consent is true',
      'An email address is required if the customer wants email updates.',
    )
  }

  const profile = getProfileValues({
    name: `${firstName} ${lastName}`,
    email,
    phone,
    address: input.address,
    birthday: input.birthday,
    favoriteGemOrStone: input.favoriteGemOrStone,
    favoriteMaterial: input.favoriteMaterial,
    favoriteCut: input.favoriteCut,
    favoriteCollection: input.favoriteCollection,
    notes: input.notes,
    tags: input.tags,
  })

  const { data, error } = await supabase
    .from('customer_audience')
    .insert({
      rep_id: repId,
      ...profile,
      sms_consent: input.smsConsent,
      email_consent: input.emailConsent,
      marketing_consent: input.marketingConsent,
      consent_date: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) throw error

  await appendCustomerAudienceChange(supabase, {
    audienceId: data.id as string,
    repId,
    action: 'created',
    changes: profile,
    context: { actorKind: 'customer' },
  })

  return {
    audienceId: data.id as string,
  }
}

/**
 * Creates a rep-owned contact without granting any messaging consent. This is
 * the only supported path for a rep or Nic-Nac to add a manual contact.
 */
export async function createCustomerAudienceContact(
  supabase: SupabaseClient,
  repId: string,
  input: CustomerAudienceContactCreateInput,
  context: CustomerAudienceChangeContext = { actorKind: 'rep' },
): Promise<CustomerAudienceMember> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')

  const profile = getProfileValues(input)
  const { data, error } = await supabase
    .from('customer_audience')
    .insert({
      rep_id: repId,
      ...profile,
      sms_consent: false,
      email_consent: false,
      marketing_consent: false,
      consent_date: null,
    })
    .select(CUSTOMER_AUDIENCE_SELECT_COLUMNS.join(', '))
    .single()

  if (error) throw error
  const row = data as unknown as CustomerAudienceRow

  await appendCustomerAudienceChange(supabase, {
    audienceId: row.id,
    repId,
    action: 'created',
    changes: profile,
    context,
  })

  return mapAudienceRow(row)
}

/**
 * Updates only editable profile values for a contact owned by `repId`.
 * Consent and opt-out columns are intentionally not accepted or written here.
 */
export async function updateCustomerAudienceContact(
  supabase: SupabaseClient,
  repId: string,
  input: CustomerAudienceContactUpdateInput,
  context: CustomerAudienceChangeContext = { actorKind: 'rep' },
): Promise<CustomerAudienceMember | null> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')
  if (!input.audienceId.trim()) {
    throw errors.INVALID_INPUT(
      'audienceId required',
      'I need the customer record before I can update it.',
    )
  }

  const profile = getProfileUpdateValues(input)
  const { data, error } = await supabase
    .from('customer_audience')
    .update(profile)
    .eq('id', input.audienceId.trim())
    .eq('rep_id', repId)
    .select(CUSTOMER_AUDIENCE_SELECT_COLUMNS.join(', '))
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const row = data as unknown as CustomerAudienceRow
  await appendCustomerAudienceChange(supabase, {
    audienceId: row.id,
    repId,
    action: 'profile_updated',
    changes: profile,
    context,
  })

  return mapAudienceRow(row)
}

export async function unsubscribeCustomerAudienceByPhone(
  supabase: SupabaseClient,
  phone: string,
  options: {
    markStopKeywordReceived?: boolean
  } = {},
): Promise<CustomerAudienceUnsubscribeResult> {
  const normalizedPhone = normalizePhoneDigits(phone)

  if (!normalizedPhone) {
    throw errors.INVALID_INPUT(
      'phone required',
      'A phone number is required to unsubscribe SMS updates.',
    )
  }

  const rows = await listCustomerAudienceRows(supabase)
  const matchedRows = rows.filter(
    (row) => normalizePhoneDigits(row.phone ?? undefined) === normalizedPhone,
  )

  if (matchedRows.length === 0) {
    return createEmptyUnsubscribeResult()
  }

  const timestamp = new Date().toISOString()
  const updateValues: Record<string, string> = {
    sms_opted_out_at: timestamp,
  }

  if (options.markStopKeywordReceived) {
    updateValues.stop_keyword_received_at = timestamp
  }

  const { error } = await supabase
    .from('customer_audience')
    .update(updateValues)
    .in(
      'id',
      matchedRows.map((row) => row.id),
    )

  if (error) throw error

  return {
    updatedCount: matchedRows.length,
    smsUpdatedCount: matchedRows.length,
    emailUpdatedCount: 0,
  }
}

export async function unsubscribeCustomerAudienceByContact(
  supabase: SupabaseClient,
  input: CustomerAudienceUnsubscribeInput,
): Promise<CustomerAudienceUnsubscribeResult> {
  if (!input.repId) {
    throw errors.UNAUTHORIZED('repId required')
  }

  if (!input.unsubscribeSms && !input.unsubscribeEmail) {
    throw errors.INVALID_INPUT(
      'at least one unsubscribe channel is required',
      'Choose SMS, email, or both to unsubscribe.',
    )
  }

  const normalizedPhone = normalizePhoneDigits(input.phone)
  const normalizedEmail = normalizeEmail(input.email)

  if (input.unsubscribeSms && !normalizedPhone) {
    throw errors.INVALID_INPUT(
      'phone required when unsubscribeSms is true',
      'A phone number is required to unsubscribe SMS updates.',
    )
  }

  if (input.unsubscribeEmail && !normalizedEmail) {
    throw errors.INVALID_INPUT(
      'email required when unsubscribeEmail is true',
      'An email address is required to unsubscribe email updates.',
    )
  }

  const rows = await listCustomerAudienceRows(supabase)
  const matchedRows = rows.filter((row) => {
    if (row.rep_id !== input.repId) return false

    const phoneMatches =
      input.unsubscribeSms &&
      normalizedPhone !== null &&
      normalizePhoneDigits(row.phone ?? undefined) === normalizedPhone

    const emailMatches =
      input.unsubscribeEmail &&
      normalizedEmail !== null &&
      normalizeEmail(row.email ?? undefined) === normalizedEmail

    return phoneMatches || emailMatches
  })

  if (matchedRows.length === 0) {
    return createEmptyUnsubscribeResult()
  }

  const timestamp = new Date().toISOString()
  const updateValues: Record<string, string> = {}

  if (input.unsubscribeSms) {
    updateValues.sms_opted_out_at = timestamp
  }

  if (input.unsubscribeEmail) {
    updateValues.email_opted_out_at = timestamp
  }

  const { error } = await supabase
    .from('customer_audience')
    .update(updateValues)
    .in(
      'id',
      matchedRows.map((row) => row.id),
    )

  if (error) throw error

  return {
    updatedCount: matchedRows.length,
    smsUpdatedCount: input.unsubscribeSms ? matchedRows.length : 0,
    emailUpdatedCount: input.unsubscribeEmail ? matchedRows.length : 0,
  }
}

export async function unsubscribeCustomerAudienceMember(
  supabase: SupabaseClient,
  repId: string,
  input: {
    audienceId: string
    unsubscribeSms: boolean
    unsubscribeEmail: boolean
  },
): Promise<CustomerAudienceUnsubscribeResult> {
  if (!repId) {
    throw errors.UNAUTHORIZED('repId required')
  }

  if (!input.audienceId) {
    throw errors.INVALID_INPUT(
      'audienceId required',
      'I need the customer record before I can unsubscribe it.',
    )
  }

  if (!input.unsubscribeSms && !input.unsubscribeEmail) {
    throw errors.INVALID_INPUT(
      'at least one unsubscribe channel is required',
      'Choose SMS, email, or both to unsubscribe.',
    )
  }

  const matchedRow = await getCustomerAudienceRowForRep(
    supabase,
    repId,
    input.audienceId,
  )

  if (!matchedRow) {
    return createEmptyUnsubscribeResult()
  }

  const timestamp = new Date().toISOString()
  const updateValues: Record<string, string> = {}

  if (input.unsubscribeSms) {
    updateValues.sms_opted_out_at = timestamp
  }

  if (input.unsubscribeEmail) {
    updateValues.email_opted_out_at = timestamp
  }

  const { error } = await supabase
    .from('customer_audience')
    .update(updateValues)
    .eq('id', matchedRow.id)
    .eq('rep_id', repId)

  if (error) throw error

  return {
    updatedCount: 1,
    smsUpdatedCount: input.unsubscribeSms ? 1 : 0,
    emailUpdatedCount: input.unsubscribeEmail ? 1 : 0,
  }
}

export async function getCustomerAudienceMember(
  supabase: SupabaseClient,
  repId: string,
  audienceId: string,
): Promise<CustomerAudienceMember | null> {
  if (!repId) {
    throw errors.UNAUTHORIZED('repId required')
  }

  if (!audienceId) {
    throw errors.INVALID_INPUT(
      'audienceId required',
      'I need the customer record before I can do that.',
    )
  }

  const matchedRow = await getCustomerAudienceRowForRep(
    supabase,
    repId,
    audienceId,
  )

  return matchedRow ? mapAudienceRow(matchedRow) : null
}

export async function getCustomerAudience(
  supabase: SupabaseClient,
  repId: string,
  filters: GetCustomerAudienceFilters = {},
): Promise<CustomerAudienceResult> {
  if (!repId) {
    throw errors.UNAUTHORIZED('repId required')
  }

  const { data, error } = await supabase
    .from('customer_audience')
    .select(CUSTOMER_AUDIENCE_SELECT_COLUMNS.join(', '))
    .eq('rep_id', repId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const customers = ((data ?? []) as unknown as CustomerAudienceRow[]).map(
    mapAudienceRow,
  )
  const channelFilter = filters.channelFilter ?? 'all'
  const limit = clampLimit(filters.limit)

  return {
    summary: summarizeAudience(customers),
    customers: customers
      .filter((customer) => matchesChannel(customer, channelFilter))
      .slice(0, limit),
  }
}
