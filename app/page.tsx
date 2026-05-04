"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { AnyGame, Sport, BreakdownResult } from "@/lib/types";
import BreakdownView from "@/components/BreakdownView";

const SAMPLE_BREAKDOWN: BreakdownResult = {
  gameShape: "Game 5 of the OKC–Memphis First Round series is a half-court game by design. Both teams prefer structured offense — OKC through SGA isolation, Memphis through Morant creation — and pace in Games 3 and 4 averaged 95.3 possessions, confirming neither team is playing fast. Memphis arrives facing elimination, which adds defensive intensity but also the risk of forcing offense in situations the data doesn't support. OKC is deeper and more efficient in the half-court; this environment favors them.",
  keyDrivers: [
    {
      factor: "SUPPORTS THE SCRIPT — SGA half-court dominance: Shai Gilgeous-Alexander is averaging 31.2 PPG on 52.4% shooting through four games, operating at 1.21 points per possession against Memphis's single-coverage scheme — above his season mark of 1.09 PPP. Memphis has no reliable answer for him one-on-one.",
      weight: "primary",
      direction: "positive",
    },
    {
      factor: "WORKS AGAINST MEMPHIS — JJJ foul trouble pattern: Jaren Jackson Jr. has picked up 3+ fouls by halftime in three of four games. OKC's pick-and-roll coverage draws JJJ into early defensive commitments, removing Memphis's primary rim protection during OKC's peak isolation runs in the second and third quarters.",
      weight: "primary",
      direction: "negative",
    },
    {
      factor: "WORKS AGAINST MEMPHIS — Ja Morant questionable (right knee contusion): Morant logged 31 minutes in Game 4 while limited — Memphis's half-court creation rate in this series drops from 1.05 PPP with him to 0.87 without him at full speed. His status for tonight remains unresolved.",
      weight: "primary",
      direction: "negative",
    },
    {
      factor: "SUPPORTS THE SCRIPT — OKC fourth-quarter execution: OKC's fourth-quarter net rating is +8.4, best in the league, and they are 12-2 in games decided by 6 or fewer points this season. Memphis ranks 28th in fourth-quarter net rating at -4.1 — OKC's closing execution has been the margin in all three wins.",
      weight: "secondary",
      direction: "positive",
    },
  ],
  baseScript: "OKC controls pace through three quarters — SGA operates in the mid-range and isolation, JJJ's foul trouble limits Memphis's interior defense, and Memphis cannot generate clean half-court offense against OKC's switching scheme. If Morant remains limited, Memphis has no reliable creation mechanism late and OKC closes with their fourth-quarter execution. Projected range: OKC 109, Memphis 98 — combined 207, well under the posted 211.5.",
  fragilityCheck: [
    { item: "Morant plays 36+ minutes at full speed — if Morant is fully available tonight, Memphis's half-court creation rate climbs back toward its regular-season mark and the expected margin compresses significantly.", color: "red" },
    { item: "Jaren Jackson Jr. availability — JJJ is listed questionable with knee inflammation. A scratched JJJ removes Memphis's primary rim protection and would push the expected total well below 211.5.", color: "amber" },
    { item: "OKC abandons half-court structure — OKC pushed their transition rate to 102.4 in Game 2, a game they lost. If they leave the disciplined approach that has produced wins in Games 3 and 4, Memphis generates transition buckets and the spread margin shrinks.", color: "red" },
  ],
  marketRead: "As of 6:15 PM ET, the spread has moved from OKC -7 to OKC -8.5 — 1.5 points of movement toward OKC since open. OKC -375 implies a 78.9% win probability; MEM +305 implies a 24.7% win probability — the combined 103.6% reflects 3.6% vig. The total of 211.5 has held from open with no movement in either direction, consistent with the market accepting the pace and defensive environment both teams established in Games 3 and 4. Sharp spread movement toward OKC is notable given Memphis's elimination urgency — the market is pricing OKC's closing execution over desperation-driven variance.",
  edge: [
    "The data points toward OKC covering -8.5 based on their fourth-quarter net rating (+8.4) and SGA's 1.21 PPP efficiency against Memphis's single-coverage scheme. The stronger case is OKC covering if Morant remains limited — this read changes if he's confirmed full go at game time.",
    "Base Script projects a combined 207. The stronger case is the under on 211.5 because pace in Games 3 and 4 has averaged 95.3 possessions and OKC's defensive structure has held Memphis to their lowest transition scoring rate of the season.",
  ],
  edgeClosingLine: "These are the environments the data creates. Your decision is always yours.",
  decisionLens: "The data points toward OKC — their fourth-quarter execution margin and SGA's efficiency against Memphis's coverage scheme are the structural edges here. The condition that flips this read is Morant fully available for 36+ minutes, which is exactly why this carries a Lean and not a Clear Spot. Confirm Morant's status and JJJ's availability at game time before acting on either the spread or total. This is not a pick. This is what the data says. Your decision is always yours.",
  cardSummary: "OKC's fourth-quarter net rating (+8.4) and SGA's isolation efficiency create a structural edge in Game 5. Morant's questionable status is the single variable that could compress the expected margin.",
  shareHook: "OKC is 12-2 in close games this season — and Memphis is 28th in 4th-quarter net rating.",
  confidenceLevel: 2,
  confidenceLabel: "LEAN",
  signalGrade: "B",
  primaryUncertainty: "Ja Morant's availability and minutes load for Game 5",
  glossaryTerm: "net rating",
  glossaryDefinition: "Points scored minus points allowed per 100 possessions — the standard measure of how well a team performs on both ends, independent of pace.",
};

const SAMPLE_GAME: AnyGame = {
  sport: "NBA",
  gameId: "sample-mem-okc-20260504",
  gameDate: "20260504",
  gameTime: "9:30 PM ET",
  gameStatus: "scheduled",
  homeTeam: { teamId: "OKC", teamAbv: "OKC", teamName: "Oklahoma City Thunder", teamCity: "Oklahoma City" },
  awayTeam: { teamId: "MEM", teamAbv: "MEM", teamName: "Memphis Grizzlies", teamCity: "Memphis" },
  odds: {
    spread: -8.5,
    total: 211.5,
    homeMoneyline: -375,
    awayMoneyline: 305,
    impliedHomeProbability: 78.9,
    impliedAwayProbability: 24.7,
    spreadBookmaker: "sample",
    totalsBookmaker: "sample",
  },
};

function parseGameTime(time: string): number {
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 9999;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (match[3].toUpperCase() === "PM" && h !== 12) h += 12;
  if (match[3].toUpperCase() === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

export default function HomePage() {
  const [teaserSport, setTeaserSport] = useState<Sport>("NBA");
  const [teaserGames, setTeaserGames] = useState<AnyGame[]>([]);
  const [teaserLoading, setTeaserLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const client = createClient();
    client.auth.getUser().then(({ data }) => {
      setAuthEmail(data.user?.email ?? null);
    });
    const { data: sub } = client.auth.onAuthStateChange((_e, session) => {
      setAuthEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleNavLogout() {
    const client = createClient();
    await client.auth.signOut();
    setAuthEmail(null);
  }

  function truncateEmail(e: string): string {
    if (e.length <= 24) return e;
    const atIdx = e.indexOf("@");
    return `${e.slice(0, atIdx > 9 ? 9 : atIdx)}…${e.slice(atIdx)}`;
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); }
      }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setTeaserLoading(true);
    setTeaserGames([]);
    fetch(`/api/games?sport=${teaserSport.toLowerCase()}`)
      .then(r => r.ok ? r.json() : { games: [] })
      .catch(() => ({ games: [] }))
      .then((data: { games?: AnyGame[] }) => {
        const sorted = [...(data.games ?? [])].sort((a, b) => parseGameTime(a.gameTime) - parseGameTime(b.gameTime));
        setTeaserGames(sorted);
        setTeaserLoading(false);
      });
  }, [teaserSport]);

  const todayLabel = new Date().toLocaleDateString("en-US", {
    timeZone: "America/New_York", weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div style={{ background: "var(--ink)", color: "#fff", overflowX: "hidden" }}>
      <style>{`
        @keyframes hpRevealLine { to { opacity: 1; transform: translateY(0); } }
        @keyframes hpRevealUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes hpLetterDrift { from { transform: translateY(-50%); } to { transform: translateY(-52%) translateX(-12px); } }
        @keyframes hpGlowPulse { from { opacity: 0.6; transform: scale(1); } to { opacity: 1; transform: scale(1.08); } }
        @keyframes hpScanLine { from { top: 36%; opacity: 0.6; } to { top: 40%; opacity: 1; } }
        .hp-hero-eyebrow { opacity: 0; animation: hpRevealUp 0.7s 0.1s cubic-bezier(0.16,1,0.3,1) forwards; }
        .hp-hero-line { display: block; opacity: 0; transform: translateY(100%); }
        .hp-hero-line-1 { animation: hpRevealLine 0.7s 0.25s cubic-bezier(0.16,1,0.3,1) forwards; }
        .hp-hero-line-2 { animation: hpRevealLine 0.7s 0.38s cubic-bezier(0.16,1,0.3,1) forwards; }
        .hp-hero-line-3 { animation: hpRevealLine 0.7s 0.51s cubic-bezier(0.16,1,0.3,1) forwards; color: transparent; -webkit-text-stroke: 1.5px rgba(255,255,255,0.3); }
        .hp-hero-line-3 .hp-accent { color: var(--signal); -webkit-text-stroke: 0; }
        .hp-hero-sub { opacity: 0; animation: hpRevealUp 0.7s 0.65s cubic-bezier(0.16,1,0.3,1) forwards; }
        .hp-hero-ctas { opacity: 0; animation: hpRevealUp 0.7s 0.78s cubic-bezier(0.16,1,0.3,1) forwards; }
        .hp-hero-steps { opacity: 0; animation: hpRevealUp 0.7s 0.9s cubic-bezier(0.16,1,0.3,1) forwards; }
        .hp-bg-glow { position: absolute; top: -20%; left: -10%; width: 70vw; height: 70vw; border-radius: 50%; background: radial-gradient(circle, rgba(201,53,42,0.07) 0%, transparent 65%); animation: hpGlowPulse 8s ease-in-out infinite alternate; pointer-events: none; }
        .hp-bg-line { position: absolute; left: 0; right: 0; height: 1px; background: linear-gradient(to right, transparent, rgba(201,53,42,0.15) 50%, transparent); animation: hpScanLine 6s ease-in-out infinite alternate; pointer-events: none; }
        .hp-bg-letter { position: absolute; right: -4%; top: 50%; transform: translateY(-50%); font-size: clamp(380px,48vw,680px); font-weight: 900; letter-spacing: -0.05em; color: transparent; -webkit-text-stroke: 1px rgba(255,255,255,0.035); line-height: 1; user-select: none; animation: hpLetterDrift 12s ease-in-out infinite alternate; pointer-events: none; font-family: var(--sans); }
        .hp-nav-link:hover { color: #fff !important; background: rgba(255,255,255,0.07) !important; }
        .hp-btn-login:hover { color: #fff !important; border-color: rgba(255,255,255,0.25) !important; }
        .hp-btn-cta:hover { background: #b02e24 !important; }
        .hp-cta-primary:hover { background: #b02e24 !important; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(201,53,42,0.35) !important; }
        .hp-cta-secondary:hover { color: #fff !important; border-color: rgba(255,255,255,0.25) !important; }
        .hp-step:hover { background: rgba(255,255,255,0.06) !important; }
        .hp-teaser-game:hover { background: var(--cream) !important; border-color: var(--border) !important; }
        .hp-teaser-game:hover .hp-teaser-cta { opacity: 1 !important; }
        .hp-preview-btn:hover { background: var(--signal) !important; transform: translateY(-1px); }
        .hp-teaser-btn:hover { background: #b02e24 !important; transform: translateY(-1px); }
        .hp-footer-link:hover { color: rgba(255,255,255,0.55) !important; }
        @media (max-width: 768px) {
          .hp-nav-links { display: none !important; }
          .hp-nav-right { display: none !important; }
          .hp-nav-ham { display: flex !important; }
          .hp-nav-mob { display: flex !important; }
          .hp-hero-wrap { padding: 90px 24px 60px !important; }
          .hp-hero-content { max-width: 100% !important; }
          .hp-step-grid { grid-template-columns: 1fr !important; }
          .hp-step-arr { display: none !important; }
          .hp-section-pad { padding: 64px 24px !important; }
          .hp-compare-grid { grid-template-columns: 1fr !important; }
          .hp-game-row { grid-template-columns: 1fr auto !important; gap: 12px !important; }
          .hp-game-cta { display: none !important; }
          .hp-footer-inner { padding: 28px 24px !important; flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
        }
      `}</style>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 48px", height: "56px", display: "flex", alignItems: "center",
        background: "rgba(17,17,16,0.96)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <Link href="/" style={{
          fontSize: "15px", fontWeight: 700, letterSpacing: "-0.03em",
          textDecoration: "none", color: "#fff",
          paddingRight: "28px", borderRight: "1px solid rgba(255,255,255,0.1)",
          marginRight: "24px", flexShrink: 0,
        }}>
          Raw<span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>Intel</span><span style={{ color: "var(--signal)" }}>.</span>
        </Link>
        <ul className="hp-nav-links" style={{ display: "flex", gap: "2px", listStyle: "none", flex: 1, margin: 0, padding: 0 }}>
          {[
            { href: "/intel", label: "Today's Intel" },
            { href: "/how-it-works", label: "How It Works" },
            { href: "/glossary", label: "Glossary" },
            { href: "/tools/line-translator", label: "Line Translator" },
          ].map(l => (
            <li key={l.href}>
              <Link href={l.href} className="hp-nav-link" style={{
                fontSize: "12.5px", fontWeight: 500, color: "rgba(255,255,255,0.45)",
                textDecoration: "none", padding: "5px 12px", borderRadius: 0,
                transition: "all 0.15s", display: "block",
              }}>{l.label}</Link>
            </li>
          ))}
        </ul>
        <div className="hp-nav-right" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "10px" }}>
          {authEmail ? (
            <>
              <Link href="/account" style={{
                fontSize: "12px", fontFamily: "var(--mono)", color: "rgba(255,255,255,0.45)",
                textDecoration: "none", letterSpacing: "0.02em",
              }}>{truncateEmail(authEmail)}</Link>
              <button onClick={handleNavLogout} className="hp-btn-login" style={{
                fontSize: "12.5px", fontWeight: 500, color: "rgba(255,255,255,0.5)",
                background: "none", padding: "7px 16px", borderRadius: 0,
                border: "1px solid rgba(255,255,255,0.1)", transition: "all 0.15s", cursor: "pointer",
              }}>Log out</button>
            </>
          ) : authEmail === null ? (
            <>
              <Link href="/login" className="hp-btn-login" style={{
                fontSize: "12.5px", fontWeight: 500, color: "rgba(255,255,255,0.5)",
                textDecoration: "none", padding: "7px 16px", borderRadius: 0,
                border: "1px solid rgba(255,255,255,0.1)", transition: "all 0.15s",
              }}>Log in</Link>
              <Link href="/login?mode=signup" className="hp-btn-cta" style={{
                fontSize: "12.5px", fontWeight: 600, color: "#fff",
                textDecoration: "none", padding: "7px 18px", borderRadius: 0,
                background: "var(--signal)", transition: "all 0.15s",
              }}>Start free</Link>
            </>
          ) : null}
        </div>
        {/* Hamburger — mobile only */}
        <button
          className="hp-nav-ham"
          onClick={() => setNavOpen(o => !o)}
          aria-label="Toggle menu"
          style={{
            marginLeft: "auto", display: "none", flexDirection: "column", gap: "5px",
            background: "none", border: "none", cursor: "pointer", padding: "4px",
          }}
        >
          {[0,1,2].map(i => (
            <span key={i} style={{ display: "block", width: "20px", height: "2px", background: "rgba(255,255,255,0.6)", borderRadius: 0 }} />
          ))}
        </button>
        {/* Mobile dropdown */}
        {navOpen && (
          <div className="hp-nav-mob" style={{
            display: "none", position: "fixed", top: "56px", left: 0, right: 0,
            background: "rgba(17,17,16,0.97)", backdropFilter: "blur(12px)",
            flexDirection: "column", padding: "16px 24px 24px", gap: "2px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}>
            {[
              { href: "/intel", label: "Today's Intel" },
              { href: "/how-it-works", label: "How It Works" },
              { href: "/glossary", label: "Glossary" },
              { href: "/tools/line-translator", label: "Line Translator" },
            ].map(l => (
              <Link key={l.href} href={l.href} onClick={() => setNavOpen(false)} style={{
                fontSize: "16px", fontWeight: 500, color: "rgba(255,255,255,0.65)",
                textDecoration: "none", padding: "12px 0",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>{l.label}</Link>
            ))}
            {authEmail ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                <Link href="/account" onClick={() => setNavOpen(false)} style={{
                  fontSize: "12px", fontFamily: "var(--mono)", color: "rgba(255,255,255,0.4)",
                  textDecoration: "none", letterSpacing: "0.02em", padding: "4px 0",
                }}>{truncateEmail(authEmail)}</Link>
                <button onClick={() => { setNavOpen(false); handleNavLogout(); }} style={{
                  fontSize: "15px", fontWeight: 500, color: "rgba(255,255,255,0.65)",
                  background: "none", border: "none", cursor: "pointer", padding: "12px 0",
                  textAlign: "left", borderTop: "1px solid rgba(255,255,255,0.06)",
                }}>Log out</button>
              </div>
            ) : authEmail === null ? (
              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <Link href="/login" style={{
                  fontSize: "13px", fontWeight: 500, color: "rgba(255,255,255,0.6)",
                  textDecoration: "none", padding: "9px 20px", borderRadius: 0,
                  border: "1px solid rgba(255,255,255,0.12)", flex: 1, textAlign: "center",
                }}>Log in</Link>
                <Link href="/login?mode=signup" style={{
                  fontSize: "13px", fontWeight: 600, color: "#fff",
                  textDecoration: "none", padding: "9px 20px", borderRadius: 0,
                  background: "var(--signal)", flex: 1, textAlign: "center",
                }}>Start free</Link>
              </div>
            ) : null}
          </div>
        )}
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="hp-hero-wrap" style={{
        minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center",
        position: "relative", padding: "120px 48px 80px", overflow: "hidden",
      }}>
        <div className="hp-bg-glow" />
        <div className="hp-bg-line" />
        <div className="hp-bg-letter" aria-hidden>R</div>
        <div aria-hidden style={{
          position: "absolute", inset: 0, opacity: 0.4, pointerEvents: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E")`,
        }} />

        <div className="hp-hero-content" style={{ position: "relative", zIndex: 1, maxWidth: "860px" }}>
          <div className="hp-hero-eyebrow" style={{
            display: "inline-flex", alignItems: "center", gap: "10px",
            fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 500,
            letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)",
            marginBottom: "28px",
          }}>
            <span style={{ display: "block", width: "24px", height: "1px", background: "var(--signal)", flexShrink: 0 }} />
            Sports betting decision support
          </div>

          <h1 style={{
            fontSize: "clamp(48px,7vw,80px)", fontWeight: 800, letterSpacing: "-0.04em",
            lineHeight: 1.0, color: "#fff", marginBottom: "8px", overflow: "hidden",
            fontFamily: "var(--sans)",
          }}>
            <span className="hp-hero-line hp-hero-line-1">Raw data.</span>
            <span className="hp-hero-line hp-hero-line-2">Clear read.</span>
            <span className="hp-hero-line hp-hero-line-3"><span className="hp-accent">Your</span> call.</span>
          </h1>

          <p className="hp-hero-sub" style={{
            fontSize: "17px", fontWeight: 400, color: "rgba(255,255,255,0.5)",
            lineHeight: 1.65, maxWidth: "520px", margin: "28px 0 40px",
          }}>
            RawIntel turns game data into straight talk —{" "}
            <strong style={{ color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
              simple enough for a rookie, deep enough for a pro.
            </strong>{" "}
            Never picks. Just everything you need to decide for yourself.
          </p>

          <div className="hp-hero-ctas" style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", marginBottom: "72px" }}>
            <Link href="/intel" className="hp-cta-primary" style={{
              fontSize: "14px", fontWeight: 600, color: "#fff", textDecoration: "none",
              padding: "13px 28px", borderRadius: 0, background: "var(--signal)",
              display: "flex", alignItems: "center", gap: "8px",
              transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
            }}>
              See today&apos;s slate →
            </Link>
            <Link href="/how-it-works" className="hp-cta-secondary" style={{
              fontSize: "13.5px", fontWeight: 500, color: "rgba(255,255,255,0.5)",
              textDecoration: "none", padding: "13px 20px", borderRadius: 0,
              border: "1px solid rgba(255,255,255,0.1)", transition: "all 0.15s",
            }}>
              How it works
            </Link>
            <span style={{ fontFamily: "var(--mono)", fontSize: "10.5px", color: "rgba(255,255,255,0.25)", letterSpacing: "0.04em" }}>
              No account needed to start
            </span>
          </div>

          {/* 3-step grid */}
          <div className="hp-hero-steps hp-step-grid" style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px",
            background: "rgba(255,255,255,0.07)", borderRadius: 0, overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.07)",
          }}>
            {[
              { num: "01", title: "Pick a game", desc: "Every game on today’s slate. Analyzed. Ready.", bold: "Choose what you’re watching tonight." },
              { num: "02", title: "Get the breakdown", desc: "No noise. ", bold: "Game shape, key drivers, market read", desc2: " — everything that actually matters, nothing that doesn’t." },
              { num: "03", title: "Your decision", desc: "Armed with the full picture, the call is yours. ", bold: "That’s not a disclaimer — that’s the product." },
            ].map((step, i) => (
              <div key={step.num} className="hp-step" style={{
                background: "rgba(255,255,255,0.03)", padding: "24px 28px",
                position: "relative", transition: "background 0.2s",
              }}>
                {i < 2 && (
                  <span aria-hidden className="hp-step-arr" style={{
                    position: "absolute", right: "-10px", top: "50%", transform: "translateY(-50%)",
                    color: "rgba(255,255,255,0.15)", zIndex: 2,
                  }}>→</span>
                )}
                <div style={{
                  fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em",
                  color: "var(--signal)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px",
                }}>
                  {step.num}
                  <span style={{ flex: 1, height: "1px", background: "rgba(201,53,42,0.2)", display: "block" }} />
                </div>
                <div style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.025em", color: "#fff", marginBottom: "8px" }}>
                  {step.title}
                </div>
                <div style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.4)", lineHeight: 1.55 }}>
                  {step.desc}
                  <strong style={{ color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>{step.bold}</strong>
                  {"desc2" in step ? step.desc2 : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What makes it different ──────────────────────────────────── */}
      <section className="hp-section-pad" style={{ background: "var(--warm-white)", color: "var(--ink)", padding: "96px 64px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div className="reveal" style={{ marginBottom: "56px" }}>
            <div style={{
              fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.14em",
              textTransform: "uppercase", color: "var(--signal)", marginBottom: "12px",
              display: "flex", alignItems: "center", gap: "10px",
            }}>
              <span style={{ width: "20px", height: "1px", background: "var(--signal)", display: "block", flexShrink: 0 }} />
              What makes it different
            </div>
            <div style={{ fontSize: "clamp(32px,4.5vw,52px)", fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.06, marginBottom: "14px", color: "var(--ink)" }}>
              Built for the bettor<br />who wants to think.
            </div>
            <div style={{ fontSize: "15px", lineHeight: 1.6, color: "var(--muted)", maxWidth: "520px" }}>
              Most tools either tell you what to bet or dump raw numbers on you. RawIntel does neither.
            </div>
          </div>

          <div className="reveal rd1 hp-compare-grid" style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2px",
            borderRadius: 0, overflow: "hidden", border: "1px solid var(--border-med)",
          }}>
            {[
              {
                tag: "Picks services", title: "They decide.\nYou trust blindly.", dark: false,
                items: [
                  { bad: true, text: "Tells you what to bet with no explanation" },
                  { bad: true, text: "You never learn how to read the board" },
                  { bad: true, text: "When they’re wrong, you have no idea why" },
                ],
              },
              {
                tag: "Raw data tools", title: "All signal.\nNo translation.", dark: false,
                items: [
                  { bad: true, text: "Dumps numbers without context" },
                  { bad: true, text: "Requires you to already know what matters" },
                  { bad: true, text: "Overwhelming before the game even starts" },
                ],
              },
              {
                tag: "RawIntel", title: "Clear read.\nYour call.", dark: true,
                items: [
                  { bad: false, bold: "Explains what the data means", rest: " — not just what it says" },
                  { bad: false, bold: "Teaches you to think", rest: " about the board over time" },
                  { bad: false, bold: "You walk away informed.", rest: " Confident. Ready to decide." },
                ],
              },
            ].map((col) => (
              <div key={col.tag} style={{ padding: "36px 32px", background: col.dark ? "var(--ink)" : "var(--surface)" }}>
                <div style={{
                  fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em",
                  textTransform: "uppercase", marginBottom: "20px", paddingBottom: "16px",
                  borderBottom: `1px solid ${col.dark ? "rgba(255,255,255,0.08)" : "var(--border-med)"}`,
                  color: col.dark ? "var(--signal)" : "var(--muted)",
                }}>
                  {col.tag}
                </div>
                <div style={{
                  fontSize: "20px", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "28px",
                  lineHeight: 1.15, color: col.dark ? "#fff" : "var(--ink)", whiteSpace: "pre-line",
                }}>
                  {col.title}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {col.items.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "11px" }}>
                      <div style={{
                        width: "20px", height: "20px", borderRadius: "50%", display: "flex",
                        alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700,
                        flexShrink: 0, marginTop: "1px",
                        background: item.bad ? "rgba(17,17,16,0.06)" : "var(--signal)",
                        color: item.bad ? "var(--muted)" : "#fff",
                      }}>
                        {item.bad ? "✕" : "✓"}
                      </div>
                      <div style={{ fontSize: "13.5px", lineHeight: 1.55, color: col.dark ? "rgba(255,255,255,0.65)" : "var(--muted)" }}>
                        {"bold" in item ? (
                          <><strong style={{ color: col.dark ? "#fff" : "var(--ink)", fontWeight: 500 }}>{item.bold}</strong>{item.rest}</>
                        ) : item.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Breakdown preview ────────────────────────────────────────── */}
      <section className="hp-section-pad" style={{ background: "var(--cream)", color: "var(--ink)", padding: "96px 64px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div className="reveal" style={{ marginBottom: "56px" }}>
            <div style={{
              fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.14em",
              textTransform: "uppercase", color: "var(--signal)", marginBottom: "12px",
              display: "flex", alignItems: "center", gap: "10px",
            }}>
              <span style={{ width: "20px", height: "1px", background: "var(--signal)", display: "block", flexShrink: 0 }} />
              What a breakdown looks like
            </div>
            <div style={{ fontSize: "clamp(32px,4.5vw,52px)", fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.06, marginBottom: "14px", color: "var(--ink)" }}>
              The breakdown,<br />step by step.
            </div>
            <div style={{ fontSize: "15px", lineHeight: 1.6, color: "var(--muted)", maxWidth: "520px" }}>
              Every breakdown follows the same six-step structure — so you always know where you are and what it means.
            </div>
          </div>

          <div className="reveal rd1" style={{
            background: "var(--surface)", borderRadius: 0,
            boxShadow: "var(--shadow-md)", border: "1px solid rgba(17,17,16,0.06)",
          }}>
            {/* Dark hero band — mirrors the breakdown page */}
            <div style={{ background: "var(--ink)", padding: "20px 28px", position: "relative", overflow: "hidden" }}>
              <span aria-hidden="true" style={{
                position: "absolute", right: "-3%", top: "50%", transform: "translateY(-50%)",
                fontSize: "clamp(80px,18vw,160px)", fontWeight: 900,
                color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.03)",
                lineHeight: 1, pointerEvents: "none", userSelect: "none",
              }}>R</span>
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{
                  fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 600,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.35)", marginBottom: "10px",
                  display: "flex", alignItems: "center", gap: "10px",
                }}>
                  <span style={{ width: "16px", height: "1px", background: "var(--signal)", display: "block" }} />
                  NBA · First Round · Sample Breakdown
                </div>
                <div style={{
                  fontSize: "clamp(18px,4vw,26px)", fontWeight: 800,
                  letterSpacing: "-0.035em", color: "#fff", lineHeight: 1.1, marginBottom: "16px",
                }}>
                  Memphis Grizzlies
                  <span style={{ fontSize: "0.55em", fontWeight: 400, color: "rgba(255,255,255,0.4)", margin: "0 8px" }}>at</span>
                  Oklahoma City Thunder
                </div>
                {/* Confidence badge */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 0, padding: "10px 16px",
                }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--lean)", display: "block", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--lean)" }}>Lean</div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>Directional but not clean</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats bar */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", background: "var(--surface)", borderBottom: "1px solid var(--border-med)" }}>
              {[
                { label: "Spread",  value: "OKC -8.5" },
                { label: "Total",   value: "211.5" },
                { label: "MEM ML",  value: "+305" },
                { label: "OKC ML",  value: "-375" },
              ].map((s, i) => (
                <div key={s.label} style={{
                  padding: "14px 16px", textAlign: "center",
                  borderRight: i < 3 ? "1px solid var(--border)" : "none",
                }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "6px" }}>{s.label}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "15px", fontWeight: 600, color: "var(--ink)" }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Full breakdown — all six steps */}
            <div style={{ padding: "28px 24px 40px", maxWidth: "720px", margin: "0 auto" }}>
              <BreakdownView breakdown={SAMPLE_BREAKDOWN} game={SAMPLE_GAME} />
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "40px" }}>
            <Link href="/intel" className="hp-preview-btn" style={{
              fontSize: "14px", fontWeight: 600, color: "#fff", textDecoration: "none",
              padding: "13px 32px", borderRadius: 0, background: "var(--ink)",
              display: "inline-flex", alignItems: "center", gap: "8px", transition: "all 0.2s",
            }}>
              Get tonight&apos;s breakdown →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Today's slate teaser ─────────────────────────────────────── */}
      <section className="hp-section-pad" style={{ background: "var(--surface)", color: "var(--ink)", padding: "96px 64px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div className="reveal" style={{ marginBottom: "56px" }}>
            <div style={{
              fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.14em",
              textTransform: "uppercase", color: "var(--signal)", marginBottom: "12px",
              display: "flex", alignItems: "center", gap: "10px",
            }}>
              <span style={{ width: "20px", height: "1px", background: "var(--signal)", display: "block", flexShrink: 0 }} />
              Today&apos;s slate
            </div>
            <div style={{ fontSize: "clamp(32px,4.5vw,52px)", fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.06, marginBottom: "14px", color: "var(--ink)" }}>
              Tonight&apos;s games.<br />All of them.
            </div>
            <div style={{ fontSize: "15px", lineHeight: 1.6, color: "var(--muted)", maxWidth: "520px" }}>
              Every game on today&apos;s slate has a breakdown ready. Start with one, free — or go through the whole board.
            </div>
          </div>

          <div className="reveal rd1">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", paddingBottom: "14px", borderBottom: "1px solid var(--border-med)" }}>
              <div style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink)" }}>
                {todayLabel}
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                {(["NBA", "MLB"] as Sport[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setTeaserSport(s)}
                    style={{
                      fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600,
                      letterSpacing: "0.08em", textTransform: "uppercase",
                      padding: "5px 14px", borderRadius: 0, cursor: "pointer",
                      border: "1px solid var(--border-med)",
                      background: teaserSport === s ? "var(--ink)" : "transparent",
                      color: teaserSport === s ? "#fff" : "var(--muted)",
                      transition: "all 0.12s",
                    }}
                  >{s}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {teaserLoading
                ? [1, 2, 3].map(i => (
                    <div key={i} style={{ height: "52px", background: "var(--cream)", borderRadius: 0 }} className="animate-pulse" />
                  ))
                : teaserGames.length === 0
                ? <div style={{ padding: "24px 16px", color: "var(--muted)", fontSize: "14px" }}>No {teaserSport} games today.</div>
                : teaserGames.slice(0, 5).map(game => (
                    <Link
                      key={game.gameId}
                      href={`/intel?sport=${teaserSport}`}
                      className="hp-teaser-game hp-game-row"
                      style={{
                        display: "grid", gridTemplateColumns: "1fr auto auto", gap: "20px",
                        alignItems: "center", padding: "15px 16px", borderRadius: 0,
                        background: "transparent", transition: "background 0.12s",
                        textDecoration: "none", color: "var(--ink)",
                        border: "1px solid transparent",
                      }}
                    >
                      <div style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "-0.02em", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {game.awayTeam.teamName}{" "}
                        <span style={{ fontSize: "12px", fontWeight: 400, color: "var(--muted)", margin: "0 4px" }}>@</span>
                        {" "}{game.homeTeam.teamName}
                      </div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--muted-light)", whiteSpace: "nowrap" }}>
                        {game.gameTime}
                      </div>
                      <div className="hp-teaser-cta hp-game-cta" style={{ fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600, color: "var(--signal)", opacity: 0, transition: "opacity 0.12s", whiteSpace: "nowrap" }}>
                        Read →
                      </div>
                    </Link>
                  ))
              }
            </div>

            {!teaserLoading && teaserGames.length > 5 && (
              <Link href={`/intel?sport=${teaserSport}`} style={{
                display: "block", padding: "12px 16px",
                fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 600,
                letterSpacing: "0.06em", textTransform: "uppercase",
                color: "var(--signal)", textDecoration: "none",
                borderTop: "1px solid var(--border)",
              }}>
                + {teaserGames.length - 5} more on tonight&apos;s slate →
              </Link>
            )}

            <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px" }}>
              <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                <strong style={{ color: "var(--ink)", fontWeight: 600 }}>Start with one read, free.</strong> Upgrade anytime for the full slate.
              </div>
              <Link href={`/intel?sport=${teaserSport}`} className="hp-teaser-btn" style={{
                fontSize: "13.5px", fontWeight: 600, color: "#fff", textDecoration: "none",
                padding: "11px 24px", borderRadius: 0, background: "var(--signal)",
                display: "flex", alignItems: "center", gap: "6px", transition: "all 0.15s", whiteSpace: "nowrap",
              }}>
                See tonight&apos;s slate →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Manifesto ────────────────────────────────────────────────── */}
      <section className="hp-section-pad" style={{ background: "var(--ink)", color: "#fff", padding: "96px 64px", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", bottom: "-30%", right: "-10%", width: "60vw", height: "60vw",
          borderRadius: "50%", background: "radial-gradient(circle, rgba(201,53,42,0.06) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />
        <div style={{ maxWidth: "800px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div className="reveal" style={{
            fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "var(--signal)", display: "flex", alignItems: "center",
            gap: "12px", marginBottom: "48px",
          }}>
            <span style={{ width: "24px", height: "1px", background: "var(--signal)", display: "block", flexShrink: 0 }} />
            The RawIntel standard
          </div>

          <div className="reveal rd1" style={{
            fontSize: "clamp(15px,1.6vw,20px)", fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1.65,
          }}>
            <em style={{ fontStyle: "normal", color: "#fff" }}>Most betting tools talk at you.</em>
            <span style={{ color: "rgba(255,255,255,0.32)", fontWeight: 400 }}> They give you a pick, a number, a signal — and expect you to follow.</span>
            <br /><br />
            <em style={{ fontStyle: "normal", color: "#fff" }}>RawIntel works differently.</em>
            <span style={{ color: "rgba(255,255,255,0.32)", fontWeight: 400 }}> We do the homework — the data, the matchup, the market — and hand you the read.</span>
            <br /><br />
            <span style={{ color: "var(--signal)" }}>You walk away knowing exactly why you bet — or why you didn&apos;t.</span>
          </div>

          <div className="reveal rd2" style={{ width: "40px", height: "2px", background: "var(--signal)", margin: "52px 0", opacity: 0.6 }} />

          <div className="reveal rd2" style={{ fontFamily: "var(--mono)", fontSize: "12px", letterSpacing: "0.06em", color: "rgba(255,255,255,0.22)", lineHeight: 1.7 }}>
            The decision is always yours.<br />
            <strong style={{ color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>RawIntel.</strong>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer style={{ background: "#0C0C0B", padding: "32px 64px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", flexWrap: "wrap" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "-0.02em", color: "rgba(255,255,255,0.2)" }}>
          RawIntel<span style={{ color: "var(--signal)", opacity: 0.5 }}>.</span>
        </div>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          {[
            { href: "/how-it-works", label: "How It Works" },
            { href: "/glossary", label: "Glossary" },
            { href: "/tools/line-translator", label: "Line Translator" },
            { href: "/terms", label: "Terms of Service" },
            { href: "/privacy", label: "Privacy Policy" },
          ].map(l => (
            <Link key={l.href} href={l.href} className="hp-footer-link" style={{
              fontSize: "11.5px", color: "rgba(255,255,255,0.25)", textDecoration: "none", transition: "color 0.12s",
            }}>{l.label}</Link>
          ))}
        </div>
        <div style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.15)", textAlign: "right", lineHeight: 1.6 }}>
          For informational purposes only. Not financial or betting advice.<br />
          Bet responsibly &middot;{" "}
          <a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>
            ncpgambling.org
          </a>
          {" · © RawIntel LLC"}
        </div>
      </footer>
    </div>
  );
}
