/**
 * Shared team color utilities used by GameCard and BreakdownView.
 */

const NBA_COLORS: Record<string, string> = {
  ATL: "#E03A3E", BOS: "#007A33", BKN: "#000000", CHA: "#1D1160",
  CHI: "#CE1141", CLE: "#860038", DAL: "#00538C", DEN: "#FEC524",
  DET: "#C8102E", GS:  "#1D428A", GSW: "#1D428A", HOU: "#CE1141",
  IND: "#002D62", LAC: "#C8102E", LAL: "#552583", MEM: "#5D76A9",
  MIA: "#98002E", MIL: "#00471B", MIN: "#0C2340", NO:  "#0C2340",
  NOP: "#0C2340", NY:  "#006BB6", NYK: "#006BB6", OKC: "#007AC1",
  ORL: "#0077C0", PHI: "#006BB6", PHX: "#1D1160", POR: "#E03A3E",
  SAC: "#5A2D81", SA:  "#1D1160", SAS: "#1D1160", TOR: "#CE1141",
  UTA: "#002B5C", WAS: "#002B5C",
};

const MLB_COLORS: Record<string, string> = {
  ARI: "#A71930", ATL: "#CE1141", BAL: "#DF4601", BOS: "#BD3039",
  CHC: "#0E3386", CWS: "#27251F", CIN: "#C6011F", CLE: "#00385D",
  COL: "#333366", DET: "#0C2340", HOU: "#002D62", KC:  "#004687",
  LAA: "#BA0021", LAD: "#005A9C", MIA: "#00A3E0", MIL: "#FFC52F",
  MIN: "#002B5C", NYM: "#002D72", NYY: "#003087",
  OAK: "#003831", ATH: "#003831", LV: "#003831", LAS: "#003831",
  PHI: "#E81828", PIT: "#FDB827", SD:  "#2F241D", SF:  "#FD5A1E",
  SEA: "#0C2C56", STL: "#C41E3A", TB:  "#092C5C", TEX: "#003278",
  TOR: "#134A8E", WSH: "#AB0003",
};

const NBA_LIGHTEN = new Set(["BKN", "IND", "MIN", "NO", "NOP", "UTA", "WAS"]);
const MLB_LIGHTEN = new Set(["CHC", "CLE", "COL", "DET", "HOU", "KC", "MIN", "NYM", "NYY", "OAK", "ATH", "LV", "LAS", "SD", "SEA", "TB", "TEX", "WSH", "CWS"]);

export function lighten(hex: string, amount = 0.4): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const l = (c: number) => Math.round(c + (255 - c) * amount).toString(16).padStart(2, "0");
  return `#${l(r)}${l(g)}${l(b)}`;
}

export function getRawColor(teamAbv: string, sport: "NBA" | "MLB"): string {
  const map = sport === "MLB" ? MLB_COLORS : NBA_COLORS;
  return map[teamAbv] ?? "#0A7A6C";
}

/** Display color: team color blended with navy for readability on white cards. */
export function getTeamDisplayColor(teamAbv: string, sport: "NBA" | "MLB"): string {
  const raw = getRawColor(teamAbv, sport);
  const lightenSet = sport === "MLB" ? MLB_LIGHTEN : NBA_LIGHTEN;
  if (lightenSet.has(teamAbv)) return lighten(raw, 0.35);
  if (raw === "#000000") return "#4a4a4a";
  const navy = { r: 0x0D, g: 0x1B, b: 0x2E };
  const h = raw.replace("#", "");
  const tr = parseInt(h.slice(0, 2), 16);
  const tg = parseInt(h.slice(2, 4), 16);
  const tb = parseInt(h.slice(4, 6), 16);
  const mix = (team: number, base: number) =>
    Math.round(team * 0.7 + base * 0.3).toString(16).padStart(2, "0");
  return `#${mix(tr, navy.r)}${mix(tg, navy.g)}${mix(tb, navy.b)}`;
}

/** Preview/tomorrow color: team color lightened significantly for muted appearance. */
export function getPreviewTeamColor(teamAbv: string, sport: "NBA" | "MLB"): string {
  return lighten(getRawColor(teamAbv, sport), 0.58);
}
