import { NextRequest, NextResponse } from "next/server";
import { checkAuth, fetchVisualData } from "../_lib";
import { generatePngsForBreakdown } from "../_generate";
import { createServiceClient } from "@/lib/supabase/service";

// Allow time for multiple breakdowns; each takes ~10s.
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startOfTodayUTC = new Date();
  startOfTodayUTC.setUTCHours(0, 0, 0, 0);

  const sb = createServiceClient();
  const { data: rows, error } = await sb
    .from("breakdowns")
    .select("game_id")
    .gte("created_at", startOfTodayUTC.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[visuals/generate-all] Supabase error:", error.message);
    return NextResponse.json({ error: "Failed to fetch today's breakdowns" }, { status: 500 });
  }

  const ids = (rows ?? []).map((r) => r.game_id as string);
  const results: Array<{
    id: string;
    matchup: string;
    sport: string;
    slides: Record<string, string>;
    error?: string;
  }> = [];

  for (const id of ids) {
    const data = await fetchVisualData(id);
    if (!data) {
      results.push({ id, matchup: "", sport: "", slides: {}, error: "Not found" });
      continue;
    }

    try {
      const urls = await generatePngsForBreakdown(id, data);
      results.push({
        id,
        matchup: data.matchup,
        sport: data.sport,
        slides: {
          cover: urls[0],
          keyDrivers: urls[1],
          fragility: urls[2],
          cta: urls[3],
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[visuals/generate-all] Failed for ${id}:`, msg);
      results.push({ id, matchup: data.matchup, sport: data.sport, slides: {}, error: msg });
    }
  }

  const succeeded = results.filter((r) => !r.error).length;
  const failed = results.filter((r) => !!r.error).length;

  return NextResponse.json({ total: ids.length, succeeded, failed, results });
}
