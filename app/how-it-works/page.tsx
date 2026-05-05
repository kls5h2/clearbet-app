"use client";

import { useEffect } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import type { AnyGame, BreakdownResult } from "@/lib/types";
import BreakdownView from "@/components/BreakdownView";

const SAMPLE_BREAKDOWN: BreakdownResult = {
  gameShape: "Game 5 of the OKC–Memphis First Round series is a half-court game by design. Both teams prefer structured offense — OKC through SGA isolation, Memphis through Morant creation — and pace in Games 3 and 4 averaged 95.3 possessions, confirming neither team is playing fast. Memphis arrives facing elimination, adding defensive intensity but also the risk of forcing offense in situations the data doesn't support. OKC is deeper and more efficient in the half-court; this environment favors them.",
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
  baseScript: "OKC controls pace through three quarters — SGA operates in the mid-range and isolation, JJJ's foul trouble limits Memphis's interior defense, and Memphis cannot generate clean half-court offense against OKC's switching scheme. If Morant remains limited, Memphis has no reliable creation mechanism late and OKC closes with their fourth-quarter execution advantage. Projected range: OKC 109, Memphis 98 — combined 207, well under the posted 211.5.",
  fragilityCheck: [
    { item: "Morant plays 36+ minutes at full speed — if Morant is fully available tonight, Memphis's half-court creation rate climbs back toward its regular-season mark and the expected margin compresses significantly.", color: "red" },
    { item: "Jaren Jackson Jr. availability — JJJ is listed questionable with knee inflammation. A scratched JJJ removes Memphis's primary rim protection and would push the expected total well below 211.5.", color: "amber" },
    { item: "OKC abandons half-court structure — OKC pushed their transition rate in Game 2, a game they lost. If they leave the disciplined approach that produced wins in Games 3 and 4, Memphis generates transition buckets and the spread margin shrinks.", color: "red" },
  ],
  marketRead: "The spread has moved 1.5 points toward OKC since open — from OKC -7 to OKC -8.5. That movement is notable against elimination urgency, which typically drives public money toward the underdog side; the market is pricing OKC's closing execution over desperation variance. The total has held at 211.5 since open, consistent with the market accepting the half-court pace environment both teams established in Games 3 and 4.",
  edge: [
    "The data points toward OKC covering -8.5 based on their fourth-quarter net rating (+8.4) and SGA's 1.21 PPP efficiency against Memphis's single-coverage scheme. The stronger case is OKC covering if Morant remains limited — this read changes if he's confirmed full go at game time.",
    "Base Script projects a combined 207. The stronger case is the under on 211.5 because pace in Games 3 and 4 has averaged 95.3 possessions and OKC's defensive structure has held Memphis to their lowest transition scoring rate of the series.",
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
  gameId: "hiw-sample-okc-mem",
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

function HeroEyebrow({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--mono)",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--signal)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 14,
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
      {children}
    </div>
  );
}

const STEPS = [
  {
    num: "Step 01",
    name: "Game Shape",
    desc: (
      <>
        The first question:{" "}
        <strong style={{ fontWeight: 600, color: "var(--ink)" }}>
          what kind of game is this?
        </strong>{" "}
        Fast or slow? High-scoring or a grinder? Playoff intensity or regular
        season? Game shape sets the context for everything that follows.
      </>
    ),
    example:
      '"This is a pace control game. Denver wants structure. Minnesota wants chaos. Whoever wins that battle sets the tone for everything else."',
  },
  {
    num: "Step 02",
    name: "Key Drivers",
    desc: (
      <>
        Two or three factors that will{" "}
        <strong style={{ fontWeight: 600, color: "var(--ink)" }}>
          actually decide this game
        </strong>
        . Not a list of everything — just what materially matters tonight.
        Color-coded so you know at a glance whether each factor supports or
        threatens the expected outcome.
      </>
    ),
    example:
      '"Denver\'s half-court execution rate is elite. Supports the script. Gobert\'s availability is unconfirmed. Injury uncertainty."',
  },
  {
    num: "Step 03",
    name: "Base Script",
    desc: (
      <>
        If nothing unexpected happens,{" "}
        <strong style={{ fontWeight: 600, color: "var(--ink)" }}>
          this is how the game most likely plays out
        </strong>
        . Not a prediction — a structured description of the most probable game
        shape given the data. The foundation everything else is built on.
      </>
    ),
    example:
      '"Denver controls pace, Jokić operates in space, the game stays tight and goes under the total."',
  },
  {
    num: "Step 04",
    name: "Fragility Check",
    desc: (
      <>
        <strong style={{ fontWeight: 600, color: "var(--ink)" }}>
          What breaks the base script?
        </strong>{" "}
        Specific, checkable things — an injury, a lineup change, a weather
        shift — that would flip the expected outcome. Read this before you
        decide anything.
      </>
    ),
    example:
      '"If Gobert plays healthy, Denver\'s paint efficiency drops and this tightens considerably. Check his status before game time."',
  },
  {
    num: "Step 05",
    name: "Market Read",
    desc: (
      <>
        <strong style={{ fontWeight: 600, color: "var(--ink)" }}>
          What the betting line is actually saying
        </strong>{" "}
        — in plain English. Line movement, where sharp money is going, whether
        the market agrees or disagrees with the data. Not a reason to bet —
        context for your decision.
      </>
    ),
    example:
      '"Denver opened −3 and has been bet to −1.5. Sharp money is on Minnesota. The market knows something worth factoring in."',
  },
  {
    num: "Step 06",
    name: "What This Means",
    desc: (
      <>
        The summary. Everything above, distilled into{" "}
        <strong style={{ fontWeight: 600, color: "var(--ink)" }}>
          one clear read
        </strong>{" "}
        — what the data says, where the edge environment is, and what areas are
        worth looking at across spread, total, and props. Always ends the same
        way.
      </>
    ),
    example:
      '"This is not a pick. This is what the data says. Your decision is always yours."',
  },
];

const CONF_LEVELS = [
  {
    cls: "cb-clear",
    bar: "var(--clear)",
    label: "Clear Spot",
    title: "The data points cleanly in one direction.",
    desc: "The environment is stable, the logic holds, and the key factors align. This doesn't mean it's a lock — no game is. It means the picture is unusually clear tonight.",
    example:
      '"Denver\'s pace advantage is real, the market confirms it, and the fragility points are specific and checkable."',
  },
  {
    cls: "cb-lean",
    bar: "var(--lean)",
    label: "Lean",
    title: "There's a directional read — but it's not clean.",
    desc: "Real factors point one way, but there's enough noise on the other side to keep this from being a clear spot. Worth reading before deciding.",
    example:
      '"The data leans Detroit, but Orlando\'s home court advantage and low total create real variance risk."',
  },
  {
    cls: "cb-fragile",
    bar: "var(--fragile)",
    label: "Fragile",
    title: "The logic holds — but it depends on a few things going right.",
    desc: "One injury, one lineup change, one early momentum shift could flip this entirely. Read the fragility check carefully before doing anything with this game.",
    example:
      '"This analysis holds if Gobert plays. If he doesn\'t, the entire picture changes."',
  },
  {
    cls: "cb-pass",
    bar: "var(--pass)",
    label: "Pass",
    title: "Too many moving parts to form a strong view.",
    desc: "The data doesn't land clearly enough to warrant a strong opinion. Some games are just hard to read. Knowing when to pass is part of thinking clearly about betting.",
    example:
      '"High variance matchup. Both rosters have injury uncertainty and the line has moved in both directions this week."',
  },
];

const DNA_TAGS = [
  {
    tag: "⚡ Transition Clash",
    def: (
      <>
        Both teams play at different tempos.{" "}
        <strong style={{ fontWeight: 600, color: "var(--ink)" }}>
          Whoever forces their pace controls the game.
        </strong>{" "}
        Watch early possessions — the first team to establish their preferred
        speed usually wins that battle.
      </>
    ),
  },
  {
    tag: "🧱 Half-Court",
    def: (
      <>
        Slow, deliberate game. Teams run set plays, fewer fast breaks.{" "}
        <strong style={{ fontWeight: 600, color: "var(--ink)" }}>
          Totals are usually lower.
        </strong>{" "}
        Execution matters more than athleticism. Defense has more time to set
        up.
      </>
    ),
  },
  {
    tag: "🎯 Star Driven",
    def: (
      <>
        This game is decided by one or two key players.{" "}
        <strong style={{ fontWeight: 600, color: "var(--ink)" }}>
          Their performance tonight determines the outcome.
        </strong>{" "}
        Check injury reports and recent form before deciding anything.
      </>
    ),
  },
  {
    tag: "🧨 Volatile",
    def: (
      <>
        High variance game.{" "}
        <strong style={{ fontWeight: 600, color: "var(--ink)" }}>
          The outcome is harder to predict than the line suggests.
        </strong>{" "}
        Could go either way by a large margin. Props and totals are especially
        risky here.
      </>
    ),
  },
  {
    tag: "💤 Low Ceiling",
    def: (
      <>
        Limited scoring upside for both teams.{" "}
        <strong style={{ fontWeight: 600, color: "var(--ink)" }}>
          This game is unlikely to blow open.
        </strong>{" "}
        Strong defensive matchup, slow pace, or both. The under is often the
        natural lean.
      </>
    ),
  },
];

export default function HowItWorksPage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.08 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
    <style>{`
      @media (max-width: 768px) {
        .hiw-step-row {
          grid-template-columns: 1fr !important;
          gap: 12px !important;
        }
      }
    `}</style>
    <div style={{ background: "var(--warm-white)", minHeight: "100vh" }}>
      <Nav activePage="how-it-works" />

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
        <HeroEyebrow>How It Works</HeroEyebrow>
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
          Not picks.
          <br />A system for thinking.
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.6,
            maxWidth: 520,
          }}
        >
          RawIntel takes the data through the same structured framework on every game and hands you the read in plain English.
        </p>
      </div>

      <div
        style={{ maxWidth: 760, margin: "0 auto", padding: "56px 40px 80px" }}
      >
        {/* SIX STEPS HEADER */}
        <div
         
          className="reveal"
        >
          <SectionEyebrow>The Breakdown Framework</SectionEyebrow>
          <div
            style={{
              fontSize: "clamp(24px, 4vw, 34px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--ink)",
              lineHeight: 1.1,
              marginBottom: 16,
            }}
          >
            Six steps.
            <br />
            Every game. Every time.
          </div>
          <p style={{ fontSize: 15, color: "var(--ink-2)", lineHeight: 1.75, marginBottom: 0 }}>
            Every breakdown on RawIntel follows the same six steps — in the
            same order. That's intentional. Once you know the framework, you
            can read any breakdown in under two minutes and know exactly where
            you are.
          </p>
        </div>

        {/* STEP ROWS */}
        <div style={{ marginTop: 32 }}>
          {STEPS.map((step) => (
            <div
              key={step.num}

              className="reveal hiw-step-row"
              style={{
                display: "grid",
                gridTemplateColumns: "180px 1fr",
                gap: 32,
                padding: "24px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    color: "var(--signal)",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  {step.num}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                    color: "var(--ink)",
                  }}
                >
                  {step.name}
                </div>
              </div>
              <div>
                <p
                  style={{
                    fontSize: 15,
                    color: "var(--ink-2)",
                    lineHeight: 1.65,
                    marginBottom: 12,
                  }}
                >
                  {step.desc}
                </p>
                <div
                  style={{
                    background: "var(--cream)",
                    borderRadius: 0,
                    borderLeft: "2px solid var(--border-strong)",
                    padding: "12px 14px",
                    fontSize: 13.5,
                    color: "var(--muted)",
                    lineHeight: 1.55,
                    fontStyle: "italic",
                  }}
                >
                  {step.example}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* SAMPLE BREAKDOWN */}
        <div className="reveal" style={{ marginTop: 48 }}>
          {/* Prominent sample banner */}
          <div style={{
            background: "var(--ink)",
            padding: "16px 20px",
            display: "flex", alignItems: "center", gap: "14px",
            borderBottom: "none",
          }}>
            <div style={{
              background: "var(--signal)", color: "#fff",
              fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 700,
              letterSpacing: "0.14em", textTransform: "uppercase",
              padding: "5px 12px", flexShrink: 0,
            }}>
              Sample Breakdown
            </div>
            <div style={{
              fontSize: "13px",
              color: "rgba(255,255,255,0.45)",
              lineHeight: 1.4,
            }}>
              This is an example breakdown — not a live game. Real breakdowns look exactly like this.
            </div>
            <div style={{
              marginLeft: "auto", flexShrink: 0,
              fontFamily: "var(--mono)", fontSize: "11px",
              color: "rgba(255,255,255,0.2)", letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}>
              OKC vs MEM · Game 5
            </div>
          </div>
          <BreakdownView breakdown={SAMPLE_BREAKDOWN} game={SAMPLE_GAME} />
        </div>

        {/* DIVIDER */}
        <div
          style={{ height: 1, background: "var(--border-med)", margin: "56px 0" }}
        />

        {/* CONFIDENCE LEVELS */}
        <div
         
          className="reveal"
        >
          <SectionEyebrow>Confidence Levels</SectionEyebrow>
          <div
            style={{
              fontSize: "clamp(24px, 4vw, 34px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--ink)",
              lineHeight: 1.1,
              marginBottom: 16,
            }}
          >
            Four levels.
            <br />
            One honest read.
          </div>
          <p style={{ fontSize: 15, color: "var(--ink-2)", lineHeight: 1.75 }}>
            Every breakdown gets a confidence level. It's not a rating of how
            likely you are to win — it's an honest assessment of how clear the
            data picture is. Some games are clean. Some are a mess. We tell you
            which is which.
          </p>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 28 }}
        >
          {CONF_LEVELS.map((level, i) => (
            <div
              key={level.label}
             
              className={`reveal ${i > 0 ? `rd${i}` : ""}`}
              style={{
                background: "var(--surface)",
                borderRadius: 0,
                border: "1px solid rgba(17,17,16,0.06)",
                overflow: "hidden",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div style={{ height: 4, background: level.bar }} />
              <div style={{ padding: "18px 20px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <div className={`conf-badge ${level.cls}`}>
                    <span className="dot" />
                    {level.label}
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      color: "var(--ink)",
                    }}
                  >
                    {level.title}
                  </div>
                </div>
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--ink-2)",
                    lineHeight: 1.6,
                    marginBottom: 10,
                  }}
                >
                  {level.desc}
                </p>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--muted)",
                    fontStyle: "italic",
                    lineHeight: 1.5,
                    padding: "10px 12px",
                    background: "var(--cream)",
                    borderRadius: 0,
                  }}
                >
                  {level.example}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* DIVIDER */}
        <div
          style={{ height: 1, background: "var(--border-med)", margin: "56px 0" }}
        />

        {/* DNA TAGS */}
        <div className="reveal">
          <SectionEyebrow>Game DNA Tags</SectionEyebrow>
          <div
            style={{
              fontSize: "clamp(24px, 4vw, 34px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--ink)",
              lineHeight: 1.1,
              marginBottom: 16,
            }}
          >
            Instant game shape
            <br />
            at a glance.
          </div>
          <p style={{ fontSize: 15, color: "var(--ink-2)", lineHeight: 1.75 }}>
            DNA tags give you the game's character in a word or two. They
            appear on every breakdown card so you can understand the game type
            before you read a single line of analysis.
          </p>
        </div>

        <div
         
          className="reveal rd1"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginTop: 28,
          }}
        >
          {DNA_TAGS.map((tag) => (
            <div
              key={tag.tag}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                padding: "14px 18px",
                background: "var(--surface)",
                borderRadius: 0,
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "var(--muted)",
                  background: "var(--cream)",
                  border: "1px solid var(--border-med)",
                  padding: "4px 10px",
                  borderRadius: 0,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {tag.tag}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "var(--ink-2)",
                  lineHeight: 1.55,
                }}
              >
                {tag.def}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <div style={{ textAlign: "center", padding: "56px 40px", background: "var(--warm-white)" }}>
        <Link
          href="/"
          style={{
            fontSize: "15px", fontWeight: 700, color: "var(--ink)",
            textDecoration: "none", borderBottom: "2px solid var(--signal)",
            paddingBottom: "3px",
          }}
        >
          See today's slate →
        </Link>
      </div>

      {/* ── Closing line ─────────────────────────────────────────────── */}
      <div style={{ background: "var(--ink)", padding: "80px 40px", textAlign: "center" }}>
        <div style={{
          maxWidth: "560px", margin: "0 auto",
          fontSize: "clamp(22px, 4vw, 34px)",
          fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.3,
          color: "rgba(255,255,255,0.4)",
        }}>
          This is not a pick. This is what the data says.{" "}
          <span style={{ color: "#fff" }}>Your decision is always yours.</span>
        </div>
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
        betting, or investment advice. Problem gambling resources:{" "}
        <a
          href="https://www.ncpgambling.org"
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
