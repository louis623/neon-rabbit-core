export type TeamOnboardingSiteStatus = 'draft' | 'published' | 'archived';
export type TeamOnboardingInviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired';
export type TeamOnboardingQuestionStatus = 'open' | 'answered' | 'archived';
export type TeamOnboardingResourceSource = 'official' | 'team' | 'sparkle-suite';

export interface TeamOnboardingSite {
  id: string;
  ownerRepId: string;
  slug: string;
  title: string;
  teamName: string;
  repDisplayName: string;
  status: TeamOnboardingSiteStatus;
  customDomain: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface TeamOnboardingMember {
  id: string;
  siteId: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  status: TeamOnboardingInviteStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TeamOnboardingInvite {
  id: string;
  siteId: string;
  memberId: string;
  tokenHash: string;
  status: TeamOnboardingInviteStatus;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface TeamOnboardingResource {
  id: string;
  siteId: string;
  title: string;
  description: string;
  href: string;
  category: string;
  source: TeamOnboardingResourceSource;
  sortOrder: number;
}

export interface TeamOnboardingStep {
  id: string;
  siteId: string;
  groupTitle: string;
  title: string;
  description: string;
  resourceIds: string[];
  sortOrder: number;
}

export interface TeamOnboardingQuestion {
  id: string;
  siteId: string;
  memberId: string | null;
  stepId: string | null;
  questionText: string;
  answerText: string | null;
  status: TeamOnboardingQuestionStatus;
  createdAt: string;
  answeredAt: string | null;
}

export interface PublicTeamOnboardingConfig
  extends Pick<TeamOnboardingSite, 'slug' | 'title' | 'teamName' | 'repDisplayName' | 'customDomain'> {
  resources: TeamOnboardingResource[];
  steps: TeamOnboardingStep[];
}
