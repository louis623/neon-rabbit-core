import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  join(
    process.cwd(),
    'supabase/migrations/20260825013000_nic_nac_trade_board_intake_rollover.sql',
  ),
  'utf8',
).toLowerCase()

describe('Trade Board intake rollover migration', () => {
  it('moves the active rep-scoped session and photo records atomically', () => {
    expect(migration).toContain(
      'create or replace function public.rpc_rollover_trade_board_intake_v2',
    )
    expect(migration).toContain('security definer')
    expect(migration).toContain('set search_path = public, pg_temp')
    expect(migration).toContain('where rep_id = p_rep_id')
    expect(migration).toContain(
      'and conversation_id = p_source_conversation_id',
    )
    expect(migration).toContain(
      "and status in ('active', 'needs_human_review')",
    )
    expect(migration).toContain('and expires_at > p_now')
    expect(migration).toContain('for update')
    expect(migration).toContain('update public.trade_board_intake_photos')
    expect(migration).toContain('update public.trade_board_intake_sessions')
    expect(migration).toContain(
      'set conversation_id = p_destination_conversation_id',
    )
    expect(migration).toContain('pg_advisory_xact_lock')
    expect(migration).toContain("metadata ->> 'rolloversourceconversationid'")
    expect(migration).toContain("'replayed', true")
  })

  it('allows only the service role to execute the rollover mutation', () => {
    expect(migration).toContain(
      'from public, anon, authenticated',
    )
    expect(migration).toContain('to service_role')
  })
})
