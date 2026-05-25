"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import BreakdownView, { type GatedReason, isPitcherUnknown } from "@/components/BreakdownView";
import { createClient } from "@/lib/supabase/client";
import type { BreakdownResult, AnyGame, MLBGame, Sport, ConfidenceLabel } from "@/lib/types";
import type { Tier } from "@/lib/tier";
import { lookupTeam, parseGameId } from "@/lib/team-names";

// ─── Confidence display config ────────────────────────────────────────────────

const CONF: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  "CLEAR SPOT": { label: "Clear Spot", color: "#4DB87A", bgColor: "rgba(22,65,38,0.55)",  borderColor: "rgba(77,184,122,0.3)" },
  "LEAN":       { label: "Lean",       color: "#6B9FE8", bgColor: "rgba(15,50,120,0.5)",  borderColor: "rgba(107,159,232,0.3)" },
  "FRAGILE":    { label: "Fragile",    color: "#D4913A", bgColor: "rgba(130,75,10,0.5)",  borderColor: "rgba(212,145,58,0.3)" },
  "PASS":       { label: "Pass",       color: "#9B9790", bgColor: "rgba(70,70,65,0.4)",   borderColor: "rgba(155,151,144,0.25)" },
};

const CONF_SUBTITLES: Record<string, string> = {
  "CLEAR SPOT": "One of the cleaner reads tonight",
  "LEAN":       "Directional but not clean",
  "FRAGILE":    "Logic holds but conditional",
  "PASS":       "Too many moving parts",
};

// ─── Placeholder breakdown ────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatML(ml: number | null | undefined): string {
  if (ml == null) return "—";
  return ml > 0 ? `+${ml}` : `${ml}`;
}

function formatSpread(spread: number | null | undefined, abv: string): string {
  if (spread == null) return "—";
  return `${abv} ${spread > 0 ? "+" : ""}${spread}`;
}

function getTodayDateString(): string {
  const et = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  const [month, day, year] = et.split("/");
  return `${year}${month}${day}`;
}

function parseGameTimeMins(time: string): number {
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 9999;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (match[3].toUpperCase() === "PM" && h !== 12) h += 12;
  if (match[3].toUpperCase() === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

// ─── Loading messages ─────────────────────────────────────────────────────────

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

// ─── Sidebar game mini-card ───────────────────────────────────────────────────

function SidebarCard({
  game,
  bd,
  isActive,
  sport,
  onClick,
}: {
  game: AnyGame;
  bd: { confidenceLabel: ConfidenceLabel | null } | null;
  isActive: boolean;
  sport: Sport;
  onClick: () => void;
}) {
  const conf = bd?.confidenceLabel ?? null;
  const confInfo = conf ? CONF[conf] : null;
  const odds = game.odds as Record<string, number | null> | null;
  const isMLB = game.sport === "MLB";
  const spreadVal = isMLB
    ? formatSpread((odds?.runLine ?? null) as number | null, game.homeTeam.teamAbv)
    : formatSpread((odds?.spread ?? null) as number | null, game.homeTeam.teamAbv);
  const total = odds?.total != null ? `${odds.total}` : "—";

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", textAlign: "left",
        padding: "14px 16px",
        background: isActive ? "rgba(248,246,242,0.07)" : "transparent",
        borderBottom: "1px solid rgba(248,246,242,0.05)",
        borderLeft: isActive ? "2px solid var(--signal)" : "2px solid transparent",
        cursor: "pointer", outline: "none",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,246,242,0.04)"; }}
      onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
    >
      {/* Sport label + time */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <span style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(248,246,242,0.2)" }}>
          {game.sport}
        </span>
        <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "rgba(248,246,242,0.2)" }}>
          {game.gameTime}
        </span>
      </div>
      {/* Matchup */}
      <div style={{
        fontSize: "13px", fontWeight: 700, letterSpacing: "-0.02em",
        color: isActive ? "rgba(248,246,242,0.95)" : "rgba(248,246,242,0.65)",
        marginBottom: "8px", lineHeight: 1.2,
      }}>
        {game.awayTeam.teamAbv}
        <span style={{ fontSize: "11px", fontWeight: 400, color: "rgba(248,246,242,0.2)", margin: "0 5px" }}>at</span>
        {game.homeTeam.teamAbv}
      </div>
      {/* Badge + mini stats */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        {confInfo ? (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "4px",
            padding: "2px 8px", borderRadius: "20px",
            background: confInfo.bgColor,
            fontSize: "9px", fontWeight: 600, letterSpacing: "0.04em",
            textTransform: "uppercase", color: confInfo.color, whiteSpace: "nowrap",
          }}>
            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: confInfo.color, flexShrink: 0 }} />
            {confInfo.label}
          </span>
        ) : <span />}
        <div style={{ display: "flex", gap: "10px" }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "rgba(248,246,242,0.35)" }}>{spreadVal}</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "rgba(248,246,242,0.25)" }}>{total}</span>
        </div>
      </div>
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Status = "idle" | "loading" | "done" | "error";

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

  // Sidebar state
  const [sidebarGames, setSidebarGames] = useState<AnyGame[]>([]);
  const [sidebarBreakdowns, setSidebarBreakdowns] = useState<Map<string, { confidenceLabel: ConfidenceLabel | null }>>(new Map());

  const { message, visible } = useRotatingMessage(status === "loading");

  // Load sidebar games
  useEffect(() => {
    fetch(`/api/games?sport=${sport.toLowerCase()}`)
      .then((r) => r.ok ? r.json() : { games: [] })
      .catch(() => ({ games: [] }))
      .then((data: { games?: AnyGame[] }) => {
        const sorted = [...(data.games ?? [])].sort((a, b) => parseGameTimeMins(a.gameTime) - parseGameTimeMins(b.gameTime));
        setSidebarGames(sorted);
      });
  }, [sport]);

  // Load sidebar breakdowns
  useEffect(() => {
    const client = createClient();
    const todayStr = getTodayDateString();
    client
      .from("breakdowns")
      .select("game_id, confidence_label")
      .eq("game_date", todayStr)
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        const map = new Map<string, { confidenceLabel: ConfidenceLabel | null }>();
        const seen = new Set<string>();
        for (const row of (data ?? [])) {
          if (seen.has(row.game_id)) continue;
          seen.add(row.game_id);
          map.set(row.game_id, { confidenceLabel: (row.confidence_label as ConfidenceLabel) ?? null });
        }
        setSidebarBreakdowns(map);
      });
  }, []);

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

  const abbrevNames = (() => {
    if (game) return { away: game.awayTeam.teamAbv, home: game.homeTeam.teamAbv };
    const parsed = parseGameId(gameId);
    return { away: parsed?.awayAbv ?? "", home: parsed?.homeAbv ?? "" };
  })();

  const effectiveStatus: "scheduled" | "live" | "final" | "postponed" = (() => {
    if (!game) return "scheduled";
    if (game.gameStatus === "final") return "final";
    if (game.gameStatus === "postponed") return "postponed";
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
      return "live";
    }
    if (game.gameDate && /^\d{8}$/.test(game.gameDate)) {
      const todayEt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()).replace(/-/g, "");
      if (game.gameDate < todayEt) return "live";
      if (game.gameDate > todayEt) return "scheduled";
      return "live";
    }
    return "live";
  })();

  const canRegenerate = effectiveStatus === "scheduled";

  const formatGameDate = (yyyymmdd: string): string | null => {
    if (!/^\d{8}$/.test(yyyymmdd)) return null;
    const d = new Date(parseInt(yyyymmdd.slice(0, 4)), parseInt(yyyymmdd.slice(4, 6)) - 1, parseInt(yyyymmdd.slice(6, 8)));
    return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  const formattedDate = game?.gameDate ? formatGameDate(game.gameDate) : null;

  const odds = game?.odds;
  const spread = odds && "spread" in odds ? formatSpread(odds.spread as number | null, game?.homeTeam.teamAbv ?? "") : "—";
  const runLine = odds && "runLine" in odds ? formatSpread(odds.runLine as number | null, game?.homeTeam.teamAbv ?? "") : null;
  const total = odds?.total != null ? `${odds.total}` : "—";
  const awayML = odds ? formatML(odds.awayMoneyline as number | null) : "—";
  const homeML = odds ? formatML(odds.homeMoneyline as number | null) : "—";

  const confLabel = breakdown ? breakdown.confidenceLabel : null;
  const confInfo = confLabel ? CONF[confLabel] : null;

  const NAV_HEIGHT = 56;

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .bd-sidebar { display: none !important; }
          .bd-right { border-left: none !important; }
        }
      `}</style>
      <div style={{ background: "var(--ink)", minHeight: "100vh" }}>
        <Nav backHref={`/intel?sport=${sport}`} backLabel="Today's Intel" />

        <div style={{
          display: "flex",
          height: `calc(100vh - ${NAV_HEIGHT}px)`,
          marginTop: `${NAV_HEIGHT}px`,
          overflow: "hidden",
        }}>
          {/* Left sidebar */}
          <div
            className="bd-sidebar"
            style={{
              width: "300px",
              flexShrink: 0,
              background: "#161514",
              borderRight: "1px solid rgba(248,246,242,0.06)",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Sidebar header */}
            <div style={{
              padding: "16px 16px 12px",
              borderBottom: "1px solid rgba(248,246,242,0.06)",
              position: "sticky", top: 0, background: "#161514", zIndex: 1,
            }}>
              <div style={{
                fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase",
                fontWeight: 600, color: "rgba(248,246,242,0.25)",
              }}>
                Tonight&apos;s Slate · {sport}
              </div>
            </div>

            {/* Game list */}
            <div style={{ flex: 1 }}>
              {sidebarGames.length === 0 ? (
                <div style={{ padding: "20px 16px" }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ padding: "12px 0", borderBottom: "1px solid rgba(248,246,242,0.05)" }}>
                      <div style={{ height: "9px", width: "30%", background: "rgba(248,246,242,0.07)", marginBottom: "7px" }} className="animate-pulse" />
                      <div style={{ height: "13px", width: "70%", background: "rgba(248,246,242,0.07)" }} className="animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                sidebarGames.map((g) => (
                  <SidebarCard
                    key={g.gameId}
                    game={g}
                    bd={sidebarBreakdowns.get(g.gameId) ?? null}
                    isActive={g.gameId === gameId}
                    sport={sport}
                    onClick={() => router.push(`/breakdown/${encodeURIComponent(g.gameId)}?sport=${sport}`)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right: breakdown content */}
          <div
            className="bd-right"
            style={{
              flex: 1,
              overflowY: "auto",
              borderLeft: "1px solid rgba(248,246,242,0.06)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Breakdown header */}
            <div style={{
              padding: "24px 24px 20px",
              borderBottom: "1px solid rgba(248,246,242,0.06)",
              background: "#161514",
            }}>
              {/* Eyebrow */}
              <div style={{
                fontFamily: "var(--mono)", fontSize: "9px", fontWeight: 600,
                letterSpacing: "0.14em", textTransform: "uppercase",
                color: "rgba(248,246,242,0.3)", marginBottom: "10px",
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                RawIntel
                <span style={{ width: "1px", height: "10px", background: "rgba(248,246,242,0.12)", display: "inline-block" }} />
                Full Breakdown
              </div>

              {/* Matchup */}
              <div style={{
                fontSize: "clamp(24px, 4vw, 42px)", fontWeight: 800,
                letterSpacing: "-0.04em", color: "#fff", lineHeight: 1.1, marginBottom: "8px",
              }}>
                {abbrevNames.away && abbrevNames.home ? (
                  <>
                    {abbrevNames.away}
                    <span style={{ fontSize: "0.55em", fontWeight: 400, color: "rgba(255,255,255,0.25)", margin: "0 10px" }}>at</span>
                    {abbrevNames.home}
                  </>
                ) : resolvedNames.away && resolvedNames.home ? (
                  <>
                    {resolvedNames.away}
                    <span style={{ fontSize: "0.65em", fontWeight: 400, color: "rgba(255,255,255,0.25)", margin: "0 10px" }}>at</span>
                    {resolvedNames.home}
                  </>
                ) : (
                  "Breakdown"
                )}
              </div>

              {/* Time / venue */}
              {(game?.gameTime || formattedDate) && (
                <div style={{
                  fontFamily: "var(--mono)", fontSize: "11px",
                  color: "rgba(248,246,242,0.3)", marginBottom: "14px",
                }}>
                  {[game?.gameTime, formattedDate].filter(Boolean).join(" · ")}
                </div>
              )}

              {/* Signal Grade */}
              {status === "done" && confInfo && confLabel && (
                <div>
                  <div style={{
                    fontFamily: "var(--mono)", fontSize: "9px", fontWeight: 600,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    color: "rgba(248,246,242,0.28)", marginBottom: "8px",
                  }}>
                    Signal Grade
                  </div>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "7px",
                    padding: "6px 14px", borderRadius: "20px",
                    border: `1px solid ${confInfo.borderColor}`,
                    background: confInfo.bgColor,
                  }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: confInfo.color, flexShrink: 0 }} />
                    <span style={{ fontSize: "12px", fontWeight: 700, color: confInfo.color, letterSpacing: "0.02em" }}>
                      {confInfo.label}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Stats bar */}
            {game && odds && (
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                borderBottom: "1px solid rgba(248,246,242,0.06)",
                background: "#131211",
              }}>
                <div style={{ padding: "14px 20px", textAlign: "center", borderRight: "1px solid rgba(248,246,242,0.06)" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(248,246,242,0.3)", marginBottom: "8px" }}>
                    {sport === "MLB" ? "Run Line" : "Spread"}
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "22px", fontWeight: 800, color: "rgba(248,246,242,0.9)", lineHeight: 1 }}>
                    {sport === "MLB" ? (runLine ?? "—") : spread}
                  </div>
                </div>
                <div style={{ padding: "14px 20px", textAlign: "center", borderRight: "1px solid rgba(248,246,242,0.06)" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(248,246,242,0.3)", marginBottom: "8px" }}>Total</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "22px", fontWeight: 800, color: "rgba(248,246,242,0.9)", lineHeight: 1 }}>{total}</div>
                </div>
                <div style={{ padding: "14px 20px", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(248,246,242,0.3)", marginBottom: "8px" }}>ML</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: "14px" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "9px", color: "rgba(248,246,242,0.3)", marginBottom: "2px" }}>{game.awayTeam.teamAbv}</div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "16px", fontWeight: 800, color: "rgba(248,246,242,0.9)" }}>{awayML}</div>
                    </div>
                    <div style={{ width: "1px", background: "rgba(248,246,242,0.06)", alignSelf: "stretch" }} />
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "9px", color: "rgba(248,246,242,0.3)", marginBottom: "2px" }}>{game.homeTeam.teamAbv}</div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "16px", fontWeight: 800, color: "rgba(248,246,242,0.9)" }}>{homeML}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Info banners */}
            {status === "done" && breakdown && !gated && (fromCache || generatedAt) && (
              <div style={{
                padding: "10px 24px",
                borderBottom: "1px solid rgba(248,246,242,0.05)",
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px",
                background: "rgba(201,53,42,0.04)",
              }}>
                <span style={{ fontSize: "12px", color: "rgba(248,246,242,0.4)" }}>
                  {generatedAt
                    ? `Generated ${new Date(generatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short" })}`
                    : "Generated using live pre-game data."}
                </span>
                {canRegenerate && tier === "pro" && (
                  <button onClick={() => fetchBreakdown(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: 700, color: "var(--signal)", whiteSpace: "nowrap", padding: 0 }}>
                    Regenerate →
                  </button>
                )}
              </div>
            )}

            {/* MLB pitcher warning */}
            {status === "done" && game?.sport === "MLB" && effectiveStatus !== "final" && (() => {
              const mlb = game as MLBGame;
              const homeUnknown = !mlb.homePitcher || mlb.homePitcher.confirmed !== true || isPitcherUnknown(mlb.homePitcher.name);
              const awayUnknown = !mlb.awayPitcher || mlb.awayPitcher.confirmed !== true || isPitcherUnknown(mlb.awayPitcher.name);
              return (homeUnknown || awayUnknown) ? (
                <div style={{
                  padding: "10px 24px", fontSize: "12px", color: "rgba(248,246,242,0.55)",
                  lineHeight: 1.5, borderBottom: "1px solid rgba(248,246,242,0.05)",
                  background: "rgba(217,163,58,0.06)",
                }}>
                  🟡 Starting pitcher(s) not yet confirmed. Breakdown reflects available data — check closer to game time.
                </div>
              ) : null;
            })()}

            {/* Loading */}
            {status === "loading" && (
              <div style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: "10px", textAlign: "center",
                padding: "40px 24px", minHeight: "300px",
              }}>
                <p style={{ fontSize: "15px", fontWeight: 600, color: "rgba(248,246,242,0.7)" }}>Building your breakdown</p>
                <p style={{
                  fontSize: "12px", color: "rgba(248,246,242,0.35)",
                  transition: "opacity 0.4s ease", opacity: visible ? 1 : 0, minHeight: "1.4rem",
                }}>
                  {message}
                </p>
              </div>
            )}

            {/* Error */}
            {status === "error" && (
              <div style={{ padding: "32px 24px" }}>
                <div style={{
                  background: "#1a1918", border: "1px solid rgba(201,53,42,0.3)",
                  borderRadius: "8px", padding: "28px", textAlign: "center",
                }}>
                  {gameStarted ? (
                    <>
                      <p style={{ fontSize: "15px", fontWeight: 600, color: "rgba(248,246,242,0.75)", marginBottom: "8px" }}>
                        This game is already underway.
                      </p>
                      <p style={{ fontSize: "13px", color: "rgba(248,246,242,0.4)", lineHeight: 1.6, marginBottom: "20px", maxWidth: "360px", margin: "0 auto 20px" }}>
                        Breakdowns are generated before tip-off. Check back tomorrow for a fresh slate.
                      </p>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: "15px", fontWeight: 600, color: "rgba(248,246,242,0.75)", marginBottom: "8px" }}>Something went wrong</p>
                      <p style={{ fontSize: "12px", color: "var(--signal)", marginBottom: "20px" }}>{error}</p>
                    </>
                  )}
                  <Link href={`/intel?sport=${sport}`} style={{ fontSize: "12px", fontWeight: 700, color: "var(--signal)", textDecoration: "none" }}>
                    ← Back to slate
                  </Link>
                </div>
              </div>
            )}

            {/* Done */}
            {status === "done" && breakdown && game && (
              <>
                <BreakdownView breakdown={breakdown} game={game} tier={tier ?? "free"} gated={gated ?? undefined} />

                {/* Breakdown Chat upsell */}
                {!gated && tier === "free" && (
                  <div style={{ padding: "0 24px 60px" }}>
                    <div style={{
                      marginTop: "24px",
                      border: "1px solid rgba(248,246,242,0.08)",
                      borderRadius: "8px",
                      overflow: "hidden",
                    }}>
                      <div style={{ background: "#1a1918", padding: "14px 20px" }}>
                        <div style={{ fontFamily: "var(--mono)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 5 }}>
                          Breakdown Chat
                        </div>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
                          Have a follow-up? Ask the data.
                        </div>
                      </div>
                      <div style={{ background: "#131211", padding: "18px 20px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                          {[
                            "What does this mean for the total?",
                            "How does the injury change this read?",
                            "What's the strongest case against this lean?",
                          ].map((q) => (
                            <div key={q} style={{
                              fontSize: "12px", color: "rgba(248,246,242,0.35)",
                              padding: "9px 12px",
                              border: "1px solid rgba(248,246,242,0.07)",
                              fontStyle: "italic", lineHeight: 1.4,
                            }}>
                              {q}
                            </div>
                          ))}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "11px", color: "rgba(248,246,242,0.3)", fontFamily: "var(--mono)" }}>Pro only.</span>
                          <Link href="/pricing" style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--signal)", textDecoration: "none" }}>
                            Upgrade → $9.99/mo
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {(gated || tier !== "free") && <div style={{ paddingBottom: "60px" }} />}
              </>
            )}

            <footer style={{ textAlign: "center", padding: "16px 20px", fontSize: "11px", color: "rgba(248,246,242,0.18)", lineHeight: 1.7, borderTop: "1px solid rgba(248,246,242,0.05)", marginTop: "auto" }}>
              For informational purposes only. RawIntel does not provide financial, betting, or investment advice. Bet responsibly.{" "}
              <a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(248,246,242,0.28)", textDecoration: "underline" }}>ncpgambling.org</a>
              {" · "}<Link href="/terms" style={{ color: "rgba(248,246,242,0.28)", textDecoration: "underline" }}>Terms</Link>
              {" · "}<Link href="/privacy" style={{ color: "rgba(248,246,242,0.28)", textDecoration: "underline" }}>Privacy</Link>
            </footer>
          </div>
        </div>
      </div>
    </>
  );
}
