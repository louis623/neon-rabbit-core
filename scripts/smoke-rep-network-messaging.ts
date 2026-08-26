import { randomUUID } from 'node:crypto'
import { sendRepConversationMessage } from '@/lib/services/workspace-conversations'
import {
  blockRepNetworkConversation,
  createRepMessageRequest,
  decideRepMessageRequest,
  reportRepNetworkConversation,
} from '@/lib/services/workspace-rep-network'
import {
  createCommunicationsSmokeAdmin,
  createSyntheticReviewer,
  emptyCommunicationsSmokeFixture,
  resetAllCommunicationsSmokeFixtures,
  runWithRequiredCleanup,
  type SyntheticReviewer,
} from './workspace-communications-smoke-helpers'

function errorCode(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : ''
}

export async function runRepNetworkMessagingSmoke() {
  const admin = createCommunicationsSmokeAdmin()
  if (process.argv.includes('--reset-only')) {
    return { ok: true, reset: await resetAllCommunicationsSmokeFixtures(admin) }
  }

  const runId = `network-${Date.now()}-${randomUUID().slice(0, 8)}`
  const fixture = emptyCommunicationsSmokeFixture()

  return runWithRequiredCleanup({
    admin,
    fixture,
    run: async () => {
      const reviewers: SyntheticReviewer[] = []
      for (const label of ['sender', 'recipient-1', 'recipient-2', 'recipient-3', 'recipient-4', 'recipient-5', 'recipient-6']) {
        const reviewer = await createSyntheticReviewer(admin, { runId, label })
        reviewers.push(reviewer)
        fixture.authUserIds.push(reviewer.authUserId)
        fixture.repIds.push(reviewer.repId)
      }
      const [sender, primaryRecipient, ...rateRecipients] = reviewers

      const initial = await createRepMessageRequest(admin, {
        senderRepId: sender.repId,
        senderDisplayName: sender.displayName,
        recipientRepId: primaryRecipient.repId,
        subject: `Synthetic Rep Network request ${runId}`,
        body: 'Synthetic subscriber-to-subscriber message request.',
        clientRequestId: `network-request-${runId}-1`,
        contextType: 'rep_profile',
        contextId: primaryRecipient.repId,
      })
      if (!initial.created || initial.state !== 'pending') {
        throw new Error('Initial Rep Network message request was not created pending.')
      }
      fixture.conversationIds.push(initial.conversationId)
      const accepted = await decideRepMessageRequest(admin, {
        repId: primaryRecipient.repId,
        conversationId: initial.conversationId,
        decision: 'accept',
      })
      if (accepted.state !== 'open') throw new Error('Rep Network request did not open after acceptance.')

      const messageRequestId = `network-message-${runId}`
      const sent = await sendRepConversationMessage(admin, {
        repId: sender.repId,
        repDisplayName: sender.displayName,
        conversationId: initial.conversationId,
        body: 'Synthetic accepted-conversation follow-up.',
        clientRequestId: messageRequestId,
      })
      const retry = await sendRepConversationMessage(admin, {
        repId: sender.repId,
        repDisplayName: sender.displayName,
        conversationId: initial.conversationId,
        body: 'Synthetic accepted-conversation follow-up.',
        clientRequestId: messageRequestId,
      })
      if (retry.id !== sent.id) {
        throw new Error('Rep Network message retry created a duplicate message.')
      }

      const report = await reportRepNetworkConversation(admin, {
        repId: primaryRecipient.repId,
        conversationId: initial.conversationId,
        messageId: sent.id,
        reason: 'other',
        details: 'Synthetic reviewer report used only to verify the Network Safety queue.',
      })
      if (report.status !== 'open') throw new Error('Rep Network safety report was not queued open.')

      const blocked = await blockRepNetworkConversation(admin, {
        repId: primaryRecipient.repId,
        conversationId: initial.conversationId,
        reason: 'Synthetic block-path verification.',
      })
      if (blocked.state !== 'blocked' || blocked.blockedRepId !== sender.repId) {
        throw new Error('Rep Network block did not close the conversation against the sender.')
      }

      const rateConversationIds: string[] = []
      for (let index = 0; index < 4; index += 1) {
        const recipient = rateRecipients[index]
        const request = await createRepMessageRequest(admin, {
          senderRepId: sender.repId,
          senderDisplayName: sender.displayName,
          recipientRepId: recipient.repId,
          subject: `Synthetic rate-limit request ${index + 2}`,
          body: `Synthetic request ${index + 2} of five allowed in the rolling day.`,
          clientRequestId: `network-request-${runId}-${index + 2}`,
          contextType: 'rep_profile',
          contextId: recipient.repId,
        })
        if (!request.created) throw new Error(`Rep Network rate fixture ${index + 2} was not created.`)
        rateConversationIds.push(request.conversationId)
        fixture.conversationIds.push(request.conversationId)
      }

      let rateLimitCode = ''
      try {
        await createRepMessageRequest(admin, {
          senderRepId: sender.repId,
          senderDisplayName: sender.displayName,
          recipientRepId: rateRecipients[4].repId,
          subject: 'Synthetic over-limit request',
          body: 'This sixth request must be rejected by the rolling-day guard.',
          clientRequestId: `network-request-${runId}-6`,
          contextType: 'rep_profile',
          contextId: rateRecipients[4].repId,
        })
      } catch (error) {
        rateLimitCode = errorCode(error)
      }
      if (rateLimitCode !== 'REP_NETWORK_REQUEST_LIMIT') {
        throw new Error(`Sixth Rep Network request was not rejected with the expected rate limit (${rateLimitCode || 'no error'}).`)
      }

      const [conversation, reportRow, blockRow, requestCount] = await Promise.all([
        admin.from('workspace_conversations').select('state').eq('id', initial.conversationId).single(),
        admin.from('workspace_conversation_reports').select('id, status, message_id').eq('id', report.id).single(),
        admin.from('workspace_rep_message_blocks').select('blocker_rep_id, blocked_rep_id, lifted_at').eq('blocker_rep_id', primaryRecipient.repId).eq('blocked_rep_id', sender.repId).single(),
        admin.from('workspace_conversations').select('id', { count: 'exact', head: true }).eq('conversation_type', 'rep_direct').eq('created_by_rep_id', sender.repId),
      ])
      const queryError = conversation.error ?? reportRow.error ?? blockRow.error ?? requestCount.error
      if (queryError) throw queryError
      if (
        conversation.data?.state !== 'blocked' ||
        reportRow.data?.status !== 'open' ||
        reportRow.data.message_id !== sent.id ||
        blockRow.data?.blocker_rep_id !== primaryRecipient.repId ||
        blockRow.data.blocked_rep_id !== sender.repId ||
        blockRow.data.lifted_at !== null ||
        requestCount.count !== 5
      ) {
        throw new Error('Rep Network request, report, block, or rate-limit database invariants were incomplete.')
      }

      return {
        ok: true,
        runId,
        reviewers: reviewers.map((reviewer) => ({ repId: reviewer.repId, email: reviewer.email })),
        createdIds: {
          acceptedConversationId: initial.conversationId,
          rateConversationIds,
          messageId: sent.id,
          reportId: report.id,
        },
        assertions: {
          requestAndAccept: true,
          idempotentMessage: true,
          reportQueued: true,
          participantBlock: true,
          sixthRequestRateLimited: true,
        },
      }
    },
  })
}

async function main() {
  if (process.argv.includes('--check-import')) {
    console.log(JSON.stringify({ ok: true, check: 'rep-network-messaging-import' }))
    return
  }
  const output = await runRepNetworkMessagingSmoke()
  console.log(JSON.stringify(output, null, 2))
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('/smoke-rep-network-messaging.ts')) {
  main().catch((error) => {
    console.error('[rep-network-messaging-smoke] error', error)
    process.exit(1)
  })
}
