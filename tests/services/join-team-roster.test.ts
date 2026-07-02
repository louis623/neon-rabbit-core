import { describe, expect, it, vi } from 'vitest'

import { upsertJoinTeamMember } from '@/lib/services/join-team-roster'

describe('join team roster service', () => {
  it('rejects unsafe social link schemes before saving public roster cards', async () => {
    const supabase = {
      from: vi.fn(),
    }

    await expect(
      upsertJoinTeamMember(supabase as never, 'rep-britt', {
        displayName: 'Rayna',
        businessName: 'Queen of Blingy Thingz',
        links: {
          tiktok: 'https://www.tiktok.com/@queenofblingythingz',
          website: 'javascript:alert(1)',
        },
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_INPUT',
      userMessage: 'Use a full http or https link for team member social links.',
    })
    expect(supabase.from).not.toHaveBeenCalled()
  })
})
