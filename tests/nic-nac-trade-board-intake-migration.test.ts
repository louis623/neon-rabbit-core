import { describe, expect, it } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const migration = readFileSync(
  join(
    process.cwd(),
    'supabase/migrations/20260615170000_nic_nac_trade_board_intake_workflows.sql',
  ),
  'utf8',
)

describe('Nic-Nac Dance Floor intake workflow migration', () => {
  it('creates workflow session and photo tables', () => {
    expect(migration).toContain(
      'create table if not exists public.trade_board_intake_sessions',
    )
    expect(migration).toContain(
      'create table if not exists public.trade_board_intake_photos',
    )
    expect(migration).toContain('workflow_type text not null')
    expect(migration).toContain("check (workflow_type = 'trade_board_add_listing')")
    expect(migration).toContain('declared_role text not null')
    expect(migration).toContain('visual_role text not null')
  })

  it('enforces photo-role and workflow-state constraints', () => {
    expect(migration).toContain(
      "check (status in ('active', 'completed', 'cancelled', 'expired', 'needs_human_review'))",
    )
    expect(migration).toContain(
      "check (current_phase in ('started', 'details_capture', 'photo_capture', 'catalog_match', 'ready_to_add', 'adding', 'completed', 'cancelled', 'needs_human_review'))",
    )
    expect(migration).toContain(
      "check (declared_role in ('label_details', 'jewelry_front', 'unknown', 'other'))",
    )
    expect(migration).toContain(
      "check (visual_role in ('jewelry', 'label_or_packaging', 'uncertain'))",
    )
    expect(migration).toContain(
      "check (quality in ('usable', 'warning', 'blocked', 'unknown'))",
    )
  })

  it('adds observability columns to nic_nac_runs', () => {
    expect(migration).toContain('alter table public.nic_nac_runs')
    expect(migration).toContain('add column if not exists workflow_id uuid')
    expect(migration).toContain('add column if not exists workflow_type text')
    expect(migration).toContain('add column if not exists tool_policy_source text')
    expect(migration).toContain(
      'add column if not exists hard_fail_phrase_count integer',
    )
  })

  it('enables RLS and rep-scoped policies using Sparkle rep ownership', () => {
    expect(migration).toContain(
      'alter table public.trade_board_intake_sessions enable row level security',
    )
    expect(migration).toContain(
      'alter table public.trade_board_intake_photos enable row level security',
    )
    expect(migration).toContain('trade_board_intake_sessions_own_data')
    expect(migration).toContain('trade_board_intake_photos_own_data')
    expect(migration).toContain('trade_board_intake_sessions_admin_full_access')
    expect(migration).toContain('trade_board_intake_photos_admin_full_access')
    expect(migration).toContain(
      'rep_id = (select id from public.reps where auth_user_id = auth.uid())',
    )
  })

  it('grants explicit Data API privileges for workflow access roles', () => {
    expect(migration).toContain(
      'grant select on table public.trade_board_intake_sessions to authenticated',
    )
    expect(migration).toContain(
      'grant select on table public.trade_board_intake_photos to authenticated',
    )
    expect(migration).toContain(
      'grant select, insert, update, delete on table public.trade_board_intake_sessions to service_role',
    )
    expect(migration).toContain(
      'grant select, insert, update, delete on table public.trade_board_intake_photos to service_role',
    )
  })
})
