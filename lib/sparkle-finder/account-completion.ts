import type { CurrentSparkleFinderAccountState } from "./account-service";

export type AccountCompletionState = {
  isComplete: boolean;
  missingFields: string[];
};

export function getAccountCompletionState(accountState: CurrentSparkleFinderAccountState): AccountCompletionState {
  if (accountState.status !== "authenticated") {
    return {
      isComplete: false,
      missingFields: ["account"],
    };
  }

  const missingFields: string[] = [];
  const displayName = firstPresent(accountState.displayName, accountState.customer?.displayName);
  const email = firstPresent(accountState.email, accountState.customer?.email);

  if (!displayName || displayName.toLowerCase() === "guest") {
    missingFields.push("display name");
  }

  if (!email) {
    missingFields.push("email");
  }

  if (!firstPresent(accountState.customer?.phoneE164)) {
    missingFields.push("phone");
  }

  if (!firstPresent(accountState.customer?.state)) {
    missingFields.push("state");
  }

  if (!accountState.communicationConsent.privacyAcknowledgedAt) {
    missingFields.push("privacy acknowledgment");
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
}

export const getSparkleFinderAccountCompletion = getAccountCompletionState;

function firstPresent(...values: Array<string | null | undefined>): string {
  return values.find((value) => value?.trim())?.trim() ?? "";
}
