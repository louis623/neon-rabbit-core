import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSparkleFinderSiteOrigin } from "@/lib/sparkle-finder/oauth-redirect";
import {
  createStripeClient,
  fetchMembershipForUser,
  getSparkleFinderBillingEnv,
  isSupabaseUserEmailVerified,
} from "@/lib/sparkle-finder/billing";

type SparkleFinderCheckoutClient = {
  auth: {
    getUser: () => Promise<{
      data: {
        user: {
          id: string;
          email?: string | null;
          email_confirmed_at?: string | null;
          confirmed_at?: string | null;
          email_verified?: boolean | null;
          user_metadata?: {
            email_verified?: boolean | null;
          } | null;
        } | null;
      };
      error: unknown;
    }>;
  };
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => PromiseLike<{ data: null; error: unknown }>;
      };
    };
  };
};

export async function POST() {
  const billingEnv = getSparkleFinderBillingEnv();

  if (!billingEnv.isConfigured) {
    return redirectToAccount("billing_not_configured");
  }

  let supabase: SparkleFinderCheckoutClient;

  try {
    supabase = (await createClient() as unknown) as SparkleFinderCheckoutClient;
  } catch {
    return redirectToAccount("account_unavailable");
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.redirect(new URL("/auth/sign-in?next=/account", billingEnv.siteUrl), 303);
  }

  if (!isSupabaseUserEmailVerified(data.user)) {
    return redirectToAccount("email_verification_required", billingEnv.siteUrl);
  }

  const membership = await fetchMembershipForUser(supabase, data.user.id);

  if (membership?.access_state === "silver_paid") {
    const accountUrl = new URL("/account", billingEnv.siteUrl);
    accountUrl.searchParams.set("message", "silver_already_active");
    return NextResponse.redirect(accountUrl, 303);
  }

  const stripe = createStripeClient(billingEnv.stripeSecretKey);
  const customer =
    membership?.stripe_customer_id ??
    (
      await stripe.customers.create({
        email: data.user.email ?? undefined,
        metadata: {
          supabase_user_id: data.user.id,
        },
      })
    ).id;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: data.user.id,
    line_items: [
      {
        price: billingEnv.silverPriceId,
        quantity: 1,
      },
    ],
    metadata: {
      supabase_user_id: data.user.id,
    },
    subscription_data: {
      metadata: {
        supabase_user_id: data.user.id,
      },
    },
    success_url: `${billingEnv.siteUrl}/account?message=silver_checkout_started`,
    cancel_url: `${billingEnv.siteUrl}/account?message=silver_checkout_canceled`,
  });

  if (!session.url) {
    return redirectToAccount("checkout_session_failed", billingEnv.siteUrl);
  }

  return NextResponse.redirect(session.url, 303);
}

function redirectToAccount(error: string, siteUrl = getSparkleFinderSiteOrigin()) {
  const url = new URL("/account", siteUrl);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url, 303);
}
