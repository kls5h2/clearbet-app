"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GameCard from "@/components/GameCard";
import Nav from "@/components/Nav";
import type { AnyGame, Sport } from "@/lib/types";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div style={{ fontFamily: "var(--font-manrope, Manrope, sans-serif)", background: "#F0F3F7", minHeight: "100vh", paddingBottom: "5rem" }}>
      <Nav />

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "2.5rem 1.5rem 0" }}>
        {/* Page title */}
        <h1 style={{ fontSize: "34px", fontWeight: 800, color: "#0D1B2E", letterSpacing: "-0.03em", marginBottom: "6px", lineHeight: 1.15 }}>
          Today&#8217;s Slate
        </h1>
        <p style={{ fontSize: "14px", color: "#637A96", fontWeight: 500, marginBottom: "1.5rem" }}>
          {todayLabel}
        </p>

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
                  <GameCard key={game.gameId} game={game} onClick={handleGameSelect} />
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
