"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSparkleFinderAccount, type CurrentSparkleFinderAccountState } from "@/lib/sparkle-finder/account-service";
import { normalizeFavoriteRepNote, normalizeRepId } from "@/lib/sparkle-finder/favorite-reps-actions";
import {
  deleteFavoriteRepForAccount,
  persistFavoriteRepForAccount,
  persistFavoriteRepNotesForAccount,
  type SupabaseFavoriteRepsClient,
} from "@/lib/sparkle-finder/favorite-reps-state";
import { createClient } from "@/lib/supabase/server";

export type FavoriteRepActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

type SparkleFinderFavoriteRepsServerClient = SupabaseFavoriteRepsClient & {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null }; error: unknown }>;
  };
};

export async function favoriteRepAction(
  _previousState: FavoriteRepActionState,
  formData: FormData,
): Promise<FavoriteRepActionState> {
  const verified = await getVerifiedFavoriteRepClient();

  if (!verified.ok) {
    return verified.state;
  }

  const repId = normalizeRepId(formData.get("repId"));

  if (!repId) {
    return {
      status: "error",
      message: "Favorite rep is unavailable.",
    };
  }

  const result = await persistFavoriteRepForAccount(verified.client, verified.accountState, {
    repId,
    repDisplayName: cleanFormText(formData.get("repDisplayName")),
    repSiteUrl: cleanFormText(formData.get("repSiteUrl")),
    repBoardUrl: cleanFormText(formData.get("repBoardUrl")),
  });

  if (!result.ok) {
    return {
      status: "error",
      message: getFavoriteRepFailureMessage(result.reason),
    };
  }

  revalidateFavoriteRepPaths();

  return {
    status: "success",
    message: result.alreadyFavorited ? "Favorite rep already saved." : "Favorite rep saved.",
  };
}

export async function unfavoriteRepAction(formData: FormData): Promise<void> {
  const verified = await getVerifiedFavoriteRepClient();

  if (!verified.ok) {
    return;
  }

  const result = await deleteFavoriteRepForAccount(verified.client, verified.accountState, normalizeRepId(formData.get("repId")));

  if (result.ok) {
    revalidateFavoriteRepPaths();
  }
}

export async function saveFavoriteRepNotesAction(
  _previousState: FavoriteRepActionState,
  formData: FormData,
): Promise<FavoriteRepActionState> {
  const verified = await getVerifiedFavoriteRepClient();

  if (!verified.ok) {
    return verified.state;
  }

  const result = await persistFavoriteRepNotesForAccount(verified.client, verified.accountState, {
    repId: normalizeRepId(formData.get("repId")),
    notes: normalizeFavoriteRepNote(formData.get("notes")),
  });

  if (!result.ok) {
    return {
      status: "error",
      message: getFavoriteRepNotesFailureMessage(result.reason),
    };
  }

  revalidatePath("/favorites");
  revalidatePath("/silver");

  return {
    status: "success",
    message: "Favorite rep notes saved.",
  };
}

async function getVerifiedFavoriteRepClient(): Promise<
  | {
      ok: true;
      client: SparkleFinderFavoriteRepsServerClient;
      accountState: CurrentSparkleFinderAccountState & { status: "authenticated" };
    }
  | {
      ok: false;
      state: FavoriteRepActionState;
    }
> {
  let client: SparkleFinderFavoriteRepsServerClient;

  try {
    client = (await createClient()) as unknown as SparkleFinderFavoriteRepsServerClient;
  } catch {
    return {
      ok: false,
      state: {
        status: "error",
        message: "Favorite reps are unavailable right now.",
      },
    };
  }

  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    return {
      ok: false,
      state: {
        status: "error",
        message: "Sign in to save favorite reps.",
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
        status: "error",
        message: "Sign in to save favorite reps.",
      },
    };
  }

  return {
    ok: true,
    client,
    accountState,
  };
}

function revalidateFavoriteRepPaths() {
  revalidatePath("/favorites");
  revalidatePath("/silver");
  revalidatePath("/live-shows");
  revalidatePath("/rep-boards");
}

function cleanFormText(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

function getFavoriteRepFailureMessage(reason: string): string {
  if (reason === "sign_in_required") {
    return "Sign in to save favorite reps.";
  }

  if (reason === "free_limit_reached") {
    return "Free favorite rep limit reached. Silver can save more favorite reps.";
  }

  return "Favorite reps are unavailable right now.";
}

function getFavoriteRepNotesFailureMessage(reason: string): string {
  if (reason === "sign_in_required") {
    return "Sign in to save favorite reps.";
  }

  if (reason === "silver_required") {
    return "Silver is required to save favorite rep notes.";
  }

  return "Favorite rep notes are unavailable right now.";
}
