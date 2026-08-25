import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const sql = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260825014000_nic_nac_trade_board_intake_failures.sql',
  ),
  'utf8',
)

describe('Trade Board intake failure escalation migration', () => {
  it('counts identical failures atomically and pauses on the second run', () => {
    expect(sql).toContain('for update')
    expect(sql).toContain("v_failure_count >= 2")
    expect(sql).toContain("then 'needs_human_review'")
    expect(sql).toContain("'failureSignature', p_failure_signature")
    expect(sql).toContain("'lastFailureRunId', p_run_id")
    expect(sql).not.toContain("v_previous ->> 'lastRunId'")
    expect(sql).toContain("'same_run_replay', v_same_run")
  })

  it('is service-role only and never stores image bodies', () => {
    expect(sql).toContain('from public, anon, authenticated')
    expect(sql).toContain('to service_role')
    expect(sql).not.toMatch(/base64|image_url|parts/i)
  })
})
