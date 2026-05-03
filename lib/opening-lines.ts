/**
 * Opening lines — insert-only. Once a row exists for a game_id it is never updated.
 * First odds fetch of the day locks in the opening line.
 *
 * RLS: opening_lines has "authenticated read" policy and no write policy, so
 * every access here goes through the service-role client to bypass RLS.
 */

import { createServiceClient } from "./supabase/service";

export interface OpeningLineRecord {
  game_id: string;
  spread: number | null;
  total: number | null;
  home_ml: number | null;
  away_ml: number | null;
  created_at: string | null; // ISO timestamp of first odds fetch
}

export interface LineMovement {
  spreadMovement: number | null;  // positive = moved toward home, negative = moved away
  totalMovement: number | null;   // positive = line moved up, negative = moved down
  homeMLMovement: number | null;
  awayMLMovement: number | null;
  hoursTracked: number | null;    // hours since opening line was first recorded
}

/**
 * Insert the opening line if no row exists for this game_id.
 * If a row already exists, the upsert is a no-op (ignoreDuplicates).
 * Non-blocking — call without await.
 */
export function recordOpeningLine(
  gameId: string,
  gameDate: string,
  homeTeam: string,
  awayTeam: string,
  sport: "NBA" | "MLB",
  spread: number | null,
  total: number | null,
  homeMl: number | null,
  awayMl: number | null,
): void {
  createServiceClient()
    .from("opening_lines")
    .upsert(
      {
        game_id: gameId,
        game_date: gameDate,
        home_team: homeTeam,
        away_team: awayTeam,
        sport,
        spread,
        total,
        home_ml: homeMl,
        away_ml: awayMl,
      },
      { onConflict: "game_id", ignoreDuplicates: true }
    )
    .then(({ error }) => {
      if (error) console.error("[opening-lines] upsert failed:", error.message);
    });
}

/**
 * Fetch the opening line for a game. Returns null if none recorded yet.
 */
export async function getOpeningLine(gameId: string): Promise<OpeningLineRecord | null> {
  const { data, error } = await createServiceClient()
    .from("opening_lines")
    .select("game_id, spread, total, home_ml, away_ml, created_at")
    .eq("game_id", gameId)
    .maybeSingle();

  if (error || !data) return null;
  return data as OpeningLineRecord;
}

/**
 * Calculate movement between opening line and current odds.
 * Returns null for each market if either value is missing.
 */
export function calcLineMovement(
  opening: OpeningLineRecord | null,
  currentSpread: number | null,
  currentTotal: number | null,
  currentHomeMl: number | null,
  currentAwayMl: number | null,
): LineMovement {
  const diff = (cur: number | null, open: number | null): number | null =>
    cur !== null && open !== null ? Math.round((cur - open) * 10) / 10 : null;

  const hoursTracked = opening?.created_at
    ? Math.round((Date.now() - new Date(opening.created_at).getTime()) / (1000 * 60 * 60) * 10) / 10
    : null;

  return {
    spreadMovement: diff(currentSpread, opening?.spread ?? null),
    totalMovement: diff(currentTotal, opening?.total ?? null),
    homeMLMovement: diff(currentHomeMl, opening?.home_ml ?? null),
    awayMLMovement: diff(currentAwayMl, opening?.away_ml ?? null),
    hoursTracked,
  };
}
