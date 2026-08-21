import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  join(
    process.cwd(),
    'supabase',
    'migrations',
    '20260821191500_ss_finder_rep_directory_visibility.sql',
  ),
  'utf8',
).toLowerCase()

describe('Sparkle Finder rep directory migration', () => {
  it('fails closed for existing and synthetic reps while indexing public eligibility', () => {
    expect(migration).toContain(
      'finder_directory_visible boolean not null default false',
    )
    expect(migration).toContain(
      'where finder_directory_visible = true',
    )
    expect(migration).toContain("and status = 'active'")
    expect(migration).toContain(
      'reps_finder_directory_visible_active_idx',
    )
  })

  it('uses an exact identity-guarded backfill for the established BlingKitchen rep', () => {
    expect(migration).toContain(
      "9a971c05-3631-443e-bcb8-4e9a26e15885'::uuid",
    )
    expect(migration).toContain("public_site_slug = 'blingkitchen'")
    expect(migration).toContain("lower(btrim(display_name)) = 'heather'")
    expect(migration).toContain(
      "raise exception 'blingkitchen finder visibility backfill identity mismatch'",
    )
  })

  it('prevents ordinary authenticated clients from changing visibility', () => {
    expect(migration).toContain('guard_finder_directory_visibility_update')
    expect(migration).toContain("coalesce(auth.role(), '') <> 'service_role'")
    expect(migration).toContain("using errcode = '42501'")
    expect(migration).toContain(
      'revoke all on function public.guard_finder_directory_visibility() from public',
    )
  })

  it('exposes only a bounded service-role RPC with current-show filtering', () => {
    expect(migration).toContain(
      'function public.list_sparkle_finder_public_reps',
    )
    expect(migration).toContain("set search_path = ''")
    expect(migration).toContain('security definer')
    expect(migration).toContain('left join lateral')
    expect(migration).toContain('rep.finder_directory_visible = true')
    expect(migration).toContain("rep.status = 'active'")
    expect(migration).toContain('make_interval')
    expect(migration).toContain('event.event_time >= p_as_of')
    expect(migration).toContain('> p_as_of')
    expect(migration).toContain(
      'limit least(greatest(coalesce(p_limit, 50), 1), 200)',
    )
    expect(migration).toContain(
      'from public, anon, authenticated',
    )
    expect(migration).toContain('to service_role')
    expect(migration).toContain(
      'calendar_events_finder_directory_current_idx',
    )
  })

  it('does not return private account, contact, or favorite fields', () => {
    const returnsSection = migration.slice(
      migration.indexOf('returns table'),
      migration.indexOf('language sql'),
    )

    expect(returnsSection).not.toContain('auth_user_id')
    expect(returnsSection).not.toContain('email')
    expect(returnsSection).not.toContain('phone')
    expect(returnsSection).not.toContain('secret')
    expect(returnsSection).not.toContain('favorite')
  })
})
