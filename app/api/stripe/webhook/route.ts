/**
 * Stripe webhook — updates the profiles table in response to subscription
 * lifecycle events. This route is public (Stripe has no Supabase session)
 * and must stay out of the auth middleware's protected list.
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS — the webhook is the only
 * path that updates another user's tier/subscription fields.
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !webhookSecret) {
    console.error("[stripe:webhook] STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });

  const stripe = new Stripe(secret);
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "signature verification failed";
    console.error("[stripe:webhook] signature verify FAILED:", msg);
    return NextResponse.json({ error: `Webhook error: ${msg}` }, { status: 400 });
  }

  const supabase = getServiceClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id ?? (session.metadata?.supabase_user_id ?? null);
        if (!userId) {
          console.warn("[stripe:webhook] checkout.session.completed missing supabase user id");
          break;
        }
        const update = {
          tier: "pro" as const,
          stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
          stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : null,
          subscription_status: "active" as const,
        };
        const { error } = await supabase.from("profiles").update(update).eq("id", userId);
        if (error) console.error("[stripe:webhook] profile upgrade failed:", error.message);
        else console.log(`[stripe:webhook] ${userId} upgraded to pro`);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id ?? null;
        if (!userId) {
          console.warn("[stripe:webhook] subscription.updated missing supabase user id");
          break;
        }
        const { error } = await supabase
          .from("profiles")
          .update({ subscription_status: sub.status })
          .eq("id", userId);
        if (error) console.error("[stripe:webhook] subscription status update failed:", error.message);
        else console.log(`[stripe:webhook] ${userId} status → ${sub.status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id ?? null;
        if (!userId) {
          console.warn("[stripe:webhook] subscription.deleted missing supabase user id");
          break;
        }
        const { error } = await supabase
          .from("profiles")
          .update({ tier: "free", subscription_status: "canceled" })
          .eq("id", userId);
        if (error) console.error("[stripe:webhook] subscription cancel update failed:", error.message);
        else console.log(`[stripe:webhook] ${userId} downgraded to free`);
        break;
      }

      default:
        // Ignore any events we didn't subscribe to handling.
        break;
    }
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error("[stripe:webhook] handler threw:", e.message);
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
