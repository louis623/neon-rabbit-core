import { beforeEach, describe, expect, it, vi } from 'vitest'

const createAdminClientMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

import { POST } from '@/app/api/amethyst/customer-audience/route'

function makeAdminClient({
  repId = 'rep-1',
  insertError = null,
}: {
  repId?: string | null
  insertError?: unknown
} = {}) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: repId ? { id: repId } : null,
    error: null,
  })
  const eq = vi.fn().mockReturnValue({ maybeSingle })
  const selectRep = vi.fn().mockReturnValue({ eq })

  const insertSingle = vi.fn().mockResolvedValue({
    data: insertError
      ? null
      : {
          id: 'audience-1',
          rep_id: repId,
        },
    error: insertError,
  })
  const insertSelect = vi.fn().mockReturnValue({ single: insertSingle })
  const insert = vi.fn().mockReturnValue({ select: insertSelect })

  const from = vi.fn((table: string) => {
    if (table === 'reps') {
      return {
        select: selectRep,
      }
    }

    if (table === 'customer_audience') {
      return {
        insert,
      }
    }

    throw new Error(`Unexpected table ${table}`)
  })

  return {
    client: { from } as never,
    spies: {
      from,
      selectRep,
      eq,
      maybeSingle,
      insert,
      insertSelect,
      insertSingle,
    },
  }
}

describe('POST /api/amethyst/customer-audience', () => {
  const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const originalServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const originalHomepagePreviewEmail = process.env.AMETHYST_HOMEPAGE_PREVIEW_EMAIL
  const originalTradePreviewEmail = process.env.AMETHYST_TRADE_PREVIEW_EMAIL

  beforeEach(() => {
    createAdminClientMock.mockReset()
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRoleKey
    process.env.AMETHYST_HOMEPAGE_PREVIEW_EMAIL = originalHomepagePreviewEmail
    process.env.AMETHYST_TRADE_PREVIEW_EMAIL = originalTradePreviewEmail
  })

  it('creates a customer_audience row for the preview rep with separate consent fields', async () => {
    process.env.AMETHYST_HOMEPAGE_PREVIEW_EMAIL = 'preview@example.com'
    const { client, spies } = makeAdminClient()
    createAdminClientMock.mockReturnValue(client)

    const response = await POST(
      new Request('http://localhost/api/amethyst/customer-audience', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          firstName: 'Jamie',
          lastName: 'Lane',
          email: 'jamie@example.com',
          phone: '(555) 555-1212',
          smsConsent: true,
          emailConsent: true,
          marketingConsent: true,
        }),
      }),
    )

    expect(createAdminClientMock).toHaveBeenCalledTimes(1)
    expect(spies.eq).toHaveBeenCalledWith('email', 'preview@example.com')
    expect(spies.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        rep_id: 'rep-1',
        name: 'Jamie Lane',
        email: 'jamie@example.com',
        phone: '(555) 555-1212',
        sms_consent: true,
        email_consent: true,
        marketing_consent: true,
      }),
    )
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      ok: true,
    })
  })

  it('rejects payloads that do not select at least one contact channel', async () => {
    const { client, spies } = makeAdminClient()
    createAdminClientMock.mockReturnValue(client)

    const response = await POST(
      new Request('http://localhost/api/amethyst/customer-audience', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          firstName: 'Jamie',
          lastName: 'Lane',
          email: 'jamie@example.com',
          phone: '(555) 555-1212',
          smsConsent: false,
          emailConsent: false,
          marketingConsent: false,
        }),
      }),
    )

    expect(spies.insert).not.toHaveBeenCalled()
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      code: 'INVALID_INPUT',
      error: 'Choose SMS, email, or both before signing up.',
    })
  })

  it('rejects SMS opt-in when no phone number is provided', async () => {
    const { client, spies } = makeAdminClient()
    createAdminClientMock.mockReturnValue(client)

    const response = await POST(
      new Request('http://localhost/api/amethyst/customer-audience', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          firstName: 'Jamie',
          lastName: 'Lane',
          email: 'jamie@example.com',
          smsConsent: true,
          emailConsent: false,
          marketingConsent: false,
        }),
      }),
    )

    expect(spies.insert).not.toHaveBeenCalled()
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      code: 'INVALID_INPUT',
      error: 'A phone number is required if the customer wants SMS updates.',
    })
  })
})
