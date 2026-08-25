"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { claimSparkleSuiteRepForFinderUser } from "@/lib/sparkle-finder/rep-claim";
import type { SparkleFinderRepClaimClient } from "@/lib/sparkle-finder/rep-claim";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { createClient } from "@/lib/supabase/server";
import { normalizeUsStateValue } from "@/lib/us-states";

type SparkleFinderServerClient = {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string; email?: string | null } | null }; error: unknown }>;
  };
  rpc: (fn: string, args: Record<string, boolean>) => PromiseLike<{ data: unknown; error: unknown }>;
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => PromiseLike<{ data: unknown; error: unknown }>;
      };
    };
    update: (values: Record<string, string>) => {
      eq: (column: string, value: string) => PromiseLike<{ data: unknown; error: unknown }>;
    };
    insert: (values: Record<string, string>) => PromiseLike<{ data: unknown; error: unknown }>;
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
  const state = normalizeUsStateValue(cleanText(formData.get("state"), 40));

  if (!displayName) {
    redirect("/account?error=missing_display_name");
  }

  const profileUpdates: Record<string, string> = {
    display_name: displayName,
    email: cleanText(supabase.user.email, 254),
    state,
  };

  if (formData.has("phone")) {
    profileUpdates.phone_e164 = cleanText(formData.get("phone"), 40);
  }

  const existingProfile = await supabase.client
    .from("sparkle_finder_profiles")
    .select("user_id")
    .eq("user_id", supabase.user.id)
    .maybeSingle();

  const result = existingProfile.data
    ? await supabase.client.from("sparkle_finder_profiles").update(profileUpdates).eq("user_id", supabase.user.id)
    : await supabase.client.from("sparkle_finder_profiles").insert({
        user_id: supabase.user.id,
        ...profileUpdates,
      });

  if (existingProfile.error || result.error) {
    redirect("/account?error=profile_update_failed");
  }

  revalidatePath("/account");
  redirect("/account?message=profile_saved");
}

export async function claimSparkleSuiteRepAccount(formData: FormData) {
  const supabase = await getVerifiedAccountClient();
  const secretRepIdNumber = cleanText(formData.get("secretRepIdNumber"), 80).toUpperCase();

  if (!secretRepIdNumber) {
    redirect("/account?error=missing_secret_rep_id");
  }

  const serviceRoleClient = createSupabaseServiceRoleClient() as SparkleFinderRepClaimClient | null;
  const result = await claimSparkleSuiteRepForFinderUser({
    finderUserId: supabase.user.id,
    finderEmail: supabase.user.email,
    displayName: firstPresent(supabase.user.email?.split("@")[0], "Sparkle Finder Rep"),
    secretRepIdNumber,
    serviceRoleClient,
  });

  if (!result.ok) {
    redirect(`/account?error=${getRepClaimErrorParam(result.status)}`);
  }

  revalidatePath("/account");
  redirect("/account?message=rep_claimed");
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
    user: data.user,
  };
}

function cleanText(value: FormDataEntryValue | string | null | undefined, maxLength: number): string {
  return String(value ?? "")
    .trim()
    .slice(0, maxLength);
}

function getRepClaimErrorParam(status: string): string {
  if (status === "missing_secret_rep_id") {
    return "missing_secret_rep_id";
  }

  if (status === "not_configured") {
    return "rep_claim_not_configured";
  }

  if (status === "not_found") {
    return "rep_claim_not_found";
  }

  return "rep_claim_failed";
}

function firstPresent(...values: Array<string | null | undefined>): string {
  return values.find((value) => value?.trim())?.trim() ?? "";
}
