"use client";

import type { AnyGame, GameStatus, MLBGame, GameOdds, MLBGameOdds } from "@/lib/types";
import {
  getActiveTeamColor,
  getDeadTeamColor,
  getTomorrowTeamColor,
} from "@/lib/team-colors";

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
  // Return null when no odds data — THE READ zone won't render
  return spreadSignal ?? null;
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

// Render the odds row — uses game.sport (not alias) for proper discriminated union narrowing
function OddsRow({ game, homeTeamAbv, awayTeamAbv }: {
  game: AnyGame;
  homeTeamAbv: string;
  awayTeamAbv: string;
}) {
  if (!game.odds) return null;
  const labelCls = "text-[9px] font-bold uppercase tracking-[0.1em] text-[#637A96] mb-1";
  const valCls = "text-[14px] font-extrabold text-[#0D1B2E] tracking-[-0.01em]";
  const rowStyle: React.CSSProperties = {
    background: "#F7F9FB", borderRadius: "8px", padding: "10px 12px",
    display: "flex", marginBottom: "14px",
  };

  if (game.sport === "MLB") {
    const o: MLBGameOdds = game.odds;
    return (
      <div style={rowStyle}>
        <div className="flex-1"><p className={labelCls}>Run Line</p><p className={valCls}>{formatSpread(o.runLine, homeTeamAbv)}</p></div>
        <div className="flex-1"><p className={labelCls}>Total</p><p className={valCls}>{formatTotal(o.total, "O/U")}</p></div>
        <div className="flex-1"><p className={labelCls}>{awayTeamAbv} ML</p><p className={valCls}>{formatML(o.awayMoneyline)}</p></div>
        <div className="flex-1"><p className={labelCls}>{homeTeamAbv} ML</p><p className={valCls}>{formatML(o.homeMoneyline)}</p></div>
      </div>
    );
  }

  // NBA — game.sport === "NBA" narrowed here
  const o: GameOdds = game.odds;
  return (
    <div style={rowStyle}>
      <div className="flex-1"><p className={labelCls}>Spread</p><p className={valCls}>{formatSpread(o.spread, homeTeamAbv)}</p></div>
      <div className="flex-1"><p className={labelCls}>Total</p><p className={valCls}>{formatTotal(o.total)}</p></div>
      <div className="flex-1"><p className={labelCls}>{awayTeamAbv} ML</p><p className={valCls}>{formatML(o.awayMoneyline)}</p></div>
      <div className="flex-1"><p className={labelCls}>{homeTeamAbv} ML</p><p className={valCls}>{formatML(o.homeMoneyline)}</p></div>
    </div>
  );
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
    const g = game as MLBGame;
    const unknown = (name: string | null | undefined) =>
      !name || name.toLowerCase() === "tbd" || name.toLowerCase().startsWith("unknown");
    return !g.homePitcher || !g.awayPitcher || unknown(g.homePitcher?.name) || unknown(g.awayPitcher?.name);
  })();

  const signal: string | null = isClickable
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

  const awayCity = awayTeam.teamCity || awayTeam.teamName.split(" ").slice(0, -1).join(" ");
  const awayNickname = awayTeam.teamCity
    ? awayTeam.teamName.replace(awayTeam.teamCity, "").trim()
    : awayTeam.teamName;
  const homeCity = homeTeam.teamCity || homeTeam.teamName.split(" ").slice(0, -1).join(" ");
  const homeNickname = homeTeam.teamCity
    ? homeTeam.teamName.replace(homeTeam.teamCity, "").trim()
    : homeTeam.teamName;

  const atConnector = (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "flex-end",
      flexShrink: 0, padding: "0 6px", paddingBottom: "2px",
    }}>
      <span style={{ fontSize: "11px", fontWeight: 600, color: "#637A96" }}>at</span>
    </div>
  );

  // Scheduled upcoming card
  if (isClickable) {
    return (
      <button
        onClick={() => onClick(game.gameId)}
        className="w-full text-left rounded-[14px] cursor-pointer transition-all duration-150 focus:outline-none"
        style={{
          background: "#FFFFFF", borderRadius: "14px", padding: "20px 22px 18px",
          boxShadow: "0 2px 10px rgba(13,27,46,0.07), 0 1px 3px rgba(13,27,46,0.04)",
          borderLeft: "3px solid transparent",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.boxShadow = "0 6px 24px rgba(13,27,46,0.12)";
          el.style.transform = "translateY(-2px)";
          el.style.borderLeft = "3px solid #0A7A6C";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.boxShadow = "0 2px 10px rgba(13,27,46,0.07), 0 1px 3px rgba(13,27,46,0.04)";
          el.style.transform = "translateY(0)";
          el.style.borderLeft = "3px solid transparent";
        }}
      >
        {/* Time row */}
        <div className="flex justify-between items-center mb-[14px]">
          <span className="text-[12px] font-bold text-[#637A96] tracking-[0.06em]">{gameTime || "Time TBD"}</span>
        </div>

        {/* Matchup */}
        <div className="flex items-center gap-3 mb-[14px]">
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#637A96] mb-[3px]">{awayCity}</p>
            <p className="text-[22px] font-extrabold tracking-[-0.03em] leading-none" style={{ color: awayColor }}>{awayNickname}</p>
            {sport === "MLB" && game.awayPitcher && (
              <p style={{ fontSize: "13px", color: "#3A5470", marginTop: "4px", lineHeight: 1.3 }}>
                {game.awayPitcher.hand ? `${game.awayPitcher.hand}HP · ` : ""}{game.awayPitcher.name}
                {game.awayPitcher.seasonERA > 0 && <span style={{ color: "#637A96" }}> · {game.awayPitcher.seasonERA.toFixed(2)} ERA</span>}
              </p>
            )}
          </div>
          {atConnector}
          <div className="flex-1 text-right">
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#637A96] mb-[3px]">{homeCity}</p>
            <p className="text-[22px] font-extrabold tracking-[-0.03em] leading-none" style={{ color: homeColor }}>{homeNickname}</p>
            {sport === "MLB" && game.homePitcher && (
              <p style={{ fontSize: "13px", color: "#3A5470", marginTop: "4px", lineHeight: 1.3 }}>
                {game.homePitcher.name}{game.homePitcher.hand ? ` · ${game.homePitcher.hand}HP` : ""}
                {game.homePitcher.seasonERA > 0 && <span style={{ color: "#637A96" }}> · {game.homePitcher.seasonERA.toFixed(2)} ERA</span>}
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
        <OddsRow game={game} homeTeamAbv={homeTeam.teamAbv} awayTeamAbv={awayTeam.teamAbv} />

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
      <div
        className="w-full text-left rounded-[14px]"
        style={{ background: "#F2F5F8", border: "1px solid #E2E8F0", borderRadius: "14px", padding: "18px 22px" }}
      >
        <div className="flex justify-between items-center mb-[10px]">
          <span className="text-[12px] font-bold text-[#637A96] tracking-[0.06em]">{gameTime || "Time TBD"}</span>
          {effectiveStatus === "live" ? (
            <div className="flex items-center gap-[5px]">
              <span className="w-[5px] h-[5px] rounded-full bg-[#DC2626] animate-pulse block" />
              <span className="text-[10px] font-bold tracking-[0.08em] text-[#DC2626]">Live</span>
            </div>
          ) : (
            <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#637A96]">Final</span>
          )}
        </div>

        <div className="flex items-center gap-3 mb-[10px]">
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#637A96] mb-[3px]">{awayCity}</p>
            <p className="text-[20px] font-extrabold tracking-[-0.03em] leading-none" style={{ color: awayColor }}>{awayNickname}</p>
          </div>
          {atConnector}
          <div className="flex-1 text-right">
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#637A96] mb-[3px]">{homeCity}</p>
            <p className="text-[20px] font-extrabold tracking-[-0.03em] leading-none" style={{ color: homeColor }}>{homeNickname}</p>
          </div>
        </div>

        <p className="text-[11px] text-[#637A96] italic font-semibold">
          {effectiveStatus === "live"
            ? `Game in progress · Breakdown generated before ${sport === "MLB" ? "first pitch" : "tip-off"}`
            : "Game ended · Check back tomorrow"}
        </p>
      </div>
    );
  }

  // Tomorrow preview card
  return (
    <div
      className="w-full text-left rounded-[14px]"
      style={{ background: "#EDF1F6", border: "1px solid #DDE2EB", borderRadius: "14px", padding: "18px 22px" }}
    >
      <div className="flex justify-between items-center mb-[10px]">
        <span className="text-[12px] font-bold text-[#637A96] tracking-[0.06em]">{gameTime || "Time TBD"}</span>
      </div>

      <div className="flex items-center gap-3 mb-[10px]">
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#637A96] mb-[3px]">{awayCity}</p>
          <p className="text-[20px] font-extrabold tracking-[-0.03em] leading-none" style={{ color: awayColor }}>{awayNickname}</p>
        </div>
        {atConnector}
        <div className="flex-1 text-right">
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#637A96] mb-[3px]">{homeCity}</p>
          <p className="text-[20px] font-extrabold tracking-[-0.03em] leading-none" style={{ color: homeColor }}>{homeNickname}</p>
        </div>
      </div>

      <p className="text-[11px] text-[#637A96] italic font-semibold">Breakdown available day of game</p>
    </div>
  );
}
