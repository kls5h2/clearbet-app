"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";

interface Term {
  name: string;
  def: React.ReactNode;
  keywords: string;
  badge?: string;
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  terms: Term[];
}

const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);
const DollarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
  </svg>
);
const BarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const CATEGORIES: Category[] = [
  {
    id: "rawintel",
    name: "RawIntel System",
    icon: <StarIcon />,
    terms: [
      {
        name: "Base Script",
        keywords: "base script expected outcome probable",
        def: "The most probable game flow given the data, if nothing unexpected happens. Not a prediction — a structured description of the expected shape. The foundation of the breakdown.",
      },
      {
        name: "Breakdown",
        keywords: "breakdown rawintel analysis",
        def: <>RawIntel's six-step analysis of a game. Covers game shape, key drivers, base script, fragility, market read, and what it all means. <strong style={{ fontWeight: 600, color: "var(--ink)" }}>Not a pick.</strong></>,
      },
      {
        name: "Clear Spot",
        keywords: "clear spot confidence",
        badge: "cb-clear",
        def: "The data points cleanly in one direction. The environment is stable and the logic holds. One of the cleaner reads on tonight's board.",
      },
      {
        name: "Confidence Level",
        keywords: "confidence level clear spot lean fragile pass",
        def: <>An honest assessment of how clearly the data points in one direction. Four levels: <strong style={{ fontWeight: 600, color: "var(--ink)" }}>Clear Spot, Lean, Fragile, Pass.</strong> Tells you how clean the read is — not how likely you are to win.</>,
      },
      {
        name: "Fragile",
        keywords: "fragile confidence risk conditional",
        badge: "cb-fragile",
        def: <>The logic holds but depends on a few things going right. One injury or lineup change could flip the script. <strong style={{ fontWeight: 600, color: "var(--ink)" }}>Read the Fragility Check carefully.</strong></>,
      },
      {
        name: "Fragility Check",
        keywords: "fragility check risk what breaks",
        def: "Step 4 of every breakdown. The specific, checkable things that would flip the base script — injuries, lineup changes, early momentum shifts. Read this before deciding anything.",
      },
      {
        name: "Game Shape",
        keywords: "game shape type fast slow",
        def: "Step 1 of every breakdown. Defines what kind of game this is — fast, slow, high-scoring, grind-it-out — before anything else. Sets the context for all other factors.",
      },
      {
        name: "Lean",
        keywords: "lean confidence directional",
        badge: "cb-lean",
        def: "There's a directional read but it's not clean. Real factors point one way with enough noise on the other side to keep it from being a Clear Spot.",
      },
      {
        name: "Pass",
        keywords: "pass confidence skip no edge",
        badge: "cb-pass",
        def: "Too many moving parts to form a strong view. The data doesn't land clearly. Knowing when to pass is part of thinking clearly about betting.",
      },
    ],
  },
  {
    id: "dna",
    name: "Game DNA Tags",
    icon: <GridIcon />,
    terms: [
      {
        name: "🧱 Half-Court",
        keywords: "half court slow deliberate sets",
        def: "Slow, deliberate game. Teams run set plays with fewer fast breaks. Totals are usually lower. Execution and defensive schemes matter more than athleticism.",
      },
      {
        name: "💤 Low Ceiling",
        keywords: "low ceiling low scoring defensive tight",
        def: "Limited scoring upside for both teams. This game is unlikely to blow open in either direction. Strong defensive matchup, slow pace, or both. The under is often the natural lean.",
      },
      {
        name: "🎯 Star Driven",
        keywords: "star driven player dependent key player",
        def: "One or two key players will decide this game. Their performance tonight determines the outcome. Check injury reports and recent form before deciding anything.",
      },
      {
        name: "⚡ Transition Clash",
        keywords: "transition clash pace tempo fast",
        def: "Both teams play at different preferred tempos. Whoever forces their pace controls the game. Watch early possessions — the first team to establish their speed usually wins that battle.",
      },
      {
        name: "🧨 Volatile",
        keywords: "volatile high variance unpredictable",
        def: "High variance game. The outcome is harder to predict than the line suggests. Could go either way by a large margin. Props and totals carry extra risk here.",
      },
    ],
  },
  {
    id: "betting",
    name: "Betting Basics",
    icon: <DollarIcon />,
    terms: [
      {
        name: "Cover",
        keywords: "cover ats against the spread win",
        def: "When a team wins against the spread. If Denver is −3.5 and wins by 7, they covered. If they win by 2, they did not cover — even though they won the game outright.",
      },
      {
        name: "Implied Probability",
        keywords: "implied probability percentage odds chance",
        def: <>What a moneyline translates to as a percentage chance of winning. <strong style={{ fontWeight: 600, color: "var(--ink)" }}>−150 implies roughly 60% probability. +130 implies roughly 43%.</strong> The gap between implied probability and your read is where edges live.</>,
      },
      {
        name: "Juice / Vig",
        keywords: "juice vig vigorish sportsbook margin",
        def: "The sportsbook's cut — built into the odds. Most standard bets are priced at −110 on both sides, meaning you bet $110 to win $100. That extra $10 is the juice. It's how the house makes money regardless of the outcome.",
      },
      {
        name: "Line Movement",
        keywords: "line movement shift move sharp money",
        def: <>When the spread or total changes after it opens. <strong style={{ fontWeight: 600, color: "var(--ink)" }}>Significant movement usually signals sharp (informed) money</strong> on one side. Not a reason to blindly follow — but worth knowing.</>,
      },
      {
        name: "Moneyline",
        keywords: "moneyline ml win straight up",
        def: <>A bet on which team wins outright, no spread involved. <strong style={{ fontWeight: 600, color: "var(--ink)" }}>Negative = favorite</strong> (−150 means bet $150 to win $100). <strong style={{ fontWeight: 600, color: "var(--ink)" }}>Positive = underdog</strong> (+130 means bet $100 to win $130).</>,
      },
      {
        name: "Prop Bet",
        keywords: "prop proposition player stat bet",
        def: <>A bet on a specific event within a game — usually a player stat. <strong style={{ fontWeight: 600, color: "var(--ink)" }}>Examples:</strong> Jokić over 28.5 points, LeBron over 7.5 assists. Props are more sensitive to lineup changes and game pace than spread bets.</>,
      },
      {
        name: "Push",
        keywords: "push tie spread result no winner",
        def: <>When the final margin exactly matches the spread, resulting in a tie. Your bet is refunded. <strong style={{ fontWeight: 600, color: "var(--ink)" }}>Example:</strong> Denver is −3 and wins by exactly 3. No winner, no loser — money back.</>,
      },
      {
        name: "Sharp Money",
        keywords: "sharp money informed bettors professional",
        def: "Bets placed by professional or highly informed bettors. Sportsbooks often move lines in response to sharp action. When the line moves against the public, sharp money is usually driving it.",
      },
      {
        name: "Spread",
        keywords: "spread point spread ats cover",
        def: <>The point handicap a sportsbook assigns to level the playing field. <strong style={{ fontWeight: 600, color: "var(--ink)" }}>Example:</strong> Denver −3.5 means Denver must win by 4+ for a bet on them to pay. Orlando +3.5 means Orlando can lose by 3 and still cover.</>,
      },
      {
        name: "Total (Over/Under)",
        keywords: "total over under ou points scored",
        def: "A bet on the combined score of both teams. The sportsbook sets a number — you bet whether the actual score goes over or under it. Unrelated to which team wins.",
      },
    ],
  },
  {
    id: "stats",
    name: "Stats & Data",
    icon: <BarIcon />,
    terms: [
      {
        name: "ATS Record",
        keywords: "ats record against spread cover losses wins",
        def: <>A team's record against the spread — wins and losses covering, not outright. <strong style={{ fontWeight: 600, color: "var(--ink)" }}>A team can be 10–2 straight up but 4–8 ATS.</strong> More relevant to betting than win-loss record alone.</>,
      },
      {
        name: "Defensive Rating",
        keywords: "defensive rating efficiency points allowed 100",
        def: <>Points allowed per 100 possessions. <strong style={{ fontWeight: 600, color: "var(--ink)" }}>Lower is better.</strong> The best defensive teams hold opponents under 110. Elite defenses under 108.</>,
      },
      {
        name: "ERA",
        keywords: "era earned run average pitching baseball",
        def: <>Earned Run Average — the average runs a pitcher allows per nine innings. <strong style={{ fontWeight: 600, color: "var(--ink)" }}>Under 3.00 is elite. Over 5.00 is a concern.</strong> One of the most important factors in MLB totals and run lines.</>,
      },
      {
        name: "First Five Innings (F5)",
        keywords: "first five innings f5 mlb baseball starter",
        def: <>An MLB bet that settles after five innings regardless of the final score. <strong style={{ fontWeight: 600, color: "var(--ink)" }}>Useful when you trust the starting pitchers but not the bullpens.</strong> Removes late-game variance from the equation entirely.</>,
      },
      {
        name: "Home / Away Splits",
        keywords: "home away splits location road performance",
        def: <>How dramatically a team's performance changes depending on location. Some teams are elite at home and average on the road. <strong style={{ fontWeight: 600, color: "var(--ink)" }}>Splits matter most in playoff situations and for teams with strong home crowds.</strong></>,
      },
      {
        name: "Load Management",
        keywords: "load management rest minutes nba player",
        def: <>When a team intentionally limits a healthy player's minutes — usually late in the season. <strong style={{ fontWeight: 600, color: "var(--ink)" }}>Check load management situations before any game involving star players.</strong> Undisclosed until close to tip-off.</>,
      },
      {
        name: "Net Rating",
        keywords: "net rating efficiency plus minus points",
        def: <>Points scored minus points allowed per 100 possessions. <strong style={{ fontWeight: 600, color: "var(--ink)" }}>The single best summary of a team's overall quality.</strong> Positive is good. Higher is better. More reliable than win-loss record over small samples.</>,
      },
      {
        name: "Offensive Rating",
        keywords: "offensive rating efficiency scoring points 100",
        def: "Points scored per 100 possessions. Measures how efficiently a team scores, independent of pace. Useful for comparing teams that play at very different speeds.",
      },
      {
        name: "Pace",
        keywords: "pace possessions per game speed tempo",
        def: <>How many possessions a team averages per game. <strong style={{ fontWeight: 600, color: "var(--ink)" }}>High pace = more possessions, higher totals.</strong> Low pace = fewer possessions, tighter games. One of the most important factors in setting the game shape.</>,
      },
      {
        name: "Pythagorean Record",
        keywords: "pythagorean record expected wins points luck",
        def: <>Expected wins based on points scored versus points allowed — not actual results. <strong style={{ fontWeight: 600, color: "var(--ink)" }}>Teams that significantly outperform their Pythagorean record tend to regress.</strong> More predictive than straight win-loss over small samples.</>,
      },
      {
        name: "Run Line",
        keywords: "run line baseball spread rl",
        def: "Baseball's version of the spread — almost always set at ±1.5 runs. The favorite must win by 2+. The underdog can lose by 1 and still cover. Changes the implied probability significantly.",
      },
      {
        name: "Usage Rate",
        keywords: "usage rate player possessions props involved percent",
        def: <>The percentage of team possessions a player is involved in while on the court. <strong style={{ fontWeight: 600, color: "var(--ink)" }}>High usage = more shot attempts, more prop relevance.</strong> When a teammate is injured, usage rate often spikes — and props follow.</>,
      },
      {
        name: "WHIP",
        keywords: "whip walks hits innings pitcher baseball",
        def: <>Walks plus Hits per Inning Pitched. Measures how many baserunners a pitcher allows. <strong style={{ fontWeight: 600, color: "var(--ink)" }}>Under 1.10 is elite. Over 1.40 is a red flag.</strong> Lower is better.</>,
      },
    ],
  },
];

export default function GlossaryPage() {
  const [query, setQuery] = useState("");
  const revealRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.05 }
    );
    revealRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const q = query.toLowerCase().trim();

  const filtered: Category[] = CATEGORIES.map((cat) => ({
    ...cat,
    terms: cat.terms.filter((t) => {
      if (!q) return true;
      return (
        t.keywords.includes(q) ||
        t.name.toLowerCase().includes(q) ||
        (typeof t.def === "string" && t.def.toLowerCase().includes(q))
      );
    }),
  })).filter((cat) => cat.terms.length > 0);

  const noResults = q && filtered.length === 0;

  return (
    <>
    <style>{`
      @media (max-width: 768px) {
        .glossary-term-row {
          grid-template-columns: 1fr !important;
          gap: 8px !important;
          alignItems: start !important;
        }
      }
    `}</style>
    <div style={{ background: "var(--warm-white)", minHeight: "100vh" }}>
      <Nav activePage="glossary" />

      {/* HERO */}
      <div
        className="f2"
        style={{
          background: "var(--ink)",
          padding: "36px 40px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            right: "-2%",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "clamp(140px, 22vw, 260px)",
            fontWeight: 900,
            color: "transparent",
            WebkitTextStroke: "1px rgba(255,255,255,0.03)",
            lineHeight: 1,
            pointerEvents: "none",
            userSelect: "none",
            fontFamily: "var(--sans)",
          }}
        >
          R
        </div>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              width: 20,
              height: 1,
              background: "var(--signal)",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          Glossary
        </div>
        <h1
          style={{
            fontSize: "clamp(26px, 5vw, 40px)",
            fontWeight: 800,
            letterSpacing: "-0.035em",
            color: "#fff",
            lineHeight: 1.1,
            marginBottom: 10,
            fontFamily: "var(--sans)",
          }}
        >
          Know the language.
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.6,
            maxWidth: 480,
          }}
        >
          Every term in the RawIntel system, plus the betting and stats
          vocabulary that shows up in every breakdown. Read smarter.
        </p>
      </div>

      {/* SEARCH BAR */}
      <div
        className="f2"
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border-med)",
          padding: "16px 40px",
          position: "sticky",
          top: 54,
          zIndex: 90,
          boxShadow: "0 2px 8px rgba(17,17,16,0.04)",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto", position: "relative" }}>
          <svg
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--muted-light)",
              pointerEvents: "none",
            }}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search terms…"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "11px 14px 11px 40px",
              fontFamily: "var(--sans)",
              fontSize: 14,
              fontWeight: 400,
              color: "var(--ink)",
              background: "var(--warm-white)",
              border: "1px solid var(--border-med)",
              borderRadius: 0,
              outline: "none",
              transition: "border-color 0.15s",
              WebkitAppearance: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.borderColor = "var(--signal)";
              (e.target as HTMLInputElement).style.background = "var(--surface)";
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor = "var(--border-med)";
              (e.target as HTMLInputElement).style.background = "var(--warm-white)";
            }}
          />
        </div>
      </div>

      <div
        style={{ maxWidth: 760, margin: "0 auto", padding: "48px 40px 80px" }}
      >
        {noResults && (
          <div
            style={{
              textAlign: "center",
              padding: "48px 20px",
              fontSize: 14,
              color: "var(--muted)",
            }}
          >
            <strong
              style={{
                display: "block",
                fontSize: 16,
                fontWeight: 700,
                color: "var(--ink)",
                marginBottom: 6,
              }}
            >
              No terms found.
            </strong>
            Try a different search — or clear it to browse the full list.
          </div>
        )}

        {filtered.map((cat, ci) => (
          <div
            key={cat.id}
            ref={(el) => {
              revealRefs.current[ci] = el;
            }}
            className="reveal"
            style={{ marginBottom: 52 }}
          >
            {/* Category header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 0,
                  background: "var(--cream)",
                  border: "1px solid var(--border-med)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: "var(--signal)",
                }}
              >
                {cat.icon}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  fontFamily: "var(--mono)",
                  color: "var(--muted)",
                }}
              >
                {cat.name}
              </div>
              <div
                style={{ flex: 1, height: 1, background: "var(--border-med)" }}
              />
            </div>

            {/* Term rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {cat.terms.map((term) => (
                <div
                  key={term.name}
                  className="glossary-term-row"
                  style={{
                    background: "var(--surface)",
                    borderRadius: 0,
                    border: "1px solid rgba(17,17,16,0.06)",
                    padding: "16px 20px",
                    display: "grid",
                    gridTemplateColumns: "200px 1fr",
                    gap: 24,
                    alignItems: "baseline",
                    boxShadow: "var(--shadow-sm)",
                    transition: "box-shadow 0.15s, transform 0.15s",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "0 2px 12px rgba(17,17,16,0.08)";
                    (e.currentTarget as HTMLElement).style.transform =
                      "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "var(--shadow-sm)";
                    (e.currentTarget as HTMLElement).style.transform =
                      "translateY(0)";
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        letterSpacing: "-0.01em",
                        color: "var(--ink)",
                      }}
                    >
                      {term.name}
                    </div>
                    {term.badge && (
                      <div
                        className={`conf-badge ${term.badge}`}
                        style={{ marginTop: 4 }}
                      >
                        <span className="dot" />
                        {term.badge === "cb-clear"
                          ? "Clear Spot"
                          : term.badge === "cb-lean"
                          ? "Lean"
                          : term.badge === "cb-fragile"
                          ? "Fragile"
                          : "Pass"}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "var(--ink-2)",
                      lineHeight: 1.6,
                    }}
                  >
                    {term.def}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <footer
        style={{
          textAlign: "center",
          padding: "24px 40px",
          fontSize: 12,
          color: "var(--muted-light)",
          lineHeight: 1.8,
        }}
      >
        For informational purposes only. RawIntel does not provide financial,
        betting, or investment advice. Bet responsibly.
        <br />
        <a
          href="https://ncpgambling.org"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "var(--muted)",
            textDecoration: "underline",
            textUnderlineOffset: "2px",
          }}
        >
          ncpgambling.org
        </a>
        {" · "}
        <Link
          href="/terms"
          style={{
            color: "var(--muted)",
            textDecoration: "underline",
            textUnderlineOffset: "2px",
          }}
        >
          Terms of Service
        </Link>
        {" · "}
        <Link
          href="/privacy"
          style={{
            color: "var(--muted)",
            textDecoration: "underline",
            textUnderlineOffset: "2px",
          }}
        >
          Privacy Policy
        </Link>
        {" · "}© RawIntel LLC
      </footer>
    </div>
    </>
  );
}
