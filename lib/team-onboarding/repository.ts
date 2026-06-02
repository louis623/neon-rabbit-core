import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  PublicTeamOnboardingConfig,
  TeamOnboardingQuestionStatus,
  TeamOnboardingResource,
  TeamOnboardingResourceSource,
  TeamOnboardingSite,
  TeamOnboardingSiteStatus,
  TeamOnboardingStep,
} from './types';

export interface TeamOnboardingSiteRow {
  id: string;
  owner_rep_id: string;
  slug: string;
  title: string;
  team_name: string;
  rep_display_name: string;
  status: TeamOnboardingSiteStatus;
  custom_domain: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

interface TeamOnboardingResourceRow {
  id: string;
  site_id: string;
  title: string;
  description: string;
  href: string;
  category: string;
  source: TeamOnboardingResourceSource;
  sort_order: number;
}

interface TeamOnboardingStepRow {
  id: string;
  site_id: string;
  group_title: string;
  title: string;
  description: string;
  resource_ids: string[] | null;
  sort_order: number;
}

interface CreatedQuestionRow {
  id: string;
  status: TeamOnboardingQuestionStatus;
  created_at: string;
}

export interface CreateTeamOnboardingQuestionInput {
  siteId: string;
  memberId?: string | null;
  stepId?: string | null;
  questionText: string;
}

export function mapSiteRow(row: TeamOnboardingSiteRow): TeamOnboardingSite {
  return {
    id: row.id,
    ownerRepId: row.owner_rep_id,
    slug: row.slug,
    title: row.title,
    teamName: row.team_name,
    repDisplayName: row.rep_display_name,
    status: row.status,
    customDomain: row.custom_domain,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  };
}

function mapResourceRow(row: TeamOnboardingResourceRow): TeamOnboardingResource {
  return {
    id: row.id,
    siteId: row.site_id,
    title: row.title,
    description: row.description,
    href: row.href,
    category: row.category,
    source: row.source,
    sortOrder: row.sort_order,
  };
}

function mapStepRow(row: TeamOnboardingStepRow): TeamOnboardingStep {
  return {
    id: row.id,
    siteId: row.site_id,
    groupTitle: row.group_title,
    title: row.title,
    description: row.description,
    resourceIds: row.resource_ids ?? [],
    sortOrder: row.sort_order,
  };
}

export async function getPublishedSiteConfig(
  supabase: SupabaseClient,
  siteSlug: string,
): Promise<PublicTeamOnboardingConfig | null> {
  const { data: siteData, error: siteError } = await supabase
    .from('ss_team_onboarding_sites')
    .select(
      'id,owner_rep_id,slug,title,team_name,rep_display_name,status,custom_domain,created_at,updated_at,published_at',
    )
    .eq('slug', siteSlug)
    .eq('status', 'published')
    .maybeSingle();

  if (siteError || !siteData) {
    return null;
  }

  const site = mapSiteRow(siteData as unknown as TeamOnboardingSiteRow);

  const [{ data: resourceData, error: resourceError }, { data: stepData, error: stepError }] =
    await Promise.all([
      supabase
        .from('ss_team_onboarding_resources')
        .select('id,site_id,title,description,href,category,source,sort_order')
        .eq('site_id', site.id)
        .order('sort_order', { ascending: true }),
      supabase
        .from('ss_team_onboarding_steps')
        .select('id,site_id,group_title,title,description,resource_ids,sort_order')
        .eq('site_id', site.id)
        .order('sort_order', { ascending: true }),
    ]);

  if (resourceError || stepError) {
    return null;
  }

  return {
    slug: site.slug,
    title: site.title,
    teamName: site.teamName,
    repDisplayName: site.repDisplayName,
    customDomain: site.customDomain,
    resources: ((resourceData ?? []) as unknown as TeamOnboardingResourceRow[]).map(mapResourceRow),
    steps: ((stepData ?? []) as unknown as TeamOnboardingStepRow[]).map(mapStepRow),
  };
}

export async function createQuestion(
  supabase: SupabaseClient,
  input: CreateTeamOnboardingQuestionInput,
): Promise<{ id: string; status: TeamOnboardingQuestionStatus; createdAt: string }> {
  const { data, error } = await supabase
    .from('ss_team_onboarding_questions')
    .insert({
      site_id: input.siteId,
      member_id: input.memberId ?? null,
      step_id: input.stepId ?? null,
      question_text: input.questionText,
      status: 'open',
    })
    .select('id,status,created_at')
    .single();

  if (error || !data) {
    throw new Error('Failed to create team onboarding question.');
  }

  const row = data as unknown as CreatedQuestionRow;

  return {
    id: row.id,
    status: row.status,
    createdAt: row.created_at,
  };
}
