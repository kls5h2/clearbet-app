"use client";

import { useState } from "react";
import Link from "next/link";

interface ArchiveCardProps {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  formattedDate: string;
  confidenceLevel: number;
  confidenceLabel: string;
  peek: string | null;
}

const GRADES: Record<number, string> = { 1: "A", 2: "B+", 3: "C+", 4: "C" };

function confClass(label: string): string {
  const l = (label ?? "").toUpperCase().trim();
  if (l === "CLEAR SPOT") return "conf-badge cb-clear";
  if (l === "LEAN") return "conf-badge cb-lean";
  if (l === "FRAGILE") return "conf-badge cb-fragile";
  return "conf-badge cb-pass";
}

export default function ArchiveCard({
  gameId,
  homeTeam,
  awayTeam,
  sport,
  formattedDate,
  confidenceLevel,
  confidenceLabel,
  peek,
}: ArchiveCardProps) {
  const [hover, setHover] = useState(false);

  return (
    <Link
      href={`/archive/${encodeURIComponent(gameId)}`}
      style={{ textDecoration: "none" }}
    >
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: "var(--surface)",
          borderRadius: 10,
          border: "1px solid rgba(17,17,16,0.06)",
          overflow: "hidden",
          boxShadow: hover ? "var(--shadow-md)" : "var(--shadow-sm)",
          transform: hover ? "translateY(-1px)" : "translateY(0)",
          transition:
            "box-shadow 0.2s cubic-bezier(0.16,1,0.3,1), transform 0.2s cubic-bezier(0.16,1,0.3,1)",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 20,
            alignItems: "start",
          }}
        >
          {/* LEFT */}
          <div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 800,
                letterSpacing: "-0.025em",
                color: "var(--ink)",
                lineHeight: 1.2,
                marginBottom: 3,
              }}
            >
              {awayTeam}{" "}
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 400,
                  color: "var(--muted-light)",
                  margin: "0 4px",
                }}
              >
                at
              </span>{" "}
              {homeTeam}
            </div>
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 10.5,
                color: "var(--muted)",
                letterSpacing: "0.03em",
                marginBottom: 12,
              }}
            >
              {sport} · {formattedDate}
            </div>
            {peek && (
              <div
                style={{
                  fontSize: 13.5,
                  color: "var(--muted)",
                  lineHeight: 1.5,
                  fontStyle: "italic",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical" as const,
                  overflow: "hidden",
                }}
              >
                &ldquo;{peek}&rdquo;
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 22,
                  fontWeight: 600,
                  color: "var(--signal)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                  textAlign: "right",
                }}
              >
                {GRADES[confidenceLevel] ?? "—"}
              </div>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 8.5,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--muted-light)",
                  textAlign: "right",
                  marginTop: 2,
                }}
              >
                Signal
              </div>
            </div>

            <div className={confClass(confidenceLabel)}>
              <span className="dot" />
              {confidenceLabel || "—"}
            </div>

            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--signal)",
                opacity: hover ? 1 : 0,
                transition: "opacity 0.14s",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              Read →
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
