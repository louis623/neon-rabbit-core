import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  applyStripeEventIdempotency,
  applyStripeMembershipUpdate,
  createStripeClient,
  getMembershipByStripeSubscriptionId,
  getSparkleFinderBillingEnv,
  mapCheckoutSessionCompletedToMembershipUpdate,
  mapInvoiceToMembershipUpdate,
  mapSubscriptionToMembershipUpdate,
} from "@/lib/sparkle-finder/billing";

export async function POST(request: Request) {
  const billingEnv = getSparkleFinderBillingEnv();

  if (!billingEnv.isConfigured) {
    return NextResponse.json(
      { error: "Stripe billing is not configured.", missing: billingEnv.missing },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const stripe = createStripeClient(billingEnv.stripeSecretKey);
  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, billingEnv.stripeWebhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  const idempotencyResult = await applyStripeEventIdempotency(event.id, event.type);

  if (!idempotencyResult.ok) {
    return NextResponse.json({ error: idempotencyResult.reason }, { status: 500 });
  }

  if (idempotencyResult.duplicate) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const update = await mapStripeEventToMembershipUpdate(event);

  if (!update) {
    return NextResponse.json({ received: true });
  }

  const result = await applyStripeMembershipUpdate(update);

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function mapStripeEventToMembershipUpdate(event: Stripe.Event) {
  if (event.type === "checkout.session.completed") {
    return mapCheckoutSessionCompletedToMembershipUpdate(event.data.object as Stripe.Checkout.Session);
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted" ||
    event.type === "customer.subscription.paused" ||
    event.type === "customer.subscription.resumed"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const current = await getMembershipByStripeSubscriptionId(subscription.id);

    return mapSubscriptionToMembershipUpdate(subscription, current);
  }

  if (event.type === "invoice.paid" || event.type === "invoice.payment_succeeded") {
    return mapInvoiceToMembershipUpdate(event.data.object as Stripe.Invoice);
  }

  if (event.type === "invoice.payment_failed") {
    return null;
  }

  return null;
}
