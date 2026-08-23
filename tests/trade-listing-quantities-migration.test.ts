import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const migrationPath = resolve(
  process.cwd(),
  'supabase/migrations/20260823170000_trade_listing_quantities.sql',
)

describe('trade listing quantities migration', () => {
  it('groups identical available catalog copies and preserves a nonnegative quantity', () => {
    const sql = readFileSync(migrationPath, 'utf8')

    expect(sql).toContain('ADD COLUMN IF NOT EXISTS quantity_available INTEGER NOT NULL DEFAULT 1')
    expect(sql).toContain('CHECK (quantity_available >= 0)')
    expect(sql).toContain('WITH duplicate_groups AS')
    expect(sql).toContain('sum(quantity_available) AS total_quantity')
    expect(sql).toContain("SET status = 'removed'")
  })

  it('uses atomic quantity-aware add and trade request RPCs', () => {
    const sql = readFileSync(migrationPath, 'utf8')

    expect(sql).toContain('rpc_add_or_increment_catalog_listing')
    expect(sql).toContain('quantity_available = quantity_available + 1')
    expect(sql).toContain('rpc_submit_trade_request')
    expect(sql).toContain('rpc_approve_trade')
    expect(sql).toContain('rpc_reject_trade')
    expect(sql).toContain("'quantity_available', v_remaining_quantity")
  })
})
