import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { enqueueWorkspaceMessageOutboxEvent } from '@/lib/services/workspace-message-outbox'
import { processWorkspaceMessageAutomation } from '@/lib/services/workspace-message-automation'
import { publishWorkspaceMessage, updateRepWorkspaceMessageDelivery } from '@/lib/services/workspace-messages'
import { publishWorkspaceResource } from '@/lib/services/workspace-resources'

config({ path: '.env.local' })
config({ path: '.env.production.local', override: false })

const smokeRepEmail =
  process.env.WORKSPACE_MESSAGE_SMOKE_REP_EMAIL?.trim().toLowerCase() ||
  'sparkle-reviewer+local@neonrabbit.net'

if (!smokeRepEmail.startsWith('sparkle-reviewer+')) {
  throw new Error('Smoke target must be a dedicated sparkle-reviewer+ account.')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Supabase smoke environment is not configured.')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const runId = `workspace-message-smoke-${Date.now()}`
const manualKey = `${runId}:manual`
const signupKey = `${runId}:signup`
const resourceKey = `${runId}-resource`
const publicationIds: string[] = []
const keepFixtures = process.argv.includes('--keep')
const resetOnly = process.argv.includes('--reset-only')

async function resetAllSmokeFixtures() {
  const { data: publications } = await supabase
    .from('workspace_message_publications')
    .select('id')
    .like('idempotency_key', 'workspace-message-smoke-%')
  const ids = (publications ?? []).map((row) => String(row.id))
  if (ids.length) {
    await supabase.from('workspace_message_audit_events').delete().in('publication_id', ids)
    await supabase.from('workspace_message_publications').delete().in('id', ids)
  }
  await supabase
    .from('workspace_message_outbox')
    .delete()
    .like('idempotency_key', 'workspace-message-smoke-%')
  await supabase
    .from('workspace_resources')
    .delete()
    .like('resource_key', 'workspace-message-smoke-%')
}

async function cleanup() {
  const { data: publications } = await supabase
    .from('workspace_message_publications')
    .select('id')
    .in('idempotency_key', [manualKey, signupKey])
  const ids = [...new Set([...publicationIds, ...(publications ?? []).map((row) => String(row.id))])]
  if (ids.length) {
    await supabase.from('workspace_message_audit_events').delete().in('publication_id', ids)
    await supabase.from('workspace_message_publications').delete().in('id', ids)
  }
  await supabase
    .from('workspace_message_outbox')
    .delete()
    .in('idempotency_key', [signupKey])
  await supabase.from('workspace_resources').delete().eq('resource_key', resourceKey)
}

async function main() {
  const { data: rep, error: repError } = await supabase
    .from('reps')
    .select('id, status')
    .eq('email', smokeRepEmail)
    .eq('status', 'active')
    .single()
  if (repError || !rep) {
    throw repError ?? new Error('Active synthetic reviewer rep was not found.')
  }

  const manual = await publishWorkspaceMessage(supabase, {
    senderKey: 'owner',
    title: 'Message Center smoke test',
    summary: 'Synthetic reviewer verification only.',
    body: [{ type: 'paragraph', text: 'This temporary message verifies selected-rep delivery.' }],
    category: 'announcement',
    audience: { kind: 'selected', repIds: [String(rep.id)] },
    expectedRecipientCount: 1,
    expectedRecipientIds: [String(rep.id)],
    idempotencyKey: manualKey,
    sourceType: 'reviewer_smoke',
    sourceId: runId,
  })
  publicationIds.push(manual.id)
  if (manual.deliveryCount !== 1 || manual.audienceCount !== 1) {
    throw new Error('Manual smoke publication did not freeze exactly one delivery.')
  }

  const { data: manualDelivery, error: deliveryError } = await supabase
    .from('workspace_message_deliveries')
    .select('id, rep_id')
    .eq('publication_id', manual.id)
    .single()
  if (deliveryError || !manualDelivery || manualDelivery.rep_id !== rep.id) {
    throw deliveryError ?? new Error('Manual delivery was not isolated to the reviewer rep.')
  }
  const updated = await updateRepWorkspaceMessageDelivery(supabase, String(rep.id), {
    deliveryId: String(manualDelivery.id),
    read: true,
    archived: true,
  })
  if (!updated.isRead || !updated.isArchived) {
    throw new Error('Reviewer delivery state did not persist.')
  }

  await enqueueWorkspaceMessageOutboxEvent(supabase, {
    eventType: 'customer_signup_created',
    idempotencyKey: signupKey,
    payload: {
      repId: rep.id,
      audienceId: `synthetic-${runId}`,
      customerFirstName: 'Jamie',
      createdAt: new Date().toISOString(),
    },
    // Avoid a false negative if the local workstation clock is a few seconds
    // ahead of the database clock. Production trigger events use database now().
    nextAttemptAt: new Date(Date.now() - 60_000).toISOString(),
  })
  const automated = await processWorkspaceMessageAutomation({
    supabase,
    workerId: runId,
    limit: 5,
  })
  if (automated.completed !== 1 || automated.failed !== 0) {
    throw new Error(
      `Signup automation did not complete cleanly: ${JSON.stringify(automated)}`,
    )
  }
  const { data: automatedPublication, error: automatedError } = await supabase
    .from('workspace_message_publications')
    .select('id')
    .eq('idempotency_key', signupKey)
    .single()
  if (automatedError || !automatedPublication) {
    throw automatedError ?? new Error('Signup automation publication was not saved.')
  }
  publicationIds.push(String(automatedPublication.id))

  const resource = await publishWorkspaceResource({
    supabase,
    input: {
      resourceKey,
      resourceType: 'blog',
      title: 'Synthetic reviewer resource',
      summary: 'Temporary Resource Library verification.',
      body: 'This temporary article verifies versioned resource storage.',
      category: 'Smoke test',
      tags: ['synthetic'],
      changeSummary: 'Created for an isolated production smoke test.',
      actorKind: 'automation',
      actor: runId,
      announce: false,
    },
  })
  if (resource.resource.version !== 1 || resource.resource.status !== 'published') {
    throw new Error('Versioned resource smoke publish failed.')
  }

  return {
    ok: true,
    reviewer: smokeRepEmail,
    manualDeliveryCount: manual.deliveryCount,
    signupAutomationCompleted: automated.completed,
    resourceVersion: resource.resource.version,
  }
}

const operation = resetOnly
  ? resetAllSmokeFixtures().then(() => ({ ok: true, reset: 'completed' }))
  : main()

operation
  .then(async (result) => {
    if (!keepFixtures && !resetOnly) await cleanup()
    console.log(
      JSON.stringify({
        ...result,
        ...(resetOnly
          ? {}
          : { cleanup: keepFixtures ? 'retained_for_ui_smoke' : 'completed' }),
      }),
    )
  })
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : String(error))
    if (!keepFixtures) await cleanup()
    process.exitCode = 1
  })
