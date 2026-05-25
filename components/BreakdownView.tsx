"use client";

import { useState } from "react";
import Link from "next/link";
import type { BreakdownResult, AnyGame, FragilityColor } from "@/lib/types";
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

export function isPitcherUnknown(name: string | undefined | null): boolean {
  if (!name) return true;
  const n = name.toLowerCase().trim();
  return n === "" || n === "tbd" || n.startsWith("unknown");
}

const RULE_COLORS: Record<string, string> = {
  positive: "#4ade80",
  negative: "#C9352A",
  neutral: "#94a3b8",
  amber: "#fb923c",
};

// ─── Market Pressure bar ──────────────────────────────────────────────────────

function MarketPressure({
  breakdown,
  game,
}: {
  breakdown: BreakdownResult;
  game: AnyGame;
}) {
  const odds = game.odds as Record<string, number | null> | null;
  let fillPct = 55;
  if (odds) {
    const homeProb = (odds.impliedHomeProbability as number | null) ?? null;
    const awayProb = (odds.impliedAwayProbability as number | null) ?? null;
    if (homeProb != null && awayProb != null) {
      fillPct = Math.round(Math.max(homeProb, awayProb));
    } else {
      const conf = breakdown.confidenceLabel;
      fillPct = conf === "CLEAR SPOT" ? 72 : conf === "LEAN" ? 60 : conf === "FRAGILE" ? 46 : 34;
    }
  }
  fillPct = Math.min(Math.max(fillPct, 20), 88);

  const previewText = breakdown.marketRead.split(/\.[\s\n]/)[0].trim() + ".";

  return (
    <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(248,246,242,0.06)" }}>
      <div style={{
        fontFamily: "var(--mono)", fontSize: "9px", fontWeight: 600,
        letterSpacing: "0.14em", textTransform: "uppercase",
        color: "rgba(248,246,242,0.28)", marginBottom: "12px",
      }}>
        Market Pressure
      </div>
      <div style={{
        height: "4px", background: "rgba(248,246,242,0.07)",
        borderRadius: "2px", overflow: "hidden", marginBottom: "12px",
      }}>
        <div style={{
          height: "100%", width: `${fillPct}%`,
          background: "var(--signal)", borderRadius: "2px",
          transition: "width 0.4s ease",
        }} />
      </div>
      <p style={{ fontSize: "12px", color: "rgba(248,246,242,0.45)", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
        {previewText}
      </p>
    </div>
  );
}

// ─── Driver section ───────────────────────────────────────────────────────────

function DriverSection({ drivers }: { drivers: BreakdownResult["keyDrivers"] }) {
  function parseDriver(d: { factor: string; direction: string }) {
    const f = d.factor.trim();
    const parts = f.split(/\s*[—–]\s*/);
    const first = parts[0].trim();

    let label = "";
    let body = f;

    if (/^(SUPPORTS THE SCRIPT|WORKS AGAINST|NEUTRAL CONTEXT)/i.test(first)) {
      if (parts.length >= 2) {
        const after = parts[1];
        const colonIdx = after.indexOf(":");
        if (colonIdx !== -1) {
          label = after.slice(0, colonIdx).trim();
          body = after.slice(colonIdx + 1).trim();
        } else {
          label = after.slice(0, 30).trim();
          body = after.slice(30).trim() || f;
        }
      }
    } else if (parts.length >= 2 && first.length <= 30) {
      label = first;
      body = parts.slice(1).join(" — ").split(":").slice(1).join(":").trim() || parts.slice(1).join(" — ").trim();
    } else {
      const colonIdx = f.indexOf(":");
      if (colonIdx > 0 && colonIdx < 35) {
        label = f.slice(0, colonIdx).trim();
        body = f.slice(colonIdx + 1).trim();
      } else {
        body = f;
      }
    }

    const ruleColor = RULE_COLORS[d.direction] ?? RULE_COLORS.neutral;
    return { label, body, ruleColor };
  }

  return (
    <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(248,246,242,0.06)" }}>
      {drivers.map((d, i) => {
        const { label, body, ruleColor } = parseDriver(d);
        return (
          <div key={i} style={{ marginBottom: i < drivers.length - 1 ? "20px" : 0 }}>
            <div style={{
              fontFamily: "var(--mono)", fontSize: "9px", fontWeight: 600,
              letterSpacing: "0.14em", textTransform: "uppercase",
              color: "rgba(248,246,242,0.28)", marginBottom: "6px",
            }}>
              Driver {String(i + 1).padStart(2, "0")}
            </div>
            {label && (
              <div style={{
                fontSize: "14px", fontWeight: 700, color: "rgba(248,246,242,0.85)",
                letterSpacing: "-0.015em", marginBottom: "4px",
              }}>
                {label}
              </div>
            )}
            <div style={{ fontSize: "12px", color: "rgba(248,246,242,0.5)", lineHeight: 1.6, marginBottom: "10px" }}>
              {body}
            </div>
            <div style={{ height: "1.5px", background: ruleColor, opacity: 0.55, borderRadius: "1px" }} />
          </div>
        );
      })}
    </div>
  );
}

// ─── Step card ────────────────────────────────────────────────────────────────

function StepCard({
  num,
  label,
  summary,
  defaultOpen,
  highlighted,
  children,
}: {
  num: string;
  label: string;
  summary: string;
  defaultOpen?: boolean;
  highlighted?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <div style={{
      borderRadius: "8px",
      border: highlighted ? "1px solid rgba(201,53,42,0.22)" : "1px solid rgba(248,246,242,0.07)",
      background: highlighted ? "rgba(201,53,42,0.07)" : "rgba(248,246,242,0.02)",
      overflow: "hidden",
    }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center",
          padding: "14px 20px", gap: "14px",
          background: "transparent", border: "none", cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 700,
          letterSpacing: "0.04em",
          color: highlighted ? "var(--signal)" : "rgba(248,246,242,0.4)",
          background: highlighted ? "rgba(201,53,42,0.18)" : "rgba(248,246,242,0.07)",
          borderRadius: "6px",
          padding: "4px 7px",
          flexShrink: 0,
        }}>
          {num}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: "13px", fontWeight: 700, letterSpacing: "-0.01em",
            color: highlighted ? "rgba(248,246,242,0.9)" : "rgba(248,246,242,0.7)",
            marginBottom: "2px",
          }}>
            {label}
          </div>
          {!open && (
            <div style={{
              fontSize: "12px", color: "rgba(248,246,242,0.35)", lineHeight: 1.4,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {summary}
            </div>
          )}
        </div>
        <span style={{
          fontSize: "16px", color: highlighted ? "var(--signal)" : "rgba(248,246,242,0.3)",
          fontWeight: 300, flexShrink: 0, lineHeight: 1,
        }}>
          {open ? "×" : "+"}
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 20px 16px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Fragility item ───────────────────────────────────────────────────────────

function FragilityItem({ item }: { item: string; color: FragilityColor }) {
  const clean = item
    .replace(/^(?:[🔴🟡🟢]|⚠️?)\s*/u, "")
    .replace(/^(RED|AMBER|GREEN)\s*[—–-]\s*/i, "")
    .trim();

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "8px 0" }}>
      <span style={{ flexShrink: 0, fontSize: "11px", marginTop: "2px", color: "rgba(248,246,242,0.35)" }}>⚠</span>
      <div style={{ fontSize: "12px", color: "rgba(248,246,242,0.55)", lineHeight: 1.6 }}>
        {clean}
      </div>
    </div>
  );
}

// ─── Edge item ────────────────────────────────────────────────────────────────

function EdgeItem({ item, index }: { item: string; index: number }) {
  const labels = ["Spread", "Total", "Props"];
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", padding: "10px 0", borderBottom: "1px solid rgba(248,246,242,0.06)" }}>
      <div style={{
        fontFamily: "var(--mono)", fontSize: "9px", fontWeight: 700,
        letterSpacing: "0.1em", textTransform: "uppercase",
        color: "var(--signal)", flexShrink: 0, minWidth: "44px", paddingTop: "2px",
      }}>
        {labels[index] ?? `Edge ${index + 1}`}
      </div>
      <div style={{ fontSize: "12px", color: "rgba(248,246,242,0.65)", lineHeight: 1.55 }}>
        {item}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BreakdownView({ breakdown, game, gated }: Props) {
  const { gameStatus } = game;
  const isMLB = game.sport === "MLB";

  const gameShape1Sentence = breakdown.gameShape.split(/\.[\s\n]/)[0].trim() + ".";
  const baseScript1Sentence = breakdown.baseScript.split(/\.[\s\n]/)[0].trim() + ".";
  const marketRead1Sentence = breakdown.marketRead.split(/\.[\s\n]/)[0].trim() + ".";
  const fragilityPreview = breakdown.fragilityCheck[0]?.item
    ? breakdown.fragilityCheck[0].item.replace(/^(?:[🔴🟡🟢]|⚠️?)\s*/u, "").split(".")[0].trim() + "."
    : "Check fragility items.";
  const edgePreview = breakdown.edge?.[0]
    ? breakdown.edge[0].split(".")[0].trim() + "."
    : "Data edges available.";
  const keyDriversPreview = breakdown.keyDrivers
    .slice(0, 2)
    .map((d) => {
      const parts = d.factor.split(/\s*[—–]\s*/);
      const first = parts[0].trim();
      if (/^(SUPPORTS|WORKS|NEUTRAL|INJURY)/i.test(first) && parts[1]) {
        return parts[1].split(":")[0].trim();
      }
      return first.length <= 25 ? first : d.factor.split(/\s+/).slice(0, 3).join(" ");
    })
    .filter(Boolean)
    .join(", ");

  return (
    <div>
      {/* Status banners */}
      {gameStatus === "final" && (
        <div style={{
          background: "rgba(248,246,242,0.04)", borderBottom: "1px solid rgba(248,246,242,0.06)",
          padding: "10px 24px",
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(248,246,242,0.3)" }}>Final</span>
          <span style={{ fontSize: "12px", color: "rgba(248,246,242,0.35)" }}>
            This game has ended. Breakdown was generated before {isMLB ? "first pitch" : "tip-off"}.
          </span>
        </div>
      )}
      {gameStatus === "live" && (
        <div style={{
          background: "rgba(201,53,42,0.05)", borderBottom: "1px solid rgba(248,246,242,0.06)",
          padding: "10px 24px",
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--signal)", display: "block", flexShrink: 0 }} className="animate-pulse" />
          <span style={{ fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--signal)", flexShrink: 0 }}>Live</span>
          <span style={{ fontSize: "12px", color: "rgba(248,246,242,0.4)" }}>Game in progress. Breakdowns only generated before start of game.</span>
        </div>
      )}

      {/* Content — blurred when gated */}
      <div style={{ position: "relative" }}>
        <div style={gated ? { filter: "blur(6px)", userSelect: "none", pointerEvents: "none" } : undefined}>

          {/* Market Pressure */}
          {game.odds && (
            <MarketPressure breakdown={breakdown} game={game} />
          )}

          {/* Key Drivers */}
          <DriverSection drivers={breakdown.keyDrivers} />

          {/* Expandable step cards */}
          <div style={{ padding: "12px 12px 6px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <StepCard num="01" label="Game Shape" summary={gameShape1Sentence}>
            <p style={{ fontSize: "13px", color: "rgba(248,246,242,0.55)", lineHeight: 1.75, margin: 0 }}>
              {breakdown.gameShape}
            </p>
          </StepCard>

          <StepCard num="02" label="Key Drivers" summary={keyDriversPreview}>
            <div>
              {breakdown.keyDrivers.map((d, i) => {
                const dotColor = RULE_COLORS[d.direction] ?? RULE_COLORS.neutral;
                const f = d.factor.trim();
                const parts = f.split(/\s*[—–]\s*/);
                const first = parts[0].trim();
                let label = "";
                let body = f;
                if (/^(SUPPORTS THE SCRIPT|WORKS AGAINST|NEUTRAL CONTEXT)/i.test(first) && parts[1]) {
                  const after = parts[1];
                  const ci = after.indexOf(":");
                  label = ci !== -1 ? after.slice(0, ci).trim() : after.slice(0, 30).trim();
                  body = ci !== -1 ? after.slice(ci + 1).trim() : (after.slice(30).trim() || f);
                } else if (parts.length >= 2 && first.length <= 30) {
                  label = first;
                  body = parts.slice(1).join(" — ").trim();
                }
                return (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 0", borderTop: i > 0 ? "1px solid rgba(248,246,242,0.05)" : "none" }}>
                    <div style={{ width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0, marginTop: "5px", background: dotColor }} />
                    <div>
                      {label && <div style={{ fontSize: "12px", fontWeight: 700, color: dotColor, marginBottom: "2px" }}>{label}</div>}
                      <div style={{ fontSize: "12px", color: "rgba(248,246,242,0.5)", lineHeight: 1.55 }}>{body || f}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </StepCard>

          <StepCard num="03" label="Base Script" summary={baseScript1Sentence}>
            <p style={{ fontSize: "13px", color: "rgba(248,246,242,0.55)", lineHeight: 1.75, margin: 0 }}>
              {breakdown.baseScript}
            </p>
          </StepCard>

          <StepCard num="04" label="Fragility Check" summary={fragilityPreview}>
            <div>
              {breakdown.fragilityCheck.map((item, i) => (
                <FragilityItem key={i} item={item.item} color={item.color} />
              ))}
            </div>
          </StepCard>

          <StepCard num="05" label="Market Read" summary={marketRead1Sentence}>
            <p style={{ fontSize: "13px", color: "rgba(248,246,242,0.5)", lineHeight: 1.75, fontStyle: "italic", margin: 0 }}>
              {game.odds
                ? breakdown.marketRead
                : gameStatus === "final"
                  ? "Lines reflect conditions at time of generation."
                  : `Lines haven't posted yet — check back closer to ${isMLB ? "first pitch" : "tip-off"}.`}
            </p>
          </StepCard>

          {breakdown.edge && breakdown.edge.length > 0 && (
            <StepCard num="06" label="Where the Data Points" summary={edgePreview} defaultOpen highlighted>
              <p style={{ fontSize: "11px", color: "rgba(248,246,242,0.3)", fontStyle: "italic", marginBottom: "12px", lineHeight: 1.5 }}>
                Not picks — these are the areas the data creates an edge environment around. You decide.
              </p>
              <div>
                {breakdown.edge.map((item, i) => (
                  <EdgeItem key={i} item={item} index={i} />
                ))}
              </div>
              {(breakdown.glossaryTerm || breakdown.glossaryDefinition) && (
                <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(248,246,242,0.06)" }}>
                  <GlossaryCallout term={breakdown.glossaryTerm} definition={breakdown.glossaryDefinition} dark />
                </div>
              )}
            </StepCard>
          )}
          </div>

          {breakdown.wildcard && (
            <div style={{
              padding: "14px 24px", borderBottom: "1px solid rgba(248,246,242,0.06)",
              display: "flex", alignItems: "flex-start", gap: "12px",
            }}>
              <div style={{
                fontFamily: "var(--mono)", fontSize: "9px", fontWeight: 600,
                letterSpacing: "0.12em", textTransform: "uppercase",
                color: "rgba(248,246,242,0.3)", paddingTop: "2px", flexShrink: 0,
              }}>
                Wildcard
              </div>
              <p style={{ fontSize: "12px", color: "rgba(248,246,242,0.5)", lineHeight: 1.6, margin: 0 }}>
                {breakdown.wildcard}
              </p>
            </div>
          )}

        </div>
        {gated && <GatedBodyOverlay reason={gated} />}
      </div>

      {/* Closing block */}
      <div style={{
        background: "var(--signal)",
        padding: "40px 32px",
        textAlign: "center",
      }}>
        {breakdown.decisionLens && (
          <p style={{
            fontSize: "13px", color: "rgba(255,255,255,0.75)",
            lineHeight: 1.7, maxWidth: "540px", margin: "0 auto 20px",
          }}>
            {breakdown.decisionLens}
          </p>
        )}
        <p style={{
          fontSize: "clamp(14px, 2vw, 16px)",
          fontWeight: 600,
          color: "#fff",
          lineHeight: 1.5, margin: "0 auto", maxWidth: "480px",
        }}>
          This is not a pick. This is what the data says.{" "}
          <em style={{ color: "rgba(255,255,255,0.75)", fontWeight: 400 }}>Your decision is always yours.</em>
        </p>
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
      background: "linear-gradient(to bottom, rgba(17,17,16,0.3) 0%, rgba(17,17,16,0.96) 20%, rgba(17,17,16,0.99) 100%)",
    }}>
      <div style={{
        background: "#1a1918", borderRadius: "12px",
        padding: "40px 32px",
        maxWidth: "480px", width: "calc(100% - 32px)",
        textAlign: "center",
        boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
        position: "relative", overflow: "hidden",
        border: "1px solid rgba(248,246,242,0.08)",
      }}>
        <span aria-hidden="true" style={{
          position: "absolute", right: "-30px", top: "-50px",
          fontSize: "280px", fontWeight: 900,
          color: "rgba(201,53,42,0.05)", pointerEvents: "none", lineHeight: 1,
        }}>R</span>

        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{
            fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 500,
            letterSpacing: "0.12em", textTransform: "uppercase",
            color: "var(--signal)", margin: "0 0 12px",
          }}>
            {copy.eyebrow}
          </p>
          <h2 style={{
            fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 800,
            letterSpacing: "-0.03em", color: "#fff",
            lineHeight: 1.2, margin: "0 0 20px",
          }}>
            {copy.heading}
          </h2>

          <ul style={{
            listStyle: "none", padding: 0, margin: "0 0 24px",
            display: "flex", flexDirection: "column", gap: "8px", textAlign: "left",
          }}>
            {PRO_FEATURES.map((feature) => (
              <li key={feature} style={{
                fontSize: "12px", color: "rgba(255,255,255,0.6)",
                lineHeight: 1.5, paddingLeft: "16px", position: "relative",
              }}>
                <span style={{
                  position: "absolute", left: 0, top: "7px",
                  width: "5px", height: "5px", borderRadius: "50%", background: "var(--signal)",
                }} />
                {feature}
              </li>
            ))}
          </ul>

          <Link href="/pricing" style={{
            display: "inline-block",
            background: "var(--signal)", color: "#fff",
            fontSize: "13px", fontWeight: 600, letterSpacing: "0.04em",
            textDecoration: "none", padding: "12px 28px", borderRadius: "6px",
          }}>
            Upgrade to Pro →
          </Link>
        </div>
      </div>
    </div>
  );
}
