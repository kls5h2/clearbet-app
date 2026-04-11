"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GameCard from "@/components/GameCard";
import type { NBAGame, MLBGame, AnyGame, Sport } from "@/lib/types";

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

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      {/* Nav */}
      <header className="border-b border-[#E0E5EE] bg-white">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <span className="font-heading text-xl font-bold text-[#0D1B2E] tracking-tight">
              Clearbet
            </span>
          </div>
          <a
            href="/glossary"
            className="font-mono text-xs text-[#6B7A90] hover:text-[#0A7A6C] transition-colors"
          >
            Glossary
          </a>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="font-heading text-3xl font-extrabold text-[#0D1B2E] border-b-2 border-[#0A7A6C] inline-block pb-1">
            Today&#8217;s Slate
          </h1>
          <p className="mt-2 font-mono text-xs text-[#6B7A90] tracking-wide">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Sport tabs */}
        <div className="flex gap-2 mb-6">
          {(["NBA", "MLB"] as Sport[]).map((sport) => (
            <button
              key={sport}
              onClick={() => setActiveSport(sport)}
              className={`font-mono text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-lg transition-colors ${
                activeSport === sport
                  ? "bg-[#0A7A6C] text-white"
                  : "bg-white border border-[#E0E5EE] text-[#6B7A90] hover:border-[#0A7A6C] hover:text-[#0A7A6C]"
              }`}
            >
              {sport}
            </button>
          ))}
        </div>

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-[#E0E5EE] rounded-xl p-5 animate-pulse"
              >
                <div className="h-3 bg-[#E0E5EE] rounded w-24 mb-4" />
                <div className="flex justify-between mb-4">
                  <div className="space-y-2">
                    <div className="h-5 bg-[#E0E5EE] rounded w-32" />
                    <div className="h-5 bg-[#E0E5EE] rounded w-24" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-5 bg-[#E0E5EE] rounded w-32" />
                    <div className="h-5 bg-[#E0E5EE] rounded w-24" />
                  </div>
                </div>
                <div className="h-px bg-[#E0E5EE] mb-3" />
                <div className="flex justify-between">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-3 bg-[#E0E5EE] rounded w-12" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-white border border-red-100 rounded-xl p-6 text-center">
            <p className="text-sm text-[#D0342C]">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-xs font-mono text-[#0A7A6C] hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && games.length === 0 && (
          <div className="bg-white border border-[#E0E5EE] rounded-xl p-8 text-center">
            <p className="font-heading text-lg font-semibold text-[#0D1B2E] mb-2">
              No {activeSport} games today
            </p>
            <p className="text-sm text-[#6B7A90]">Check back on a game day.</p>
          </div>
        )}

        {!loading && !error && games.length > 0 && (() => {
          const sorted = [...games].sort((a, b) => parseGameTime(a.gameTime) - parseGameTime(b.gameTime));
          const allDone = sorted.every((g) => g.gameStatus === "final" || g.gameStatus === "live");
          return (
            <>
              {allDone && (
                <div className="bg-white border border-[#E0E5EE] rounded-xl px-5 py-4 mb-4">
                  <p className="text-sm text-[#6B7A90]">
                    All of tonight&#8217;s games are underway or have ended. Check back tomorrow morning for the full slate and fresh breakdowns.
                  </p>
                </div>
              )}
              <div className="space-y-4">
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
          const tomorrowDate = new Date();
          tomorrowDate.setDate(tomorrowDate.getDate() + 1);
          const tomorrowLabel = tomorrowDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
          return (
            <div className="mt-10">
              <div className="mb-6">
                <h2 className="font-heading text-2xl font-extrabold text-[#6B7A90] border-b-2 border-[#B0BAC9] inline-block pb-1">
                  Tomorrow&#8217;s Slate
                </h2>
                <p className="mt-2 font-mono text-xs text-[#B0BAC9] tracking-wide">
                  {tomorrowLabel} — preview only, no breakdowns yet
                </p>
              </div>
              <div className="space-y-4">
                {sorted.map((game) => (
                  <GameCard key={game.gameId} game={game} onClick={() => {}} preview />
                ))}
              </div>
            </div>
          );
        })()}

        {/* Tagline */}
        <p className="mt-10 text-center font-mono text-xs text-[#6B7A90]">
          What the data says. Your decision to make.
        </p>
      </main>
    </div>
  );
}
