import { describe, expect, it, vi } from 'vitest'

import {
  createTeamOnboardingParticipant,
  getTeamOnboardingAccess,
  listTeamOnboardingParticipants,
  recordTeamOnboardingProgress,
  sendTeamOnboardingMessage,
} from '@/lib/services/team-onboarding'

function createQueryResult(data: unknown, error: unknown = null) {
  const query = {
    select: vi.fn(() => query),
    insert: vi.fn(() => query),
    upsert: vi.fn(() => query),
    update: vi.fn(() => query),
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    single: vi.fn(async () => ({ data, error })),
    maybeSingle: vi.fn(async () => ({ data, error })),
    then: (resolve: (value: { data: unknown; error: unknown }) => unknown) =>
      Promise.resolve(resolve({ data, error })),
  }
  return query
}

describe('team onboarding service', () => {
  it('creates a private participant invite without storing the raw access token', async () => {
    const participantRow = {
      id: 'participant-1',
      owner_rep_id: 'rep-britt',
      display_name: 'Lindsey',
      contact_email: 'lindsey@example.com',
      status: 'invited',
      access_slug: 'lindsey-4f3a2b',
      access_token_hash: 'stored-hash',
      created_at: '2026-07-02T12:00:00.000Z',
      updated_at: '2026-07-02T12:00:00.000Z',
      last_activity_at: null,
      archived_at: null,
    }
    const query = createQueryResult(participantRow)
    const supabase = {
      from: vi.fn(() => query),
    } as never

    const result = await createTeamOnboardingParticipant(supabase, 'rep-britt', {
      displayName: ' Lindsey ',
      contactEmail: ' lindsey@example.com ',
      baseUrl: 'https://brittwithbling-start-strong.louis526569.chatgpt.site',
      tokenFactory: () => 'visible-token-for-lindsey',
    })

    expect(supabase.from).toHaveBeenCalledWith('team_onboarding_participants')
    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        owner_rep_id: 'rep-britt',
        display_name: 'Lindsey',
        contact_email: 'lindsey@example.com',
        access_slug: expect.stringMatching(/^lindsey-/),
        access_token_hash: expect.any(String),
      }),
    )
    expect(JSON.stringify(query.insert.mock.calls[0][0])).not.toContain(
      'visible-token-for-lindsey',
    )
    expect(result.accessUrl).toBe(
      'https://brittwithbling-start-strong.louis526569.chatgpt.site/?invite=visible-token-for-lindsey',
    )
    expect(result.participant.displayName).toBe('Lindsey')
  })

  it('lists participants with progress and unread message counts for the owning rep', async () => {
    const participantQuery = createQueryResult([
      {
        id: 'participant-1',
        owner_rep_id: 'rep-britt',
        display_name: 'Lindsey',
        contact_email: null,
        status: 'started',
        access_slug: 'lindsey-4f3a2b',
        created_at: '2026-07-02T12:00:00.000Z',
        updated_at: '2026-07-02T12:00:00.000Z',
        last_activity_at: '2026-07-02T12:20:00.000Z',
        archived_at: null,
      },
    ])
    const progressQuery = createQueryResult([
      {
        participant_id: 'participant-1',
        step_id: 'payquicker',
        status: 'done',
        completed_at: '2026-07-02T12:15:00.000Z',
        updated_at: '2026-07-02T12:15:00.000Z',
      },
      {
        participant_id: 'participant-1',
        step_id: 'shipping',
        status: 'needs_help',
        completed_at: null,
        updated_at: '2026-07-02T12:20:00.000Z',
      },
    ])
    const messageQuery = createQueryResult([
      { participant_id: 'participant-1', sender_type: 'participant', read_at: null },
      { participant_id: 'participant-1', sender_type: 'team_lead', read_at: null },
    ])
    const queries = [participantQuery, progressQuery, messageQuery]
    const supabase = {
      from: vi.fn(() => queries.shift()),
    } as never

    const result = await listTeamOnboardingParticipants(supabase, 'rep-britt')

    expect(result).toEqual([
      expect.objectContaining({
        id: 'participant-1',
        displayName: 'Lindsey',
        progress: { completed: 1, needsHelp: 1, total: 2 },
        unreadMessageCount: 1,
      }),
    ])
  })

  it('summarizes a 30-rep onboarding roster without creating Sparkle Suite rep accounts', async () => {
    const participantRows = Array.from({ length: 30 }, (_, index) => ({
      id: `participant-${index + 1}`,
      owner_rep_id: 'rep-britt',
      display_name: `Rep ${index + 1}`,
      contact_email: null,
      status: 'started',
      access_slug: `rep-${index + 1}`,
      created_at: '2026-07-02T12:00:00.000Z',
      updated_at: '2026-07-02T12:00:00.000Z',
      last_activity_at: null,
      archived_at: null,
    }))
    const progressRows = participantRows.flatMap((participant, index) => [
      {
        participant_id: participant.id,
        step_id: 'payquicker',
        status: 'done',
        completed_at: '2026-07-02T12:10:00.000Z',
        updated_at: '2026-07-02T12:10:00.000Z',
      },
      ...(index % 3 === 0
        ? [
            {
              participant_id: participant.id,
              step_id: 'shipping',
              status: 'needs_help',
              completed_at: null,
              updated_at: '2026-07-02T12:20:00.000Z',
            },
          ]
        : []),
    ])
    const messageRows = participantRows
      .filter((_, index) => index % 4 === 0)
      .map((participant) => ({
        participant_id: participant.id,
        sender_type: 'participant',
        read_at: null,
      }))
    const queries = [
      createQueryResult(participantRows),
      createQueryResult(progressRows),
      createQueryResult(messageRows),
    ]
    const supabase = {
      from: vi.fn(() => queries.shift()),
    } as never

    const result = await listTeamOnboardingParticipants(supabase, 'rep-britt')

    expect(result).toHaveLength(30)
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: 'participant-1',
        progress: { completed: 1, needsHelp: 1, total: 2 },
        unreadMessageCount: 1,
      }),
    )
    expect(result[1]).toEqual(
      expect.objectContaining({
        id: 'participant-2',
        progress: { completed: 1, needsHelp: 0, total: 1 },
        unreadMessageCount: 0,
      }),
    )
  })

  it('lets a participant update progress and message Brittany through a valid invite token', async () => {
    const participantQuery = createQueryResult({
      id: 'participant-1',
      owner_rep_id: 'rep-britt',
      display_name: 'Lindsey',
      status: 'started',
      access_token_hash: 'hash',
      access_slug: 'lindsey-4f3a2b',
      created_at: '2026-07-02T12:00:00.000Z',
      updated_at: '2026-07-02T12:00:00.000Z',
      last_activity_at: null,
      archived_at: null,
    })
    const progressQuery = createQueryResult({
      participant_id: 'participant-1',
      step_id: 'payquicker',
      status: 'done',
      completed_at: '2026-07-02T12:30:00.000Z',
      updated_at: '2026-07-02T12:30:00.000Z',
    })
    const activityQuery = createQueryResult({ id: 'participant-1' })
    const messageQuery = createQueryResult({
      id: 'message-1',
      participant_id: 'participant-1',
      sender_type: 'participant',
      body: 'I need help with PayQuicker.',
      read_at: null,
      created_at: '2026-07-02T12:31:00.000Z',
    })
    const queries = [
      participantQuery,
      progressQuery,
      activityQuery,
      participantQuery,
      messageQuery,
      activityQuery,
    ]
    const supabase = {
      from: vi.fn(() => queries.shift()),
    } as never

    await expect(
      recordTeamOnboardingProgress(supabase, 'visible-token', {
        stepId: 'payquicker',
        status: 'done',
        tokenVerifier: () => true,
      }),
    ).resolves.toEqual(
      expect.objectContaining({ stepId: 'payquicker', status: 'done' }),
    )
    await expect(
      sendTeamOnboardingMessage(supabase, 'visible-token', {
        body: ' I need help with PayQuicker. ',
        senderType: 'participant',
        tokenVerifier: () => true,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        senderType: 'participant',
        body: 'I need help with PayQuicker.',
      }),
    )
  })

  it('reports paid add-on access as entitlement-ready for future Stripe upgrades', async () => {
    const query = createQueryResult({
      id: 'entitlement-1',
      rep_id: 'rep-britt',
      status: 'manual_beta',
      source: 'manual_beta',
    })
    const supabase = {
      from: vi.fn(() => query),
    } as never

    await expect(getTeamOnboardingAccess(supabase, 'rep-britt')).resolves.toEqual({
      enabled: true,
      status: 'manual_beta',
      source: 'manual_beta',
    })
  })
})
