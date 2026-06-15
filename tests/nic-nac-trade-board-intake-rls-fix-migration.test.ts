import { describe, expect, it } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const migration = readFileSync(
  join(
    process.cwd(),
    'supabase/migrations/20260615230915_fix_nic_nac_workflow_rls_policies.sql',
  ),
  'utf8',
)

describe('Nic-Nac Trade Board intake workflow RLS fix migration', () => {
  it('replaces broad workflow policies with role-scoped policies', () => {
    expect(migration).toContain(
      'drop policy if exists trade_board_intake_sessions_own_data',
    )
    expect(migration).toContain(
      'drop policy if exists trade_board_intake_photos_admin_full_access',
    )
    expect(migration).toContain('to authenticated')
    expect(migration).toContain('to service_role')
  })

  it('uses init-plan-safe auth lookups for rep-owned reads', () => {
    expect(migration).toContain('public.reps.auth_user_id = (select auth.uid())')
    expect(migration).not.toContain('auth.role()')
  })

  it('keeps only the intended Data API privileges on workflow tables', () => {
    expect(migration).toContain(
      'revoke all on table public.trade_board_intake_sessions from anon',
    )
    expect(migration).toContain(
      'revoke insert, update, delete, truncate, references, trigger',
    )
    expect(migration).toContain(
      'grant select on table public.trade_board_intake_sessions to authenticated',
    )
    expect(migration).toContain(
      'grant select, insert, update, delete on table public.trade_board_intake_photos to service_role',
    )
  })
})
