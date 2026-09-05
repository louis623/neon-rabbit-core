import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

const { insert, single, admin } = vi.hoisted(() => {
  const single = vi.fn()
  const insert = vi.fn((payload: unknown) => {
    void payload
    return { select: vi.fn(() => ({ single })) }
  })
  const admin = vi.fn(() => ({ from: vi.fn(() => ({ insert })) }))
  return { insert, single, admin }
})
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: admin }))

import { POST } from '@/app/api/public/nic-nac/handoff/route'
import { resetPrelaunchRequestGuardForTests } from '@/lib/prelaunch/request-guard'
import { normalizeCustomerWaitlistRow } from '@/lib/prelaunch/customer-waitlist'
import { CustomerWaitlistPanel } from '@/app/control-center/_components/CustomerWaitlistPanel'
import PublicNicNacReviewPage from '@/app/dev/public-nic-nac/page'
import { SparkleSuitePublicNicNac } from '@/app/_components/sparkle-suite-public-nic-nac'

const inquiry = {
  name: '  Reviewer Example  ',
  email: 'REVIEWER@example.test',
  question: 'Can you help with a custom setup question?',
  contactConsent: true,
  website: '',
}
function request(payload: unknown = inquiry, headers: Record<string, string> = {}) {
  return new Request('https://www.yoursparklesuite.com/api/public/nic-nac/handoff', {
    method: 'POST',
    headers: { origin: 'https://www.yoursparklesuite.com', 'content-type': 'application/json', ...headers },
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  resetPrelaunchRequestGuardForTests()
  single.mockResolvedValue({ data: { id: 'test-receipt-1' }, error: null })
})

describe('public Nic-Nac inquiry persistence', () => {
  it('returns a real receipt only after an append-only inquiry save, without enrollment', async () => {
    const response = await POST(request())
    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ ok: true, receipt: 'test-receipt-1' })
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Reviewer Example', email: 'reviewer@example.test', source: 'public_nic_nac',
      lead_status: 'inquiry', email_consent: false, sms_consent: false,
      welcome_email_status: 'skipped', phone: null,
      operator_notes: expect.stringContaining('not a build-queue signup or founder reservation'),
    }))
    // The mocked client supports only insert: no existing lead lookup/update or provider API.
    const second = await POST(request())
    expect(second.status).toBe(201)
    expect(insert).toHaveBeenCalledTimes(2)
  })

  it('does not claim a save when persistence fails or returns no receipt', async () => {
    for (const failure of [{ data: null, error: { message: 'private database detail' } }, { data: {}, error: null }]) {
      single.mockResolvedValueOnce(failure)
      const response = await POST(request())
      expect(response.status).toBe(503)
      expect(await response.json()).toEqual({ error: 'Your question could not be saved. Please try again in a moment.' })
    }
  })

  it('ignores forged enrollment/source fields and never logs submitted contact data', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const response = await POST(request({
        ...inquiry, source: 'prelaunch_site', lead_status: 'start_work_ready',
        email_consent: true, sms_consent: true, account_activated_at: '2026-09-05',
      }))
      expect(response.status).toBe(201)
      expect(insert).toHaveBeenCalledWith(expect.objectContaining({
        source: 'public_nic_nac', lead_status: 'inquiry', email_consent: false, sms_consent: false,
      }))
      expect(insert.mock.calls[0]?.[0]).not.toHaveProperty('account_activated_at')
      single.mockRejectedValueOnce(new Error('Database failure containing reviewer@example.test'))
      expect((await POST(request())).status).toBe(503)
      expect(log).not.toHaveBeenCalled()
    } finally {
      log.mockRestore()
    }
  })

  it.each([
    { ...inquiry, email: 'bad' }, { ...inquiry, name: '' }, { ...inquiry, question: 'x' },
    { ...inquiry, question: 'x'.repeat(2001) }, { ...inquiry, contactConsent: false },
    { ...inquiry, website: 'spam.example' }, 'not-json',
  ])('rejects invalid/unsolicited submissions without database access: %j', async (payload) => {
    expect((await POST(request(payload))).status).toBe(400)
    expect(admin).not.toHaveBeenCalled()
  })

  it('rejects foreign or missing origins, non-JSON, and oversized bodies', async () => {
    expect((await POST(request(inquiry, { origin: 'https://attacker.example' }))).status).toBe(403)
    expect((await POST(request(inquiry, { origin: '' }))).status).toBe(403)
    expect((await POST(request(inquiry, { 'content-type': 'text/plain' }))).status).toBe(415)
    expect((await POST(request('x'.repeat(12001)))).status).toBe(413)
    expect((await POST(request(inquiry, { 'content-length': '12001' }))).status).toBe(413)
    expect(admin).not.toHaveBeenCalled()
  })

  it('permits the exact apex origin but rejects deceptive, customer, and opaque origins', async () => {
    expect((await POST(request(inquiry, { origin: 'https://yoursparklesuite.com' }))).status).toBe(201)
    for (const origin of ['https://www.yoursparklesuite.com.evil.example', 'http://www.yoursparklesuite.com', 'https://goforthebling.com', 'null']) {
      expect((await POST(request(inquiry, { origin }))).status).toBe(403)
    }
    expect(insert).toHaveBeenCalledTimes(1)
  })

  it('rejects malformed UTF-8 without persistence', async () => {
    const malformed = new Request('https://www.yoursparklesuite.com/api/public/nic-nac/handoff', {
      method: 'POST',
      headers: { origin: 'https://www.yoursparklesuite.com', 'content-type': 'application/json' },
      body: new Uint8Array([0xc3, 0x28]),
    })
    expect((await POST(malformed)).status).toBe(400)
    expect(admin).not.toHaveBeenCalled()
  })

  it('rate limits repeated submissions before persistence', async () => {
    for (let index = 0; index < 5; index++) expect((await POST(request())).status).toBe(201)
    expect((await POST(request())).status).toBe(429)
    expect(insert).toHaveBeenCalledTimes(5)
  })

  it('does not enable a local reviewer origin in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    try {
      const local = new Request('http://localhost:3000/api/public/nic-nac/handoff', {
        method: 'POST', headers: { origin: 'http://localhost:3000', 'content-type': 'application/json' },
        body: JSON.stringify(inquiry),
      })
      expect((await POST(local)).status).toBe(403)
      expect(admin).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('simulates failure and receipt only in development, without constructing a database client', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    try {
      expect(renderToStaticMarkup(<PublicNicNacReviewPage />)).toContain('Review mode')
      expect((await POST(request({ ...inquiry, reviewScenario: 'failure' }))).status).toBe(503)
      const response = await POST(request({ ...inquiry, reviewScenario: 'success' }))
      expect(await response.json()).toEqual({ ok: true, receipt: 'REVIEW-ONLY-NOT-SAVED' })
      expect(admin).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('rejects all fixture flags and hides the fixture page in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    try {
      expect(() => PublicNicNacReviewPage()).toThrow()
      expect(renderToStaticMarkup(<SparkleSuitePublicNicNac reviewMode />)).not.toContain('Review controls')
      for (const reviewScenario of ['success', 'failure', false, null]) {
        expect((await POST(request({ ...inquiry, reviewScenario }))).status).toBe(400)
      }
      expect(admin).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('preserves inquiry source and question in the actual Control Center view', () => {
    const lead = normalizeCustomerWaitlistRow({
      id: 'test-receipt-1', name: 'Reviewer Example', email: 'reviewer@example.test',
      phone: null, source: 'public_nic_nac', lead_status: 'inquiry',
      operator_notes: 'Question only — not a build-queue signup. How does setup work?',
      account_activated_at: null, created_at: '2026-09-05T12:00:00Z',
    })
    const html = renderToStaticMarkup(<CustomerWaitlistPanel initialLeads={[lead]} />)
    expect(html).toContain('Nic-Nac question (not a queue signup)')
    expect(html).toContain('How does setup work?')
    expect(lead.source).toBe('public_nic_nac')
  })
})
