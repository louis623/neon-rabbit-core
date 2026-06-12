import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

const resolveSupportReportSchema = z.object({
  reportId: z.string().trim().min(1),
  clientAccountProfileId: z.string().trim().min(1).optional(),
  affectedArea: z.string().trim().min(2).max(80),
  symptom: z.string().trim().min(10).max(1200),
  rootCause: z.string().trim().min(5).max(1200),
  fixOrWorkaround: z.string().trim().min(5).max(1200),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  approvedForReuse: z.boolean().default(false),
  createdBy: z.string().trim().max(180).optional(),
})

export type ResolveSupportReportInput = z.input<
  typeof resolveSupportReportSchema
>

export interface ResolvedSupportReportResult {
  report: unknown
  lesson: unknown | null
}

function uniqueTags(tags: string[]) {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))]
}

export async function resolveSupportReport(
  supabase: SupabaseClient,
  input: ResolveSupportReportInput,
): Promise<ResolvedSupportReportResult> {
  const parsed = resolveSupportReportSchema.parse(input)
  const tags = uniqueTags(parsed.tags)
  const resolvedAt = new Date().toISOString()
  const resolutionSnapshot = {
    affectedArea: parsed.affectedArea,
    symptom: parsed.symptom,
    rootCause: parsed.rootCause,
    fixOrWorkaround: parsed.fixOrWorkaround,
    tags,
    approvedForReuse: parsed.approvedForReuse,
    createdBy: parsed.createdBy ?? null,
    resolvedAt,
  }

  const { data: report, error: reportError } = await supabase
    .from('support_reports')
    .update({
      status: 'resolved',
      resolution_snapshot: resolutionSnapshot,
      updated_at: resolvedAt,
    })
    .eq('id', parsed.reportId)
    .select('*')
    .single()

  if (reportError || !report) {
    throw reportError ?? new Error('support report resolution update failed')
  }

  if (!parsed.approvedForReuse) {
    return { report, lesson: null }
  }

  const { data: lesson, error: lessonError } = await supabase
    .from('support_lessons')
    .insert({
      source_report_id: parsed.reportId,
      client_account_profile_id: parsed.clientAccountProfileId ?? null,
      affected_area: parsed.affectedArea,
      symptom: parsed.symptom,
      root_cause: parsed.rootCause,
      fix_or_workaround: parsed.fixOrWorkaround,
      tags,
      approved_for_reuse: true,
      created_by: parsed.createdBy ?? null,
    })
    .select('*')
    .single()

  if (lessonError || !lesson) {
    throw lessonError ?? new Error('support lesson insert failed')
  }

  return { report, lesson }
}
