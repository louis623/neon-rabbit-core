import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260611190000_trade_swap_revealed_item_capture.sql',
)

describe('trade swap revealed item capture migration', () => {
  it('creates trade_swaps with replacement status and listing links', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8')

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.trade_swaps')
    expect(sql).toContain(
      'request_id UUID UNIQUE NOT NULL REFERENCES public.trade_requests(id)',
    )
    expect(sql).toContain(
      'outgoing_listing_id UUID NOT NULL REFERENCES public.trade_listings(id)',
    )
    expect(sql).toContain('revealed_item_number TEXT NOT NULL')
    expect(sql).toContain('revealed_ring_size TEXT')
    expect(sql).toContain(
      'revealed_design_id UUID REFERENCES public.jewelry_designs(id)',
    )
    expect(sql).toContain(
      'replacement_listing_id UUID REFERENCES public.trade_listings(id)',
    )
    expect(sql).toContain(
      "replacement_status IN ('added_to_board', 'needs_catalog_details', 'needs_ring_size')",
    )
    expect(sql).toContain("NOTIFY pgrst, 'reload schema'")
  })

  it('adds rep-scoped RLS policies through the request listing owner', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8')

    expect(sql).toContain(
      'ALTER TABLE public.trade_swaps ENABLE ROW LEVEL SECURITY',
    )
    expect(sql).toContain('trade_swaps_own_data')
    expect(sql).toContain(
      'JOIN public.trade_listings tl ON tr.listing_id = tl.id',
    )
    expect(sql).toContain(
      'WHERE tl.rep_id = (SELECT id FROM public.reps WHERE auth_user_id = auth.uid())',
    )
  })
})
