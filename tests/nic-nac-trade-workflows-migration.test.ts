import { describe, expect, it } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const migration = readFileSync(
  join(
    process.cwd(),
    'supabase/migrations/20260704101000_nic_nac_trade_workflows.sql',
  ),
  'utf8',
)

describe('Nic-Nac generic Trade workflows migration', () => {
  it('creates the durable generic Trade workflow table', () => {
    expect(migration).toContain(
      'create table if not exists public.nic_nac_trade_workflows',
    )
    expect(migration).toContain('known_fields jsonb not null')
    expect(migration).toContain('candidates jsonb not null')
    expect(migration).toContain('approval_state text not null')
    expect(migration).toContain('db_assertions jsonb not null')
    expect(migration).toContain('public_proof jsonb not null')
    expect(migration).toContain('created_mutation_ids jsonb not null')
  })

  it('allows the Trade workflow types needed beyond add-listing', () => {
    for (const workflowType of [
      'trade_board_add_listing',
      'trade_board_remove_listing',
      'trade_request_decision',
      'trade_swap_capture',
      'trade_swap_cleanup',
      'trade_fulfillment_update',
      'trade_catalog_correction',
    ]) {
      expect(migration).toContain(`'${workflowType}'`)
    }
  })

  it('enforces state and approval enums', () => {
    expect(migration).toContain(
      "status in ('active', 'completed', 'cancelled', 'expired', 'needs_human_review')",
    )
    expect(migration).toContain("'approval_required'")
    expect(migration).toContain("'ready_to_remove'")
    expect(migration).toContain("'ready_to_approve'")
    expect(migration).toContain("'ready_to_report'")
    expect(migration).toContain(
      "approval_state in ('not_required', 'required', 'approved', 'denied')",
    )
  })

  it('enables RLS and service role writes', () => {
    expect(migration).toContain(
      'alter table public.nic_nac_trade_workflows enable row level security',
    )
    expect(migration).toContain('nic_nac_trade_workflows_own_data')
    expect(migration).toContain('nic_nac_trade_workflows_admin_full_access')
    expect(migration).toContain(
      'rep_id = (select id from public.reps where auth_user_id = auth.uid())',
    )
    expect(migration).toContain(
      'grant select on table public.nic_nac_trade_workflows to authenticated',
    )
    expect(migration).toContain(
      'grant select, insert, update, delete on table public.nic_nac_trade_workflows to service_role',
    )
  })
})
