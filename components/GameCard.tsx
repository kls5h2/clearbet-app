"use client";

import { useState } from "react";
import type { AnyGame, GameStatus, GameOdds, MLBGameOdds } from "@/lib/types";

interface Props {
  game: AnyGame;
  onClick: (gameId: string) => void;
  preview?: boolean;
  whatThisMeans?: string | null;
  hasBreakdown?: boolean;
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
    timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(now);
  const currentHour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const currentMin = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  const minutesPast = currentHour * 60 + currentMin - (gameHour * 60 + gameMins);
  if (minutesPast <= 0) return "scheduled";
  if (minutesPast > 180) return "final";
  return "live";
}

function OddsRow({ game, homeTeamAbv, awayTeamAbv }: { game: AnyGame; homeTeamAbv: string; awayTeamAbv: string }) {
  if (!game.odds) return null;
  const labelStyle: React.CSSProperties = { fontSize: "9px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: "2px" };
  const valStyle: React.CSSProperties = { fontSize: "13px", fontWeight: 500, color: "var(--ink)" };
  const rowStyle: React.CSSProperties = { background: "#EDEAE3", borderRadius: "4px", padding: "10px 12px", display: "flex", marginBottom: "14px" };

  if (game.sport === "MLB") {
    const o: MLBGameOdds = game.odds;
    return (
      <div style={rowStyle}>
        <div className="flex-1"><p style={labelStyle}>Run Line</p><p style={valStyle}>{formatSpread(o.runLine, homeTeamAbv)}</p></div>
        <div className="flex-1"><p style={labelStyle}>Total</p><p style={valStyle}>{formatTotal(o.total, "O/U")}</p></div>
        <div className="flex-1 hidden sm:block"><p style={labelStyle}>{awayTeamAbv} ML</p><p style={valStyle}>{formatML(o.awayMoneyline)}</p></div>
        <div className="flex-1 hidden sm:block"><p style={labelStyle}>{homeTeamAbv} ML</p><p style={valStyle}>{formatML(o.homeMoneyline)}</p></div>
      </div>
    );
  }

  const o: GameOdds = game.odds;
  return (
    <div style={rowStyle}>
      <div className="flex-1"><p style={labelStyle}>Spread</p><p style={valStyle}>{formatSpread(o.spread, homeTeamAbv)}</p></div>
      <div className="flex-1"><p style={labelStyle}>Total</p><p style={valStyle}>{formatTotal(o.total)}</p></div>
      <div className="flex-1 hidden sm:block"><p style={labelStyle}>{awayTeamAbv} ML</p><p style={valStyle}>{formatML(o.awayMoneyline)}</p></div>
      <div className="flex-1 hidden sm:block"><p style={labelStyle}>{homeTeamAbv} ML</p><p style={valStyle}>{formatML(o.homeMoneyline)}</p></div>
    </div>
  );
}

// Clickable scheduled card with coordinated hover state.
// On hover: translateY(-1px), elevated shadow, stronger border, "Read →" goes signal red + full opacity.
// 150ms ease transitions across the board.
function ClickableCard({
  onClick, hasBreakdown, children,
}: {
  onClick: () => void;
  hasBreakdown: boolean;
  children: React.ReactNode;
}) {
  const [hover, setHover] = useState(false);
  const readColor = hover ? "var(--signal)" : (hasBreakdown ? "var(--signal)" : "var(--ink)");
  const readOpacity = hover || hasBreakdown ? 1 : 0.6;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="w-full text-left cursor-pointer focus:outline-none"
      style={{
        background: hover ? "#EFEDE7" : "var(--paper)",
        borderRadius: "6px",
        padding: "20px 24px 18px",
        border: `0.5px solid ${hover ? "rgba(14,14,14,0.18)" : "transparent"}`,
        transform: hover ? "translateY(-1px)" : "translateY(0)",
        boxShadow: hover ? "0 6px 18px rgba(14,14,14,0.08), 0 1px 2px rgba(14,14,14,0.04)" : "none",
        transition: "background 150ms ease, border-color 150ms ease, transform 150ms ease, box-shadow 150ms ease",
      }}
    >
      {children}
      {/* Footer */}
      <div className="flex justify-between items-center">
        <span />
        <span style={{
          fontSize: "13px", fontWeight: 500,
          color: readColor, opacity: readOpacity,
          transition: "color 150ms ease, opacity 150ms ease",
        }}>
          Read →
        </span>
      </div>
    </button>
  );
}

export default function GameCard({ game, onClick, preview = false, whatThisMeans = null, hasBreakdown = false }: Props) {
  const { homeTeam, awayTeam, gameTime, gameStatus } = game;
  const sport = game.sport;

  const effectiveStatus = preview ? "scheduled" : getEffectiveStatus(gameStatus, gameTime);
  const isClickable = effectiveStatus === "scheduled" && !preview;
  const isDead = effectiveStatus === "final" || effectiveStatus === "live";

  const signal: string | null = isClickable && whatThisMeans ? whatThisMeans : null;

  const awayCity = awayTeam.teamCity || awayTeam.teamName.split(" ").slice(0, -1).join(" ");
  const awayNickname = awayTeam.teamCity ? awayTeam.teamName.replace(awayTeam.teamCity, "").trim() : awayTeam.teamName;
  const homeCity = homeTeam.teamCity || homeTeam.teamName.split(" ").slice(0, -1).join(" ");
  const homeNickname = homeTeam.teamCity ? homeTeam.teamName.replace(homeTeam.teamCity, "").trim() : homeTeam.teamName;

  const atConnector = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", flexShrink: 0, padding: "0 6px", paddingBottom: "2px" }}>
      <span style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "16px", color: "var(--muted)" }}>at</span>
    </div>
  );

  // Scheduled upcoming card
  if (isClickable) {
    return (
      <ClickableCard
        onClick={() => onClick(game.gameId)}
        hasBreakdown={hasBreakdown}
      >
        {/* Time */}
        <div style={{ marginBottom: "12px" }}>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>{gameTime || "Time TBD"}</span>
        </div>

        {/* Matchup */}
        <div className="flex items-center gap-3" style={{ marginBottom: "14px" }}>
          <div className="flex-1">
            <p style={{ fontSize: "10px", fontWeight: 500, textTransform: "uppercase", color: "var(--muted)", marginBottom: "3px" }}>{awayCity}</p>
            <p style={{ fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: 500, color: "var(--ink)", lineHeight: 1.1 }}>{awayNickname}</p>
            {sport === "MLB" && (
              <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--ink)", marginTop: "4px", lineHeight: 1.3 }}>
                {game.awayPitcher
                  ? <>{game.awayPitcher.hand ? `${game.awayPitcher.hand === "L" ? "LHP" : "RHP"} · ` : ""}{game.awayPitcher.name}{game.awayPitcher.seasonERA != null && <span style={{ color: "var(--muted)" }}> · {game.awayPitcher.seasonERA.toFixed(2)} ERA</span>}</>
                  : "Starter TBD"}
              </p>
            )}
          </div>
          {atConnector}
          <div className="flex-1 text-right">
            <p style={{ fontSize: "10px", fontWeight: 500, textTransform: "uppercase", color: "var(--muted)", marginBottom: "3px" }}>{homeCity}</p>
            <p style={{ fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: 500, color: "var(--ink)", lineHeight: 1.1 }}>{homeNickname}</p>
            {sport === "MLB" && (
              <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--ink)", marginTop: "4px", lineHeight: 1.3 }}>
                {game.homePitcher
                  ? <>{game.homePitcher.name}{game.homePitcher.hand ? ` · ${game.homePitcher.hand === "L" ? "LHP" : "RHP"}` : ""}{game.homePitcher.seasonERA != null && <span style={{ color: "var(--muted)" }}> · {game.homePitcher.seasonERA.toFixed(2)} ERA</span>}</>
                  : "Starter TBD"}
              </p>
            )}
          </div>
        </div>

        {/* THE READ */}
        {signal && (
          <div style={{ background: "#EDEAE3", borderRadius: "4px", padding: "10px 13px", marginBottom: "14px" }}>
            <p style={{ fontSize: "9px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--muted)", marginBottom: "5px" }}>The Read</p>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--ink)", lineHeight: 1.5 }}>{signal}</p>
          </div>
        )}

        {/* Odds */}
        <OddsRow game={game} homeTeamAbv={homeTeam.teamAbv} awayTeamAbv={awayTeam.teamAbv} />
      </ClickableCard>
    );
  }

  // Dead (final / live) card
  if (isDead) {
    return (
      <div className="w-full text-left" style={{ background: "var(--paper)", borderRadius: "6px", border: "0.5px solid var(--border)", padding: "18px 24px", opacity: 0.5 }}>
        <div className="flex justify-between items-center" style={{ marginBottom: "10px" }}>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>{gameTime || "Time TBD"}</span>
          {effectiveStatus === "live" && (
            <div className="flex items-center gap-[5px]">
              <span className="w-[5px] h-[5px] rounded-full animate-pulse block" style={{ background: "var(--signal)" }} />
              <span style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em", color: "var(--signal)" }}>Live</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3" style={{ marginBottom: "10px" }}>
          <div className="flex-1">
            <p style={{ fontSize: "10px", fontWeight: 500, textTransform: "uppercase", color: "var(--muted)", marginBottom: "3px" }}>{awayCity}</p>
            <p style={{ fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: 500, color: "var(--ink)", lineHeight: 1.1 }}>{awayNickname}</p>
          </div>
          {atConnector}
          <div className="flex-1 text-right">
            <p style={{ fontSize: "10px", fontWeight: 500, textTransform: "uppercase", color: "var(--muted)", marginBottom: "3px" }}>{homeCity}</p>
            <p style={{ fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: 500, color: "var(--ink)", lineHeight: 1.1 }}>{homeNickname}</p>
          </div>
        </div>
        <p style={{ fontSize: "11px", color: "var(--muted)", fontStyle: "italic" }}>
          {effectiveStatus === "live" ? "Game in progress · Breakdowns only generated before start of game" : "Game ended · Check back tomorrow"}
        </p>
      </div>
    );
  }

  // Tomorrow preview card
  return (
    <div className="w-full text-left" style={{ background: "var(--paper)", borderRadius: "6px", border: "0.5px solid var(--border)", padding: "18px 24px", opacity: 0.65 }}>
      <div style={{ marginBottom: "10px" }}>
        <span style={{ fontSize: "12px", color: "var(--muted)" }}>{gameTime || "Time TBD"}</span>
      </div>
      <div className="flex items-center gap-3" style={{ marginBottom: "10px" }}>
        <div className="flex-1">
          <p style={{ fontSize: "10px", fontWeight: 500, textTransform: "uppercase", color: "var(--muted)", marginBottom: "3px" }}>{awayCity}</p>
          <p style={{ fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: 500, color: "var(--ink)", lineHeight: 1.1 }}>{awayNickname}</p>
        </div>
        {atConnector}
        <div className="flex-1 text-right">
          <p style={{ fontSize: "10px", fontWeight: 500, textTransform: "uppercase", color: "var(--muted)", marginBottom: "3px" }}>{homeCity}</p>
          <p style={{ fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: 500, color: "var(--ink)", lineHeight: 1.1 }}>{homeNickname}</p>
        </div>
      </div>
      <p style={{ fontSize: "11px", color: "var(--muted)", fontStyle: "italic" }}>Breakdown available day of game</p>
    </div>
  );
}
