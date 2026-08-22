"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type HeroPieceActionState =
  | { status: "idle"; message: "" }
  | { status: "success" | "denied" | "error"; message: string };

export async function makeHeroPiece(
  _previousState: HeroPieceActionState,
  formData: FormData,
): Promise<HeroPieceActionState> {
  const collectionItemId = String(formData.get("collectionItemId") ?? "").trim();

  if (!uuidPattern.test(collectionItemId)) {
    return {
      status: "denied",
      message: "Choose an owned piece from your Bling Vault and try again.",
    };
  }

  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return {
        status: "denied",
        message: "Please sign in again before saving your Hero Piece.",
      };
    }

    const { data: ownedItem, error: ownershipError } = await supabase
      .from("sparkle_finder_collection_items")
      .select("id")
      .eq("id", collectionItemId)
      .eq("user_id", authData.user.id)
      .eq("state", "owned")
      .maybeSingle();

    if (ownershipError) {
      return {
        status: "error",
        message: "We couldn't check that piece right now. Please try again.",
      };
    }

    if (!ownedItem) {
      return {
        status: "denied",
        message: "Only an owned piece in your Bling Vault can be your Hero Piece.",
      };
    }

    const { data: didSave, error } = await supabase.rpc("set_sparkle_finder_hero_piece", {
      collection_item_id: collectionItemId,
    });

    if (error || didSave !== true) {
      return {
        status: "error",
        message: "We couldn't save your Hero Piece. Please try again.",
      };
    }

    revalidatePath("/");
    revalidatePath("/silver");

    return {
      status: "success",
      message: "Your Hero Piece is saved.",
    };
  } catch {
    return {
      status: "error",
      message: "We couldn't save your Hero Piece. Please try again.",
    };
  }
}
