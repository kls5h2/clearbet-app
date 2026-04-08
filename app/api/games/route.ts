import { NextResponse } from "next/server";
import { getGamesForDate } from "@/lib/tank01";
import { fetchNBAOdds, buildMatchupKey } from "@/lib/odds-api";
import type { NBAGame, GamesApiResponse } from "@/lib/types";

/**
 * GET /api/games
 * Returns tonight's NBA slate with odds attached.
 */
export async function GET() {
  try {
    const today = getTodayDateString();

    // Fetch games and odds in parallel
    const [rawGames, oddsMap] = await Promise.all([
      getGamesForDate(today),
      fetchNBAOdds().catch(() => new Map()), // don't block on odds failure
    ]);

    const games: NBAGame[] = rawGames.map((g) => {
      // Try to match the game to the odds map
      const key = buildMatchupKey(g.homeTeam.teamName, g.awayTeam.teamName);
      const oddsMatchup = oddsMap.get(key);

      return {
        gameId: g.gameId,
        gameDate: g.gameDate,
        gameTime: g.gameTime,
        gameStatus: g.gameStatus,
        homeTeam: g.homeTeam,
        awayTeam: g.awayTeam,
        odds: oddsMatchup?.odds ?? null,
      };
    });

    const response: GamesApiResponse = { games, date: today };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/games]", err);
    return NextResponse.json(
      { error: "Failed to fetch today's games" },
      { status: 500 }
    );
  }
}

/**
 * Returns today's date as YYYYMMDD in ET timezone.
 */
function getTodayDateString(): string {
  const now = new Date();
  // Use ET timezone — NBA schedule is based on Eastern time
  const et = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  // Format: MM/DD/YYYY → YYYYMMDD
  const [month, day, year] = et.split("/");
  return `${year}${month}${day}`;
}
