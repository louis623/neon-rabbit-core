import type { BlingVaultPageResult } from "@/app/actions/bling-vault";
import type {
  BlingVaultFilter,
  HomepageBlingVaultItem,
} from "@/lib/sparkle-finder/homepage-bling-vault";

export type BlingVaultLoadState = {
  activeFilter: BlingVaultFilter;
  errorMessage: string | null;
  items: HomepageBlingVaultItem[];
  requestId: number;
  status: "idle" | "loading" | "error";
  total: number;
};

export type BlingVaultLoadEvent =
  | { type: "filter_changed"; filter: BlingVaultFilter }
  | { type: "request_started"; filter: BlingVaultFilter; requestId: number; replace: boolean }
  | { type: "request_finished"; requestId: number; replace: boolean; result: BlingVaultPageResult };

export function createInitialBlingVaultLoadState(input: {
  errorMessage?: string | null;
  items: HomepageBlingVaultItem[];
  total: number;
}): BlingVaultLoadState {
  return {
    activeFilter: "all",
    errorMessage: input.errorMessage ?? null,
    items: input.items,
    requestId: 0,
    status: input.errorMessage ? "error" : "idle",
    total: input.total,
  };
}

export function reduceBlingVaultLoadState(
  state: BlingVaultLoadState,
  event: BlingVaultLoadEvent,
): BlingVaultLoadState {
  if (event.type === "filter_changed") {
    return {
      ...state,
      activeFilter: event.filter,
      errorMessage: null,
      status: "idle",
    };
  }

  if (event.type === "request_started") {
    return {
      ...state,
      activeFilter: event.filter,
      errorMessage: null,
      items: event.replace ? [] : state.items,
      requestId: event.requestId,
      status: "loading",
      total: event.replace ? 0 : state.total,
    };
  }

  if (event.requestId !== state.requestId) {
    return state;
  }

  if (event.result.status === "error") {
    return {
      ...state,
      errorMessage: event.result.message,
      status: "error",
    };
  }

  return {
    ...state,
    errorMessage: null,
    items: event.replace
      ? event.result.items
      : mergeUniqueBlingVaultItems(state.items, event.result.items),
    status: "idle",
    total: event.result.total,
  };
}

export function mergeUniqueBlingVaultItems(
  current: HomepageBlingVaultItem[],
  next: HomepageBlingVaultItem[],
): HomepageBlingVaultItem[] {
  const byId = new Map(current.map((item) => [item.id, item]));
  next.forEach((item) => byId.set(item.id, item));
  return [...byId.values()];
}
