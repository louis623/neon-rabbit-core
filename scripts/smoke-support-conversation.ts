import { randomUUID } from 'node:crypto'
import {
  sendOperatorSupportReply,
  sendRepConversationMessage,
} from '@/lib/services/workspace-conversations'
import {
  createSupportAttachmentSignedRead,
  createSupportConversationAttachment,
} from '@/lib/services/workspace-conversation-attachments'
import {
  promoteSupportReportToTask,
  transitionSupportConversationStatus,
} from '@/lib/services/workspace-support-conversations'
import {
  createCommunicationsSmokeAdmin,
  createSyntheticReviewer,
  emptyCommunicationsSmokeFixture,
  resetAllCommunicationsSmokeFixtures,
  runWithRequiredCleanup,
} from './workspace-communications-smoke-helpers'

const ONE_PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
)

type SupportRpcRow = {
  report_id: string
  conversation_id: string
  message_id: string
  was_created: boolean
}

function firstRow(value: unknown): SupportRpcRow | null {
  return Array.isArray(value)
    ? ((value[0] as SupportRpcRow | undefined) ?? null)
    : ((value as SupportRpcRow | null) ?? null)
}

export async function runSupportConversationSmoke() {
  const admin = createCommunicationsSmokeAdmin()
  if (process.argv.includes('--reset-only')) {
    return { ok: true, reset: await resetAllCommunicationsSmokeFixtures(admin) }
  }

  const runId = `support-${Date.now()}-${randomUUID().slice(0, 8)}`
  const fixture = emptyCommunicationsSmokeFixture()
  const reviewer = await createSyntheticReviewer(admin, { runId, label: 'requester' })
  fixture.authUserIds.push(reviewer.authUserId)
  fixture.repIds.push(reviewer.repId)

  return runWithRequiredCleanup({
    admin,
    fixture,
    run: async () => {
      const profile = await admin
        .from('client_account_profiles')
        .insert({
          rep_id: reviewer.repId,
          client_name: `${reviewer.displayName} Studio`,
          show_name: `${reviewer.displayName} Studio`,
          primary_contact_name: reviewer.displayName,
          email: reviewer.email,
          account_status: 'active',
          subscription_status: 'active',
          support_tier: 'reviewer_smoke',
          source_snapshot: { reviewer_smoke: true, smoke_scope: 'workspace_communications' },
        })
        .select('id')
        .single()
      if (profile.error || !profile.data) {
        throw profile.error ?? new Error('Synthetic client account profile was not created.')
      }

      const clientRequestId = `support-message-${runId}`
      const idempotencyKey = `support-submission-${runId}`
      const rpcInput = {
        p_rep_id: reviewer.repId,
        p_rep_display_name: reviewer.displayName,
        p_client_account_profile_id: profile.data.id,
        p_client_snapshot: {
          reviewerSmoke: true,
          clientName: `${reviewer.displayName} Studio`,
          email: reviewer.email,
        },
        p_report_type: 'bug',
        p_urgency: 'normal',
        p_page_or_workflow: 'Message Center synthetic smoke',
        p_title: `Synthetic unified Support smoke ${runId}`,
        p_details: 'This private synthetic report verifies the unified Support conversation workflow.',
        p_expected_result: 'The Support thread is durable and can be promoted deliberately.',
        p_actual_result: 'Synthetic smoke verification only.',
        p_contact_ok: false,
        p_client_request_id: clientRequestId,
        p_submission_idempotency_key: idempotencyKey,
      }
      const submitted = await admin.rpc('create_workspace_support_submission', rpcInput)
      const created = firstRow(submitted.data)
      if (submitted.error || !created || !created.was_created) {
        throw submitted.error ?? new Error('Support submission transaction did not create its fixture.')
      }
      fixture.supportReportIds.push(created.report_id)
      fixture.conversationIds.push(created.conversation_id)

      const retried = await admin.rpc('create_workspace_support_submission', rpcInput)
      const retry = firstRow(retried.data)
      if (
        retried.error ||
        !retry ||
        retry.was_created ||
        retry.report_id !== created.report_id ||
        retry.conversation_id !== created.conversation_id ||
        retry.message_id !== created.message_id
      ) {
        throw retried.error ?? new Error('Support submission idempotency did not return the original records.')
      }

      const attachmentRequestId = `support-attachment-${runId}`
      const attachment = await createSupportConversationAttachment(admin, {
        repId: reviewer.repId,
        conversationId: created.conversation_id,
        file: ONE_PIXEL_PNG,
        clientRequestId: attachmentRequestId,
      })
      const attachmentRetry = await createSupportConversationAttachment(admin, {
        repId: reviewer.repId,
        conversationId: created.conversation_id,
        file: ONE_PIXEL_PNG,
        clientRequestId: attachmentRequestId,
      })
      if (!attachment.created || attachmentRetry.created || attachmentRetry.id !== attachment.id) {
        throw new Error('Private Support attachment retry was not idempotent.')
      }
      const attachmentRow = await admin
        .from('workspace_conversation_attachments')
        .select('object_path')
        .eq('id', attachment.id)
        .single()
      if (attachmentRow.error || !attachmentRow.data) throw attachmentRow.error ?? new Error('Support attachment metadata was missing.')
      fixture.attachmentPaths.push(String(attachmentRow.data.object_path))
      const signedRead = await createSupportAttachmentSignedRead(admin, {
        conversationId: created.conversation_id,
        attachmentId: attachment.id,
        operatorAuthorized: true,
      })
      if (!signedRead.url.startsWith('http') || signedRead.expiresIn !== 300) {
        throw new Error('Private Support attachment did not produce a short-lived signed read.')
      }

      const repFollowup = await sendRepConversationMessage(admin, {
        repId: reviewer.repId,
        repDisplayName: reviewer.displayName,
        conversationId: created.conversation_id,
        body: 'Synthetic follow-up from the rep after opening the Support thread.',
        clientRequestId: `support-followup-${runId}`,
      })
      const operatorRequestId = `support-operator-reply-${runId}`
      const operatorReply = await sendOperatorSupportReply(admin, {
        conversationId: created.conversation_id,
        operatorId: 'communications-smoke',
        body: 'Synthetic reply from Sparkle Suite Support.',
        clientRequestId: operatorRequestId,
      })
      const operatorRetry = await sendOperatorSupportReply(admin, {
        conversationId: created.conversation_id,
        operatorId: 'communications-smoke',
        body: 'Synthetic reply from Sparkle Suite Support.',
        clientRequestId: operatorRequestId,
      })
      if (operatorRetry.id !== operatorReply.id) {
        throw new Error('Operator Support reply retry created a duplicate message.')
      }

      const promotion = await promoteSupportReportToTask(admin, {
        reportId: created.report_id,
        title: `Synthetic Support promotion ${runId}`,
        itemType: 'bug',
        owner: 'Communications smoke',
        notes: 'Temporary reviewer-only Task List promotion.',
        operatorId: 'communications-smoke',
        status: 'planned',
      })
      fixture.taskIds.push(String(promotion.task.id))
      const promotionRetry = await promoteSupportReportToTask(admin, {
        reportId: created.report_id,
        title: `Synthetic Support promotion ${runId}`,
        itemType: 'bug',
        operatorId: 'communications-smoke',
      })
      if (!promotion.created || promotionRetry.created || promotionRetry.task.id !== promotion.task.id) {
        throw new Error('Support-to-Task-List promotion was not idempotent.')
      }
      const repeatedStatus = await transitionSupportConversationStatus(admin, {
        reportId: created.report_id,
        status: 'planned',
        operatorId: 'communications-smoke',
      })
      if (repeatedStatus.changed) {
        throw new Error('Repeated Support status transition was not idempotent.')
      }

      const [report, conversation, messages, taskCount] = await Promise.all([
        admin.from('support_reports').select('status, notification_status, workspace_conversation_id').eq('id', created.report_id).single(),
        admin.from('workspace_conversations').select('state, conversation_type').eq('id', created.conversation_id).single(),
        admin.from('workspace_conversation_messages').select('id, sender_principal_type, kind').eq('conversation_id', created.conversation_id),
        admin.from('sparkle_suite_bug_hunt_items').select('id', { count: 'exact', head: true }).eq('source_support_report_id', created.report_id),
      ])
      const queryError = report.error ?? conversation.error ?? messages.error ?? taskCount.error
      if (queryError) throw queryError
      if (
        report.data?.status !== 'planned' ||
        report.data.notification_status !== 'pending' ||
        report.data.workspace_conversation_id !== created.conversation_id ||
        conversation.data?.conversation_type !== 'support' ||
        conversation.data.state !== 'open' ||
        (taskCount.count ?? 0) !== 1 ||
        (messages.data?.length ?? 0) < 5
      ) {
        throw new Error('Support conversation relationships or status invariants were incomplete.')
      }

      return {
        ok: true,
        runId,
        reviewer: { repId: reviewer.repId, email: reviewer.email },
        createdIds: {
          clientAccountProfileId: String(profile.data.id),
          reportId: created.report_id,
          conversationId: created.conversation_id,
          initialMessageId: created.message_id,
          followupMessageId: repFollowup.id,
          operatorReplyId: operatorReply.id,
          attachmentId: attachment.id,
          taskId: String(promotion.task.id),
        },
        assertions: {
          atomicSubmission: true,
          idempotentSubmission: true,
          privateAttachment: true,
          idempotentReplies: true,
          deliberateTaskPromotion: true,
          providerNotificationsTriggered: false,
        },
      }
    },
  })
}

async function main() {
  if (process.argv.includes('--check-import')) {
    console.log(JSON.stringify({ ok: true, check: 'support-conversation-import' }))
    return
  }
  const output = await runSupportConversationSmoke()
  console.log(JSON.stringify(output, null, 2))
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('/smoke-support-conversation.ts')) {
  main().catch((error) => {
    console.error('[support-conversation-smoke] error', error)
    process.exit(1)
  })
}
