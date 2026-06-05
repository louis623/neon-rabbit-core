"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type SparkleFinderServerClient = {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null }; error: unknown }>;
  };
  rpc: (fn: string, args: Record<string, boolean>) => PromiseLike<{ data: unknown; error: unknown }>;
  from: (table: string) => {
    update: (values: Record<string, string>) => {
      eq: (column: string, value: string) => PromiseLike<{ data: unknown; error: unknown }>;
    };
  };
};

export async function updateCommunicationPreferences(formData: FormData) {
  const supabase = await getVerifiedAccountClient();

  const { error } = await supabase.client.rpc("update_sparkle_finder_communication_preferences", {
    promotional_email_opt_in: formData.get("promotionalEmail") === "yes",
    promotional_sms_opt_in: formData.get("promotionalSms") === "yes",
    account_sms_allowed: formData.get("accountSmsAllowed") === "yes",
    privacy_acknowledged: formData.get("privacyAcknowledged") === "yes",
  });

  if (error) {
    redirect("/account?error=preferences_update_failed");
  }

  revalidatePath("/account");
  redirect("/account?message=preferences_saved");
}

export async function updateAccountProfile(formData: FormData) {
  const supabase = await getVerifiedAccountClient();
  const displayName = cleanText(formData.get("displayName"), 80);
  const state = cleanText(formData.get("state"), 40);

  if (!displayName) {
    redirect("/account?error=missing_display_name");
  }

  const profileUpdates: Record<string, string> = {
    display_name: displayName,
    state,
  };

  if (formData.has("phone")) {
    profileUpdates.phone_e164 = cleanText(formData.get("phone"), 40);
  }

  const { error } = await supabase.client
    .from("sparkle_finder_profiles")
    .update(profileUpdates)
    .eq("user_id", supabase.userId);

  if (error) {
    redirect("/account?error=profile_update_failed");
  }

  revalidatePath("/account");
  redirect("/account?message=profile_saved");
}

async function getVerifiedAccountClient() {
  let client: SparkleFinderServerClient;

  try {
    client = (await createClient()) as unknown as SparkleFinderServerClient;
  } catch {
    redirect("/account?error=account_unavailable");
  }

  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    redirect("/auth/sign-in?next=/account");
  }

  return {
    client,
    userId: data.user.id,
  };
}

function cleanText(value: FormDataEntryValue | null, maxLength: number): string {
  return String(value ?? "")
    .trim()
    .slice(0, maxLength);
}
