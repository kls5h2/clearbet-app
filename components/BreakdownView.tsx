"use client";

import type { BreakdownResult, AnyGame, FragilityColor, MLBGame } from "@/lib/types";
import ConfidenceBadge from "./ConfidenceBadge";
import GlossaryCallout from "./GlossaryCallout";
import { getActiveTeamColor } from "@/lib/team-colors";

interface Props {
  breakdown: BreakdownResult;
  game: AnyGame;
}

// dot colors per mockup
const DOT_GREEN = "#16A34A";
const DOT_RED   = "#DC2626";
const DOT_BLUE  = "#3A5470";
const DOT_AMBER = "#D97706";

const fragilityDot: Record<FragilityColor, string> = {
  red:   DOT_RED,
  green: DOT_GREEN,
  amber: DOT_AMBER,
};

const fragilityBg: Record<FragilityColor, { bg: string; border: string }> = {
  red:   { bg: "#FEF2F2", border: "#FECACA" },
  green: { bg: "#F0FDF4", border: "#BBF7D0" },
  amber: { bg: "#FFFBEB", border: "#FDE68A" },
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
  if (confidenceLabel === "LEAN") return "Lean";
  if (confidenceLabel === "CLEAR SPOT") return "Clear spot";
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

// Section header: number + title + extending line — per mockup
function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-[14px]">
      <span style={{ fontSize: "10px", fontWeight: 800, color: "#0A7A6C", letterSpacing: "0.1em" }}>{number}</span>
      <span style={{ fontSize: "11px", fontWeight: 800, color: "#0D1B2E", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>{title}</span>
      <div style={{ flex: 1, height: "1px", background: "#EEF1F5" }} />
    </div>
  );
}

// Prose card — lighter shadow
function ProseCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "#FFFFFF", borderRadius: "14px", padding: "20px 22px",
      marginBottom: "10px", boxShadow: "0 1px 4px rgba(13,27,46,0.05)",
    }}>
      {children}
    </div>
  );
}

// Bullet card — heavier shadow
function BulletCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "#FFFFFF", borderRadius: "14px", padding: "20px 22px",
      marginBottom: "10px",
      boxShadow: "0 2px 10px rgba(13,27,46,0.07), 0 1px 3px rgba(13,27,46,0.04)",
    }}>
      {children}
    </div>
  );
}

const proseBodyStyle: React.CSSProperties = {
  fontSize: "15px", fontWeight: 500, color: "#3A5470", lineHeight: 1.75,
};
const bulletStyle: React.CSSProperties = {
  display: "flex", alignItems: "flex-start", gap: "10px",
  fontSize: "15px", fontWeight: 500, color: "#3A5470", lineHeight: 1.65,
};
const legendStyle: React.CSSProperties = {
  display: "flex", flexWrap: "wrap" as const, gap: "12px",
  marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #F0F3F7",
};
const legendItemStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "5px",
  fontSize: "10px", fontWeight: 600, color: "#637A96",
};

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

  const showNBAEarlyBanner = !isMLB && gameStatus === "scheduled" && isGeneratedEarly(game.gameTime);

  const awayCity = awayTeam.teamCity || awayTeam.teamName.split(" ").slice(0, -1).join(" ");
  const awayNickname = awayTeam.teamCity
    ? awayTeam.teamName.replace(awayTeam.teamCity, "").trim()
    : awayTeam.teamName;
  const homeCity = homeTeam.teamCity || homeTeam.teamName.split(" ").slice(0, -1).join(" ");
  const homeNickname = homeTeam.teamCity
    ? homeTeam.teamName.replace(homeTeam.teamCity, "").trim()
    : homeTeam.teamName;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Status banners */}
      {gameStatus === "final" && (
        <div style={{ background: "#F2F5F8", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#637A96" }}>Final</span>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#637A96" }}>
            This game has ended. Breakdown was generated before {isMLB ? "first pitch" : "tip-off"}.
          </span>
        </div>
      )}
      {gameStatus === "live" && (
        <div style={{ background: "#F0FAF8", border: "1px solid rgba(10,122,108,0.2)", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#DC2626", display: "block" }} className="animate-pulse" />
            <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#DC2626" }}>Live</span>
          </div>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#637A96" }}>Game in progress. Breakdowns only generated before start of game.</span>
        </div>
      )}

      {/* Game header card */}
      <div style={{
        background: "#FFFFFF", borderRadius: "14px", padding: "22px 22px 20px",
        marginBottom: "10px",
        boxShadow: "0 2px 10px rgba(13,27,46,0.07), 0 1px 3px rgba(13,27,46,0.04)",
      }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#637A96", letterSpacing: "0.06em", marginBottom: "14px" }}>
          {game.gameTime || "Time TBD"}
        </p>

        {/* Matchup with "at" word */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#637A96", marginBottom: "3px" }}>{awayCity}</p>
            <p style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, color: getActiveTeamColor(awayTeam.teamAbv, game.sport) }}>{awayNickname}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", padding: "0 14px", paddingBottom: "2px", flexShrink: 0 }}>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#637A96", letterSpacing: "0.04em", lineHeight: 1 }}>at</span>
          </div>
          <div style={{ flex: 1, textAlign: "right" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#637A96", marginBottom: "3px" }}>{homeCity}</p>
            <p style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, color: getActiveTeamColor(homeTeam.teamAbv, game.sport) }}>{homeNickname}</p>
          </div>
        </div>

        {/* MLB probable starters */}
        {isMLB && (() => {
          const g = game as MLBGame;
          const fmtHand = (hand: "L" | "R" | null) => hand ? (hand === "L" ? "LHP" : "RHP") : null;
          const awayName = g.awayPitcher && !isPitcherUnknown(g.awayPitcher.name) ? g.awayPitcher.name : "Starter TBD";
          const awayHand = g.awayPitcher && !isPitcherUnknown(g.awayPitcher.name) ? fmtHand(g.awayPitcher.hand) : null;
          const awayERA = g.awayPitcher && !isPitcherUnknown(g.awayPitcher.name) && g.awayPitcher.seasonERA != null && g.awayPitcher.seasonERA > 0 ? g.awayPitcher.seasonERA.toFixed(2) : null;
          const homeName = g.homePitcher && !isPitcherUnknown(g.homePitcher.name) ? g.homePitcher.name : "Starter TBD";
          const homeHand = g.homePitcher && !isPitcherUnknown(g.homePitcher.name) ? fmtHand(g.homePitcher.hand) : null;
          const homeERA = g.homePitcher && !isPitcherUnknown(g.homePitcher.name) && g.homePitcher.seasonERA != null && g.homePitcher.seasonERA > 0 ? g.homePitcher.seasonERA.toFixed(2) : null;
          return (
            <div style={{ display: "flex", marginBottom: "16px", gap: "8px" }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#B0BAC9", marginBottom: "4px" }}>Away Starter</p>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#0D1B2E", letterSpacing: "-0.01em", marginBottom: "2px" }}>{awayName}</p>
                {(awayHand || awayERA) && (
                  <p style={{ fontSize: "12px", fontWeight: 500, color: "#637A96" }}>
                    {[awayHand, awayERA ? `${awayERA} ERA` : null].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              <div style={{ flex: 1, textAlign: "right" }}>
                <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#B0BAC9", marginBottom: "4px" }}>Home Starter</p>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#0D1B2E", letterSpacing: "-0.01em", marginBottom: "2px" }}>{homeName}</p>
                {(homeHand || homeERA) && (
                  <p style={{ fontSize: "12px", fontWeight: 500, color: "#637A96" }}>
                    {[homeERA ? `${homeERA} ERA` : null, homeHand].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            </div>
          );
        })()}

        {/* Odds row */}
        {odds && (
          <div style={{ display: "flex", background: "#F7F9FB", borderRadius: "8px", padding: "10px 12px", marginBottom: "16px" }}>
            {!isMLB && "spread" in odds && (
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#B0BAC9", marginBottom: "4px" }}>Spread</p>
                <p style={{ fontSize: "14px", fontWeight: 800, color: "#0D1B2E", letterSpacing: "-0.01em" }}>
                  {odds.spread !== null ? `${homeTeam.teamAbv} ${odds.spread > 0 ? `+${odds.spread}` : odds.spread}` : "—"}
                </p>
              </div>
            )}
            {isMLB && "runLine" in odds && (
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#B0BAC9", marginBottom: "4px" }}>Run Line</p>
                <p style={{ fontSize: "14px", fontWeight: 800, color: "#0D1B2E", letterSpacing: "-0.01em" }}>
                  {odds.runLine !== null ? `${homeTeam.teamAbv} ${odds.runLine > 0 ? `+${odds.runLine}` : odds.runLine}` : "—"}
                </p>
              </div>
            )}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#B0BAC9", marginBottom: "4px" }}>Total</p>
              <p style={{ fontSize: "14px", fontWeight: 800, color: "#0D1B2E", letterSpacing: "-0.01em" }}>{odds.total !== null ? `O/U ${odds.total}` : "—"}</p>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#B0BAC9", marginBottom: "4px" }}>{awayTeam.teamAbv} ML</p>
              <p style={{ fontSize: "14px", fontWeight: 800, color: "#0D1B2E", letterSpacing: "-0.01em" }}>
                {odds.awayMoneyline !== null ? (odds.awayMoneyline > 0 ? `+${odds.awayMoneyline}` : `${odds.awayMoneyline}`) : "—"}
              </p>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#B0BAC9", marginBottom: "4px" }}>{homeTeam.teamAbv} ML</p>
              <p style={{ fontSize: "14px", fontWeight: 800, color: "#0D1B2E", letterSpacing: "-0.01em" }}>
                {odds.homeMoneyline !== null ? (odds.homeMoneyline > 0 ? `+${odds.homeMoneyline}` : `${odds.homeMoneyline}`) : "—"}
              </p>
            </div>
          </div>
        )}

        {/* Confidence row */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ConfidenceBadge level={breakdown.confidenceLevel} label={breakdown.confidenceLabel} />
        </div>

        {/* Early / pitcher banners */}
        {(showMLBPitcherBanner || showNBAEarlyBanner) && (
          <div style={{ marginTop: "12px", background: "#FEF9EC", border: "1px solid #FDE68A", borderRadius: "10px", padding: "10px 14px", fontSize: "12px", fontWeight: 600, color: "#92400E", lineHeight: 1.5 }}>
            {showMLBPitcherBanner
              ? "This breakdown updates closer to first pitch — check back for the latest starter information."
              : "Early read — injury and lineup updates may change this picture. Refresh closer to game time."}
          </div>
        )}
      </div>

      {/* 01 — Game Shape (prose) */}
      <ProseCard>
        <SectionHeader number="01" title="Game Shape" />
        <p style={proseBodyStyle}>{breakdown.gameShape}</p>
      </ProseCard>

      {/* 02 — Key Drivers (bullet) */}
      <BulletCard>
        <SectionHeader number="02" title="Key Drivers" />
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {breakdown.keyDrivers.map((driver, i) => (
            <div key={i} style={bulletStyle}>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0, marginTop: "6px", background: driver.direction === "positive" ? DOT_GREEN : driver.direction === "negative" ? DOT_RED : DOT_BLUE }} />
              <div>{driver.factor}</div>
            </div>
          ))}
        </div>
        <div style={legendStyle}>
          {[
            { color: DOT_GREEN, label: "Supports script" },
            { color: DOT_RED,   label: "Works against" },
            { color: DOT_BLUE,  label: "Neutral context" },
            { color: DOT_AMBER, label: "Injury / uncertainty" },
          ].map((item) => (
            <div key={item.label} style={legendItemStyle}>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: item.color, flexShrink: 0 }} />
              {item.label}
            </div>
          ))}
        </div>
      </BulletCard>

      {/* 03 — Base Script (prose) */}
      <ProseCard>
        <SectionHeader number="03" title="Base Script" />
        <p style={proseBodyStyle}>{breakdown.baseScript}</p>
      </ProseCard>

      {/* 04 — Fragility Check (bullet) */}
      <BulletCard>
        <SectionHeader number="04" title="Fragility Check" />
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {breakdown.fragilityCheck.map((item, i) => {
            const bg = fragilityBg[item.color];
            return (
              <div key={i} style={{ ...bulletStyle, border: `1px solid ${bg.border}`, background: bg.bg, borderRadius: "8px", padding: "10px 12px" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0, marginTop: "6px", background: fragilityDot[item.color] }} />
                <div>{item.item}</div>
              </div>
            );
          })}
        </div>
        <div style={legendStyle}>
          {[
            { color: DOT_RED,   label: "Works against" },
            { color: DOT_GREEN, label: "Reinforces" },
            { color: DOT_AMBER, label: "Injury / uncertainty" },
          ].map((item) => (
            <div key={item.label} style={legendItemStyle}>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: item.color, flexShrink: 0 }} />
              {item.label}
            </div>
          ))}
        </div>
      </BulletCard>

      {/* 05 — Market Read (prose) */}
      <ProseCard>
        <SectionHeader number="05" title="Market Read" />
        <p style={proseBodyStyle}>
          {odds
            ? breakdown.marketRead
            : `Lines haven't posted yet — check back closer to ${isMLB ? "first pitch" : "tip-off"} for the full market picture.`}
        </p>
      </ProseCard>

      {/* 06 — The Edge (bullet) — always rendered to keep 01–07 sequential */}
      <BulletCard>
        <SectionHeader number="06" title="The Edge" />
        {breakdown.edge && breakdown.edge.length > 0 ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {breakdown.edge.map((item, i) => (
                <div key={i} style={bulletStyle}>
                  <div style={{ width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0, marginTop: "6px", background: DOT_BLUE }} />
                  <div>{item}</div>
                </div>
              ))}
            </div>
            {breakdown.edgeClosingLine && (
              <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #EEF1F5", fontSize: "12px", fontWeight: 600, color: "#637A96", fontStyle: "italic" }}>
                {breakdown.edgeClosingLine}
              </div>
            )}
          </>
        ) : (
          <p style={proseBodyStyle}>No specific market edge identified — the line appears to price this game fairly based on available data.</p>
        )}
      </BulletCard>

      {/* 07 — What This Means (prose) */}
      <ProseCard>
        <SectionHeader number="07" title="What This Means" />
        <p style={proseBodyStyle}>{breakdown.decisionLens}</p>
        <GlossaryCallout term={breakdown.glossaryTerm} definition={breakdown.glossaryDefinition} />
      </ProseCard>
    </div>
  );
}
