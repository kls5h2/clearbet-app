import Link from "next/link";
import Nav from "@/components/Nav";

export const metadata = {
  title: "Privacy Policy — RawIntel",
  description: "Privacy policy for RawIntel Sports LLC.",
};

export default function PrivacyPage() {
  return (
    <div style={{ background: "var(--warm-white)", minHeight: "100vh" }}>
      <Nav />

      {/* HERO */}
      <div
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
          Legal
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
          Privacy Policy
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.6,
            maxWidth: 520,
            margin: 0,
          }}
        >
          RawIntel Sports LLC · Last updated May 1, 2026
        </p>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "56px 40px 80px" }}>
        <article style={{ maxWidth: 680, fontFamily: "var(--sans)", color: "var(--ink)", lineHeight: 1.75 }}>
          <Section n="1" title="What We Collect">
            <ul style={ulStyle}>
              <li>Email address (for account creation and communications)</li>
              <li>Usage data (breakdowns generated, features used, session activity)</li>
              <li>Device and browser information (IP address, browser type, referring URL) — collected automatically by our infrastructure</li>
              <li>Payment data — processed entirely by Stripe; we never see or store your card details</li>
            </ul>
          </Section>

          <Section n="2" title="How We Use It">
            <ul style={ulStyle}>
              <li>To provide and improve the RawIntel service</li>
              <li>To send account-related communications (billing, security, product updates)</li>
              <li>To process subscription payments via Stripe</li>
              <li>To monitor for abuse and maintain service integrity</li>
            </ul>
          </Section>

          <Section n="3" title="Data Processors">
            <ul style={ulStyle}>
              <li>
                <strong>Stripe</strong> handles all payment processing. See{" "}
                <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" style={linkStyle}>stripe.com/privacy</a>.
              </li>
              <li>
                <strong>Supabase</strong> stores account and usage data. See{" "}
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" style={linkStyle}>supabase.com/privacy</a>.
              </li>
              <li>
                <strong>Vercel</strong> hosts the application and handles web traffic. See{" "}
                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={linkStyle}>vercel.com/legal/privacy-policy</a>.
              </li>
            </ul>
          </Section>

          <Section n="4" title="Data Sharing">
            We do not sell your data. We do not share your data with third parties except as required to operate the service (Stripe, Supabase, Vercel) or as required by law.
          </Section>

          <Section n="5" title="Data Retention">
            We retain your data for as long as your account is active. You may delete your account at any time through your account settings, which removes your data from our systems. You may also request deletion by emailing{" "}
            <a href="mailto:kimberly@rawintelsports.com" style={linkStyle}>kimberly@rawintelsports.com</a>. We will complete verified deletion requests within 30 days.
          </Section>

          <Section n="6" title="Security">
            We implement industry-standard security measures including encrypted connections (HTTPS), secure authentication via Supabase, and payment processing entirely delegated to Stripe. No system is completely secure — if you believe your account has been compromised, contact us immediately.
          </Section>

          <Section n="7" title="Cookies">
            We use essential cookies to maintain your login session. We do not use tracking, advertising, or analytics cookies.
          </Section>

          <Section n="8" title="Children">
            RawIntel is intended for users 18 and older. We do not knowingly collect personal information from anyone under 18. If we become aware that we have collected data from a minor, we will delete it promptly.
          </Section>

          <Section n="9" title="California Residents (CCPA)">
            California residents have the right to know what personal data we collect, request deletion, and opt out of sale (we do not sell data). To exercise these rights, email{" "}
            <a href="mailto:kimberly@rawintelsports.com" style={linkStyle}>kimberly@rawintelsports.com</a>.
          </Section>

          <Section n="10" title="Changes">
            We may update this policy at any time. We will notify users of material changes by email. Continued use after changes are posted constitutes acceptance.
          </Section>

          <p style={{ marginTop: 40, paddingTop: 24, borderTop: "0.5px solid var(--border)", fontSize: 14, color: "var(--muted)" }}>
            Questions?{" "}
            <a href="mailto:kimberly@rawintelsports.com" style={linkStyle}>
              kimberly@rawintelsports.com
            </a>
          </p>
        </article>
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
  );
}

const linkStyle: React.CSSProperties = {
  color: "var(--signal)",
  textDecoration: "underline",
  textUnderlineOffset: "2px",
};

const ulStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  fontSize: 15,
  color: "var(--ink)",
};

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2
        style={{
          fontFamily: "var(--sans)",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--ink)",
          margin: 0,
          marginBottom: 8,
          letterSpacing: "-0.005em",
        }}
      >
        <span style={{ color: "var(--muted)", marginRight: 8, fontWeight: 500 }}>{n}.</span>
        {title}
      </h2>
      {typeof children === "string" ? (
        <p style={{ fontSize: 15, color: "var(--ink)", margin: 0 }}>{children}</p>
      ) : (
        <div style={{ fontSize: 15, color: "var(--ink)" }}>{children}</div>
      )}
    </section>
  );
}
