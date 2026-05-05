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

type Status = "idle" | "loading" | "streaming" | "done" | "error";

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
  const [streamingText, setStreamingText] = useState("");
  const [fromCache, setFromCache] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [tier, setTier] = useState<Tier | null>(null);
  const [gated, setGated] = useState<GatedReason | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  function fetchBreakdown(regenerate = false) {
    setStatus("loading");
    setBreakdown(null);
    setGame(null);
    setGated(null);
    setGameStarted(false);
    setStreamingText("");
    setError(null);

    fetch("/api/breakdown", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, sport, regenerate }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          const err = new Error(body?.error ?? "Failed to generate breakdown") as Error & { status?: number; gameStarted?: boolean };
          err.status = r.status;
          err.gameStarted = body?.gameStarted === true;
          throw err;
        }

        // Streaming NDJSON — fresh NBA generation
        if (r.headers.get("content-type")?.includes("application/x-ndjson")) {
          const reader = r.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.trim()) continue;
              let msg: { t: string; [key: string]: unknown };
              try { msg = JSON.parse(line); } catch { continue; }

              if (msg.t === "m") {
                // Meta: game + tier arrive before Claude starts — render header immediately
                setGame(msg.game as AnyGame);
                setTier((msg.tier as Tier | undefined) ?? "free");
                setFromCache((msg.fromCache as boolean | undefined) ?? false);
                setGeneratedAt((msg.generatedAt as string | null) ?? null);
                setStatus("streaming");
              } else if (msg.t === "c") {
                setStreamingText((prev) => prev + (msg.d as string));
              } else if (msg.t === "r") {
                setBreakdown(msg.d as BreakdownResult);
                setGeneratedAt((msg.generatedAt as string | null) ?? null);
                setStatus("done");
              } else if (msg.t === "e") {
                setError((msg.message as string | undefined) ?? "Failed to generate breakdown");
                setStatus("error");
              }
            }
          }
          return;
        }

        // JSON response — cache hit, gated, or MLB
        const data = await r.json();
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

  const confColor = breakdown ? (CONF_COLORS[breakdown.confidenceLabel]?.color ?? "var(--clear)") : "var(--clear)";
  const confLabel = breakdown ? (CONF_COLORS[breakdown.confidenceLabel]?.label ?? "") : "";

  return (
    <>
    <style>{`
      @media (max-width: 768px) {
        .bd-away-ml { display: none !important; }
        .bd-odds-grid { grid-template-columns: repeat(3, 1fr) !important; min-width: 0 !important; }
      }
    `}</style>
    <div style={{ background: "var(--warm-white)", minHeight: "100vh" }}>
      <Nav backHref={`/intel?sport=${sport}`} backLabel="Today's Intel" />

      {/* Dark hero band */}
      <div className="f2" style={{
        background: "var(--ink)", padding: "28px 20px",
        position: "relative", overflow: "hidden",
      }}>
        <span aria-hidden="true" style={{
          content: "R", position: "absolute", right: "-5%", top: "50%", transform: "translateY(-50%)",
          fontSize: "clamp(120px, 30vw, 220px)", fontWeight: 900,
          color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.03)",
          lineHeight: 1, pointerEvents: "none", userSelect: "none",
        }}>R</span>

        <div style={{ maxWidth: "680px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{
            fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 600,
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)", marginBottom: "10px",
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <span style={{ width: "16px", height: "1px", background: "var(--signal)", display: "block" }} />
            {heroMetaLine || "Breakdown"}
          </div>

          <div style={{
            fontSize: "clamp(22px, 6vw, 32px)", fontWeight: 800,
            letterSpacing: "-0.035em", color: "#fff", lineHeight: 1.1, marginBottom: "20px",
          }}>
            {resolvedNames.away && resolvedNames.home ? (
              <>
                {resolvedNames.away}
                <span style={{ fontSize: "0.55em", fontWeight: 400, color: "rgba(255,255,255,0.4)", margin: "0 8px" }}>at</span>
                {resolvedNames.home}
              </>
            ) : (
              "Breakdown"
            )}
          </div>

          {/* Confidence block — shown once breakdown loads */}
          {status === "done" && breakdown && !gated && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 0, padding: "10px 16px",
            }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: confColor, display: "block", flexShrink: 0 }} />
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: confColor }}>
                  {confLabel}
                </div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
                  {CONF_SUBTITLES[breakdown.confidenceLabel] ?? "One of the cleaner reads tonight"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats bar — shown when game data available */}
      {game && odds && (
        <div className="f2" style={{ overflowX: "auto", background: "var(--surface)", borderBottom: "1px solid var(--border-med)", boxShadow: "var(--shadow-sm)" }}>
          <div className="bd-odds-grid" style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", minWidth: "440px",
          }}>
            {[
              { label: sport === "MLB" ? "Run Line" : "Spread", value: sport === "MLB" ? (runLine ?? "—") : spread, cls: "" },
              { label: "Total", value: total, cls: "" },
              { label: `${game.awayTeam.teamAbv} ML`, value: awayML, cls: "bd-away-ml" },
              { label: `${game.homeTeam.teamAbv} ML`, value: homeML, cls: "" },
            ].map((s, i) => (
              <div key={s.label} className={s.cls} style={{
                padding: "14px 16px", textAlign: "center",
                borderRight: i < 3 ? "1px solid var(--border)" : "none",
              }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "6px" }}>{s.label}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "15px", fontWeight: 600, color: "var(--ink)" }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content area */}
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "32px 20px 80px" }}>

        {/* Loading — brief while data is being fetched, before stream starts */}
        {status === "loading" && (
          <div style={{
            minHeight: "55vh", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "10px", textAlign: "center",
          }}>
            <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)" }}>Pulling live data</p>
            <p style={{ fontSize: "13px", color: "var(--muted)" }}>Odds, injuries, recent form…</p>
          </div>
        )}

        {/* Streaming — skeleton while Claude generates */}
        {status === "streaming" && (
          <div style={{ paddingTop: "8px" }}>
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }`}</style>
            <div style={{
              fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "var(--muted)", marginBottom: "20px",
              display: "flex", alignItems: "center", gap: "8px",
            }}>
              <span style={{
                display: "inline-block", width: "6px", height: "6px", borderRadius: "50%",
                background: "var(--signal)", flexShrink: 0,
                animation: "pulse 1.4s ease-in-out infinite",
              }} />
              Generating your breakdown
            </div>
            {[
              { label: "Game Shape",      contentHeight: 52, dark: false },
              { label: "Key Drivers",     contentHeight: 72, dark: false },
              { label: "Base Script",     contentHeight: 64, dark: false },
              { label: "Fragility Check", contentHeight: 56, dark: false },
              { label: "Market Read",     contentHeight: 52, dark: false },
              { label: "What This Means", contentHeight: 64, dark: true  },
            ].map(({ label, contentHeight, dark }) => (
              <div key={label} style={{
                marginBottom: "8px",
                background: dark ? "var(--ink)" : "var(--surface)",
                border: dark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(17,17,16,0.06)",
                overflow: "hidden",
                boxShadow: "var(--shadow-sm)",
              }}>
                <div style={{ height: "3px", background: dark ? "rgba(255,255,255,0.12)" : "var(--signal)" }} />
                <div style={{ padding: "16px 20px 0", display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{
                    fontFamily: "var(--mono)", fontSize: "12px", fontWeight: 600,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    color: dark ? "rgba(255,255,255,0.35)" : "var(--signal)",
                  }}>
                    {label}
                  </span>
                  <div style={{ flex: 1, height: "1px", background: dark ? "rgba(255,255,255,0.08)" : "var(--border)" }} />
                </div>
                <div style={{ padding: "12px 20px 20px" }}>
                  <div
                    style={{ height: `${contentHeight}px`, background: dark ? "rgba(255,255,255,0.06)" : "var(--cream)", borderRadius: 0 }}
                    className="animate-pulse"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div style={{
            background: "var(--surface)", border: "1px solid rgba(201,53,42,0.3)",
            borderRadius: 0, padding: "32px",
            boxShadow: "var(--shadow-sm)",
          }}>
            {gameStarted ? (
              <>
                <p style={{ fontSize: "17px", fontWeight: 600, color: "var(--ink)", marginBottom: "10px", textAlign: "center" }}>
                  This game is already underway.
                </p>
                <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.6, marginBottom: "24px", maxWidth: "400px", margin: "0 auto 24px", textAlign: "center" }}>
                  Breakdowns are generated before tip-off. Check back tomorrow for a fresh slate.
                </p>
                <div style={{ textAlign: "center" }}>
                  <Link href="/intel" style={{ fontSize: "12px", fontWeight: 700, color: "var(--signal)", textDecoration: "none" }}>
                    ← Back to slate
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <p style={{ fontSize: "17px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>Something went wrong</p>
                  <button
                    onClick={() => fetchBreakdown()}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, color: "var(--signal)", whiteSpace: "nowrap", padding: 0, marginLeft: "16px" }}
                  >
                    Regenerate →
                  </button>
                </div>
                <p style={{ fontSize: "13px", color: "var(--signal)", marginBottom: streamingText ? "16px" : "20px" }}>{error}</p>
                {streamingText && (
                  <pre style={{
                    fontFamily: "var(--mono)", fontSize: "11px", lineHeight: 1.6,
                    color: "var(--muted)", whiteSpace: "pre-wrap", wordBreak: "break-word",
                    background: "var(--warm-white)", border: "1px solid var(--border)",
                    padding: "12px", margin: "0 0 20px", maxHeight: "40vh", overflowY: "auto",
                  }}>
                    {streamingText}
                  </pre>
                )}
                <Link href="/intel" style={{ fontSize: "12px", fontWeight: 700, color: "var(--signal)", textDecoration: "none" }}>
                  ← Back to slate
                </Link>
              </>
            )}
          </div>
        )}

        {/* Done */}
        {status === "done" && breakdown && game && (
          <>
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

            <BreakdownView breakdown={breakdown} game={game} tier={tier ?? "free"} gated={gated ?? undefined} />

            {/* Breakdown Chat upsell — free users only, not gated */}
            {!gated && tier === "free" && (
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
            )}

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
