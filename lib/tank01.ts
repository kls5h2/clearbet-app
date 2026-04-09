/**
 * Tank01 NBA API client
 * Base URL: https://tank01-fantasy-stats.p.rapidapi.com
 * Auth: RapidAPI key via X-RapidAPI-Key header
 */

import type {
  Team,
  TeamSeasonStats,
  PlayerStat,
  RecentGame,
  InjuryReport,
  PlayerInjury,
} from "./types";

const BASE_URL = "https://tank01-fantasy-stats.p.rapidapi.com";

function getHeaders() {
  const key = process.env.TANK01_API_KEY;
  if (!key) throw new Error("TANK01_API_KEY is not set");
  return {
    "X-RapidAPI-Key": key,
    "X-RapidAPI-Host": "tank01-fantasy-stats.p.rapidapi.com",
  };
}

async function fetchTank01<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: getHeaders(),
    next: { revalidate: 900 }, // cache 15 min
  });

  if (!res.ok) {
    throw new Error(`Tank01 API error: ${res.status} ${res.statusText} — ${path}`);
  }

  return res.json() as Promise<T>;
}

// ─── Types for raw Tank01 API responses ──────────────────────────────────────

interface RawGame {
  gameID: string;
  gameDate: string;
  gameTime: string;
  home: string;
  away: string;
  homeTeamAbbr?: string;
  awayTeamAbbr?: string;
  teamIDHome?: string;
  teamIDAway?: string;
}

interface RawGamesForDateResponse {
  statusCode: number;
  body: RawGame[];
}

interface RawTeamInfo {
  teamID: string;
  teamAbv: string;
  teamName: string;
  teamCity: string;
  ppg?: string;
  oppg?: string;
  wins?: string;
  loss?: string;
}

interface RawTeamsResponse {
  statusCode: number;
  body: RawTeamInfo[];
}


interface RawRosterPlayer {
  longName: string;
  pos: string;
  injury?: {
    injReturnDate?: string;
    description?: string;
    designation?: string; // "Out" | "Questionable" | "Doubtful" | "Day-To-Day" | ""
  };
  stats?: {
    pts?: string;
    ast?: string;
    reb?: string;
  };
}

interface RawRosterResponse {
  statusCode: number;
  body: {
    roster?: RawRosterPlayer[];
  };
}

interface RawScheduleGame {
  gameID?: string;
  gameDate: string;
  gameTime?: string;
  gameTime_epoch?: string;
  gameStatus?: string;
  gameStatusCode?: string; // "0" = scheduled, "1" = live, "2" = final
  home: string;
  away: string;
  teamAbv: string;
  homePts?: string;
  awayPts?: string;
  gameResult?: string; // e.g. "W 115-108"
}

interface RawScheduleResponse {
  statusCode: number;
  body: {
    schedule?: RawScheduleGame[];
  };
}


// ─── Public API functions ─────────────────────────────────────────────────────

/**
 * Fetch all NBA games scheduled for a given date (YYYYMMDD)
 */
export async function getGamesForDate(dateStr: string): Promise<{
  gameId: string;
  gameDate: string;
  gameTime: string;
  gameStatus: import("./types").GameStatus;
  homeTeam: Team;
  awayTeam: Team;
}[]> {
  const raw = await fetchTank01<RawGamesForDateResponse>("/getNBAGamesForDate", {
    gameDate: dateStr,
  });

  if (!raw.body || !Array.isArray(raw.body)) return [];

  // Fetch team map and game meta (time + status) in parallel
  const [teamMap, ...gameMetas] = await Promise.all([
    getTeamMap(),
    ...raw.body.map((g) => getGameMeta(g.gameID, g.homeTeamAbbr ?? g.home ?? "")),
  ]);

  return raw.body.map((g, i) => {
    const homeAbv = g.homeTeamAbbr ?? g.home ?? "";
    const awayAbv = g.awayTeamAbbr ?? g.away ?? "";
    const homeInfo = (teamMap as Record<string, RawTeamInfo>)[homeAbv];
    const awayInfo = (teamMap as Record<string, RawTeamInfo>)[awayAbv];
    const meta = gameMetas[i] as GameMeta;

    return {
      sport: "NBA" as const,
      gameId: g.gameID,
      gameDate: g.gameDate,
      gameTime: meta.gameTime,
      gameStatus: meta.gameStatus,
      homeTeam: {
        teamId: g.teamIDHome ?? homeAbv,
        teamAbv: homeAbv,
        teamName: homeInfo ? `${homeInfo.teamCity} ${homeInfo.teamName}` : homeAbv,
        teamCity: homeInfo?.teamCity ?? "",
      },
      awayTeam: {
        teamId: g.teamIDAway ?? awayAbv,
        teamAbv: awayAbv,
        teamName: awayInfo ? `${awayInfo.teamCity} ${awayInfo.teamName}` : awayAbv,
        teamCity: awayInfo?.teamCity ?? "",
      },
    };
  });
}

/**
 * Fetch team season stats for a given team abbreviation.
 * Uses /getNBATeams since /getNBATeamStats is not available on this plan.
 */
export async function getTeamStats(teamAbv: string): Promise<TeamSeasonStats> {
  const teamMap = await getTeamMap();
  const body = teamMap[teamAbv];
  if (!body) throw new Error(`No stats found for team: ${teamAbv}`);

  const ppg = parseFloat(body.ppg ?? "0");
  const oppg = parseFloat(body.oppg ?? "0");
  const wins = parseInt(body.wins ?? "0", 10);
  const losses = parseInt(body.loss ?? "0", 10);

  const topPlayers = await getTopPlayers(teamAbv);

  return {
    teamId: teamAbv,
    teamAbv,
    pointsPerGame: ppg,
    pointsAllowedPerGame: oppg,
    pace: 0,
    offensiveRating: 0,
    defensiveRating: 0,
    reboundsPerGame: 0,
    assistsPerGame: 0,
    turnoversPerGame: 0,
    threePointAttempts: 0,
    threePointPct: 0,
    wins,
    losses,
    topPlayers,
  };
}

/**
 * Fetch roster with stats and injury data for a team.
 * Returns the full roster so it can be used for both top players and injuries.
 */
async function getRoster(teamAbv: string): Promise<RawRosterPlayer[]> {
  const raw = await fetchTank01<RawRosterResponse>("/getNBATeamRoster", {
    teamAbv,
    statsToGet: "averages",
  });
  return raw.body?.roster ?? [];
}

/**
 * Fetch top 3 available (non-Out) players by PPG from roster
 */
async function getTopPlayers(teamAbv: string): Promise<PlayerStat[]> {
  try {
    const roster = await getRoster(teamAbv);
    return roster
      .filter((p) => {
        if (p.stats?.pts === undefined) return false;
        const designation = p.injury?.designation ?? "";
        return designation.toLowerCase() !== "out";
      })
      .map((p) => ({
        playerName: p.longName,
        position: p.pos,
        pointsPerGame: parseFloat(p.stats?.pts ?? "0"),
        assistsPerGame: parseFloat(p.stats?.ast ?? "0"),
        reboundsPerGame: parseFloat(p.stats?.reb ?? "0"),
      }))
      .sort((a, b) => b.pointsPerGame - a.pointsPerGame)
      .slice(0, 3);
  } catch {
    return [];
  }
}

/**
 * Fetch last 5 game results for a team
 */
export async function getRecentForm(teamAbv: string): Promise<RecentGame[]> {
  try {
    const raw = await fetchTank01<RawScheduleResponse>("/getNBATeamSchedule", {
      teamAbv,
      season: currentNBASeason(),
    });

    const schedule = raw.body?.schedule ?? [];
    // Filter completed games (have a result), take last 5
    const completed = schedule
      .filter((g) => g.gameResult && g.homePts && g.awayPts)
      .slice(-5);

    return completed.map((g) => {
      const isHome = g.teamAbv === g.home;
      const teamScore = parseInt(isHome ? (g.homePts ?? "0") : (g.awayPts ?? "0"), 10);
      const oppScore = parseInt(isHome ? (g.awayPts ?? "0") : (g.homePts ?? "0"), 10);
      const won = teamScore > oppScore;
      const opponent = isHome ? g.away : g.home;

      return {
        date: g.gameDate,
        opponent,
        result: won ? "W" : "L",
        teamScore,
        opponentScore: oppScore,
        total: teamScore + oppScore,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Fetch injury report for both teams via their roster endpoints.
 * Only includes players with a non-empty injury designation.
 */
export async function getInjuryReport(
  homeAbv: string,
  awayAbv: string
): Promise<InjuryReport> {
  const mapRoster = (roster: RawRosterPlayer[]): PlayerInjury[] =>
    roster
      .filter((p) => p.injury?.designation && p.injury.designation.trim() !== "")
      .map((p) => ({
        playerName: p.longName,
        position: p.pos ?? "?",
        status: normalizeInjuryStatus(p.injury?.designation ?? ""),
        description: p.injury?.description ?? "",
      }));

  try {
    const [homeRoster, awayRoster] = await Promise.all([
      getRoster(homeAbv),
      getRoster(awayAbv),
    ]);
    const homeInjuries = mapRoster(homeRoster);
    const awayInjuries = mapRoster(awayRoster);
    console.log(`[injuries] ${homeAbv}: ${homeInjuries.map((p) => `${p.playerName} (${p.status})`).join(", ") || "none"}`);
    console.log(`[injuries] ${awayAbv}: ${awayInjuries.map((p) => `${p.playerName} (${p.status})`).join(", ") || "none"}`);
    return { homeInjuries, awayInjuries };
  } catch {
    return { homeInjuries: [], awayInjuries: [] };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getTeamMap(): Promise<Record<string, RawTeamInfo>> {
  try {
    const raw = await fetchTank01<RawTeamsResponse>("/getNBATeams");
    const teams = Array.isArray(raw.body) ? raw.body : [];
    return Object.fromEntries(teams.map((t) => [t.teamAbv, t]));
  } catch {
    return {};
  }
}

function formatGameTime(raw: string): string {
  if (!raw) return "";
  // Handle Tank01 schedule format: "8:30p" or "10:00a"
  const match12 = raw.match(/^(\d{1,2}):(\d{2})([ap])$/i);
  if (match12) {
    const hours = parseInt(match12[1], 10);
    const mins = match12[2];
    const ampm = match12[3].toLowerCase() === "p" ? "PM" : "AM";
    return `${hours}:${mins} ${ampm} ET`;
  }
  // Handle 24h format: "19:30"
  const match24 = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match24) return raw;
  let hours = parseInt(match24[1], 10);
  const mins = match24[2];
  const ampm = hours >= 12 ? "PM" : "AM";
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  return `${hours}:${mins} ${ampm} ET`;
}

/** Returns the current NBA season year (e.g. 2026 for the 2025-26 season). */
function currentNBASeason(): string {
  const now = new Date();
  // Season ends in June; before July = use current year, July+ = next year
  return now.getMonth() < 6 ? String(now.getFullYear()) : String(now.getFullYear() + 1);
}

interface GameMeta {
  gameTime: string;
  gameStatus: import("./types").GameStatus;
}

/** Fetch tip-off time and status for a specific game via the home team's schedule. */
async function getGameMeta(gameId: string, homeTeamAbv: string): Promise<GameMeta> {
  try {
    const raw = await fetchTank01<RawScheduleResponse>("/getNBATeamSchedule", {
      teamAbv: homeTeamAbv,
      season: currentNBASeason(),
    });
    const game = (raw.body?.schedule ?? []).find((g) => g.gameID === gameId);
    const gameTime = game?.gameTime ? formatGameTime(game.gameTime) : "";
    const statusCode = game?.gameStatusCode ?? "0";
    const gameStatus: import("./types").GameStatus =
      statusCode === "2" ? "final" : statusCode === "1" ? "live" : "scheduled";
    return { gameTime, gameStatus };
  } catch {
    return { gameTime: "", gameStatus: "scheduled" };
  }
}

function normalizeInjuryStatus(raw: string): PlayerInjury["status"] {
  const s = raw.toLowerCase();
  if (s.includes("out")) return "Out";
  if (s.includes("doubtful")) return "Doubtful";
  if (s.includes("questionable")) return "Questionable";
  return "Day-To-Day";
}
