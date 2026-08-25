import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const sql = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260825015000_trade_listing_quantity_concurrency.sql',
  ),
  'utf8',
)

describe('catalog listing quantity concurrency repair', () => {
  it('locks the no-row-yet grouping identity before lookup', () => {
    expect(sql).toContain('idx_trade_listings_active_catalog_group_unique')
    expect(sql).toContain('trade_listing_catalog_group_digest')
    expect(sql).toContain("md5('sparkle-suite:'")
    expect(sql).toContain('pg_advisory_xact_lock')
    expect(sql).toContain('hashtextextended(v_group_key, 0)')
    expect(sql).toContain("status in ('available', 'pending_trade')")
    expect(sql).toContain('for update')
  })

  it('reconciles mixed active statuses before creating the unique digest index', () => {
    expect(sql.indexOf('_trade_listing_catalog_reconcile')).toBeLessThan(
      sql.indexOf('idx_trade_listings_active_catalog_group_unique'),
    )
    expect(sql).toContain('request.listing_id = reconcile.id')
    expect(sql).toContain("set status = 'removed'")
    expect(sql).toContain('quantity_available = 0')
    expect(sql).toContain('count(*) over catalog_group as group_count')
    expect(sql).toContain('where group_count > 1')
  })

  it('stores and replays one result per durable logical mutation', () => {
    expect(sql).toContain('trade_listing_add_mutations')
    expect(sql).toContain('primary key (rep_id, idempotency_key)')
    expect(sql).toContain('p_idempotency_key text')
    expect(sql).toContain('p_input_signature text')
    expect(sql).toContain("jsonb_build_object('mutation_replayed', true)")
    expect(sql).toContain("'mutation_replayed', false")
    expect(sql).toContain(
      'catalog listing idempotency key reused with different input',
    )
  })

  it('lands a v2 RPC without removing the legacy production function', () => {
    expect(sql).toContain(
      'create or replace function public.rpc_add_or_increment_catalog_listing(',
    )
    expect(sql).toContain(
      'create or replace function public.rpc_add_or_increment_catalog_listing_v2',
    )
    expect(sql).not.toContain(
      'drop function if exists public.rpc_add_or_increment_catalog_listing(',
    )
    const legacyRpc = sql.slice(
      sql.indexOf(
        'create or replace function public.rpc_add_or_increment_catalog_listing(',
      ),
      sql.indexOf('create table if not exists public.trade_listing_add_mutations'),
    )
    expect(legacyRpc).toContain("status in ('available', 'pending_trade')")
    expect(legacyRpc).toContain('pg_advisory_xact_lock')
  })

  it('uses a fixed-width digest rather than indexing unbounded text columns', () => {
    const indexStart = sql.indexOf(
      'create unique index if not exists idx_trade_listings_active_catalog_group_unique',
    )
    const indexEnd = sql.indexOf(';', indexStart)
    const indexSql = sql.slice(indexStart, indexEnd)
    expect(indexSql).toContain('trade_listing_catalog_group_digest')
    expect(indexSql).not.toContain(') nulls not distinct')
    expect(sql).toContain('returns text')
    expect(sql).toContain("md5(jsonb_build_array(")
  })

  it('restores availability when added inventory exceeds pending requests', () => {
    expect(sql).toContain("where listing_id = v_listing.id")
    expect(sql).toContain("and status = 'pending'")
    expect(sql).toContain('when v_pending_count >= v_new_quantity')
    expect(sql).toContain("else 'available'::listing_status")
  })
})
