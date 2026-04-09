"use client";

import type { AnyGame, GameStatus } from "@/lib/types";

// ─── NBA team colors ──────────────────────────────────────────────────────────
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

// ─── MLB team colors ──────────────────────────────────────────────────────────
const MLB_COLORS: Record<string, string> = {
  ARI: "#A71930", ATL: "#CE1141", BAL: "#DF4601", BOS: "#BD3039",
  CHC: "#0E3386", CWS: "#27251F", CIN: "#C6011F", CLE: "#00385D",
  COL: "#333366", DET: "#0C2340", HOU: "#002D62", KC:  "#004687",
  LAA: "#BA0021", LAD: "#005A9C", MIA: "#00A3E0", MIL: "#FFC52F",
  MIN: "#002B5C", NYM: "#002D72", NYY: "#003087", OAK: "#003831",
  PHI: "#E81828", PIT: "#FDB827", SD:  "#2F241D", SF:  "#FD5A1E",
  SEA: "#0C2C56", STL: "#C41E3A", TB:  "#092C5C", TEX: "#003278",
  TOR: "#134A8E", WSH: "#AB0003",
};

// Teams whose colors need lightening for the border (too dark against white)
const NBA_LIGHTEN = new Set(["BKN", "IND", "MIN", "NO", "NOP", "UTA", "WAS"]);
const MLB_LIGHTEN = new Set(["CHC", "CLE", "COL", "DET", "HOU", "KC", "MIN", "NYM", "NYY", "OAK", "SD", "SEA", "TB", "TEX", "WSH", "CWS"]);

function lighten(hex: string, amount = 0.4): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const l = (c: number) => Math.round(c + (255 - c) * amount).toString(16).padStart(2, "0");
  return `#${l(r)}${l(g)}${l(b)}`;
}

function getRawColor(teamAbv: string, sport: "NBA" | "MLB"): string {
  const map = sport === "MLB" ? MLB_COLORS : NBA_COLORS;
  return map[teamAbv] ?? "#0A7A6C";
}

function getBorderColor(teamAbv: string, sport: "NBA" | "MLB"): string {
  const raw = getRawColor(teamAbv, sport);
  const lightenSet = sport === "MLB" ? MLB_LIGHTEN : NBA_LIGHTEN;
  if (lightenSet.has(teamAbv)) return lighten(raw);
  if (raw === "#000000") return "#4a4a4a";
  return raw;
}

function getMutedTextColor(teamAbv: string, sport: "NBA" | "MLB"): string {
  const raw = getRawColor(teamAbv, sport);
  const navy = { r: 0x0D, g: 0x1B, b: 0x2E };
  const h = raw.replace("#", "");
  const tr = parseInt(h.slice(0, 2), 16);
  const tg = parseInt(h.slice(2, 4), 16);
  const tb = parseInt(h.slice(4, 6), 16);
  const mix = (team: number, base: number) =>
    Math.round(team * 0.7 + base * 0.3).toString(16).padStart(2, "0");
  return `#${mix(tr, navy.r)}${mix(tg, navy.g)}${mix(tb, navy.b)}`;
}

interface Props {
  game: AnyGame;
  onClick: (gameId: string) => void;
}

/**
 * Generate a one-line game signal from spread and total.
 * Rule-based only — no API call. Returns null when no odds or game is not scheduled.
 */
function getGameSignal(
  spread: number | null,
  total: number | null,
  isMLB: boolean
): string | null {
  // For MLB run line is always ±1.5 — spread signal doesn't apply meaningfully
  if (isMLB) {
    if (total === null) return null;
    if (total >= 9.5) return "High-scoring environment expected";
    if (total <= 7) return "Low-scoring game — pitching will decide this";
    return null;
  }

  const absSpread = spread !== null ? Math.abs(spread) : null;

  let spreadSignal: string | null = null;
  if (absSpread !== null) {
    if (absSpread >= 10) spreadSignal = "Large favorite — outcome likely decided early";
    else if (absSpread >= 5) spreadSignal = "Clear favorite with room for the underdog";
    else if (absSpread >= 2) spreadSignal = "Competitive game — either side has a real path";
    else spreadSignal = "Too close to call on paper — environment matters more than matchup";
  }

  let totalSignal: string | null = null;
  if (total !== null) {
    if (total >= 230) totalSignal = "high-scoring environment";
    else if (total <= 209) totalSignal = "defensive game — scoring at a premium";
  }

  if (spreadSignal && totalSignal) {
    // Combine: swap the spread signal ending with a total qualifier
    if (totalSignal === "high-scoring environment") {
      return spreadSignal.replace(" — ", " in a high-scoring environment — ");
    }
    return `${spreadSignal}. ${totalSignal.charAt(0).toUpperCase() + totalSignal.slice(1)}.`;
  }
  if (totalSignal === "high-scoring environment") return "High-scoring environment expected";
  if (totalSignal) return `Defensive game — scoring will be at a premium`;
  return spreadSignal;
}

function formatML(ml: number | null): string {
  if (ml === null) return "—";
  return ml > 0 ? `+${ml}` : `${ml}`;
}

function formatSpread(spread: number | null, teamAbv: string): string {
  if (spread === null) return "—";
  const s = spread > 0 ? `+${spread}` : `${spread}`;
  return `${teamAbv} ${s}`;
}

function formatTotal(total: number | null, label = "O/U"): string {
  if (total === null) return "—";
  return `${label} ${total}`;
}

/**
 * Derive effective game status using Tank01 data, falling back to
 * client-side clock comparison when the API still says "scheduled."
 * "Get breakdown" only shows for games where current time is before start time —
 * this is correct and intentional; breakdowns are pre-game only.
 */
function getEffectiveStatus(apiStatus: GameStatus, gameTime: string): GameStatus {
  if (apiStatus !== "scheduled") return apiStatus;
  if (!gameTime) return apiStatus;

  const match = gameTime.match(/^(\d{1,2}):(\d{2})\s+(AM|PM)\s+ET$/i);
  if (!match) return apiStatus;

  let gameHour = parseInt(match[1], 10);
  const gameMins = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === "PM" && gameHour !== 12) gameHour += 12;
  if (ampm === "AM" && gameHour === 12) gameHour = 0;

  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const currentHour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const currentMin = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);

  const minutesPast = currentHour * 60 + currentMin - (gameHour * 60 + gameMins);
  if (minutesPast <= 0) return "scheduled";
  if (minutesPast > 180) return "final";
  return "live";
}

export default function GameCard({ game, onClick }: Props) {
  const { homeTeam, awayTeam, gameTime, gameStatus } = game;
  const sport = game.sport;

  const effectiveStatus = getEffectiveStatus(gameStatus, gameTime);
  const isClickable = effectiveStatus === "scheduled";

  const spread = game.odds && "spread" in game.odds ? game.odds.spread : null;
  const runLine = game.odds && "runLine" in game.odds ? game.odds.runLine : null;
  const total = game.odds?.total ?? null;
  const signalSpread = sport === "MLB" ? runLine : spread;
  const signal = effectiveStatus === "scheduled"
    ? getGameSignal(signalSpread, total, sport === "MLB")
    : null;

  const borderGradient = `linear-gradient(to right, ${getBorderColor(awayTeam.teamAbv, sport)} 50%, ${getBorderColor(homeTeam.teamAbv, sport)} 50%)`;
  const awayTextColor = getMutedTextColor(awayTeam.teamAbv, sport);
  const homeTextColor = getMutedTextColor(homeTeam.teamAbv, sport);

  // Odds row content differs by sport
  const oddsRow = (() => {
    if (!game.odds) return null;
    if (sport === "MLB") {
      const o = game.odds;
      return (
        <div className="px-5 py-3 bg-[#F4F6F9] border-t border-[#E0E5EE] flex items-center justify-between">
          <div className="text-center">
            <p className="font-mono text-[10px] font-medium text-[#6B7A90] uppercase tracking-widest mb-0.5">Run Line</p>
            <p className="font-mono text-[15px] font-semibold text-[#0D1B2E]">{formatSpread(o.runLine, homeTeam.teamAbv)}</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-[10px] font-medium text-[#6B7A90] uppercase tracking-widest mb-0.5">Total</p>
            <p className="font-mono text-[15px] font-semibold text-[#0D1B2E]">{formatTotal(o.total, "O/U")}</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-[10px] font-medium text-[#6B7A90] uppercase tracking-widest mb-0.5">{awayTeam.teamAbv} ML</p>
            <p className="font-mono text-[15px] font-semibold text-[#0D1B2E]">{formatML(o.awayMoneyline)}</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-[10px] font-medium text-[#6B7A90] uppercase tracking-widest mb-0.5">{homeTeam.teamAbv} ML</p>
            <p className="font-mono text-[15px] font-semibold text-[#0D1B2E]">{formatML(o.homeMoneyline)}</p>
          </div>
        </div>
      );
    }
    // NBA
    const o = game.odds;
    return (
      <div className="px-5 py-3 bg-[#F4F6F9] border-t border-[#E0E5EE] flex items-center justify-between">
        <div className="text-center">
          <p className="font-mono text-[10px] font-medium text-[#6B7A90] uppercase tracking-widest mb-0.5">Spread</p>
          <p className="font-mono text-[15px] font-semibold text-[#0D1B2E]">{formatSpread(o.spread, homeTeam.teamAbv)}</p>
        </div>
        <div className="text-center">
          <p className="font-mono text-[10px] font-medium text-[#6B7A90] uppercase tracking-widest mb-0.5">Total</p>
          <p className="font-mono text-[15px] font-semibold text-[#0D1B2E]">{formatTotal(o.total)}</p>
        </div>
        <div className="text-center">
          <p className="font-mono text-[10px] font-medium text-[#6B7A90] uppercase tracking-widest mb-0.5">{awayTeam.teamAbv} ML</p>
          <p className="font-mono text-[15px] font-semibold text-[#0D1B2E]">{formatML(o.awayMoneyline)}</p>
        </div>
        <div className="text-center">
          <p className="font-mono text-[10px] font-medium text-[#6B7A90] uppercase tracking-widest mb-0.5">{homeTeam.teamAbv} ML</p>
          <p className="font-mono text-[15px] font-semibold text-[#0D1B2E]">{formatML(o.homeMoneyline)}</p>
        </div>
      </div>
    );
  })();

  return (
    <button
      onClick={() => isClickable && onClick(game.gameId)}
      disabled={!isClickable}
      className={`group w-full text-left bg-white border rounded-xl overflow-hidden transition-all duration-200 focus:outline-none ${
        isClickable
          ? "border-[#D4DAE6] hover:border-[#0A7A6C] hover:bg-[#FAFCFC] hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#0A7A6C] cursor-pointer"
          : "border-[#E0E5EE] cursor-default"
      }`}
    >
      {/* Two-tone gradient top border: away color left, home color right */}
      <div className="h-[3px]" style={{ background: borderGradient }} />

      <div className="flex">
        {/* Left accent bar on hover */}
        <div className="w-[3px] bg-transparent group-hover:bg-[#0A7A6C] transition-colors duration-200 shrink-0" />

        <div className="flex-1">
          {/* Time strip */}
          <div className="px-5 py-2 bg-[#F0FAF8] border-b border-[#E0E5EE] flex items-center justify-between">
            <p className="font-mono text-[13px] font-medium text-[#0A7A6C] tracking-wide">
              {gameTime || "Time TBD"}
            </p>
            {effectiveStatus === "live" && (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0A7A6C] animate-pulse" />
                <span className="font-mono text-[10px] font-semibold text-[#0A7A6C] tracking-widest uppercase">Live</span>
              </span>
            )}
            {effectiveStatus === "final" && (
              <span className="font-mono text-[10px] font-medium text-[#6B7A90] tracking-widest uppercase">Final</span>
            )}
          </div>

          {/* Matchup */}
          <div className="px-5 pt-4 pb-4 flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-[11px] font-mono font-medium text-[#6B7A90] uppercase tracking-widest mb-1">Away</p>
              <p className="font-heading text-[18px] font-extrabold leading-tight" style={{ color: awayTextColor }}>
                {awayTeam.teamCity}
              </p>
              <p className="font-heading text-[18px] font-extrabold leading-tight" style={{ color: awayTextColor }}>
                {awayTeam.teamName.replace(awayTeam.teamCity, "").trim()}
              </p>
              {/* MLB: show away pitcher */}
              {sport === "MLB" && game.awayPitcher && (
                <p className="font-mono text-[11px] text-[#6B7A90] mt-1">
                  {game.awayPitcher.name}
                  <span className="text-[#B0BAC9]"> · {game.awayPitcher.seasonERA.toFixed(2)} ERA</span>
                </p>
              )}
            </div>

            <div className="flex flex-col items-center px-3">
              <span className="text-base font-medium text-[#0A7A6C]">@</span>
            </div>

            <div className="flex-1 text-right">
              <p className="text-[11px] font-mono font-medium text-[#6B7A90] uppercase tracking-widest mb-1">Home</p>
              <p className="font-heading text-[18px] font-extrabold leading-tight" style={{ color: homeTextColor }}>
                {homeTeam.teamCity}
              </p>
              <p className="font-heading text-[18px] font-extrabold leading-tight" style={{ color: homeTextColor }}>
                {homeTeam.teamName.replace(homeTeam.teamCity, "").trim()}
              </p>
              {/* MLB: show home pitcher */}
              {sport === "MLB" && game.homePitcher && (
                <p className="font-mono text-[11px] text-[#6B7A90] mt-1">
                  {game.homePitcher.name}
                  <span className="text-[#B0BAC9]"> · {game.homePitcher.seasonERA.toFixed(2)} ERA</span>
                </p>
              )}
            </div>
          </div>

          {/* One-line game signal — scheduled games only, rule-based from spread/total */}
          {signal && (
            <div className="px-5 pb-3">
              <p className="text-[12px] italic text-[#6B7A90]">{signal}</p>
            </div>
          )}

          {/* Odds strip */}
          {oddsRow}

          {/* CTA — "Get breakdown" only shows for scheduled games (before first pitch/tip-off).
               This is correct and intentional: breakdowns are pre-game only. */}
          <div className="px-5 py-3 flex items-center justify-between">
            {effectiveStatus === "live" && (
              <div className="w-full text-center">
                <p className="font-mono text-[14px] font-medium text-[#6B7A90]">Game in progress</p>
                <p className="font-mono text-[13px] text-[#B0BAC9] mt-0.5">Breakdowns are generated before tip-off.</p>
              </div>
            )}
            {effectiveStatus === "final" && (
              <div className="w-full text-center">
                <p className="font-mono text-[14px] font-medium text-[#6B7A90]">Game ended</p>
                <p className="font-mono text-[13px] text-[#B0BAC9] mt-0.5">Come back tomorrow for a new slate.</p>
              </div>
            )}
            {effectiveStatus === "scheduled" && <span />}
            {effectiveStatus === "scheduled" && (
              <span className="text-xs font-mono font-medium text-[#0A7A6C] tracking-wide group-hover:underline">
                Get breakdown →
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
