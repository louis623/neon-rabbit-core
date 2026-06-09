import Stripe from "stripe";
import type { Mock } from "vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
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
      NEXT_PUBLIC_SITE_URL: "https://yoursparklefinder.com",
      NEXT_PUBLIC_SUPABASE_URL: "https://supabase.example",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    });

    expect(env).toEqual({
      isConfigured: true,
      missing: [],
      stripeSecretKey: "sk_test_123",
      stripeWebhookSecret: "whsec_123",
      silverPriceId: "price_silver",
      siteUrl: "https://yoursparklefinder.com",
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
      NEXT_PUBLIC_SITE_URL: "https://yoursparklefinder.com",
      NEXT_PUBLIC_SUPABASE_URL: "https://supabase.example",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    };

    expect(isSparkleFinderCheckoutConfigured(completeEnv)).toBe(true);
    expect(isSparkleFinderCheckoutConfigured({ ...completeEnv, STRIPE_WEBHOOK_SECRET: "" })).toBe(false);
    expect(isSparkleFinderCheckoutConfigured({ ...completeEnv, NEXT_PUBLIC_SITE_URL: "https://neon-rabbit-hq.vercel.app" })).toBe(false);
    expect(isSparkleFinderCheckoutConfigured({ ...completeEnv, NEXT_PUBLIC_SUPABASE_URL: "https://bqhzfkgkjyuhlsozpylf.supabase.co" })).toBe(false);
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

  it.each(["paused", "unpaid", "incomplete_expired"] as const)(
    "maps %s subscriptions to Free unless rep-included Silver applies",
    (status) => {
      const update = mapSubscriptionToMembershipUpdate(
        subscription({
          customer: "cus_123",
          id: "sub_123",
          metadata: { supabase_user_id: "user-123" },
          status,
          current_period_end: seconds("2026-07-15T00:00:00.000Z"),
        }),
        { currentAccessState: "silver_paid" },
      );

      expect(update).toMatchObject({
        userId: "user-123",
        accessState: "free",
        silverSource: "none",
        silverEndsAt: "2026-07-15T00:00:00.000Z",
      });
    },
  );

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

describe("Sparkle Finder billing routes", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("@/lib/supabase/server");
    vi.doUnmock("@/lib/sparkle-finder/billing");
    vi.unstubAllEnvs();
  });

  it("redirects unverified signed-in checkout users without creating Stripe records", async () => {
    const customersCreate = vi.fn();
    const checkoutSessionsCreate = vi.fn();

    stubBillingEnv();
    mockSupabaseServerClient({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123", email: "casey@example.com" } },
          error: null,
        }),
      },
      from: vi.fn(),
    });
    mockBillingModule({
      createStripeClient: vi.fn(() => stripeRouteClient({ customersCreate, checkoutSessionsCreate })),
    });

    const { POST } = await import("../../app/billing/checkout/route");
    const response = await POST();

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://yoursparklefinder.com/account?error=email_verification_required",
    );
    expect(customersCreate).not.toHaveBeenCalled();
    expect(checkoutSessionsCreate).not.toHaveBeenCalled();
  });

  it("creates a subscription checkout session for verified signed-in users", async () => {
    const customersCreate = vi.fn().mockResolvedValue({ id: "cus_created" });
    const checkoutSessionsCreate = vi.fn().mockResolvedValue({ url: "https://checkout.stripe.test/session" });

    stubBillingEnv();
    mockSupabaseServerClient({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-123",
              email: "casey@example.com",
              email_confirmed_at: "2026-06-01T12:00:00.000Z",
            },
          },
          error: null,
        }),
      },
      from: membershipTableClient(null),
    });
    mockBillingModule({
      createStripeClient: vi.fn(() => stripeRouteClient({ customersCreate, checkoutSessionsCreate })),
    });

    const { POST } = await import("../../app/billing/checkout/route");
    const response = await POST();

    expect(customersCreate).toHaveBeenCalledWith({
      email: "casey@example.com",
      metadata: {
        supabase_user_id: "user-123",
      },
    });
    expect(checkoutSessionsCreate).toHaveBeenCalledWith({
      mode: "subscription",
      customer: "cus_created",
      client_reference_id: "user-123",
      line_items: [
        {
          price: "price_silver",
          quantity: 1,
        },
      ],
      metadata: {
        supabase_user_id: "user-123",
      },
      subscription_data: {
        metadata: {
          supabase_user_id: "user-123",
        },
      },
      success_url: "https://yoursparklefinder.com/account?message=silver_checkout_started",
      cancel_url: "https://yoursparklefinder.com/account?message=silver_checkout_canceled",
    });
    expect(checkoutSessionsCreate.mock.calls[0][0].subscription_data).not.toHaveProperty("trial_period_days");
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://checkout.stripe.test/session");
  });

  it("reuses an existing Stripe customer for checkout", async () => {
    const customersCreate = vi.fn();
    const checkoutSessionsCreate = vi.fn().mockResolvedValue({ url: "https://checkout.stripe.test/session" });

    stubBillingEnv();
    mockSupabaseServerClient({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-123",
              email: "casey@example.com",
              email_confirmed_at: "2026-06-01T12:00:00.000Z",
            },
          },
          error: null,
        }),
      },
      from: membershipTableClient({ stripe_customer_id: "cus_existing", access_state: "free" }),
    });
    mockBillingModule({
      createStripeClient: vi.fn(() => stripeRouteClient({ customersCreate, checkoutSessionsCreate })),
    });

    const { POST } = await import("../../app/billing/checkout/route");
    const response = await POST();

    expect(customersCreate).not.toHaveBeenCalled();
    expect(checkoutSessionsCreate.mock.calls[0][0].customer).toBe("cus_existing");
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://checkout.stripe.test/session");
  });

  it("does not create another checkout session for already-paid Silver users", async () => {
    const customersCreate = vi.fn();
    const checkoutSessionsCreate = vi.fn();

    stubBillingEnv();
    mockSupabaseServerClient({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-123",
              email: "casey@example.com",
              email_confirmed_at: "2026-06-01T12:00:00.000Z",
            },
          },
          error: null,
        }),
      },
      from: membershipTableClient({
        stripe_customer_id: "cus_existing",
        stripe_subscription_id: "sub_existing",
        access_state: "silver_paid",
      }),
    });
    mockBillingModule({
      createStripeClient: vi.fn(() => stripeRouteClient({ customersCreate, checkoutSessionsCreate })),
    });

    const { POST } = await import("../../app/billing/checkout/route");
    const response = await POST();

    expect(customersCreate).not.toHaveBeenCalled();
    expect(checkoutSessionsCreate).not.toHaveBeenCalled();
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://yoursparklefinder.com/account?message=silver_already_active");
  });

  it("requires an existing Stripe customer before opening the billing portal", async () => {
    const portalSessionsCreate = vi.fn();

    stubBillingEnv();
    mockSupabaseServerClient({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
      from: membershipTableClient({ stripe_customer_id: null }),
    });
    mockBillingModule({
      createStripeClient: vi.fn(() => stripeRouteClient({ portalSessionsCreate })),
    });

    const { POST } = await import("../../app/billing/portal/route");
    const response = await POST();

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://yoursparklefinder.com/account?error=missing_stripe_customer");
    expect(portalSessionsCreate).not.toHaveBeenCalled();
  });

  it("creates a hosted billing portal session for users with a Stripe customer", async () => {
    const portalSessionsCreate = vi.fn().mockResolvedValue({ url: "https://billing.stripe.test/session" });

    stubBillingEnv();
    mockSupabaseServerClient({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
          error: null,
        }),
      },
      from: membershipTableClient({ stripe_customer_id: "cus_123" }),
    });
    mockBillingModule({
      createStripeClient: vi.fn(() => stripeRouteClient({ portalSessionsCreate })),
    });

    const { POST } = await import("../../app/billing/portal/route");
    const response = await POST();

    expect(portalSessionsCreate).toHaveBeenCalledWith({
      customer: "cus_123",
      return_url: "https://yoursparklefinder.com/account",
    });
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://billing.stripe.test/session");
  });

  it("rejects webhook requests without a Stripe signature before reading the body", async () => {
    const constructEvent = vi.fn();
    const request = new Request("https://yoursparklefinder.com/api/stripe/webhook", {
      method: "POST",
      body: "raw=stripe",
    });

    stubBillingEnv();
    mockBillingModule({
      createStripeClient: vi.fn(() => stripeRouteClient({ constructEvent })),
    });

    const text = vi.spyOn(request, "text");
    const { POST } = await import("../../app/api/stripe/webhook/route");
    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Missing Stripe signature." });
    expect(text).not.toHaveBeenCalled();
    expect(constructEvent).not.toHaveBeenCalled();
  });

  it("constructs webhook events from raw text and rejects invalid signatures", async () => {
    const constructEvent = vi.fn(() => {
      throw new Error("invalid signature");
    });
    const request = new Request("https://yoursparklefinder.com/api/stripe/webhook", {
      method: "POST",
      body: "raw=stripe",
      headers: {
        "stripe-signature": "t=123,v1=bad",
      },
    });

    stubBillingEnv();
    mockBillingModule({
      createStripeClient: vi.fn(() => stripeRouteClient({ constructEvent })),
    });

    const { POST } = await import("../../app/api/stripe/webhook/route");
    const response = await POST(request);

    expect(constructEvent).toHaveBeenCalledWith("raw=stripe", "t=123,v1=bad", "whsec_123");
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid Stripe signature." });
  });

  it("applies a membership update for valid checkout completion webhooks", async () => {
    const applyStripeMembershipUpdate = vi.fn().mockResolvedValue({ ok: true });
    const applyStripeEventIdempotency = vi.fn().mockResolvedValue({ ok: true, duplicate: false });
    const constructEvent = vi.fn().mockReturnValue({
      id: "evt_123",
      object: "event",
      type: "checkout.session.completed",
      data: {
        object: checkoutSession({
          client_reference_id: "user-123",
          customer: "cus_123",
          subscription: "sub_123",
        }),
      },
    });

    stubBillingEnv();
    mockBillingModule({
      createStripeClient: vi.fn(() => stripeRouteClient({ constructEvent })),
      applyStripeMembershipUpdate,
      applyStripeEventIdempotency,
    });

    const { POST } = await import("../../app/api/stripe/webhook/route");
    const response = await POST(
      new Request("https://yoursparklefinder.com/api/stripe/webhook", {
        method: "POST",
        body: "raw=stripe",
        headers: {
          "stripe-signature": "t=123,v1=good",
        },
      }),
    );

    expect(constructEvent).toHaveBeenCalledWith("raw=stripe", "t=123,v1=good", "whsec_123");
    expect(applyStripeEventIdempotency).toHaveBeenCalledWith("evt_123", "checkout.session.completed");
    expect(applyStripeMembershipUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-123",
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        accessState: "silver_paid",
        silverSource: "stripe",
      }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });
  });

  it("does not apply duplicate Stripe webhook events twice", async () => {
    const applyStripeMembershipUpdate = vi.fn();
    const applyStripeEventIdempotency = vi.fn().mockResolvedValue({ ok: true, duplicate: true });
    const constructEvent = vi.fn().mockReturnValue({
      id: "evt_duplicate",
      object: "event",
      type: "checkout.session.completed",
      data: {
        object: checkoutSession({
          client_reference_id: "user-123",
          customer: "cus_123",
          subscription: "sub_123",
        }),
      },
    });

    stubBillingEnv();
    mockBillingModule({
      createStripeClient: vi.fn(() => stripeRouteClient({ constructEvent })),
      applyStripeMembershipUpdate,
      applyStripeEventIdempotency,
    });

    const { POST } = await import("../../app/api/stripe/webhook/route");
    const response = await POST(
      new Request("https://yoursparklefinder.com/api/stripe/webhook", {
        method: "POST",
        body: "raw=stripe",
        headers: {
          "stripe-signature": "t=123,v1=good",
        },
      }),
    );

    expect(applyStripeEventIdempotency).toHaveBeenCalledWith("evt_duplicate", "checkout.session.completed");
    expect(applyStripeMembershipUpdate).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true, duplicate: true });
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

function stubBillingEnv() {
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_123");
  vi.stubEnv("STRIPE_SILVER_PRICE_ID", "price_silver");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://yoursparklefinder.com");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.example");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
}

function mockSupabaseServerClient(client: unknown) {
  vi.doMock("@/lib/supabase/server", () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }));
}

function mockBillingModule(overrides: Record<string, unknown>) {
  vi.doMock("@/lib/sparkle-finder/billing", async (importOriginal) => ({
    ...((await importOriginal()) as Record<string, unknown>),
    ...overrides,
  }));
}

function membershipTableClient(row: Record<string, unknown> | null) {
  return vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }),
      })),
    })),
  }));
}

function stripeRouteClient({
  customersCreate = vi.fn(),
  checkoutSessionsCreate = vi.fn(),
  portalSessionsCreate = vi.fn(),
  constructEvent = vi.fn(),
}: {
  customersCreate?: Mock;
  checkoutSessionsCreate?: Mock;
  portalSessionsCreate?: Mock;
  constructEvent?: Mock;
}) {
  return {
    customers: {
      create: customersCreate,
    },
    checkout: {
      sessions: {
        create: checkoutSessionsCreate,
      },
    },
    billingPortal: {
      sessions: {
        create: portalSessionsCreate,
      },
    },
    webhooks: {
      constructEvent,
    },
  } as unknown as Stripe;
}
