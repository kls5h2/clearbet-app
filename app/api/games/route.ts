import { NextRequest, NextResponse } from "next/server";
import { getGamesForDate } from "@/lib/tank01";
import { fetchNBAOdds, fetchMLBOdds, buildMatchupKey } from "@/lib/odds-api";
import type { OddsMatchup } from "@/lib/odds-api";
import { getMLBGamesForDate, getMLBStartingPitcher } from "@/lib/tank01-mlb";
import { fetchMLBProbableStarters } from "@/lib/mlb-stats-api";
import type { NBAGame, MLBGame, MLBGameOdds, GamesApiResponse, MLBGamesApiResponse } from "@/lib/types";

/**
 * Find a matchup in the odds map by direct key, then fall back to matching
 * by team nickname (last word of team name) to handle known name variations
 * between Tank01 ("Los Angeles Clippers") and OddsAPI ("LA Clippers").
 */
function findOddsMatchup<T extends OddsMatchup>(
  oddsMap: Map<string, T>,
  homeTeamName: string,
  awayTeamName: string
): T | undefined {
  // Direct key lookup
  const direct = oddsMap.get(buildMatchupKey(homeTeamName, awayTeamName));
  if (direct) return direct;

  // Nickname fallback: match by last word of each team name
  const homeNick = homeTeamName.split(" ").pop()?.toLowerCase() ?? "";
  const awayNick = awayTeamName.split(" ").pop()?.toLowerCase() ?? "";
  if (!homeNick || !awayNick) return undefined;

  for (const matchup of oddsMap.values()) {
    const mHome = matchup.homeTeam.split(" ").pop()?.toLowerCase() ?? "";
    const mAway = matchup.awayTeam.split(" ").pop()?.toLowerCase() ?? "";
    if (
      (mHome === homeNick && mAway === awayNick) ||
      (mHome === awayNick && mAway === homeNick)
    ) {
      return matchup;
    }
  }
  return undefined;
}

/**
 * GET /api/games?sport=nba (default) | ?sport=mlb | &date=tomorrow
 * Returns today's (or tomorrow's) slate with odds attached.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sport = (searchParams.get("sport") ?? "nba").toLowerCase();
  const dateParam = searchParams.get("date");
  const dateStr = dateParam === "tomorrow" ? getTomorrowDateString() : getTodayDateString();

  if (sport === "mlb") {
    return handleMLB(dateStr);
  }
  return handleNBA(dateStr);
}

async function handleNBA(dateStr: string): Promise<NextResponse> {
  try {
    const today = dateStr;
    const [rawGames, oddsMap] = await Promise.all([
      getGamesForDate(today),
      fetchNBAOdds().catch((err) => {
        console.warn("[/api/games NBA] Odds fetch failed:", err instanceof Error ? err.message : err);
        return new Map<string, OddsMatchup>();
      }),
    ]);

    const games: NBAGame[] = rawGames.map((g) => {
      const oddsMatchup = findOddsMatchup(oddsMap, g.homeTeam.teamName, g.awayTeam.teamName);
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

async function handleMLB(dateStr: string): Promise<NextResponse> {
  try {
    const today = dateStr;
    const [rawGames, oddsMap, mlbStatsPitchers] = await Promise.all([
      getMLBGamesForDate(today),
      fetchMLBOdds().catch((err) => {
        console.warn("[/api/games MLB] Odds fetch failed:", err instanceof Error ? err.message : err);
        return new Map<string, OddsMatchup & { mlbOdds: MLBGameOdds }>();
      }),
      // MLB Stats API is authoritative for probable starters; never blocks the response
      fetchMLBProbableStarters(today).catch(() => new Map()),
    ]);

    // Merge pitcher sources: MLB Stats API (official) takes priority over Tank01 fallback
    const gamesWithPitchers = await Promise.all(
      rawGames.map(async (g) => {
        // Try matching by home team abbreviation, then away (handles abbreviation drift)
        const statsEntry =
          mlbStatsPitchers.get(g.homeTeam.teamAbv) ??
          mlbStatsPitchers.get(g.awayTeam.teamAbv) ??
          null;

        const homePitcher =
          statsEntry?.home ??
          (await getMLBStartingPitcher(g.probableStarterHomeId, g.homeTeam.teamAbv).catch(() => null));
        const awayPitcher =
          statsEntry?.away ??
          (await getMLBStartingPitcher(g.probableStarterAwayId, g.awayTeam.teamAbv).catch(() => null));

        return { ...g, homePitcher, awayPitcher };
      })
    );

    const games: MLBGame[] = gamesWithPitchers.map((g) => {
      const oddsMatchup = findOddsMatchup(oddsMap, g.homeTeam.teamName, g.awayTeam.teamName);
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

function getTomorrowDateString(): string {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const et = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(tomorrow);
  const [month, day, year] = et.split("/");
  return `${year}${month}${day}`;
}
