/**
 * Tank01 MLB API client
 * Host: tank01-mlb-live-in-game-real-time-statistics.p.rapidapi.com
 * Requires TANK01_MLB_API_KEY env var (can be same value as TANK01_API_KEY
 * if your RapidAPI plan includes both NBA and MLB).
 */

import type {
  Team,
  MLBTeamStats,
  MLBHitterStat,
  MLBPitcher,
  RecentGame,
  InjuryReport,
  PlayerInjury,
  GameStatus,
} from "./types";

const MLB_BASE_URL = "https://tank01-mlb-live-in-game-real-time-statistics.p.rapidapi.com";
const MLB_HOST = "tank01-mlb-live-in-game-real-time-statistics.p.rapidapi.com";

function getMLBHeaders() {
  const key = process.env.TANK01_MLB_API_KEY ?? process.env.TANK01_API_KEY;
  if (!key) throw new Error("TANK01_MLB_API_KEY (or TANK01_API_KEY) is not set");
  return {
    "X-RapidAPI-Key": key,
    "X-RapidAPI-Host": MLB_HOST,
  };
}

async function fetchMLB<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${MLB_BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: getMLBHeaders(),
    next: { revalidate: 900 },
  });

  if (!res.ok) {
    throw new Error(`Tank01 MLB error: ${res.status} ${res.statusText} — ${path}`);
  }

  return res.json() as Promise<T>;
}

// ─── Raw Tank01 MLB types ────────────────────────────────────────────────────

interface RawMLBGame {
  gameID: string;
  gameDate: string;
  gameTime?: string;
  home: string;
  away: string;
  homeTeamAbbr?: string;
  awayTeamAbbr?: string;
  teamIDHome?: string;
  teamIDAway?: string;
  gameStatusCode?: string; // "0" scheduled, "1" live, "2" final
  probableStarterHome?: string; // player ID
  probableStarterAway?: string; // player ID
}

interface RawMLBGamesResponse {
  statusCode: number;
  body: RawMLBGame[];
}

interface RawMLBTeamInfo {
  teamID: string;
  teamAbv: string;
  teamName: string;
  teamCity: string;
  wins?: string;
  loss?: string;
  RS?: string;   // runs scored
  RA?: string;   // runs allowed
  ERA?: string;  // team ERA
}

interface RawMLBTeamsResponse {
  statusCode: number;
  body: RawMLBTeamInfo[] | Record<string, RawMLBTeamInfo>;
}

interface RawMLBRosterPlayer {
  longName: string;
  pos: string;
  bats?: string;   // "R" | "L" | "S"
  throws?: string; // "R" | "L"
  injury?: {
    designation?: string;
    description?: string;
  };
  stats?: {
    // Hitter stats
    avg?: string;
    HR?: string;
    RBI?: string;
    OPS?: string;
    // Pitcher stats
    ERA?: string;
    IP?: string;
    SO?: string;
    BB?: string;
    WHIP?: string;
  };
}

interface RawMLBRosterResponse {
  statusCode: number;
  body: {
    roster?: RawMLBRosterPlayer[];
  };
}

interface RawMLBScheduleGame {
  gameID?: string;
  gameDate: string;
  gameTime?: string;
  gameStatusCode?: string;
  home: string;
  away: string;
  teamAbv: string;
  homePts?: string;
  awayPts?: string;
  gameResult?: string;
}

interface RawMLBScheduleResponse {
  statusCode: number;
  body: {
    schedule?: RawMLBScheduleGame[];
  };
}

interface RawMLBPlayerInfo {
  longName?: string;
  pos?: string;
  throws?: string;
  stats?: {
    ERA?: string;
    IP?: string;
  };
}

interface RawMLBPlayerResponse {
  statusCode: number;
  body: RawMLBPlayerInfo;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch all MLB games scheduled for today (YYYYMMDD).
 * Returns enriched game objects with team info, time, and status.
 */
export async function getMLBGamesForDate(dateStr: string): Promise<{
  gameId: string;
  gameDate: string;
  gameTime: string;
  gameStatus: GameStatus;
  homeTeam: Team;
  awayTeam: Team;
  probableStarterHomeId: string | null;
  probableStarterAwayId: string | null;
}[]> {
  const raw = await fetchMLB<RawMLBGamesResponse>("/getMLBGamesForDate", {
    gameDate: dateStr,
  });

  if (!raw.body || !Array.isArray(raw.body)) return [];

  const teamMap = await getMLBTeamMap();

  return raw.body.map((g) => {
    const homeAbv = g.homeTeamAbbr ?? g.home ?? "";
    const awayAbv = g.awayTeamAbbr ?? g.away ?? "";
    const homeInfo = teamMap[homeAbv];
    const awayInfo = teamMap[awayAbv];

    const statusCode = g.gameStatusCode ?? "0";
    const gameStatus: GameStatus =
      statusCode === "2" ? "final" : statusCode === "1" ? "live" : "scheduled";

    return {
      gameId: g.gameID,
      gameDate: g.gameDate,
      gameTime: g.gameTime ? formatGameTime(g.gameTime) : "",
      gameStatus,
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
      probableStarterHomeId: g.probableStarterHome ?? null,
      probableStarterAwayId: g.probableStarterAway ?? null,
    };
  });
}

/**
 * Fetch team stats. Uses /getMLBTeams for wins/losses/runs/ERA.
 */
export async function getMLBTeamStats(teamAbv: string): Promise<MLBTeamStats> {
  const teamMap = await getMLBTeamMap();
  const info = teamMap[teamAbv];

  const wins = parseInt(info?.wins ?? "0", 10);
  const losses = parseInt(info?.loss ?? "0", 10);
  const runsPerGame = parseFloat(info?.RS ?? "0");
  const runsAllowedPerGame = parseFloat(info?.RA ?? "0");
  const teamERA = parseFloat(info?.ERA ?? "0");

  const topHitters = await getMLBTopHitters(teamAbv);

  return {
    teamAbv,
    wins,
    losses,
    runsPerGame,
    runsAllowedPerGame,
    teamERA,
    topHitters,
  };
}

/**
 * Fetch starting pitcher info for a given player ID (from game's probable starters).
 * Falls back gracefully if the player endpoint doesn't return usable data.
 */
export async function getMLBStartingPitcher(
  playerId: string | null,
  teamAbv: string
): Promise<MLBPitcher | null> {
  if (!playerId) return getMLBPitcherFromRoster(teamAbv);

  try {
    const raw = await fetchMLB<RawMLBPlayerResponse>("/getMLBPlayerInfo", {
      playerID: playerId,
      statsToGet: "averages",
    });

    const player = raw.body;
    if (!player?.longName) return getMLBPitcherFromRoster(teamAbv);

    const seasonERA = parseFloat(player.stats?.ERA ?? "0");
    const hand = (player.throws === "L" || player.throws === "R") ? player.throws : null;

    return {
      name: player.longName,
      seasonERA,
      recentERA: null, // would need game log endpoint
      hand,
    };
  } catch {
    return getMLBPitcherFromRoster(teamAbv);
  }
}

/**
 * Fallback: find the pitcher with the most IP in the roster.
 */
async function getMLBPitcherFromRoster(teamAbv: string): Promise<MLBPitcher | null> {
  try {
    const roster = await getMLBRoster(teamAbv);
    const pitchers = roster
      .filter((p) => p.pos === "SP" || p.pos === "P")
      .filter((p) => p.injury?.designation?.toLowerCase() !== "out")
      .filter((p) => p.stats?.ERA !== undefined)
      .sort((a, b) => parseFloat(b.stats?.IP ?? "0") - parseFloat(a.stats?.IP ?? "0"));

    const p = pitchers[0];
    if (!p) return null;

    return {
      name: p.longName,
      seasonERA: parseFloat(p.stats?.ERA ?? "0"),
      recentERA: null,
      hand: (p.throws === "L" || p.throws === "R") ? p.throws : null,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch recent form (last 5 completed games) for a team.
 */
export async function getMLBRecentForm(teamAbv: string): Promise<RecentGame[]> {
  try {
    const raw = await fetchMLB<RawMLBScheduleResponse>("/getMLBTeamSchedule", {
      teamAbv,
      season: currentMLBSeason(),
    });

    const schedule = raw.body?.schedule ?? [];
    const completed = schedule
      .filter((g) => g.gameResult && g.homePts && g.awayPts)
      .slice(-5);

    return completed.map((g) => {
      const isHome = g.teamAbv === g.home;
      const teamScore = parseInt(isHome ? (g.homePts ?? "0") : (g.awayPts ?? "0"), 10);
      const oppScore = parseInt(isHome ? (g.awayPts ?? "0") : (g.homePts ?? "0"), 10);

      return {
        date: g.gameDate,
        opponent: isHome ? g.away : g.home,
        result: teamScore > oppScore ? "W" : "L",
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
 */
export async function getMLBInjuryReport(
  homeAbv: string,
  awayAbv: string
): Promise<InjuryReport> {
  const mapRoster = (roster: RawMLBRosterPlayer[]): PlayerInjury[] =>
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
      getMLBRoster(homeAbv),
      getMLBRoster(awayAbv),
    ]);
    return {
      homeInjuries: mapRoster(homeRoster),
      awayInjuries: mapRoster(awayRoster),
    };
  } catch {
    return { homeInjuries: [], awayInjuries: [] };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getMLBTeamMap(): Promise<Record<string, RawMLBTeamInfo>> {
  try {
    const raw = await fetchMLB<RawMLBTeamsResponse>("/getMLBTeams");
    const body = raw.body;
    if (Array.isArray(body)) {
      return Object.fromEntries(body.map((t) => [t.teamAbv, t]));
    }
    // Some Tank01 responses return an object keyed by abbv
    return body as Record<string, RawMLBTeamInfo>;
  } catch {
    return {};
  }
}

async function getMLBRoster(teamAbv: string): Promise<RawMLBRosterPlayer[]> {
  const raw = await fetchMLB<RawMLBRosterResponse>("/getMLBTeamRoster", {
    teamAbv,
    statsToGet: "averages",
  });
  return raw.body?.roster ?? [];
}

async function getMLBTopHitters(teamAbv: string): Promise<MLBHitterStat[]> {
  try {
    const roster = await getMLBRoster(teamAbv);
    return roster
      .filter((p) => {
        const isHitter = !["SP", "RP", "P"].includes(p.pos ?? "");
        const hasStats = p.stats?.avg !== undefined;
        const isOut = p.injury?.designation?.toLowerCase() === "out";
        return isHitter && hasStats && !isOut;
      })
      .map((p) => ({
        playerName: p.longName,
        position: p.pos ?? "?",
        battingAverage: parseFloat(p.stats?.avg ?? "0"),
        homeRuns: parseInt(p.stats?.HR ?? "0", 10),
        rbi: parseInt(p.stats?.RBI ?? "0", 10),
        ops: parseFloat(p.stats?.OPS ?? "0"),
      }))
      .sort((a, b) => b.ops - a.ops)
      .slice(0, 4);
  } catch {
    return [];
  }
}

function formatGameTime(raw: string): string {
  if (!raw) return "";
  const match12 = raw.match(/^(\d{1,2}):(\d{2})([ap])$/i);
  if (match12) {
    const hours = parseInt(match12[1], 10);
    const mins = match12[2];
    const ampm = match12[3].toLowerCase() === "p" ? "PM" : "AM";
    return `${hours}:${mins} ${ampm} ET`;
  }
  const match24 = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match24) return raw;
  let hours = parseInt(match24[1], 10);
  const mins = match24[2];
  const ampm = hours >= 12 ? "PM" : "AM";
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  return `${hours}:${mins} ${ampm} ET`;
}

function currentMLBSeason(): string {
  return String(new Date().getFullYear());
}

function normalizeInjuryStatus(raw: string): PlayerInjury["status"] {
  const s = raw.toLowerCase();
  if (s.includes("out") || s.includes("il")) return "Out";
  if (s.includes("doubtful")) return "Doubtful";
  if (s.includes("questionable")) return "Questionable";
  return "Day-To-Day";
}
