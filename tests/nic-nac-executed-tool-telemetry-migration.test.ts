import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260831120000_nic_nac_executed_tool_telemetry.sql',
  ),
  'utf8',
)

describe('Nic-Nac executed-tool telemetry migration', () => {
  it('separates available tools from actual executions and failures', () => {
    expect(migration).toContain('executed_tool_names text[]')
    expect(migration).toContain('executed_tool_count integer')
    expect(migration).toContain('tool_failure_count integer')
    expect(migration).toContain('tool_failures jsonb')
    expect(migration).toContain('Tools made available to the model')
  })
})
