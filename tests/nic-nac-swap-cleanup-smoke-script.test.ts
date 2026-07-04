import { describe, expect, it } from 'vitest'

import { getMissingSwapCleanupSmokeEnv } from '@/scripts/smoke-nic-nac-swap-cleanup'

describe('Nic-Nac swap cleanup smoke script helpers', () => {
  it('reports the required live smoke environment', () => {
    expect(getMissingSwapCleanupSmokeEnv({})).toEqual([
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ])
    expect(
      getMissingSwapCleanupSmokeEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
        SUPABASE_SERVICE_ROLE_KEY: 'service',
      }),
    ).toEqual([])
  })
})
