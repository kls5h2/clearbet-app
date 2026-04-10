"use client";

import type { BreakdownResult, AnyGame, FragilityColor, MLBGame } from "@/lib/types";
import ConfidenceBadge from "./ConfidenceBadge";
import GlossaryCallout from "./GlossaryCallout";

interface Props {
  breakdown: BreakdownResult;
  game: AnyGame;
}

const fragilityColors: Record<FragilityColor, { dot: string; text: string; bg: string }> = {
  red: {
    dot: "bg-[#D0342C]",
    text: "text-[#D0342C]",
    bg: "bg-red-50 border-red-100",
  },
  green: {
    dot: "bg-[#1A7A4A]",
    text: "text-[#1A7A4A]",
    bg: "bg-green-50 border-green-100",
  },
  amber: {
    dot: "bg-[#B45309]",
    text: "text-[#B45309]",
    bg: "bg-amber-50 border-amber-100",
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
  return minutesUntil > 240; // more than 4 hours before tip-off
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
    // Run line is always ±1.5 — use total as primary differentiator
    if (total !== null && total >= 9.5) return "High-run environment";
    if (total !== null && total <= 7.5) return "Pitching showcase";
    return "Standard game";
  }

  // NBA
  const spread = odds && "spread" in odds ? odds.spread : null;
  const absSpread = spread !== null ? Math.abs(spread) : null;
  const highTotal = total !== null && total >= 220;
  const lowTotal = total !== null && total <= 212;

  if (absSpread !== null && absSpread > 7) return "Blowout risk";
  if (absSpread !== null && absSpread >= 3) {
    if (highTotal) return "Scoring showcase";
    if (lowTotal) return "Controlled game";
    return "Controlled game";
  }
  if (highTotal) return "Open game";
  if (lowTotal) return "Grind";
  return "Open game";
}

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3 mb-4">
      <span className="font-mono text-xs font-medium text-[#0A7A6C] tracking-widest">{number}</span>
      <h2 className="font-heading text-[14px] font-bold text-[#0D1B2E] tracking-wide uppercase">
        {title}
      </h2>
    </div>
  );
}

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-[#E0E5EE] rounded-xl p-6 ${className}`}>
      {children}
    </div>
  );
}

export default function BreakdownView({ breakdown, game }: Props) {
  const { homeTeam, awayTeam, gameStatus } = game;
  const odds = game.odds;
  const isMLB = game.sport === "MLB";

  // MLB: warn if either starter is unconfirmed at generation time
  const showMLBPitcherBanner = (() => {
    if (!isMLB || gameStatus === "final") return false;
    const g = game as MLBGame;
    return (
      g.homePitcher === null || g.awayPitcher === null ||
      isPitcherUnknown(g.homePitcher?.name) || isPitcherUnknown(g.awayPitcher?.name)
    );
  })();

  // NBA: warn if breakdown was generated more than 4 hours before tip-off
  const showNBAEarlyBanner =
    !isMLB && gameStatus === "scheduled" && isGeneratedEarly(game.gameTime);

  return (
    <div className="space-y-4">
      {/* Game status banners */}
      {gameStatus === "final" && (
        <div className="bg-[#F4F6F9] border border-[#E0E5EE] rounded-xl px-5 py-3 flex items-center gap-3">
          <span className="font-mono text-[10px] font-semibold text-[#6B7A90] tracking-widest uppercase">Final</span>
          <span className="text-sm text-[#6B7A90]">This game has ended. This breakdown was generated before {isMLB ? "first pitch" : "tip-off"}.</span>
        </div>
      )}
      {gameStatus === "live" && (
        <div className="bg-[#F0FAF8] border border-[#0A7A6C]/20 rounded-xl px-5 py-3 flex items-center gap-3">
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0A7A6C] animate-pulse" />
            <span className="font-mono text-[10px] font-semibold text-[#0A7A6C] tracking-widest uppercase">Live</span>
          </span>
          <span className="text-sm text-[#6B7A90]">This game is in progress. Breakdown was generated pre-game.</span>
        </div>
      )}

      {/* Matchup header */}
      <div className="bg-white border border-[#E0E5EE] rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-mono text-xs font-medium text-[#6B7A90] tracking-widest uppercase mb-1">
              {game.gameTime}
            </p>
            <h1 className="font-heading text-2xl font-extrabold text-[#0D1B2E]">
              {awayTeam.teamAbv} @ {homeTeam.teamAbv}
            </h1>
            <p className="text-sm text-[#6B7A90] mt-1">
              {awayTeam.teamName} at {homeTeam.teamName}
            </p>
          </div>

          {odds && (
            <div className="flex gap-6 text-right">
              {/* NBA: spread | MLB: run line */}
              {!isMLB && "spread" in odds && odds.spread !== null && (
                <div>
                  <p className="font-mono text-[10px] font-medium text-[#6B7A90] uppercase tracking-widest">Spread</p>
                  <p className="font-mono text-sm font-semibold text-[#0D1B2E]">
                    {homeTeam.teamAbv} {odds.spread > 0 ? `+${odds.spread}` : odds.spread}
                  </p>
                </div>
              )}
              {isMLB && "runLine" in odds && odds.runLine !== null && (
                <div>
                  <p className="font-mono text-[10px] font-medium text-[#6B7A90] uppercase tracking-widest">Run Line</p>
                  <p className="font-mono text-sm font-semibold text-[#0D1B2E]">
                    {homeTeam.teamAbv} {odds.runLine > 0 ? `+${odds.runLine}` : odds.runLine}
                  </p>
                </div>
              )}
              {odds.total !== null && (
                <div>
                  <p className="font-mono text-[10px] font-medium text-[#6B7A90] uppercase tracking-widest">
                    {isMLB ? "Total Runs" : "Total"}
                  </p>
                  <p className="font-mono text-sm font-semibold text-[#0D1B2E]">O/U {odds.total}</p>
                </div>
              )}
              {odds.impliedHomeProbability !== null && (
                <div>
                  <p className="font-mono text-[10px] font-medium text-[#6B7A90] uppercase tracking-widest">
                    {homeTeam.teamAbv} Win%
                  </p>
                  <p className="font-mono text-sm font-semibold text-[#0D1B2E]">
                    {odds.impliedHomeProbability}%
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-[#E0E5EE]">
          <div className="flex items-center gap-3 flex-wrap">
            <ConfidenceBadge
              level={breakdown.confidenceLevel}
              label={breakdown.confidenceLabel}
            />
            {breakdown.confidenceLabel !== "PASS" && (
              <span className="inline-flex items-center px-3 py-1 rounded text-xs font-mono font-medium tracking-widest uppercase bg-[#F4F6F9] text-[#6B7A90] border border-[#E0E5EE]">
                {getArchetype(breakdown.confidenceLabel, odds, game.sport)}
              </span>
            )}
          </div>

          {(showMLBPitcherBanner || showNBAEarlyBanner) && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
              <p className="font-mono text-[10px] text-[#B45309] leading-relaxed">
                {showMLBPitcherBanner
                  ? "This breakdown updates closer to first pitch — check back for the latest starter information."
                  : "Generated early — check injury report closer to tip-off for the latest."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 01 — Game Shape */}
      <Section>
        <SectionHeader number="01" title="Game Shape" />
        <p className="text-base text-[#0D1B2E] leading-[1.7]">{breakdown.gameShape}</p>
      </Section>

      {/* 02 — Key Drivers */}
      <Section>
        <SectionHeader number="02" title="Key Drivers" />
        <div className="space-y-3">
          {breakdown.keyDrivers.map((driver, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-2 shrink-0">
                <span
                  className={`w-2 h-2 rounded-full block ${
                    driver.direction === "positive"
                      ? "bg-[#1A7A4A]"
                      : driver.direction === "negative"
                      ? "bg-[#D0342C]"
                      : "bg-[#1D4ED8]"
                  }`}
                />
              </div>
              <p className="text-[#0D1B2E] leading-[1.7] text-base flex-1">{driver.factor}</p>
            </div>
          ))}
        </div>

        {/* Direction legend */}
        <div className="mt-4 pt-3 border-t border-[#E0E5EE] flex items-center gap-4">
          {[
            { color: "bg-[#1A7A4A]", label: "Supports script" },
            { color: "bg-[#D0342C]", label: "Works against" },
            { color: "bg-[#1D4ED8]", label: "Neutral context" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="font-mono text-[10px] font-medium text-[#6B7A90]">{item.label}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* 03 — Base Script */}
      <Section>
        <SectionHeader number="03" title="Base Script" />
        <p className="text-base text-[#0D1B2E] leading-[1.7]">{breakdown.baseScript}</p>
      </Section>

      {/* 04 — Fragility Check */}
      <Section>
        <SectionHeader number="04" title="Fragility Check" />
        <div className="space-y-3">
          {breakdown.fragilityCheck.map((item, i) => {
            const style = fragilityColors[item.color];
            return (
              <div
                key={i}
                className={`flex items-start gap-3 border rounded-lg px-4 py-3 ${style.bg}`}
              >
                <span className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${style.dot}`} />
                <p className="text-base text-[#0D1B2E] leading-[1.7]">{item.item}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-[#E0E5EE] flex items-center gap-4">
          {[
            { color: "bg-[#D0342C]", label: "Works against" },
            { color: "bg-[#1A7A4A]", label: "Reinforces" },
            { color: "bg-[#B45309]", label: "Injury / uncertainty" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="font-mono text-[10px] font-medium text-[#6B7A90]">{item.label}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* 05 — Market Read */}
      <Section>
        <SectionHeader number="05" title="Market Read" />
        <p className="text-base text-[#0D1B2E] leading-[1.7]">
          {odds
            ? breakdown.marketRead
            : `Lines haven't posted yet for this game — check back closer to ${isMLB ? "first pitch" : "tip-off"} for the full market picture.`}
        </p>
      </Section>

      {/* 06 — The Edge */}
      {breakdown.edge && breakdown.edge.length > 0 && (
        <Section>
          <SectionHeader number="06" title="The Edge" />
          <div className="space-y-3">
            {breakdown.edge.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-2 shrink-0">
                  <span className="w-2 h-2 rounded-full block bg-[#0A7A6C]" />
                </div>
                <p className="text-[#0D1B2E] leading-[1.7] text-base flex-1">{item}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 pt-3 border-t border-[#E0E5EE] text-sm text-[#6B7A90] italic leading-relaxed">
            {breakdown.edgeClosingLine}
          </p>
        </Section>
      )}

      {/* 07 — What This Means */}
      <Section>
        <SectionHeader number="07" title="What This Means" />
        <p className="text-base text-[#0D1B2E] leading-[1.7]">{breakdown.decisionLens}</p>

        {/* Glossary callout */}
        <GlossaryCallout
          term={breakdown.glossaryTerm}
          definition={breakdown.glossaryDefinition}
        />
      </Section>
    </div>
  );
}
