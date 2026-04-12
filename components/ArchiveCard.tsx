"use client";

import Link from "next/link";

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

export default function ArchiveCard({
  gameId,
  homeTeam,
  awayTeam,
  sport,
  formattedDate,
  confidenceLabel,
  peek,
  stripColor,
  badgeBg,
  badgeColor,
}: ArchiveCardProps) {
  return (
    <Link
      href={`/archive/${encodeURIComponent(gameId)}`}
      style={{ textDecoration: "none" }}
    >
      <div
        style={{
          background: "#FFFFFF", borderRadius: "14px", border: "1px solid #E8ECF2",
          padding: "16px 18px", display: "flex", gap: "14px", alignItems: "stretch",
          boxShadow: "0 1px 4px rgba(13,27,46,0.05)",
          transition: "border-color 0.15s, box-shadow 0.15s",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "#B0BAC9";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 3px 12px rgba(13,27,46,0.08)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "#E8ECF2";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(13,27,46,0.05)";
        }}
      >
        {/* Left confidence strip */}
        <div style={{ width: "3px", borderRadius: "3px", flexShrink: 0, alignSelf: "stretch", background: stripColor }} />

        {/* Body */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Top row: matchup + badge */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
            <p style={{ fontSize: "18px", fontWeight: 800, color: "#0D1B2E", letterSpacing: "-0.025em", lineHeight: 1 }}>
              {awayTeam} @ {homeTeam}
            </p>
            <span style={{
              fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em",
              textTransform: "uppercase", padding: "3px 10px", borderRadius: "999px",
              flexShrink: 0, marginLeft: "8px",
              background: badgeBg, color: badgeColor,
            }}>
              {confidenceLabel}
            </span>
          </div>

          {/* Meta */}
          <p style={{ fontSize: "11px", fontWeight: 600, color: "#B0BAC9", letterSpacing: "0.04em", marginBottom: peek ? "10px" : "10px" }}>
            {sport} · {formattedDate}
          </p>

          {/* Peek text */}
          {peek && (
            <>
              <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#0A7A6C", marginBottom: "4px" }}>
                The Read
              </p>
              <p style={{
                fontSize: "12px", fontWeight: 600, color: "#637A96", lineHeight: 1.5,
                paddingTop: "10px", borderTop: "1px solid #F0F3F7",
                display: "-webkit-box", WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical" as const, overflow: "hidden",
              }}>
                {peek}
              </p>
            </>
          )}

          {/* CTA */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#0A7A6C" }}>
              View breakdown →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
