import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  'supabase/migrations/20260623120000_show_reminder_preferences.sql',
  'utf8',
)

describe('show reminder migration', () => {
  it('uses explicit grants and RLS policies for new public tables', () => {
    for (const table of [
      'show_reminder_preferences',
      'show_reminder_overrides',
      'show_reminder_runs',
      'show_reminder_run_items',
    ]) {
      expect(migration).toContain(`alter table public.${table} enable row level security`)
      expect(migration).toContain(`grant select`)
    }
    expect(migration).not.toContain("auth.role() = 'service_role'")
    expect(migration).toContain('to service_role')
  })

  it('ties reminder overrides to the same rep as the calendar event at the database layer', () => {
    expect(migration).toContain('calendar_events_id_rep_id_unique')
    expect(migration).toContain('show_reminder_overrides_event_rep_fk')
    expect(migration).toContain('foreign key (event_id, rep_id)')
    expect(migration).toContain('references public.calendar_events(id, rep_id)')
  })
})
