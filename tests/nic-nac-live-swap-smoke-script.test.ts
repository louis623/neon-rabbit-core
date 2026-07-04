import { describe, expect, it } from 'vitest'

import { getMissingLiveSwapSmokeEnv } from '@/scripts/smoke-nic-nac-live-swap'

describe('Nic-Nac live swap smoke script helpers', () => {
  it('reports the required live smoke environment', () => {
    expect(getMissingLiveSwapSmokeEnv({})).toEqual([
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ])
    expect(
      getMissingLiveSwapSmokeEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
        SUPABASE_SERVICE_ROLE_KEY: 'service',
      }),
    ).toEqual([])
  })
})
