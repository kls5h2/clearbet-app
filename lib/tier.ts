/**
 * Tier helpers — centralize reads of profiles.tier so gates stay consistent.
 * "free" is the default for users with no row yet (handle_new_user trigger
 * hiccup) so the app degrades safely rather than granting Pro by accident.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type Tier = "free" | "pro";

export async function getTierForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<Tier> {
  const { data } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", userId)
    .maybeSingle();
  return (data?.tier ?? "free") as Tier;
}

export function isPro(tier: Tier | null | undefined): boolean {
  return tier === "pro";
}
