import { createHash, randomUUID } from 'node:crypto'
import {
  getRepConversation,
  listRepConversations,
  updateRepConversationState,
} from '@/lib/services/workspace-conversations'
import {
  ensureTeamOnboardingConversation,
  listTeamOnboardingConversationMessages,
  sendTeamOnboardingConversationMessage,
} from '@/lib/services/workspace-team-conversations'
import {
  createCommunicationsSmokeAdmin,
  createSyntheticReviewer,
  emptyCommunicationsSmokeFixture,
  resetAllCommunicationsSmokeFixtures,
  runWithRequiredCleanup,
} from './workspace-communications-smoke-helpers'

export async function runWorkspaceConversationsSmoke() {
  const admin = createCommunicationsSmokeAdmin()
  if (process.argv.includes('--reset-only')) {
    return { ok: true, reset: await resetAllCommunicationsSmokeFixtures(admin) }
  }

  const runId = `workspace-${Date.now()}-${randomUUID().slice(0, 8)}`
  const fixture = emptyCommunicationsSmokeFixture()
  const reviewer = await createSyntheticReviewer(admin, { runId, label: 'team-lead' })
  fixture.authUserIds.push(reviewer.authUserId)
  fixture.repIds.push(reviewer.repId)

  return runWithRequiredCleanup({
    admin,
    fixture,
    run: async () => {
      const guestEmail = `sparkle-reviewer+communications-${runId}-new-rep@neonrabbit.net`
      const accessToken = randomUUID()
      const participant = await admin
        .from('team_onboarding_participants')
        .insert({
          owner_rep_id: reviewer.repId,
          display_name: 'Communications Smoke New Rep',
          contact_email: guestEmail,
          status: 'started',
          access_slug: `communications-smoke-${runId}`,
          access_token_hash: createHash('sha256').update(accessToken).digest('hex'),
        })
        .select('id')
        .single()
      if (participant.error || !participant.data) {
        throw participant.error ?? new Error('Team onboarding fixture was not created.')
      }
      const participantId = String(participant.data.id)
      fixture.participantIds.push(participantId)

      const conversationId = await ensureTeamOnboardingConversation(admin, participantId)
      fixture.conversationIds.push(conversationId)
      const guestRequestId = `guest-${runId}`
      const guestMessage = await sendTeamOnboardingConversationMessage(admin, {
        participantId,
        senderType: 'participant',
        body: 'I have a synthetic onboarding question for the unified inbox.',
        clientRequestId: guestRequestId,
      })
      const guestRetry = await sendTeamOnboardingConversationMessage(admin, {
        participantId,
        senderType: 'participant',
        body: 'I have a synthetic onboarding question for the unified inbox.',
        clientRequestId: guestRequestId,
      })
      if (guestRetry.id !== guestMessage.id) {
        throw new Error('Team onboarding retry created a duplicate canonical message.')
      }

      const teamInbox = await listRepConversations(admin, reviewer.repId, {
        view: 'team',
      })
      const summary = teamInbox.messages.find(
        (message) => message.conversationId === conversationId,
      )
      if (!summary || summary.unreadCount !== 1) {
        throw new Error(
          `Team conversation did not appear with one unread guest message: ${JSON.stringify({
            conversationId,
            summary: summary ?? null,
            inboxCount: teamInbox.messages.length,
            inboxUnread: teamInbox.unreadCount,
          })}`,
        )
      }

      const leadMessage = await sendTeamOnboardingConversationMessage(admin, {
        participantId,
        senderType: 'team_lead',
        body: 'This synthetic reply verifies the Message Center team stream.',
        clientRequestId: `lead-${runId}`,
      })
      const legacyCompatibleView = await listTeamOnboardingConversationMessages(
        admin,
        participantId,
      )
      if (!legacyCompatibleView || legacyCompatibleView.length !== 2) {
        throw new Error('Team onboarding compatibility read did not return both canonical messages.')
      }

      const detail = await getRepConversation(admin, reviewer.repId, conversationId)
      if (
        detail.conversation.conversationType !== 'team_onboarding' ||
        detail.messages.length !== 2
      ) {
        throw new Error('Canonical team conversation detail was incomplete.')
      }

      const archived = await updateRepConversationState(admin, {
        repId: reviewer.repId,
        conversationId,
        read: true,
        archived: true,
        muted: true,
      })
      if (!archived.isRead || !archived.isArchived || !archived.isMuted) {
        throw new Error('Per-rep read, archive, and mute state did not persist.')
      }
      const archivedInbox = await listRepConversations(admin, reviewer.repId, {
        view: 'archived',
      })
      if (!archivedInbox.messages.some((message) => message.conversationId === conversationId)) {
        throw new Error('Archived team conversation was not available in the archived stream.')
      }
      await updateRepConversationState(admin, {
        repId: reviewer.repId,
        conversationId,
        archived: false,
        muted: false,
      })

      return {
        ok: true,
        runId,
        reviewer: { repId: reviewer.repId, email: reviewer.email },
        createdIds: {
          participantId,
          conversationId,
          guestMessageId: guestMessage.id,
          leadMessageId: leadMessage.id,
        },
        assertions: {
          idempotentGuestRetry: true,
          unreadIncrement: true,
          compatibilityRead: true,
          canonicalDetail: true,
          personalState: true,
        },
      }
    },
  })
}

async function main() {
  if (process.argv.includes('--check-import')) {
    console.log(JSON.stringify({ ok: true, check: 'workspace-conversations-import' }))
    return
  }
  const output = await runWorkspaceConversationsSmoke()
  console.log(JSON.stringify(output, null, 2))
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('/smoke-workspace-conversations.ts')) {
  main().catch((error) => {
    console.error('[workspace-conversations-smoke] error', error)
    process.exit(1)
  })
}
