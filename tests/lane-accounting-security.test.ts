import { afterEach, describe, expect, it } from 'vitest'

import { laneAccountingSecurityResponse } from '@/lib/lane-accounting/security'

describe('Lane accounting connector security', () => {
  afterEach(() => {
    delete process.env.LANE_ACCOUNTING_INGEST_TOKEN
  })

  it('fails closed until the dedicated Lane token is configured', () => {
    expect(laneAccountingSecurityResponse(
      new Request('https://www.yoursparklesuite.com/api/lane/accounting/mcp'),
    )?.status).toBe(503)
  })

  it('accepts only its dedicated bearer token', () => {
    process.env.LANE_ACCOUNTING_INGEST_TOKEN = 'lane-test-token'
    expect(laneAccountingSecurityResponse(
      new Request('https://www.yoursparklesuite.com/api/lane/accounting/mcp', {
        headers: { authorization: 'Bearer lane-test-token' },
      }),
    )).toBeNull()
    expect(laneAccountingSecurityResponse(
      new Request('https://www.yoursparklesuite.com/api/lane/accounting/mcp', {
        headers: { authorization: 'Bearer shared-control-center-token' },
      }),
    )?.status).toBe(401)
  })
})
