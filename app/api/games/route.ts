import { NextRequest, NextResponse } from "next/server";
import { getGamesForDate } from "@/lib/tank01";
import { fetchNBAOdds, buildMatchupKey } from "@/lib/odds-api";
import { getMLBGamesForDate, getMLBStartingPitcher } from "@/lib/tank01-mlb";
import { fetchMLBOdds } from "@/lib/odds-api";
import type { NBAGame, MLBGame, GamesApiResponse, MLBGamesApiResponse } from "@/lib/types";

/**
 * GET /api/games?sport=nba (default) | ?sport=mlb
 * Returns today's slate with odds attached.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sport = (searchParams.get("sport") ?? "nba").toLowerCase();

  if (sport === "mlb") {
    return handleMLB();
  }
  return handleNBA();
}

async function handleNBA(): Promise<NextResponse> {
  try {
    const today = getTodayDateString();
    const [rawGames, oddsMap] = await Promise.all([
      getGamesForDate(today),
      fetchNBAOdds().catch(() => new Map()),
    ]);

    const games: NBAGame[] = rawGames.map((g) => {
      const key = buildMatchupKey(g.homeTeam.teamName, g.awayTeam.teamName);
      const oddsMatchup = oddsMap.get(key);
      return {
        sport: "NBA",
        gameId: g.gameId,
        gameDate: g.gameDate,
        gameTime: g.gameTime,
        gameStatus: g.gameStatus,
        homeTeam: g.homeTeam,
        awayTeam: g.awayTeam,
        odds: oddsMatchup?.odds ?? null,
      };
    });

    const response: GamesApiResponse = { games, date: today, sport: "NBA" };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/games NBA]", err);
    const msg = err instanceof Error ? err.message : String(err);
    const isRateLimit = msg.includes("429");
    return NextResponse.json(
      { error: isRateLimit ? "Rate limit reached — try again in a few minutes" : "Failed to fetch NBA games" },
      { status: 500 }
    );
  }
}

async function handleMLB(): Promise<NextResponse> {
  try {
    const today = getTodayDateString();
    const [rawGames, oddsMap] = await Promise.all([
      getMLBGamesForDate(today),
      fetchMLBOdds().catch(() => new Map()),
    ]);

    // Fetch starting pitchers in parallel (non-blocking on failure)
    const gamesWithPitchers = await Promise.all(
      rawGames.map(async (g) => {
        const [homePitcher, awayPitcher] = await Promise.all([
          getMLBStartingPitcher(g.probableStarterHomeId, g.homeTeam.teamAbv).catch(() => null),
          getMLBStartingPitcher(g.probableStarterAwayId, g.awayTeam.teamAbv).catch(() => null),
        ]);
        return { ...g, homePitcher, awayPitcher };
      })
    );

    const games: MLBGame[] = gamesWithPitchers.map((g) => {
      const key = buildMatchupKey(g.homeTeam.teamName, g.awayTeam.teamName);
      const oddsMatchup = oddsMap.get(key);
      return {
        sport: "MLB",
        gameId: g.gameId,
        gameDate: g.gameDate,
        gameTime: g.gameTime,
        gameStatus: g.gameStatus,
        homeTeam: g.homeTeam,
        awayTeam: g.awayTeam,
        odds: oddsMatchup?.mlbOdds ?? null,
        homePitcher: g.homePitcher,
        awayPitcher: g.awayPitcher,
      };
    });

    const response: MLBGamesApiResponse = { games, date: today, sport: "MLB" };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/games MLB]", err);
    return NextResponse.json({ error: "Failed to fetch MLB games" }, { status: 500 });
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
