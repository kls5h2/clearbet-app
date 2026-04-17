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
  const [fromCache, setFromCache] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const { message, visible } = useRotatingMessage(status === "loading");

  function fetchBreakdown(regenerate = false) {
    setStatus("loading");
    setBreakdown(null);
    setGame(null);

    fetch("/api/breakdown", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, sport, regenerate }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to generate breakdown");
        return r.json();
      })
      .then((data) => {
        setBreakdown(data.breakdown);
        setGame(data.game);
        setFromCache(data.fromCache ?? false);
        setGeneratedAt(data.generatedAt ?? null);
        setStatus("done");
      })
      .catch((e) => {
        setError(e.message);
        setStatus("error");
      });
  }

  useEffect(() => {
    if (!gameId) return;
    fetchBreakdown();
  }, [gameId]);

  return (
    <div style={{ background: "var(--canvas, #FAFAFA)", minHeight: "100vh", paddingBottom: "5rem" }}>
      <Nav backHref="/" sportTag={sport} />

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "1.5rem 1.5rem 0" }}>
        {/* Loading state */}
        {status === "loading" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* Pulsing game header */}
            <div style={{ background: "var(--paper, #F7F5F0)", borderRadius: "6px", padding: "22px", border: "0.5px solid var(--border, #E0DED8)" }} className="animate-pulse">
              <div style={{ height: "11px", background: "#EDEAE3", borderRadius: "4px", width: "80px", marginBottom: "14px" }} />
              <div style={{ display: "flex", gap: "14px", marginBottom: "16px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ height: "8px", background: "#EDEAE3", borderRadius: "4px", width: "60px", marginBottom: "6px" }} />
                  <div style={{ height: "26px", background: "#EDEAE3", borderRadius: "4px", width: "120px" }} />
                </div>
                <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
                  <div>
                    <div style={{ height: "8px", background: "#EDEAE3", borderRadius: "4px", width: "60px", marginBottom: "6px" }} />
                    <div style={{ height: "26px", background: "#EDEAE3", borderRadius: "4px", width: "120px" }} />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                {[1,2,3,4].map(j => <div key={j} style={{ flex: 1, height: "40px", background: "#EDEAE3", borderRadius: "6px" }} />)}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ height: "24px", background: "#EDEAE3", borderRadius: "999px", width: "72px" }} />
                <div style={{ height: "24px", background: "#EDEAE3", borderRadius: "4px", width: "160px" }} />
              </div>
            </div>

            {/* Loading message card */}
            <div style={{ background: "var(--paper, #F7F5F0)", borderRadius: "6px", padding: "32px 22px", textAlign: "center", border: "0.5px solid var(--border, #E0DED8)" }}>
              <p style={{ fontSize: "17px", fontWeight: 500, color: "var(--ink, #0E0E0E)", marginBottom: "12px" }}>Building your breakdown</p>
              <p
                style={{ fontSize: "13px", fontWeight: 500, color: "var(--muted, #8A8A86)", minHeight: "1.4rem", transition: "opacity 0.4s ease", opacity: visible ? 1 : 0 }}
              >
                {message}
              </p>
            </div>

            {/* Pulsing section skeletons */}
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ background: "var(--paper, #F7F5F0)", borderRadius: "6px", padding: "20px 22px", border: "0.5px solid var(--border, #E0DED8)" }} className="animate-pulse">
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                  <div style={{ height: "10px", background: "#EDEAE3", borderRadius: "4px", width: "20px" }} />
                  <div style={{ height: "10px", background: "#EDEAE3", borderRadius: "4px", width: "80px" }} />
                  <div style={{ flex: 1, height: "1px", background: "#EDEAE3" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ height: "14px", background: "#EDEAE3", borderRadius: "4px", width: "100%" }} />
                  <div style={{ height: "14px", background: "#EDEAE3", borderRadius: "4px", width: "85%" }} />
                  <div style={{ height: "14px", background: "#EDEAE3", borderRadius: "4px", width: "70%" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div style={{ background: "var(--paper, #F7F5F0)", border: "0.5px solid var(--signal, #D93B3A)", borderRadius: "6px", padding: "32px", textAlign: "center" }}>
            <p style={{ fontSize: "17px", fontWeight: 500, color: "var(--ink, #0E0E0E)", marginBottom: "8px" }}>Something went wrong</p>
            <p style={{ fontSize: "13px", color: "var(--signal, #D93B3A)", marginBottom: "20px" }}>{error}</p>
            <button
              onClick={() => router.push("/")}
              style={{ fontSize: "12px", fontWeight: 700, color: "var(--signal, #D93B3A)", background: "none", border: "none", cursor: "pointer" }}
            >
              ← Back to slate
            </button>
          </div>
        )}

        {/* Done state */}
        {status === "done" && breakdown && game && (
          <>
            {fromCache && generatedAt ? (
              /* Cached breakdown banner */
              <div style={{ background: "#FEF3F3", border: "0.5px solid rgba(217,59,58,0.2)", borderLeft: "3px solid var(--signal, #D93B3A)", borderRadius: "6px", padding: "10px 14px", fontSize: "13px", fontWeight: 500, color: "var(--ink, #0E0E0E)", marginBottom: "16px", lineHeight: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                <span>
                  Breakdown generated at {new Date(generatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short" })}
                </span>
                <button
                  onClick={() => fetchBreakdown(true)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, color: "var(--signal, #D93B3A)", whiteSpace: "nowrap", padding: 0 }}
                >
                  Regenerate for latest data →
                </button>
              </div>
            ) : (
              /* Fresh generation banner */
              <div style={{ background: "#FEF3F3", border: "0.5px solid rgba(217,59,58,0.2)", borderLeft: "3px solid var(--signal, #D93B3A)", borderRadius: "6px", padding: "10px 14px", fontSize: "13px", fontWeight: 500, color: "var(--ink, #0E0E0E)", marginBottom: "16px", lineHeight: 1.5 }}>
                Generated before {game.sport === "MLB" ? "first pitch" : "tip-off"} using live pre-game data. Injury updates or lineup changes after generation are not reflected.
              </div>
            )}
            <BreakdownView breakdown={breakdown} game={game} />
          </>
        )}

        {/* Tagline + timestamp */}
        {status === "done" && (
          <div style={{ textAlign: "center", padding: "1.5rem 0 0" }}>
            <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "12px", color: "var(--muted, #8A8A86)" }}>
              What the data says. Your decision to make.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
