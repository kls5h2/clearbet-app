/**
 * MLB Stats API client (no auth required)
 * Probable starters endpoint — authoritative source for confirmed pitchers.
 */

import type { MLBPitcher } from "./types";

const BASE = "https://statsapi.mlb.com/api/v1";

// ─── Raw response types ───────────────────────────────────────────────────────

interface RawProbablePitcher {
  id: number;
  fullName: string;
}

interface RawTeamEntry {
  team: { id: number; name: string; abbreviation: string };
  probablePitcher?: RawProbablePitcher;
}

interface RawGame {
  teams: { home: RawTeamEntry; away: RawTeamEntry };
}

interface RawScheduleResponse {
  dates?: Array<{ games: RawGame[] }>;
}

interface RawPerson {
  id: number;
  pitchHand?: { code: "L" | "R" };
  stats?: Array<{
    group: { displayName: string };
    splits: Array<{ stat: { era?: string } }>;
  }>;
}

interface RawPeopleResponse {
  people?: RawPerson[];
}

interface PitcherStub {
  id: number;
  name: string;
}

interface GameEntry {
  homeAbv: string;
  awayAbv: string;
  home: PitcherStub | null;
  away: PitcherStub | null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch probable starters from the MLB Stats API and enrich with ERA + hand.
 * Returns a Map keyed by home team abbreviation (MLB Stats API abbreviations).
 * Falls back gracefully on any error — never throws.
 */
export async function fetchMLBProbableStarters(
  dateStr: string // YYYYMMDD
): Promise<Map<string, { home: MLBPitcher | null; away: MLBPitcher | null }>> {
  const date = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;

  // 1. Schedule with probable pitchers
  const schedRes = await fetch(
    `${BASE}/schedule?sportId=1&date=${date}&hydrate=probablePitcher`,
    { next: { revalidate: 900 } }
  );
  if (!schedRes.ok) throw new Error(`MLB Stats API schedule: ${schedRes.status}`);

  const schedData: RawScheduleResponse = await schedRes.json();
  const entries: GameEntry[] = [];

  for (const d of schedData.dates ?? []) {
    for (const g of d.games) {
      entries.push({
        homeAbv: g.teams.home.team.abbreviation,
        awayAbv: g.teams.away.team.abbreviation,
        home: g.teams.home.probablePitcher
          ? { id: g.teams.home.probablePitcher.id, name: g.teams.home.probablePitcher.fullName }
          : null,
        away: g.teams.away.probablePitcher
          ? { id: g.teams.away.probablePitcher.id, name: g.teams.away.probablePitcher.fullName }
          : null,
      });
    }
  }

  // 2. Batch-fetch ERA + hand for every pitcher found
  const allIds: number[] = [];
  for (const e of entries) {
    if (e.home) allIds.push(e.home.id);
    if (e.away) allIds.push(e.away.id);
  }
  const personMap = await fetchPersonDetails(allIds);

  // 3. Build result map — keyed by homeAbv (primary) and awayAbv (secondary)
  //    so the route can look up by whichever abbreviation Tank01 returns.
  const result = new Map<string, { home: MLBPitcher | null; away: MLBPitcher | null }>();
  for (const e of entries) {
    const entry = {
      home: e.home ? buildPitcher(e.home, personMap) : null,
      away: e.away ? buildPitcher(e.away, personMap) : null,
    };
    result.set(e.homeAbv, entry);
    // Secondary key: awayAbv lets us still match even if Tank01 calls the
    // home team by a different abbreviation.
    if (!result.has(e.awayAbv)) {
      result.set(e.awayAbv, entry);
    }
  }

  return result;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchPersonDetails(
  ids: number[]
): Promise<Map<number, { hand: "L" | "R" | null; seasonERA: number | null }>> {
  const map = new Map<number, { hand: "L" | "R" | null; seasonERA: number | null }>();
  if (ids.length === 0) return map;

  const res = await fetch(
    `${BASE}/people?personIds=${ids.join(",")}&hydrate=stats(group=[pitching],type=season)`,
    { next: { revalidate: 900 } }
  );
  if (!res.ok) return map;

  const data: RawPeopleResponse = await res.json();
  for (const p of data.people ?? []) {
    const hand = p.pitchHand?.code ?? null;
    const pitching = p.stats?.find((s) => s.group.displayName === "pitching");
    const eraStr = pitching?.splits?.[0]?.stat?.era;
    const seasonERA =
      eraStr && eraStr !== "-" && eraStr !== "-.--" ? parseFloat(eraStr) : null;
    map.set(p.id, { hand, seasonERA });
  }
  return map;
}

function buildPitcher(
  stub: PitcherStub,
  personMap: Map<number, { hand: "L" | "R" | null; seasonERA: number | null }>
): MLBPitcher {
  const details = personMap.get(stub.id);
  return {
    name: stub.name,
    seasonERA: details?.seasonERA ?? 0,
    recentERA: null,
    hand: details?.hand ?? null,
  };
}
