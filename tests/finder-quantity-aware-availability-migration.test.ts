import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260825017000_finder_quantity_aware_availability.sql',
  ),
  'utf8',
).toLowerCase()

describe('Finder quantity-aware availability migration', () => {
  it('allows multiple pending reservations only through the row-locking rpc', () => {
    expect(sql).toContain('drop index if exists public.idx_one_pending_request_per_listing')
    expect(sql).toContain('create index if not exists idx_trade_requests_pending_listing')
    expect(sql).toContain('drop policy if exists "requests_public_insert"')
    expect(sql).toContain(
      'revoke insert on table public.trade_requests from public, anon, authenticated',
    )
    expect(sql).toContain('for update')
    expect(sql).toContain('v_pending_count >= v_listing.quantity_available')
    expect(sql.indexOf('select count(*)::integer')).toBeLessThan(
      sql.indexOf('insert into public.trade_requests'),
    )
    expect(sql).toContain(
      'revoke all on function public.rpc_submit_trade_request(uuid, text, text)',
    )
    expect(sql).toMatch(
      /grant execute on function public\.rpc_submit_trade_request\(uuid, text, text\)\s+to service_role/,
    )
  })

  it('makes new customer submissions replay-safe while preserving the legacy RPC', () => {
    expect(sql).toContain('add column if not exists submission_id uuid')
    expect(sql).toContain('idx_trade_requests_submission_id_unique')
    expect(sql).toContain('rpc_submit_trade_request_v2')
    expect(sql).toContain('pg_advisory_xact_lock')
    expect(sql).toContain('idempotency_conflict')
    expect(sql).toContain("'mutation_replayed', true")
    expect(sql).toContain("'mutation_replayed', false")
    expect(sql).toMatch(/create or replace function public\.rpc_submit_trade_request\([\s\S]+gen_random_uuid\(\)/)
    expect(sql).toMatch(/revoke all on function public\.rpc_submit_trade_request_v2[\s\S]+to service_role/)
  })

  it('adds a service-role-only atomic read rpc with net quantities and stable bucket pages', () => {
    const readRpc = sql.slice(sql.indexOf('list_sparkle_finder_availability_v2'))
    expect(readRpc).toContain('greatest(')
    expect(readRpc).toContain('listing.quantity_available - coalesce(pending.pending_count, 0)')
    expect(readRpc).toContain("listing.status = 'available'")
    expect(readRpc).toContain("listing.listing_source = 'catalog'")
    expect(readRpc).toContain('row_number() over')
    expect(readRpc).toContain('listed_at desc nulls last')
    expect(readRpc).toContain('listing_id desc')
    expect(readRpc).toContain('count(*) filter')
    expect(readRpc).toContain('sum(net_quantity) filter')
    expect(readRpc).not.toContain('finder_directory_visible')
    expect(readRpc).not.toContain('customer_name')
    expect(readRpc).not.toContain('customer_description')
    expect(readRpc).toContain('set statement_timeout = \'5s\'')
    expect(readRpc).toContain(
      'revoke all on function public.list_sparkle_finder_availability_v2',
    )
    expect(readRpc).toContain('to service_role')
  })

  it('adds bounded indexes for active listings and pending reservation aggregation', () => {
    expect(sql).toContain('idx_trade_listings_finder_availability_exact')
    expect(sql).toContain('idx_trade_listings_finder_availability_rep_order')
    expect(sql).toContain('idx_trade_listings_public_board_net_order')
    expect(sql).toContain('(design_id, listed_at desc, id desc)')
    expect(sql).toContain("where listing_source = 'catalog'")
    expect(sql).toContain("and status = 'available'")
    expect(sql).toContain("where status = 'pending'")
  })

  it('adds a service-only atomic customer Dance Floor net-quantity page', () => {
    const customerRpc = sql.slice(
      sql.indexOf('list_amethyst_public_trade_board_net_v2'),
    )
    expect(customerRpc).toContain('listing.quantity_available - coalesce(pending.pending_count, 0)')
    expect(customerRpc.indexOf('where net_quantity > 0')).toBeLessThan(
      customerRpc.indexOf('limit case'),
    )
    expect(customerRpc).toContain('listed_at desc nulls last, listing_id desc')
    expect(customerRpc).not.toContain('customer_name')
    expect(customerRpc).not.toContain('customer_description')
    expect(customerRpc).toContain("set statement_timeout = '5s'")
    expect(customerRpc).toMatch(/revoke all on function[\s\S]+from public, anon, authenticated/)
    expect(customerRpc).toMatch(/grant execute on function[\s\S]+to service_role/)
  })
})
