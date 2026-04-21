"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import GameCard from "@/components/GameCard";
import Nav from "@/components/Nav";
import Logo from "@/components/Logo";
import { supabase } from "@/lib/supabase";
import type { AnyGame, Sport } from "@/lib/types";

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

// Thin wrapper so that useSearchParams() inside HomePageContent has a
// Suspense boundary — required by Next.js App Router for static prerender.
export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Honor ?sport=nba|mlb on initial load — case-insensitive. Falls back to NBA.
  const initialSport: Sport = (searchParams.get("sport")?.toUpperCase() === "MLB" ? "MLB" : "NBA");
  const [activeSport, setActiveSport] = useState<Sport>(initialSport);
  const [games, setGames] = useState<AnyGame[]>([]);
  const [tomorrowGames, setTomorrowGames] = useState<AnyGame[]>([]);
  const [breakdownMap, setBreakdownMap] = useState<Map<string, string>>(new Map());
  const [breakdownIds, setBreakdownIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const todayStr = getTodayDateString();
    Promise.resolve(
      supabase
        .from("breakdowns")
        .select("game_id, card_summary, sport, created_at")
        .eq("game_date", todayStr)
        // Newest first — if duplicates exist per game_id (upsert failed to dedupe,
        // or unique constraint missing), we'll keep only the most recent below.
        .order("created_at", { ascending: false })
        .limit(500)
    ).then(({ data, error: sbError }) => {
        if (sbError) {
          console.error("[slate] Supabase breakdown fetch failed:", sbError.message);
          return;
        }
        const rows = (data ?? []) as { game_id: string; card_summary: string | null; sport: string | null; created_at: string }[];
        console.log(`[slate] raw query: ${rows.length} rows for game_date=${todayStr}${rows.length === 0 ? " (no breakdowns generated for today yet)" : ""}`);
        const map = new Map<string, string>();
        const ids = new Set<string>();
        const seen = new Set<string>();
        for (const row of rows) {
          // Keep only the first (= newest) row per game_id. Protects against
          // duplicate rows that accumulate when the upsert conflict target
          // has no unique constraint to bind to.
          if (seen.has(row.game_id)) continue;
          seen.add(row.game_id);
          ids.add(row.game_id);
          const summary = (row.card_summary ?? "").trim();
          if (summary) {
            map.set(row.game_id, summary);
            console.log(`[slate]   ${row.game_id}: card_summary = "${summary.substring(0, 80)}..." (${row.created_at})`);
          } else {
            console.log(`[slate]   ${row.game_id}: newest row has no card_summary (${row.created_at}) — THE READ hidden`);
          }
        }
        console.log(`[slate] breakdownMap has ${map.size} entries, breakdownIds has ${ids.size} entries`);
        setBreakdownMap(map);
        setBreakdownIds(ids);
      }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setGames([]);
    setTomorrowGames([]);

    const sport = activeSport.toLowerCase();
    Promise.all([
      fetch(`/api/games?sport=${sport}`).then((r) => {
        if (!r.ok) throw new Error("Failed to load slate");
        return r.json();
      }),
      fetch(`/api/games?sport=${sport}&date=tomorrow`).then((r) => {
        if (!r.ok) return { games: [] };
        return r.json();
      }).catch(() => ({ games: [] })),
    ])
      .then(([todayData, tomorrowData]) => {
        setGames(todayData.games ?? []);
        setTomorrowGames(tomorrowData.games ?? []);
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

  // Force ET so the header matches the ET-based slate query. Without this,
  // a viewer in CT after ~11 PM sees "Monday, April 20" while the games
  // below are already Tuesday's ET slate.
  const todayLabel = new Date().toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div style={{ background: "var(--canvas)", minHeight: "100vh", paddingBottom: "5rem" }}>
      <Nav />

      {/* Hero — homepage is exempt from min-height and headline size (hero statement); other standards apply */}
      <div style={{ background: "var(--ink)", padding: "72px 40px 64px", position: "relative", overflow: "hidden" }}>
        <span aria-hidden="true" style={{
          position: "absolute", right: "-60px", top: "-80px",
          fontFamily: "Georgia, serif", fontSize: "520px", fontStyle: "italic",
          color: "rgba(217,59,58,0.07)", pointerEvents: "none", zIndex: 0, lineHeight: 1,
        }}>R.</span>
        <div style={{ position: "relative", zIndex: 1, maxWidth: "860px", margin: "0 auto" }}>
          <h1 style={{
            fontFamily: "var(--serif)", fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 500,
            color: "#FAFAFA", letterSpacing: "-0.025em", lineHeight: 1.1, marginBottom: "20px",
          }}>
            Raw data. Plain English. <em>Your call.</em>
          </h1>
          <p style={{ fontFamily: "var(--sans)", fontSize: "16px", color: "#9A9A96", maxWidth: "520px", lineHeight: 1.6, marginTop: "16px", marginBottom: "28px" }}>
            RawIntel turns raw game data into plain-English analysis — simple enough for a rookie, deep enough for a pro.
          </p>
          <a href="#slate" style={{
            background: "var(--signal)", color: "#FAFAFA", fontSize: "13px", fontWeight: 500,
            letterSpacing: "0.04em", padding: "14px 24px", borderRadius: "4px", textDecoration: "none",
            display: "inline-block",
          }}>
            Today&#8217;s Intel →
          </a>
        </div>
      </div>

      {/* Slate section */}
      <div id="slate" style={{ maxWidth: "860px", margin: "0 auto", padding: "48px 40px" }}>
        {/* Section header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "14px" }}>
            <span style={{
              fontSize: "11px", fontWeight: 500,
              textTransform: "uppercase", letterSpacing: "0.1em",
              color: "var(--ink)", opacity: 0.5,
            }}>Today&#8217;s Slate</span>
            <span style={{
              fontFamily: "var(--serif)", fontSize: "18px", fontWeight: 500,
              color: "var(--ink)", letterSpacing: "-0.015em",
            }}>{todayLabel}</span>
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            {(["NBA", "MLB"] as Sport[]).map((sport) => (
              <button
                key={sport}
                onClick={() => setActiveSport(sport)}
                style={{
                  padding: "8px 20px", fontSize: "12px", fontWeight: 500,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  borderRadius: "4px", cursor: "pointer",
                  border: activeSport === sport ? "none" : "0.5px solid var(--border)",
                  background: activeSport === sport ? "var(--ink)" : "transparent",
                  color: activeSport === sport ? "#FAFAFA" : "var(--ink)",
                  opacity: activeSport === sport ? 1 : 0.7,
                }}
              >
                {sport}
              </button>
            ))}
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ background: "var(--paper)", borderRadius: "6px", padding: "20px 24px", border: "0.5px solid var(--border)" }} className="animate-pulse">
                <div style={{ height: "12px", background: "#EDEAE3", borderRadius: "4px", width: "80px", marginBottom: "14px" }} />
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                  <div>
                    <div style={{ height: "8px", background: "#EDEAE3", borderRadius: "4px", width: "60px", marginBottom: "6px" }} />
                    <div style={{ height: "22px", background: "#EDEAE3", borderRadius: "4px", width: "100px" }} />
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ height: "8px", background: "#EDEAE3", borderRadius: "4px", width: "60px", marginBottom: "6px", marginLeft: "auto" }} />
                    <div style={{ height: "22px", background: "#EDEAE3", borderRadius: "4px", width: "100px" }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} style={{ flex: 1, height: "32px", background: "#EDEAE3", borderRadius: "4px" }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: "var(--paper)", border: "0.5px solid rgba(217,59,58,0.3)", borderRadius: "6px", padding: "24px", textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: "var(--signal)" }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{ marginTop: "12px", fontSize: "13px", fontWeight: 500, color: "var(--signal)", background: "none", border: "none", cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && games.length === 0 && (
          <div style={{ background: "var(--paper)", border: "0.5px solid var(--border)", borderRadius: "6px", padding: "32px 24px", textAlign: "center" }}>
            <p style={{ fontSize: "17px", fontWeight: 500, color: "var(--ink)", marginBottom: "4px" }}>No {activeSport} games today</p>
            <p style={{ fontSize: "13px", color: "var(--muted)" }}>Check back on a game day.</p>
          </div>
        )}

        {/* Today's games */}
        {!loading && !error && games.length > 0 && (() => {
          const sorted = [...games].sort((a, b) => parseGameTime(a.gameTime) - parseGameTime(b.gameTime));
          const allDone = sorted.every((g) => g.gameStatus === "final" || g.gameStatus === "live");
          return (
            <>
              {allDone && (
                <div style={{ background: "var(--paper)", border: "0.5px solid var(--border)", borderRadius: "6px", padding: "16px 20px", marginBottom: "12px" }}>
                  <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                    All of tonight&#8217;s games are underway or have ended. Check back tomorrow for the full slate and fresh breakdowns.
                  </p>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {sorted.map((game) => (
                  <GameCard key={game.gameId} game={game} onClick={handleGameSelect} whatThisMeans={breakdownMap.get(game.gameId) ?? null} hasBreakdown={breakdownIds.has(game.gameId)} />
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
                fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "var(--ink)", opacity: 0.5,
                margin: "0 0 1rem", paddingBottom: "10px",
                borderBottom: "0.5px solid var(--border)",
              }}>
                Preview · Tomorrow&#8217;s Slate · Breakdowns available on the day of the game
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {sorted.map((game) => (
                  <GameCard key={game.gameId} game={game} onClick={() => {}} preview />
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Voice strip */}
      <div style={{ background: "var(--ink)", padding: "48px 40px", textAlign: "center" }}>
        <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "clamp(18px, 3vw, 24px)", color: "#FAFAFA", maxWidth: "600px", margin: "0 auto 16px", lineHeight: 1.4 }}>
          The numbers don&#8217;t lie. They just need translating. Here&#8217;s the read — <em>you make the call.</em>
        </p>
        <p style={{ fontSize: "12px", color: "var(--muted)" }}>
          <Logo dark /> · rawintelsports.com
        </p>
      </div>

      {/* Tagline */}
      <div style={{ padding: "2rem 0", textAlign: "center" }}>
        <p style={{ fontSize: "12px", color: "var(--muted)" }}>
          What the data says. The call is yours.
        </p>
      </div>
    </div>
  );
}
