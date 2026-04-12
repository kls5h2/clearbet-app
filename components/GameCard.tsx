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

function lighten(hex: string, amount: number): string {
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

// For live/active game cards: blend team color with navy for readability
function getActiveTeamColor(teamAbv: string, sport: "NBA" | "MLB"): string {
  const raw = getRawColor(teamAbv, sport);
  if (raw === "#000000") return "#3A4A5A";
  // Very dark teams: lighten slightly
  const h = raw.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luminance < 0.2) return lighten(raw, 0.35);
  return raw;
}

// For dead (final/live) cards: muted version of team color
function getDeadTeamColor(teamAbv: string, sport: "NBA" | "MLB"): string {
  const raw = getRawColor(teamAbv, sport);
  if (raw === "#000000") return "#94A5BC";
  const h = raw.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // Blend 35% team color + 65% muted navy (#637A96)
  const nr = 99; const ng = 122; const nb = 150;
  const mr = Math.round(r * 0.35 + nr * 0.65);
  const mg = Math.round(g * 0.35 + ng * 0.65);
  const mb = Math.round(b * 0.35 + nb * 0.65);
  return `#${mr.toString(16).padStart(2,"0")}${mg.toString(16).padStart(2,"0")}${mb.toString(16).padStart(2,"0")}`;
}

// For tomorrow preview cards: slightly lighter than dead
function getTomorrowTeamColor(teamAbv: string, sport: "NBA" | "MLB"): string {
  return getDeadTeamColor(teamAbv, sport);
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

  const awayColor = preview
    ? getTomorrowTeamColor(awayTeam.teamAbv, sport)
    : isDead
    ? getDeadTeamColor(awayTeam.teamAbv, sport)
    : getActiveTeamColor(awayTeam.teamAbv, sport);

  const homeColor = preview
    ? getTomorrowTeamColor(homeTeam.teamAbv, sport)
    : isDead
    ? getDeadTeamColor(homeTeam.teamAbv, sport)
    : getActiveTeamColor(homeTeam.teamAbv, sport);

  // Card wrapper styles
  const wrapperClass = preview
    ? "w-full text-left rounded-[14px] overflow-hidden"
    : isDead
    ? "w-full text-left rounded-[14px] overflow-hidden"
    : "w-full text-left rounded-[14px] overflow-hidden cursor-pointer";

  const cardStyle: React.CSSProperties = preview
    ? { background: "#EDF1F6", border: "1px solid #DDE2EB", borderRadius: "14px", padding: "18px 22px" }
    : isDead
    ? { background: "#F2F5F8", border: "1px solid #E2E8F0", borderRadius: "14px", padding: "18px 22px" }
    : { background: "#FFFFFF", borderRadius: "14px", padding: "20px 22px 18px", boxShadow: "0 2px 10px rgba(13,27,46,0.07), 0 1px 3px rgba(13,27,46,0.04)" };

  // Odds row
  const oddsRow = (() => {
    if (!game.odds) return null;
    if (effectiveStatus !== "scheduled" || preview) return null;
    const labelCls = "text-[9px] font-bold uppercase tracking-[0.1em] text-[#B0BAC9] mb-1";
    const valCls = "text-[13px] font-extrabold text-[#0D1B2E] tracking-[-0.01em]";
    if (sport === "MLB") {
      const o = game.odds;
      return (
        <div style={{ background: "#F7F9FB", borderRadius: "8px", padding: "10px 12px", display: "flex", marginBottom: "14px" }}>
          <div className="flex-1"><p className={labelCls}>Run Line</p><p className={valCls}>{formatSpread(o.runLine, homeTeam.teamAbv)}</p></div>
          <div className="flex-1"><p className={labelCls}>Total</p><p className={valCls}>{formatTotal(o.total, "O/U")}</p></div>
          <div className="flex-1"><p className={labelCls}>{awayTeam.teamAbv} ML</p><p className={valCls}>{formatML(o.awayMoneyline)}</p></div>
          <div className="flex-1"><p className={labelCls}>{homeTeam.teamAbv} ML</p><p className={valCls}>{formatML(o.homeMoneyline)}</p></div>
        </div>
      );
    }
    const o = game.odds;
    return (
      <div style={{ background: "#F7F9FB", borderRadius: "8px", padding: "10px 12px", display: "flex", marginBottom: "14px" }}>
        <div className="flex-1"><p className={labelCls}>Spread</p><p className={valCls}>{formatSpread(o.spread, homeTeam.teamAbv)}</p></div>
        <div className="flex-1"><p className={labelCls}>Total</p><p className={valCls}>{formatTotal(o.total)}</p></div>
        <div className="flex-1"><p className={labelCls}>{awayTeam.teamAbv} ML</p><p className={valCls}>{formatML(o.awayMoneyline)}</p></div>
        <div className="flex-1"><p className={labelCls}>{homeTeam.teamAbv} ML</p><p className={valCls}>{formatML(o.homeMoneyline)}</p></div>
      </div>
    );
  })();

  // @ circle connector
  const atCircle = (
    <div style={{
      width: "24px", height: "24px", borderRadius: "50%",
      background: "#E2E8F0", display: "flex", alignItems: "center",
      justifyContent: "center", flexShrink: 0,
      fontSize: "12px", fontWeight: 800, color: "#7A8FA6",
    }}>@</div>
  );

  const awayCity = awayTeam.teamCity || awayTeam.teamName.split(" ").slice(0, -1).join(" ");
  const awayNickname = awayTeam.teamCity
    ? awayTeam.teamName.replace(awayTeam.teamCity, "").trim()
    : awayTeam.teamName;
  const homeCity = homeTeam.teamCity || homeTeam.teamName.split(" ").slice(0, -1).join(" ");
  const homeNickname = homeTeam.teamCity
    ? homeTeam.teamName.replace(homeTeam.teamCity, "").trim()
    : homeTeam.teamName;

  // Scheduled upcoming card
  if (isClickable) {
    return (
      <button
        onClick={() => onClick(game.gameId)}
        className={`group ${wrapperClass} transition-all duration-150 focus:outline-none`}
        style={cardStyle}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(13,27,46,0.10), 0 1px 4px rgba(13,27,46,0.05)";
          (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 10px rgba(13,27,46,0.07), 0 1px 3px rgba(13,27,46,0.04)";
          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        }}
      >
        {/* Time row */}
        <div className="flex justify-between items-center mb-[14px]">
          <span className="text-[11px] font-bold text-[#637A96] tracking-[0.06em]">{gameTime || "Time TBD"}</span>
        </div>

        {/* Matchup */}
        <div className="flex items-center gap-3 mb-[14px]">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#9FADBF] mb-[3px]">{awayCity}</p>
            <p className="text-[22px] font-extrabold tracking-[-0.03em] leading-none" style={{ color: awayColor }}>{awayNickname}</p>
            {sport === "MLB" && game.awayPitcher && (
              <p className="text-[10px] text-[#9FADBF] mt-1 leading-none">
                {game.awayPitcher.hand ? `${game.awayPitcher.hand}HP · ` : ""}{game.awayPitcher.name}
                {game.awayPitcher.seasonERA > 0 && <span className="text-[#B0BAC9]"> · {game.awayPitcher.seasonERA.toFixed(2)} ERA</span>}
              </p>
            )}
          </div>
          {atCircle}
          <div className="flex-1 text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#9FADBF] mb-[3px]">{homeCity}</p>
            <p className="text-[22px] font-extrabold tracking-[-0.03em] leading-none" style={{ color: homeColor }}>{homeNickname}</p>
            {sport === "MLB" && game.homePitcher && (
              <p className="text-[10px] text-[#9FADBF] mt-1 leading-none">
                {game.homePitcher.name}{game.homePitcher.hand ? ` · ${game.homePitcher.hand}HP` : ""}
                {game.homePitcher.seasonERA > 0 && <span className="text-[#B0BAC9]"> · {game.homePitcher.seasonERA.toFixed(2)} ERA</span>}
              </p>
            )}
          </div>
        </div>

        {/* THE READ */}
        {signal && (
          <div style={{ background: "#F0FAF8", borderRadius: "8px", padding: "10px 13px", marginBottom: "14px" }}>
            <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#0A7A6C] mb-[5px]">The Read</p>
            <p className="text-[13px] font-semibold text-[#096059] leading-[1.5]">{signal}</p>
          </div>
        )}

        {/* Odds */}
        {oddsRow}

        {/* Footer */}
        <div className="flex justify-between items-center">
          <span />
          <span className="text-[12px] font-bold text-[#0A7A6C]">Get breakdown →</span>
        </div>
      </button>
    );
  }

  // Dead (final / live) card
  if (isDead) {
    return (
      <div className={wrapperClass} style={cardStyle}>
        {/* Time row */}
        <div className="flex justify-between items-center mb-[10px]">
          <span className="text-[11px] font-bold text-[#637A96] tracking-[0.06em]">{gameTime || "Time TBD"}</span>
          {effectiveStatus === "live" ? (
            <div className="flex items-center gap-[5px]">
              <span className="w-[5px] h-[5px] rounded-full bg-[#DC2626] animate-pulse block" />
              <span className="text-[10px] font-bold tracking-[0.08em] text-[#DC2626]">Live</span>
            </div>
          ) : (
            <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#9FADBF]">Final</span>
          )}
        </div>

        {/* Matchup */}
        <div className="flex items-center gap-3 mb-[10px]">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#9FADBF] mb-[3px]">{awayCity}</p>
            <p className="text-[20px] font-extrabold tracking-[-0.03em] leading-none" style={{ color: awayColor }}>{awayNickname}</p>
          </div>
          {atCircle}
          <div className="flex-1 text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#9FADBF] mb-[3px]">{homeCity}</p>
            <p className="text-[20px] font-extrabold tracking-[-0.03em] leading-none" style={{ color: homeColor }}>{homeNickname}</p>
          </div>
        </div>

        <p className="text-[11px] text-[#94A5BC] italic font-semibold">
          {effectiveStatus === "live"
            ? `Game in progress · Breakdown generated before ${sport === "MLB" ? "first pitch" : "tip-off"}`
            : "Game ended · Check back tomorrow"}
        </p>
      </div>
    );
  }

  // Tomorrow preview card
  return (
    <div className={wrapperClass} style={cardStyle}>
      {/* Time row */}
      <div className="flex justify-between items-center mb-[10px]">
        <span className="text-[11px] font-bold text-[#637A96] tracking-[0.06em]">{gameTime || "Time TBD"}</span>
      </div>

      {/* Matchup */}
      <div className="flex items-center gap-3 mb-[10px]">
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#9FADBF] mb-[3px]">{awayCity}</p>
          <p className="text-[20px] font-extrabold tracking-[-0.03em] leading-none" style={{ color: awayColor }}>{awayNickname}</p>
        </div>
        {atCircle}
        <div className="flex-1 text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#9FADBF] mb-[3px]">{homeCity}</p>
          <p className="text-[20px] font-extrabold tracking-[-0.03em] leading-none" style={{ color: homeColor }}>{homeNickname}</p>
        </div>
      </div>

      <p className="text-[11px] text-[#7A8FA6] italic font-semibold">Breakdown available day of game</p>
    </div>
  );
}
