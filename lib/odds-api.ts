/**
 * The Odds API client
 * Docs: https://the-odds-api.com/lol-of-odds-api/
 * Endpoint: GET /v4/sports/basketball_nba/odds
 */

import type { GameOdds } from "./types";

const BASE_URL = "https://api.the-odds-api.com/v4";

interface OddsApiOutcome {
  name: string;
  price: number; // American odds
  point?: number; // spread or total line
}

interface OddsApiMarket {
  key: string; // "h2h" | "spreads" | "totals"
  outcomes: OddsApiOutcome[];
}

interface OddsApiBookmaker {
  key: string;
  title: string;
  markets: OddsApiMarket[];
}

interface OddsApiGame {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsApiBookmaker[];
}

/**
 * Fetch current NBA odds from The Odds API.
 * Returns a map of game id -> GameOdds.
 * We use a consensus approach: average the line across available bookmakers.
 */
export async function fetchNBAOdds(): Promise<Map<string, OddsMatchup>> {
  const key = process.env.ODDS_API_KEY;
  if (!key) throw new Error("ODDS_API_KEY is not set");

  const url = new URL(`${BASE_URL}/sports/basketball_nba/odds`);
  url.searchParams.set("apiKey", key);
  url.searchParams.set("regions", "us");
  url.searchParams.set("markets", "h2h,spreads,totals");
  url.searchParams.set("oddsFormat", "american");

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) {
    throw new Error(`Odds API error: ${res.status} ${res.statusText}`);
  }

  const games: OddsApiGame[] = await res.json();
  const result = new Map<string, OddsMatchup>();

  for (const game of games) {
    result.set(buildMatchupKey(game.home_team, game.away_team), {
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      commenceTime: game.commence_time,
      odds: extractOdds(game),
    });
  }

  return result;
}

export interface OddsMatchup {
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  odds: GameOdds;
}

/**
 * Build a normalized key for matching games between Tank01 and Odds API.
 * Both team names are lowercased and sorted alphabetically.
 */
export function buildMatchupKey(team1: string, team2: string): string {
  return [team1.toLowerCase(), team2.toLowerCase()].sort().join("|");
}

function extractOdds(game: OddsApiGame): GameOdds {
  // Prefer DraftKings, then FanDuel, then first available
  const preferredBooks = ["draftkings", "fanduel", "betmgm", "caesars"];

  const getBookmaker = (market: string): OddsApiBookmaker | undefined => {
    for (const pref of preferredBooks) {
      const book = game.bookmakers.find(
        (b) => b.key === pref && b.markets.some((m) => m.key === market)
      );
      if (book) return book;
    }
    return game.bookmakers.find((b) => b.markets.some((m) => m.key === market));
  };

  // ── Moneyline ────────────────────────────────────────────────────────────
  const h2hBook = getBookmaker("h2h");
  const h2hMarket = h2hBook?.markets.find((m) => m.key === "h2h");
  const homeML = h2hMarket?.outcomes.find((o) => o.name === game.home_team)?.price ?? null;
  const awayML = h2hMarket?.outcomes.find((o) => o.name === game.away_team)?.price ?? null;

  // ── Spread ───────────────────────────────────────────────────────────────
  const spreadBook = getBookmaker("spreads");
  const spreadMarket = spreadBook?.markets.find((m) => m.key === "spreads");
  const homeSpreadOutcome = spreadMarket?.outcomes.find((o) => o.name === game.home_team);
  const spread = homeSpreadOutcome?.point ?? null;

  // ── Total ────────────────────────────────────────────────────────────────
  const totalsBook = getBookmaker("totals");
  const totalsMarket = totalsBook?.markets.find((m) => m.key === "totals");
  const total = totalsMarket?.outcomes[0]?.point ?? null;

  // ── Implied probabilities ─────────────────────────────────────────────────
  const impliedHomeProbability = homeML !== null ? americanToImplied(homeML) : null;
  const impliedAwayProbability = awayML !== null ? americanToImplied(awayML) : null;

  return {
    spread,
    total,
    homeMoneyline: homeML,
    awayMoneyline: awayML,
    impliedHomeProbability,
    impliedAwayProbability,
    spreadBookmaker: spreadBook?.title ?? "",
    totalsBookmaker: totalsBook?.title ?? "",
  };
}

/**
 * Convert American odds to implied probability (0–100), before vig.
 */
function americanToImplied(american: number): number {
  if (american > 0) {
    return Math.round((100 / (american + 100)) * 100);
  } else {
    return Math.round((Math.abs(american) / (Math.abs(american) + 100)) * 100);
  }
}
