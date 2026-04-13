"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GameCard from "@/components/GameCard";
import Logo from "@/components/Logo";
import { supabase } from "@/lib/supabase";
import type { AnyGame, Sport, BreakdownResult } from "@/lib/types";

function getTodayDateString(): string {
  const now = new Date();
  const et = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const [month, day, year] = et.split("/");
  return `${year}${month}${day}`;
}

function parseGameTime(time: string): number {
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 9999;
  let hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  return hours * 60 + mins;
}

export default function HomePage() {
  const router = useRouter();
  const [activeSport, setActiveSport] = useState<Sport>("NBA");
  const [games, setGames] = useState<AnyGame[]>([]);
  const [tomorrowGames, setTomorrowGames] = useState<AnyGame[]>([]);
  const [breakdownMap, setBreakdownMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setGames([]);
    setTomorrowGames([]);

    const sport = activeSport.toLowerCase();
    const todayStr = getTodayDateString();
    Promise.all([
      fetch(`/api/games?sport=${sport}`).then((r) => {
        if (!r.ok) throw new Error("Failed to load slate");
        return r.json();
      }),
      fetch(`/api/games?sport=${sport}&date=tomorrow`).then((r) => {
        if (!r.ok) return { games: [] };
        return r.json();
      }).catch(() => ({ games: [] })),
      Promise.resolve(
        supabase
          .from("breakdowns")
          .select("game_id, breakdown_content")
          .eq("game_date", todayStr)
      ).then(({ data }) => (data ?? []) as { game_id: string; breakdown_content: unknown }[])
        .catch(() => [] as { game_id: string; breakdown_content: unknown }[]),
    ])
      .then(([todayData, tomorrowData, breakdownRows]) => {
        setGames(todayData.games ?? []);
        setTomorrowGames(tomorrowData.games ?? []);
        const map = new Map<string, string>();
        for (const row of breakdownRows as { game_id: string; breakdown_content: unknown }[]) {
          const content = row.breakdown_content as BreakdownResult;
          if (content?.decisionLens) {
            const firstSentence = content.decisionLens.match(/^[^.]+\./)?.[0] ?? content.decisionLens;
            map.set(row.game_id, firstSentence);
          }
        }
        setBreakdownMap(map);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [activeSport]);

  function handleGameSelect(gameId: string) {
    router.push(`/breakdown/${encodeURIComponent(gameId)}?sport=${activeSport}`);
  }

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div style={{ fontFamily: "var(--font-manrope, Manrope, sans-serif)", background: "#F0F3F7", minHeight: "100vh", paddingBottom: "5rem" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 1.5rem" }}>

        {/* Page header — centered logo, desktop nav links top-right */}
        <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", padding: "1.75rem 0 1.25rem" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <Logo fontSize={28} barHeight={20} color="#0D1B2E" />
          </Link>
          <div className="hidden sm:flex" style={{ position: "absolute", right: 0, gap: "1.25rem", alignItems: "center" }}>
            <Link href="/how-it-works" style={{ fontSize: "14px", fontWeight: 600, color: "#637A96", letterSpacing: "0.04em", textDecoration: "none" }}>How It Works</Link>
            <Link href="/glossary" style={{ fontSize: "14px", fontWeight: 600, color: "#637A96", letterSpacing: "0.04em", textDecoration: "none" }}>Glossary</Link>
          </div>
        </div>

        {/* Tagline */}
        <div style={{ maxWidth: "600px" }}>
          <p style={{ fontSize: "15px", fontWeight: 500, color: "#3A5470", lineHeight: 1.6, marginBottom: 0 }}>
            ClearBet turns raw game data into plain-English analysis — simple enough for a rookie, deep enough for a pro.
          </p>
          <p style={{ fontSize: "15px", fontWeight: 700, color: "#0D1B2E", lineHeight: 1.6, marginBottom: 0 }}>
            Pick a game. Read the breakdown. Make your call.{" "}
            <Link href="/how-it-works" style={{ color: "#0A7A6C", fontWeight: 700, textDecoration: "none" }}>How it works →</Link>
          </p>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid #E8ECF2", margin: "1.5rem 0" }} />

        {/* Slate label + date */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "1.25rem" }}>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0D1B2E", letterSpacing: "-0.02em", margin: 0 }}>Today&#8217;s Slate</h1>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#9FADBF" }}>{todayLabel}</span>
        </div>

        {/* Sport tabs — active tab = dark navy per mockup */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "1.75rem" }}>
          {(["NBA", "MLB"] as Sport[]).map((sport) => (
            <button
              key={sport}
              onClick={() => setActiveSport(sport)}
              style={{
                padding: "5px 16px",
                fontSize: "12px",
                fontWeight: 700,
                borderRadius: "999px",
                letterSpacing: "0.04em",
                cursor: "pointer",
                border: activeSport === sport ? "none" : "1px solid #DDE2EB",
                background: activeSport === sport ? "#0D1B2E" : "transparent",
                color: activeSport === sport ? "#FFFFFF" : "#637A96",
              }}
            >
              {sport}
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ background: "#FFFFFF", borderRadius: "14px", padding: "20px 22px", boxShadow: "0 2px 10px rgba(13,27,46,0.07), 0 1px 3px rgba(13,27,46,0.04)" }} className="animate-pulse">
                <div style={{ height: "12px", background: "#E8ECF2", borderRadius: "4px", width: "80px", marginBottom: "14px" }} />
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                  <div>
                    <div style={{ height: "8px", background: "#E8ECF2", borderRadius: "4px", width: "60px", marginBottom: "6px" }} />
                    <div style={{ height: "22px", background: "#E8ECF2", borderRadius: "4px", width: "100px" }} />
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ height: "8px", background: "#E8ECF2", borderRadius: "4px", width: "60px", marginBottom: "6px", marginLeft: "auto" }} />
                    <div style={{ height: "22px", background: "#E8ECF2", borderRadius: "4px", width: "100px" }} />
                  </div>
                </div>
                <div style={{ background: "#F0FAF8", borderRadius: "8px", padding: "10px 13px", marginBottom: "14px" }}>
                  <div style={{ height: "8px", background: "#D4EDE9", borderRadius: "4px", width: "50px", marginBottom: "8px" }} />
                  <div style={{ height: "12px", background: "#D4EDE9", borderRadius: "4px", width: "85%" }} />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} style={{ flex: 1, height: "32px", background: "#F7F9FB", borderRadius: "6px" }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: "#FFFFFF", border: "1px solid #FECACA", borderRadius: "14px", padding: "24px", textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: "#D0342C" }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{ marginTop: "12px", fontSize: "12px", fontWeight: 700, color: "#0A7A6C", background: "none", border: "none", cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && games.length === 0 && (
          <div style={{ background: "#FFFFFF", border: "1px solid #E8ECF2", borderRadius: "14px", padding: "32px 24px", textAlign: "center" }}>
            <p style={{ fontSize: "17px", fontWeight: 700, color: "#0D1B2E", marginBottom: "4px" }}>No {activeSport} games today</p>
            <p style={{ fontSize: "13px", color: "#637A96" }}>Check back on a game day.</p>
          </div>
        )}

        {/* Today's games */}
        {!loading && !error && games.length > 0 && (() => {
          const sorted = [...games].sort((a, b) => parseGameTime(a.gameTime) - parseGameTime(b.gameTime));
          const allDone = sorted.every((g) => g.gameStatus === "final" || g.gameStatus === "live");
          return (
            <>
              {allDone && (
                <div style={{ background: "#FFFFFF", border: "1px solid #E8ECF2", borderRadius: "14px", padding: "16px 20px", marginBottom: "12px" }}>
                  <p style={{ fontSize: "13px", fontWeight: 500, color: "#637A96" }}>
                    All of tonight&#8217;s games are underway or have ended. Check back tomorrow for the full slate and fresh breakdowns.
                  </p>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {sorted.map((game) => (
                  <GameCard key={game.gameId} game={game} onClick={handleGameSelect} whatThisMeans={breakdownMap.get(game.gameId) ?? null} />
                ))}
              </div>
            </>
          );
        })()}

        {/* Tomorrow's Slate */}
        {!loading && !error && tomorrowGames.length > 0 && (() => {
          const sorted = [...tomorrowGames].sort((a, b) => parseGameTime(a.gameTime) - parseGameTime(b.gameTime));
          return (
            <div style={{ marginTop: "2.5rem" }}>
              <div style={{
                fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "#7A8FA6",
                margin: "0 0 1rem", paddingBottom: "10px",
                borderBottom: "1px solid #DDE2EB",
              }}>
                Tomorrow · Preview only, no breakdowns yet
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {sorted.map((game) => (
                  <GameCard key={game.gameId} game={game} onClick={() => {}} preview />
                ))}
              </div>
            </div>
          );
        })()}

        {/* Tagline */}
        {!loading && (
          <p style={{ marginTop: "2.5rem", textAlign: "center", fontSize: "12px", fontWeight: 600, color: "#637A96" }}>
            What the data says. Your decision to make.
          </p>
        )}
      </div>
    </div>
  );
}
