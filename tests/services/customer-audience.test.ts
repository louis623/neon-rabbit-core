import { describe, expect, it } from 'vitest'

import {
  getCustomerAudienceMember,
  unsubscribeCustomerAudienceByPhone,
  unsubscribeCustomerAudienceByContact,
  unsubscribeCustomerAudienceMember,
} from '@/lib/services/customer-audience'

type AudienceRow = {
  id: string
  rep_id: string
  name?: string
  phone: string | null
  email: string | null
  sms_consent?: boolean
  email_consent?: boolean
  marketing_consent?: boolean
  consent_date?: string | null
  sms_opted_out_at?: string | null
  email_opted_out_at?: string | null
  stop_keyword_received_at?: string | null
  created_at?: string
}

function makeSupabase(rows: AudienceRow[]) {
  const updateCalls: Array<{ values: Record<string, unknown>; ids: string[] }> = []

  const client = {
    from(table: string) {
      if (table !== 'customer_audience') {
        throw new Error(`Unexpected table ${table}`)
      }

      return {
        select() {
          return {
            async then() {
              return { data: rows, error: null }
            },
            async eq() {
              return { data: rows, error: null }
            },
            async not() {
              return { data: rows, error: null }
            },
          }
        },
        update(values: Record<string, unknown>) {
          return {
            in(column: string, ids: string[]) {
              if (column !== 'id') {
                throw new Error(`Unexpected update filter ${column}`)
              }
              updateCalls.push({ values, ids })
              return Promise.resolve({ error: null })
            },
          }
        },
      }
    },
  }

  return {
    client: client as never,
    updateCalls,
  }
}

describe('customer audience unsubscribe services', () => {
  it('matches SMS opt-outs by canonical phone digits and marks STOP timestamps', async () => {
    const { client, updateCalls } = makeSupabase([
      {
        id: 'aud-1',
        rep_id: 'rep-1',
        phone: '(555) 555-1212',
        email: 'jamie@example.com',
        sms_consent: true,
      },
      {
        id: 'aud-2',
        rep_id: 'rep-2',
        phone: '+1 555 555 1212',
        email: 'jamie+other@example.com',
        sms_consent: true,
      },
      {
        id: 'aud-3',
        rep_id: 'rep-1',
        phone: '+1 555 555 2222',
        email: 'other@example.com',
        sms_consent: true,
      },
    ])

    const result = await unsubscribeCustomerAudienceByPhone(
      client,
      '+15555551212',
      {
        markStopKeywordReceived: true,
      },
    )

    expect(result.updatedCount).toBe(2)
    expect(result.smsUpdatedCount).toBe(2)
    expect(updateCalls).toHaveLength(1)
    expect(updateCalls[0].ids).toEqual(['aud-1', 'aud-2'])
    expect(updateCalls[0].values.sms_opted_out_at).toEqual(expect.any(String))
    expect(updateCalls[0].values.stop_keyword_received_at).toEqual(
      expect.any(String),
    )
  })

  it('supports rep-scoped web unsubscribes for both email and SMS channels', async () => {
    const { client, updateCalls } = makeSupabase([
      {
        id: 'aud-1',
        rep_id: 'rep-preview',
        phone: '(555) 555-1212',
        email: 'jamie@example.com',
        sms_consent: true,
        email_consent: true,
      },
      {
        id: 'aud-2',
        rep_id: 'rep-other',
        phone: '(555) 555-1212',
        email: 'jamie@example.com',
        sms_consent: true,
        email_consent: true,
      },
    ])

    const result = await unsubscribeCustomerAudienceByContact(client, {
      repId: 'rep-preview',
      phone: '555-555-1212',
      email: 'JAMIE@example.com',
      unsubscribeSms: true,
      unsubscribeEmail: true,
    })

    expect(result.updatedCount).toBe(1)
    expect(result.smsUpdatedCount).toBe(1)
    expect(result.emailUpdatedCount).toBe(1)
    expect(updateCalls).toHaveLength(1)
    expect(updateCalls[0].ids).toEqual(['aud-1'])
    expect(updateCalls[0].values.sms_opted_out_at).toEqual(expect.any(String))
    expect(updateCalls[0].values.email_opted_out_at).toEqual(expect.any(String))
  })

  it('can unsubscribe a single audience member by id without touching duplicates', async () => {
    const { client, updateCalls } = makeSupabase([
      {
        id: 'aud-1',
        rep_id: 'rep-preview',
        name: 'Jamie Lane',
        phone: '(555) 555-1212',
        email: 'jamie@example.com',
        sms_consent: true,
        email_consent: true,
        marketing_consent: true,
        consent_date: '2026-05-05T12:00:00Z',
        sms_opted_out_at: null,
        email_opted_out_at: null,
        stop_keyword_received_at: null,
        created_at: '2026-05-05T12:00:00Z',
      },
      {
        id: 'aud-2',
        rep_id: 'rep-preview',
        name: 'Jamie Lane Duplicate',
        phone: '(555) 555-1212',
        email: 'jamie@example.com',
        sms_consent: true,
        email_consent: true,
        marketing_consent: true,
        consent_date: '2026-05-04T12:00:00Z',
        sms_opted_out_at: null,
        email_opted_out_at: null,
        stop_keyword_received_at: null,
        created_at: '2026-05-04T12:00:00Z',
      },
    ])

    const result = await unsubscribeCustomerAudienceMember(client, 'rep-preview', {
      audienceId: 'aud-1',
      unsubscribeSms: true,
      unsubscribeEmail: false,
    })

    expect(result.updatedCount).toBe(1)
    expect(result.smsUpdatedCount).toBe(1)
    expect(result.emailUpdatedCount).toBe(0)
    expect(updateCalls).toHaveLength(1)
    expect(updateCalls[0].ids).toEqual(['aud-1'])
    expect(updateCalls[0].values.sms_opted_out_at).toEqual(expect.any(String))
    expect(updateCalls[0].values).not.toHaveProperty('email_opted_out_at')
  })

  it('returns one mapped audience member by id for the authenticated rep', async () => {
    const { client } = makeSupabase([
      {
        id: 'aud-1',
        rep_id: 'rep-preview',
        name: 'Jamie Lane',
        phone: '(555) 555-1212',
        email: 'jamie@example.com',
        sms_consent: true,
        email_consent: true,
        marketing_consent: true,
        consent_date: '2026-05-05T12:00:00Z',
        sms_opted_out_at: null,
        email_opted_out_at: null,
        stop_keyword_received_at: null,
        created_at: '2026-05-05T12:00:00Z',
      },
      {
        id: 'aud-2',
        rep_id: 'rep-other',
        name: 'Taylor Brooks',
        phone: null,
        email: 'taylor@example.com',
        sms_consent: false,
        email_consent: true,
        marketing_consent: true,
        consent_date: '2026-05-04T12:00:00Z',
        sms_opted_out_at: null,
        email_opted_out_at: null,
        stop_keyword_received_at: null,
        created_at: '2026-05-04T12:00:00Z',
      },
    ])

    const result = await getCustomerAudienceMember(client, 'rep-preview', 'aud-1')

    expect(result).toEqual({
      id: 'aud-1',
      name: 'Jamie Lane',
      phone: '(555) 555-1212',
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
    })
  })
})
