import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildPrelaunchSignWellAgreementPayload,
  buildPrelaunchSignWellMetadata,
  getPrelaunchSignWellConfig,
  getPrelaunchSignWellLiveSendMode,
  PrelaunchSignWellProviderError,
  submitPrelaunchSignWellSandboxAgreement,
  type PrelaunchAgreementGateType,
} from '@/lib/prelaunch/signwell'

type AdminClient = ReturnType<typeof createAdminClient>

export type PrelaunchAgreementDocumentStatus =
  | 'draft'
  | 'created'
  | 'sent'
  | 'signed'
  | 'failed'
  | 'voided'

export interface PrelaunchAgreementDocumentRow {
  id: string
  launch_build_id: string
  waitlist_id: string | null
  intake_submission_id: string | null
  provider: 'signwell'
  mode: 'sandbox' | 'live'
  gate_type: PrelaunchAgreementGateType
  status: PrelaunchAgreementDocumentStatus
  template_id: string
  template_label: string
  pricing_cohort: string
  provider_document_id: string | null
  recipient_name: string
  recipient_email: string
  send_email: boolean
  draft: boolean
  test_mode: boolean
  provider_status: number | null
  signed_at: string | null
  signed_pdf_url: string | null
  notes: string
  metadata: Record<string, unknown>
  updated_by_rep_id: string | null
  created_at: string
  updated_at: string
}

export interface PrelaunchAgreementDocument {
  id: string
  launchBuildId: string
  waitlistId: string | null
  intakeSubmissionId: string | null
  provider: 'signwell'
  mode: 'sandbox' | 'live'
  gateType: PrelaunchAgreementGateType
  status: PrelaunchAgreementDocumentStatus
  templateId: string
  templateLabel: string
  pricingCohort: string
  providerDocumentId: string | null
  recipientName: string
  recipientEmail: string
  sendEmail: boolean
  draft: boolean
  testMode: boolean
  providerStatus: number | null
  signedAt: string | null
  signedPdfUrl: string | null
  notes: string
  updatedByRepId: string | null
  createdAt: string
  updatedAt: string
}

interface CreatePrelaunchAgreementDraftInput {
  launchBuildId: string
  operatorRepId?: string | null
  providerDocumentId?: string | null
  providerStatus?: number | null
  notes?: string | null
  env?: Record<string, string | undefined>
}

interface CreatePrelaunchSignWellSandboxDraftInput {
  launchBuildId: string
  operatorRepId?: string | null
  notes?: string | null
  env?: Record<string, string | undefined>
  fetchImpl?: typeof fetch
}

interface RecordPrelaunchAgreementSignedInput {
  launchBuildId: string
  operatorRepId?: string | null
  signedAt?: string | null
  signedPdfUrl?: string | null
  notes?: string | null
}

interface AgreementLaunchBuildRow {
  id: string
  waitlist_id: string | null
  intake_submission_id: string | null
  lead_name: string
  lead_email: string
}

export const PRELAUNCH_AGREEMENT_DOCUMENT_SELECT = [
  'id',
  'launch_build_id',
  'waitlist_id',
  'intake_submission_id',
  'provider',
  'mode',
  'gate_type',
  'status',
  'template_id',
  'template_label',
  'pricing_cohort',
  'provider_document_id',
  'recipient_name',
  'recipient_email',
  'send_email',
  'draft',
  'test_mode',
  'provider_status',
  'signed_at',
  'signed_pdf_url',
  'notes',
  'metadata',
  'updated_by_rep_id',
  'created_at',
  'updated_at',
].join(', ')

function cleanRequiredString(value: string, label: string) {
  const cleaned = value.trim()
  if (!cleaned) throw new Error(`${label} is required.`)
  return cleaned
}

function cleanOptionalText(value: string | null | undefined) {
  return value?.trim() ?? ''
}

function isMissingSchemaTable(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'PGRST205'
  )
}

export function getPrelaunchAgreementTemplateSnapshot(
  env: Record<string, string | undefined> = process.env,
) {
  const config = getPrelaunchSignWellConfig(env)
  if (!config) return null

  return {
    templateId: config.templateId,
    templateLabel:
      env.SIGNWELL_TEMPLATE_LABEL?.trim() ||
      'Sparkle Suite service agreement',
    pricingCohort:
      env.SPARKLE_SUITE_AGREEMENT_PRICING_COHORT?.trim() ||
      'founder_first_20',
  }
}

export function isPrelaunchSignWellSandboxDraftCreateEnabled(
  env: Record<string, string | undefined> = process.env,
) {
  return (
    env.SIGNWELL_SANDBOX_DRAFT_CREATE_ENABLED?.trim() === 'true' ||
    env.SIGNWELL_SANDBOX_PROVIDER_CALL?.trim() === 'true'
  )
}

export function normalizePrelaunchAgreementDocumentRows(
  rows: PrelaunchAgreementDocumentRow[],
): PrelaunchAgreementDocument[] {
  return rows.map((row) => ({
    id: row.id,
    launchBuildId: row.launch_build_id,
    waitlistId: row.waitlist_id,
    intakeSubmissionId: row.intake_submission_id,
    provider: row.provider,
    mode: row.mode,
    gateType: row.gate_type,
    status: row.status,
    templateId: row.template_id,
    templateLabel: row.template_label,
    pricingCohort: row.pricing_cohort,
    providerDocumentId: row.provider_document_id,
    recipientName: row.recipient_name,
    recipientEmail: row.recipient_email,
    sendEmail: row.send_email,
    draft: row.draft,
    testMode: row.test_mode,
    providerStatus: row.provider_status,
    signedAt: row.signed_at,
    signedPdfUrl: row.signed_pdf_url,
    notes: row.notes,
    updatedByRepId: row.updated_by_rep_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export async function loadPrelaunchAgreementDocumentsByBuildIds(
  launchBuildIds: string[],
  admin: AdminClient = createAdminClient(),
): Promise<PrelaunchAgreementDocument[]> {
  const uniqueIds = Array.from(
    new Set(launchBuildIds.map((id) => id.trim()).filter(Boolean)),
  )

  if (uniqueIds.length === 0) return []

  const { data, error } = await admin
    .from('sparkle_suite_agreement_documents')
    .select(PRELAUNCH_AGREEMENT_DOCUMENT_SELECT)
    .in('launch_build_id', uniqueIds)
    .order('updated_at', { ascending: false })

  if (error) {
    if (isMissingSchemaTable(error)) return []
    throw error
  }

  return normalizePrelaunchAgreementDocumentRows(
    (data ?? []) as unknown as PrelaunchAgreementDocumentRow[],
  )
}

async function loadAgreementLaunchBuild(
  launchBuildId: string,
  admin: AdminClient,
) {
  const { data, error } = await admin
    .from('sparkle_suite_launch_builds')
    .select('id, waitlist_id, intake_submission_id, lead_name, lead_email')
    .eq('id', launchBuildId)
    .single()

  if (error) throw error
  return data as unknown as AgreementLaunchBuildRow
}

export async function createPrelaunchAgreementDraftTracker(
  input: CreatePrelaunchAgreementDraftInput,
  admin: AdminClient = createAdminClient(),
): Promise<PrelaunchAgreementDocument> {
  const launchBuildId = cleanRequiredString(
    input.launchBuildId,
    'launchBuildId',
  )
  const template = getPrelaunchAgreementTemplateSnapshot(input.env)

  if (!template) {
    throw new Error('SignWell agreement template is not configured.')
  }

  const build = await loadAgreementLaunchBuild(launchBuildId, admin)
  const metadata = buildPrelaunchSignWellMetadata({
    gateType: 'service_agreement',
    intakeId: build.intake_submission_id ?? launchBuildId,
    waitlistId: build.waitlist_id,
    operatorRepId: input.operatorRepId ?? null,
  })
  const providerDocumentId = input.providerDocumentId?.trim() || null
  const status: PrelaunchAgreementDocumentStatus = providerDocumentId
    ? 'created'
    : 'draft'

  const { data, error } = await admin
    .from('sparkle_suite_agreement_documents')
    .upsert(
      {
        launch_build_id: build.id,
        waitlist_id: build.waitlist_id,
        intake_submission_id: build.intake_submission_id,
        provider: 'signwell',
        mode: 'sandbox',
        gate_type: 'service_agreement',
        status,
        template_id: template.templateId,
        template_label: template.templateLabel,
        pricing_cohort: template.pricingCohort,
        provider_document_id: providerDocumentId,
        recipient_name: build.lead_name,
        recipient_email: build.lead_email,
        send_email: false,
        draft: true,
        test_mode: true,
        provider_status: input.providerStatus ?? null,
        notes: cleanOptionalText(input.notes),
        metadata,
        updated_by_rep_id: input.operatorRepId ?? null,
      },
      { onConflict: 'launch_build_id,provider,mode,gate_type' },
    )
    .select(PRELAUNCH_AGREEMENT_DOCUMENT_SELECT)
    .single()

  if (error) throw error

  return normalizePrelaunchAgreementDocumentRows([
    data as unknown as PrelaunchAgreementDocumentRow,
  ])[0]
}

export async function createPrelaunchSignWellSandboxDraftForBuild(
  input: CreatePrelaunchSignWellSandboxDraftInput,
  admin: AdminClient = createAdminClient(),
) {
  const env = input.env ?? process.env
  const launchBuildId = cleanRequiredString(
    input.launchBuildId,
    'launchBuildId',
  )

  if (!isPrelaunchSignWellSandboxDraftCreateEnabled(env)) {
    throw new Error(
      'SignWell sandbox draft creation requires SIGNWELL_SANDBOX_DRAFT_CREATE_ENABLED=true.',
    )
  }

  if (getPrelaunchSignWellLiveSendMode(env).allowLiveSend) {
    throw new Error(
      'SignWell sandbox draft creation must run with live sending disabled.',
    )
  }

  const config = getPrelaunchSignWellConfig(env)
  if (!config) {
    throw new Error('SignWell agreement template is not configured.')
  }

  const build = await loadAgreementLaunchBuild(launchBuildId, admin)
  const metadata = buildPrelaunchSignWellMetadata({
    gateType: 'service_agreement',
    intakeId: build.intake_submission_id ?? launchBuildId,
    waitlistId: build.waitlist_id,
    operatorRepId: input.operatorRepId ?? null,
  })
  const agreementPayload = buildPrelaunchSignWellAgreementPayload({
    templateId: config.templateId,
    recipientPlaceholderName: config.recipientPlaceholderName,
    recipient: {
      name: build.lead_name,
      email: build.lead_email,
    },
    metadata,
    mode: 'sandbox',
  })
  const providerResult = await submitPrelaunchSignWellSandboxAgreement({
    config,
    agreementPayload,
    fetchImpl: input.fetchImpl,
  })

  if (!providerResult.documentId) {
    throw new PrelaunchSignWellProviderError(
      'SignWell sandbox provider returned no document id.',
      { status: providerResult.providerStatus },
    )
  }

  const agreementDocument = await createPrelaunchAgreementDraftTracker(
    {
      launchBuildId,
      operatorRepId: input.operatorRepId ?? null,
      providerDocumentId: providerResult.documentId,
      providerStatus: providerResult.providerStatus,
      notes:
        cleanOptionalText(input.notes) ||
        'SignWell test-mode draft created. Email disabled.',
      env,
    },
    admin,
  )

  return {
    agreementDocument,
    providerResult,
  }
}

export async function recordPrelaunchAgreementSigned(
  input: RecordPrelaunchAgreementSignedInput,
  admin: AdminClient = createAdminClient(),
): Promise<PrelaunchAgreementDocument> {
  const launchBuildId = cleanRequiredString(
    input.launchBuildId,
    'launchBuildId',
  )
  const signedAt =
    cleanOptionalText(input.signedAt) || new Date().toISOString()
  const signedPdfUrl = cleanOptionalText(input.signedPdfUrl) || null

  const { data, error } = await admin
    .from('sparkle_suite_agreement_documents')
    .update({
      status: 'signed',
      signed_at: signedAt,
      signed_pdf_url: signedPdfUrl,
      draft: false,
      notes: cleanOptionalText(input.notes),
      updated_by_rep_id: input.operatorRepId ?? null,
    })
    .eq('launch_build_id', launchBuildId)
    .eq('provider', 'signwell')
    .eq('mode', 'sandbox')
    .eq('gate_type', 'service_agreement')
    .select(PRELAUNCH_AGREEMENT_DOCUMENT_SELECT)
    .single()

  if (error) throw error

  return normalizePrelaunchAgreementDocumentRows([
    data as unknown as PrelaunchAgreementDocumentRow,
  ])[0]
}
