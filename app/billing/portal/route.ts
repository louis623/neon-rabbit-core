import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSparkleFinderSiteOrigin } from "@/lib/sparkle-finder/oauth-redirect";
import {
  createStripeClient,
  fetchMembershipForUser,
  getSparkleFinderBillingEnv,
  isSparkleFinderPaidBillingEnabled,
} from "@/lib/sparkle-finder/billing";

type SparkleFinderPortalClient = {
  auth: {
    getUser: () => Promise<{
      data: { user: { id: string } | null };
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
  if (!isSparkleFinderPaidBillingEnabled()) {
    return redirectToAccount("paid_billing_disabled");
  }

  const billingEnv = getSparkleFinderBillingEnv();

  if (!billingEnv.isConfigured) {
    return redirectToAccount("billing_not_configured");
  }

  let supabase: SparkleFinderPortalClient;

  try {
    supabase = (await createClient() as unknown) as SparkleFinderPortalClient;
  } catch {
    return redirectToAccount("account_unavailable", billingEnv.siteUrl);
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.redirect(new URL("/auth/sign-in?next=/account", billingEnv.siteUrl), 303);
  }

  const membership = await fetchMembershipForUser(supabase, data.user.id);

  if (!membership?.stripe_customer_id) {
    return redirectToAccount("missing_stripe_customer", billingEnv.siteUrl);
  }

  const stripe = createStripeClient(billingEnv.stripeSecretKey);
  const session = await stripe.billingPortal.sessions.create({
    customer: membership.stripe_customer_id,
    return_url: `${billingEnv.siteUrl}/account`,
  });

  return NextResponse.redirect(session.url, 303);
}

function redirectToAccount(error: string, siteUrl = getSparkleFinderSiteOrigin()) {
  const url = new URL("/account", siteUrl);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url, 303);
}
