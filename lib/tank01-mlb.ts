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
  H2HRecord,
  H2HGame,
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

async function fetchMLB<T>(path: string, params: Record<string, string> = {}, revalidate = 900): Promise<T> {
  const url = new URL(`${MLB_BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: getMLBHeaders(),
    next: { revalidate },
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

interface RawMLBPlayerStats {
  Hitting?: {
    avg?: string;
    HR?: string;
    RBI?: string;
    OPS?: string;
    BB?: string;
    SO?: string;
    H?: string;
    AB?: string;
    R?: string;
    TB?: string;
  };
  BaseRunning?: {
    SB?: string;
    CS?: string;
  };
  Pitching?: {
    ERA?: string;
    InningsPitched?: string;
    SO?: string;
    BB?: string;
    WHIP?: string;
    HR?: string;
    H?: string;
    ER?: string;
    Win?: string;
    Loss?: string;
  };
  gamesPlayed?: string;
  gamesStarted?: string;
  longName?: string;
  teamAbv?: string;
}

interface RawMLBRosterPlayer {
  longName: string;
  pos: string;
  bats?: string;   // "R" | "L" | "S"
  throws?: string; // "R" | "L"
  lastGamePlayed?: string; // e.g. "20260410_LAD@SF"
  injury?: {
    designation?: string;
    description?: string;
  };
  stats?: RawMLBPlayerStats;
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
  stats?: RawMLBPlayerStats;
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
  }, 60);

  if (!raw.body) return [];
  const gamesArray: RawMLBGame[] = Array.isArray(raw.body)
    ? raw.body
    : Object.values(raw.body as Record<string, RawMLBGame>);
  if (gamesArray.length === 0) return [];

  const teamMap = await getMLBTeamMap();
  // Build a secondary lookup by full team name for when Tank01 returns a name instead of abbreviation
  const teamMapByName: Record<string, RawMLBTeamInfo> = {};
  for (const info of Object.values(teamMap)) {
    const fullName = `${info.teamCity} ${info.teamName}`.trim().toLowerCase();
    teamMapByName[fullName] = info;
    teamMapByName[info.teamName.toLowerCase()] = info;
  }

  const resolveTeam = (abvField: string | undefined, nameField: string): { abv: string; info: RawMLBTeamInfo | undefined } => {
    const raw = abvField ?? nameField ?? "";
    // Try direct abbreviation lookup first
    if (teamMap[raw]) return { abv: raw, info: teamMap[raw] };
    // Fall back to name-based lookup (handles when Tank01 returns "Athletics" in the home/away field)
    const byName = teamMapByName[raw.toLowerCase()];
    if (byName) {
      console.log(`[tank01-mlb] resolved "${raw}" → "${byName.teamAbv}" via name lookup`);
      return { abv: byName.teamAbv, info: byName };
    }
    console.warn(`[tank01-mlb] unknown team identifier: "${raw}"`);
    return { abv: raw, info: undefined };
  };

  return gamesArray.map((g) => {
    const home = resolveTeam(g.homeTeamAbbr, g.home ?? "");
    const away = resolveTeam(g.awayTeamAbbr, g.away ?? "");

    const statusCode = g.gameStatusCode ?? "0";
    const rawStatus = (g as { gameStatus?: string }).gameStatus ?? "";
    const gameStatus: GameStatus =
      /postpone/i.test(rawStatus) ? "postponed"
      : statusCode === "2" ? "final"
      : statusCode === "1" ? "live"
      : "scheduled";

    return {
      gameId: g.gameID,
      gameDate: g.gameDate,
      gameTime: g.gameTime ? formatGameTime(g.gameTime) : "",
      gameStatus,
      homeTeam: {
        teamId: g.teamIDHome ?? home.abv,
        teamAbv: home.abv,
        teamName: home.info ? `${home.info.teamCity} ${home.info.teamName}`.trim() : home.abv,
        teamCity: home.info?.teamCity ?? "",
      },
      awayTeam: {
        teamId: g.teamIDAway ?? away.abv,
        teamAbv: away.abv,
        teamName: away.info ? `${away.info.teamCity} ${away.info.teamName}`.trim() : away.abv,
        teamCity: away.info?.teamCity ?? "",
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
      getStats: "true",
    });

    const player = raw.body;
    if (!player?.longName) return getMLBPitcherFromRoster(teamAbv);

    const pitching = player.stats?.Pitching;
    const seasonIP = parseFloat(pitching?.InningsPitched ?? "0");
    const seasonERA = seasonIP > 0 ? parseFloat(pitching?.ERA ?? "0") : null;
    const hand = (player.throws === "L" || player.throws === "R") ? player.throws : null;

    return {
      name: player.longName,
      seasonERA,
      recentERA: null,
      hand,
      seasonSO: pitching?.SO != null ? parseInt(pitching.SO, 10) : null,
      seasonBB: pitching?.BB != null ? parseInt(pitching.BB, 10) : null,
      seasonWHIP: pitching?.WHIP != null ? parseFloat(pitching.WHIP) : null,
      seasonHR: pitching?.HR != null ? parseInt(pitching.HR, 10) : null,
      seasonIP: seasonIP > 0 ? seasonIP : null,
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
      .filter((p) => p.stats?.Pitching?.ERA !== undefined)
      .sort((a, b) => parseFloat(b.stats?.Pitching?.InningsPitched ?? "0") - parseFloat(a.stats?.Pitching?.InningsPitched ?? "0"));

    const p = pitchers[0];
    if (!p) return null;

    const pitching = p.stats?.Pitching;
    const seasonIP = parseFloat(pitching?.InningsPitched ?? "0");

    return {
      name: p.longName,
      seasonERA: seasonIP > 0 ? parseFloat(pitching?.ERA ?? "0") : null,
      recentERA: null,
      hand: (p.throws === "L" || p.throws === "R") ? p.throws : null,
      seasonSO: pitching?.SO != null ? parseInt(pitching.SO, 10) : null,
      seasonBB: pitching?.BB != null ? parseInt(pitching.BB, 10) : null,
      seasonWHIP: pitching?.WHIP != null ? parseFloat(pitching.WHIP) : null,
      seasonHR: pitching?.HR != null ? parseInt(pitching.HR, 10) : null,
      seasonIP: seasonIP > 0 ? seasonIP : null,
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
/**
 * Fetch injury report for both MLB teams.
 * Two-layer enrichment:
 *   1. Tank01 roster designation (IL, Out, Day-To-Day)
 *   2. Absent-player detection (lastGamePlayed 7+ days, gamesPlayed < 50%)
 */
export async function getMLBInjuryReport(
  homeAbv: string,
  awayAbv: string
): Promise<InjuryReport> {
  function enrichRoster(
    roster: RawMLBRosterPlayer[],
    teamWins: number,
    teamLosses: number
  ): PlayerInjury[] {
    const result: PlayerInjury[] = [];
    const teamGames = teamWins + teamLosses;

    for (const p of roster) {
      const designation = (p.injury?.designation ?? "").trim();
      let status: PlayerInjury["status"] | null = null;
      let description = p.injury?.description ?? "";

      // Layer 1: Tank01 designation
      if (designation) {
        status = normalizeInjuryStatus(designation);
      }

      // Layer 2: Absent 7+ days with no active designation
      const daysAway = mlbDaysSinceLastGame(p.lastGamePlayed);
      if (!status && daysAway !== null && daysAway >= 7) {
        status = "Out";
        description = `Availability unconfirmed — last played ${mlbFormatLastPlayed(p.lastGamePlayed)}`;
      }

      if (!status) continue;

      // Append games-missed note if < 50% of team games
      const gp = parseInt(p.stats?.gamesPlayed ?? "0", 10);
      if (teamGames > 10 && gp > 0 && gp < teamGames * 0.5) {
        const note = `Has missed significant time this season (${gp} of ${teamGames} games)`;
        description = description ? `${description}. ${note}` : note;
      }

      result.push({
        playerName: p.longName,
        position: p.pos ?? "?",
        status,
        description,
      });
    }
    return result;
  }

  try {
    const [homeRoster, awayRoster, teamMap] = await Promise.all([
      getMLBRoster(homeAbv),
      getMLBRoster(awayAbv),
      getMLBTeamMap(),
    ]);

    const homeInfo = teamMap[homeAbv];
    const awayInfo = teamMap[awayAbv];
    return {
      homeInjuries: enrichRoster(homeRoster, parseInt(homeInfo?.wins ?? "0", 10), parseInt(homeInfo?.loss ?? "0", 10)),
      awayInjuries: enrichRoster(awayRoster, parseInt(awayInfo?.wins ?? "0", 10), parseInt(awayInfo?.loss ?? "0", 10)),
    };
  } catch {
    return { homeInjuries: [], awayInjuries: [] };
  }
}

/**
 * Build season series H2H record by filtering the home team's schedule for
 * completed games against the away team. Returns from the home team's perspective.
 */
export async function getMLBH2HRecord(
  homeAbv: string,
  awayAbv: string
): Promise<H2HRecord | null> {
  try {
    const raw = await fetchMLB<RawMLBScheduleResponse>("/getMLBTeamSchedule", {
      teamAbv: homeAbv,
      season: currentMLBSeason(),
    });

    const schedule = raw.body?.schedule ?? [];
    const h2hGames = schedule.filter((g) => {
      const completed = !!(g.gameResult && g.homePts && g.awayPts);
      const vsOpponent = g.home === awayAbv || g.away === awayAbv;
      return completed && vsOpponent;
    });

    if (h2hGames.length === 0) return null;

    let wins = 0, losses = 0;
    const marginsFor: number[] = [];
    const marginsAgainst: number[] = [];
    const games: H2HGame[] = [];

    for (const g of h2hGames) {
      const homePts = parseInt(g.homePts ?? "0", 10);
      const awayPts = parseInt(g.awayPts ?? "0", 10);
      const isHome = g.home === homeAbv;
      const teamScore = isHome ? homePts : awayPts;
      const oppScore = isHome ? awayPts : homePts;

      if (teamScore > oppScore) {
        wins++;
        marginsFor.push(teamScore - oppScore);
      } else {
        losses++;
        marginsAgainst.push(oppScore - teamScore);
      }

      games.push({ date: g.gameDate, home: g.home, away: g.away, homePts, awayPts });
    }

    const avg = (arr: number[]) =>
      arr.length > 0
        ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
        : 0;

    return {
      wins,
      losses,
      games,
      avgMarginFor: avg(marginsFor),
      avgMarginAgainst: avg(marginsAgainst),
    };
  } catch {
    return null;
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
    getStats: "true",
  });
  return raw.body?.roster ?? [];
}

export async function getMLBTeamRosterNames(teamAbv: string): Promise<string[]> {
  try {
    const roster = await getMLBRoster(teamAbv);
    return roster.map((p) => p.longName).filter(Boolean);
  } catch {
    return [];
  }
}

async function getMLBTopHitters(teamAbv: string): Promise<MLBHitterStat[]> {
  try {
    const roster = await getMLBRoster(teamAbv);
    return roster
      .filter((p) => {
        const isHitter = !["SP", "RP", "P"].includes(p.pos ?? "");
        const hasStats = p.stats?.Hitting?.avg !== undefined;
        const designation = (p.injury?.designation ?? "").toLowerCase();
        if (designation.includes("out") || designation.includes("il")) return false;
        // Exclude players absent 7+ days
        if (!designation && mlbDaysSinceLastGame(p.lastGamePlayed) !== null && mlbDaysSinceLastGame(p.lastGamePlayed)! >= 7) return false;
        return isHitter && hasStats;
      })
      .map((p) => ({
        playerName: p.longName,
        position: p.pos ?? "?",
        battingAverage: parseFloat(p.stats?.Hitting?.avg ?? "0"),
        homeRuns: parseInt(p.stats?.Hitting?.HR ?? "0", 10),
        rbi: parseInt(p.stats?.Hitting?.RBI ?? "0", 10),
        ops: parseFloat(p.stats?.Hitting?.OPS ?? "0"),
        stolenBases: parseInt(p.stats?.BaseRunning?.SB ?? "0", 10),
        walks: parseInt(p.stats?.Hitting?.BB ?? "0", 10),
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

/** Parse YYYYMMDD from lastGamePlayed ("20260410_LAD@SF") and return days since. */
function mlbDaysSinceLastGame(lastGamePlayed: string | undefined): number | null {
  if (!lastGamePlayed) return null;
  const dateStr = lastGamePlayed.split("_")[0];
  if (dateStr.length !== 8) return null;
  const y = parseInt(dateStr.slice(0, 4), 10);
  const m = parseInt(dateStr.slice(4, 6), 10) - 1;
  const d = parseInt(dateStr.slice(6, 8), 10);
  const diff = Date.now() - new Date(y, m, d).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/** Format YYYYMMDD portion of lastGamePlayed as "Apr 10". */
function mlbFormatLastPlayed(lastGamePlayed: string | undefined): string {
  if (!lastGamePlayed) return "unknown";
  const dateStr = lastGamePlayed.split("_")[0];
  if (dateStr.length !== 8) return "unknown";
  const m = parseInt(dateStr.slice(4, 6), 10);
  const d = parseInt(dateStr.slice(6, 8), 10);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[m - 1]} ${d}`;
}

function normalizeInjuryStatus(raw: string): PlayerInjury["status"] {
  const s = raw.toLowerCase();
  if (s.includes("out") || s.includes("il")) return "Out";
  if (s.includes("doubtful")) return "Doubtful";
  if (s.includes("questionable")) return "Questionable";
  return "Day-To-Day";
}
