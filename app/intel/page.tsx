"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";
import { isPro } from "@/lib/tier";
import { getStartOfDayET } from "@/lib/usage-window";
import type { AnyGame, ConfidenceLabel, ConfidenceLevel, Sport } from "@/lib/types";
import type { Tier } from "@/lib/tier";

// ─── Confidence config (dark-background palette) ──────────────────────────────

const CONF: Record<string, { label: string; color: string; bgColor: string }> = {
  "CLEAR SPOT": { label: "Clear Spot", color: "#4DB87A", bgColor: "rgba(26,122,72,0.2)"  },
  "LEAN":       { label: "Lean",       color: "#6B9FE8", bgColor: "rgba(24,82,168,0.2)"  },
  "FRAGILE":    { label: "Fragile",    color: "#D4913A", bgColor: "rgba(181,106,18,0.2)" },
  "PASS":       { label: "Pass",       color: "#9B9790", bgColor: "rgba(110,107,102,0.2)" },
};

const CONF_RANK: Record<string, number> = { "CLEAR SPOT": 1, "LEAN": 2, "FRAGILE": 3, "PASS": 4 };
const ELIGIBLE_CONF = new Set(["CLEAR SPOT", "LEAN"]);

// ─── Types ────────────────────────────────────────────────────────────────────

interface SlateBreakdown {
  gameId: string;
  isOwn: boolean;
  cardSummary: string | null;
  confidenceLabel: ConfidenceLabel | null;
  confidenceLevel: ConfidenceLevel | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayDateString(): string {
  const et = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  const [month, day, year] = et.split("/");
  return `${year}${month}${day}`;
}

function parseGameTime(time: string): number {
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 9999;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (match[3].toUpperCase() === "PM" && h !== 12) h += 12;
  if (match[3].toUpperCase() === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function isStarted(game: AnyGame): boolean {
  if (game.gameStatus === "live" || game.gameStatus === "final") return true;
  const today = getTodayDateString();
  if (game.gameDate < today) return true;
  if (game.gameDate > today) return false;
  const m = (game.gameTime ?? "").match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return false;
  let gh = parseInt(m[1], 10);
  const gm = parseInt(m[2], 10);
  if (m[3].toUpperCase() === "PM" && gh !== 12) gh += 12;
  if (m[3].toUpperCase() === "AM" && gh === 12) gh = 0;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const ch = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const cm = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  return ch * 60 + cm >= gh * 60 + gm;
}

function isFinalByTime(game: AnyGame): boolean {
  if (game.gameStatus === "final") return true;
  if (game.gameStatus === "postponed") return false;
  const today = getTodayDateString();
  if (game.gameDate > today) return false;
  if (game.gameDate < today) return false;
  const m = (game.gameTime ?? "").match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return false;
  let gh = parseInt(m[1], 10);
  const gm = parseInt(m[2], 10);
  if (m[3].toUpperCase() === "PM" && gh !== 12) gh += 12;
  if (m[3].toUpperCase() === "AM" && gh === 12) gh = 0;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const ch = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const cm = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  return ch * 60 + cm >= gh * 60 + gm + 180;
}

function formatML(ml: number | null | undefined): string {
  if (ml == null) return "—";
  return ml > 0 ? `+${ml}` : `${ml}`;
}

function formatSpread(spread: number | null | undefined, abv: string): string {
  if (spread == null) return "—";
  return `${abv} ${spread > 0 ? "+" : ""}${spread}`;
}

function getCtaLabel(
  bd: SlateBreakdown | null,
  proUser: boolean,
  authReady: boolean,
  userId: string | null | undefined,
  dailyUsed: boolean,
): string | null {
  if (!authReady) return null;
  if (!userId) return "Sign up to read →";
  if (proUser) return bd ? "Read breakdown →" : "Build breakdown →";
  if (bd && bd.isOwn) return "Read breakdown →";
  if (!bd && !dailyUsed) return "Build breakdown →";
  return "Upgrade to read →";
}

// ─── ConfBadge ────────────────────────────────────────────────────────────────

function ConfBadge({ label }: { label: ConfidenceLabel | null }) {
  if (!label) return null;
  const c = CONF[label] ?? CONF["LEAN"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 8px", background: c.bgColor,
      fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em",
      textTransform: "uppercase", color: c.color, whiteSpace: "nowrap",
    }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: c.color, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

// ─── GameRow ──────────────────────────────────────────────────────────────────

function GameRow({
  game, bd, featured, onRead, authReady, userId, proUser, dailyUsed, started,
}: {
  game: AnyGame; bd: SlateBreakdown | null; featured: boolean; onRead: () => void;
  authReady: boolean; userId: string | null | undefined; proUser: boolean;
  dailyUsed: boolean; started: boolean;
}) {
  const cta = getCtaLabel(bd, proUser, authReady, userId, dailyUsed);
  const isLocked = cta === "Upgrade to read →" || cta === "Sign up to read →";
  const conf = bd?.confidenceLabel ?? null;

  const odds = game.odds as Record<string, number | null> | null;
  const isMLB = game.sport === "MLB";
  const spreadVal = isMLB
    ? formatSpread((odds?.runLine ?? null) as number | null, game.homeTeam.teamAbv)
    : formatSpread((odds?.spread ?? null) as number | null, game.homeTeam.teamAbv);
  const spreadLabel = isMLB ? "Run Line" : "Spread";
  const total = odds?.total != null ? `${odds.total}` : "—";
  const awayML = formatML((odds?.awayMoneyline ?? null) as number | null);

  const teamSize = featured ? "26px" : "20px";
  const rowPy = featured ? "28px" : "20px";

  return (
    <div
      role={started ? undefined : "button"}
      tabIndex={started ? undefined : 0}
      onClick={started ? undefined : onRead}
      onKeyDown={started ? undefined : (e) => e.key === "Enter" && onRead()}
      style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        gap: "24px", padding: `${rowPy} 0`,
        borderBottom: "1px solid rgba(248,246,242,0.05)",
        cursor: started ? "default" : "pointer", outline: "none",
      }}
    >
      {/* Left */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase",
          color: "rgba(248,246,242,0.2)", marginBottom: "6px",
        }}>
          {game.sport}
        </div>
        <div style={{
          fontSize: teamSize, fontWeight: 700, letterSpacing: "-0.03em",
          color: isLocked ? "rgba(248,246,242,0.25)" : "rgba(248,246,242,0.95)",
          lineHeight: 1.1, marginBottom: "12px",
        }}>
          {game.awayTeam.teamName}
          <span style={{ fontSize: "13px", fontWeight: 400, color: "rgba(248,246,242,0.3)", margin: "0 8px" }}>at</span>
          {game.homeTeam.teamName}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {conf && <ConfBadge label={conf} />}
          {started ? (
            <span style={{ fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(248,246,242,0.35)" }}>
              {isFinalByTime(game) ? "Final" : "In progress"}
            </span>
          ) : cta === null ? (
            <span style={{ width: "80px", height: "14px", background: "rgba(248,246,242,0.08)", display: "inline-block" }} className="animate-pulse" />
          ) : (
            <span style={{ fontSize: "13px", fontWeight: 600, color: isLocked ? "rgba(248,246,242,0.15)" : "var(--signal)" }}>
              {isLocked ? "Unlock breakdown →" : (bd ? "Read breakdown →" : "Build breakdown →")}
            </span>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="row-right" style={{ display: "flex", alignItems: "flex-start", gap: "20px", flexShrink: 0, opacity: isLocked ? 0.15 : 1 }}>
        <div style={{ textAlign: "right", paddingTop: "1px" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "rgba(248,246,242,0.25)", whiteSpace: "nowrap" }}>
            {game.gameTime}
          </div>
        </div>
        <div className="row-stats" style={{ display: "flex", gap: "20px" }}>
          {[
            { label: spreadLabel, value: spreadVal },
            { label: "Total",     value: total },
            { label: "ML",        value: awayML },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "right", minWidth: "44px" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "16px", fontWeight: 700, color: "rgba(248,246,242,0.9)", lineHeight: 1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(248,246,242,0.3)", marginTop: "4px" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── TomorrowRow ──────────────────────────────────────────────────────────────

function TomorrowRow({ game }: { game: AnyGame }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 0", borderBottom: "1px solid rgba(248,246,242,0.04)",
    }}>
      <div style={{ fontSize: "13px", fontWeight: 500, color: "rgba(248,246,242,0.2)", letterSpacing: "-0.01em" }}>
        {game.awayTeam.teamName}
        <span style={{ fontSize: "11px", fontWeight: 400, color: "rgba(248,246,242,0.1)", margin: "0 6px" }}>at</span>
        {game.homeTeam.teamName}
      </div>
      <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "rgba(248,246,242,0.12)", whiteSpace: "nowrap" }}>
        {game.gameTime}
      </div>
    </div>
  );
}

// ─── Skeleton states ──────────────────────────────────────────────────────────

function SkeletonRow({ featured }: { featured?: boolean }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "24px",
      padding: featured ? "28px 0" : "20px 0",
      borderBottom: "1px solid rgba(248,246,242,0.05)",
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ height: "10px", width: "28px", background: "rgba(248,246,242,0.07)", marginBottom: "8px" }} className="animate-pulse" />
        <div style={{ height: featured ? "28px" : "20px", width: "58%", background: "rgba(248,246,242,0.07)", marginBottom: "12px" }} className="animate-pulse" />
        <div style={{ height: "14px", width: "90px", background: "rgba(248,246,242,0.07)" }} className="animate-pulse" />
      </div>
      <div style={{ display: "flex", gap: "20px", flexShrink: 0 }}>
        {[56, 48, 48, 48].map((w, i) => (
          <div key={i} style={{ width: `${w}px` }}>
            <div style={{ height: "16px", background: "rgba(248,246,242,0.07)", marginBottom: "4px" }} className="animate-pulse" />
            <div style={{ height: "9px", width: "60%", background: "rgba(248,246,242,0.05)" }} className="animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function PageFooter() {
  return (
    <footer style={{ textAlign: "center", padding: "24px 40px", fontSize: "12px", color: "rgba(248,246,242,0.22)", lineHeight: 1.8 }}>
      For informational purposes only. RawIntel does not provide financial, betting, or investment advice. Bet responsibly.{" "}
      <a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(248,246,242,0.32)", textDecoration: "underline", textUnderlineOffset: "2px" }}>ncpgambling.org</a>
      {" · "}<Link href="/terms" style={{ color: "rgba(248,246,242,0.32)", textDecoration: "underline", textUnderlineOffset: "2px" }}>Terms of Service</Link>
      {" · "}<Link href="/privacy" style={{ color: "rgba(248,246,242,0.32)", textDecoration: "underline", textUnderlineOffset: "2px" }}>Privacy Policy</Link>
      {" · "}© RawIntel LLC
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSport: Sport = searchParams.get("sport")?.toUpperCase() === "MLB" ? "MLB" : "NBA";
  const accountDeleted = searchParams.get("deleted") === "1";

  const [activeSport, setActiveSport] = useState<Sport>(initialSport);
  const [games, setGames] = useState<AnyGame[]>([]);
  const [tomorrowGames, setTomorrowGames] = useState<AnyGame[]>([]);
  const [breakdowns, setBreakdowns] = useState<Map<string, SlateBreakdown>>(new Map());
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [tier, setTier] = useState<Tier | null>(null);
  const [dailyUsed, setDailyUsed] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<"cap" | "bd-locked" | null>(null);
  const [breakdownsReady, setBreakdownsReady] = useState(false);

  useEffect(() => {
    const client = createClient();
    async function loadTier(uid: string) {
      try {
        const { data } = await client.from("profiles").select("tier").eq("id", uid).maybeSingle();
        const resolvedTier = (data?.tier as Tier) ?? "free";
        setTier(resolvedTier);
        if (resolvedTier === "free") {
          const windowStart = getStartOfDayET();
          const { data: usageRows } = await client
            .from("breakdown_usage")
            .select("id")
            .eq("user_id", uid)
            .gte("created_at", windowStart)
            .limit(1);
          setDailyUsed((usageRows?.length ?? 0) > 0);
        } else {
          setDailyUsed(false);
        }
      } finally {
        setAuthReady(true);
      }
    }
    client.auth.getUser().then(({ data }) => {
      if (data.user) { setUserId(data.user.id); loadTier(data.user.id); }
      else { setUserId(null); setTier(null); setAuthReady(true); }
    });
    const { data: sub } = client.auth.onAuthStateChange((_e, session) => {
      if (session?.user) { setUserId(session.user.id); loadTier(session.user.id); }
      else { setUserId(null); setTier(null); setAuthReady(true); }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const client = createClient();
    const todayStr = getTodayDateString();
    client
      .from("breakdowns")
      .select("game_id, user_id, card_summary, confidence_label, confidence_level, created_at")
      .eq("game_date", todayStr)
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data }) => {
        setUserId((currentUserId) => {
          const map = new Map<string, SlateBreakdown>();
          const seen = new Set<string>();
          for (const row of (data ?? [])) {
            if (seen.has(row.game_id)) continue;
            seen.add(row.game_id);
            map.set(row.game_id, {
              gameId: row.game_id,
              isOwn: row.user_id != null && row.user_id === currentUserId,
              cardSummary: row.card_summary ?? null,
              confidenceLabel: (row.confidence_label as ConfidenceLabel) ?? null,
              confidenceLevel: (row.confidence_level as ConfidenceLevel) ?? null,
            });
          }
          setBreakdowns(map);
          return currentUserId;
        });
        setBreakdownsReady(true);
      }, () => { setBreakdownsReady(true); });
  }, []);

  useEffect(() => {
    const todayStr = getTodayDateString();
    const cacheKey = `ri_slate_${activeSport}_${todayStr}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        setGames(parsed.games ?? []);
        setTomorrowGames(parsed.tomorrow ?? []);
        setLoading(false);
        return;
      }
    } catch {}
    setLoading(true);
    setError(null);
    const sport = activeSport.toLowerCase();
    Promise.all([
      fetch(`/api/games?sport=${sport}`).then((r) => r.ok ? r.json() : Promise.reject(new Error("Failed to load slate"))),
      fetch(`/api/games?sport=${sport}&date=tomorrow`).then((r) => r.ok ? r.json() : { games: [] }).catch(() => ({ games: [] })),
    ])
      .then(([today, tomorrow]) => {
        const tg = today.games ?? [];
        const tmg = tomorrow.games ?? [];
        setGames(tg);
        setTomorrowGames(tmg);
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ games: tg, tomorrow: tmg })); } catch {}
        setLoading(false);
      })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [activeSport]);

  const sorted = [...games].sort((a, b) => parseGameTime(a.gameTime) - parseGameTime(b.gameTime));
  const tomorrowSorted = [...tomorrowGames].sort((a, b) => parseGameTime(a.gameTime) - parseGameTime(b.gameTime));

  const headliner = (() => {
    if (sorted.length === 0 || !breakdownsReady) return null;
    const headlinerKey = `ri_headliner_${activeSport}_${getTodayDateString()}`;
    try {
      const lockedId = sessionStorage.getItem(headlinerKey);
      if (lockedId) {
        const locked = sorted.find((g) => g.gameId === lockedId);
        if (locked) {
          const lockedLabel = breakdowns.get(locked.gameId)?.confidenceLabel;
          if (lockedLabel && ELIGIBLE_CONF.has(lockedLabel)) return locked;
          try { sessionStorage.removeItem(headlinerKey); } catch {}
        }
      }
    } catch {}
    const eligible = sorted
      .filter((g) => {
        const label = breakdowns.get(g.gameId)?.confidenceLabel;
        return label != null && ELIGIBLE_CONF.has(label);
      })
      .sort((a, b) => {
        const ra = CONF_RANK[breakdowns.get(a.gameId)?.confidenceLabel ?? ""] ?? 5;
        const rb = CONF_RANK[breakdowns.get(b.gameId)?.confidenceLabel ?? ""] ?? 5;
        return ra !== rb ? ra - rb : parseGameTime(a.gameTime) - parseGameTime(b.gameTime);
      });
    if (eligible.length > 0) {
      try { sessionStorage.setItem(headlinerKey, eligible[0].gameId); } catch {}
      return eligible[0];
    }
    return null;
  })();

  const allMurky = !loading && breakdownsReady && sorted.length > 0 && headliner === null && (() => {
    const gamesWithBd = sorted.filter((g) => breakdowns.has(g.gameId));
    return gamesWithBd.length > 0 && gamesWithBd.every((g) => {
      const label = breakdowns.get(g.gameId)?.confidenceLabel;
      return label != null && !ELIGIBLE_CONF.has(label);
    });
  })();

  const listGames = headliner ? sorted.filter((g) => g.gameId !== headliner.gameId) : sorted;
  const proUser = isPro(tier);

  const todayLabel = new Date().toLocaleDateString("en-US", {
    timeZone: "America/New_York", weekday: "long", month: "long", day: "numeric",
  });

  function handleRead(gameId: string) {
    if (!authReady) return;
    if (!userId) { router.push("/login?mode=signup"); return; }
    const bd = breakdowns.get(gameId) ?? null;
    if (proUser) {
      router.push(`/breakdown/${encodeURIComponent(gameId)}?sport=${activeSport}`);
      return;
    }
    if (bd?.isOwn || (!bd && !dailyUsed)) {
      router.push(`/breakdown/${encodeURIComponent(gameId)}?sport=${activeSport}`);
      return;
    }
    setModal(bd ? "bd-locked" : "cap");
  }

  const headlinerSummary = headliner ? (breakdowns.get(headliner.gameId)?.cardSummary ?? null) : null;
  const tonightsReadText: string | null = allMurky
    ? "Tonight's slate is murky. Every game has meaningful uncertainty — read the fragility checks before deciding anything."
    : headlinerSummary;
  const showTonightsRead = !loading && !!tonightsReadText;

  const PAD = "clamp(16px,4vw,40px)";
  const MAX_W = "880px";

  return (
    <>
      <style>{`
        @media (max-width: 600px) {
          .row-stats { display: none !important; }
        }
        @media (max-width: 480px) {
          .row-right { gap: 12px !important; }
        }
      `}</style>
      <div style={{ background: "var(--ink)", minHeight: "100vh" }}>
        <Nav activePage="today" />

        {accountDeleted && (
          <div style={{
            background: "rgba(201,53,42,0.12)", borderBottom: "1px solid rgba(201,53,42,0.2)",
            textAlign: "center", padding: "12px 24px",
            fontSize: "13.5px", fontWeight: 500, color: "rgba(248,246,242,0.8)",
          }}>
            Account deleted. Sorry to see you go.
          </div>
        )}

        {/* Hero zone */}
        <div style={{ maxWidth: MAX_W, margin: "0 auto", padding: `clamp(36px,5vw,52px) ${PAD} 0` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
            <div style={{ fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(248,246,242,0.3)", fontWeight: 500 }}>
              {todayLabel} · {activeSport}
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              {(["NBA", "MLB"] as Sport[]).map((sport) => (
                <button
                  key={sport}
                  onClick={() => setActiveSport(sport)}
                  style={{
                    fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
                    padding: "6px 16px", cursor: "pointer", transition: "all 0.12s",
                    border: `1px solid ${activeSport === sport ? "var(--signal)" : "rgba(248,246,242,0.15)"}`,
                    background: activeSport === sport ? "var(--signal)" : "transparent",
                    color: activeSport === sport ? "#fff" : "rgba(248,246,242,0.4)",
                  }}
                >
                  {sport}
                </button>
              ))}
            </div>
          </div>

          <div style={{
            fontSize: "clamp(28px,5vw,40px)", fontWeight: 800, letterSpacing: "-0.04em",
            color: "#fff", lineHeight: 1.05, marginBottom: "12px",
          }}>
            {loading
              ? "Loading tonight's slate."
              : games.length === 0
              ? `No ${activeSport} games today.`
              : `${games.length} game${games.length === 1 ? "" : "s"}. Tonight's slate.`}
          </div>

          <div style={{
            fontSize: "14px", color: "rgba(248,246,242,0.35)", lineHeight: 1.55,
            maxWidth: "480px", paddingBottom: "clamp(28px,4vw,40px)",
          }}>
            {activeSport === "NBA"
              ? "Every game analyzed. Your decision to make."
              : "Pitcher matchups, bullpen depth, and park factors — all in plain English."}
          </div>
        </div>

        {/* Hero / content separator */}
        <div style={{ height: "1px", background: "rgba(248,246,242,0.06)" }} />

        {/* Tonight's Read */}
        {showTonightsRead && (
          <div style={{ maxWidth: MAX_W, margin: "0 auto", padding: `36px ${PAD} 40px` }}>
            <div style={{
              fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase",
              color: "rgba(248,246,242,0.4)", marginBottom: "14px", fontWeight: 600,
            }}>
              Tonight&apos;s Read
            </div>
            <p style={{
              fontSize: "15px", lineHeight: 1.72, color: "rgba(248,246,242,0.45)",
              fontStyle: "italic", maxWidth: "560px", margin: 0,
            }}>
              {tonightsReadText}
            </p>
          </div>
        )}

        {/* Game list separator */}
        <div style={{ height: "1px", background: "rgba(248,246,242,0.05)" }} />

        {/* Error */}
        {error && (
          <div style={{ maxWidth: MAX_W, margin: "0 auto", padding: `24px ${PAD}` }}>
            <p style={{ fontSize: "14px", color: "var(--signal)" }}>{error}</p>
            <button onClick={() => window.location.reload()} style={{ marginTop: "12px", fontSize: "13px", fontWeight: 500, color: "var(--signal)", background: "none", border: "none", cursor: "pointer" }}>
              Try again
            </button>
          </div>
        )}

        {/* Game rows */}
        <div style={{ maxWidth: MAX_W, margin: "0 auto", padding: `0 ${PAD}` }}>
          {loading ? (
            <>
              <SkeletonRow featured />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : (
            <>
              {headliner && (
                <GameRow
                  game={headliner}
                  bd={breakdowns.get(headliner.gameId) ?? null}
                  featured
                  onRead={() => handleRead(headliner.gameId)}
                  authReady={authReady} userId={userId} proUser={proUser}
                  dailyUsed={dailyUsed} started={isStarted(headliner)}
                />
              )}
              {listGames.map((game) => (
                <GameRow
                  key={game.gameId}
                  game={game}
                  bd={breakdowns.get(game.gameId) ?? null}
                  featured={false}
                  onRead={() => handleRead(game.gameId)}
                  authReady={authReady} userId={userId} proUser={proUser}
                  dailyUsed={dailyUsed} started={isStarted(game)}
                />
              ))}
              {!error && games.length === 0 && (
                <div style={{ padding: "56px 0", textAlign: "center" }}>
                  <p style={{ fontSize: "17px", fontWeight: 600, color: "rgba(248,246,242,0.65)", marginBottom: "8px" }}>
                    No {activeSport} games today
                  </p>
                  <p style={{ fontSize: "13px", color: "rgba(248,246,242,0.3)" }}>Check back on a game day.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Tomorrow's Slate */}
        {!loading && tomorrowSorted.length > 0 && (
          <div style={{ maxWidth: MAX_W, margin: "0 auto", padding: `0 ${PAD}` }}>
            <div style={{ height: "1px", background: "rgba(248,246,242,0.07)", margin: "32px 0 0" }} />
            <div style={{
              fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase",
              color: "rgba(248,246,242,0.15)", padding: "20px 0 12px", fontWeight: 600,
            }}>
              Tomorrow&apos;s Slate
            </div>
            {tomorrowSorted.map((g) => <TomorrowRow key={g.gameId} game={g} />)}
          </div>
        )}

        {/* Closing zone */}
        {!loading && (
          <div style={{ maxWidth: MAX_W, margin: "0 auto", padding: `clamp(52px,7vw,80px) ${PAD}` }}>
            <div style={{ height: "1px", background: "rgba(248,246,242,0.06)", marginBottom: "clamp(40px,5vw,56px)" }} />
            <div style={{
              fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em",
              color: "#fff", lineHeight: 1.3, marginBottom: "12px",
            }}>
              Raw data. Clear read. Your call.
            </div>
            <div style={{
              fontSize: "14px", color: "rgba(248,246,242,0.30)", lineHeight: 1.6,
              maxWidth: "400px", marginBottom: "24px",
            }}>
              Every game on tonight&apos;s slate. Analyzed. No noise — just what the data says.
            </div>
            {!proUser && (
              <Link
                href="/login?mode=signup"
                style={{
                  display: "inline-block", fontSize: "13.5px", fontWeight: 700,
                  color: "#fff", background: "var(--signal)",
                  padding: "11px 24px", textDecoration: "none",
                }}
              >
                Get full access →
              </Link>
            )}
            <div style={{
              marginTop: "20px", fontFamily: "var(--mono)", fontSize: "11px",
              color: "rgba(248,246,242,0.12)", letterSpacing: "0.04em",
            }}>
              Not a picks service. Not a prediction engine. Just the data.
            </div>
          </div>
        )}

        <PageFooter />
      </div>

      {/* Access modal */}
      {modal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(14,14,14,0.65)", backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
          }}
          onClick={() => setModal(null)}
        >
          <div
            style={{
              background: "var(--warm-white)", padding: "32px",
              maxWidth: "400px", width: "100%",
              boxShadow: "0 20px 60px rgba(14,14,14,0.35)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {modal === "cap" ? (
              <>
                <div style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.025em", color: "var(--ink)", marginBottom: "10px" }}>
                  You&apos;ve used today&apos;s breakdown.
                </div>
                <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.6, marginBottom: "24px" }}>
                  Free accounts get one breakdown per day. Come back tomorrow or upgrade to Pro for unlimited access.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <Link href="/login?mode=signup" style={{
                    fontSize: "14px", fontWeight: 600, color: "#fff",
                    background: "var(--signal)", padding: "12px 20px",
                    textDecoration: "none", textAlign: "center", display: "block",
                  }}>
                    Upgrade to Pro →
                  </Link>
                  <button onClick={() => setModal(null)} style={{ fontSize: "13px", color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: "8px" }}>
                    Come back tomorrow
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.025em", color: "var(--ink)", marginBottom: "10px" }}>
                  This breakdown isn&apos;t yours to read.
                </div>
                <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.6, marginBottom: "24px" }}>
                  Another user generated this breakdown. Free accounts can only read breakdowns they built. Upgrade to Pro for unlimited access to every game on the slate.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <Link href="/login?mode=signup" style={{
                    fontSize: "14px", fontWeight: 600, color: "#fff",
                    background: "var(--signal)", padding: "12px 20px",
                    textDecoration: "none", textAlign: "center", display: "block",
                  }}>
                    Upgrade to Pro →
                  </Link>
                  <button onClick={() => setModal(null)} style={{ fontSize: "13px", color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: "8px" }}>
                    Maybe later
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
