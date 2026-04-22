import Nav from "@/components/Nav";

export const metadata = {
  title: "Privacy Policy — RawIntel",
  description: "Privacy policy for RawIntel Sports LLC.",
};

export default function PrivacyPage() {
  return (
    <div style={{ background: "var(--canvas)", minHeight: "100vh", paddingBottom: "5rem" }}>
      <Nav />

      {/* Dark hero — standardized */}
      <div style={{ background: "var(--ink)", minHeight: "280px", padding: "72px 24px 64px", position: "relative", overflow: "hidden", display: "flex", alignItems: "center" }}>
        <span aria-hidden="true" style={{
          position: "absolute", right: "-60px", top: "-80px",
          fontFamily: "Georgia, serif", fontSize: "520px", fontStyle: "italic",
          color: "rgba(217,59,58,0.07)", pointerEvents: "none", zIndex: 0, lineHeight: 1,
        }}>R.</span>
        <div style={{ maxWidth: "720px", margin: "0 auto", position: "relative", zIndex: 1, width: "100%" }}>
          <p style={{ fontFamily: "var(--sans)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.22em", color: "var(--signal)", marginBottom: "16px" }}>
            Legal
          </p>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 500, color: "#FAFAFA", letterSpacing: "-0.025em", lineHeight: 1.1, maxWidth: "680px", margin: 0 }}>
            Privacy Policy
          </h1>
          <p style={{ fontFamily: "var(--sans)", fontSize: "16px", color: "#9A9A96", lineHeight: 1.6, maxWidth: "520px", marginTop: "16px", marginBottom: 0 }}>
            RawIntel Sports LLC · Last updated April 21, 2026
          </p>
        </div>
      </div>

      <article style={{ maxWidth: "680px", margin: "0 auto", padding: "48px 24px 0", fontFamily: "var(--sans)", color: "var(--ink)", lineHeight: 1.75 }}>
        <Section n="1" title="What We Collect">
          <ul style={ulStyle}>
            <li>Email address (for account creation and communications)</li>
            <li>Usage data (breakdowns generated, features used)</li>
            <li>Payment data (processed by Stripe — we never see or store your card details)</li>
          </ul>
        </Section>

        <Section n="2" title="How We Use It">
          <ul style={ulStyle}>
            <li>To provide and improve the service</li>
            <li>To send account-related communications</li>
            <li>To process subscription payments via Stripe</li>
          </ul>
        </Section>

        <Section n="3" title="Data Processors">
          <ul style={ulStyle}>
            <li>
              Stripe handles all payment processing. See Stripe&rsquo;s privacy policy at{" "}
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" style={linkStyle}>stripe.com/privacy</a>.
            </li>
            <li>
              Supabase stores account and usage data. See Supabase&rsquo;s privacy policy at{" "}
              <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" style={linkStyle}>supabase.com/privacy</a>.
            </li>
          </ul>
        </Section>

        <Section n="4" title="Data Sharing">
          We do not sell your data. We do not share your data with third parties except as required to operate the service (Stripe, Supabase) or as required by law.
        </Section>

        <Section n="5" title="Data Retention">
          We retain your data for as long as your account is active. You may request deletion at any time by emailing{" "}
          <a href="mailto:kimberly@rawintelsports.com" style={linkStyle}>kimberly@rawintelsports.com</a>. We will delete your data within 30 days of a verified request.
        </Section>

        <Section n="6" title="California Residents (CCPA)">
          California residents have the right to know what personal data we collect, request deletion, and opt out of sale (we do not sell data). To exercise these rights, email{" "}
          <a href="mailto:kimberly@rawintelsports.com" style={linkStyle}>kimberly@rawintelsports.com</a>.
        </Section>

        <Section n="7" title="Cookies">
          We use essential cookies to maintain your session. We do not use tracking or advertising cookies.
        </Section>

        <Section n="8" title="Changes">
          We may update this policy at any time. We will notify users of material changes by email.
        </Section>

        <p style={{ marginTop: "40px", paddingTop: "24px", borderTop: "0.5px solid var(--border)", fontSize: "14px", color: "var(--muted)" }}>
          Contact:{" "}
          <a href="mailto:kimberly@rawintelsports.com" style={linkStyle}>
            kimberly@rawintelsports.com
          </a>
        </p>
      </article>
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
  paddingLeft: "20px",
  fontSize: "15px",
  color: "var(--ink)",
};

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "28px" }}>
      <h2 style={{
        fontFamily: "var(--sans)", fontSize: "14px", fontWeight: 600,
        color: "var(--ink)", margin: 0, marginBottom: "8px",
        letterSpacing: "-0.005em",
      }}>
        <span style={{ color: "var(--muted)", marginRight: "8px", fontWeight: 500 }}>{n}.</span>
        {title}
      </h2>
      {typeof children === "string" ? (
        <p style={{ fontSize: "15px", color: "var(--ink)", margin: 0 }}>{children}</p>
      ) : (
        <div style={{ fontSize: "15px", color: "var(--ink)" }}>{children}</div>
      )}
    </section>
  );
}
