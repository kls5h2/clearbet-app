/**
 * Lightweight game fetch for soft-gated breakdown responses. When a free user
 * hits the daily cap or tries an MLB game, we still want to render the header
 * card + odds row on the breakdown page — but we don't want to pay the full
 * Tank01/Claude generation cost. This helper fetches just enough: team names
 * from the gameId + odds from The Odds API.
 *
 * Returns an AnyGame-shaped object with gameStatus="scheduled" and any fields
 * we can't cheaply populate left null/empty. BreakdownView renders these
 * fallbacks gracefully.
 */

import type { AnyGame, NBAGame, MLBGame, Team, Sport } from "./types";
import { lookupTeam, parseGameId } from "./team-names";
import { fetchNBAOdds, fetchMLBOdds, buildMatchupKey } from "./odds-api";

function toTeam(abv: string, sport: "NBA" | "MLB"): Team {
  const lookup = lookupTeam(abv, sport);
  return {
    teamId: "",
    teamAbv: abv,
    teamName: lookup?.full ?? abv,
    teamCity: lookup?.city ?? "",
  };
}

export async function buildLightGame(gameId: string, sport: Sport): Promise<AnyGame | null> {
  const parts = parseGameId(gameId);
  if (!parts) return null;

  const homeTeam = toTeam(parts.homeAbv, sport);
  const awayTeam = toTeam(parts.awayAbv, sport);

  if (sport === "NBA") {
    let odds = null;
    try {
      const oddsMap = await fetchNBAOdds();
      const key = buildMatchupKey(homeTeam.teamName, awayTeam.teamName);
      const match = oddsMap.get(key);
      if (match) odds = match.odds ?? null;
    } catch (err) {
      console.warn("[light-game] NBA odds fetch failed:", err instanceof Error ? err.message : err);
    }

    const game: NBAGame = {
      sport: "NBA",
      gameId,
      gameDate: parts.date,
      gameTime: "",
      gameStatus: "scheduled",
      homeTeam,
      awayTeam,
      odds,
    };
    return game;
  }

  // MLB
  let mlbOdds = null;
  try {
    const oddsMap = await fetchMLBOdds();
    const key = buildMatchupKey(homeTeam.teamName, awayTeam.teamName);
    const match = oddsMap.get(key);
    if (match) mlbOdds = match.mlbOdds ?? null;
  } catch (err) {
    console.warn("[light-game] MLB odds fetch failed:", err instanceof Error ? err.message : err);
  }

  const game: MLBGame = {
    sport: "MLB",
    gameId,
    gameDate: parts.date,
    gameTime: "",
    gameStatus: "scheduled",
    homeTeam,
    awayTeam,
    odds: mlbOdds,
    homePitcher: null,
    awayPitcher: null,
  };
  return game;
}
