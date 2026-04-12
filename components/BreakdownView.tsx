"use client";

import type { BreakdownResult, AnyGame, FragilityColor, MLBGame } from "@/lib/types";
import ConfidenceBadge from "./ConfidenceBadge";
import GlossaryCallout from "./GlossaryCallout";

interface Props {
  breakdown: BreakdownResult;
  game: AnyGame;
}

const fragilityColors: Record<FragilityColor, { dot: string; text: string; bg: string; border: string }> = {
  red: {
    dot: "bg-[#D0342C]",
    text: "text-[#D0342C]",
    bg: "bg-[#FEF2F2]",
    border: "border-[#FECACA]",
  },
  green: {
    dot: "bg-[#1A7A4A]",
    text: "text-[#1A7A4A]",
    bg: "bg-[#F0FDF4]",
    border: "border-[#BBF7D0]",
  },
  amber: {
    dot: "bg-[#B45309]",
    text: "text-[#B45309]",
    bg: "bg-[#FFFBEB]",
    border: "border-[#FDE68A]",
  },
};

function isPitcherUnknown(name: string | undefined | null): boolean {
  if (!name) return true;
  const n = name.toLowerCase().trim();
  return n === "" || n === "tbd" || n.startsWith("unknown");
}

function isGeneratedEarly(gameTime: string): boolean {
  const match = gameTime.match(/^(\d{1,2}):(\d{2})\s+(AM|PM)\s+ET$/i);
  if (!match) return false;
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
  const minutesUntil = gameHour * 60 + gameMins - (currentHour * 60 + currentMin);
  return minutesUntil > 240;
}

function getArchetype(
  confidenceLabel: import("@/lib/types").ConfidenceLabel,
  odds: AnyGame["odds"],
  sport: "NBA" | "MLB"
): string {
  if (confidenceLabel === "PASS") return "Avoid";
  if (confidenceLabel === "FRAGILE") return "Handle with care";
  const total = odds?.total ?? null;
  if (sport === "MLB") {
    if (total !== null && total >= 9.5) return "High-run environment";
    if (total !== null && total <= 7.5) return "Pitching showcase";
    return "Standard game";
  }
  const spread = odds && "spread" in odds ? odds.spread : null;
  const absSpread = spread !== null ? Math.abs(spread) : null;
  const highTotal = total !== null && total >= 220;
  const lowTotal = total !== null && total <= 212;
  if (absSpread !== null && absSpread > 7) return "Blowout risk";
  if (absSpread !== null && absSpread >= 3) {
    if (highTotal) return "Scoring showcase";
    return "Controlled game";
  }
  if (highTotal) return "Open game";
  if (lowTotal) return "Grind";
  return "Open game";
}

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="font-mono text-[11px] font-bold text-[#0A7A6C] tracking-[0.12em] shrink-0">{number}</span>
      <h2 className="font-heading text-[12px] font-bold text-[#0D1B2E] tracking-[0.08em] uppercase whitespace-nowrap shrink-0">
        {title}
      </h2>
      <div className="flex-1 h-px bg-[#E8ECF2]" />
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-[#E8ECF2] rounded-xl p-6 shadow-[0_1px_4px_rgba(13,27,46,0.05)] ${className}`}>
      {children}
    </div>
  );
}

export default function BreakdownView({ breakdown, game }: Props) {
  const { homeTeam, awayTeam, gameStatus } = game;
  const odds = game.odds;
  const isMLB = game.sport === "MLB";

  const showMLBPitcherBanner = (() => {
    if (!isMLB || gameStatus === "final") return false;
    const g = game as MLBGame;
    return (
      g.homePitcher === null || g.awayPitcher === null ||
      isPitcherUnknown(g.homePitcher?.name) || isPitcherUnknown(g.awayPitcher?.name)
    );
  })();

  const showNBAEarlyBanner =
    !isMLB && gameStatus === "scheduled" && isGeneratedEarly(game.gameTime);

  return (
    <div className="space-y-3">
      {/* Game status banners */}
      {gameStatus === "final" && (
        <div className="bg-[#F2F5F8] border border-[#E2E8F0] rounded-xl px-5 py-3 flex items-center gap-3">
          <span className="font-mono text-[9px] font-bold text-[#9FADBF] tracking-[0.12em] uppercase shrink-0">Final</span>
          <span className="text-[13px] text-[#637A96]">
            This game has ended. Breakdown was generated before {isMLB ? "first pitch" : "tip-off"}.
          </span>
        </div>
      )}
      {gameStatus === "live" && (
        <div className="bg-[#F0FAF8] border border-[#D4EDE9] rounded-xl px-5 py-3 flex items-center gap-3">
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="w-[6px] h-[6px] rounded-full bg-[#0A7A6C] animate-pulse" />
            <span className="font-mono text-[9px] font-bold text-[#0A7A6C] tracking-[0.12em] uppercase">Live</span>
          </span>
          <span className="text-[13px] text-[#637A96]">Game in progress. Breakdown was generated pre-game.</span>
        </div>
      )}

      {/* Matchup header */}
      <Card>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-mono text-[10px] font-bold text-[#9FADBF] tracking-[0.1em] uppercase mb-1.5">
              {game.gameTime || "Time TBD"}
            </p>
            <h1 className="font-heading text-[24px] font-extrabold text-[#0D1B2E] leading-tight">
              {awayTeam.teamAbv} @ {homeTeam.teamAbv}
            </h1>
            <p className="text-[13px] text-[#637A96] mt-1">
              {awayTeam.teamName} at {homeTeam.teamName}
            </p>
          </div>

          {odds && (
            <div className="flex gap-5 text-right flex-wrap">
              {!isMLB && "spread" in odds && odds.spread !== null && (
                <div>
                  <p className="font-mono text-[9px] font-bold text-[#9FADBF] uppercase tracking-[0.1em]">Spread</p>
                  <p className="font-mono text-[13px] font-semibold text-[#0D1B2E] mt-0.5">
                    {homeTeam.teamAbv} {odds.spread > 0 ? `+${odds.spread}` : odds.spread}
                  </p>
                </div>
              )}
              {isMLB && "runLine" in odds && odds.runLine !== null && (
                <div>
                  <p className="font-mono text-[9px] font-bold text-[#9FADBF] uppercase tracking-[0.1em]">Run Line</p>
                  <p className="font-mono text-[13px] font-semibold text-[#0D1B2E] mt-0.5">
                    {homeTeam.teamAbv} {odds.runLine > 0 ? `+${odds.runLine}` : odds.runLine}
                  </p>
                </div>
              )}
              {odds.total !== null && (
                <div>
                  <p className="font-mono text-[9px] font-bold text-[#9FADBF] uppercase tracking-[0.1em]">
                    {isMLB ? "Total" : "Total"}
                  </p>
                  <p className="font-mono text-[13px] font-semibold text-[#0D1B2E] mt-0.5">O/U {odds.total}</p>
                </div>
              )}
              {odds.impliedHomeProbability !== null && (
                <div>
                  <p className="font-mono text-[9px] font-bold text-[#9FADBF] uppercase tracking-[0.1em]">
                    {homeTeam.teamAbv} Win%
                  </p>
                  <p className="font-mono text-[13px] font-semibold text-[#0D1B2E] mt-0.5">
                    {odds.impliedHomeProbability}%
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-[#E8ECF2]">
          <div className="flex items-center gap-3 flex-wrap">
            <ConfidenceBadge
              level={breakdown.confidenceLevel}
              label={breakdown.confidenceLabel}
            />
            {breakdown.confidenceLabel !== "PASS" && (
              <span className="inline-flex items-center px-[10px] py-[3px] rounded-full font-mono text-[10px] font-bold tracking-widest uppercase bg-[#F0F3F7] text-[#637A96] border border-[#E8ECF2]">
                {getArchetype(breakdown.confidenceLabel, odds, game.sport)}
              </span>
            )}
          </div>

          {(showMLBPitcherBanner || showNBAEarlyBanner) && (
            <div className="mt-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg px-4 py-2.5">
              <p className="font-mono text-[10px] text-[#B45309] leading-relaxed">
                {showMLBPitcherBanner
                  ? "This breakdown updates closer to first pitch — check back for the latest starter information."
                  : "Generated early — check injury report closer to tip-off for the latest."}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* 01 — Game Shape */}
      <Card>
        <SectionHeader number="01" title="Game Shape" />
        <p className="text-[15px] text-[#0D1B2E] leading-[1.75]">{breakdown.gameShape}</p>
      </Card>

      {/* 02 — Key Drivers */}
      <Card>
        <SectionHeader number="02" title="Key Drivers" />
        <div className="space-y-3">
          {breakdown.keyDrivers.map((driver, i) => (
            <div key={i} className="flex items-start gap-3">
              <span
                className={`mt-[7px] shrink-0 w-[7px] h-[7px] rounded-full block ${
                  driver.direction === "positive"
                    ? "bg-[#1A7A4A]"
                    : driver.direction === "negative"
                    ? "bg-[#D0342C]"
                    : "bg-[#3B82F6]"
                }`}
              />
              <p className="text-[15px] text-[#0D1B2E] leading-[1.75] flex-1">{driver.factor}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 pt-3 border-t border-[#E8ECF2] flex items-center gap-5 flex-wrap">
          {[
            { color: "bg-[#1A7A4A]", label: "Supports script" },
            { color: "bg-[#D0342C]", label: "Works against" },
            { color: "bg-[#3B82F6]", label: "Neutral context" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className={`w-[7px] h-[7px] rounded-full ${item.color}`} />
              <span className="font-mono text-[9px] font-bold text-[#9FADBF] tracking-[0.08em] uppercase">{item.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 03 — Base Script */}
      <Card>
        <SectionHeader number="03" title="Base Script" />
        <p className="text-[15px] text-[#0D1B2E] leading-[1.75]">{breakdown.baseScript}</p>
      </Card>

      {/* 04 — Fragility Check */}
      <Card>
        <SectionHeader number="04" title="Fragility Check" />
        <div className="space-y-2">
          {breakdown.fragilityCheck.map((item, i) => {
            const style = fragilityColors[item.color];
            return (
              <div
                key={i}
                className={`flex items-start gap-3 border rounded-lg px-4 py-3 ${style.bg} ${style.border}`}
              >
                <span className={`mt-[7px] shrink-0 w-[7px] h-[7px] rounded-full ${style.dot}`} />
                <p className="text-[15px] text-[#0D1B2E] leading-[1.75]">{item.item}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-5 pt-3 border-t border-[#E8ECF2] flex items-center gap-5 flex-wrap">
          {[
            { color: "bg-[#D0342C]", label: "Works against" },
            { color: "bg-[#1A7A4A]", label: "Reinforces" },
            { color: "bg-[#B45309]", label: "Uncertainty" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className={`w-[7px] h-[7px] rounded-full ${item.color}`} />
              <span className="font-mono text-[9px] font-bold text-[#9FADBF] tracking-[0.08em] uppercase">{item.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 05 — Market Read */}
      <Card>
        <SectionHeader number="05" title="Market Read" />
        <p className="text-[15px] text-[#0D1B2E] leading-[1.75]">
          {odds
            ? breakdown.marketRead
            : `Lines haven't posted yet — check back closer to ${isMLB ? "first pitch" : "tip-off"} for the full market picture.`}
        </p>
      </Card>

      {/* 06 — The Edge */}
      {breakdown.edge && breakdown.edge.length > 0 && (
        <Card>
          <SectionHeader number="06" title="The Edge" />
          <div className="space-y-3">
            {breakdown.edge.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="mt-[7px] shrink-0 w-[7px] h-[7px] rounded-full block bg-[#0A7A6C]" />
                <p className="text-[15px] text-[#0D1B2E] leading-[1.75] flex-1">{item}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 pt-3 border-t border-[#E8ECF2] text-[13px] text-[#637A96] italic leading-relaxed">
            {breakdown.edgeClosingLine}
          </p>
        </Card>
      )}

      {/* 07 — What This Means */}
      <Card>
        <SectionHeader number="07" title="What This Means" />
        <p className="text-[15px] text-[#0D1B2E] leading-[1.75]">{breakdown.decisionLens}</p>
        <GlossaryCallout
          term={breakdown.glossaryTerm}
          definition={breakdown.glossaryDefinition}
        />
      </Card>
    </div>
  );
}
