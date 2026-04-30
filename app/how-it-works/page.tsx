"use client";

import { useEffect } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";

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

const SIGNAL_FACTORS = [
  {
    num: "01",
    name: "Data Depth",
    desc: "How much relevant data exists for this matchup. Recent games, pace stats, efficiency splits, historical patterns.",
  },
  {
    num: "02",
    name: "Directional Clarity",
    desc: "How clearly the data points in one direction. High clarity means multiple factors align. Low clarity means conflict.",
  },
  {
    num: "03",
    name: "Market Alignment",
    desc: "Whether the betting market agrees or disagrees with the data read. Disagreement isn't always bad — sometimes it creates opportunity.",
  },
  {
    num: "04",
    name: "Fragility Score",
    desc: "How many things need to go right for the base script to hold. Fewer dependencies = higher grade.",
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
          RawIntel doesn't tell you what to bet. It gives you the same
          structured analysis on every game — so you can make an informed
          decision yourself.
        </p>
      </div>

      <div
        style={{ maxWidth: 760, margin: "0 auto", padding: "56px 40px 80px" }}
      >
        {/* PHILOSOPHY */}
        <div
         
          className="reveal"
          style={{
            background: "var(--ink)",
            borderRadius: 0,
            padding: "36px 40px",
            marginBottom: 56,
          }}
        >
          <div
            style={{
              fontSize: "clamp(18px, 3vw, 24px)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.45,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            <em style={{ fontStyle: "normal", color: "#fff" }}>
              There's a lot of noise in sports betting.
            </em>{" "}
            <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>
              Picks services tell you what to do. Data tools overwhelm you with
              numbers. Neither one actually helps you think.
            </span>
            <br />
            <br />
            <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>
              RawIntel takes the data, runs it through the same structured
              framework on every game, and hands you the read in plain English.
            </span>
            <br />
            <br />
            <span style={{ color: "var(--signal)" }}>
              What you do with it is always yours.
            </span>
          </div>
          <div
            style={{
              width: 32,
              height: 2,
              background: "var(--signal)",
              margin: "24px 0",
              opacity: 0.6,
            }}
          />
        </div>

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

        {/* SIGNAL GRADE */}
        <div className="reveal">
          <SectionEyebrow>Signal Grade</SectionEyebrow>
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
            A letter grade
            <br />
            for the data environment.
          </div>
          <div
            style={{ fontSize: 15, color: "var(--ink-2)", lineHeight: 1.75 }}
          >
            <p style={{ marginBottom: 14 }}>
              Signal Grade is a letter grade — A through D — that summarizes
              the overall quality of the data environment for a given game.
              It's not a confidence rating on the outcome. It's a rating of{" "}
              <strong style={{ fontWeight: 600, color: "var(--ink)" }}>
                how much signal the data contains
              </strong>
              .
            </p>
            <p>
              A high Signal Grade means the data is rich, directional, and
              consistent across multiple factors. A low grade means the data is
              noisy, conflicting, or thin.
            </p>
          </div>
        </div>

        <div
         
          className="reveal rd1"
          style={{
            background: "var(--surface)",
            borderRadius: 0,
            overflow: "hidden",
            border: "1px solid rgba(17,17,16,0.06)",
            boxShadow: "var(--shadow-sm)",
            marginTop: 28,
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "var(--ink)",
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 40,
                fontWeight: 600,
                color: "var(--signal)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              B+
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.35)",
                  marginBottom: 4,
                }}
              >
                Example Signal Grade
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.6)",
                  lineHeight: 1.4,
                }}
              >
                Strong data environment. Clear directional lean with specific,
                checkable fragility points.
              </div>
            </div>
          </div>
          {/* Factors */}
          <div
            style={{
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {SIGNAL_FACTORS.map((f) => (
              <div
                key={f.num}
                style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
              >
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    color: "var(--signal)",
                    flexShrink: 0,
                    paddingTop: 2,
                    minWidth: 20,
                  }}
                >
                  {f.num}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--ink)",
                      marginBottom: 2,
                    }}
                  >
                    {f.name}
                  </div>
                  <div
                    style={{
                      fontSize: 13.5,
                      color: "var(--muted)",
                      lineHeight: 1.5,
                    }}
                  >
                    {f.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Scale */}
          <div
            style={{
              margin: "0 24px 20px",
              padding: "16px 18px",
              background: "var(--cream)",
              borderRadius: 0,
            }}
          >
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--muted)",
                marginBottom: 12,
              }}
            >
              Grade Scale
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["A", "B+", "B", "B−", "C+", "C", "C−", "D"].map((g) => (
                <div
                  key={g}
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "5px 12px",
                    borderRadius: 0,
                    color: g === "B+" ? "#fff" : "var(--ink)",
                    background: g === "B+" ? "var(--signal)" : "var(--surface)",
                    border: `1px solid ${g === "B+" ? "var(--signal)" : "var(--border-med)"}`,
                  }}
                >
                  {g}
                </div>
              ))}
            </div>
          </div>
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

        {/* CTA BLOCK */}
        <div
         
          className="reveal"
          style={{
            background: "var(--ink)",
            borderRadius: 0,
            padding: 40,
            textAlign: "center",
            marginTop: 56,
          }}
        >
          <div
            style={{
              fontSize: "clamp(20px, 3.5vw, 28px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#fff",
              marginBottom: 10,
              lineHeight: 1.2,
            }}
          >
            Ready to read tonight's intel?
          </div>
          <p
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.4)",
              marginBottom: 28,
              lineHeight: 1.55,
            }}
          >
            Every game on tonight's slate has a breakdown ready. Start with
            one, free.
          </p>
          <Link
            href="/intel"
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
              textDecoration: "none",
              padding: "13px 32px",
              borderRadius: 0,
              background: "var(--signal)",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
              boxShadow: "0 2px 8px rgba(201,53,42,0.3)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#b02e24";
              (e.currentTarget as HTMLElement).style.transform =
                "translateY(-2px)";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 6px 20px rgba(201,53,42,0.4)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--signal)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 2px 8px rgba(201,53,42,0.3)";
            }}
          >
            See today's slate →
          </Link>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              color: "rgba(255,255,255,0.2)",
              marginTop: 16,
              letterSpacing: "0.04em",
            }}
          >
            Free account required · No card needed to start
          </div>
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
