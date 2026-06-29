import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260629150000_non_item_number_trade_listings.sql',
  ),
  'utf8',
)

describe('non-item-number trade listings migration', () => {
  it('adds the listing mode and listing-local controlled fields', () => {
    expect(migration).toMatch(/ALTER TABLE public\.trade_listings[\s\S]*ALTER COLUMN design_id DROP NOT NULL/i)
    expect(migration).toMatch(/ADD COLUMN IF NOT EXISTS listing_source TEXT/i)
    expect(migration).toMatch(/ADD COLUMN IF NOT EXISTS manual_type_prefix TEXT/i)
    expect(migration).toMatch(/ADD COLUMN IF NOT EXISTS manual_collection_family TEXT/i)
    expect(migration).toMatch(/ADD COLUMN IF NOT EXISTS manual_collection_name TEXT/i)
    expect(migration).toMatch(/ADD COLUMN IF NOT EXISTS manual_size TEXT/i)
    expect(migration).toMatch(/ADD COLUMN IF NOT EXISTS manual_photo_url TEXT/i)
    expect(migration).toMatch(/UPDATE public\.trade_listings[\s\S]*SET listing_source = 'catalog'/i)
  })

  it('enforces catalog and non-item-number row invariants', () => {
    expect(migration).toMatch(/trade_listings_listing_source_valid/i)
    expect(migration).toMatch(/listing_source IN \('catalog', 'non_item_number'\)/i)
    expect(migration).toMatch(/trade_listings_catalog_requires_design/i)
    expect(migration).toMatch(/listing_source <> 'catalog' OR design_id IS NOT NULL/i)
    expect(migration).toMatch(/trade_listings_non_item_number_requires_no_design/i)
    expect(migration).toMatch(/listing_source <> 'non_item_number' OR design_id IS NULL/i)
    expect(migration).toMatch(/trade_listings_non_item_number_required_fields/i)
    expect(migration).toMatch(/manual_type_prefix IS NOT NULL/i)
    expect(migration).toMatch(/manual_collection_family IS NOT NULL/i)
    expect(migration).toMatch(/manual_photo_url IS NOT NULL/i)
  })

  it('requires ring size for non-item-number rings and keeps catalog indexes focused', () => {
    expect(migration).toMatch(/trade_listings_non_item_number_ring_size_required/i)
    expect(migration).toMatch(/manual_type_prefix <> 'RG' OR manual_size IS NOT NULL/i)
    expect(migration).toMatch(/CREATE INDEX IF NOT EXISTS idx_trade_listings_catalog_design/i)
    expect(migration).toMatch(/WHERE listing_source = 'catalog'/i)
    expect(migration).toMatch(/CREATE INDEX IF NOT EXISTS idx_trade_listings_rep_source_status/i)
  })

  it('updates approval metrics only for catalog-backed listings and reloads PostgREST', () => {
    expect(migration).toMatch(/IF v_listing\.design_id IS NOT NULL THEN[\s\S]*UPDATE public\.jewelry_designs/i)
    expect(migration).toMatch(/NOTIFY\s+pgrst,\s*'reload schema'/i)
  })
})
