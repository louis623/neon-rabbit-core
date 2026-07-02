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

export function getConfiguredInviteToken(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('invite') ?? import.meta.env.VITE_TEAM_ONBOARDING_INVITE_TOKEN ?? null;
}

export function getSparkleSuiteApiBaseUrl(): string | null {
  return import.meta.env.VITE_SPARKLE_SUITE_API_BASE_URL ?? null;
}

export async function fetchRemoteOnboardingState({
  apiBaseUrl,
  inviteToken,
}: RemoteOnboardingRequest): Promise<RemoteOnboardingState> {
  const baseUrl = getNormalizedApiBaseUrl(apiBaseUrl);
  const response = await fetch(`${baseUrl}/api/team-onboarding/access/${encodeURIComponent(inviteToken)}`);

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
  const baseUrl = getNormalizedApiBaseUrl(apiBaseUrl);
  const response = await fetch(`${baseUrl}/api/team-onboarding/access/${encodeURIComponent(inviteToken)}/progress`, {
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
  const baseUrl = getNormalizedApiBaseUrl(apiBaseUrl);
  const response = await fetch(`${baseUrl}/api/team-onboarding/access/${encodeURIComponent(inviteToken)}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submission),
  });

  if (!response.ok) {
    throw new Error(`Could not send question to Sparkle Suite (${response.status} ${response.statusText}).`);
  }

  return response.json() as Promise<RemoteMessageReceipt>;
}
