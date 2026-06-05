import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')

function readMigration() {
  const file = fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith('_rep_maintained_jewelry_catalog.sql'))
    .sort()
    .at(-1)

  if (!file) throw new Error('rep_maintained_jewelry_catalog migration not found')

  return fs.readFileSync(path.join(migrationsDir, file), 'utf8')
}

describe('rep-maintained jewelry catalog migration', () => {
  it('adds rep attribution columns to jewelry_designs', () => {
    const sql = readMigration()

    expect(sql).toContain('ALTER TABLE jewelry_designs')
    expect(sql).toContain('created_by_rep_id UUID')
    expect(sql).toContain('last_corrected_by_rep_id UUID')
    expect(sql).toContain('last_corrected_at TIMESTAMPTZ')
  })

  it('creates a quiet jewelry catalog change log table', () => {
    const sql = readMigration()

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS jewelry_catalog_change_log')
    expect(sql).toContain('design_id UUID NOT NULL REFERENCES jewelry_designs(id)')
    expect(sql).toContain('rep_id UUID REFERENCES reps(id)')
    expect(sql).toContain('conversation_id TEXT')
    expect(sql).toContain('change_type TEXT NOT NULL')
    expect(sql).toContain("before_state JSONB NOT NULL DEFAULT '{}'::jsonb")
    expect(sql).toContain("after_state JSONB NOT NULL DEFAULT '{}'::jsonb")
  })

  it('keeps catalog history quiet by enabling RLS without rep read policies', () => {
    const sql = readMigration()

    expect(sql).toContain('ALTER TABLE jewelry_catalog_change_log ENABLE ROW LEVEL SECURITY')
    expect(sql).not.toContain('jewelry_catalog_change_log_public')
    expect(sql).not.toContain('jewelry_catalog_change_log_reps_read')
  })
})
