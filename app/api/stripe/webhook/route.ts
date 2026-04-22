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
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

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

  const supabase = createServiceClient();

  // Every webhook event gets one summary log so we can trace what arrived.
  console.log(`[stripe:webhook] received event type=${event.type} id=${event.id}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id ?? session.metadata?.supabase_user_id ?? null;
        const email = session.customer_email ?? session.customer_details?.email ?? null;

        console.log(
          `[stripe:webhook] checkout.session.completed: ` +
          `session_id=${session.id} ` +
          `client_reference_id=${session.client_reference_id ?? "null"} ` +
          `metadata.supabase_user_id=${session.metadata?.supabase_user_id ?? "null"} ` +
          `customer=${typeof session.customer === "string" ? session.customer : "null"} ` +
          `subscription=${typeof session.subscription === "string" ? session.subscription : "null"} ` +
          `email=${email ?? "null"}`
        );

        const update = {
          tier: "pro" as const,
          stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
          stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : null,
          subscription_status: "active" as const,
        };

        // Try update by ID first (preferred — came from our own metadata).
        if (userId) {
          const { data, error } = await supabase
            .from("profiles")
            .update(update)
            .eq("id", userId)
            .select("id, tier, email");
          if (error) {
            console.error("[stripe:webhook] profile upgrade by id failed:", error.message);
          } else if (!data || data.length === 0) {
            console.warn(
              `[stripe:webhook] UPDATE by id=${userId} matched 0 rows. ` +
              `Either the profile row doesn't exist (handle_new_user trigger didn't fire?) ` +
              `or the user_id from Stripe doesn't match any profile.`
            );
          } else {
            console.log(`[stripe:webhook] ${userId} upgraded to pro (${data.length} row updated)`);
            break;
          }
        } else {
          console.warn("[stripe:webhook] checkout.session.completed has neither client_reference_id nor metadata.supabase_user_id");
        }

        // Fallback: try to find the profile by email. Only useful as a recovery
        // path for sessions that somehow lost the metadata.
        if (email) {
          const { data, error } = await supabase
            .from("profiles")
            .update(update)
            .eq("email", email)
            .select("id, tier, email");
          if (error) {
            console.error("[stripe:webhook] profile upgrade by email failed:", error.message);
          } else if (!data || data.length === 0) {
            console.error(`[stripe:webhook] UPDATE by email=${email} also matched 0 rows — user is not upgraded`);
          } else {
            console.log(`[stripe:webhook] recovered by email: ${email} → upgraded to pro (${data.length} row updated)`);
          }
        } else {
          console.error("[stripe:webhook] no user_id AND no email available — cannot upgrade anyone");
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id ?? null;
        const customer = typeof sub.customer === "string" ? sub.customer : null;

        console.log(
          `[stripe:webhook] subscription.updated: ` +
          `sub_id=${sub.id} status=${sub.status} ` +
          `metadata.supabase_user_id=${userId ?? "null"} customer=${customer ?? "null"}`
        );

        if (!userId && !customer) {
          console.warn("[stripe:webhook] subscription.updated has no user_id or customer to match");
          break;
        }

        const base = supabase.from("profiles").update({ subscription_status: sub.status });
        const { data, error } = await (userId
          ? base.eq("id", userId).select("id, subscription_status")
          : base.eq("stripe_customer_id", customer!).select("id, subscription_status"));

        if (error) console.error("[stripe:webhook] subscription status update failed:", error.message);
        else if (!data || data.length === 0) console.warn(`[stripe:webhook] subscription.updated matched 0 rows`);
        else console.log(`[stripe:webhook] ${data[0].id} status → ${sub.status} (${data.length} row updated)`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id ?? null;
        const customer = typeof sub.customer === "string" ? sub.customer : null;

        console.log(
          `[stripe:webhook] subscription.deleted: ` +
          `sub_id=${sub.id} metadata.supabase_user_id=${userId ?? "null"} customer=${customer ?? "null"}`
        );

        if (!userId && !customer) {
          console.warn("[stripe:webhook] subscription.deleted has no user_id or customer to match");
          break;
        }

        const base = supabase.from("profiles").update({ tier: "free", subscription_status: "canceled" });
        const { data, error } = await (userId
          ? base.eq("id", userId).select("id, tier")
          : base.eq("stripe_customer_id", customer!).select("id, tier"));

        if (error) console.error("[stripe:webhook] subscription cancel update failed:", error.message);
        else if (!data || data.length === 0) console.warn(`[stripe:webhook] subscription.deleted matched 0 rows`);
        else console.log(`[stripe:webhook] ${data[0].id} downgraded to free (${data.length} row updated)`);
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
