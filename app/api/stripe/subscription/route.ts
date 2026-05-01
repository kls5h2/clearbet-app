import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("stripe_subscription_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileErr) {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }

  const subscriptionId = profile?.stripe_subscription_id;
  if (!subscriptionId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 404 });
  }

  const stripe = new Stripe(secret);
  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    return NextResponse.json({
      currentPeriodEnd: (sub as unknown as { current_period_end: number }).current_period_end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    });
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error("[stripe:subscription] retrieve failed:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
