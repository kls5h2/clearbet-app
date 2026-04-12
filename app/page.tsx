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
    <div className="min-h-screen bg-[#F0F3F7]">
      <Nav />

      <main className="max-w-2xl mx-auto px-4 pt-6 pb-24">
        {/* Slate header */}
        <div className="mb-5">
          <h1 className="font-heading text-[26px] font-extrabold text-[#0D1B2E] leading-tight">
            Today&#8217;s Slate
          </h1>
          <p className="mt-1 font-mono text-[11px] font-medium text-[#9FADBF] tracking-wide">
            {todayLabel}
          </p>
        </div>

        {/* Sport tabs */}
        <div className="flex gap-2 mb-5">
          {(["NBA", "MLB"] as Sport[]).map((sport) => (
            <button
              key={sport}
              onClick={() => setActiveSport(sport)}
              className={`font-mono text-[10px] font-bold tracking-[0.12em] uppercase px-4 py-2 rounded-full transition-colors ${
                activeSport === sport
                  ? "bg-[#0A7A6C] text-white"
                  : "bg-white border border-[#E8ECF2] text-[#9FADBF] hover:border-[#0A7A6C] hover:text-[#0A7A6C]"
              }`}
            >
              {sport}
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-[#E8ECF2] rounded-xl overflow-hidden animate-pulse shadow-[0_1px_4px_rgba(13,27,46,0.05)]"
              >
                <div className="h-[3px] bg-[#E8ECF2]" />
                <div className="px-4 py-2 border-b border-[#EEF1F5] bg-[#F7F9FC]">
                  <div className="h-3 bg-[#E8ECF2] rounded w-20" />
                </div>
                <div className="px-4 pt-4 pb-3 flex justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-[17px] bg-[#E8ECF2] rounded w-28" />
                    <div className="h-[17px] bg-[#E8ECF2] rounded w-20" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-[17px] bg-[#E8ECF2] rounded w-28 ml-auto" />
                    <div className="h-[17px] bg-[#E8ECF2] rounded w-20 ml-auto" />
                  </div>
                </div>
                <div className="mx-4 mb-3 bg-[#F7F9FC] rounded-lg px-4 py-3 border border-[#EEF1F5]">
                  <div className="h-2 bg-[#E8ECF2] rounded w-16 mb-2" />
                  <div className="h-3 bg-[#E8ECF2] rounded w-full" />
                </div>
                <div className="px-4 py-3 border-t border-[#EEF1F5] bg-[#F7F9FC] flex justify-between">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-3 bg-[#E8ECF2] rounded w-10" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-white border border-[#FECACA] rounded-xl p-6 text-center shadow-[0_1px_4px_rgba(13,27,46,0.05)]">
            <p className="text-[14px] text-[#D0342C]">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 font-mono text-[11px] font-semibold text-[#0A7A6C] hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && games.length === 0 && (
          <div className="bg-white border border-[#E8ECF2] rounded-xl p-8 text-center shadow-[0_1px_4px_rgba(13,27,46,0.05)]">
            <p className="font-heading text-[17px] font-bold text-[#0D1B2E] mb-1">
              No {activeSport} games today
            </p>
            <p className="text-[13px] text-[#637A96]">Check back on a game day.</p>
          </div>
        )}

        {/* Today's games */}
        {!loading && !error && games.length > 0 && (() => {
          const sorted = [...games].sort((a, b) => parseGameTime(a.gameTime) - parseGameTime(b.gameTime));
          const allDone = sorted.every((g) => g.gameStatus === "final" || g.gameStatus === "live");
          return (
            <>
              {allDone && (
                <div className="bg-white border border-[#E8ECF2] rounded-xl px-5 py-4 mb-4 shadow-[0_1px_4px_rgba(13,27,46,0.05)]">
                  <p className="text-[13px] text-[#637A96]">
                    All of tonight&#8217;s games are underway or have ended. Check back tomorrow for the full slate and fresh breakdowns.
                  </p>
                </div>
              )}
              <div className="space-y-3">
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
          const tomorrowLabel = tomorrowDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          });
          return (
            <div className="mt-10">
              <div className="mb-5">
                <h2 className="font-heading text-[22px] font-extrabold text-[#9FADBF] leading-tight">
                  Tomorrow&#8217;s Slate
                </h2>
                <p className="mt-1 font-mono text-[11px] font-medium text-[#B0BAC9] tracking-wide">
                  {tomorrowLabel} · Preview only, no breakdowns yet
                </p>
              </div>
              <div className="space-y-3">
                {sorted.map((game) => (
                  <GameCard key={game.gameId} game={game} onClick={() => {}} preview />
                ))}
              </div>
            </div>
          );
        })()}

        {/* Tagline */}
        {!loading && (
          <p className="mt-10 text-center font-mono text-[11px] font-medium text-[#B0BAC9] tracking-wide">
            What the data says. Your decision to make.
          </p>
        )}
      </main>
    </div>
  );
}
