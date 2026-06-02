export interface RemoteOnboardingSite {
  slug: string;
  title: string;
  teamName: string;
  repDisplayName: string;
  customDomain: string | null;
}

export interface RemoteOnboardingResource {
  id: string;
  title: string;
  description: string;
  href: string;
  category: string;
  source: 'official' | 'team' | 'sparkle-suite';
  sortOrder: number;
}

export interface RemoteOnboardingStep {
  id: string;
  groupTitle: string;
  title: string;
  description: string;
  resourceIds: string[];
  sortOrder: number;
}

export interface RemoteOnboardingConfig {
  site: RemoteOnboardingSite;
  resources: RemoteOnboardingResource[];
  steps: RemoteOnboardingStep[];
}

export interface RemoteQuestionSubmission {
  siteSlug: string;
  siteToken: string;
  submitterName?: string;
  submitterEmail?: string;
  submitterPhone?: string;
  stepId: string | null;
  stepTitle: string | null;
  questionText: string;
  source: 'rep_button' | 'nic_nac';
  website: string;
}

export interface RemoteQuestionReceipt {
  questionId: string;
}
