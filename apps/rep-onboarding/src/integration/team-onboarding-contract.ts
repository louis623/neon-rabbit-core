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
  stepId: string | null;
  questionText: string;
}

export interface RemoteQuestionReceipt {
  id: string;
  status: 'open';
  createdAt: string;
}
