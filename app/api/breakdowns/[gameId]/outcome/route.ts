/**
 * Outcome tracker — POST { outcome: "won" | "lost" | "push" | "no_action" | null }
 * to update the breakdowns.outcome column for a given game_id, scoped to the
 * current session user. Service-role client bypasses RLS; the auth check is
 * the security boundary (user_id must match).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const VALID_OUTCOMES = new Set(["won", "lost", "push", "no_action"]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: { outcome?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const outcome = body.outcome ?? null;
  if (outcome !== null && (typeof outcome !== "string" || !VALID_OUTCOMES.has(outcome))) {
    return NextResponse.json({ error: "Invalid outcome value" }, { status: 400 });
  }

  const sb = createServiceClient();
  const { data, error } = await sb
    .from("breakdowns")
    .update({ outcome })
    .eq("game_id", gameId)
    .eq("user_id", user.id)
    .select("id, outcome");

  if (error) {
    console.error(`[outcome] update failed for game_id=${gameId}:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Breakdown not found" }, { status: 404 });
  }

  return NextResponse.json({ outcome: data[0].outcome });
}
