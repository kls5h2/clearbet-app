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
  MIN: "#002B5C", NYM: "#002D72", NYY: "#003087",
  OAK: "#003831", ATH: "#003831", SAC: "#003831", LV: "#003831", LAS: "#003831",
  PHI: "#E81828", PIT: "#FDB827", SD:  "#2F241D", SF:  "#FD5A1E",
  SEA: "#0C2C56", STL: "#C41E3A", TB:  "#092C5C", TEX: "#003278",
  TOR: "#134A8E", WSH: "#AB0003",
};

const NBA_LIGHTEN = new Set(["BKN", "IND", "MIN", "NO", "NOP", "UTA", "WAS"]);
const MLB_LIGHTEN = new Set(["CHC", "CLE", "COL", "DET", "HOU", "KC", "MIN", "NYM", "NYY", "OAK", "ATH", "SAC", "LV", "LAS", "SD", "SEA", "TB", "TEX", "WSH", "CWS"]);

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

function getTeamTextColor(teamAbv: string, sport: "NBA" | "MLB", isDead = false): string {
  if (isDead) return "#9FADBF";
  const raw = getRawColor(teamAbv, sport);
  const lightenSet = sport === "MLB" ? MLB_LIGHTEN : NBA_LIGHTEN;
  if (lightenSet.has(teamAbv) || raw === "#000000") return lighten(raw, 0.35);
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
  preview?: boolean;
}

function getGameSignal(
  spread: number | null,
  total: number | null,
  isMLB: boolean,
  pitchersUnconfirmed = false
): string | null {
  if (isMLB) {
    if (pitchersUnconfirmed) return "Starters unconfirmed — pitching matchup TBD";
    if (total === null) return "Pitching matchup is the key variable tonight";
    if (total >= 9.5) return "High run environment — offense likely active";
    if (total >= 8.5) return "Run environment favors both offenses";
    if (total <= 7.5) return "Pitcher's game — starters will decide this";
    return "Pitching matchup is the key variable tonight";
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
    if (totalSignal === "high-scoring environment") {
      return spreadSignal.replace(" — ", " in a high-scoring environment — ");
    }
    return `${spreadSignal}. ${totalSignal.charAt(0).toUpperCase() + totalSignal.slice(1)}.`;
  }
  if (totalSignal === "high-scoring environment") return "High-scoring environment expected";
  if (totalSignal) return "Defensive game — scoring will be at a premium";
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

export default function GameCard({ game, onClick, preview = false }: Props) {
  const { homeTeam, awayTeam, gameTime, gameStatus } = game;
  const sport = game.sport;

  const effectiveStatus = preview ? "scheduled" : getEffectiveStatus(gameStatus, gameTime);
  const isClickable = effectiveStatus === "scheduled" && !preview;
  const isDead = effectiveStatus === "final" || effectiveStatus === "live";

  const spread = game.odds && "spread" in game.odds ? game.odds.spread : null;
  const runLine = game.odds && "runLine" in game.odds ? game.odds.runLine : null;
  const total = game.odds?.total ?? null;
  const signalSpread = sport === "MLB" ? runLine : spread;

  const pitchersUnconfirmed = (() => {
    if (sport !== "MLB") return false;
    const g = game as import("@/lib/types").MLBGame;
    const unknown = (name: string | null | undefined) =>
      !name || name.toLowerCase() === "tbd" || name.toLowerCase().startsWith("unknown");
    return !g.homePitcher || !g.awayPitcher || unknown(g.homePitcher?.name) || unknown(g.awayPitcher?.name);
  })();

  const signal = effectiveStatus === "scheduled" && !preview
    ? getGameSignal(signalSpread, total, sport === "MLB", pitchersUnconfirmed)
    : null;

  // Card surface and border based on state
  const cardBg = preview
    ? "bg-[#EDF1F6]"
    : effectiveStatus === "final"
    ? "bg-[#F2F5F8]"
    : "bg-white";

  const cardBorder = preview || effectiveStatus === "final"
    ? "border-[#E2E8F0]"
    : effectiveStatus === "live"
    ? "border-[#D4EDE9]"
    : "border-[#E8ECF2]";

  const borderGradient = isDead || preview
    ? `linear-gradient(to right, ${lighten(getBorderColor(awayTeam.teamAbv, sport), 0.3)} 50%, ${lighten(getBorderColor(homeTeam.teamAbv, sport), 0.3)} 50%)`
    : `linear-gradient(to right, ${getBorderColor(awayTeam.teamAbv, sport)} 50%, ${getBorderColor(homeTeam.teamAbv, sport)} 50%)`;

  const awayTextColor = getTeamTextColor(awayTeam.teamAbv, sport, isDead || preview);
  const homeTextColor = getTeamTextColor(homeTeam.teamAbv, sport, isDead || preview);

  const oddsRow = (() => {
    if (!game.odds) return null;
    if (effectiveStatus !== "scheduled") return null;
    if (preview) return null;
    const oddsLabelCls = "font-mono text-[9px] font-bold text-[#9FADBF] uppercase tracking-[0.1em] mb-1";
    const oddsValueCls = "font-mono text-[14px] font-semibold text-[#0D1B2E]";
    if (sport === "MLB") {
      const o = game.odds;
      return (
        <div className="px-4 py-3 bg-[#F7F9FC] border-t border-[#EEF1F5] flex items-center justify-between">
          <div className="text-center">
            <p className={oddsLabelCls}>Run Line</p>
            <p className={oddsValueCls}>{formatSpread(o.runLine, homeTeam.teamAbv)}</p>
          </div>
          <div className="text-center">
            <p className={oddsLabelCls}>Total</p>
            <p className={oddsValueCls}>{formatTotal(o.total, "O/U")}</p>
          </div>
          <div className="text-center">
            <p className={oddsLabelCls}>{awayTeam.teamAbv} ML</p>
            <p className={oddsValueCls}>{formatML(o.awayMoneyline)}</p>
          </div>
          <div className="text-center">
            <p className={oddsLabelCls}>{homeTeam.teamAbv} ML</p>
            <p className={oddsValueCls}>{formatML(o.homeMoneyline)}</p>
          </div>
        </div>
      );
    }
    const o = game.odds;
    return (
      <div className="px-4 py-3 bg-[#F7F9FC] border-t border-[#EEF1F5] flex items-center justify-between">
        <div className="text-center">
          <p className={oddsLabelCls}>Spread</p>
          <p className={oddsValueCls}>{formatSpread(o.spread, homeTeam.teamAbv)}</p>
        </div>
        <div className="text-center">
          <p className={oddsLabelCls}>Total</p>
          <p className={oddsValueCls}>{formatTotal(o.total)}</p>
        </div>
        <div className="text-center">
          <p className={oddsLabelCls}>{awayTeam.teamAbv} ML</p>
          <p className={oddsValueCls}>{formatML(o.awayMoneyline)}</p>
        </div>
        <div className="text-center">
          <p className={oddsLabelCls}>{homeTeam.teamAbv} ML</p>
          <p className={oddsValueCls}>{formatML(o.homeMoneyline)}</p>
        </div>
      </div>
    );
  })();

  return (
    <button
      onClick={() => isClickable && onClick(game.gameId)}
      disabled={!isClickable}
      className={`group w-full text-left ${cardBg} border ${cardBorder} rounded-xl overflow-hidden transition-all duration-200 focus:outline-none ${
        isClickable
          ? "hover:border-[#0A7A6C] hover:shadow-[0_2px_10px_rgba(13,27,46,0.07),0_1px_3px_rgba(13,27,46,0.04)] focus-visible:ring-2 focus-visible:ring-[#0A7A6C] cursor-pointer"
          : "cursor-default"
      }`}
    >
      {/* Two-tone top border strip */}
      <div className="h-[3px]" style={{ background: borderGradient }} />

      <div className="flex">
        {/* Teal hover accent bar (scheduled only) */}
        {isClickable && (
          <div className="w-[3px] bg-transparent group-hover:bg-[#0A7A6C] transition-colors duration-200 shrink-0" />
        )}
        {!isClickable && <div className="w-[3px] shrink-0" />}

        <div className="flex-1 min-w-0">
          {/* Time / status strip */}
          <div className={`px-4 py-2 border-b ${
            preview
              ? "bg-[#EDF1F6] border-[#E2E8F0]"
              : effectiveStatus === "final"
              ? "bg-[#F2F5F8] border-[#E2E8F0]"
              : effectiveStatus === "live"
              ? "bg-[#F0FAF8] border-[#D4EDE9]"
              : "bg-[#F0FAF8] border-[#E8ECF2]"
          } flex items-center justify-between`}>
            <p className={`font-mono text-[12px] font-semibold tracking-wide ${
              preview || effectiveStatus === "final"
                ? "text-[#B0BAC9]"
                : "text-[#0A7A6C]"
            }`}>
              {preview ? `Tomorrow · ${gameTime || "TBD"}` : gameTime || "Time TBD"}
            </p>
            {effectiveStatus === "live" && (
              <span className="flex items-center gap-1.5">
                <span className="w-[6px] h-[6px] rounded-full bg-[#0A7A6C] animate-pulse" />
                <span className="font-mono text-[9px] font-bold text-[#0A7A6C] tracking-[0.12em] uppercase">Live</span>
              </span>
            )}
            {effectiveStatus === "final" && !preview && (
              <span className="font-mono text-[9px] font-bold text-[#B0BAC9] tracking-[0.12em] uppercase">Final</span>
            )}
            {preview && (
              <span className="font-mono text-[9px] font-bold text-[#B0BAC9] tracking-[0.12em] uppercase">Preview</span>
            )}
          </div>

          {/* Matchup */}
          <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[9px] font-bold text-[#9FADBF] uppercase tracking-[0.1em] mb-1">Away</p>
              {awayTeam.teamCity ? (
                <>
                  <p className="font-heading text-[17px] font-extrabold leading-[1.2] truncate" style={{ color: awayTextColor }}>
                    {awayTeam.teamCity}
                  </p>
                  <p className="font-heading text-[17px] font-extrabold leading-[1.2] truncate" style={{ color: awayTextColor }}>
                    {awayTeam.teamName.replace(awayTeam.teamCity, "").trim()}
                  </p>
                </>
              ) : (
                <p className="font-heading text-[17px] font-extrabold leading-[1.2]" style={{ color: awayTextColor }}>
                  {awayTeam.teamName}
                </p>
              )}
              {sport === "MLB" && game.awayPitcher && !preview && (
                <p className="font-mono text-[10px] text-[#9FADBF] mt-1.5 leading-none">
                  {game.awayPitcher.hand ? `${game.awayPitcher.hand}HP · ` : ""}{game.awayPitcher.name}
                  {game.awayPitcher.seasonERA > 0 && (
                    <span className="text-[#B0BAC9]"> · {game.awayPitcher.seasonERA.toFixed(2)} ERA</span>
                  )}
                </p>
              )}
            </div>

            <div className="flex items-center px-1 pt-5">
              <span className={`text-[13px] font-medium ${preview || isDead ? "text-[#B0BAC9]" : "text-[#0A7A6C]"}`}>@</span>
            </div>

            <div className="flex-1 min-w-0 text-right">
              <p className="font-mono text-[9px] font-bold text-[#9FADBF] uppercase tracking-[0.1em] mb-1">Home</p>
              {homeTeam.teamCity ? (
                <>
                  <p className="font-heading text-[17px] font-extrabold leading-[1.2] truncate" style={{ color: homeTextColor }}>
                    {homeTeam.teamCity}
                  </p>
                  <p className="font-heading text-[17px] font-extrabold leading-[1.2] truncate" style={{ color: homeTextColor }}>
                    {homeTeam.teamName.replace(homeTeam.teamCity, "").trim()}
                  </p>
                </>
              ) : (
                <p className="font-heading text-[17px] font-extrabold leading-[1.2]" style={{ color: homeTextColor }}>
                  {homeTeam.teamName}
                </p>
              )}
              {sport === "MLB" && game.homePitcher && !preview && (
                <p className="font-mono text-[10px] text-[#9FADBF] mt-1.5 leading-none">
                  {game.homePitcher.name}{game.homePitcher.hand ? ` · ${game.homePitcher.hand}HP` : ""}
                  {game.homePitcher.seasonERA > 0 && (
                    <span className="text-[#B0BAC9]"> · {game.homePitcher.seasonERA.toFixed(2)} ERA</span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* THE READ zone — signal for scheduled games */}
          {signal && (
            <div className="mx-4 mb-3">
              <div className="bg-[#F7F9FC] rounded-lg px-4 py-3 border border-[#EEF1F5]">
                <p className="font-mono text-[9px] font-bold text-[#9FADBF] tracking-[0.1em] uppercase mb-1">The Read</p>
                <p className="text-[12px] text-[#3A5470] leading-[1.5]">{signal}</p>
              </div>
            </div>
          )}

          {/* Odds zone */}
          {oddsRow}

          {/* CTA / state row */}
          {!preview && (
            <div className="px-4 py-3 flex items-center justify-between">
              {effectiveStatus === "live" && (
                <div className="w-full">
                  <p className="font-mono text-[12px] font-medium text-[#637A96]">Game in progress</p>
                  <p className="font-mono text-[11px] text-[#9FADBF] mt-0.5">
                    Breakdowns are generated before {sport === "MLB" ? "first pitch" : "tip-off"}.
                  </p>
                </div>
              )}
              {effectiveStatus === "final" && (
                <div className="w-full">
                  <p className="font-mono text-[12px] font-medium text-[#9FADBF]">Game ended.</p>
                  <p className="font-mono text-[11px] text-[#B0BAC9] mt-0.5">Check back tomorrow for new breakdowns.</p>
                </div>
              )}
              {effectiveStatus === "scheduled" && (
                <>
                  <span />
                  <span className="font-mono text-[11px] font-semibold text-[#0A7A6C] tracking-wide group-hover:underline">
                    Get breakdown →
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
