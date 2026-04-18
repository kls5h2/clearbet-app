"use client";

import { useState } from "react";
import Link from "next/link";
import Tooltip from "./Tooltip";

const SIGNAL_GRADE_TOOLTIP =
  "Signal Grade rates data quality going into this breakdown — lineup certainty, line stability, historical depth, and environment. A = strong foundation. C or below = read the fragility check carefully.";

interface ArchiveCardProps {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  gameDate: string;
  confidenceLevel: number;
  confidenceLabel: string;
  peek: string | null;
  stripColor: string;
  badgeBg: string;
  badgeColor: string;
  formattedDate: string;
}

const grades: Record<number, string> = { 1: "A", 2: "B", 3: "C", 4: "D" };

export default function ArchiveCard({
  gameId, homeTeam, awayTeam, sport, formattedDate, confidenceLevel, confidenceLabel, peek,
}: ArchiveCardProps) {
  const [hover, setHover] = useState(false);

  return (
    <Link href={`/archive/${encodeURIComponent(gameId)}`} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: hover ? "#EFEDE7" : "var(--paper)",
          borderRadius: "6px",
          border: `0.5px solid ${hover ? "rgba(14,14,14,0.18)" : "var(--border)"}`,
          borderLeft: "3px solid var(--signal)",
          padding: "16px 20px",
          transform: hover ? "translateY(-1px)" : "translateY(0)",
          boxShadow: hover ? "0 6px 18px rgba(14,14,14,0.08), 0 1px 2px rgba(14,14,14,0.04)" : "none",
          transition: "background 150ms ease, border-color 150ms ease, transform 150ms ease, box-shadow 150ms ease",
          cursor: "pointer",
        }}
      >
        {/* Top row: matchup + intel grade */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
          <div>
            <p style={{ fontFamily: "Georgia, serif", fontSize: "17px", fontWeight: 500, color: "var(--ink)", lineHeight: 1, marginBottom: "6px" }}>
              {awayTeam} at {homeTeam}
            </p>
            <p style={{ fontSize: "11px", color: "var(--muted)" }}>{sport} · {formattedDate}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, marginLeft: "8px" }}>
            <Tooltip text={SIGNAL_GRADE_TOOLTIP}>
              <span style={{
                fontSize: "9px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em",
                color: "var(--muted)",
                borderBottom: "1px dotted rgba(14,14,14,0.35)",
                cursor: "help",
              }}>
                Signal Grade
              </span>
            </Tooltip>
            <span style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "13px", color: "var(--signal)" }}>{grades[confidenceLevel] ?? "—"}</span>
            <span style={{ fontSize: "9px", color: "var(--muted)", marginTop: "1px" }}>{confidenceLabel}</span>
          </div>
        </div>

        {/* Peek text */}
        {peek && (
          <div style={{ borderTop: "0.5px solid var(--border)", paddingTop: "10px", marginTop: "8px" }}>
            <p style={{ fontSize: "9px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--muted)", marginBottom: "4px" }}>The Read</p>
            <p style={{ fontSize: "12px", color: "var(--ink)", opacity: 0.7, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
              {peek}
            </p>
          </div>
        )}

        {/* CTA */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
          <span style={{
            fontSize: "13px", fontWeight: 500,
            color: "var(--signal)", opacity: hover ? 1 : 0.85,
            transition: "opacity 150ms ease",
          }}>
            Read →
          </span>
        </div>
      </div>
    </Link>
  );
}
