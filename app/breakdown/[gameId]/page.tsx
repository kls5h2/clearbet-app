"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import BreakdownView, { type GatedReason, isPitcherUnknown } from "@/components/BreakdownView";
import ShareCard from "@/components/ShareCard";
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

const SIGNAL_GRADE: Record<number, string> = { 1: "A", 2: "B+", 3: "C+", 4: "C" };
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
  const [shareOpen, setShareOpen] = useState(false);
  const [tier, setTier] = useState<Tier | null>(null);
  const [gated, setGated] = useState<GatedReason | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  const { message, visible } = useRotatingMessage(status === "loading");

  function fetchBreakdown(regenerate = false) {
    setStatus("loading");
    setBreakdown(null);
    setGame(null);
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

  const effectiveStatus: "scheduled" | "live" | "final" = (() => {
    if (!game) return "scheduled";
    if (game.gameStatus === "final") return "final";
    if (game.gameStatus === "live") return "live";
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
      if (past > 180) return "final";
      return "live";
    }
    if (game.gameDate && /^\d{8}$/.test(game.gameDate)) {
      const todayEt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()).replace(/-/g, "");
      if (game.gameDate < todayEt) return "final";
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
  const signalGrade = breakdown ? (SIGNAL_GRADE[breakdown.confidenceLevel] ?? "B") : "—";

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

          {/* Signal grade block — shown once breakdown loads */}
          {status === "done" && breakdown && !gated && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "12px",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 0, padding: "12px 16px",
            }}>
              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
                  Signal Grade
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "26px", fontWeight: 600, color: "var(--signal)", letterSpacing: "-0.02em" }}>
                  {signalGrade}
                </div>
              </div>
              <div style={{ width: "1px", height: "32px", background: "rgba(255,255,255,0.08)" }} />
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: confColor }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: confColor, display: "block" }} />
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

        {/* Loading */}
        {status === "loading" && (
          <div style={{
            minHeight: "55vh", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "10px", textAlign: "center",
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

            {/* Share — Pro only, not gated */}
            {!gated && tier === "pro" && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: "24px" }}>
                <button
                  onClick={() => setShareOpen(true)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontFamily: "var(--sans)", fontSize: "13px", fontWeight: 500,
                    letterSpacing: "0.04em", color: "var(--signal)",
                  }}
                >
                  Share this read →
                </button>
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

      {status === "done" && breakdown && game && (
        <ShareCard
          game={game}
          confidenceLabel={breakdown.confidenceLabel}
          shareHook={breakdown.shareHook ?? ""}
          open={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
    </>
  );
}
