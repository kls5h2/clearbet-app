"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import BreakdownView from "@/components/BreakdownView";
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
    <div className="min-h-screen bg-[#F4F6F9]">
      {/* Nav */}
      <header className="border-b border-[#E0E5EE] bg-white sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="font-mono text-xs text-[#6B7A90] hover:text-[#0A7A6C] transition-colors"
          >
            ← Back
          </button>
          <span className="text-[#E0E5EE]">|</span>
          <span className="font-heading text-base font-bold text-[#0D1B2E]">Clearbet</span>
          <span className="font-mono text-xs text-[#0A7A6C] tracking-widest uppercase">{sport}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Loading state */}
        {status === "loading" && (
          <div className="space-y-4">
            {/* Pulsing header */}
            <div className="bg-white border border-[#E0E5EE] rounded-xl p-6 animate-pulse">
              <div className="h-3 bg-[#E0E5EE] rounded w-20 mb-3" />
              <div className="h-7 bg-[#E0E5EE] rounded w-48 mb-2" />
              <div className="h-4 bg-[#E0E5EE] rounded w-64" />
            </div>

            {/* Loading message with rotating text */}
            <div className="bg-white border border-[#E0E5EE] rounded-xl p-8 text-center">
              <p className="font-heading text-lg font-semibold text-[#0D1B2E] mb-4">
                Building breakdown
              </p>
              <p
                className="text-sm text-[#6B7A90] min-h-[1.5rem] transition-opacity duration-400"
                style={{ opacity: visible ? 1 : 0, transition: "opacity 0.4s ease" }}
              >
                {message}
              </p>
            </div>

            {/* Pulsing sections */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-[#E0E5EE] rounded-xl p-6 animate-pulse"
              >
                <div className="h-3 bg-[#E0E5EE] rounded w-8 mb-3" />
                <div className="h-4 bg-[#E0E5EE] rounded w-32 mb-4" />
                <div className="space-y-2">
                  <div className="h-3 bg-[#E0E5EE] rounded w-full" />
                  <div className="h-3 bg-[#E0E5EE] rounded w-4/5" />
                  <div className="h-3 bg-[#E0E5EE] rounded w-3/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="bg-white border border-red-100 rounded-xl p-8 text-center">
            <p className="font-heading text-lg font-semibold text-[#0D1B2E] mb-2">
              Something went wrong
            </p>
            <p className="text-sm text-[#D0342C] mb-4">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="text-xs font-mono text-[#0A7A6C] hover:underline"
            >
              ← Back to slate
            </button>
          </div>
        )}

        {/* Done state */}
        {status === "done" && breakdown && game && (
          <>
            {/* Pre-game data banner — sets expectations for all breakdowns */}
            <div className="bg-[#F4F6F9] border border-[#E0E5EE] rounded-xl px-5 py-3 mb-4">
              <p className="font-mono text-[10px] text-[#6B7A90] leading-relaxed">
                This breakdown was generated before tip-off using live pre-game data. Injury updates or lineup changes after generation are not reflected.
              </p>
            </div>
            <BreakdownView breakdown={breakdown} game={game} />
          </>
        )}

        {/* Tagline */}
        {status === "done" && (
          <p className="mt-10 text-center font-mono text-xs text-[#6B7A90]">
            What the data says. Your decision to make.
          </p>
        )}
      </main>
    </div>
  );
}
