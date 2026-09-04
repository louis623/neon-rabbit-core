import type {
  RemoteMessageReceipt,
  RemoteOnboardingState,
  RemoteProgressSubmission,
  RemoteQuestionSubmission,
} from './team-onboarding-contract';

type RemoteOnboardingRequest = {
  apiBaseUrl: string;
  inviteToken: string;
};

type RemoteProgressRequest = RemoteOnboardingRequest & {
  submission: RemoteProgressSubmission;
};

type RemoteMessageRequest = RemoteOnboardingRequest & {
  submission: RemoteQuestionSubmission;
};

function getNormalizedApiBaseUrl(apiBaseUrl: string) {
  return apiBaseUrl.replace(/\/+$/, '');
}

function buildInviteEndpoint(apiBaseUrl: string, endpoint = '') {
  const url = new URL(
    `${getNormalizedApiBaseUrl(apiBaseUrl)}/api/team-onboarding/access${endpoint}`,
  );
  return url;
}

export function getConfiguredInviteToken(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('invite');
}

export function getSparkleSuiteApiBaseUrl(): string | null {
  return import.meta.env.VITE_SPARKLE_SUITE_API_BASE_URL ?? null;
}

export async function fetchRemoteOnboardingState({
  apiBaseUrl,
  inviteToken,
}: RemoteOnboardingRequest): Promise<RemoteOnboardingState> {
  const url = buildInviteEndpoint(apiBaseUrl);
  url.searchParams.set('invite', inviteToken);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Could not load Sparkle Suite onboarding state (${response.status} ${response.statusText}).`);
  }

  return response.json() as Promise<RemoteOnboardingState>;
}

export async function submitRemoteProgress({
  apiBaseUrl,
  inviteToken,
  submission,
}: RemoteProgressRequest): Promise<void> {
  const url = buildInviteEndpoint(apiBaseUrl, '/progress');
  url.searchParams.set('invite', inviteToken);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submission),
  });

  if (!response.ok) {
    throw new Error(`Could not sync progress to Sparkle Suite (${response.status} ${response.statusText}).`);
  }
}

export async function submitRemoteQuestion({
  apiBaseUrl,
  inviteToken,
  submission,
}: RemoteMessageRequest): Promise<RemoteMessageReceipt> {
  const url = buildInviteEndpoint(apiBaseUrl, '/messages');
  url.searchParams.set('invite', inviteToken);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submission),
  });

  if (!response.ok) {
    throw new Error(`Could not send question to Sparkle Suite (${response.status} ${response.statusText}).`);
  }

  return response.json() as Promise<RemoteMessageReceipt>;
}
