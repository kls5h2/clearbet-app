import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { BreakdownResult, AnyGame } from "@/lib/types";

const CONTENT_API_TOKEN = process.env.CONTENT_API_TOKEN;

function checkAuth(req: NextRequest): boolean {
  if (!CONTENT_API_TOKEN) return false;
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return token === CONTENT_API_TOKEN;
}

function buildMatchup(row: {
  home_team: string;
  away_team: string;
  game_snapshot: unknown;
}): string {
  const snap = row.game_snapshot as AnyGame | null;
  if (snap?.homeTeam && snap?.awayTeam) {
    const home = snap.homeTeam.teamCity
      ? `${snap.homeTeam.teamCity} ${snap.homeTeam.teamName}`
      : snap.homeTeam.teamAbv;
    const away = snap.awayTeam.teamCity
      ? `${snap.awayTeam.teamCity} ${snap.awayTeam.teamName}`
      : snap.awayTeam.teamAbv;
    return `${away} @ ${home}`;
  }
  return `${row.away_team} @ ${row.home_team}`;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startOfTodayUTC = new Date();
  startOfTodayUTC.setUTCHours(0, 0, 0, 0);

  const sb = createServiceClient();
  const { data, error } = await sb
    .from("breakdowns")
    .select(
      "game_id, sport, home_team, away_team, game_snapshot, breakdown_content, confidence_level, confidence_label, created_at"
    )
    .gte("created_at", startOfTodayUTC.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[content/today] Supabase query failed:", error.message);
    return NextResponse.json({ error: "Failed to fetch breakdowns" }, { status: 500 });
  }

  const results = (data ?? []).map((row) => {
    const content = row.breakdown_content as BreakdownResult | null;
    const keyDrivers = (content?.keyDrivers ?? []).slice(0, 3).map((d) => ({
      factor: d.factor,
      weight: d.weight,
    }));
    const fragilityCheck = (content?.fragilityCheck ?? []).slice(0, 3).map((f) => ({
      item: f.item,
      color: f.color,
    }));

    return {
      id: row.game_id,
      sport: row.sport as "NBA" | "MLB",
      matchup: buildMatchup(row),
      signal_grade: content?.signalGrade ?? null,
      confidence_badge: row.confidence_label as string,
      key_drivers: keyDrivers,
      fragility_check: fragilityCheck,
      market_read: content?.marketRead ?? null,
      breakdown_url: `https://rawintelsports.com/breakdown/${row.game_id}`,
    };
  });

  return NextResponse.json(results);
}
