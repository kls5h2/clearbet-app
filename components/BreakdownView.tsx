"use client";

import Link from "next/link";
import type { BreakdownResult, AnyGame, FragilityColor, MLBGame } from "@/lib/types";
import type { Tier } from "@/lib/tier";
import GlossaryCallout from "./GlossaryCallout";

export type GatedReason = "cap" | "mlb";

interface Props {
  breakdown: BreakdownResult;
  game: AnyGame;
  tier?: Tier;
  gated?: GatedReason;
}

const GATE_COPY: Record<GatedReason, { eyebrow: string; heading: string }> = {
  cap: { eyebrow: "Daily limit", heading: "You've used your breakdown for today." },
  mlb: { eyebrow: "Pro coverage", heading: "MLB is a Pro sport." },
};

const PRO_FEATURES = [
  "Full NBA + MLB coverage — every game on the slate",
  "Your complete breakdown archive — filter by sport, date, outcome",
  "Outcome tracking (W / L / Push / No Action) on every breakdown",
  "Share cards for any game",
  "Regenerate any breakdown",
  "Unlimited breakdowns",
];

// Confidence colors
const CONF_COLORS: Record<string, { color: string; label: string }> = {
  "CLEAR SPOT": { color: "var(--clear)", label: "Clear Spot" },
  "LEAN":       { color: "var(--lean)",  label: "Lean" },
  "FRAGILE":    { color: "var(--fragile)", label: "Fragile" },
  "PASS":       { color: "var(--pass)",  label: "Pass" },
};

export function isPitcherUnknown(name: string | undefined | null): boolean {
  if (!name) return true;
  const n = name.toLowerCase().trim();
  return n === "" || n === "tbd" || n.startsWith("unknown");
}

// Step block wrapper
function StepBlock({ stepLabel, children, dark }: { stepLabel: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <div style={{
      marginBottom: "8px",
      background: dark ? "var(--ink)" : "var(--surface)",
      borderRadius: 0,
      border: dark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(17,17,16,0.06)",
      overflow: "hidden",
      boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{
        padding: "16px 20px 0",
        display: "flex", alignItems: "center", gap: "10px",
      }}>
        <span style={{
          fontFamily: "var(--mono)", fontSize: "12px", fontWeight: 600,
          letterSpacing: "0.12em", textTransform: "uppercase",
          color: "var(--signal)",
        }}>
          {stepLabel}
        </span>
        <div style={{ flex: 1, height: "1px", background: dark ? "rgba(255,255,255,0.08)" : "var(--border)" }} />
      </div>
      <div style={{ padding: "12px 20px 20px" }}>
        {children}
      </div>
    </div>
  );
}

// Step text (body prose)
function StepText({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div style={{
      fontSize: "15px", lineHeight: 1.7,
      color: dark ? "rgba(255,255,255,0.75)" : "var(--ink-2)",
    }}>
      {children}
    </div>
  );
}

// Inline tip block
function StepTip({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: "8px",
      marginTop: "14px", padding: "12px 14px",
      background: dark ? "rgba(255,255,255,0.05)" : "rgba(17,17,16,0.03)",
      borderRadius: 0,
      fontSize: "13px", lineHeight: 1.5,
      color: dark ? "rgba(255,255,255,0.45)" : "var(--muted)",
    }}>
      <span style={{ flexShrink: 0, marginTop: "1px" }}>💡</span>
      <span>{children}</span>
    </div>
  );
}

// Driver item (Key Drivers)
function DriverItem({ direction, factor }: { direction: string; factor: string }) {
  const color = direction === "positive" ? "var(--clear)" : direction === "negative" ? "var(--signal)" : direction === "neutral" ? "var(--lean)" : "var(--fragile)";

  // Parse embedded label prefix that Claude writes into the factor text.
  // Extracts team name when present so the label becomes "Works against Toronto"
  // instead of the generic fallback. Strips the prefix from the body text.
  const toTitleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  let label: string;
  let body = factor;

  const worksAgainst = factor.match(/^WORKS AGAINST\s+([A-Z][A-Z ]{1,30}?)\s*[—–:]/i);
  const supportsScript = factor.match(/^SUPPORTS THE SCRIPT\s*[—–:]/i);
  const neutralCtx = factor.match(/^NEUTRAL CONTEXT\s*[—–:]/i);

  if (worksAgainst) {
    label = `Works against ${toTitleCase(worksAgainst[1].trim())}`;
    body = factor.slice(worksAgainst[0].length).trim();
  } else if (supportsScript) {
    label = "Supports the script";
    body = factor.slice(supportsScript[0].length).trim();
  } else if (neutralCtx) {
    label = "Neutral context";
    body = factor.slice(neutralCtx[0].length).trim();
  } else {
    label = direction === "positive" ? "Supports the script"
          : direction === "negative" ? "Works against"
          : direction === "neutral"  ? "Neutral context"
          : "Injury / uncertainty";
  }

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: "12px",
      padding: "12px 14px", background: "var(--cream)", borderRadius: 0,
    }}>
      <div style={{ width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0, marginTop: "6px", background: color }} />
      <div>
        <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.04em", marginBottom: "3px", color }}>{label}</div>
        <div style={{ fontSize: "14px", color: "var(--ink-2)", lineHeight: 1.55 }}>{body}</div>
      </div>
    </div>
  );
}

// Fragility item
function FragilityItem({ item, color: fc }: { item: string; color: FragilityColor }) {
  // Strip any color/warning prefix Claude may have embedded in the item text.
  // Handles: 🔴/🟡/🟢, ⚠️/⚠, "RED —", "AMBER —", "GREEN —" at the start.
  const cleanItem = item
    .replace(/^(?:[🔴🟡🟢]|⚠️?)\s*/u, "")
    .replace(/^(RED|AMBER|GREEN)\s*[—–-]\s*/i, "")
    .trim();

  const dotColor = fc === "green" ? "var(--clear)" : fc === "amber" ? "var(--fragile)" : "var(--signal)";

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: "10px",
      padding: "12px 14px", background: "var(--cream)", borderRadius: 0,
      borderLeft: `2px solid ${dotColor}`,
    }}>
      <div style={{ width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0, marginTop: "5px", background: dotColor }} />
      <div style={{ fontSize: "14px", color: "var(--ink-2)", lineHeight: 1.55 }}>{cleanItem}</div>
    </div>
  );
}

// Market Read block
function MarketLine({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      marginTop: "14px", padding: "16px 18px",
      background: "var(--cream)", borderRadius: 0,
      borderLeft: "3px solid var(--signal)",
      fontSize: "15px", lineHeight: 1.65, color: "var(--ink-2)", fontStyle: "italic",
    }}>
      {children}
    </div>
  );
}

// Prop item for "Where the data points"
function PropItem({ type, text }: { type: string; text: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: "10px",
      padding: "11px 14px", background: "rgba(255,255,255,0.05)",
      borderRadius: 0, borderLeft: "2px solid rgba(255,255,255,0.1)",
    }}>
      <div style={{
        fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600,
        letterSpacing: "0.1em", textTransform: "uppercase",
        color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap",
        paddingTop: "2px", minWidth: "52px",
      }}>
        {type}
      </div>
      <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}

export default function BreakdownView({ breakdown, game, tier = "free", gated }: Props) {
  const { homeTeam, awayTeam, gameStatus } = game;
  const odds = game.odds;
  const isMLB = game.sport === "MLB";
  const confColor = CONF_COLORS[breakdown.confidenceLabel]?.color ?? "var(--clear)";
  const confLabel = CONF_COLORS[breakdown.confidenceLabel]?.label ?? breakdown.confidenceLabel;


  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Status banners */}
      {gameStatus === "final" && (
        <div style={{
          background: "var(--warm-white)", border: "1px solid var(--border-med)",
          borderRadius: 0, padding: "10px 14px", marginBottom: "16px",
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>Final</span>
          <span style={{ fontSize: "13px", color: "var(--muted)" }}>
            This game has ended. Breakdown was generated before {isMLB ? "first pitch" : "tip-off"}.
          </span>
        </div>
      )}
      {gameStatus === "live" && (
        <div style={{
          background: "rgba(201,53,42,0.05)", borderLeft: "3px solid var(--signal)",
          borderRadius: 0, padding: "10px 14px", marginBottom: "16px",
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--signal)", display: "block", flexShrink: 0 }} className="animate-pulse" />
          <span style={{ fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--signal)", flexShrink: 0 }}>Live</span>
          <span style={{ fontSize: "13px", color: "var(--muted)" }}>Game in progress. Breakdowns only generated before start of game.</span>
        </div>
      )}
      {/* Body — six sections, gated-blurrable */}
      <div style={{ position: "relative" }}>
        <div style={gated ? { filter: "blur(6px)", userSelect: "none", pointerEvents: "none" } : undefined}>

          {/* 01 — Game Shape */}
          <StepBlock stepLabel="Game Shape">
            <StepText>{breakdown.gameShape}</StepText>
            <StepTip>Game shape tells you what kind of game this is before anything else. It sets the context for every other factor.</StepTip>
          </StepBlock>

          {/* 02 — Key Drivers */}
          <StepBlock stepLabel="Key Drivers">
            <StepText>The factors that will actually decide this game. Not everything — just what materially matters tonight.</StepText>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
              {breakdown.keyDrivers.map((d, i) => (
                <DriverItem key={i} direction={d.direction} factor={d.factor} />
              ))}
            </div>
            <StepTip>Key drivers are color-coded. Green supports the expected outcome. Red works against it. Amber means injury or uncertainty — check back before game time.</StepTip>
          </StepBlock>

          {/* 03 — Base Script */}
          <StepBlock stepLabel="Base Script">
            <StepText>{breakdown.baseScript}</StepText>
            <StepTip>The base script is not a prediction. It&apos;s the most probable game shape given the data — the foundation everything else is built on.</StepTip>
          </StepBlock>

          {/* 04 — Fragility Check */}
          <StepBlock stepLabel="Fragility Check">
            <StepText>What breaks the base script? These are the specific things that would flip the expected outcome.</StepText>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "14px" }}>
              {breakdown.fragilityCheck.map((item, i) => (
                <FragilityItem key={i} item={item.item} color={item.color} />
              ))}
            </div>
            <StepTip>Read the fragility check before deciding anything. If one of these is already true at game time, the base script changes.</StepTip>
          </StepBlock>

          {/* 05 — Market Read */}
          <StepBlock stepLabel="Market Read">
            <StepText>What the betting market is saying — in plain English.</StepText>
            <MarketLine>
              {odds
                ? breakdown.marketRead
                : gameStatus === "final"
                  ? "Lines reflect conditions at time of generation. See odds snapshot above."
                  : `Lines haven't posted yet — check back closer to ${isMLB ? "first pitch" : "tip-off"} for the full market picture.`}
            </MarketLine>
            <StepTip>Line movement matters. When a line moves toward the underdog, informed money is usually driving it.</StepTip>
          </StepBlock>

          {/* 06 — What This Means (dark step) */}
          <StepBlock stepLabel="What This Means" dark>
            <StepText dark>{breakdown.decisionLens}</StepText>

            {/* Where the data points */}
            {breakdown.edge && breakdown.edge.length > 0 && (
              <div style={{ marginTop: "20px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "20px" }}>
                <div style={{
                  fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 600,
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.35)", marginBottom: "12px",
                  display: "flex", alignItems: "center", gap: "8px",
                }}>
                  <span style={{ width: "14px", height: "1px", background: "var(--signal)", display: "block" }} />
                  Where the data points
                </div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.28)", fontStyle: "italic", marginBottom: "14px", lineHeight: 1.5 }}>
                  Not picks — these are the areas the data creates an edge environment around. You decide.
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {breakdown.edge.map((item, i) => (
                    <PropItem key={i} type={i === 0 ? "Spread" : i === 1 ? "Total" : "Props"} text={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Glossary callout */}
            <div style={{ marginTop: "20px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "20px" }}>
              <GlossaryCallout term={breakdown.glossaryTerm} definition={breakdown.glossaryDefinition} dark />
            </div>
          </StepBlock>

        </div>
        {gated && <GatedBodyOverlay reason={gated} />}
      </div>

      {/* Closing line */}
      <div style={{
        marginTop: "32px", padding: "24px 20px",
        textAlign: "center", borderTop: "1px solid var(--border-med)",
      }}>
        <div style={{
          fontFamily: "var(--mono)", fontSize: "12px", letterSpacing: "0.04em",
          color: "var(--muted)", lineHeight: 1.7,
        }}>
          This is not a pick. This is what the data says.{" "}
          <strong style={{ color: "var(--ink)", fontWeight: 600, display: "block", marginTop: "4px" }}>
            Your decision is always yours.
          </strong>
        </div>
      </div>
    </div>
  );
}

function GatedBodyOverlay({ reason }: { reason: GatedReason }) {
  const copy = GATE_COPY[reason];
  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      paddingTop: "40px",
      background: "linear-gradient(to bottom, rgba(248,246,242,0.35) 0%, rgba(248,246,242,0.94) 18%, rgba(248,246,242,0.98) 100%)",
    }}>
      <div style={{
        background: "var(--ink)", borderRadius: 0,
        padding: "40px 32px",
        maxWidth: "480px", width: "calc(100% - 32px)",
        textAlign: "center",
        boxShadow: "var(--shadow-lg)",
        position: "relative", overflow: "hidden",
      }}>
        <span aria-hidden="true" style={{
          position: "absolute", right: "-30px", top: "-50px",
          fontSize: "280px", fontWeight: 900,
          color: "rgba(201,53,42,0.06)", pointerEvents: "none", lineHeight: 1,
        }}>R</span>

        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{
            fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 500,
            letterSpacing: "0.12em", textTransform: "uppercase",
            color: "var(--signal)", margin: 0, marginBottom: "12px",
          }}>
            {copy.eyebrow}
          </p>
          <h2 style={{
            fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 800,
            letterSpacing: "-0.03em", color: "#fff",
            lineHeight: 1.2, margin: 0, marginBottom: "20px",
          }}>
            {copy.heading}
          </h2>

          <ul style={{
            listStyle: "none", padding: 0, margin: 0, marginBottom: "24px",
            display: "flex", flexDirection: "column", gap: "8px", textAlign: "left",
          }}>
            {PRO_FEATURES.map((feature) => (
              <li key={feature} style={{
                fontSize: "13px", color: "rgba(255,255,255,0.65)",
                lineHeight: 1.5, paddingLeft: "18px", position: "relative",
              }}>
                <span style={{
                  position: "absolute", left: 0, top: "7px",
                  width: "6px", height: "6px", borderRadius: 0, background: "var(--signal)",
                }} />
                {feature}
              </li>
            ))}
          </ul>

          <Link href="/pricing" style={{
            display: "inline-block",
            background: "var(--signal)", color: "#fff",
            fontSize: "13px", fontWeight: 600, letterSpacing: "0.04em",
            textDecoration: "none", padding: "12px 28px", borderRadius: 0,
            boxShadow: "0 2px 8px rgba(201,53,42,0.3)",
            transition: "all 0.15s",
          }}>
            Upgrade to Pro →
          </Link>
        </div>
      </div>
    </div>
  );
}
