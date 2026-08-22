"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function makeHeroPiece(formData: FormData) {
  const collectionItemId = String(formData.get("collectionItemId") ?? "").trim();

  if (!uuidPattern.test(collectionItemId)) {
    return;
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return;
  }

  const { error } = await supabase.rpc("set_sparkle_finder_hero_piece", {
    collection_item_id: collectionItemId,
  });

  if (error) {
    return;
  }

  revalidatePath("/");
  revalidatePath("/silver");
}
