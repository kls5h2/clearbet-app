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
  PlayoffContext,
  PlayoffStatus,
  H2HRecord,
  H2HGame,
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
  conference?: string;
  conferenceAbv?: string;
  division?: string;
  currentStreak?: { result: string; length: string | number };
}

interface RawTeamsResponse {
  statusCode: number;
  body: RawTeamInfo[];
}


interface RawRosterPlayer {
  longName: string;
  pos: string;
  lastGamePlayed?: string; // e.g. "20260406_PHI@SA"
  injury?: {
    injReturnDate?: string;
    description?: string;
    designation?: string; // "Out" | "Questionable" | "Doubtful" | "Day-To-Day" | ""
  };
  stats?: {
    pts?: string;
    ast?: string;
    reb?: string;
    gamesPlayed?: string;
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

    // getGameMeta looks up the season schedule — it returns "" for future-dated
    // games not yet in the schedule. Fall back to the gameTime on the raw response.
    const gameTime = meta.gameTime || formatGameTime(g.gameTime ?? "");

    return {
      sport: "NBA" as const,
      gameId: g.gameID,
      gameDate: g.gameDate,
      gameTime,
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
 * Fetch top 3 available players by PPG from roster.
 * Excludes players who are Out, absent 7+ days, or on the official injury report.
 */
async function getTopPlayers(teamAbv: string): Promise<PlayerStat[]> {
  try {
    const roster = await getRoster(teamAbv);
    const officialReport = await fetchOfficialNBAInjuries([teamAbv]);
    return roster
      .filter((p) => {
        if (p.stats?.pts === undefined) return false;
        const designation = (p.injury?.designation ?? "").toLowerCase();
        if (designation === "out") return false;
        // Exclude players absent 7+ days with no active designation
        if (!designation && daysSinceLastGame(p.lastGamePlayed) !== null && daysSinceLastGame(p.lastGamePlayed)! >= 7) return false;
        // Exclude players listed Out/Doubtful on official NBA report
        const official = officialReport.get(p.longName.toLowerCase());
        if (official) {
          const s = official.status.toLowerCase();
          if (s.includes("out") || s.includes("doubtful")) return false;
        }
        return true;
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
 * Fetch injury report for both teams.
 * Three-layer enrichment:
 *   1. Official NBA injury report (most current, overrides Tank01)
 *   2. Tank01 roster designation (standard source)
 *   3. Absent-player detection (lastGamePlayed 7+ days, gamesPlayed < 50%)
 */
export async function getInjuryReport(
  homeAbv: string,
  awayAbv: string
): Promise<InjuryReport> {
  function enrichRoster(
    roster: RawRosterPlayer[],
    officialReport: Map<string, { status: string; comment: string }>,
    teamWins: number,
    teamLosses: number
  ): PlayerInjury[] {
    const result: PlayerInjury[] = [];
    const teamGames = teamWins + teamLosses;

    for (const p of roster) {
      const designation = (p.injury?.designation ?? "").trim();
      const official = officialReport.get(p.longName.toLowerCase());
      let status: PlayerInjury["status"] | null = null;
      let description = p.injury?.description ?? "";

      // Layer 1: Official NBA injury report (highest priority)
      if (official) {
        const s = official.status.toLowerCase();
        if (s.includes("out")) status = "Out";
        else if (s.includes("doubtful")) status = "Doubtful";
        else if (s.includes("questionable")) status = "Questionable";
        else status = "Day-To-Day";
        if (official.comment) description = official.comment;
      }
      // Layer 2: Tank01 designation
      else if (designation) {
        status = normalizeInjuryStatus(designation);
      }

      // Layer 3: Absent 7+ days with no active designation
      const daysAway = daysSinceLastGame(p.lastGamePlayed);
      if (!status && daysAway !== null && daysAway >= 7) {
        status = "Out";
        description = `Availability unconfirmed — last played ${formatLastPlayedDate(p.lastGamePlayed)}`;
      }

      if (!status) continue;

      // Append games-missed note if < 50% of team games
      const gp = parseInt(p.stats?.gamesPlayed ?? "0", 10);
      if (teamGames > 20 && gp > 0 && gp < teamGames * 0.5) {
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
    const [homeRoster, awayRoster, officialReport, teamMap] = await Promise.all([
      getRoster(homeAbv),
      getRoster(awayAbv),
      fetchOfficialNBAInjuries([homeAbv, awayAbv]),
      getTeamMap(),
    ]);

    const homeInfo = teamMap[homeAbv];
    const awayInfo = teamMap[awayAbv];
    const homeInjuries = enrichRoster(
      homeRoster, officialReport,
      parseInt(homeInfo?.wins ?? "0", 10), parseInt(homeInfo?.loss ?? "0", 10)
    );
    const awayInjuries = enrichRoster(
      awayRoster, officialReport,
      parseInt(awayInfo?.wins ?? "0", 10), parseInt(awayInfo?.loss ?? "0", 10)
    );

    console.log(`[injuries] ${homeAbv}: ${homeInjuries.map((p) => `${p.playerName} (${p.status})`).join(", ") || "none"}`);
    console.log(`[injuries] ${awayAbv}: ${awayInjuries.map((p) => `${p.playerName} (${p.status})`).join(", ") || "none"}`);
    return { homeInjuries, awayInjuries };
  } catch {
    return { homeInjuries: [], awayInjuries: [] };
  }
}

/**
 * Compute playoff context for both teams in a game.
 * Uses the full conference standings derived from /getNBATeams win/loss data.
 */
export async function getPlayoffContext(
  homeAbv: string,
  awayAbv: string
): Promise<{ home: PlayoffContext | null; away: PlayoffContext | null }> {
  try {
    const teamMap = await getTeamMap();
    const all = Object.values(teamMap);

    interface StandingRow {
      teamAbv: string;
      conference: string;
      wins: number;
      losses: number;
      winPct: number;
      streak: string;
    }

    const rows: StandingRow[] = all.map((t) => {
      const wins = parseInt(t.wins ?? "0", 10);
      const losses = parseInt(t.loss ?? "0", 10);
      const streak = t.currentStreak
        ? `${(t.currentStreak as { result: string; length: string | number }).result}${(t.currentStreak as { result: string; length: string | number }).length}`
        : "";
      return {
        teamAbv: t.teamAbv,
        conference: t.conference ?? "",
        wins,
        losses,
        winPct: wins + losses > 0 ? wins / (wins + losses) : 0,
        streak,
      };
    });

    const buildContext = (abv: string): PlayoffContext | null => {
      const team = rows.find((r) => r.teamAbv === abv);
      if (!team) return null;

      const confRows = rows
        .filter((r) => r.conference === team.conference)
        .sort((a, b) => b.winPct - a.winPct || b.wins - a.wins);

      const seed = confRows.findIndex((r) => r.teamAbv === abv) + 1;
      const gamesRemaining = Math.max(0, 82 - team.wins - team.losses);

      const gamesBack = (leader: StandingRow) =>
        parseFloat((((leader.wins - team.wins) + (team.losses - leader.losses)) / 2).toFixed(1));

      const leader = confRows[0];
      const sixth = confRows[5] ?? confRows[confRows.length - 1];
      const tenth = confRows[9] ?? confRows[confRows.length - 1];

      const gb1 = gamesBack(leader);
      const gb6 = seed <= 6 ? 0 : gamesBack(sixth);
      const gb10 = seed <= 10 ? 0 : gamesBack(tenth);

      // Clinched top-6: even if 6th-seed wins all remaining, team still holds 6th
      const clinched = (() => {
        if (seed > 6) return false;
        const sixthSeedBestWins = sixth.wins + (confRows[5] ? Math.max(0, 82 - sixth.wins - sixth.losses) : 0);
        return team.wins > sixthSeedBestWins;
      })();

      // Eliminated from play-in: even if team wins all remaining, can't reach 10th
      const eliminated = (() => {
        if (seed <= 10) return false;
        const teamBestWins = team.wins + gamesRemaining;
        return teamBestWins < tenth.wins;
      })();

      let playoffStatus: PlayoffStatus;
      if (clinched) playoffStatus = "clinched-playoff";
      else if (seed <= 6) playoffStatus = "in-playoff";
      else if (seed <= 10) playoffStatus = "play-in";
      else if (eliminated) playoffStatus = "eliminated";
      else playoffStatus = "play-in-contention";

      return {
        seed,
        conference: team.conference,
        gamesBack: gb1,
        gamesBackSix: gb6,
        gamesBackTen: gb10,
        gamesRemaining,
        playoffStatus,
        currentStreak: team.streak,
        clinched,
      };
    };

    return { home: buildContext(homeAbv), away: buildContext(awayAbv) };
  } catch {
    return { home: null, away: null };
  }
}

/**
 * Fetch season series H2H record between two teams.
 * Uses the home team's schedule and filters for games involving the away team.
 * homeAbv is the reference team — wins/losses are from their perspective.
 */
export async function getH2HRecord(
  homeAbv: string,
  awayAbv: string
): Promise<H2HRecord | null> {
  try {
    const raw = await fetchTank01<RawScheduleResponse>("/getNBATeamSchedule", {
      teamAbv: homeAbv,
      season: currentNBASeason(),
    });

    const schedule = raw.body?.schedule ?? [];
    const matchups = schedule.filter(
      (g) => g.homePts && g.awayPts && (g.home === awayAbv || g.away === awayAbv)
    );

    if (matchups.length === 0) return null;

    let wins = 0;
    let losses = 0;
    const marginsFor: number[] = [];
    const marginsAgainst: number[] = [];
    const games: H2HGame[] = [];

    for (const g of matchups) {
      const homePts = parseInt(g.homePts ?? "0", 10);
      const awayPts = parseInt(g.awayPts ?? "0", 10);
      // Determine if homeAbv was the home team in this particular game
      const refIsHome = g.home === homeAbv;
      const refPts = refIsHome ? homePts : awayPts;
      const oppPts = refIsHome ? awayPts : homePts;

      if (refPts > oppPts) {
        wins++;
        marginsFor.push(refPts - oppPts);
      } else {
        losses++;
        marginsAgainst.push(oppPts - refPts);
      }

      games.push({ date: g.gameDate, home: g.home, away: g.away, homePts, awayPts });
    }

    const avg = (arr: number[]) =>
      arr.length > 0 ? parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)) : 0;

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

/** Parse YYYYMMDD from lastGamePlayed ("20260406_PHI@SA") and return days since. */
function daysSinceLastGame(lastGamePlayed: string | undefined): number | null {
  if (!lastGamePlayed) return null;
  const dateStr = lastGamePlayed.split("_")[0];
  if (dateStr.length !== 8) return null;
  const y = parseInt(dateStr.slice(0, 4), 10);
  const m = parseInt(dateStr.slice(4, 6), 10) - 1;
  const d = parseInt(dateStr.slice(6, 8), 10);
  const diff = Date.now() - new Date(y, m, d).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/** Format YYYYMMDD portion of lastGamePlayed as "Apr 6". */
function formatLastPlayedDate(lastGamePlayed: string | undefined): string {
  if (!lastGamePlayed) return "unknown";
  const dateStr = lastGamePlayed.split("_")[0];
  if (dateStr.length !== 8) return "unknown";
  const m = parseInt(dateStr.slice(4, 6), 10);
  const d = parseInt(dateStr.slice(6, 8), 10);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[m - 1]} ${d}`;
}

/**
 * Fetch the official NBA injury report and return a map of
 * lowercased player name → { status, comment } for the given teams.
 * Gracefully returns empty map on any failure (endpoint may be access-restricted).
 */
async function fetchOfficialNBAInjuries(
  teamAbvs: string[]
): Promise<Map<string, { status: string; comment: string }>> {
  const result = new Map<string, { status: string; comment: string }>();
  try {
    const res = await fetch(
      "https://cdn.nba.com/static/json/liveData/injuryreport/injuryreport.json",
      {
        next: { revalidate: 900 },
        headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://www.nba.com/" },
      }
    );
    if (!res.ok) return result;
    const data = await res.json();

    // Defensive parsing: try common NBA API response shapes
    const players: Record<string, unknown>[] =
      data?.payload?.injuredPlayers ??
      data?.resultSets?.[0]?.rowSet ??
      (Array.isArray(data) ? data : []);

    const abvSet = new Set(teamAbvs.map((a) => a.toUpperCase()));

    for (const p of players) {
      const tricode = String(p.TeamTricode ?? p.teamTricode ?? p.Team ?? "").toUpperCase();
      if (!abvSet.has(tricode)) continue;

      const name = String(
        p.PlayerName ?? p.playerName ??
        `${p.FirstName ?? p.firstName ?? ""} ${p.LastName ?? p.lastName ?? ""}`.trim()
      );
      if (!name) continue;

      const status = String(p.GameStatus ?? p.Status ?? p.status ?? "");
      const comment = String(p.Comment ?? p.comment ?? p.Reason ?? p.reason ?? "");
      result.set(name.toLowerCase(), { status, comment });
    }
  } catch {
    // Non-critical — options 1 & 2 still protect against stale data
  }
  return result;
}
