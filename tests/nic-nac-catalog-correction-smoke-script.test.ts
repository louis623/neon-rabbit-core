import { describe, expect, it } from 'vitest'

import { getMissingCatalogCorrectionSmokeEnv } from '@/scripts/smoke-nic-nac-catalog-correction'

describe('Nic-Nac catalog correction smoke script helpers', () => {
  it('reports the required catalog correction smoke environment', () => {
    expect(getMissingCatalogCorrectionSmokeEnv({})).toEqual([
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ])
    expect(
      getMissingCatalogCorrectionSmokeEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
        SUPABASE_SERVICE_ROLE_KEY: 'service',
      }),
    ).toEqual([])
  })
})
