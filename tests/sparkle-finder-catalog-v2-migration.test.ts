import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationPath = resolve(
  process.cwd(),
  'supabase/migrations/20260825018000_sparkle_finder_catalog_v2.sql',
)

describe('Sparkle Finder catalog v2 migration', () => {
  it('uses bounded database functions for exact pages, facets, and exact batches', () => {
    const sql = readFileSync(migrationPath, 'utf8')

    expect(sql).toContain('sparkle_finder_catalog_filtered_v2')
    expect(sql).toContain('list_sparkle_finder_catalog_v2')
    expect(sql).toContain('list_sparkle_finder_catalog_facets_v2')
    expect(sql).toContain('get_sparkle_finder_catalog_batch_v2')
    expect(sql).toMatch(/SET statement_timeout TO '5s'/gi)
    expect(sql).toContain('created_at DESC NULLS LAST, id DESC')
    expect(sql).toContain('idx_jewelry_designs_finder_catalog_order')
  })

  it('keeps SQL functions server-owned and does not alter catalog identity constraints', () => {
    const sql = readFileSync(migrationPath, 'utf8')

    expect(sql).toMatch(/REVOKE ALL ON FUNCTION[\s\S]+FROM PUBLIC, anon, authenticated/gi)
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION[\s\S]+TO service_role/gi)
    expect(sql).not.toMatch(/DROP\s+(?:INDEX|CONSTRAINT|TABLE|COLUMN)/i)
    expect(sql).not.toMatch(/ALTER\s+TABLE\s+public\.jewelry_designs/i)
    expect(sql).not.toContain('special_features')
  })

  it('filters before limiting and aggregates facets from the complete filtered relation', () => {
    const sql = readFileSync(migrationPath, 'utf8')

    expect(sql).toContain('filtered AS MATERIALIZED')
    expect(sql).toMatch(/SELECT count\(\*\)[\s\S]+FROM filtered/i)
    expect(sql).toMatch(/FROM public\.sparkle_finder_catalog_filtered_v2[\s\S]+GROUP BY collection_name/i)
    expect(sql).toContain("lower(btrim(tag)) = lower(btrim(p_query))")
  })

  it('applies the catalog label before choosing direct, tag, or collection fallback mode', () => {
    const sql = readFileSync(migrationPath, 'utf8')

    expect(sql).toMatch(/labeled AS MATERIALIZED \([\s\S]+catalog_label = p_label[\s\S]+search_mode AS/i)
    expect(sql).toMatch(/EXISTS \(SELECT 1 FROM labeled WHERE direct_match\)/i)
    expect(sql).toMatch(/EXISTS \(SELECT 1 FROM labeled WHERE tag_match\)/i)
    expect(sql).not.toMatch(/FROM base\s+CROSS JOIN search_mode/i)
  })
})
