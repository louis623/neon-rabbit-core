import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260627134500_jewelry_design_item_number_material_variants.sql',
  ),
  'utf8',
)

describe('jewelry design item-number material variants migration', () => {
  it('replaces item-number-only uniqueness with item-number plus normalized material', () => {
    expect(migration).toMatch(
      /DROP CONSTRAINT IF EXISTS jewelry_designs_item_number_key/i,
    )
    expect(migration).toContain('idx_jewelry_designs_item_material_unique')
    expect(migration).toMatch(/item_number,\s*COALESCE/i)
    expect(migration).toMatch(/lower\(btrim\(material\)\)/i)
  })

  it('reloads PostgREST schema after the catalog constraint change', () => {
    expect(migration).toMatch(/NOTIFY\s+pgrst,\s*'reload schema'/i)
  })
})
