export interface RemoteOnboardingParticipant {
  id: string;
  displayName: string;
  status: 'invited' | 'started' | 'needs_help' | 'completed' | 'archived';
  createdAt: string | null;
  lastActivityAt: string | null;
}

export interface RemoteOnboardingTeam {
  ownerRepId: string;
  displayName: string;
  businessName: string;
  teamName: string;
}

export interface RemoteOnboardingProgress {
  participantId: string;
  stepId: string;
  status: 'not_started' | 'done' | 'needs_help';
  completedAt: string | null;
  updatedAt: string | null;
}

export interface RemoteOnboardingMessage {
  id: string;
  participantId: string;
  senderType: 'participant' | 'team_lead';
  body: string;
  readAt: string | null;
  createdAt: string | null;
}

export interface RemoteOnboardingState {
  participant: RemoteOnboardingParticipant;
  team: RemoteOnboardingTeam;
  progress: RemoteOnboardingProgress[];
  messages: RemoteOnboardingMessage[];
}

export interface RemoteProgressSubmission {
  stepId: string;
  status: 'not_started' | 'done' | 'needs_help';
}

export interface RemoteQuestionSubmission {
  body: string;
}

export interface RemoteMessageReceipt {
  ok: true;
  message: RemoteOnboardingMessage;
}
