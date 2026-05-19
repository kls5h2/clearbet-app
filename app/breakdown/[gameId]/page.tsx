"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import BreakdownView, { type GatedReason, isPitcherUnknown } from "@/components/BreakdownView";
import type { BreakdownResult, AnyGame, MLBGame, Sport } from "@/lib/types";
import type { Tier } from "@/lib/tier";
import { lookupTeam, parseGameId } from "@/lib/team-names";

const PLACEHOLDER_BREAKDOWN: BreakdownResult = {
  gameShape: "A tightly contested environment driven by complementary rotations and familiar pacing. The script holds until star usage patterns shift mid-game, at which point volatility enters.",
  keyDrivers: [
    { factor: "Home-court rhythm against a travel-fatigued opponent.", weight: "primary", direction: "positive" },
    { factor: "Top scorer questionable — availability sets the range.", weight: "primary", direction: "negative" },
    { factor: "Tempo compression has held through the last ten meetings.", weight: "secondary", direction: "neutral" },
    { factor: "Bench depth supports the script if rotations shorten.", weight: "secondary", direction: "positive" },
  ],
  baseScript: "Expect the home team to dictate early pace, with the second quarter setting the tone. Adjustments likely come in the third, and the fourth becomes a matchup of closers.",
  fragilityCheck: [
    { item: "Two lineup dependencies remain unverified pre-tipoff — watch the inactives report.", color: "amber" },
    { item: "Third game in four nights for one side introduces fatigue risk.", color: "red" },
  ],
  marketRead: "The line sits closer to the recent baseline than the opening number implied. Value depends on which matchup you prioritize and how the lineup news lands.",
  edge: [
    "Totals market has moved in line with pace projection — no clear edge either way.",
    "Player prop context depends on starter confirmation.",
  ],
  edgeClosingLine: "Markets are pricing this close to fair. The edge, if any, is in the lineup news.",
  decisionLens: "Let the lineup news drive your read. This is not a pick. This is what the data says. Your decision is always yours.",
  cardSummary: "A tight spot with lineup-dependent range. The script holds if both stars suit up.",
  shareHook: "Placeholder share hook",
  confidenceLevel: 3,
  confidenceLabel: "FRAGILE",
  glossaryTerm: "Pace",
  glossaryDefinition: "The number of possessions a team uses per 48 minutes — a core tempo measure.",
};

const CONF_SUBTITLES: Record<string, string> = {
  "CLEAR SPOT": "One of the cleaner reads tonight",
  "LEAN":       "Directional but not clean",
  "FRAGILE":    "Logic holds but conditional",
  "PASS":       "Too many moving parts",
};
const CONF_COLORS: Record<string, { color: string; label: string }> = {
  "CLEAR SPOT": { color: "var(--clear)", label: "Clear Spot" },
  "LEAN":       { color: "var(--lean)",  label: "Lean" },
  "FRAGILE":    { color: "var(--fragile)", label: "Fragile" },
  "PASS":       { color: "var(--pass)",  label: "Pass" },
};

const SIGNAL_PANEL_COLORS: Record<string, string> = {
  "CLEAR SPOT": "#166534",
  "LEAN":       "#854d0e",
  "FRAGILE":    "#C9352A",
  "PASS":       "#2a2a2a",
};

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
  "Sorting signal from noise.",
  "No hot takes. Just data.",
  "Almost ready. Worth the wait.",
  "The market has opinions. So does the data.",
  "One moment. Making sure this is right.",
];

function useRotatingMessage(active: boolean) {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * LOADING_MESSAGES.length));
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (!active) return;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const interval = setInterval(() => {
      setVisible(false);
      timeout = setTimeout(() => {
        setIndex((i) => (i + 1) % LOADING_MESSAGES.length);
        setVisible(true);
      }, 400);
    }, 6000);
    return () => {
      clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [active]);
  return { message: LOADING_MESSAGES[index], visible };
}

function formatML(ml: number | null | undefined): string {
  if (ml == null) return "—";
  return ml > 0 ? `+${ml}` : `${ml}`;
}

function formatSpread(spread: number | null | undefined, abv: string): string {
  if (spread == null) return "—";
  return `${abv} ${spread > 0 ? "+" : ""}${spread}`;
}

export default function BreakdownPage() {
  const { gameId: rawGameId } = useParams<{ gameId: string }>();
  const gameId = decodeURIComponent(rawGameId ?? "");
  const router = useRouter();
  const searchParams = useSearchParams();
  const sport: Sport = searchParams.get("sport")?.toUpperCase() === "MLB" ? "MLB" : "NBA";

  const [status, setStatus] = useState<Status>("idle");
  const [breakdown, setBreakdown] = useState<BreakdownResult | null>(null);
  const [game, setGame] = useState<AnyGame | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [tier, setTier] = useState<Tier | null>(null);
  const [gated, setGated] = useState<GatedReason | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  const { message, visible } = useRotatingMessage(status === "loading");

  function fetchBreakdown(regenerate = false) {
    setStatus("loading");
    setBreakdown(null);
    setGame(null);
    setError(null);
    setGated(null);
    setGameStarted(false);

    fetch("/api/breakdown", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, sport, regenerate }),
    })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) {
          const err = new Error(body?.error ?? "Failed to generate breakdown") as Error & { status?: number; gameStarted?: boolean };
          err.status = r.status;
          err.gameStarted = body?.gameStarted === true;
          throw err;
        }
        return body;
      })
      .then((data) => {
        if (data.gated) {
          setBreakdown(PLACEHOLDER_BREAKDOWN);
          setGame(data.game);
          setGated(data.gated as GatedReason);
          setTier((data.tier as Tier | undefined) ?? "free");
          setFromCache(false);
          setGeneratedAt(null);
          setStatus("done");
          return;
        }
        setBreakdown(data.breakdown);
        setGame(data.game);
        setFromCache(data.fromCache ?? false);
        setGeneratedAt(data.generatedAt ?? null);
        setTier((data.tier as Tier | undefined) ?? "free");
        setStatus("done");
      })
      .catch((e: Error & { status?: number; gameStarted?: boolean }) => {
        if (e.gameStarted) setGameStarted(true);
        setError(e.message);
        setStatus("error");
      });
  }

  useEffect(() => {
    if (!gameId) return;
    fetchBreakdown();
  }, [gameId]);

  const resolvedNames = ((): { away: string; home: string } => {
    if (game) {
      const sp = game.sport as "NBA" | "MLB";
      const awayIsAbv = !game.awayTeam.teamName || game.awayTeam.teamName === game.awayTeam.teamAbv;
      const homeIsAbv = !game.homeTeam.teamName || game.homeTeam.teamName === game.homeTeam.teamAbv;
      return {
        away: awayIsAbv ? (lookupTeam(game.awayTeam.teamAbv, sp)?.full ?? game.awayTeam.teamAbv) : game.awayTeam.teamName,
        home: homeIsAbv ? (lookupTeam(game.homeTeam.teamAbv, sp)?.full ?? game.homeTeam.teamAbv) : game.homeTeam.teamName,
      };
    }
    const parsed = parseGameId(gameId);
    if (!parsed) return { away: "", home: "" };
    return {
      away: lookupTeam(parsed.awayAbv, sport)?.full ?? parsed.awayAbv,
      home: lookupTeam(parsed.homeAbv, sport)?.full ?? parsed.homeAbv,
    };
  })();

  // effectiveStatus drives canRegenerate and the pitcher warning — it must never
  // infer "final" from elapsed time. Only Tank01 can confirm a game is over.
  const effectiveStatus: "scheduled" | "live" | "final" | "postponed" = (() => {
    if (!game) return "scheduled";
    if (game.gameStatus === "final") return "final";
    if (game.gameStatus === "postponed") return "postponed";
    if (game.gameStatus === "live") return "live";
    // gameStatus is "scheduled" (snapshot captured before game started).
    // Use time to determine whether regeneration should still be allowed,
    // but never promote to "final" — only Tank01 can confirm the game ended.
    const m = game.gameTime?.match(/^(\d{1,2}):(\d{2})\s+(AM|PM)\s+ET$/i);
    if (m) {
      let gh = parseInt(m[1], 10);
      const gm = parseInt(m[2], 10);
      if (m[3].toUpperCase() === "PM" && gh !== 12) gh += 12;
      if (m[3].toUpperCase() === "AM" && gh === 12) gh = 0;
      const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
      const ch = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
      const cm = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
      const past = ch * 60 + cm - (gh * 60 + gm);
      if (past <= 0) return "scheduled";
      return "live"; // game has started — block regeneration, but don't assume final
    }
    if (game.gameDate && /^\d{8}$/.test(game.gameDate)) {
      const todayEt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()).replace(/-/g, "");
      if (game.gameDate < todayEt) return "live"; // past date — assume started, not confirmed final
      if (game.gameDate > todayEt) return "scheduled";
      return "live";
    }
    return "live";
  })();

  const canRegenerate = effectiveStatus === "scheduled";

  const formatGameDate = (yyyymmdd: string): string | null => {
    if (!/^\d{8}$/.test(yyyymmdd)) return null;
    const d = new Date(
      parseInt(yyyymmdd.slice(0, 4), 10),
      parseInt(yyyymmdd.slice(4, 6), 10) - 1,
      parseInt(yyyymmdd.slice(6, 8), 10),
    );
    return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  const formattedDate = game?.gameDate ? formatGameDate(game.gameDate) : null;
  const heroMetaLine = [
    sport,
    formattedDate,
    game?.gameTime,
  ].filter(Boolean).join(" · ");

  const odds = game?.odds;
  const spread = odds && "spread" in odds ? formatSpread(odds.spread as number | null, game?.homeTeam.teamAbv ?? "") : "—";
  const runLine = odds && "runLine" in odds ? formatSpread(odds.runLine as number | null, game?.homeTeam.teamAbv ?? "") : null;
  const total = odds?.total != null ? `${odds.total}` : "—";
  const awayML = odds ? formatML(odds.awayMoneyline as number | null) : "—";
  const homeML = odds ? formatML(odds.homeMoneyline as number | null) : "—";

  const confLabel = breakdown ? (CONF_COLORS[breakdown.confidenceLabel]?.label ?? "") : "";

  return (
    <>
    <style>{`
      @media (max-width: 600px) {
        .bd-hero-right { display: none !important; }
      }
    `}</style>
    <div style={{ background: "var(--warm-white)", minHeight: "100vh" }}>
      <Nav backHref={`/intel?sport=${sport}`} backLabel="Today's Intel" />

      {/* Dark hero band — two-column */}
      <div className="f2" style={{
        background: "var(--ink)",
        position: "relative", overflow: "hidden",
      }}>
        <span aria-hidden="true" style={{
          position: "absolute", right: "-5%", top: "50%", transform: "translateY(-50%)",
          fontSize: "clamp(120px, 30vw, 220px)", fontWeight: 900,
          color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.03)",
          lineHeight: 1, pointerEvents: "none", userSelect: "none",
        }}>R</span>

        <div style={{ maxWidth: "900px", margin: "0 auto", position: "relative", zIndex: 1, display: "flex", alignItems: "stretch", minHeight: "120px" }}>
          {/* Left: matchup info */}
          <div style={{ flex: 1, padding: "28px 24px 28px 20px" }}>
            <div style={{
              fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600,
              letterSpacing: "0.12em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)", marginBottom: "10px",
            }}>
              {sport} · Breakdown
            </div>
            <div style={{
              fontSize: "22px", fontWeight: 800,
              letterSpacing: "-0.03em", color: "#fff", lineHeight: 1.15, marginBottom: "10px",
            }}>
              {resolvedNames.away && resolvedNames.home ? (
                <>
                  {resolvedNames.away}
                  <span style={{ fontSize: "0.75em", fontWeight: 400, color: "rgba(255,255,255,0.35)", margin: "0 8px" }}>at</span>
                  {resolvedNames.home}
                </>
              ) : (
                "Breakdown"
              )}
            </div>
            {(game?.gameTime || formattedDate) && (
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", fontFamily: "var(--mono)" }}>
                {[game?.gameTime, formattedDate].filter(Boolean).join(" · ")}
              </div>
            )}
          </div>

          {/* Right: Signal Grade panel */}
          {status === "done" && breakdown && !gated ? (
            <div style={{
              width: "200px", flexShrink: 0,
              background: SIGNAL_PANEL_COLORS[breakdown.confidenceLabel] ?? "#2a2a2a",
              padding: "28px 20px",
              display: "flex", flexDirection: "column",
              justifyContent: "center", alignItems: "center", textAlign: "center",
            }}>
              <div style={{
                fontFamily: "var(--mono)", fontSize: "9px", fontWeight: 600,
                letterSpacing: "0.14em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.55)", marginBottom: "8px",
              }}>
                Signal Grade
              </div>
              <div style={{
                fontSize: "clamp(18px, 2.5vw, 26px)", fontWeight: 900,
                color: "#fff", letterSpacing: "-0.02em",
                lineHeight: 1.1, marginBottom: "8px",
                wordBreak: "break-word",
              }}>
                {confLabel}
              </div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>
                {CONF_SUBTITLES[breakdown.confidenceLabel] ?? ""}
              </div>
            </div>
          ) : (
            <div style={{ width: "200px", flexShrink: 0, background: "rgba(255,255,255,0.02)" }} />
          )}
        </div>
      </div>

      {/* Stats bar — three cells */}
      {game && odds && (
        <div className="f2" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border-med)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ maxWidth: "900px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div style={{ padding: "16px 20px", textAlign: "center", borderRight: "1px solid var(--border)" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "8px" }}>
                {sport === "MLB" ? "Run Line" : "Spread"}
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "28px", fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>
                {sport === "MLB" ? (runLine ?? "—") : spread}
              </div>
            </div>
            <div style={{ padding: "16px 20px", textAlign: "center", borderRight: "1px solid var(--border)" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "8px" }}>Total</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "28px", fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>{total}</div>
            </div>
            <div style={{ padding: "16px 20px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "8px" }}>Moneyline</div>
              <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: "var(--muted)", marginBottom: "2px" }}>{game.awayTeam.teamAbv}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "20px", fontWeight: 800, color: awayML.startsWith("-") ? "var(--signal)" : "var(--ink)" }}>{awayML}</div>
                </div>
                <div style={{ width: "1px", background: "var(--border)", alignSelf: "stretch" }} />
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: "var(--muted)", marginBottom: "2px" }}>{game.homeTeam.teamAbv}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "20px", fontWeight: 800, color: homeML.startsWith("-") ? "var(--signal)" : "var(--ink)" }}>{homeML}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content area */}
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* Loading */}
        {status === "loading" && (
          <div style={{
            minHeight: "55vh", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "10px", textAlign: "center",
            padding: "32px 20px",
          }}>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)" }}>Building your breakdown</p>
            <p style={{
              fontSize: "13px", color: "var(--muted)",
              transition: "opacity 0.4s ease", opacity: visible ? 1 : 0, minHeight: "1.4rem",
            }}>
              {message}
            </p>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div style={{ padding: "32px 20px 80px" }}>
          <div style={{
            background: "var(--surface)", border: "1px solid rgba(201,53,42,0.3)",
            borderRadius: 0, padding: "32px", textAlign: "center",
            boxShadow: "var(--shadow-sm)",
          }}>
            {gameStarted ? (
              <>
                <p style={{ fontSize: "17px", fontWeight: 600, color: "var(--ink)", marginBottom: "10px" }}>
                  This game is already underway.
                </p>
                <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.6, marginBottom: "24px", maxWidth: "400px", margin: "0 auto 24px" }}>
                  Breakdowns are generated before tip-off. Check back tomorrow for a fresh slate.
                </p>
              </>
            ) : (
              <>
                <p style={{ fontSize: "17px", fontWeight: 600, color: "var(--ink)", marginBottom: "8px" }}>Something went wrong</p>
                <p style={{ fontSize: "13px", color: "var(--signal)", marginBottom: "20px" }}>{error}</p>
              </>
            )}
            <Link
              href="/intel"
              style={{ fontSize: "12px", fontWeight: 700, color: "var(--signal)", textDecoration: "none" }}
            >
              ← Back to slate
            </Link>
          </div>
          </div>
        )}

        {/* Done */}
        {status === "done" && breakdown && game && (
          <>
            {/* Banners — padded container */}
            <div style={{ padding: "16px 20px 0" }}>
            {/* Cache/generation banner */}
            {!gated && fromCache && generatedAt && (
              <div style={{
                background: "rgba(201,53,42,0.05)", borderLeft: "3px solid var(--signal)",
                borderRadius: 0, padding: "10px 14px", fontSize: "13px",
                color: "var(--ink-2)", marginBottom: "16px", lineHeight: 1.5,
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px",
              }}>
                <span>
                  Breakdown generated at {new Date(generatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short" })}
                </span>
                {canRegenerate && tier === "pro" && (
                  <button onClick={() => fetchBreakdown(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, color: "var(--signal)", whiteSpace: "nowrap", padding: 0 }}>
                    Regenerate for latest data →
                  </button>
                )}
              </div>
            )}
            {!gated && !(fromCache && generatedAt) && (
              <div style={{
                background: "rgba(201,53,42,0.05)", borderLeft: "3px solid var(--signal)",
                borderRadius: 0, padding: "10px 14px", fontSize: "13px",
                color: "var(--ink-2)", marginBottom: "16px", lineHeight: 1.5,
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px",
              }}>
                <span>
                  {generatedAt
                    ? `Generated at ${new Date(generatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short" })} using live pre-game data.`
                    : `Generated using live pre-game data. Lineup changes after generation are not reflected.`}
                </span>
                {canRegenerate && tier === "pro" && (
                  <button onClick={() => fetchBreakdown(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, color: "var(--signal)", whiteSpace: "nowrap", padding: 0 }}>
                    Regenerate →
                  </button>
                )}
              </div>
            )}

            {/* MLB pitcher warning — shown for all users when pitcher(s) unconfirmed */}
            {game.sport === "MLB" && effectiveStatus !== "final" && (() => {
              const mlb = game as MLBGame;
              const homeUnknown = !mlb.homePitcher || mlb.homePitcher.confirmed !== true || isPitcherUnknown(mlb.homePitcher.name);
              const awayUnknown = !mlb.awayPitcher || mlb.awayPitcher.confirmed !== true || isPitcherUnknown(mlb.awayPitcher.name);
              return (homeUnknown || awayUnknown) ? (
                <div style={{
                  background: "rgba(217,163,58,0.08)", borderLeft: "3px solid #D9A33A",
                  borderRadius: 0, padding: "10px 14px", fontSize: "13px",
                  color: "var(--ink)", marginBottom: "16px", lineHeight: 1.5,
                }}>
                  🟡 Starting pitcher(s) not yet confirmed. Breakdown reflects available data — check the lineup closer to game time.
                </div>
              ) : null;
            })()}
            </div>{/* end banners */}

            <BreakdownView breakdown={breakdown} game={game} tier={tier ?? "free"} gated={gated ?? undefined} />

            {/* Breakdown Chat upsell — free users only, not gated */}
            {!gated && tier === "free" && (
              <div style={{ padding: "0 20px 80px" }}>
              <div style={{
                marginTop: "32px",
                border: "1px solid var(--border-med)",
                borderRadius: 0,
                overflow: "hidden",
              }}>
                {/* Header */}
                <div style={{ background: "var(--ink)", padding: "16px 22px" }}>
                  <div style={{
                    fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    color: "rgba(255,255,255,0.35)", marginBottom: 6,
                  }}>
                    Breakdown Chat
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
                    Have a follow-up? Ask the data.
                  </div>
                </div>
                {/* Body */}
                <div style={{ background: "var(--surface)", padding: "20px 22px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                    {[
                      "What does this mean for the total?",
                      "How does the injury change this read?",
                      "What's the strongest case against this lean?",
                    ].map((q) => (
                      <div key={q} style={{
                        fontSize: "13.5px", color: "var(--muted)",
                        padding: "10px 14px",
                        border: "1px solid var(--border-med)",
                        background: "var(--warm-white)",
                        fontStyle: "italic",
                        lineHeight: 1.4,
                      }}>
                        {q}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <svg width="11" height="13" viewBox="0 0 11 13" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
                      <rect x="1" y="5" width="9" height="7.5" rx="0" stroke="var(--muted)" strokeWidth="1.3" />
                      <path d="M3.5 5V3.5a2 2 0 0 1 4 0V5" stroke="var(--muted)" strokeWidth="1.3" strokeLinecap="square" />
                    </svg>
                    <span style={{ fontSize: "12.5px", color: "var(--muted)", fontFamily: "var(--mono)", letterSpacing: "0.02em" }}>
                      Pro only.{" "}
                    </span>
                    <Link href="/pricing" style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--signal)", textDecoration: "none" }}>
                      Upgrade → $9.99/mo
                    </Link>
                  </div>
                </div>
              </div>
              </div>
            )}
            {(gated || tier !== "free") && <div style={{ paddingBottom: "80px" }} />}

          </>
        )}
      </div>

      <footer style={{ textAlign: "center", padding: "20px", fontSize: "11.5px", color: "var(--muted-light)", lineHeight: 1.8 }}>
        For informational purposes only. RawIntel does not provide financial, betting, or investment advice. Bet responsibly.{" "}
        <a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer" style={{ color: "var(--muted)", textDecoration: "underline", textUnderlineOffset: "2px" }}>ncpgambling.org</a>
        {" · "}<Link href="/terms" style={{ color: "var(--muted)", textDecoration: "underline", textUnderlineOffset: "2px" }}>Terms of Service</Link>
        {" · "}<Link href="/privacy" style={{ color: "var(--muted)", textDecoration: "underline", textUnderlineOffset: "2px" }}>Privacy Policy</Link>
        {" · "}© RawIntel LLC
      </footer>

    </div>
    </>
  );
}
