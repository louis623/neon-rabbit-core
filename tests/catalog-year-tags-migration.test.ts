import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')

function readMigration() {
  const file = fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith('_catalog_year_tags.sql'))
    .sort()
    .at(-1)

  if (!file) throw new Error('catalog_year_tags migration not found')
  return fs.readFileSync(path.join(migrationsDir, file), 'utf8')
}

describe('catalog year and tags migration', () => {
  it('adds collection_year to collections with a practical year check', () => {
    const sql = readMigration()

    expect(sql).toContain('ALTER TABLE collections')
    expect(sql).toContain('collection_year INTEGER')
    expect(sql).toContain('collections_collection_year_check')
    expect(sql).toContain('collection_year BETWEEN 2020 AND 2040')
  })

  it('adds normalized search tags to jewelry_designs', () => {
    const sql = readMigration()

    expect(sql).toContain('ALTER TABLE jewelry_designs')
    expect(sql).toContain("search_tags TEXT[] NOT NULL DEFAULT '{}'::text[]")
    expect(sql).toContain('idx_designs_search_tags')
    expect(sql).toContain('USING GIN (search_tags)')
  })

  it('extends catalog change log issue types for tag and year corrections', () => {
    const sql = readMigration()

    expect(sql).toContain('wrong_collection_year')
    expect(sql).toContain('wrong_tags')
  })
})
