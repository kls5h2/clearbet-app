import { NextRequest, NextResponse } from "next/server";
import { getGamesForDate } from "@/lib/tank01";
import { getTeamStats, getRecentForm, getInjuryReport } from "@/lib/tank01";
import { fetchNBAOdds, buildMatchupKey } from "@/lib/odds-api";
import { generateBreakdown } from "@/lib/claude";
import { supabase } from "@/lib/supabase";
import type { GameDetailData, NBAGame, BreakdownApiResponse } from "@/lib/types";

/**
 * POST /api/breakdown
 * Body: { gameId: string }
 * Returns a six-step Clearbet breakdown for the requested game.
 */
export async function POST(req: NextRequest) {
  let gameId: string;

  try {
    const body = await req.json();
    gameId = body?.gameId;
    if (!gameId || typeof gameId !== "string") {
      return NextResponse.json({ error: "gameId is required" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    // 1. Find the game in today's slate
    const today = getTodayDateString();
    console.log(`[breakdown] gameId=${gameId} date=${today}`);
    const allGames = await getGamesForDate(today);
    console.log(`[breakdown] slate has ${allGames.length} games:`, allGames.map((g) => g.gameId));
    const rawGame = allGames.find((g) => g.gameId === gameId);

    if (!rawGame) {
      console.error(`[breakdown] game not found: ${gameId}`);
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const { homeTeam, awayTeam } = rawGame;
    console.log(`[breakdown] matched game: ${awayTeam.teamAbv} @ ${homeTeam.teamAbv}`);

    // 2. Fetch all data in parallel
    console.log(`[breakdown] fetching stats for ${homeTeam.teamAbv} and ${awayTeam.teamAbv}`);
    const [homeStats, awayStats, homeForm, awayForm, injuryReport, oddsMap] =
      await Promise.all([
        getTeamStats(homeTeam.teamAbv),
        getTeamStats(awayTeam.teamAbv),
        getRecentForm(homeTeam.teamAbv),
        getRecentForm(awayTeam.teamAbv),
        getInjuryReport(homeTeam.teamAbv, awayTeam.teamAbv),
        fetchNBAOdds().catch((e) => { console.error("[breakdown] odds fetch failed:", e.message); return new Map(); }),
      ]);
    console.log(`[breakdown] homeStats ppg=${homeStats.pointsPerGame} wins=${homeStats.wins}`);
    console.log(`[breakdown] awayStats ppg=${awayStats.pointsPerGame} wins=${awayStats.wins}`);
    console.log(`[breakdown] homeForm games=${homeForm.length} awayForm games=${awayForm.length}`);
    console.log(`[breakdown] injuries home=${injuryReport.homeInjuries.length} away=${injuryReport.awayInjuries.length}`);

    // 3. Match odds
    const oddsKey = buildMatchupKey(homeTeam.teamName, awayTeam.teamName);
    const odds = oddsMap.get(oddsKey)?.odds ?? null;
    console.log(`[breakdown] oddsKey=${oddsKey} matched=${odds !== null}`);

    const game: NBAGame = {
      gameId: rawGame.gameId,
      gameDate: rawGame.gameDate,
      gameTime: rawGame.gameTime,
      gameStatus: rawGame.gameStatus,
      homeTeam,
      awayTeam,
      odds,
    };

    const detailData: GameDetailData = {
      game,
      homeTeamStats: homeStats,
      awayTeamStats: awayStats,
      homeRecentForm: homeForm,
      awayRecentForm: awayForm,
      injuries: injuryReport,
    };

    // 4. Generate breakdown via Claude
    console.log("[breakdown] calling Claude...");
    const breakdown = await generateBreakdown(detailData);
    console.log(`[breakdown] Claude responded: confidenceLevel=${breakdown.confidenceLevel}`);

    // 5. Archive to Supabase (non-blocking, upsert to prevent duplicates)
    supabase
      .from("breakdowns")
      .upsert(
        {
          game_id: game.gameId,
          game_date: today,
          home_team: homeTeam.teamAbv,
          away_team: awayTeam.teamAbv,
          sport: "NBA",
          breakdown_content: breakdown,
          confidence_level: breakdown.confidenceLevel,
          confidence_label: breakdown.confidenceLabel,
        },
        { onConflict: "game_id" }
      )
      .then(({ error }) => {
        if (error) console.error("[breakdown] supabase upsert failed:", error.message);
        else console.log("[breakdown] archived to supabase");
      });

    const response: BreakdownApiResponse = { breakdown, game };
    return NextResponse.json(response);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("[breakdown] FAILED:", error.message);
    console.error("[breakdown] STACK:", error.stack);
    if ("status" in error) console.error("[breakdown] STATUS:", (error as any).status);
    if ("error" in error) console.error("[breakdown] BODY:", JSON.stringify((error as any).error));
    return NextResponse.json(
      { error: "Failed to generate breakdown" },
      { status: 500 }
    );
  }
}

function getTodayDateString(): string {
  const now = new Date();
  const et = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const [month, day, year] = et.split("/");
  return `${year}${month}${day}`;
}
