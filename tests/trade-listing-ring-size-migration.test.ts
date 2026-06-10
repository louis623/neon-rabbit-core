import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260610131500_trade_listing_ring_size.sql'),
  'utf8',
)

describe('trade listing ring size migration', () => {
  it('can be applied more than once without failing on the ring size constraint', () => {
    expect(migration).toMatch(/ADD COLUMN IF NOT EXISTS ring_size TEXT/i)
    expect(migration).toMatch(/EXCEPTION\s+WHEN\s+duplicate_object\s+THEN\s+NULL/i)
    expect(migration).toMatch(/trade_listings_ring_size_not_blank/)
  })

  it('reloads the PostgREST schema cache after adding the ring size column', () => {
    expect(migration).toMatch(/NOTIFY\s+pgrst,\s*'reload schema'/i)
  })
})
