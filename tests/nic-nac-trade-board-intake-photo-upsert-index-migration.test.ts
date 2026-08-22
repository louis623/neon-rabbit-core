import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  join(
    process.cwd(),
    'supabase/migrations/20260616003229_fix_trade_board_intake_photo_upsert_index.sql',
  ),
  'utf8',
)

describe('Nic-Nac Dance Floor intake photo upsert index migration', () => {
  it('replaces the partial photo identity index with an upsert-inferable unique index', () => {
    expect(migration).toContain(
      'drop index if exists public.idx_trade_board_intake_photos_message_attachment',
    )
    expect(migration).toContain(
      'create unique index if not exists idx_trade_board_intake_photos_message_attachment',
    )
    expect(migration).toContain(
      'on public.trade_board_intake_photos (session_id, conversation_message_id, attachment_index)',
    )
    expect(migration).not.toContain('where conversation_message_id is not null')
    expect(migration).toContain("notify pgrst, 'reload schema'")
  })
})
