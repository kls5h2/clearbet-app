// ─── Sport ───────────────────────────────────────────────────────────────────

export type Sport = "NBA" | "MLB";

// ─── Shared ───────────────────────────────────────────────────────────────────

export type GameStatus = "scheduled" | "live" | "final" | "postponed";

export interface Team {
  teamId: string;
  teamAbv: string; // e.g. "LAL", "NYY"
  teamName: string; // e.g. "Los Angeles Lakers"
  teamCity: string;
}

export interface RecentGame {
  date: string;
  opponent: string;
  result: "W" | "L";
  teamScore: number;
  opponentScore: number;
  total: number;
}

export interface InjuryReport {
  homeInjuries: PlayerInjury[];
  awayInjuries: PlayerInjury[];
}

export interface PlayerInjury {
  playerName: string;
  position: string;
  status: "Out" | "Doubtful" | "Questionable" | "Day-To-Day";
  description: string;
  // true = authoritative source (ESPN/MLB Stats API); false/undefined = fallback source (Tank01)
  confirmed?: boolean;
}

// ─── Breakdown (Claude output) ────────────────────────────────────────────────

export type ConfidenceLevel = 1 | 2 | 3 | 4;
export type ConfidenceLabel = "CLEAR SPOT" | "LEAN" | "FRAGILE" | "PASS";
export type FragilityColor = "red" | "green" | "amber";

export interface KeyDriver {
  factor: string;
  weight: "primary" | "secondary";
  direction: "positive" | "negative" | "neutral";
}

export interface FragilityItem {
  item: string;
  color: FragilityColor;
}

export interface BreakdownResult {
  gameShape: string;
  keyDrivers: KeyDriver[];
  baseScript: string;
  fragilityCheck: FragilityItem[];
  marketRead: string;
  edge: string[];
  edgeClosingLine: string;
  decisionLens: string;
  cardSummary: string; // 2-sentence preview shown on slate cards
  shareHook: string;   // 1-sentence social share hook — most interesting data point, ≤120 chars
  confidenceLevel: ConfidenceLevel;
  confidenceLabel: ConfidenceLabel;
  glossaryTerm: string;
  glossaryDefinition: string;
  // New fields from revised prompt (optional — may not be present in cached breakdowns)
  signalGrade?: "A" | "B" | "C" | "D" | "F"; // data environment quality, separate from confidence
  earlyRead?: boolean;           // true when hoursUntilTip > 6 at generation time
  primaryUncertainty?: string;   // named variable for FRAGILE/PASS confidence levels
}

// ─── NBA ──────────────────────────────────────────────────────────────────────

export interface NBAGame {
  sport: "NBA";
  gameId: string;
  gameDate: string;
  gameTime: string;
  gameStatus: GameStatus;
  homeTeam: Team;
  awayTeam: Team;
  odds: GameOdds | null;
}

export interface GameOdds {
  spread: number | null;
  total: number | null;
  homeMoneyline: number | null;
  awayMoneyline: number | null;
  impliedHomeProbability: number | null;
  impliedAwayProbability: number | null;
  spreadBookmaker: string;
  totalsBookmaker: string;
}

export interface TeamSeasonStats {
  teamId: string;
  teamAbv: string;
  pointsPerGame: number;
  pointsAllowedPerGame: number;
  pace: number;
  offensiveRating: number;
  defensiveRating: number;
  reboundsPerGame: number;
  assistsPerGame: number;
  turnoversPerGame: number;
  threePointAttempts: number;
  threePointPct: number;
  wins: number;
  losses: number;
  topPlayers: PlayerStat[];
  lastUpdated?: string | null;
}

export interface PlayerStat {
  playerName: string;
  position: string;
  pointsPerGame: number;
  assistsPerGame: number;
  reboundsPerGame: number;
}

export type PlayoffStatus =
  | "clinched-playoff"   // mathematically guaranteed top-6 seed
  | "in-playoff"         // currently seeded 1–6
  | "play-in"            // currently seeded 7–10
  | "play-in-contention" // outside top 10 but not yet eliminated
  | "eliminated";        // cannot reach the play-in

export interface PlayoffContext {
  seed: number;                // current conference seed (1–15)
  conference: string;          // "Eastern Conference" | "Western Conference"
  gamesBack: number;           // games back from 1st in conference
  gamesBackSix: number;        // games back from 6th seed (last auto-playoff)
  gamesBackTen: number;        // games back from 10th seed (last play-in spot)
  gamesRemaining: number;      // games left in regular season (82-game schedule)
  playoffStatus: PlayoffStatus;
  currentStreak: string;       // e.g. "W4" or "L2"
  clinched: boolean;           // locked into top 6
}

export interface H2HGame {
  date: string;       // YYYYMMDD
  home: string;       // team abbv
  away: string;
  homePts: number;
  awayPts: number;
}

export interface H2HRecord {
  wins: number;         // wins for the reference team (home team in the breakdown)
  losses: number;
  games: H2HGame[];     // individual matchups, chronological
  avgMarginFor: number; // average point margin when reference team won
  avgMarginAgainst: number;
}

export interface LineMovement {
  spreadMovement: number | null;
  totalMovement: number | null;
  homeMLMovement: number | null;
  awayMLMovement: number | null;
  hoursTracked: number | null; // hours since first odds fetch for this game
}

export interface VerificationResult {
  verificationFlags: string[];
  confidenceLevelPreset: ConfidenceLevel | null;
  fragilityReason: string | null;
}

export interface GameDetailData {
  game: NBAGame;
  homeTeamStats: TeamSeasonStats;
  awayTeamStats: TeamSeasonStats;
  homeRecentForm: RecentGame[];
  awayRecentForm: RecentGame[];
  injuries: InjuryReport; // Tank01 — retained only as emergency fallback; NBA prompt uses ESPN
  espnInjuries: import("./espn-nba-injuries").ESPNInjuryResult;
  espnSeries: import("./espn-nba-series").ESPNSeriesResult;
  homePlayoffContext: PlayoffContext | null;
  awayPlayoffContext: PlayoffContext | null;
  h2h: H2HRecord | null;
  lineMovement: LineMovement | null;
  verification: VerificationResult;
  // TODO: Add these once Tank01 getRoster() is wired into the breakdown route
  homeRoster?: string[]; // confirmed active players — from Tank01 getRoster()
  awayRoster?: string[]; // confirmed active players — from Tank01 getRoster()
}

// ─── MLB ──────────────────────────────────────────────────────────────────────

export interface MLBPitcher {
  name: string;
  seasonERA: number | null;
  recentERA: number | null;
  hand: "L" | "R" | null;
  seasonSO: number | null;
  seasonBB: number | null;
  seasonWHIP: number | null;
  seasonHR: number | null;
  seasonIP: number | null;
  // true = listed as probablePitcher by MLB Stats API (authoritative — overrides Tank01 injury data)
  // false / undefined = Tank01 roster fallback (treat as UNCONFIRMED)
  confirmed?: boolean;
}

export interface MLBGame {
  sport: "MLB";
  gameId: string;
  gameDate: string;
  gameTime: string;
  gameStatus: GameStatus;
  homeTeam: Team;
  awayTeam: Team;
  odds: MLBGameOdds | null;
  homePitcher: MLBPitcher | null;
  awayPitcher: MLBPitcher | null;
}

export interface MLBGameOdds {
  homeMoneyline: number | null;
  awayMoneyline: number | null;
  runLine: number | null; // home run line, typically -1.5
  total: number | null;
  impliedHomeProbability: number | null;
  impliedAwayProbability: number | null;
}

export interface MLBTeamStats {
  teamAbv: string;
  wins: number;
  losses: number;
  runsPerGame: number;
  runsAllowedPerGame: number;
  teamERA: number;
  topHitters: MLBHitterStat[];
}

export interface MLBHitterStat {
  playerName: string;
  position: string;
  battingAverage: number;
  homeRuns: number;
  rbi: number;
  ops: number;
  stolenBases: number;
  walks: number;
}

export interface MLBPlayoffContext {
  division: string;               // "AL East", "NL West"
  leagueName: string;             // "American League" | "National League"
  divisionRank: number;           // 1–5
  divisionRecord: string;         // "4-2" (record within division)
  gamesBackDivision: number;      // 0 if leading division
  wildCardRank: number | null;    // rank among WC candidates; null if division leader
  gamesBackWildCard: number | null; // 0 if in WC; null if division leader
  wins: number;
  losses: number;
}

export interface MLBBullpenStats {
  era7Day: number | null;         // team pitching ERA last 7 days
  saves: number;
  saveOpportunities: number;
  blownSaves: number;
}

export interface MLBParkFactor {
  parkName: string;
  factor: "high" | "low";
}

export interface MLBUmpire {
  name: string;
  tendency: "pitcher-friendly" | "hitter-friendly" | null; // null = no data / neutral
}

export interface MLBGameDetailData {
  game: MLBGame;
  homeTeamStats: MLBTeamStats;
  awayTeamStats: MLBTeamStats;
  homeRecentForm: RecentGame[];
  awayRecentForm: RecentGame[];
  injuries: InjuryReport;
  homePlayoffContext: MLBPlayoffContext | null;
  awayPlayoffContext: MLBPlayoffContext | null;
  homeBullpen: MLBBullpenStats | null;
  awayBullpen: MLBBullpenStats | null;
  h2h: H2HRecord | null;
  parkFactor: MLBParkFactor | null;
  umpire: MLBUmpire | null;
  lineMovement: LineMovement | null;
  verification: VerificationResult;
  homeRoster?: string[];
  awayRoster?: string[];
}

// ─── Union type used by GameCard and BreakdownView ────────────────────────────

export type AnyGame = NBAGame | MLBGame;

// ─── API Response shapes ──────────────────────────────────────────────────────

export interface GamesApiResponse {
  games: NBAGame[];
  date: string;
  sport: "NBA";
}

export interface MLBGamesApiResponse {
  games: MLBGame[];
  date: string;
  sport: "MLB";
}

export interface BreakdownApiRequest {
  gameId: string;
  sport: Sport;
  regenerate?: boolean; // if true, bypass cache and generate fresh
}

export interface BreakdownApiResponse {
  breakdown: BreakdownResult | null;   // null only when gated === "cap" | "mlb"
  game: AnyGame;
  sport: Sport;
  fromCache: boolean;
  generatedAt: string | null;          // ISO timestamp of when the breakdown was created
  tier?: "free" | "pro";               // so the client can gate Share / Regenerate UI
  gated?: "cap" | "mlb";               // soft gate reason — when present, breakdown is null and client renders the blurred preview
}
