// Shared team color utilities — used by GameCard and BreakdownView

export const NBA_COLORS: Record<string, string> = {
  ATL: "#E03A3E", BOS: "#007A33", BKN: "#000000", CHA: "#1D1160",
  CHI: "#CE1141", CLE: "#860038", DAL: "#00538C", DEN: "#FEC524",
  DET: "#C8102E", GS:  "#1D428A", GSW: "#1D428A", HOU: "#CE1141",
  IND: "#002D62", LAC: "#C8102E", LAL: "#552583", MEM: "#5D76A9",
  MIA: "#98002E", MIL: "#00471B", MIN: "#0C2340", NO:  "#0C2340",
  NOP: "#0C2340", NY:  "#006BB6", NYK: "#006BB6", OKC: "#007AC1",
  ORL: "#0077C0", PHI: "#006BB6", PHX: "#E56020", POR: "#E03A3E",
  SAC: "#5A2D81", SA:  "#000000", SAS: "#000000", TOR: "#CE1141",
  UTA: "#002B5C", WAS: "#002B5C",
};

export const MLB_COLORS: Record<string, string> = {
  ARI: "#A71930", ATL: "#CE1141", BAL: "#DF4601", BOS: "#BD3039",
  CHC: "#0E3386", CWS: "#27251F", CIN: "#C6011F", CLE: "#00385D",
  COL: "#333366", DET: "#0C2340", HOU: "#002D62", KC:  "#004687",
  LAA: "#BA0021", LAD: "#005A9C", MIA: "#00A3E0", MIL: "#FFC52F",
  MIN: "#002B5C", NYM: "#002D72", NYY: "#003087",
  OAK: "#003831", ATH: "#003831", SAC: "#003831", LV:  "#003831", LAS: "#003831",
  PHI: "#E81828", PIT: "#FDB827", SD:  "#2F241D", SF:  "#FD5A1E",
  SEA: "#0C2C56", STL: "#C41E3A", TB:  "#092C5C", TEX: "#003278",
  TOR: "#134A8E", WSH: "#AB0003",
};

export function lighten(hex: string, amount: number): string {
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

/** Active display color: readable team color on white card */
export function getActiveTeamColor(teamAbv: string, sport: "NBA" | "MLB"): string {
  const raw = getRawColor(teamAbv, sport);
  if (raw === "#000000") return "#3A4A5A";
  const h = raw.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luminance < 0.2) return lighten(raw, 0.35);
  return raw;
}

/** Dead (final/live) display color: muted version blended toward slate */
export function getDeadTeamColor(teamAbv: string, sport: "NBA" | "MLB"): string {
  const raw = getRawColor(teamAbv, sport);
  if (raw === "#000000") return "#94A5BC";
  const h = raw.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const nr = 99; const ng = 122; const nb = 150;
  const mr = Math.round(r * 0.35 + nr * 0.65);
  const mg = Math.round(g * 0.35 + ng * 0.65);
  const mb = Math.round(b * 0.35 + nb * 0.65);
  return `#${mr.toString(16).padStart(2,"0")}${mg.toString(16).padStart(2,"0")}${mb.toString(16).padStart(2,"0")}`;
}

/** Tomorrow/preview color: same as dead */
export function getTomorrowTeamColor(teamAbv: string, sport: "NBA" | "MLB"): string {
  return getDeadTeamColor(teamAbv, sport);
}
