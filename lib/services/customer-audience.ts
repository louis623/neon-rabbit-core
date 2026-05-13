import type { SupabaseClient } from '@supabase/supabase-js'

import { errors } from './errors'
import type {
  CustomerAudienceChannel,
  CustomerAudienceMember,
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
  sms_consent: boolean | null
  email_consent: boolean | null
  marketing_consent: boolean | null
  consent_date: string | null
  sms_opted_out_at: string | null
  email_opted_out_at: string | null
  stop_keyword_received_at: string | null
  created_at: string
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

  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
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
    .select(
      [
        'id',
        'rep_id',
        'name',
        'phone',
        'email',
        'sms_consent',
        'email_consent',
        'marketing_consent',
        'consent_date',
        'sms_opted_out_at',
        'email_opted_out_at',
        'stop_keyword_received_at',
        'created_at',
      ].join(', '),
    )
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
    .select(
      [
        'id',
        'rep_id',
        'name',
        'phone',
        'email',
        'sms_consent',
        'email_consent',
        'marketing_consent',
        'consent_date',
        'sms_opted_out_at',
        'email_opted_out_at',
        'stop_keyword_received_at',
        'created_at',
      ].join(', '),
    )
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

  const { data, error } = await supabase
    .from('customer_audience')
    .insert({
      rep_id: repId,
      name: `${firstName} ${lastName}`,
      phone,
      email,
      sms_consent: input.smsConsent,
      email_consent: input.emailConsent,
      marketing_consent: input.marketingConsent,
      consent_date: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) throw error

  return {
    audienceId: data.id as string,
  }
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
    .select(
      [
        'id',
        'name',
        'phone',
        'email',
        'sms_consent',
        'email_consent',
        'marketing_consent',
        'consent_date',
        'sms_opted_out_at',
        'email_opted_out_at',
        'stop_keyword_received_at',
        'created_at',
      ].join(', '),
    )
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
