import type { FinderNicNacToolIntent } from "./curator";
import { listFinderNicNacToolNamesForIntents } from "./tools";

export const FINDER_SUITE_WORKSPACE_REQUIRED_MESSAGE =
  "I need you to log in to Sparkle Suite for us to do any Sparkle Suite work.";

export const FINDER_SILVER_REQUIRED_MESSAGE =
  "Sparkle Finder Silver is required before I can use that Finder tool.";

export type FinderNicNacToolIntentCapabilityRequirement =
  | "finder_memory"
  | "finder_account"
  | "suite_workspace";

export interface FinderNicNacToolIntentCapability {
  requirement: FinderNicNacToolIntentCapabilityRequirement;
}

export const FINDER_NIC_NAC_TOOL_INTENT_CAPABILITIES: Record<
  FinderNicNacToolIntent,
  FinderNicNacToolIntentCapability
> = {
  memory: { requirement: "finder_memory" },
  collection: { requirement: "finder_account" },
  showcase: { requirement: "finder_account" },
  catalog: { requirement: "finder_account" },
  studio: { requirement: "finder_account" },
  availability: { requirement: "finder_account" },
  profile: { requirement: "finder_account" },
  rep_discovery: { requirement: "finder_account" },
  social: { requirement: "finder_account" },
  suite_workspace: { requirement: "suite_workspace" },
};

export type FinderNicNacToolBlockReason =
  | "finder_silver_required"
  | "suite_workspace_required";

export interface FinderNicNacBlockedToolIntent {
  intent: FinderNicNacToolIntent;
  reason: FinderNicNacToolBlockReason;
  message: string;
}

export interface FinderNicNacProductContext {
  product: "sparkle_finder";
  surface: "sparkle_finder";
  actorType: "collector" | "linked_rep";
  accountTier: "free" | "silver";
  linkedSuiteRepId?: string;
  permissions: {
    canUseFinderMemory: boolean;
    canUseFinderAccountTools: boolean;
    canMutateSuiteWorkspace: boolean;
  };
}

export interface FinderNicNacToolPolicyResult {
  allowedIntents: FinderNicNacToolIntent[];
  blockedIntents: FinderNicNacBlockedToolIntent[];
  allowedToolNames: string[];
  blockedToolNames: string[];
}

export function createFinderNicNacProductContext(input: {
  actorType: "collector" | "linked_rep";
  accountTier: "free" | "silver";
  linkedSuiteRepId?: string;
}): FinderNicNacProductContext {
  const canUseFinderAccountTools = input.accountTier === "silver";

  return {
    product: "sparkle_finder",
    surface: "sparkle_finder",
    actorType: input.actorType,
    accountTier: input.accountTier,
    linkedSuiteRepId: input.linkedSuiteRepId,
    permissions: {
      canUseFinderMemory: canUseFinderAccountTools,
      canUseFinderAccountTools,
      canMutateSuiteWorkspace: false,
    },
  };
}

export function filterFinderNicNacToolIntentsForContext(
  context: FinderNicNacProductContext,
  requestedIntents: FinderNicNacToolIntent[],
): FinderNicNacToolPolicyResult {
  const suiteWorkspaceBlocked =
    requestedIntents.includes("suite_workspace") &&
    !context.permissions.canMutateSuiteWorkspace;
  const allowedIntents: FinderNicNacToolIntent[] = [];
  const blockedIntents: FinderNicNacBlockedToolIntent[] = [];

  for (const intent of requestedIntents) {
    const block = suiteWorkspaceBlocked && intent !== "suite_workspace"
      ? {
          reason: "suite_workspace_required" as const,
          message: FINDER_SUITE_WORKSPACE_REQUIRED_MESSAGE,
        }
      : getBlockForIntent(context, intent);

    if (block) {
      blockedIntents.push({
        intent,
        reason: block.reason,
        message: block.message,
      });
    } else if (!allowedIntents.includes(intent)) {
      allowedIntents.push(intent);
    }
  }

  return {
    allowedIntents,
    blockedIntents,
    allowedToolNames: listFinderNicNacToolNamesForIntents(allowedIntents),
    blockedToolNames: listFinderNicNacToolNamesForIntents(
      blockedIntents.map((blocked) => blocked.intent),
    ),
  };
}

function getBlockForIntent(
  context: FinderNicNacProductContext,
  intent: FinderNicNacToolIntent,
): { reason: FinderNicNacToolBlockReason; message: string } | null {
  const capability = FINDER_NIC_NAC_TOOL_INTENT_CAPABILITIES[intent];

  if (capability.requirement === "suite_workspace") {
    if (context.permissions.canMutateSuiteWorkspace) {
      return null;
    }

    return {
      reason: "suite_workspace_required",
      message: FINDER_SUITE_WORKSPACE_REQUIRED_MESSAGE,
    };
  }

  if (capability.requirement === "finder_memory") {
    if (context.permissions.canUseFinderMemory) {
      return null;
    }

    return {
      reason: "finder_silver_required",
      message: FINDER_SILVER_REQUIRED_MESSAGE,
    };
  }

  if (context.permissions.canUseFinderAccountTools) {
    return null;
  }

  return {
    reason: "finder_silver_required",
    message: FINDER_SILVER_REQUIRED_MESSAGE,
  };
}
