import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const sql = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260825016000_trade_swap_resume_integrity.sql',
  ),
  'utf8',
)

describe('trade swap retry integrity migration', () => {
  it('stores both the visible variant and a stable retry signature', () => {
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS revealed_material TEXT')
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS input_signature TEXT')
    expect(sql).toContain('trade_swaps_input_signature_format')
    expect(sql).toContain("input_signature ~ '^[0-9a-f]{64}$'")
  })

  it('keeps legacy rows valid while requiring nonblank material on new captures', () => {
    expect(sql).toContain('revealed_material IS NULL')
    expect(sql).toContain('length(btrim(revealed_material)) > 0')
    expect(sql).toContain('input_signature IS NULL')
  })
})
