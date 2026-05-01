/**
 * Stripe subscription cancellation. Requires an authenticated Supabase user.
 * Sets cancel_at_period_end: true — does NOT immediately cancel. The webhook
 * handles the tier downgrade when the period actually ends.
 */

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    console.error("[stripe:cancel] STRIPE_SECRET_KEY not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  // Fetch the user's subscription ID from their profile
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("stripe_subscription_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileErr) {
    console.error("[stripe:cancel] profile lookup failed:", profileErr.message);
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
  }

  const subscriptionId = profile?.stripe_subscription_id;
  if (!subscriptionId) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
  }

  const stripe = new Stripe(secret);

  try {
    const updated = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    console.log(`[stripe:cancel] scheduled cancellation for user=${user.id} sub=${subscriptionId} cancel_at_period_end=${updated.cancel_at_period_end}`);
    return NextResponse.json({ subscription: updated });
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error("[stripe:cancel] FAILED:", e.message);
    return NextResponse.json({ error: `Cancellation failed: ${e.message}` }, { status: 500 });
  }
}
