import { describe, expect, it } from 'vitest'

import {
  hasExactWaitlistDeleteConfirmation,
  normalizeCustomerWaitlistRow,
} from '@/lib/prelaunch/customer-waitlist'

describe('customer waitlist', () => {
  it('keeps landing-page signups and manual entries in one operator view', () => {
    expect(
      normalizeCustomerWaitlistRow({
        id: 'lead-1',
        name: 'Landing Customer',
        email: 'landing@example.com',
        phone: null,
        source: 'prelaunch_site',
        lead_status: 'new',
        operator_notes: null,
        account_activated_at: null,
        created_at: '2026-08-04T12:00:00.000Z',
      }),
    ).toMatchObject({ source: 'landing_page', notes: '' })

    expect(
      normalizeCustomerWaitlistRow({
        id: 'lead-2',
        name: 'Manual Customer',
        email: 'manual@example.com',
        phone: '555-0100',
        source: 'operator_manual',
        lead_status: 'new',
        operator_notes: 'Met at a local show.',
        account_activated_at: '2026-08-04T12:10:00.000Z',
        created_at: '2026-08-04T12:00:00.000Z',
      }),
    ).toMatchObject({
      source: 'manual',
      notes: 'Met at a local show.',
      accountActivatedAt: '2026-08-04T12:10:00.000Z',
    })
  })

  it('requires an exact customer-name confirmation before a removal can proceed', () => {
    expect(hasExactWaitlistDeleteConfirmation('Taylor Morgan', 'Taylor Morgan')).toBe(true)
    expect(hasExactWaitlistDeleteConfirmation('Taylor Morgan', 'taylor morgan')).toBe(false)
    expect(hasExactWaitlistDeleteConfirmation('Taylor Morgan', 'Taylor')).toBe(false)
    expect(hasExactWaitlistDeleteConfirmation('Taylor Morgan', '')).toBe(false)
  })
})
