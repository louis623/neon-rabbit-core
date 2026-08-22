import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')

function readMigration() {
  const file = fs
    .readdirSync(migrationsDir)
    .filter((name) =>
      name.endsWith('_birthday_collection_names_include_year.sql'),
    )
    .sort()
    .at(-1)

  if (!file) {
    throw new Error('birthday collection name year migration not found')
  }

  return fs.readFileSync(path.join(migrationsDir, file), 'utf8')
}

describe('Birthday collection name year migration', () => {
  it('backfills Birthday collection names with their collection_year', () => {
    const sql = readMigration()

    expect(sql).toContain('UPDATE public.collections')
    expect(sql).toContain("name ILIKE '%Birthday%'")
    expect(sql).toContain('collection_year::text')
    expect(sql).toContain('NOT (name ~')
  })

  it('backfills active Dance Floor intake session collection names with their year', () => {
    const sql = readMigration()

    expect(sql).toContain('UPDATE public.trade_board_intake_sessions')
    expect(sql).toContain('collection_name')
    expect(sql).toContain('collection_year')
  })
})
