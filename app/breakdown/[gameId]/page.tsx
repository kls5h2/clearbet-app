"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import BreakdownView from "@/components/BreakdownView";
import Nav from "@/components/Nav";
import type { BreakdownResult, AnyGame, Sport } from "@/lib/types";

type Status = "idle" | "loading" | "done" | "error";

const LOADING_MESSAGES = [
  "Pulling live data...",
  "Reading the injury report so you don't have to.",
  "Checking if anyone important is actually playing tonight.",
  "Running the numbers. Ignoring the hot takes.",
  "Cross-referencing the odds against the data.",
  "Almost there. This is the part where the picture gets clear.",
  "Asking the right questions about tonight's game.",
  "Separating signal from noise.",
  "Building your breakdown. Not picking your bet.",
  "The data is talking. We're listening.",
  "Checking who's actually suiting up tonight.",
  "Running the numbers one more time.",
  "Sorting signal from noise.",
  "This is the part where the picture gets clear.",
  "Pulling the latest injury report.",
  "No hot takes. Just data.",
  "Almost ready. Worth the wait.",
  "Asking better questions about tonight's game.",
  "The market has opinions. So does the data.",
  "One moment. Making sure this is right.",
];

function useRotatingMessage(active: boolean) {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * LOADING_MESSAGES.length));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % LOADING_MESSAGES.length);
        setVisible(true);
      }, 400);
    }, 6000);
    return () => clearInterval(interval);
  }, [active]);

  return { message: LOADING_MESSAGES[index], visible };
}

export default function BreakdownPage() {
  const { gameId: rawGameId } = useParams<{ gameId: string }>();
  const gameId = decodeURIComponent(rawGameId ?? "");
  const router = useRouter();
  const searchParams = useSearchParams();
  const sport: Sport = (searchParams.get("sport")?.toUpperCase() === "MLB" ? "MLB" : "NBA");

  const [status, setStatus] = useState<Status>("idle");
  const [breakdown, setBreakdown] = useState<BreakdownResult | null>(null);
  const [game, setGame] = useState<AnyGame | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { message, visible } = useRotatingMessage(status === "loading");

  useEffect(() => {
    if (!gameId) return;
    setStatus("loading");

    fetch("/api/breakdown", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, sport }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to generate breakdown");
        return r.json();
      })
      .then((data) => {
        setBreakdown(data.breakdown);
        setGame(data.game);
        setStatus("done");
      })
      .catch((e) => {
        setError(e.message);
        setStatus("error");
      });
  }, [gameId]);

  return (
    <div className="min-h-screen bg-[#F0F3F7]">
      <Nav backHref="/" sportTag={sport} />

      <main className="max-w-2xl mx-auto px-4 pt-6 pb-24">
        {/* Loading state */}
        {status === "loading" && (
          <div className="space-y-3">
            {/* Pulsing header card */}
            <div className="bg-white border border-[#E8ECF2] rounded-xl p-6 animate-pulse shadow-[0_1px_4px_rgba(13,27,46,0.05)]">
              <div className="h-2.5 bg-[#E8ECF2] rounded w-16 mb-3" />
              <div className="h-7 bg-[#E8ECF2] rounded w-44 mb-2" />
              <div className="h-4 bg-[#E8ECF2] rounded w-60" />
              <div className="mt-5 pt-4 border-t border-[#E8ECF2] flex gap-3">
                <div className="h-6 bg-[#E8ECF2] rounded-full w-20" />
                <div className="h-6 bg-[#E8ECF2] rounded-full w-28" />
              </div>
            </div>

            {/* Rotating message card */}
            <div className="bg-white border border-[#E8ECF2] rounded-xl px-6 py-8 text-center shadow-[0_1px_4px_rgba(13,27,46,0.05)]">
              <p className="font-heading text-[17px] font-bold text-[#0D1B2E] mb-3">
                Building your breakdown
              </p>
              <p
                className="text-[13px] text-[#637A96] min-h-[1.4rem]"
                style={{ opacity: visible ? 1 : 0, transition: "opacity 0.4s ease" }}
              >
                {message}
              </p>
            </div>

            {/* Pulsing section skeletons */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-[#E8ECF2] rounded-xl p-6 animate-pulse shadow-[0_1px_4px_rgba(13,27,46,0.05)]"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-3 bg-[#E8ECF2] rounded w-6" />
                  <div className="h-3 bg-[#E8ECF2] rounded w-24" />
                  <div className="flex-1 h-px bg-[#E8ECF2]" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-[#E8ECF2] rounded w-full" />
                  <div className="h-4 bg-[#E8ECF2] rounded w-5/6" />
                  <div className="h-4 bg-[#E8ECF2] rounded w-4/6" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="bg-white border border-[#FECACA] rounded-xl p-8 text-center shadow-[0_1px_4px_rgba(13,27,46,0.05)]">
            <p className="font-heading text-[17px] font-bold text-[#0D1B2E] mb-2">
              Something went wrong
            </p>
            <p className="text-[13px] text-[#D0342C] mb-5">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="font-mono text-[11px] font-semibold text-[#0A7A6C] hover:underline"
            >
              ← Back to slate
            </button>
          </div>
        )}

        {/* Done state */}
        {status === "done" && breakdown && game && (
          <>
            {/* Pre-game data notice */}
            <div className="bg-[#F0F3F7] border border-[#E8ECF2] rounded-xl px-5 py-3 mb-3">
              <p className="font-mono text-[10px] font-medium text-[#9FADBF] leading-relaxed">
                Generated before {game.sport === "MLB" ? "first pitch" : "tip-off"} using live pre-game data. Injury updates or lineup changes after generation are not reflected.
              </p>
            </div>
            <BreakdownView breakdown={breakdown} game={game} />
          </>
        )}

        {/* Tagline */}
        {status === "done" && (
          <p className="mt-10 text-center font-mono text-[11px] font-medium text-[#B0BAC9] tracking-wide">
            What the data says. Your decision to make.
          </p>
        )}
      </main>
    </div>
  );
}
