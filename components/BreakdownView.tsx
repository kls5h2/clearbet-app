"use client";

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

const ZONE_SEP = "1px solid rgba(248,246,242,0.06)";

function ZoneHeader({ num, label }: { num: string; label: string }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{
        fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600,
        letterSpacing: "0.14em", textTransform: "uppercase",
        color: "rgba(201,53,42,0.65)", marginBottom: "5px",
      }}>
        {num}
      </div>
      <div style={{
        fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em",
        textTransform: "uppercase", color: "rgba(248,246,242,0.4)",
      }}>
        {label}
      </div>
    </div>
  );
}

function ThinRule() {
  return <div style={{ height: "1px", background: "rgba(248,246,242,0.06)" }} />;
}

function boldLead(text: string): React.ReactNode {
  const idx = text.indexOf(":");
  if (idx === -1) return <>{text}</>;
  return (
    <>
      <strong style={{ fontWeight: 600, color: "rgba(248,246,242,0.85)" }}>
        {text.slice(0, idx)}
      </strong>
      {text.slice(idx)}
    </>
  );
}

function DriverRow({ direction, factor }: { direction: string; factor: string }) {
  const dotColor =
    direction === "positive" ? "#4ade80" :
    direction === "negative" ? "#C9352A" :
    direction === "neutral"  ? "#94a3b8" : "#fb923c";

  const toTitleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  let label: string;
  let body = factor;

  const worksAgainst  = factor.match(/^WORKS AGAINST\s+([A-Z][A-Z ]{1,30}?)\s*[—–:]/i);
  const supportsScript = factor.match(/^SUPPORTS THE SCRIPT\s*[—–:]/i);
  const neutralCtx    = factor.match(/^NEUTRAL CONTEXT\s*[—–:]/i);

  if (worksAgainst) {
    label = `Works against ${toTitleCase(worksAgainst[1].trim())}`;
    body  = factor.slice(worksAgainst[0].length).trim();
  } else if (supportsScript) {
    label = "Supports the script";
    body  = factor.slice(supportsScript[0].length).trim();
  } else if (neutralCtx) {
    label = "Neutral context";
    body  = factor.slice(neutralCtx[0].length).trim();
  } else {
    label =
      direction === "positive" ? "Supports the script" :
      direction === "negative" ? "Works against" :
      direction === "neutral"  ? "Neutral context" :
      "Injury / uncertainty";
  }

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "11px 0" }}>
      <div style={{
        width: "7px", height: "7px", borderRadius: "50%",
        flexShrink: 0, marginTop: "5px", background: dotColor,
        boxShadow: `0 0 8px ${dotColor}55`,
      }} />
      <div>
        <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "3px", color: dotColor }}>
          {label}
        </div>
        <div style={{ fontSize: "12px", color: "rgba(248,246,242,0.5)", lineHeight: 1.55 }}>
          {body}
        </div>
      </div>
    </div>
  );
}

function FragilityRow({ item }: { item: string; color: FragilityColor }) {
  const cleanItem = item
    .replace(/^(?:[🔴🟡🟢]|⚠️?)\s*/u, "")
    .replace(/^(RED|AMBER|GREEN)\s*[—–-]\s*/i, "")
    .trim();

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "11px 0" }}>
      <span style={{ flexShrink: 0, fontSize: "12px", marginTop: "1px", color: "rgba(248,246,242,0.4)" }}>⚠</span>
      <div style={{ fontSize: "12px", color: "rgba(248,246,242,0.5)", lineHeight: 1.55 }}>
        {boldLead(cleanItem)}
      </div>
    </div>
  );
}

export default function BreakdownView({ breakdown, game, gated }: Props) {
  const { gameStatus } = game;
  const isMLB = game.sport === "MLB";

  return (
    <div>
      <style>{`
        .bd-zone-grid { display: grid; grid-template-columns: 1fr 1fr; }
        @media (max-width: 640px) {
          .bd-zone-grid { grid-template-columns: 1fr; }
          .bd-zone-sep-r { border-right: none !important; }
        }
      `}</style>

      {/* Status banners — light background, above dark grid */}
      {gameStatus === "final" && (
        <div style={{
          background: "var(--warm-white)", border: "1px solid var(--border-med)",
          padding: "10px 14px", marginBottom: "1px",
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
          padding: "10px 14px", marginBottom: "1px",
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--signal)", display: "block", flexShrink: 0 }} className="animate-pulse" />
          <span style={{ fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--signal)", flexShrink: 0 }}>Live</span>
          <span style={{ fontSize: "13px", color: "var(--muted)" }}>Game in progress. Breakdowns only generated before start of game.</span>
        </div>
      )}

      {/* Dashboard grid */}
      <div style={{ position: "relative" }}>
        <div style={gated ? { filter: "blur(6px)", userSelect: "none", pointerEvents: "none" } : undefined}>
          <div className="bd-zone-grid">

            {/* 01 — Game Shape: left col, default */}
            <div className="bd-zone-sep-r" style={{
              background: "#161514", padding: "28px 24px",
              borderRight: ZONE_SEP, borderBottom: ZONE_SEP,
            }}>
              <ZoneHeader num="01" label="Game Shape" />
              <p style={{ fontSize: "13px", color: "rgba(248,246,242,0.55)", lineHeight: 1.75, margin: 0 }}>
                {breakdown.gameShape}
              </p>
            </div>

            {/* 02 — Key Drivers: right col, default */}
            <div style={{ background: "#161514", padding: "28px 24px", borderBottom: ZONE_SEP }}>
              <ZoneHeader num="02" label="Key Drivers" />
              <div>
                {breakdown.keyDrivers.map((d, i) => (
                  <div key={i}>
                    {i > 0 && <ThinRule />}
                    <DriverRow direction={d.direction} factor={d.factor} />
                  </div>
                ))}
              </div>
            </div>

            {/* 03 — Base Script: full width, accent */}
            <div style={{
              gridColumn: "1 / -1", background: "#1a1816",
              padding: "28px 24px", borderBottom: ZONE_SEP,
            }}>
              <ZoneHeader num="03" label="Base Script" />
              <p style={{ fontSize: "13px", color: "rgba(248,246,242,0.55)", lineHeight: 1.75, margin: 0 }}>
                {breakdown.baseScript}
              </p>
            </div>

            {/* 04 — Fragility Check: left col, deep */}
            <div className="bd-zone-sep-r" style={{
              background: "#131211", padding: "28px 24px",
              borderRight: ZONE_SEP, borderBottom: ZONE_SEP,
            }}>
              <ZoneHeader num="04" label="Fragility Check" />
              <div>
                {breakdown.fragilityCheck.map((item, i) => (
                  <div key={i}>
                    {i > 0 && <ThinRule />}
                    <FragilityRow item={item.item} color={item.color} />
                  </div>
                ))}
              </div>
            </div>

            {/* 05 — Market Read: right col, deep */}
            <div style={{ background: "#131211", padding: "28px 24px", borderBottom: ZONE_SEP }}>
              <ZoneHeader num="05" label="Market Read" />
              <p style={{ fontSize: "13px", color: "rgba(248,246,242,0.5)", lineHeight: 1.75, fontStyle: "italic", margin: 0 }}>
                {game.odds
                  ? breakdown.marketRead
                  : gameStatus === "final"
                    ? "Lines reflect conditions at time of generation."
                    : `Lines haven't posted yet — check back closer to ${isMLB ? "first pitch" : "tip-off"}.`}
              </p>
            </div>

            {/* Wildcard — optional, full width */}
            {breakdown.wildcard && (
              <div style={{
                gridColumn: "1 / -1", background: "#161514",
                padding: "16px 24px", borderBottom: ZONE_SEP,
                display: "flex", alignItems: "flex-start", gap: "12px",
              }}>
                <div style={{
                  fontFamily: "var(--mono)", fontSize: "9px", fontWeight: 600,
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  color: "rgba(248,246,242,0.3)", paddingTop: "2px", flexShrink: 0,
                }}>
                  Wildcard
                </div>
                <p style={{ fontSize: "13px", color: "rgba(248,246,242,0.5)", lineHeight: 1.6, margin: 0 }}>
                  {breakdown.wildcard}
                </p>
              </div>
            )}

            {/* 06 — Where the Data Points: full width, accent */}
            {breakdown.edge && breakdown.edge.length > 0 && (
              <div style={{ gridColumn: "1 / -1", background: "#1a1816", padding: "28px 24px" }}>
                <ZoneHeader num="06" label="Where the Data Points" />
                <p style={{
                  fontSize: "12px", color: "rgba(248,246,242,0.3)",
                  fontStyle: "italic", margin: "0 0 16px", lineHeight: 1.5,
                }}>
                  Not picks — these are the areas the data creates an edge environment around. You decide.
                </p>
                <div>
                  {breakdown.edge.map((item, i) => (
                    <div key={i}>
                      {i > 0 && <ThinRule />}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", padding: "12px 0" }}>
                        <div style={{
                          fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 700,
                          letterSpacing: "0.1em", textTransform: "uppercase",
                          color: "var(--signal)", flexShrink: 0, minWidth: "52px", paddingTop: "2px",
                        }}>
                          {i === 0 ? "Spread" : i === 1 ? "Total" : "Props"}
                        </div>
                        <div style={{ fontSize: "13px", color: "rgba(248,246,242,0.65)", lineHeight: 1.55 }}>
                          {item}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: ZONE_SEP }}>
                  <GlossaryCallout term={breakdown.glossaryTerm} definition={breakdown.glossaryDefinition} dark />
                </div>
              </div>
            )}

          </div>
        </div>
        {gated && <GatedBodyOverlay reason={gated} />}
      </div>

      {/* Closing block */}
      <div style={{
        background: "#0a0908", padding: "48px 32px",
        textAlign: "center", borderTop: "2px solid var(--signal)",
      }}>
        {breakdown.decisionLens && (
          <p style={{
            fontSize: "14px", color: "rgba(248,246,242,0.6)",
            lineHeight: 1.7, maxWidth: "540px", margin: "0 auto 24px",
          }}>
            {breakdown.decisionLens}
          </p>
        )}
        <p style={{
          fontSize: "clamp(14px, 2vw, 16px)",
          color: "rgba(248,246,242,0.75)",
          lineHeight: 1.6, margin: "0 auto", maxWidth: "480px",
        }}>
          This is not a pick. This is what the data says.{" "}
          <em style={{ color: "rgba(248,246,242,0.55)" }}>Your decision is always yours.</em>
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
      background: "linear-gradient(to bottom, rgba(22,21,20,0.3) 0%, rgba(22,21,20,0.95) 20%, rgba(22,21,20,0.99) 100%)",
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
            color: "var(--signal)", margin: "0 0 12px",
          }}>
            {copy.eyebrow}
          </p>
          <h2 style={{
            fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 800,
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
          }}>
            Upgrade to Pro →
          </Link>
        </div>
      </div>
    </div>
  );
}
