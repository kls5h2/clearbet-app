import Link from "next/link";
import Nav from "@/components/Nav";

const STEPS = [
  {
    num: "01",
    name: "Game Shape",
    what: "Sets the context before anything else. What kind of game is this — fast, slow, competitive, lopsided? Are there playoff implications, rest advantages, or motivation gaps?",
    source: "team records, pace, rest days, playoff standing",
  },
  {
    num: "02",
    name: "Key Drivers",
    what: "The 2–4 factors that will actually decide this game tonight. Not everything — just what materially matters. Color coded so you know instantly if each factor helps or hurts the expected outcome.",
    source: "player stats, injury reports, matchup history, usage rates",
  },
  {
    num: "03",
    name: "Base Script",
    what: "If nothing unexpected happens, this is how the game plays out. Not a prediction — a description of the most probable game shape based on the data.",
    source: "recent form, head-to-head history, team tendencies",
  },
  {
    num: "04",
    name: "Fragility Check",
    what: "The 2–3 things that could break the base script. Injury uncertainty, late lineup changes, variance risks. These are the wildcards — read them before you decide anything.",
    source: "injury reports, rotation instability, bullpen usage, weather",
  },
  {
    num: "05",
    name: "Market Read",
    what: "What the betting line is actually saying — in plain English. Every number gets translated into a real probability. Does the market line fit the data, or does something feel off?",
    source: "spread, total, moneyline, line movement from open",
  },
  {
    num: "06",
    name: "The Edge",
    what: "Where the data environment creates opportunity. Not a pick — a translation. What does all of the above mean for how different types of bettors should think about this game?",
    source: "synthesized from all previous steps",
  },
  {
    num: "07",
    name: "What This Means",
    what: "The lean — and the one thing that changes it. A direct summary of everything above in plain language. Always ends the same way: this is not a pick. Your decision is always yours.",
    source: "synthesized from all previous steps",
  },
];

const COLORS = [
  { dot: "#16A34A", label: "Green — Supports the script", desc: "This factor reinforces the expected outcome. Things going in the right direction." },
  { dot: "#DC2626", label: "Red — Works against it", desc: "This factor cuts against the expected outcome. A risk worth weighing." },
  { dot: "#3A5470", label: "Blue — Neutral context", desc: "Relevant information that isn't clearly positive or negative. Worth knowing." },
  { dot: "#D97706", label: "Amber — Injury or uncertainty", desc: "A player is questionable, a starter is unconfirmed, or something is unresolved. Check back closer to game time." },
];

const CONFIDENCE = [
  {
    strip: "#16A34A",
    badgeBg: "#DCFCE7", badgeColor: "#166534", label: "Clear",
    title: "One of the cleaner spots on the slate",
    desc: "The data points clearly in one direction. The environment is stable and the logic holds. Still not a lock — no game is — but the picture is unusually clear.",
  },
  {
    strip: "#0A7A6C",
    badgeBg: "#E6F4F2", badgeColor: "#0A7A6C", label: "Lean",
    title: "The game leans this way on paper",
    desc: "A directional read with real logic behind it. There are factors on both sides, but the stronger case sits in one direction. Read the Fragility Check before deciding.",
  },
  {
    strip: "#F59E0B",
    badgeBg: "#FEF3C7", badgeColor: "#92400E", label: "Fragile",
    title: "There is logic here, but it's fragile",
    desc: "The analysis holds — but it depends on a few things going right. One injury, one lineup change, one variance swing could flip the script entirely.",
  },
  {
    strip: "#C9D2DE",
    badgeBg: "#F1F4F8", badgeColor: "#64748B", label: "Pass",
    title: "This is a harder game to trust",
    desc: "Too many moving parts, too much uncertainty, or too little signal. The data doesn't land cleanly enough to form a strong view. Some games are better left alone.",
  },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#0A7A6C", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
      {children}
      <div style={{ flex: 1, height: "1px", background: "#E8ECF2" }} />
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <div style={{ background: "#F0F3F7", minHeight: "100vh", paddingBottom: "5rem" }}>
      <Nav activePage="how-it-works" />

      {/* Dark navy page header */}
      <div style={{ background: "#0D1B2E", padding: "2.5rem 1.5rem 2rem", marginBottom: "0" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#0A7A6C", marginBottom: "8px" }}>
            How It Works
          </p>
          <h1 style={{ fontSize: "30px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: "10px" }}>
            Understand the game.<br />Make your own call.
          </h1>
          <p style={{ fontSize: "14px", color: "#637A96", fontWeight: 500, lineHeight: 1.6, maxWidth: "440px" }}>
            ClearBet turns raw sports data into plain-English analysis. No picks. No pressure. Just a clear picture of what the data says.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "2rem 1.5rem 0" }}>

        {/* What ClearBet is */}
        <div style={{ marginBottom: "2.5rem" }}>
          <SectionLabel>What ClearBet is</SectionLabel>
          <div style={{ background: "#FFFFFF", borderRadius: "14px", padding: "22px", boxShadow: "0 2px 10px rgba(13,27,46,0.07), 0 1px 3px rgba(13,27,46,0.04)", marginBottom: "10px" }}>
            <p style={{ fontSize: "17px", fontWeight: 700, color: "#0D1B2E", lineHeight: 1.55, letterSpacing: "-0.01em", marginBottom: "12px" }}>
              ClearBet is a decision-support tool — not a picks service.
            </p>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "#637A96", lineHeight: 1.7 }}>
              Every breakdown gives you a structured read on a game: what kind of game it is, what factors matter most, what the market is implying, and where the edge lives. What you do with that information is always your call.
            </p>
          </div>
        </div>

        {/* The seven-step breakdown */}
        <div style={{ marginBottom: "2.5rem" }}>
          <SectionLabel>The seven-step breakdown</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {STEPS.map((step) => (
              <div
                key={step.num}
                style={{
                  background: "#FFFFFF", borderRadius: "14px", padding: "18px 20px",
                  boxShadow: "0 1px 4px rgba(13,27,46,0.05)",
                  display: "flex", gap: "16px", alignItems: "flex-start",
                }}
              >
                {/* Circle number */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "50%",
                    background: "#E6F4F2", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "12px", fontWeight: 800, color: "#0A7A6C",
                  }}>
                    {step.num}
                  </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, paddingTop: "4px" }}>
                  <p style={{ fontSize: "13px", fontWeight: 800, color: "#0D1B2E", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "6px" }}>
                    {step.name}
                  </p>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#3A5470", lineHeight: 1.55, marginBottom: "6px" }}>
                    {step.what}
                  </p>
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "#B0BAC9", letterSpacing: "0.02em" }}>
                    <strong style={{ color: "#637A96", fontWeight: 700 }}>Data:</strong> {step.source}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What the colors mean */}
        <div style={{ marginBottom: "2.5rem" }}>
          <SectionLabel>What the colors mean</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {COLORS.map((c) => (
              <div
                key={c.label}
                style={{
                  background: "#FFFFFF", borderRadius: "12px", padding: "14px 18px",
                  display: "flex", alignItems: "center", gap: "14px",
                  boxShadow: "0 1px 4px rgba(13,27,46,0.05)",
                }}
              >
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: "12px", fontWeight: 800, color: "#0D1B2E", marginBottom: "2px" }}>{c.label}</p>
                  <p style={{ fontSize: "12px", fontWeight: 500, color: "#637A96", lineHeight: 1.5 }}>{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Confidence levels */}
        <div style={{ marginBottom: "2.5rem" }}>
          <SectionLabel>Confidence levels</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {CONFIDENCE.map((c) => (
              <div
                key={c.label}
                style={{
                  background: "#FFFFFF", borderRadius: "12px", padding: "14px 18px",
                  display: "flex", gap: "14px", alignItems: "flex-start",
                  boxShadow: "0 1px 4px rgba(13,27,46,0.05)",
                }}
              >
                <div style={{ width: "3px", borderRadius: "3px", alignSelf: "stretch", flexShrink: 0, background: c.strip }} />
                <div>
                  <span style={{
                    fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em",
                    textTransform: "uppercase", padding: "3px 10px", borderRadius: "999px",
                    display: "inline-flex", marginBottom: "8px",
                    background: c.badgeBg, color: c.badgeColor,
                  }}>
                    {c.label}
                  </span>
                  <p style={{ fontSize: "13px", fontWeight: 800, color: "#0D1B2E", marginBottom: "4px" }}>{c.title}</p>
                  <p style={{ fontSize: "13px", fontWeight: 500, color: "#637A96", lineHeight: 1.55 }}>{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Understanding The Edge */}
        <div style={{ marginBottom: "2.5rem" }}>
          <SectionLabel>Understanding The Edge</SectionLabel>
          <div style={{ background: "#FFFFFF", borderRadius: "14px", padding: "22px", boxShadow: "0 2px 10px rgba(13,27,46,0.07), 0 1px 3px rgba(13,27,46,0.04)", marginBottom: "10px" }}>
            <p style={{ fontSize: "16px", fontWeight: 800, color: "#0D1B2E", marginBottom: "10px", letterSpacing: "-0.01em" }}>
              The Edge isn&apos;t a pick. It&apos;s a translation.
            </p>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "#637A96", lineHeight: 1.7, marginBottom: "14px" }}>
              Most betting tools either give you raw data or tell you what to bet. ClearBet does neither. The Edge takes everything in the breakdown and identifies what kind of environment this game creates — for the spread, the total, or player props. You take it from there.
            </p>
            <div style={{ background: "#F0FAF8", borderRadius: "8px", padding: "12px 14px" }}>
              <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#0A7A6C", marginBottom: "6px" }}>
                Example
              </p>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#096059", lineHeight: 1.55 }}>
                &ldquo;The season series data — two games decided by single digits — creates an environment that challenges a spread this large, regardless of Houston&apos;s current form.&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: "#0D1B2E", borderRadius: "14px", padding: "24px 22px", textAlign: "center", marginTop: "2.5rem" }}>
          <p style={{ fontSize: "18px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em", marginBottom: "8px" }}>
            Ready to read a breakdown?
          </p>
          <p style={{ fontSize: "13px", color: "#637A96", fontWeight: 500, marginBottom: "18px", lineHeight: 1.6 }}>
            Pick any game on tonight&apos;s slate and see the full seven-step analysis in under 60 seconds.
          </p>
          <Link
            href="/"
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: "#0A7A6C", color: "white", fontSize: "13px", fontWeight: 800,
              padding: "10px 22px", borderRadius: "999px", letterSpacing: "0.01em",
              textDecoration: "none",
            }}
          >
            View Tonight&apos;s Slate →
          </Link>
        </div>

      </div>
    </div>
  );
}
