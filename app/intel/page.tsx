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

const CONF: Record<string, { bar: string; badgeBg: string; badgeText: string; label: string; cls: string }> = {
  "CLEAR SPOT": { bar: "var(--clear)", badgeBg: "var(--clear-bg)", badgeText: "var(--clear)", label: "Clear Spot", cls: "cb-clear" },
  "LEAN":       { bar: "var(--lean)",  badgeBg: "var(--lean-bg)",  badgeText: "var(--lean)",  label: "Lean",       cls: "cb-lean" },
  "FRAGILE":    { bar: "var(--fragile)", badgeBg: "var(--fragile-bg)", badgeText: "var(--fragile)", label: "Fragile", cls: "cb-fragile" },
  "PASS":       { bar: "var(--pass)",  badgeBg: "var(--pass-bg)",  badgeText: "var(--pass)",  label: "Pass",       cls: "cb-pass" },
};

const CONF_RANK: Record<string, number> = { "CLEAR SPOT": 1, "LEAN": 2, "FRAGILE": 3, "PASS": 4 };

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

// Returns true when the game should be labelled FINAL: either the API says so,
// or >3 hours have elapsed since the scheduled start time (handles stale status).
function isFinalByTime(game: AnyGame): boolean {
  if (game.gameStatus === "final") return true;
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConfBadge({ label }: { label: ConfidenceLabel | null }) {
  if (!label) return null;
  const c = CONF[label] ?? CONF["LEAN"];
  return (
    <span className={`conf-badge ${c.cls}`}>
      <span className="dot" />
      {c.label}
    </span>
  );
}

function SectionLabel({ icon, text }: { icon: "star" | "grid" | "calendar"; text: string }) {
  const icons = {
    star: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    grid: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    calendar: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  };
  return (
    <div style={{
      fontFamily: "var(--mono)", fontSize: "11.5px", letterSpacing: "0.1em", textTransform: "uppercase",
      color: "var(--muted)", marginBottom: "16px",
      display: "flex", alignItems: "center", gap: "10px",
    }}>
      <span style={{ color: "var(--signal)", display: "flex" }}>{icons[icon]}</span>
      {text}
      <span style={{ flex: 1, height: "1px", background: "var(--border-med)", display: "block" }} />
    </div>
  );
}

// ─── Headliner card ───────────────────────────────────────────────────────────

function HeadlinerCard({ game, bd, onRead, authReady, userId, proUser, dailyUsed, started }: {
  game: AnyGame; bd: SlateBreakdown | null; onRead: () => void;
  authReady: boolean; userId: string | null | undefined; proUser: boolean; dailyUsed: boolean; started: boolean;
}) {
  const [hover, setHover] = useState(false);
  const conf = bd?.confidenceLabel ?? null;
  const c = conf ? CONF[conf] : null;
  const barColor = c?.bar ?? "var(--pass)";
  const away = game.awayTeam.teamName;
  const home = game.homeTeam.teamName;
  const odds = game.odds as Record<string, number | null> | null;
  const isMLB = game.sport === "MLB";
  const spreadVal = isMLB
    ? (odds && "runLine" in odds ? formatSpread(odds.runLine as number | null, game.homeTeam.teamAbv) : "—")
    : (odds && "spread" in odds ? formatSpread(odds.spread as number | null, game.homeTeam.teamAbv) : "—");
  const spreadLabel = isMLB ? "Run Line" : "Spread";
  const total = odds?.total != null ? `${odds.total}` : "—";
  const awayML = odds ? formatML(odds.awayMoneyline as number | null) : "—";
  const homeML = odds ? formatML(odds.homeMoneyline as number | null) : "—";
  const insight = bd?.cardSummary ?? null;
  const cta = getCtaLabel(bd, proUser, authReady, userId, dailyUsed);
  const isUpgradeGated = cta === "Upgrade to read →" || cta === "Sign up to read →";
  const statusLabel = isFinalByTime(game) ? "FINAL" : "GAME IN PROGRESS";

  return (
    <div
      role={started ? undefined : "button"}
      tabIndex={started ? undefined : 0}
      onClick={started ? undefined : onRead}
      onKeyDown={started ? undefined : (e) => e.key === "Enter" && onRead()}
      onMouseEnter={started ? undefined : () => setHover(true)}
      onMouseLeave={started ? undefined : () => setHover(false)}
      style={{
        background: "var(--surface)", borderRadius: 0,
        border: "1px solid rgba(17,17,16,0.06)", overflow: "hidden",
        marginBottom: "32px", cursor: started ? "default" : "pointer", color: "var(--ink)",
        boxShadow: !started && hover ? "var(--shadow-lg)" : "var(--shadow-sm)",
        transform: !started && hover ? "translateY(-3px)" : "translateY(0)",
        transition: "box-shadow 0.22s cubic-bezier(0.16,1,0.3,1), transform 0.22s cubic-bezier(0.16,1,0.3,1)",
        outline: "none",
      }}
    >
      {/* Confidence accent bar */}
      <div style={{ height: "3px", background: barColor }} />
      {/* Dark band */}
      <div style={{
        background: "var(--ink)", padding: "12px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className="hl-pulse" style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--signal)", flexShrink: 0, display: "block" }} />
          <span style={{ fontFamily: "var(--mono)", fontSize: "12px", letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)" }}>
            The Cleanest Read Tonight
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "26px 26px 0" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px", marginBottom: "8px" }}>
          <div style={{ fontSize: "clamp(18px, 4vw, 28px)", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--ink)", lineHeight: 1.1 }}>
            {away}
            <span style={{ fontSize: "14px", fontWeight: 400, color: "var(--muted-light)", margin: "0 7px" }}>at</span>
            {home}
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--muted)", whiteSpace: "nowrap", flexShrink: 0 }}>
            {game.gameTime}
          </div>
        </div>

        {/* Stats grid — ML columns hidden on mobile */}
        <div style={{ overflowX: "auto", margin: "18px 0 0", border: "1px solid var(--border-med)", borderRadius: 0 }}>
          <div className="hl-stats-grid" style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", minWidth: "300px", overflow: "hidden",
          }}>
            {[
              { label: spreadLabel, value: spreadVal, cls: "" },
              { label: "Total",     value: total,     cls: "" },
              { label: `${game.awayTeam.teamAbv} ML`, value: awayML, cls: "hl-ml-col" },
              { label: `${game.homeTeam.teamAbv} ML`, value: homeML, cls: "hl-ml-col" },
            ].map((s, i) => (
              <div key={s.label} className={s.cls} style={{
                padding: "13px 14px", borderRight: i < 3 ? "1px solid var(--border)" : "none",
                background: "var(--warm-white)", textAlign: "center",
              }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "7px" }}>{s.label}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "16px", fontWeight: 600, color: "var(--ink)" }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Insight */}
        {insight && (
          <div style={{
            margin: "20px 0 0", padding: "18px 20px", background: "var(--cream)",
            borderRadius: 0, borderLeft: `3px solid ${isUpgradeGated ? "var(--border-strong)" : "var(--signal)"}`,
            fontSize: "15.5px", lineHeight: 1.7, color: "var(--ink-2)", fontStyle: "italic",
            filter: isUpgradeGated ? "blur(4px)" : "none",
            userSelect: isUpgradeGated ? "none" : "auto",
            pointerEvents: isUpgradeGated ? "none" : "auto",
          }}>
            {insight}
          </div>
        )}

        <div style={{
          margin: "12px 0 0", fontSize: "13px", color: "var(--muted)", lineHeight: 1.55,
          display: "flex", gap: "8px", alignItems: "flex-start",
          padding: "10px 14px", background: "rgba(17,17,16,0.03)", borderRadius: 0,
        }}>
          <span style={{ flexShrink: 0, marginTop: "1px" }}>💡</span>
          <span>Highest signal game on tonight&apos;s slate.</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: "20px", padding: "16px 26px",
        borderTop: "1px solid var(--border)", background: "var(--warm-white)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <ConfBadge label={conf} />
        </div>
        {started ? (
          <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {statusLabel}
          </div>
        ) : cta === null ? (
          <div style={{ width: "140px", height: "44px", background: "var(--cream)", borderRadius: 0 }} className="animate-pulse" />
        ) : (
          <div style={{
            fontSize: "13.5px", fontWeight: 700, color: "#fff",
            padding: "11px 24px", borderRadius: 0, background: "var(--signal)",
            display: "flex", alignItems: "center", gap: "7px", whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(201,53,42,0.25)",
            transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
          }}>
            {cta}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Slate card ───────────────────────────────────────────────────────────────

function SlateCard({ game, bd, onRead, authReady, userId, proUser, dailyUsed, started }: {
  game: AnyGame; bd: SlateBreakdown | null; onRead: () => void;
  authReady: boolean; userId: string | null | undefined; proUser: boolean; dailyUsed: boolean; started: boolean;
}) {
  const [hover, setHover] = useState(false);
  const conf = bd?.confidenceLabel ?? null;
  const c = conf ? CONF[conf] : null;
  const barColor = c?.bar ?? "var(--pass)";
  const cta = getCtaLabel(bd, proUser, authReady, userId, dailyUsed);
  const isUpgradeGated = cta === "Upgrade to read →" || cta === "Sign up to read →";
  const insight = bd?.cardSummary ?? null;
  const teaserText = "There’s a clear angle here — but it takes some digging to see it...";

  return (
    <div
      role={started ? undefined : "button"}
      tabIndex={started ? undefined : 0}
      onClick={started ? undefined : onRead}
      onKeyDown={started ? undefined : (e) => e.key === "Enter" && onRead()}
      onMouseEnter={started || isUpgradeGated ? undefined : () => setHover(true)}
      onMouseLeave={started || isUpgradeGated ? undefined : () => setHover(false)}
      style={{
        background: "var(--surface)", borderRadius: 0,
        border: "1px solid rgba(17,17,16,0.06)", overflow: "hidden",
        cursor: started ? "default" : "pointer", color: "var(--ink)", outline: "none",
        opacity: isUpgradeGated ? 0.75 : 1,
        boxShadow: !started && !isUpgradeGated && hover ? "var(--shadow-md)" : "var(--shadow-sm)",
        transform: !started && !isUpgradeGated && hover ? "translateY(-2px)" : "translateY(0)",
        transition: "box-shadow 0.22s cubic-bezier(0.16,1,0.3,1), transform 0.22s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <div style={{ height: "3px", background: barColor }} />
      <div style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <ConfBadge label={conf} />
          <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--muted)" }}>{game.gameTime}</span>
        </div>

        <div style={{ fontSize: "clamp(16px, 3.5vw, 20px)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--ink)", lineHeight: 1.15, marginBottom: "4px" }}>
          {game.awayTeam.teamName}
          <span style={{ fontSize: "13px", fontWeight: 400, color: "var(--muted-light)", margin: "0 7px" }}>at</span>
          {game.homeTeam.teamName}
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--muted)", letterSpacing: "0.02em", marginBottom: (insight || isUpgradeGated) ? "16px" : "0" }}>
          {game.sport}
        </div>

        {isUpgradeGated ? (
          <div style={{
            fontSize: "14px", lineHeight: 1.6, color: "var(--muted)", fontStyle: "italic",
            padding: "14px 16px", background: "var(--cream)", borderRadius: 0,
            borderLeft: "2px solid var(--border-strong)",
            filter: "blur(3px)", userSelect: "none", pointerEvents: "none",
            marginBottom: "12px",
          }}>
            {insight ?? teaserText}
          </div>
        ) : insight ? (
          <div style={{
            fontSize: "14.5px", lineHeight: 1.65, color: "var(--ink-2)", fontStyle: "italic",
            marginBottom: "12px", padding: "14px 16px", background: "var(--cream)",
            borderRadius: 0, borderLeft: "2px solid var(--signal)",
          }}>
            {insight}
          </div>
        ) : null}

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "flex-end",
          paddingTop: "14px", borderTop: "1px solid var(--border)",
        }}>
          {started ? (
            <span style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {isFinalByTime(game) ? "Final" : "In progress"}
            </span>
          ) : cta === null ? (
            <span style={{ width: "100px", height: "16px", background: "var(--cream)", borderRadius: 0, display: "block" }} className="animate-pulse" />
          ) : (
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--signal)", whiteSpace: "nowrap" }}>
              {cta}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tomorrow row ─────────────────────────────────────────────────────────────

function TomorrowRow({ game }: { game: AnyGame }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 14px", borderBottom: "1px solid var(--border)", opacity: 0.45,
    }}>
      <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--muted)", letterSpacing: "-0.01em" }}>
        {game.awayTeam.teamName}
        <span style={{ fontSize: "12px", fontWeight: 400, color: "var(--muted-light)", margin: "0 5px" }}>at</span>
        {game.homeTeam.teamName}
      </div>
      <div style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--muted-light)", whiteSpace: "nowrap" }}>
        {game.gameTime}
      </div>
    </div>
  );
}

// ─── Skeleton states ──────────────────────────────────────────────────────────

function SkeletonHeadliner() {
  return (
    <div style={{ background: "var(--surface)", borderRadius: 0, border: "1px solid rgba(17,17,16,0.06)", overflow: "hidden", marginBottom: "32px" }}>
      <div style={{ background: "var(--ink)", padding: "12px 24px", height: "44px" }} />
      <div style={{ padding: "26px 26px 20px" }}>
        <div style={{ height: "34px", background: "var(--cream)", borderRadius: 0, width: "65%", marginBottom: "18px" }} className="animate-pulse" />
        <div style={{ height: "72px", background: "var(--cream)", borderRadius: 0, marginBottom: "12px" }} className="animate-pulse" />
        <div style={{ height: "48px", background: "var(--cream)", borderRadius: 0 }} className="animate-pulse" />
      </div>
      <div style={{ padding: "16px 26px", borderTop: "1px solid var(--border)", background: "var(--warm-white)", height: "56px" }} />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: "var(--surface)", borderRadius: 0, border: "1px solid rgba(17,17,16,0.06)", overflow: "hidden" }}>
      <div style={{ height: "3px", background: "var(--cream-dark)" }} />
      <div style={{ padding: "20px 24px" }}>
        <div style={{ height: "20px", background: "var(--cream)", borderRadius: 0, width: "80px", marginBottom: "14px" }} className="animate-pulse" />
        <div style={{ height: "26px", background: "var(--cream)", borderRadius: 0, width: "70%", marginBottom: "8px" }} className="animate-pulse" />
        <div style={{ height: "12px", background: "var(--cream)", borderRadius: 0, width: "30%", marginBottom: "16px" }} className="animate-pulse" />
        <div style={{ height: "64px", background: "var(--cream)", borderRadius: 0 }} className="animate-pulse" />
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function PageFooter() {
  return (
    <footer style={{ textAlign: "center", padding: "24px 40px", fontSize: "12px", color: "var(--muted-light)", lineHeight: 1.8 }}>
      For informational purposes only. RawIntel does not provide financial, betting, or investment advice. Bet responsibly.{" "}
      <a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer" style={{ color: "var(--muted)", textDecoration: "underline", textUnderlineOffset: "2px" }}>ncpgambling.org</a>
      {" · "}<Link href="/terms" style={{ color: "var(--muted)", textDecoration: "underline", textUnderlineOffset: "2px" }}>Terms of Service</Link>
      {" · "}<Link href="/privacy" style={{ color: "var(--muted)", textDecoration: "underline", textUnderlineOffset: "2px" }}>Privacy Policy</Link>
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
        // Capture userId from state at query-completion time for ownership mapping
        setUserId((currentUserId) => {
          const map = new Map<string, SlateBreakdown>();
          const seen = new Set<string>();
          for (const row of (data ?? [])) {
            if (seen.has(row.game_id)) continue;
            seen.add(row.game_id);
            // Map user_id to isOwn immediately — don't store the UUID in state
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
      }, () => {});
  }, []);

  useEffect(() => {
    const todayStr = getTodayDateString();
    const cacheKey = `ri_slate_${activeSport}_${todayStr}`;

    // Restore from session cache — preserves slate state on back navigation
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
    if (sorted.length === 0) return null;

    // Restore locked headliner — prevents re-ranking as data updates
    const headlinerKey = `ri_headliner_${activeSport}_${getTodayDateString()}`;
    try {
      const lockedId = sessionStorage.getItem(headlinerKey);
      if (lockedId) {
        const locked = sorted.find((g) => g.gameId === lockedId);
        if (locked) return locked;
      }
    } catch {}

    const withBd = sorted
      .filter((g) => breakdowns.has(g.gameId))
      .sort((a, b) => {
        const ra = CONF_RANK[breakdowns.get(a.gameId)?.confidenceLabel ?? "LEAN"] ?? 5;
        const rb = CONF_RANK[breakdowns.get(b.gameId)?.confidenceLabel ?? "LEAN"] ?? 5;
        return ra !== rb ? ra - rb : parseGameTime(a.gameTime) - parseGameTime(b.gameTime);
      });
    const selection = withBd[0] ?? sorted[0];

    // Lock this selection for the session/day
    try { sessionStorage.setItem(`ri_headliner_${activeSport}_${getTodayDateString()}`, selection.gameId); } catch {}
    return selection;
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

  return (
    <>
    <style>{`
      @media (max-width: 768px) {
        .hl-ml-col { display: none !important; }
        .hl-stats-grid { grid-template-columns: repeat(2, 1fr) !important; min-width: 0 !important; }
      }
    `}</style>
    <div style={{ background: "var(--warm-white)", minHeight: "100vh" }}>
      <Nav activePage="today" />

      {accountDeleted && (
        <div style={{
          background: "var(--ink)", color: "#fff",
          textAlign: "center", padding: "12px 24px",
          fontSize: "13.5px", fontWeight: 500, fontFamily: "var(--sans)",
          letterSpacing: "0.01em",
        }}>
          Account deleted. Sorry to see you go.
        </div>
      )}

      {/* Page hero band */}
      <div className="f2" style={{
        background: "var(--ink)", padding: "clamp(20px,4vw,32px) clamp(20px,4vw,40px)",
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        gap: "24px", flexWrap: "wrap", position: "relative", overflow: "hidden",
      }}>
        <span aria-hidden="true" style={{
          position: "absolute", right: "-2%", top: "50%", transform: "translateY(-50%)",
          fontSize: "220px", fontWeight: 900, letterSpacing: "-0.05em",
          color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.03)",
          lineHeight: 1, pointerEvents: "none", userSelect: "none",
        }}>R</span>

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 600,
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.4)", marginBottom: "10px",
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <span style={{ width: "20px", height: "1px", background: "var(--signal)", display: "block", flexShrink: 0 }} />
            Today's Intel
          </div>
          <div style={{
            fontSize: "28px", fontWeight: 800, letterSpacing: "-0.035em",
            color: "#fff", lineHeight: 1.15, marginBottom: "8px",
          }}>
            {loading ? "Loading tonight's slate."
              : games.length === 0 ? `No ${activeSport} games today.`
              : `${games.length} game${games.length === 1 ? "" : "s"} on tonight's slate.`}
          </div>
          <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", lineHeight: 1.55, maxWidth: "480px" }}>
            {activeSport === "NBA"
              ? "Every game analyzed. Your decision to make."
              : "Pitcher matchups, bullpen depth, and park factors — all in plain English."}
          </div>
        </div>

        <div style={{
          display: "flex", flexDirection: "column", alignItems: "flex-end",
          gap: "12px", flexShrink: 0, position: "relative", zIndex: 1,
        }}>
          {/* Sport tabs */}
          <div style={{ display: "flex", gap: "4px" }}>
            {(["NBA", "MLB"] as Sport[]).map((sport) => (
              <button
                key={sport}
                onClick={() => setActiveSport(sport)}
                style={{
                  fontFamily: "var(--sans)", fontSize: "11px", fontWeight: 600,
                  letterSpacing: "0.05em", textTransform: "uppercase",
                  padding: "7px 18px", borderRadius: 0, cursor: "pointer",
                  border: `1px solid ${activeSport === sport ? "var(--signal)" : "rgba(255,255,255,0.12)"}`,
                  background: activeSport === sport ? "var(--signal)" : "transparent",
                  color: activeSport === sport ? "#fff" : "rgba(255,255,255,0.4)",
                  transition: "all 0.12s",
                }}
              >
                {sport}
              </button>
            ))}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "-0.01em", color: "rgba(255,255,255,0.5)" }}>
              {todayLabel}
            </div>
            {!loading && games.length > 0 && (
              <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "rgba(255,255,255,0.28)", marginTop: "3px" }}>
                {games.length} breakdown{games.length === 1 ? "" : "s"} ready
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: "880px", margin: "0 auto", padding: "40px clamp(16px,4vw,40px) 80px" }}>

        {/* Error */}
        {error && (
          <div style={{
            background: "var(--surface)", border: "1px solid rgba(201,53,42,0.3)", borderRadius: 0,
            padding: "24px", textAlign: "center", marginBottom: "24px",
          }}>
            <p style={{ fontSize: "14px", color: "var(--signal)" }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{ marginTop: "12px", fontSize: "13px", fontWeight: 500, color: "var(--signal)", background: "none", border: "none", cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Headliner */}
        {(loading || headliner) && (
          <div className="f3">
            {loading
              ? <SkeletonHeadliner />
              : headliner
              ? <HeadlinerCard game={headliner} bd={breakdowns.get(headliner.gameId) ?? null} onRead={() => handleRead(headliner.gameId)} authReady={authReady} userId={userId} proUser={proUser} dailyUsed={dailyUsed} started={isStarted(headliner)} />
              : null}
          </div>
        )}

        {/* Tonight's Breakdowns */}
        {(loading || listGames.length > 0) && (
          <div className="f4">
            <SectionLabel icon="grid" text="Tonight's slate" />
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "36px" }}>
              {loading
                ? [1, 2, 3].map((i) => <SkeletonCard key={i} />)
                : listGames.map((game) => {
                    const bd = breakdowns.get(game.gameId) ?? null;
                    return <SlateCard key={game.gameId} game={game} bd={bd} onRead={() => handleRead(game.gameId)} authReady={authReady} userId={userId} proUser={proUser} dailyUsed={dailyUsed} started={isStarted(game)} />;
                  })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && games.length === 0 && (
          <div style={{
            background: "var(--surface)", border: "1px solid rgba(17,17,16,0.06)",
            borderRadius: 0, padding: "40px 24px", textAlign: "center",
          }}>
            <p style={{ fontSize: "17px", fontWeight: 600, color: "var(--ink)", marginBottom: "8px" }}>
              No {activeSport} games today
            </p>
            <p style={{ fontSize: "13px", color: "var(--muted)" }}>Check back on a game day.</p>
          </div>
        )}

        {/* Tomorrow */}
        {!loading && tomorrowSorted.length > 0 && (
          <div className="f5">
            <SectionLabel icon="calendar" text="Tomorrow · Breakdowns Available Day Of Game" />
            <div style={{ display: "flex", flexDirection: "column", marginBottom: "40px" }}>
              {tomorrowSorted.map((g) => <TomorrowRow key={g.gameId} game={g} />)}
            </div>
          </div>
        )}

        {/* Closing panel */}
        {!loading && (
          <div className="f6" style={{
            background: "var(--ink)", borderRadius: 0, overflow: "hidden",
            display: "grid", gridTemplateColumns: "1fr 1fr",
          }}>
            {[
              { eyebrow: "Tonight", headline: "The breakdown is yours.\nThe decision is too.", sub: "Every game on tonight's slate. Analyzed. Ready. No noise — just what the data says." },
              { eyebrow: "Tomorrow", headline: "Come back tomorrow.\nThe board resets.", sub: "New games. New breakdowns. Same standard." },
            ].map((panel, i) => (
              <div key={panel.eyebrow} style={{ padding: "32px 36px", borderRight: i === 0 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                <div style={{
                  fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 600,
                  letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--signal)",
                  marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px",
                }}>
                  <span style={{ width: "16px", height: "1px", background: "var(--signal)", display: "block" }} />
                  {panel.eyebrow}
                </div>
                <div style={{
                  fontSize: "19px", fontWeight: 700, letterSpacing: "-0.025em",
                  color: "#fff", lineHeight: 1.35, marginBottom: "8px", whiteSpace: "pre-line",
                }}>
                  {panel.headline}
                </div>
                <div style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.38)", lineHeight: 1.55 }}>
                  {panel.sub}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PageFooter />
    </div>

    {/* Access modal */}
    {modal && (
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(14,14,14,0.55)", backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
        }}
        onClick={() => setModal(null)}
      >
        <div
          style={{
            background: "var(--warm-white)", borderRadius: 0,
            padding: "32px", maxWidth: "400px", width: "100%",
            boxShadow: "0 20px 60px rgba(14,14,14,0.25)",
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
                  background: "var(--signal)", padding: "12px 20px", borderRadius: 0,
                  textDecoration: "none", textAlign: "center", display: "block",
                }}>
                  Upgrade to Pro →
                </Link>
                <button
                  onClick={() => setModal(null)}
                  style={{
                    fontSize: "13px", color: "var(--muted)", background: "none", border: "none",
                    cursor: "pointer", padding: "8px",
                  }}
                >
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
                  background: "var(--signal)", padding: "12px 20px", borderRadius: 0,
                  textDecoration: "none", textAlign: "center", display: "block",
                }}>
                  Upgrade to Pro →
                </Link>
                <button
                  onClick={() => setModal(null)}
                  style={{
                    fontSize: "13px", color: "var(--muted)", background: "none", border: "none",
                    cursor: "pointer", padding: "8px",
                  }}
                >
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
