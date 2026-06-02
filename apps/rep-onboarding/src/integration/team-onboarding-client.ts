import type {
  RemoteOnboardingConfig,
  RemoteQuestionReceipt,
  RemoteQuestionSubmission,
} from './team-onboarding-contract';

type RemoteOnboardingRequest = {
  apiBaseUrl: string;
  siteSlug: string;
};

type RemoteQuestionRequest = RemoteOnboardingRequest & {
  submission: RemoteQuestionSubmission;
};

function getNormalizedApiBaseUrl(apiBaseUrl: string) {
  return apiBaseUrl.replace(/\/+$/, '');
}

function getSiteSlugFromPath(pathname: string) {
  const match = pathname.match(/\/(?:team-onboarding|team-training)\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function getConfiguredSiteSlug(): string | null {
  const pathSlug = getSiteSlugFromPath(window.location.pathname);
  if (pathSlug) return pathSlug;

  const querySlug = new URLSearchParams(window.location.search).get('site');
  if (querySlug) return querySlug;

  return import.meta.env.VITE_TEAM_ONBOARDING_SITE_SLUG ?? null;
}

export function getSparkleSuiteApiBaseUrl(): string | null {
  return import.meta.env.VITE_SPARKLE_SUITE_API_BASE_URL ?? null;
}

export async function fetchRemoteOnboardingConfig({
  apiBaseUrl,
  siteSlug,
}: RemoteOnboardingRequest): Promise<RemoteOnboardingConfig> {
  const baseUrl = getNormalizedApiBaseUrl(apiBaseUrl);
  const response = await fetch(`${baseUrl}/api/team-onboarding/sites/${encodeURIComponent(siteSlug)}`);

  if (!response.ok) {
    throw new Error(`Could not load Sparkle Suite onboarding config (${response.status} ${response.statusText}).`);
  }

  return response.json() as Promise<RemoteOnboardingConfig>;
}

export async function submitRemoteQuestion({
  apiBaseUrl,
  siteSlug,
  submission,
}: RemoteQuestionRequest): Promise<RemoteQuestionReceipt> {
  const baseUrl = getNormalizedApiBaseUrl(apiBaseUrl);
  const response = await fetch(`${baseUrl}/api/team-onboarding/sites/${encodeURIComponent(siteSlug)}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submission),
  });

  if (!response.ok) {
    throw new Error(`Could not send question to Sparkle Suite (${response.status} ${response.statusText}).`);
  }

  return response.json() as Promise<RemoteQuestionReceipt>;
}
