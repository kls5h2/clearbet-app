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

// ─── Confidence config ────────────────────────────────────────────────────────

const CONF: Record<string, { label: string; color: string; bgColor: string }> = {
  "CLEAR SPOT": { label: "Clear Spot", color: "#4DB87A", bgColor: "rgba(26,122,72,0.18)" },
  "LEAN":       { label: "Lean",       color: "#6B9FE8", bgColor: "rgba(24,82,168,0.18)" },
  "FRAGILE":    { label: "Fragile",    color: "#D4913A", bgColor: "rgba(181,106,18,0.18)" },
  "PASS":       { label: "Pass",       color: "#9B9790", bgColor: "rgba(110,107,102,0.18)" },
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
  keyDrivers?: Array<{ factor: string; direction?: string }>;
}

type Filter = "all" | "free" | "locked";

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

function extractDnaTags(keyDrivers: Array<{ factor: string }>): string[] {
  return keyDrivers.slice(0, 3).flatMap((d) => {
    const parts = d.factor.split(/\s*[—–]\s*/);
    const first = parts[0].trim();
    if (/^(SUPPORTS|WORKS|NEUTRAL|INJURY)/i.test(first)) {
      if (parts.length >= 2) {
        const label = parts[1].split(/[:]/)[0].trim();
        if (label.length >= 3 && label.length <= 24) return [label];
      }
      return [];
    }
    if (first.length >= 3 && first.length <= 24) return [first];
    return [];
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConfBadge({ label }: { label: ConfidenceLabel | null }) {
  if (!label) return null;
  const c = CONF[label] ?? CONF["LEAN"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "4px 10px", borderRadius: "20px",
      background: c.bgColor,
      fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em",
      textTransform: "uppercase", color: c.color, whiteSpace: "nowrap", flexShrink: 0,
    }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: c.color, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

function DnaChip({ label }: { label: string }) {
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: "20px",
      background: "rgba(248,246,242,0.07)",
      fontSize: "11px", fontWeight: 500, color: "rgba(248,246,242,0.45)",
      letterSpacing: "0.01em", whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

function LockedChip() {
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: "20px",
      background: "rgba(248,246,242,0.05)",
      fontSize: "11px", fontWeight: 600, color: "rgba(248,246,242,0.22)",
      letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap",
    }}>
      Locked
    </span>
  );
}

function BreakdownChip() {
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: "20px",
      background: "rgba(201,53,42,0.14)",
      fontSize: "11px", fontWeight: 600, color: "var(--signal)",
      letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap",
    }}>
      Full Breakdown
    </span>
  );
}

// ─── GameCard ─────────────────────────────────────────────────────────────────

function GameCard({
  game, bd, featured, onRead, authReady, userId, proUser, dailyUsed, started,
}: {
  game: AnyGame; bd: SlateBreakdown | null; featured: boolean; onRead: () => void;
  authReady: boolean; userId: string | null | undefined; proUser: boolean;
  dailyUsed: boolean; started: boolean;
}) {
  const [hover, setHover] = useState(false);
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

  const dnaTags = bd?.keyDrivers ? extractDnaTags(bd.keyDrivers) : [];
  const titleSize = featured ? "22px" : "17px";
  const cardBg = hover && !started ? "#202020" : "#1a1918";

  return (
    <div
      role={started ? undefined : "button"}
      tabIndex={started ? undefined : 0}
      onClick={started ? undefined : onRead}
      onKeyDown={started ? undefined : (e) => e.key === "Enter" && onRead()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderRadius: "12px",
        background: cardBg,
        padding: "18px 20px 16px",
        marginBottom: "10px",
        cursor: started ? "default" : "pointer",
        outline: "none",
        border: "1px solid rgba(248,246,242,0.06)",
        transition: "background 0.12s ease",
        opacity: started && isFinalByTime(game) ? 0.45 : 1,
      }}
    >
      {/* Top row: sport label + game title + badge */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase",
            color: "rgba(248,246,242,0.2)", marginBottom: "5px",
          }}>
            {game.sport}
          </div>
          <div style={{
            fontSize: titleSize, fontWeight: 700, letterSpacing: "-0.025em",
            color: isLocked ? "rgba(248,246,242,0.25)" : "rgba(248,246,242,0.95)",
            lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {game.awayTeam.teamAbv}
            <span style={{ fontSize: "12px", fontWeight: 400, color: "rgba(248,246,242,0.25)", margin: "0 6px" }}>at</span>
            {game.homeTeam.teamAbv}
          </div>
        </div>
        {conf && <ConfBadge label={conf} />}
      </div>

      {/* DNA tags + status chips */}
      {(dnaTags.length > 0 || bd || isLocked) && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
          {dnaTags.map((tag) => <DnaChip key={tag} label={tag} />)}
          {bd && !isLocked && <BreakdownChip />}
          {isLocked && <LockedChip />}
          {started && !isFinalByTime(game) && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              padding: "3px 10px", borderRadius: "20px",
              background: "rgba(201,53,42,0.1)",
              fontSize: "11px", fontWeight: 500, color: "var(--signal)",
            }}>
              <span className="w-[5px] h-[5px] rounded-full animate-pulse block" style={{ background: "var(--signal)", flexShrink: 0 }} />
              In progress
            </span>
          )}
        </div>
      )}

      {/* Bottom: stats + time */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "12px" }}>
        <div className="card-stats" style={{ display: "flex", gap: "16px", opacity: isLocked ? 0.18 : 1 }}>
          {[
            { label: spreadLabel, value: spreadVal },
            { label: "Total", value: total },
            { label: "ML", value: awayML },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "15px", fontWeight: 700, color: "rgba(248,246,242,0.9)", lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(248,246,242,0.28)", marginTop: "3px" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "rgba(248,246,242,0.22)", whiteSpace: "nowrap", paddingBottom: "2px" }}>
          {game.gameTime || "TBD"}
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
      padding: "9px 0", borderBottom: "1px solid rgba(248,246,242,0.04)",
    }}>
      <div style={{ fontSize: "13px", fontWeight: 500, color: "rgba(248,246,242,0.2)", letterSpacing: "-0.01em" }}>
        {game.awayTeam.teamAbv}
        <span style={{ fontSize: "11px", fontWeight: 400, color: "rgba(248,246,242,0.1)", margin: "0 6px" }}>at</span>
        {game.homeTeam.teamAbv}
      </div>
      <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "rgba(248,246,242,0.12)", whiteSpace: "nowrap" }}>
        {game.gameTime}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard({ featured }: { featured?: boolean }) {
  return (
    <div style={{
      borderRadius: "12px", background: "#1a1918",
      padding: "18px 20px 16px", marginBottom: "10px",
      border: "1px solid rgba(248,246,242,0.06)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ height: "9px", width: "24px", background: "rgba(248,246,242,0.07)", marginBottom: "7px" }} className="animate-pulse" />
          <div style={{ height: featured ? "22px" : "17px", width: "55%", background: "rgba(248,246,242,0.07)" }} className="animate-pulse" />
        </div>
        <div style={{ height: "26px", width: "80px", borderRadius: "20px", background: "rgba(248,246,242,0.06)" }} className="animate-pulse" />
      </div>
      <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
        {[70, 80].map((w) => (
          <div key={w} style={{ height: "24px", width: `${w}px`, borderRadius: "20px", background: "rgba(248,246,242,0.06)" }} className="animate-pulse" />
        ))}
      </div>
      <div style={{ display: "flex", gap: "16px" }}>
        {[44, 36, 36].map((w, i) => (
          <div key={i}>
            <div style={{ height: "15px", width: `${w}px`, background: "rgba(248,246,242,0.07)", marginBottom: "3px" }} className="animate-pulse" />
            <div style={{ height: "9px", width: "28px", background: "rgba(248,246,242,0.05)" }} className="animate-pulse" />
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
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
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
      .select("game_id, user_id, card_summary, confidence_label, confidence_level, created_at, breakdown_content")
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
            const content = row.breakdown_content as { keyDrivers?: Array<{ factor: string; direction?: string }> } | null;
            map.set(row.game_id, {
              gameId: row.game_id,
              isOwn: row.user_id != null && row.user_id === currentUserId,
              cardSummary: row.card_summary ?? null,
              confidenceLabel: (row.confidence_label as ConfidenceLabel) ?? null,
              confidenceLevel: (row.confidence_level as ConfidenceLevel) ?? null,
              keyDrivers: content?.keyDrivers ?? undefined,
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

  // Filter logic
  const filterGame = (game: AnyGame): boolean => {
    if (activeFilter === "all") return true;
    const bd = breakdowns.get(game.gameId) ?? null;
    const cta = getCtaLabel(bd, proUser, authReady, userId, dailyUsed);
    const isLocked = cta === "Upgrade to read →" || cta === "Sign up to read →";
    if (activeFilter === "locked") return isLocked;
    if (activeFilter === "free") return !isLocked;
    return true;
  };

  const filteredHeadliner = headliner && filterGame(headliner) ? headliner : null;
  const filteredList = listGames.filter(filterGame);

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
  const MAX_W = "860px";

  const filterTabs: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "free", label: "Free" },
    { key: "locked", label: "Locked" },
  ];

  return (
    <>
      <style>{`
        @media (max-width: 540px) {
          .card-stats { gap: 12px !important; }
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
                    padding: "6px 16px", cursor: "pointer", transition: "all 0.12s", borderRadius: "6px",
                    border: `1px solid ${activeSport === sport ? "var(--signal)" : "rgba(248,246,242,0.12)"}`,
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

        {/* Separator */}
        <div style={{ height: "1px", background: "rgba(248,246,242,0.06)" }} />

        {/* Tonight's Read */}
        {showTonightsRead && (
          <div style={{ maxWidth: MAX_W, margin: "0 auto", padding: `32px ${PAD} 36px` }}>
            <div style={{
              fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase",
              color: "rgba(248,246,242,0.4)", marginBottom: "12px", fontWeight: 600,
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

        {/* Filter tabs + game list */}
        <div style={{ maxWidth: MAX_W, margin: "0 auto", padding: `0 ${PAD}` }}>
          <div style={{ height: "1px", background: "rgba(248,246,242,0.05)", marginBottom: "20px" }} />

          {/* Filter tabs */}
          {!loading && games.length > 0 && (
            <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  style={{
                    fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
                    padding: "6px 14px", cursor: "pointer", transition: "all 0.12s", borderRadius: "20px",
                    border: `1px solid ${activeFilter === tab.key ? "rgba(248,246,242,0.25)" : "rgba(248,246,242,0.08)"}`,
                    background: activeFilter === tab.key ? "rgba(248,246,242,0.1)" : "transparent",
                    color: activeFilter === tab.key ? "rgba(248,246,242,0.85)" : "rgba(248,246,242,0.35)",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: "16px 0" }}>
              <p style={{ fontSize: "14px", color: "var(--signal)" }}>{error}</p>
              <button onClick={() => window.location.reload()} style={{ marginTop: "12px", fontSize: "13px", fontWeight: 500, color: "var(--signal)", background: "none", border: "none", cursor: "pointer" }}>
                Try again
              </button>
            </div>
          )}

          {/* Game cards */}
          {loading ? (
            <>
              <SkeletonCard featured />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              {filteredHeadliner && (
                <GameCard
                  game={filteredHeadliner}
                  bd={breakdowns.get(filteredHeadliner.gameId) ?? null}
                  featured
                  onRead={() => handleRead(filteredHeadliner.gameId)}
                  authReady={authReady} userId={userId} proUser={proUser}
                  dailyUsed={dailyUsed} started={isStarted(filteredHeadliner)}
                />
              )}
              {filteredList.map((game) => (
                <GameCard
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
              {!loading && games.length > 0 && filteredHeadliner === null && filteredList.length === 0 && (
                <div style={{ padding: "40px 0", textAlign: "center" }}>
                  <p style={{ fontSize: "14px", color: "rgba(248,246,242,0.35)" }}>No games match this filter.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Tomorrow's Slate */}
        {!loading && tomorrowSorted.length > 0 && (
          <div style={{ maxWidth: MAX_W, margin: "0 auto", padding: `0 ${PAD}` }}>
            <div style={{ height: "1px", background: "rgba(248,246,242,0.07)", margin: "24px 0 0" }} />
            <div style={{
              fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase",
              color: "rgba(248,246,242,0.15)", padding: "18px 0 10px", fontWeight: 600,
            }}>
              Tomorrow&apos;s Slate
            </div>
            {tomorrowSorted.map((g) => <TomorrowRow key={g.gameId} game={g} />)}
          </div>
        )}

        {/* Closing zone */}
        {!loading && (
          <div style={{ maxWidth: MAX_W, margin: "0 auto", padding: `clamp(48px,7vw,72px) ${PAD}` }}>
            <div style={{ height: "1px", background: "rgba(248,246,242,0.06)", marginBottom: "clamp(36px,5vw,48px)" }} />
            <div style={{
              fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em",
              color: "#fff", lineHeight: 1.3, marginBottom: "10px",
            }}>
              Raw data. Clear read. Your call.
            </div>
            <div style={{
              fontSize: "14px", color: "rgba(248,246,242,0.30)", lineHeight: 1.6,
              maxWidth: "400px", marginBottom: "22px",
            }}>
              Every game on tonight&apos;s slate. Analyzed. No noise — just what the data says.
            </div>
            {!proUser && (
              <Link
                href="/login?mode=signup"
                style={{
                  display: "inline-block", fontSize: "13.5px", fontWeight: 700,
                  color: "#fff", background: "var(--signal)",
                  padding: "11px 24px", textDecoration: "none", borderRadius: "4px",
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
              maxWidth: "400px", width: "100%", borderRadius: "12px",
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
                    background: "var(--signal)", padding: "12px 20px", borderRadius: "6px",
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
                    background: "var(--signal)", padding: "12px 20px", borderRadius: "6px",
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
