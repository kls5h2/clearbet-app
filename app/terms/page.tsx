import Link from "next/link";
import Nav from "@/components/Nav";

export const metadata = {
  title: "Terms of Service — RawIntel",
  description: "Terms of service for RawIntel Sports LLC.",
};

export default function TermsPage() {
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
          Terms of Service
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
          <Section n="1" title="Acceptance of Terms">
            By accessing or using rawintelsports.com, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.
          </Section>

          <Section n="2" title="About RawIntel">
            RawIntel Sports LLC (&ldquo;RawIntel,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) operates rawintelsports.com, a sports data analysis and information platform. RawIntel provides structured game analysis for informational purposes only, to help users understand publicly available data. RawIntel is not a sportsbook, gambling operator, picks service, or financial advisor. We do not accept bets. We do not tell users what to bet.
          </Section>

          <Section n="3" title="Eligibility">
            You must be at least 18 years old to use RawIntel. By using this service you confirm you meet this requirement and that you are permitted to access sports analysis content in your jurisdiction.
          </Section>

          <Section n="4" title="Your Account">
            You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us immediately at{" "}
            <a href="mailto:kimberly@rawintelsports.com" style={linkStyle}>kimberly@rawintelsports.com</a>{" "}
            if you suspect unauthorized access. We are not liable for losses caused by unauthorized use of your account.
          </Section>

          <Section n="5" title="Subscription & Billing">
            RawIntel offers a free tier and a paid Pro tier. Pro subscriptions are billed on a recurring monthly ($9.99) basis. Subscriptions auto-renew unless cancelled before the renewal date. You may cancel at any time through your account settings. No refunds are issued for partial billing periods.
          </Section>

          <Section n="6" title="No Guarantee of Outcomes">
            All analysis is generated from available data at the time of generation. RawIntel does not predict outcomes. Past analysis does not predict future results. Nothing on this platform constitutes a guarantee, warranty, or promise of any kind regarding any sporting event or betting outcome.
          </Section>

          <Section n="7" title="Responsible Gambling">
            Sports betting involves real financial risk. RawIntel content is for informational purposes only and is not intended to encourage gambling. If you or someone you know has a gambling problem, help is available. Contact the National Council on Problem Gambling:{" "}
            <a href="tel:1-800-522-4700" style={linkStyle}>1-800-522-4700</a> or{" "}
            <a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer" style={linkStyle}>ncpgambling.org</a>.
          </Section>

          <Section n="8" title="Intellectual Property">
            All content on rawintelsports.com — including breakdowns, analysis, design, and copy — is owned by RawIntel Sports LLC. You may not reproduce, redistribute, or create derivative works from our content without written permission.
          </Section>

          <Section n="9" title="Prohibited Use">
            You may not resell, republish, scrape, or automate access to any content on RawIntel. You may not use the service for any unlawful purpose or in violation of any applicable laws or regulations.
          </Section>

          <Section n="10" title="Disclaimer of Warranties">
            RawIntel is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, express or implied. We do not warrant that the service will be uninterrupted, error-free, or free of harmful components.
          </Section>

          <Section n="11" title="Limitation of Liability">
            RawIntel&rsquo;s total liability to you for any claim is limited to the amount you paid us in the 30 days prior to the claim. We are not liable for any indirect, incidental, special, or consequential damages, including financial losses arising from decisions made using our content.
          </Section>

          <Section n="12" title="Termination">
            We reserve the right to suspend or terminate your account at any time for violation of these terms or for any other reason at our discretion. You may delete your account at any time through your account settings.
          </Section>

          <Section n="13" title="Governing Law">
            These terms are governed by the laws of the State of Missouri, without regard to conflict of law principles.
          </Section>

          <Section n="14" title="Changes">
            We may update these terms at any time. Continued use of the service after changes are posted constitutes acceptance of the revised terms.
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
      <p style={{ fontSize: 15, color: "var(--ink)", margin: 0 }}>
        {children}
      </p>
    </section>
  );
}
