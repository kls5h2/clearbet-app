"use client";

import type { NBAGame, GameStatus } from "@/lib/types";

interface Props {
  game: NBAGame;
  onClick: (gameId: string) => void;
}

function formatSpread(spread: number | null, teamAbv: string): string {
  if (spread === null) return "—";
  const s = spread > 0 ? `+${spread}` : `${spread}`;
  return `${teamAbv} ${s}`;
}

function formatTotal(total: number | null): string {
  if (total === null) return "—";
  return `O/U ${total}`;
}

function formatML(ml: number | null): string {
  if (ml === null) return "—";
  return ml > 0 ? `+${ml}` : `${ml}`;
}

/**
 * Derive effective game status using Tank01 data, falling back to
 * client-side clock comparison when the API still says "scheduled."
 * Parses gameTime like "7:30 PM ET" and compares against current ET time.
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
  if (minutesPast > 180) return "final"; // 3+ hours past tip-off
  return "live";
}

export default function GameCard({ game, onClick }: Props) {
  const { homeTeam, awayTeam, odds, gameTime, gameStatus } = game;

  const effectiveStatus = getEffectiveStatus(gameStatus, gameTime);
  const isClickable = effectiveStatus === "scheduled";

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
      {/* Teal top border */}
      <div className="h-[3px] bg-[#0A7A6C]" />

      <div className="flex">
        {/* Left accent bar on hover */}
        <div className="w-[3px] bg-transparent group-hover:bg-[#0A7A6C] transition-colors duration-200 shrink-0" />

        <div className="flex-1">
          {/* Time strip — teal tint. Shows game time on left, status badge on right when active. */}
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
              <p className="font-heading text-[18px] font-bold text-[#0D1B2E] leading-tight">
                {awayTeam.teamCity}
              </p>
              <p className="font-heading text-[18px] font-extrabold text-[#0D1B2E] leading-tight">
                {awayTeam.teamName.replace(awayTeam.teamCity, "").trim()}
              </p>
            </div>

            <div className="flex flex-col items-center px-3">
              <span className="text-base font-medium text-[#0A7A6C]">@</span>
            </div>

            <div className="flex-1 text-right">
              <p className="text-[11px] font-mono font-medium text-[#6B7A90] uppercase tracking-widest mb-1">Home</p>
              <p className="font-heading text-[18px] font-bold text-[#0D1B2E] leading-tight">
                {homeTeam.teamCity}
              </p>
              <p className="font-heading text-[18px] font-extrabold text-[#0D1B2E] leading-tight">
                {homeTeam.teamName.replace(homeTeam.teamCity, "").trim()}
              </p>
            </div>
          </div>

          {/* Odds strip — only shown when odds data is available */}
          {odds && (
            <div className="px-5 py-3 bg-[#F4F6F9] border-t border-[#E0E5EE] flex items-center justify-between">
              <div className="text-center">
                <p className="font-mono text-[10px] font-medium text-[#6B7A90] uppercase tracking-widest mb-0.5">Spread</p>
                <p className="font-mono text-[15px] font-semibold text-[#0D1B2E]">
                  {formatSpread(odds.spread, homeTeam.teamAbv)}
                </p>
              </div>
              <div className="text-center">
                <p className="font-mono text-[10px] font-medium text-[#6B7A90] uppercase tracking-widest mb-0.5">Total</p>
                <p className="font-mono text-[15px] font-semibold text-[#0D1B2E]">{formatTotal(odds.total)}</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-[10px] font-medium text-[#6B7A90] uppercase tracking-widest mb-0.5">{awayTeam.teamAbv} ML</p>
                <p className="font-mono text-[15px] font-semibold text-[#0D1B2E]">{formatML(odds.awayMoneyline)}</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-[10px] font-medium text-[#6B7A90] uppercase tracking-widest mb-0.5">{homeTeam.teamAbv} ML</p>
                <p className="font-mono text-[15px] font-semibold text-[#0D1B2E]">{formatML(odds.homeMoneyline)}</p>
              </div>
            </div>
          )}

          {/* CTA — "Get breakdown" only shows for scheduled games (before tip-off). This is intentional:
               breakdowns are pre-game only and there is nothing to generate for live or final games. */}
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
