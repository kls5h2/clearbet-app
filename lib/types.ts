// ─── Game Slate ──────────────────────────────────────────────────────────────

export type GameStatus = "scheduled" | "live" | "final";

export interface NBAGame {
  gameId: string;
  gameDate: string;
  gameTime: string; // e.g. "7:30 PM ET"
  gameStatus: GameStatus;
  homeTeam: Team;
  awayTeam: Team;
  odds: GameOdds | null;
}

export interface Team {
  teamId: string;
  teamAbv: string; // e.g. "LAL"
  teamName: string; // e.g. "Los Angeles Lakers"
  teamCity: string;
}

export interface GameOdds {
  spread: number | null; // negative = home favored, e.g. -4.5
  total: number | null; // over/under, e.g. 224.5
  homeMoneyline: number | null; // American odds, e.g. -180
  awayMoneyline: number | null;
  impliedHomeProbability: number | null; // 0–100
  impliedAwayProbability: number | null;
  spreadBookmaker: string;
  totalsBookmaker: string;
}

// ─── Game Detail Data (fed to Claude) ────────────────────────────────────────

export interface GameDetailData {
  game: NBAGame;
  homeTeamStats: TeamSeasonStats;
  awayTeamStats: TeamSeasonStats;
  homeRecentForm: RecentGame[];
  awayRecentForm: RecentGame[];
  injuries: InjuryReport;
}

export interface TeamSeasonStats {
  teamId: string;
  teamAbv: string;
  pointsPerGame: number;
  pointsAllowedPerGame: number;
  pace: number; // possessions per 48
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
}

export interface PlayerStat {
  playerName: string;
  position: string;
  pointsPerGame: number;
  assistsPerGame: number;
  reboundsPerGame: number;
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
  decisionLens: string;
  confidenceLevel: ConfidenceLevel;
  confidenceLabel: ConfidenceLabel;
  glossaryTerm: string;
  glossaryDefinition: string;
}

// ─── API Response shapes ──────────────────────────────────────────────────────

export interface GamesApiResponse {
  games: NBAGame[];
  date: string;
}

export interface BreakdownApiRequest {
  gameId: string;
}

export interface BreakdownApiResponse {
  breakdown: BreakdownResult;
  game: NBAGame;
}
