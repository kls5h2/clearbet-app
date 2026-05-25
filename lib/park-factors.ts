// Park factors sourced from FanGraphs Guts tool, 3-year column
// Last verified: May 2025. Review annually before each season.
// Source: fangraphs.com/tools/guts?type=pf

/**
 * MLB park factors — single source of truth for all 30 teams.
 *
 * hrFactor:  HR park factor. 100 = league average. > 100 = more HRs, < 100 = fewer.
 * runFactor: Overall run-scoring factor. 100 = league average.
 *
 * Source: FanGraphs Guts tool, 3-year column (2025 season page).
 * Hardcoded — update annually. Keys are Tank01 team abbreviations (primary lookup
 * path), with MLB Stats API abbreviation aliases where they differ (CWS, WSH, ATH).
 */

import type { MLBParkFactor } from "./types";

export const PARK_FACTORS: Record<string, MLBParkFactor> = {
  // ── AL East ───────────────────────────────────────────────────────────────
  BAL: {
    stadiumName: "Camden Yards",
    hrFactor: 107, runFactor: 104, tag: "hitter-friendly",
    note: "Right-field dimensions and dense mid-Atlantic air keep run totals above average",
  },
  BOS: {
    stadiumName: "Fenway Park",
    hrFactor: 103, runFactor: 104, tag: "neutral",
    note: "Elevates doubles and hits more than HR — the Green Monster boosts contact production, not power",
  },
  NYY: {
    stadiumName: "Yankee Stadium",
    hrFactor: 85, runFactor: 96, tag: "pitcher-friendly",
    note: "Yankee Stadium — HR factor lower than reputation suggests by recent data; mild run suppression",
  },
  TB: {
    stadiumName: "Tropicana Field",
    hrFactor: 95, runFactor: 97, tag: "neutral",
    note: "Controlled dome and artificial turf produce a stable, slightly below-average scoring environment",
  },
  TOR: {
    stadiumName: "Rogers Centre",
    hrFactor: 100, runFactor: 100, tag: "neutral",
    note: "Domed stadium with artificial turf plays close to league average in both HR and run factors",
  },

  // ── AL Central ────────────────────────────────────────────────────────────
  CHW: {
    stadiumName: "Guaranteed Rate Field",
    hrFactor: 99, runFactor: 100, tag: "neutral",
    note: "No significant park effect in either direction — plays close to league average",
  },
  CLE: {
    stadiumName: "Progressive Field",
    hrFactor: 95, runFactor: 97, tag: "neutral",
    note: "Slightly suppresses run scoring and HR; cool Lake Erie air is a minor factor in open months",
  },
  DET: {
    stadiumName: "Comerica Park",
    hrFactor: 97, runFactor: 99, tag: "neutral",
    note: "Deep outfield walls suppress HR slightly — overall run environment near league average",
  },
  KC: {
    stadiumName: "Kauffman Stadium",
    hrFactor: 97, runFactor: 99, tag: "neutral",
    note: "Spacious outfield and cool nights produce mildly below-average scoring",
  },
  MIN: {
    stadiumName: "Target Field",
    hrFactor: 98, runFactor: 100, tag: "neutral",
    note: "Cold early-season conditions depress scoring in April-May; otherwise plays close to average",
  },

  // ── AL West ───────────────────────────────────────────────────────────────
  HOU: {
    stadiumName: "Daikin Park",
    hrFactor: 109, runFactor: 104, tag: "hitter-friendly",
    note: "Crawford Boxes in left field create elevated HR rates, particularly for right-handed power hitters",
  },
  LAA: {
    stadiumName: "Angel Stadium",
    hrFactor: 97, runFactor: 99, tag: "neutral",
    note: "Coastal air and standard dimensions produce a near-neutral run environment",
  },
  // Sutter Health Park — 2025 season only; limited data, monitor for updates
  OAK: {
    stadiumName: "Sutter Health Park (Sacramento)",
    hrFactor: 96, runFactor: 105, tag: "neutral",
    note: "Sutter Health Park — slight run inflation, HR near neutral; limited data (2025 only)",
  },
  SEA: {
    stadiumName: "T-Mobile Park",
    hrFactor: 79, runFactor: 92, tag: "extreme pitcher-friendly",
    note: "T-Mobile Park — significant HR and run suppression; one of the most pitcher-friendly parks in MLB",
  },
  TEX: {
    stadiumName: "Globe Life Field",
    hrFactor: 103, runFactor: 102, tag: "neutral",
    note: "Retractable roof moderates Texas heat and wind — plays close to neutral across conditions",
  },

  // ── NL East ───────────────────────────────────────────────────────────────
  ATL: {
    stadiumName: "Truist Park",
    hrFactor: 103, runFactor: 102, tag: "neutral",
    note: "Mild hitter's tendency with consistent conditions — no extreme park effects",
  },
  MIA: {
    stadiumName: "loanDepot park",
    hrFactor: 95, runFactor: 96, tag: "pitcher-friendly",
    note: "Suppresses scoring despite retractable roof — one of the lower run environments in the NL",
  },
  NYM: {
    stadiumName: "Citi Field",
    hrFactor: 92, runFactor: 95, tag: "pitcher-friendly",
    note: "Spacious outfield suppresses power, especially to center and left fields",
  },
  PHI: {
    stadiumName: "Citizens Bank Park",
    hrFactor: 102, runFactor: 102, tag: "neutral",
    note: "Citizens Bank Park — near-neutral across all factors by 3-year average",
  },
  WAS: {
    stadiumName: "Nationals Park",
    hrFactor: 99, runFactor: 100, tag: "neutral",
    note: "Plays close to league average across both HR and run factors",
  },

  // ── NL Central ────────────────────────────────────────────────────────────
  CHC: {
    stadiumName: "Wrigley Field",
    hrFactor: 97, runFactor: 98, tag: "neutral",
    note: "Wind is the dominant variable — can play strongly hitter or pitcher-friendly on any given night",
  },
  CIN: {
    stadiumName: "Great American Ball Park",
    hrFactor: 114, runFactor: 102, tag: "hitter-friendly",
    note: "Great American Ball Park — elevated HR environment, run factor near neutral",
  },
  MIL: {
    stadiumName: "American Family Field",
    hrFactor: 101, runFactor: 101, tag: "neutral",
    note: "Retractable roof keeps conditions consistent — plays near league average in both factors",
  },
  PIT: {
    stadiumName: "PNC Park",
    hrFactor: 91, runFactor: 96, tag: "pitcher-friendly",
    note: "Expansive outfield with deep power alleys suppresses home runs significantly",
  },
  STL: {
    stadiumName: "Busch Stadium",
    hrFactor: 97, runFactor: 98, tag: "neutral",
    note: "Spacious outfield plays slightly pitcher-friendly for power — overall run environment near average",
  },

  // ── NL West ───────────────────────────────────────────────────────────────
  ARI: {
    stadiumName: "Chase Field",
    hrFactor: 91, runFactor: 100, tag: "pitcher-friendly",
    note: "Chase Field — suppresses HR despite warm climate; run environment is neutral",
  },
  COL: {
    stadiumName: "Coors Field",
    hrFactor: 135, runFactor: 114, tag: "extreme hitter-friendly",
    note: "Coors Field — altitude and air density inflate HR and run scoring significantly; most extreme park in MLB",
  },
  LAD: {
    stadiumName: "Dodger Stadium",
    hrFactor: 110, runFactor: 98, tag: "hitter-friendly",
    note: "Dodger Stadium — HR-friendly, slight run suppression overall",
  },
  SD: {
    stadiumName: "Petco Park",
    hrFactor: 87, runFactor: 91, tag: "extreme pitcher-friendly",
    note: "Marine layer and spacious outfield make this one of the most run-suppressive environments in MLB",
  },
  SF: {
    stadiumName: "Oracle Park",
    hrFactor: 86, runFactor: 91, tag: "extreme pitcher-friendly",
    note: "Wind off McCovey Cove and dense bay air consistently suppress both HR rates and overall run scoring",
  },

  // ── Abbreviation aliases ──────────────────────────────────────────────────
  // MLB Stats API uses different abbreviations than Tank01 for three teams.
  // These aliases ensure lookups succeed regardless of which source provides teamAbv.
  CWS: { stadiumName: "Guaranteed Rate Field",          hrFactor:  99, runFactor: 100, tag: "neutral",                  note: "No significant park effect in either direction — plays close to league average" },
  WSH: { stadiumName: "Nationals Park",                 hrFactor:  99, runFactor: 100, tag: "neutral",                  note: "Plays close to league average across both HR and run factors" },
  ATH: { stadiumName: "Sutter Health Park (Sacramento)", hrFactor:  96, runFactor: 105, tag: "neutral",                  note: "Sutter Health Park — slight run inflation, HR near neutral; limited data (2025 only)" },
};
