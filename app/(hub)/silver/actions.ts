"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSparkleFinderAccount } from "@/lib/sparkle-finder/account-service";
import {
  persistCollectionItemForAccount,
  persistSilverProfileForAccount,
  type SupabaseCustomerStateClient,
} from "@/lib/sparkle-finder/customer-state";
import { getJewelryItemById } from "@/lib/sparkle-finder/service";
import { createClient } from "@/lib/supabase/server";
import type { CollectionItem } from "@/lib/sparkle-finder/types";

export type SilverSaveActionState = {
  status: "idle" | "saved" | "denied" | "error";
  message: string;
};

type SparkleFinderSilverServerClient = SupabaseCustomerStateClient & {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null }; error: unknown }>;
  };
};

export async function saveSilverProfileAction(
  _previousState: SilverSaveActionState,
  formData: FormData,
): Promise<SilverSaveActionState> {
  const verified = await getVerifiedSilverClient();

  if (!verified.ok) {
    return verified.state;
  }

  const result = await persistSilverProfileForAccount(verified.client, verified.accountState, {
    bio: String(formData.get("bio") ?? ""),
    tiktokHandle: String(formData.get("tiktokHandle") ?? ""),
    visibility: formData.get("visibility") === "sparkle_finder" ? "sparkle_finder" : "private",
  });

  if (!result.ok) {
    return {
      status: result.reason === "silver_required" ? "denied" : "error",
      message: result.reason === "silver_required" ? "Silver access is required to save profile updates." : "Profile could not be saved.",
    };
  }

  revalidatePath("/silver");

  return {
    status: "saved",
    message: "Profile saved.",
  };
}

export async function saveSilverCollectionItemAction(
  _previousState: SilverSaveActionState,
  formData: FormData,
): Promise<SilverSaveActionState> {
  const verified = await getVerifiedSilverClient();

  if (!verified.ok) {
    return verified.state;
  }

  const state = parseCollectionState(formData.get("state"));
  const jewelryItemId = String(formData.get("jewelryItemId") ?? "").trim();

  if (!jewelryItemId) {
    return {
      status: "error",
      message: "Collection item could not be saved.",
    };
  }

  if (!getJewelryItemById(jewelryItemId)) {
    return {
      status: "denied",
      message: "Collection item is not available in the Sparkle Finder library.",
    };
  }

  const result = await persistCollectionItemForAccount(verified.client, verified.accountState, {
    jewelryItemId,
    state,
    note: String(formData.get("note") ?? ""),
    isHighlighted: formData.get("isHighlighted") === "yes",
  });

  if (!result.ok) {
    return {
      status: result.reason === "silver_required" ? "denied" : "error",
      message:
        result.reason === "silver_required" ? "Silver access is required to save collection updates." : "Collection could not be saved.",
    };
  }

  revalidatePath("/silver");

  return {
    status: "saved",
    message: state === "wishlist" ? "Watchlist saved." : "Collection saved.",
  };
}

async function getVerifiedSilverClient(): Promise<
  | {
      ok: true;
      client: SparkleFinderSilverServerClient;
      accountState: Awaited<ReturnType<typeof getCurrentSparkleFinderAccount>>;
    }
  | {
      ok: false;
      state: SilverSaveActionState;
    }
> {
  let client: SparkleFinderSilverServerClient;

  try {
    client = (await createClient()) as unknown as SparkleFinderSilverServerClient;
  } catch {
    return {
      ok: false,
      state: {
        status: "error",
        message: "Account saves are unavailable right now.",
      },
    };
  }

  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    return {
      ok: false,
      state: {
        status: "denied",
        message: "Sign in to save Silver updates.",
      },
    };
  }

  const accountState = await getCurrentSparkleFinderAccount({
    isSupabaseConfigured: () => true,
    createSupabaseClient: async () => client,
  });

  if (accountState.status !== "authenticated" || accountState.customer.id !== data.user.id) {
    return {
      ok: false,
      state: {
        status: "denied",
        message: "Sign in to save Silver updates.",
      },
    };
  }

  return {
    ok: true,
    client,
    accountState,
  };
}

function parseCollectionState(value: FormDataEntryValue | null): CollectionItem["state"] {
  if (value === "wishlist" || value === "private_note_only") {
    return value;
  }

  return "owned";
}
