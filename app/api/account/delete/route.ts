/**
 * Account deletion. Cancels any active Stripe subscription, deletes all user
 * data from Supabase, then removes the auth user via the service role client.
 * Requires an authenticated Supabase session — the frontend signs out and
 * redirects after this returns 200.
 */

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const service = createServiceClient();

  // Fetch profile to check tier + subscription
  const { data: profile } = await supabase
    .from("profiles")
    .select("tier, stripe_subscription_id")
    .eq("id", user.id)
    .maybeSingle();

  // Cancel Stripe subscription immediately if Pro
  if (profile?.tier === "pro" && profile?.stripe_subscription_id) {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (secret) {
      const stripe = new Stripe(secret);
      try {
        await stripe.subscriptions.cancel(profile.stripe_subscription_id);
        console.log(`[account:delete] cancelled stripe sub=${profile.stripe_subscription_id} for user=${user.id}`);
      } catch (err) {
        // Non-fatal — continue with account deletion regardless
        console.error("[account:delete] stripe cancel failed:", err instanceof Error ? err.message : err);
      }
    }
  }

  // Delete user data — order matters (breakdowns before profile due to FK if any)
  const tables: Array<{ table: string; column: string }> = [
    { table: "breakdowns", column: "user_id" },
    { table: "breakdown_usage", column: "user_id" },
    { table: "profiles", column: "id" },
  ];

  for (const { table, column } of tables) {
    const { error } = await service.from(table).delete().eq(column, user.id);
    if (error) {
      console.error(`[account:delete] failed to delete from ${table}:`, error.message);
    }
  }

  // Delete the Supabase auth user — must be last
  const { error: authErr } = await service.auth.admin.deleteUser(user.id);
  if (authErr) {
    console.error("[account:delete] auth.admin.deleteUser failed:", authErr.message);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }

  console.log(`[account:delete] account deleted user=${user.id}`);
  return NextResponse.json({ ok: true });
}
