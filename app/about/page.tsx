import Nav from "@/components/Nav";
import Link from "next/link";

export const metadata = {
  title: "About — RawIntel",
  description: "Why I built RawIntel.",
};

const BODY_PARAGRAPHS = [
  "I'm not a lifelong sports fan. I love the NFL, always have, but other sports? I came to them late, mostly because I wanted to understand what I was betting and why.",
  "For a long time I just tailed my partner. He'd say bet this, I'd bet it. When it lost, I had no idea what went wrong. I couldn't fix anything because I didn't understand anything. That's a terrible feeling, especially if you're someone who needs to know why.",
  "I'm a lifetime learner. I don't follow blindly. So I started digging.",
  "The tools I found either threw data at me with no context or just told me what to bet. Neither helped. The picks services felt like outsourcing my thinking to someone with no accountability. The data sites assumed I already knew what I was looking at.",
  "There was nothing in the middle. Nothing that said: here's what the data actually says, in plain English, and the decision is yours.",
  "So I built it.",
  "Now I understand what I'm watching. I know why a line moves. I can look at a matchup and form my own view — and when I'm wrong, I understand why.",
  "That's what RawIntel is for. Not picks. Not someone else's conviction handed to you. Your cappers, your Discords, your group chats — use them. But know why you're in a game before you're in it. That's the whole thing.",
];

export default function AboutPage() {
  return (
    <div style={{ background: "var(--warm-white)", minHeight: "100vh" }}>
      <Nav />

      {/* Dark hero */}
      <div style={{
        background: "var(--ink)", padding: "32px 40px 36px",
        position: "relative", overflow: "hidden",
      }}>
        <span aria-hidden="true" style={{
          position: "absolute", right: "-5%", top: "50%", transform: "translateY(-50%)",
          fontSize: "clamp(120px, 30vw, 220px)", fontWeight: 900,
          color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.03)",
          lineHeight: 1, pointerEvents: "none", userSelect: "none",
        }}>R</span>

        <div style={{ maxWidth: "680px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{
            fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 600,
            letterSpacing: "0.2em", textTransform: "uppercase",
            color: "#8A8A86", marginBottom: "14px",
          }}>
            About
          </div>
          <h1 style={{
            fontFamily: "var(--sans)",
            fontSize: "clamp(26px, 5vw, 42px)", fontWeight: 700,
            letterSpacing: "-0.02em", color: "#fff", lineHeight: 1.15,
            margin: 0,
          }}>
            I built RawIntel because I needed it.
          </h1>
        </div>
      </div>

      {/* Body */}
      <div style={{ background: "var(--warm-white)", padding: "56px 40px 72px" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          {BODY_PARAGRAPHS.map((para, i) => (
            <p key={i} style={{
              fontSize: "17px", lineHeight: 1.8,
              color: "var(--ink-2)", marginBottom: "24px",
            }}>
              {para}
            </p>
          ))}
          <p style={{
            fontSize: "16px", fontStyle: "italic",
            color: "var(--muted)", marginTop: "8px", marginBottom: 0,
          }}>
            — Kim
          </p>
        </div>
      </div>

      {/* Closing strip */}
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

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "24px 40px", fontSize: "12px", color: "var(--muted-light)", lineHeight: 1.8 }}>
        For informational purposes only. RawIntel does not provide financial, betting, or investment advice. Problem gambling resources:{" "}
        <a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer" style={{ color: "var(--muted)", textDecoration: "underline", textUnderlineOffset: "2px" }}>ncpgambling.org</a>
        {" · "}<Link href="/terms" style={{ color: "var(--muted)", textDecoration: "underline", textUnderlineOffset: "2px" }}>Terms of Service</Link>
        {" · "}<Link href="/privacy" style={{ color: "var(--muted)", textDecoration: "underline", textUnderlineOffset: "2px" }}>Privacy Policy</Link>
        {" · "}© RawIntel LLC
      </footer>
    </div>
  );
}
