"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSparkleFinderAccount } from "@/lib/sparkle-finder/account-service";
import { createClient } from "@/lib/supabase/server";
import type { SilverSaveActionState } from "./actions";

export async function saveShowcaseProfileSetupAction(
  _previousState: SilverSaveActionState,
  formData: FormData,
): Promise<SilverSaveActionState> {
  const verified = await getVerifiedOwner();

  if (!verified.ok) return verified.state;

  const handle = normalizeHandle(formData.get("handle"));
  const tagline = cleanText(formData.get("tagline"), 160);
  const visibility = formData.get("visibility") === "public" ? "public" : "private";

  if (handle.length < 3) {
    return { status: "error", message: "Choose a Showcase handle with at least 3 letters or numbers." };
  }

  const { error } = await verified.supabase
    .from("sparkle_finder_profiles")
    .update({
      showcase_handle: handle,
      showcase_tagline: tagline,
      showcase_visibility: visibility,
      ...(visibility === "public" ? { profile_visibility: "sparkle_finder" } : {}),
    })
    .eq("user_id", verified.userId);

  if (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    return {
      status: "error",
      message: code === "23505" ? "That Showcase handle is already taken. Try another." : "Showcase settings could not be saved.",
    };
  }

  revalidateShowcasePaths(handle);
  return {
    status: "saved",
    message: visibility === "public" ? "Your Sparkle Showcase is public." : "Your Sparkle Showcase is private.",
  };
}

export async function saveShowcaseCollectionAction(
  _previousState: SilverSaveActionState,
  formData: FormData,
): Promise<SilverSaveActionState> {
  const verified = await getVerifiedOwner();

  if (!verified.ok) return verified.state;

  const collectionId = cleanUuid(formData.get("collectionId"));
  const title = cleanText(formData.get("title"), 80);
  const description = cleanText(formData.get("description"), 240);
  const visibility = formData.get("visibility") === "public" ? "public" : "private";
  const slug = createSlug(title);

  if (!title || !slug) {
    return { status: "error", message: "Give your Showcase Collection a title." };
  }

  const values = { title, slug, description, visibility };
  const result = collectionId
    ? await verified.supabase
        .from("sparkle_finder_showcase_collections")
        .update(values)
        .eq("id", collectionId)
        .eq("user_id", verified.userId)
    : await verified.supabase
        .from("sparkle_finder_showcase_collections")
        .insert({ ...values, user_id: verified.userId });

  if (result.error) {
    return { status: "error", message: "Showcase Collection could not be saved. Use a unique title." };
  }

  revalidateShowcasePaths();
  return { status: "saved", message: collectionId ? "Showcase Collection updated." : "Showcase Collection created." };
}

export async function deleteShowcaseCollectionAction(
  _previousState: SilverSaveActionState,
  formData: FormData,
): Promise<SilverSaveActionState> {
  const verified = await getVerifiedOwner();

  if (!verified.ok) return verified.state;

  const collectionId = cleanUuid(formData.get("collectionId"));
  if (!collectionId) return { status: "error", message: "Showcase Collection could not be removed." };

  const { error } = await verified.supabase
    .from("sparkle_finder_showcase_collections")
    .delete()
    .eq("id", collectionId)
    .eq("user_id", verified.userId);

  if (error) return { status: "error", message: "Showcase Collection could not be removed." };

  revalidateShowcasePaths();
  return { status: "saved", message: "Showcase Collection removed. Your jewelry stayed in your collection." };
}

export async function assignShowcasePieceAction(
  _previousState: SilverSaveActionState,
  formData: FormData,
): Promise<SilverSaveActionState> {
  const verified = await getVerifiedOwner();

  if (!verified.ok) return verified.state;

  const collectionId = cleanUuid(formData.get("collectionId"));
  const collectionItemId = cleanUuid(formData.get("collectionItemId"));
  const operation = formData.get("operation") === "remove" ? "remove" : "add";

  if (!collectionId || !collectionItemId) {
    return { status: "error", message: "Choose a piece and a Showcase Collection." };
  }

  const [collection, item] = await Promise.all([
    verified.supabase
      .from("sparkle_finder_showcase_collections")
      .select("id")
      .eq("id", collectionId)
      .eq("user_id", verified.userId)
      .maybeSingle(),
    verified.supabase
      .from("sparkle_finder_collection_items")
      .select("id")
      .eq("id", collectionItemId)
      .eq("user_id", verified.userId)
      .maybeSingle(),
  ]);

  if (collection.error || item.error || !collection.data || !item.data) {
    return { status: "denied", message: "That piece or Showcase Collection is not available to your account." };
  }

  const result = operation === "remove"
    ? await verified.supabase
        .from("sparkle_finder_showcase_collection_items")
        .delete()
        .eq("showcase_collection_id", collectionId)
        .eq("collection_item_id", collectionItemId)
    : await verified.supabase
        .from("sparkle_finder_showcase_collection_items")
        .upsert(
          { showcase_collection_id: collectionId, collection_item_id: collectionItemId },
          { onConflict: "showcase_collection_id,collection_item_id" },
        );

  if (result.error) return { status: "error", message: "Showcase Collection assignment could not be saved." };

  revalidateShowcasePaths();
  return { status: "saved", message: operation === "remove" ? "Piece removed from that Showcase Collection." : "Piece added to that Showcase Collection." };
}

async function getVerifiedOwner() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return { ok: false as const, state: deniedState() };
    }

    const accountState = await getCurrentSparkleFinderAccount({
      isSupabaseConfigured: () => true,
      createSupabaseClient: async () => supabase,
    });

    if (
      accountState.status !== "authenticated" ||
      accountState.customer.id !== data.user.id ||
      accountState.membership?.hasSilverAccess !== true
    ) {
      return { ok: false as const, state: deniedState() };
    }

    return { ok: true as const, supabase, userId: data.user.id };
  } catch {
    return { ok: false as const, state: { status: "error" as const, message: "Showcase saves are unavailable right now." } };
  }
}

function deniedState(): SilverSaveActionState {
  return { status: "denied", message: "Silver access is required to manage a Sparkle Showcase." };
}

function normalizeHandle(value: FormDataEntryValue | null): string {
  return cleanText(value, 40).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
}

function cleanText(value: FormDataEntryValue | null, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanUuid(value: FormDataEntryValue | null): string {
  const text = cleanText(value, 36);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text) ? text : "";
}

function createSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function revalidateShowcasePaths(handle = "") {
  revalidatePath("/silver");
  revalidatePath("/collectors");
  revalidatePath("/showcase", "layout");
  if (handle) revalidatePath(`/showcase/${handle}`);
}
