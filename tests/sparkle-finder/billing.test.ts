import Stripe from "stripe";
import { describe, expect, it } from "vitest";
import {
  getSparkleFinderBillingEnv,
  isSparkleFinderCheckoutConfigured,
  isSupabaseUserEmailVerified,
  mapCheckoutSessionCompletedToMembershipUpdate,
  mapInvoiceToMembershipUpdate,
  mapSubscriptionToMembershipUpdate,
} from "../../lib/sparkle-finder/billing";

describe("Sparkle Finder Stripe billing", () => {
  it("requires the server and public env vars needed for Silver billing", () => {
    const env = getSparkleFinderBillingEnv({
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_WEBHOOK_SECRET: "whsec_123",
      STRIPE_SILVER_PRICE_ID: "price_silver",
      NEXT_PUBLIC_SITE_URL: "https://sparkle.example",
      NEXT_PUBLIC_SUPABASE_URL: "https://supabase.example",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    });

    expect(env).toEqual({
      isConfigured: true,
      missing: [],
      stripeSecretKey: "sk_test_123",
      stripeWebhookSecret: "whsec_123",
      silverPriceId: "price_silver",
      siteUrl: "https://sparkle.example",
      supabaseUrl: "https://supabase.example",
      supabaseServiceRoleKey: "service-role-key",
    });
  });

  it("reports missing billing env vars without exposing secrets", () => {
    const env = getSparkleFinderBillingEnv({
      STRIPE_SECRET_KEY: "",
      STRIPE_WEBHOOK_SECRET: "whsec_123",
      STRIPE_SILVER_PRICE_ID: "",
      NEXT_PUBLIC_SITE_URL: "",
      NEXT_PUBLIC_SUPABASE_URL: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
    });

    expect(env.isConfigured).toBe(false);
    expect(env.missing).toEqual([
      "STRIPE_SECRET_KEY",
      "STRIPE_SILVER_PRICE_ID",
      "NEXT_PUBLIC_SITE_URL",
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ]);
    expect("stripeSecretKey" in env).toBe(false);
  });

  it("only enables paid checkout when checkout, webhook, and Supabase write prerequisites are present", () => {
    const completeEnv = {
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_WEBHOOK_SECRET: "whsec_123",
      STRIPE_SILVER_PRICE_ID: "price_silver",
      NEXT_PUBLIC_SITE_URL: "https://sparkle.example",
      NEXT_PUBLIC_SUPABASE_URL: "https://supabase.example",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    };

    expect(isSparkleFinderCheckoutConfigured(completeEnv)).toBe(true);
    expect(isSparkleFinderCheckoutConfigured({ ...completeEnv, STRIPE_WEBHOOK_SECRET: "" })).toBe(false);
    expect(isSparkleFinderCheckoutConfigured({ ...completeEnv, NEXT_PUBLIC_SUPABASE_URL: "" })).toBe(false);
    expect(isSparkleFinderCheckoutConfigured({ ...completeEnv, SUPABASE_SERVICE_ROLE_KEY: "" })).toBe(false);
  });

  it("maps completed checkout sessions to paid Silver membership updates", () => {
    const update = mapCheckoutSessionCompletedToMembershipUpdate(
      checkoutSession({
        client_reference_id: "user-123",
        customer: "cus_123",
        subscription: "sub_123",
      }),
      "2026-06-01T12:00:00.000Z",
    );

    expect(update).toEqual({
      userId: "user-123",
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_123",
      accessState: "silver_paid",
      silverSource: "stripe",
      silverStartedAt: "2026-06-01T12:00:00.000Z",
      silverEndsAt: null,
    });
  });

  it("maps active subscriptions to paid Silver and uses the period end when cancellation is scheduled", () => {
    const update = mapSubscriptionToMembershipUpdate(
      subscription({
        customer: "cus_123",
        id: "sub_123",
        metadata: { supabase_user_id: "user-123" },
        status: "active",
        cancel_at_period_end: true,
        current_period_end: seconds("2026-07-15T00:00:00.000Z"),
      }),
      { currentAccessState: "silver_paid" },
    );

    expect(update).toMatchObject({
      userId: "user-123",
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_123",
      accessState: "silver_paid",
      silverSource: "stripe",
      silverEndsAt: "2026-07-15T00:00:00.000Z",
    });
  });

  it("downgrades canceled paid subscriptions to Free after the subscription end", () => {
    const update = mapSubscriptionToMembershipUpdate(
      subscription({
        customer: "cus_123",
        id: "sub_123",
        metadata: { supabase_user_id: "user-123" },
        status: "canceled",
        ended_at: seconds("2026-06-01T00:00:00.000Z"),
      }),
      { currentAccessState: "silver_paid" },
    );

    expect(update).toMatchObject({
      userId: "user-123",
      accessState: "free",
      silverSource: "none",
      silverEndsAt: "2026-06-01T00:00:00.000Z",
    });
  });

  it("preserves rep-included Silver when a Stripe subscription is canceled", () => {
    const update = mapSubscriptionToMembershipUpdate(
      subscription({
        customer: "cus_123",
        id: "sub_123",
        metadata: { supabase_user_id: "user-123" },
        status: "canceled",
        ended_at: seconds("2026-06-01T00:00:00.000Z"),
      }),
      { currentAccessState: "silver_rep_included" },
    );

    expect(update).toMatchObject({
      userId: "user-123",
      accessState: "silver_rep_included",
      silverSource: "sparkle_suite_rep",
      silverEndsAt: null,
    });
  });

  it("maps paid invoices with subscription metadata to paid Silver", () => {
    const update = mapInvoiceToMembershipUpdate(
      invoice({
        customer: "cus_123",
        subscription: "sub_123",
        status: "paid",
        subscription_details: {
          metadata: { supabase_user_id: "user-123" },
        },
      }),
      "2026-06-01T12:00:00.000Z",
    );

    expect(update).toMatchObject({
      userId: "user-123",
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_123",
      accessState: "silver_paid",
      silverSource: "stripe",
      silverStartedAt: "2026-06-01T12:00:00.000Z",
      silverEndsAt: null,
    });
  });

  it("maps paid invoices using the current parent subscription details shape", () => {
    const update = mapInvoiceToMembershipUpdate(
      invoice({
        customer: "cus_123",
        status: "paid",
        parent: {
          subscription_details: {
            metadata: { supabase_user_id: "user-123" },
            subscription: "sub_123",
          },
        },
      }),
      "2026-06-01T12:00:00.000Z",
    );

    expect(update).toMatchObject({
      userId: "user-123",
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_123",
      accessState: "silver_paid",
      silverSource: "stripe",
      silverStartedAt: "2026-06-01T12:00:00.000Z",
      silverEndsAt: null,
    });
  });

  it("requires a verified Supabase user before starting paid checkout", () => {
    expect(isSupabaseUserEmailVerified({ id: "user-123", email_confirmed_at: "2026-06-01T12:00:00.000Z" })).toBe(true);
    expect(isSupabaseUserEmailVerified({ id: "user-123", confirmed_at: "2026-06-01T12:00:00.000Z" })).toBe(true);
    expect(isSupabaseUserEmailVerified({ id: "user-123", email: "casey@example.com" })).toBe(false);
    expect(isSupabaseUserEmailVerified(null)).toBe(false);
  });

  it("does not downgrade on failed invoices because Stripe Billing may recover payment", () => {
    expect(
      mapInvoiceToMembershipUpdate(
        invoice({
          customer: "cus_123",
          subscription: "sub_123",
          status: "open",
          subscription_details: {
            metadata: { supabase_user_id: "user-123" },
          },
        }),
        "2026-06-01T12:00:00.000Z",
      ),
    ).toBeNull();
  });
});

function checkoutSession(overrides: Partial<Stripe.Checkout.Session>): Stripe.Checkout.Session {
  return {
    id: "cs_test_123",
    object: "checkout.session",
    mode: "subscription",
    metadata: {},
    ...overrides,
  } as Stripe.Checkout.Session;
}

function subscription(overrides: Record<string, unknown>): Stripe.Subscription {
  return {
    id: "sub_123",
    object: "subscription",
    status: "active",
    metadata: {},
    cancel_at_period_end: false,
    ...overrides,
  } as Stripe.Subscription;
}

function invoice(overrides: Record<string, unknown>): Stripe.Invoice {
  return {
    id: "in_123",
    object: "invoice",
    status: "paid",
    metadata: {},
    ...overrides,
  } as Stripe.Invoice;
}

function seconds(value: string): number {
  return Math.floor(new Date(value).getTime() / 1000);
}
