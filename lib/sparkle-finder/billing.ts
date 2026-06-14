import Stripe from "stripe";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type {
  SparkleFinderAccessState,
  SparkleFinderSilverSource,
} from "./account-types";
import { getAllowedSparkleFinderSupabaseUrl } from "../supabase/config";
import { getSparkleFinderOriginFromValue } from "./oauth-redirect";

export const stripeApiVersion = "2026-02-25.clover";

const requiredBillingEnv = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_SILVER_PRICE_ID",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

type RequiredBillingEnvName = (typeof requiredBillingEnv)[number];

export type SparkleFinderBillingEnv =
  | {
      isConfigured: true;
      missing: [];
      stripeSecretKey: string;
      stripeWebhookSecret: string;
      silverPriceId: string;
      siteUrl: string;
      supabaseUrl: string;
      supabaseServiceRoleKey: string;
    }
  | {
      isConfigured: false;
      missing: RequiredBillingEnvName[];
    };

export type SparkleFinderBillingMembershipUpdate = {
  userId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  accessState: SparkleFinderAccessState;
  silverSource: SparkleFinderSilverSource;
  silverStartedAt: string | null;
  silverEndsAt: string | null;
};

type CurrentMembershipState = {
  currentAccessState?: SparkleFinderAccessState | null;
};

type SupabaseMembershipRow = {
  user_id: string;
  access_state: SparkleFinderAccessState;
  silver_source: SparkleFinderSilverSource;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

export function getSparkleFinderBillingEnv(
  env: Record<string, string | undefined> = process.env,
): SparkleFinderBillingEnv {
  const missing = requiredBillingEnv.filter((name) => !env[name]?.trim());
  const siteUrl = getSparkleFinderOriginFromValue(env.NEXT_PUBLIC_SITE_URL);
  const supabaseUrl = getAllowedSparkleFinderSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL);

  if (!siteUrl && !missing.includes("NEXT_PUBLIC_SITE_URL")) {
    missing.push("NEXT_PUBLIC_SITE_URL");
  }

  if (!supabaseUrl && !missing.includes("NEXT_PUBLIC_SUPABASE_URL")) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!siteUrl || !supabaseUrl) {
    return {
      isConfigured: false,
      missing,
    };
  }

  if (missing.length > 0) {
    return {
      isConfigured: false,
      missing,
    };
  }

  return {
    isConfigured: true,
    missing: [],
    stripeSecretKey: env.STRIPE_SECRET_KEY!.trim(),
    stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET!.trim(),
    silverPriceId: env.STRIPE_SILVER_PRICE_ID!.trim(),
    siteUrl,
    supabaseUrl,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY!.trim(),
  };
}

export function isSparkleFinderCheckoutConfigured(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return isSparkleFinderPaidBillingEnabled(env) && getSparkleFinderBillingEnv(env).isConfigured;
}

export function isSparkleFinderPaidBillingEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.SPARKLE_FINDER_ENABLE_PAID_BILLING === "true";
}

export function createStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    apiVersion: stripeApiVersion as never,
  });
}

export function mapCheckoutSessionCompletedToMembershipUpdate(
  session: Stripe.Checkout.Session,
  now: string = new Date().toISOString(),
): SparkleFinderBillingMembershipUpdate | null {
  if (session.mode !== "subscription") {
    return null;
  }

  const userId = firstPresent(session.client_reference_id, session.metadata?.supabase_user_id);
  const stripeCustomerId = stripeId(session.customer);
  const stripeSubscriptionId = stripeId(session.subscription);

  if (!userId || !stripeCustomerId || !stripeSubscriptionId) {
    return null;
  }

  return paidUpdate({
    userId,
    stripeCustomerId,
    stripeSubscriptionId,
    silverStartedAt: now,
  });
}

export function mapSubscriptionToMembershipUpdate(
  subscription: Stripe.Subscription,
  current: CurrentMembershipState = {},
): SparkleFinderBillingMembershipUpdate | null {
  const subscriptionWithPeriod = subscription as Stripe.Subscription & {
    current_period_end?: number | null;
  };
  const userId = firstPresent(subscription.metadata?.supabase_user_id);
  const stripeCustomerId = stripeId(subscription.customer);
  const stripeSubscriptionId = subscription.id;

  if (!userId || !stripeCustomerId || !stripeSubscriptionId) {
    return null;
  }

  if (isPaidSubscriptionStatus(subscription.status)) {
    return paidUpdate({
      userId,
      stripeCustomerId,
      stripeSubscriptionId,
      silverStartedAt: null,
      silverEndsAt: subscription.cancel_at_period_end
        ? stripeSecondsToIso(subscriptionWithPeriod.current_period_end)
        : null,
    });
  }

  if (isTerminalSubscriptionStatus(subscription.status)) {
    return canceledUpdate({
      userId,
      stripeCustomerId,
      stripeSubscriptionId,
      currentAccessState: current.currentAccessState,
      endedAt: stripeSecondsToIso(
        subscription.ended_at ?? subscription.canceled_at ?? subscriptionWithPeriod.current_period_end,
      ),
    });
  }

  return null;
}

export function mapInvoiceToMembershipUpdate(
  invoice: Stripe.Invoice,
  now: string = new Date().toISOString(),
): SparkleFinderBillingMembershipUpdate | null {
  if (invoice.status !== "paid") {
    return null;
  }

  const invoiceWithSubscription = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
    subscription_details?: {
      metadata?: Stripe.Metadata | null;
    } | null;
    parent?: {
      subscription_details?: {
        metadata?: Stripe.Metadata | null;
        subscription?: string | Stripe.Subscription | null;
      } | null;
    } | null;
  };
  const userId = firstPresent(
    invoice.metadata?.supabase_user_id,
    invoiceWithSubscription.parent?.subscription_details?.metadata?.supabase_user_id,
    invoiceWithSubscription.subscription_details?.metadata?.supabase_user_id,
  );
  const stripeCustomerId = stripeId(invoice.customer);
  const stripeSubscriptionId = stripeId(
    invoiceWithSubscription.parent?.subscription_details?.subscription ?? invoiceWithSubscription.subscription,
  );

  if (!userId || !stripeCustomerId || !stripeSubscriptionId) {
    return null;
  }

  return paidUpdate({
    userId,
    stripeCustomerId,
    stripeSubscriptionId,
    silverStartedAt: now,
  });
}

export async function getMembershipByStripeSubscriptionId(
  subscriptionId: string,
): Promise<CurrentMembershipState> {
  const admin = createSupabaseServiceRoleClient();

  if (!admin) {
    return {};
  }

  const { data } = await admin
    .from("sparkle_finder_memberships")
    .select("access_state")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  return {
    currentAccessState: (data?.access_state as SparkleFinderAccessState | undefined) ?? null,
  };
}

export async function applyStripeMembershipUpdate(
  update: SparkleFinderBillingMembershipUpdate,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const admin = createSupabaseServiceRoleClient();

  if (!admin) {
    return {
      ok: false,
      reason:
        "Missing or invalid SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL; refusing to update membership with an unsafe service role client.",
    };
  }

  const values: Record<string, string | null> = {
    access_state: update.accessState,
    silver_source: update.silverSource,
    silver_ends_at: update.silverEndsAt,
    stripe_customer_id: update.stripeCustomerId,
    stripe_subscription_id: update.stripeSubscriptionId,
  };

  if (update.silverStartedAt) {
    values.silver_started_at = update.silverStartedAt;
  }

  const { error } = await admin
    .from("sparkle_finder_memberships")
    .update(values)
    .eq("user_id", update.userId);

  if (error) {
    return {
      ok: false,
      reason: error.message,
    };
  }

  return { ok: true };
}

export async function applyStripeEventIdempotency(
  eventId: string,
  eventType: string,
): Promise<{ ok: true; duplicate: boolean } | { ok: false; reason: string }> {
  const admin = createSupabaseServiceRoleClient();

  if (!admin) {
    return {
      ok: false,
      reason:
        "Missing or invalid SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL; refusing to process Stripe event without an unsafe service role client.",
    };
  }

  const { error } = await admin.from("sparkle_finder_stripe_events").insert({
    stripe_event_id: eventId,
    event_type: eventType,
  });

  if (!error) {
    return { ok: true, duplicate: false };
  }

  if ("code" in error && error.code === "23505") {
    return { ok: true, duplicate: true };
  }

  return {
    ok: false,
    reason: error.message,
  };
}

export async function fetchMembershipForUser(client: {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => PromiseLike<{ data: unknown; error: unknown }>;
      };
    };
  };
}, userId: string): Promise<SupabaseMembershipRow | null> {
  const { data, error } = await client
    .from("sparkle_finder_memberships")
    .select("user_id,access_state,silver_source,stripe_customer_id,stripe_subscription_id")
    .eq("user_id", userId)
    .maybeSingle();

  return error ? null : (data as SupabaseMembershipRow | null);
}

export function isSupabaseUserEmailVerified(
  user:
    | {
        id?: string | null;
        email?: string | null;
        email_confirmed_at?: string | null;
        confirmed_at?: string | null;
        email_verified?: boolean | null;
        user_metadata?: {
          email_verified?: boolean | null;
        } | null;
      }
    | null
    | undefined,
): boolean {
  return Boolean(
    user?.email_confirmed_at?.trim() ||
      user?.confirmed_at?.trim() ||
      user?.email_verified === true ||
      user?.user_metadata?.email_verified === true,
  );
}

function paidUpdate(input: {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  silverStartedAt: string | null;
  silverEndsAt?: string | null;
}): SparkleFinderBillingMembershipUpdate {
  return {
    userId: input.userId,
    stripeCustomerId: input.stripeCustomerId,
    stripeSubscriptionId: input.stripeSubscriptionId,
    accessState: "silver_paid",
    silverSource: "stripe",
    silverStartedAt: input.silverStartedAt,
    silverEndsAt: input.silverEndsAt ?? null,
  };
}

function canceledUpdate(input: {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  currentAccessState?: SparkleFinderAccessState | null;
  endedAt: string | null;
}): SparkleFinderBillingMembershipUpdate {
  if (input.currentAccessState === "silver_rep_included") {
    return {
      userId: input.userId,
      stripeCustomerId: input.stripeCustomerId,
      stripeSubscriptionId: input.stripeSubscriptionId,
      accessState: "silver_rep_included",
      silverSource: "sparkle_suite_rep",
      silverStartedAt: null,
      silverEndsAt: null,
    };
  }

  return {
    userId: input.userId,
    stripeCustomerId: input.stripeCustomerId,
    stripeSubscriptionId: input.stripeSubscriptionId,
    accessState: "free",
    silverSource: "none",
    silverStartedAt: null,
    silverEndsAt: input.endedAt,
  };
}

function isPaidSubscriptionStatus(status: Stripe.Subscription.Status): boolean {
  return status === "active" || status === "trialing";
}

function isTerminalSubscriptionStatus(status: Stripe.Subscription.Status): boolean {
  return status === "canceled" || status === "paused" || status === "unpaid" || status === "incomplete_expired";
}

function stripeSecondsToIso(value: number | null | undefined): string | null {
  return typeof value === "number" ? new Date(value * 1000).toISOString() : null;
}

function stripeId(value: string | { id?: string | null } | null | undefined): string | null {
  if (typeof value === "string") {
    return value;
  }

  return value?.id ?? null;
}

function firstPresent(...values: Array<string | null | undefined>): string | null {
  return values.find((value) => value?.trim())?.trim() ?? null;
}

function createSupabaseServiceRoleClient() {
  const supabaseUrl = getAllowedSparkleFinderSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
