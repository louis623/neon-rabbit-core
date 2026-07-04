import { describe, expect, it } from 'vitest'

import { getMissingTradeRequestDecisionSmokeEnv } from '@/scripts/smoke-nic-nac-trade-request-decisions'

describe('Nic-Nac trade-request decision smoke script helpers', () => {
  it('reports the required live smoke environment', () => {
    expect(getMissingTradeRequestDecisionSmokeEnv({})).toEqual([
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ])
    expect(
      getMissingTradeRequestDecisionSmokeEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
        SUPABASE_SERVICE_ROLE_KEY: 'service',
      }),
    ).toEqual([])
  })
})
