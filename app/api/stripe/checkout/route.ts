/**
 * Stripe checkout session creator. Requires an authenticated Supabase user.
 * Returns: { url } — the Stripe-hosted checkout URL
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const SUCCESS_URL = "https://rawintelsports.com/dashboard?upgraded=true";
const CANCEL_URL = "https://rawintelsports.com/pricing";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Upfront env check with presence logging (never log the actual values).
  const secret = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
  console.log(
    `[stripe:checkout] env: STRIPE_SECRET_KEY=${!!secret}, ` +
    `STRIPE_PRO_MONTHLY_PRICE_ID=${!!priceId}, user=${user.id}`
  );

  const missing: string[] = [];
  if (!secret) missing.push("STRIPE_SECRET_KEY");
  if (!priceId) missing.push("STRIPE_PRO_MONTHLY_PRICE_ID");
  if (missing.length > 0) {
    const msg = `Missing Stripe environment variables: ${missing.join(", ")}`;
    console.error(`[stripe:checkout] ${msg}`);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const stripe = new Stripe(secret!);

  // Look up the profile so we can reuse any existing Stripe customer ID.
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      customer: profile?.stripe_customer_id ?? undefined,
      // When no existing customer, prefill email so Stripe creates one for us.
      customer_email: profile?.stripe_customer_id ? undefined : (profile?.email ?? user.email ?? undefined),
      // Stitch the Supabase user ID onto the session + subscription so the
      // webhook can map back without relying on email alone.
      client_reference_id: user.id,
      metadata: { supabase_user_id: user.id },
      subscription_data: { metadata: { supabase_user_id: user.id } },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    // If Stripe gave a structured error (invalid price ID, missing product,
    // etc.), surface its message so the client isn't stuck with a blank 500.
    const stripeErr = err as { type?: string; code?: string; message?: string };
    console.error(
      `[stripe:checkout] FAILED: type=${stripeErr.type ?? "unknown"}, ` +
      `code=${stripeErr.code ?? "unknown"}, message=${e.message}`
    );
    return NextResponse.json(
      { error: `Checkout failed: ${e.message}` },
      { status: 500 }
    );
  }
}
