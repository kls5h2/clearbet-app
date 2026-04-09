// ─── Sport ───────────────────────────────────────────────────────────────────

export type Sport = "NBA" | "MLB";

// ─── Shared ───────────────────────────────────────────────────────────────────

export type GameStatus = "scheduled" | "live" | "final";

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
}

export interface PlayerStat {
  playerName: string;
  position: string;
  pointsPerGame: number;
  assistsPerGame: number;
  reboundsPerGame: number;
}

export interface GameDetailData {
  game: NBAGame;
  homeTeamStats: TeamSeasonStats;
  awayTeamStats: TeamSeasonStats;
  homeRecentForm: RecentGame[];
  awayRecentForm: RecentGame[];
  injuries: InjuryReport;
}

// ─── MLB ──────────────────────────────────────────────────────────────────────

export interface MLBPitcher {
  name: string;
  seasonERA: number;
  recentERA: number | null; // last 3 starts ERA
  hand: "L" | "R" | null;
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
}

export interface MLBGameDetailData {
  game: MLBGame;
  homeTeamStats: MLBTeamStats;
  awayTeamStats: MLBTeamStats;
  homeRecentForm: RecentGame[];
  awayRecentForm: RecentGame[];
  injuries: InjuryReport;
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
}

export interface BreakdownApiResponse {
  breakdown: BreakdownResult;
  game: AnyGame;
  sport: Sport;
}
