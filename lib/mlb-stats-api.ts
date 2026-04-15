/**
 * MLB Stats API client (no auth required)
 * Probable starters endpoint — authoritative source for confirmed pitchers.
 */

import type { MLBPitcher, MLBPlayoffContext, MLBBullpenStats, MLBUmpire } from "./types";

const BASE = "https://statsapi.mlb.com/api/v1";

// ─── Raw response types ───────────────────────────────────────────────────────

interface RawProbablePitcher {
  id: number;
  fullName: string;
}

interface RawTeamEntry {
  // abbreviation is absent from the schedule endpoint — use MLB_STATS_ID_TO_ABV
  team: { id: number; name: string; abbreviation?: string };
  probablePitcher?: RawProbablePitcher;
}

// Stable MLB team ID → abbreviation, normalized to match Tank01/our system.
// (MLB Stats API uses "AZ" for Arizona and "ATH" for Athletics; we normalize both.)
const MLB_STATS_ID_TO_ABV: Record<number, string> = {
  108: "LAA", 109: "ARI", 110: "BAL", 111: "BOS", 112: "CHC",
  113: "CIN", 114: "CLE", 115: "COL", 116: "DET", 117: "HOU",
  118: "KC",  119: "LAD", 120: "WSH", 121: "NYM", 133: "ATH",
  134: "PIT", 135: "SD",  136: "SEA", 137: "SF",  138: "STL",
  139: "TB",  140: "TEX", 141: "TOR", 142: "MIN", 143: "PHI",
  144: "ATL", 145: "CWS", 146: "MIA", 147: "NYY", 158: "MIL",
};

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

// ─── Umpire raw types + static tendency table ────────────────────────────────

interface RawOfficial {
  official: { id: number; fullName: string };
  officialType: string; // "Home Plate" | "First Base" | "Second Base" | "Third Base"
}

interface RawGameWithOfficials {
  teams: { home: { team: { abbreviation: string } }; away: { team: { abbreviation: string } } };
  officials?: RawOfficial[];
}

interface RawScheduleWithOfficialsResponse {
  dates?: Array<{ games: RawGameWithOfficials[] }>;
}

// Known HP umpire tendencies — sourced from multi-year strike zone and run data.
// Only umpires with clear, consistent patterns are listed. Absent = neutral / unknown.
const UMPIRE_TENDENCIES: Record<string, "pitcher-friendly" | "hitter-friendly"> = {
  // Pitcher-friendly: larger zone, more Ks, fewer walks
  "Laz Diaz":          "pitcher-friendly",
  "Alfonso Marquez":   "pitcher-friendly",
  "Ted Barrett":       "pitcher-friendly",
  "Dan Iassogna":      "pitcher-friendly",
  "Mike Everitt":      "pitcher-friendly",
  "Tripp Gibson":      "pitcher-friendly",
  "Doug Eddings":      "pitcher-friendly",
  "Adrian Johnson":    "pitcher-friendly",
  // Hitter-friendly: tighter or inconsistent zone, more walks, inflated pitch counts
  "CB Bucknor":        "hitter-friendly",
  "Phil Cuzzi":        "hitter-friendly",
  "Mike Winters":      "hitter-friendly",
  "Brian Gorman":      "hitter-friendly",
  "Jim Reynolds":      "hitter-friendly",
  "Bill Miller":       "hitter-friendly",
  "Jerry Layne":       "hitter-friendly",
};

// ─── Standings + bullpen raw types ───────────────────────────────────────────

interface RawStandingsDivisionRecord {
  wins: number;
  losses: number;
  division: { id: number; name: string };
}

interface RawStandingsTeamRecord {
  team: { id: number; name: string; abbreviation: string };
  wins: number;
  losses: number;
  divisionRank: string;
  gamesBack: string;
  wildCardRank: string;
  wildCardGamesBack: string;
  records: { divisionRecords: RawStandingsDivisionRecord[] };
}

interface RawStandingsDivision {
  league: { id: number; name: string };
  division: { id: number; name: string };
  teamRecords: RawStandingsTeamRecord[];
}

interface RawStandingsResponse {
  records: RawStandingsDivision[];
}

interface RawTeamLookup {
  id: number;
  abbreviation: string;
}

interface RawTeamsLookupResponse {
  teams?: RawTeamLookup[];
}

interface RawTeamStatSplit {
  stat: {
    era?: string;
    saves?: number;
    saveOpportunities?: number;
    blownSaves?: number;
  };
}

interface RawTeamStatsResponse {
  stats?: Array<{ splits: RawTeamStatSplit[] }>;
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
      // Use static ID map — schedule endpoint omits abbreviation from team objects
      const homeAbv = MLB_STATS_ID_TO_ABV[g.teams.home.team.id] ?? g.teams.home.team.abbreviation ?? "";
      const awayAbv = MLB_STATS_ID_TO_ABV[g.teams.away.team.id] ?? g.teams.away.team.abbreviation ?? "";
      if (!homeAbv || !awayAbv) continue; // skip unrecognized teams
      entries.push({
        homeAbv,
        awayAbv,
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
    seasonERA: details?.seasonERA ?? null,
    recentERA: null,
    hand: details?.hand ?? null,
    seasonSO: null,
    seasonBB: null,
    seasonWHIP: null,
    seasonHR: null,
    seasonIP: null,
  };
}

/**
 * Fetch division standings and wild card position for both teams.
 * Uses MLB Stats API /standings — no auth required.
 */
export async function getMLBPlayoffContext(
  homeAbv: string,
  awayAbv: string
): Promise<{ home: MLBPlayoffContext | null; away: MLBPlayoffContext | null }> {
  try {
    const season = String(new Date().getFullYear());
    const res = await fetch(
      `${BASE}/standings?leagueId=103,104&season=${season}&hydrate=team`,
      { next: { revalidate: 900 } }
    );
    if (!res.ok) return { home: null, away: null };

    const data: RawStandingsResponse = await res.json();
    const contextMap = new Map<string, MLBPlayoffContext>();

    for (const divGroup of data.records ?? []) {
      const divisionName = divGroup.division.name;
      const leagueName = divGroup.league.name;

      for (const tr of divGroup.teamRecords ?? []) {
        const abv = tr.team.abbreviation;

        const divRecord = tr.records?.divisionRecords?.find(
          (r) => r.division.name === divisionName
        );
        const divisionRecord = divRecord
          ? `${divRecord.wins}-${divRecord.losses}`
          : `${tr.wins}-${tr.losses}`;

        const gamesBackDivision =
          tr.gamesBack === "-" ? 0 : parseFloat(tr.gamesBack) || 0;

        const wildCardRank =
          tr.wildCardRank && tr.wildCardRank !== "-"
            ? parseInt(tr.wildCardRank, 10)
            : null;

        // "-" means in WC (0 GB); absent/null means division leader (not in WC pool)
        const gamesBackWildCard =
          wildCardRank !== null
            ? tr.wildCardGamesBack === "-"
              ? 0
              : parseFloat(tr.wildCardGamesBack) || 0
            : null;

        contextMap.set(abv, {
          division: divisionName,
          leagueName,
          divisionRank: parseInt(tr.divisionRank, 10) || 1,
          divisionRecord,
          gamesBackDivision,
          wildCardRank,
          gamesBackWildCard,
          wins: tr.wins,
          losses: tr.losses,
        });
      }
    }

    return {
      home: contextMap.get(homeAbv) ?? null,
      away: contextMap.get(awayAbv) ?? null,
    };
  } catch {
    return { home: null, away: null };
  }
}

/**
 * Fetch season save stats and 7-day pitching ERA for a team's bullpen.
 * Season saves/saveOpportunities/blownSaves come from the season stats endpoint.
 * 7-day ERA comes from the byDateRange endpoint (team pitching aggregate).
 */
export async function getMLBBullpenStats(abv: string): Promise<MLBBullpenStats | null> {
  try {
    const teamId = await fetchMLBTeamId(abv);
    if (!teamId) return null;

    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    const [seasonRes, recentRes] = await Promise.all([
      fetch(`${BASE}/teams/${teamId}/stats?stats=season&group=pitching`, {
        next: { revalidate: 900 },
      }),
      fetch(
        `${BASE}/teams/${teamId}/stats?stats=byDateRange&group=pitching&startDate=${fmt(sevenDaysAgo)}&endDate=${fmt(today)}`,
        { next: { revalidate: 900 } }
      ),
    ]);

    let saves = 0, saveOpportunities = 0, blownSaves = 0;
    let era7Day: number | null = null;

    if (seasonRes.ok) {
      const d: RawTeamStatsResponse = await seasonRes.json();
      const stat = d.stats?.[0]?.splits?.[0]?.stat;
      if (stat) {
        saves = stat.saves ?? 0;
        saveOpportunities = stat.saveOpportunities ?? 0;
        blownSaves = stat.blownSaves ?? 0;
      }
    }

    if (recentRes.ok) {
      const d: RawTeamStatsResponse = await recentRes.json();
      const eraStr = d.stats?.[0]?.splits?.[0]?.stat?.era;
      if (eraStr && eraStr !== "-" && eraStr !== "-.--") {
        const parsed = parseFloat(eraStr);
        if (!isNaN(parsed)) era7Day = parsed;
      }
    }

    return { era7Day, saves, saveOpportunities, blownSaves };
  } catch {
    return null;
  }
}

/**
 * Fetch the home plate umpire for a specific game identified by the home team abbreviation.
 * Matches against the static tendency table to return a lean signal.
 * Returns null if the crew hasn't been assigned yet (common for early-day requests).
 */
export async function getMLBUmpire(
  dateStr: string, // YYYYMMDD
  homeAbv: string
): Promise<MLBUmpire | null> {
  try {
    const date = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    const res = await fetch(
      `${BASE}/schedule?sportId=1&date=${date}&hydrate=officials`,
      { next: { revalidate: 900 } }
    );
    if (!res.ok) return null;

    const data: RawScheduleWithOfficialsResponse = await res.json();

    for (const d of data.dates ?? []) {
      for (const g of d.games) {
        if (g.teams.home.team.abbreviation !== homeAbv) continue;
        const hp = g.officials?.find((o) => o.officialType === "Home Plate");
        if (!hp) return null;
        const name = hp.official.fullName;
        return {
          name,
          tendency: UMPIRE_TENDENCIES[name] ?? null,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function fetchMLBTeamId(abv: string): Promise<number | null> {
  try {
    const res = await fetch(`${BASE}/teams?sportId=1`, {
      next: { revalidate: 900 },
    });
    if (!res.ok) return null;
    const data: RawTeamsLookupResponse = await res.json();
    return data.teams?.find((t) => t.abbreviation === abv)?.id ?? null;
  } catch {
    return null;
  }
}
