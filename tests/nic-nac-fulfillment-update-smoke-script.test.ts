import { describe, expect, it } from 'vitest'

import { getMissingFulfillmentSmokeEnv } from '@/scripts/smoke-nic-nac-fulfillment-update'

describe('Nic-Nac fulfillment update smoke script helpers', () => {
  it('reports the required live smoke environment', () => {
    expect(getMissingFulfillmentSmokeEnv({})).toEqual([
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ])
    expect(
      getMissingFulfillmentSmokeEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
        SUPABASE_SERVICE_ROLE_KEY: 'service',
      }),
    ).toEqual([])
  })
})
