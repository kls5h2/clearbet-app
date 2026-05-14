/**
 * Batter scoring function + park HR factor constants.
 *
 * Step 1 verification (Tank01 /getMLBTeamRoster?getStats=true):
 *   CONFIRMED present: bats, stats.Hitting.HR, stats.Hitting.AB, stats.Hitting.avg,
 *                      stats.Hitting.OPS, stats.Hitting.BB, stats.Hitting.TB
 *   MISSING: PA (approximated as AB + BB), SLG (derived from TB/AB)
 */

// Numeric HR park factors — keyed by team abbreviation (home team).
// Source: multi-year HR index data. Default for unlisted parks: 100.
export const TEAM_TO_PARK_FACTOR: Record<string, number> = {
  LAD: 129,  // Dodger Stadium
  CIN: 122,  // Great American Ball Park
  NYY: 117,  // Yankee Stadium
  HOU: 115,  // Minute Maid Park / Daikin Park
  BAL: 108,  // Camden Yards
  TEX: 106,  // Globe Life Field
  ATL: 103,  // Truist Park
  MIL: 102,  // American Family Field
  BOS: 101,  // Fenway Park
  MIN: 100,  // Target Field
  TOR: 100,  // Rogers Centre
  CWS: 100,  // Guaranteed Rate Field
  STL:  99,  // Busch Stadium
  CHC:  98,  // Wrigley Field
  SEA:  97,  // T-Mobile Park
  MIA:  97,  // loanDepot park
  ARI:  96,  // Chase Field
  NYM:  95,  // Citi Field
  SF:   94,  // Oracle Park
  PIT:  93,  // PNC Park
  SD:   92,  // Petco Park
  OAK:  82,  // Oakland Coliseum
  ATH:  82,  // Athletics (alternate abbreviation)
};

export const DEFAULT_PARK_FACTOR = 100;

export interface BatterInput {
  playerName: string;
  bats: "L" | "R" | "S" | null;
  hr: number;
  ab: number;
  pa: number;              // approximated as AB + BB when PA not directly available
  barrel_rate: number | null;   // 0.0–1.0
  hard_hit_pct: number | null;  // 0.0–1.0
}

export interface PitcherInput {
  throws: "L" | "R" | null;
  hr_per_9: number | null;
}

export interface BatterScore {
  score: number;
  flags: string[];
}

export interface BatterSignal {
  playerName: string;
  teamAbv: string;
  hr: number;
  bats: "L" | "R" | "S" | null;
  pitcherThrows: "L" | "R" | null;
  barrelRate: number | null;   // 0.0–1.0
  hardHitPct: number | null;   // 0.0–1.0
  score: number;
  flags: string[];
  lineupConfirmed: boolean;
}

export function scoreBatter(
  batter: BatterInput,
  pitcher: PitcherInput,
  parkFactor: number,
): BatterScore {
  let score = 0;
  const flags: string[] = [];

  // 1. Pitcher HR rate (HR/9)
  if (pitcher.hr_per_9 !== null) {
    if (pitcher.hr_per_9 >= 1.5) { score += 3; flags.push("pitcher leaks HRs heavily"); }
    else if (pitcher.hr_per_9 >= 1.2) { score += 2; flags.push("pitcher HR rate elevated"); }
  }

  // 2. Handedness matchup — opposite hand = platoon advantage
  const pitcherThrows = pitcher.throws;
  const batterStands = batter.bats;
  if (pitcherThrows && batterStands) {
    const effectiveStand = batterStands === "S"
      ? (pitcherThrows === "L" ? "R" : "L")  // switch hitter bats opposite
      : batterStands;
    if (effectiveStand !== pitcherThrows) {
      score += 2;
      flags.push(`${effectiveStand}HB vs ${pitcherThrows}HP platoon advantage`);
    }
  }

  // 3. Park factor
  if (parkFactor >= 120) { score += 3; flags.push(`elite HR park (${parkFactor})`); }
  else if (parkFactor >= 110) { score += 2; flags.push(`hitter-friendly park (${parkFactor})`); }
  else if (parkFactor >= 105) { score += 1; flags.push(`slight HR park edge (${parkFactor})`); }
  else if (parkFactor <= 90) { score -= 2; flags.push(`pitcher park suppresses HRs (${parkFactor})`); }

  // 4. Barrel rate (Statcast)
  if (batter.barrel_rate !== null) {
    if (batter.barrel_rate >= 0.15) { score += 3; flags.push(`elite barrel rate (${(batter.barrel_rate * 100).toFixed(1)}%)`); }
    else if (batter.barrel_rate >= 0.10) { score += 2; flags.push("strong barrel rate"); }
    else if (batter.barrel_rate >= 0.07) { score += 1; flags.push("above-avg barrel rate"); }
  }

  // 5. Hard hit %
  if (batter.hard_hit_pct !== null) {
    if (batter.hard_hit_pct >= 0.50) { score += 2; flags.push(`hard hit rate ${(batter.hard_hit_pct * 100).toFixed(0)}%`); }
    else if (batter.hard_hit_pct >= 0.40) { score += 1; }
  }

  // 6. Season HR pace
  const denominator = Math.max(batter.pa > 0 ? batter.pa : batter.ab, 1);
  const hrPerPA = batter.hr / denominator;
  if (hrPerPA >= 0.06) { score += 2; flags.push(`high HR rate (1 per ${Math.round(1 / hrPerPA)} PA)`); }
  else if (hrPerPA >= 0.04) { score += 1; }

  // 7. Extreme pitcher-park cap — even elite batters capped at 4 in severe suppressor
  if (parkFactor <= 85) { score = Math.min(score, 4); }

  return { score, flags };
}

/**
 * Compute HR/9 from a pitcher's season HR allowed and innings pitched.
 * Returns null if data is insufficient.
 */
export function calcHrPer9(seasonHR: number | null, seasonIP: number | null): number | null {
  if (seasonHR === null || seasonIP === null || seasonIP < 10) return null;
  return (seasonHR / seasonIP) * 9;
}
