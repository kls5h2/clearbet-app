import Nav from "@/components/Nav";

export const metadata = {
  title: "Terms of Service — RawIntel",
  description: "Terms of service for RawIntel Sports LLC.",
};

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p style={{ fontFamily: "var(--sans)", fontSize: "16px", color: "#9A9A96", lineHeight: 1.6, maxWidth: "520px", marginTop: "16px", marginBottom: 0 }}>
            RawIntel Sports LLC · Last updated April 21, 2026
          </p>
        </div>
      </div>

      <article style={{ maxWidth: "680px", margin: "0 auto", padding: "48px 24px 0", fontFamily: "var(--sans)", color: "var(--ink)", lineHeight: 1.75 }}>
        <Section n="1" title="About RawIntel">
          RawIntel Sports LLC (&ldquo;RawIntel,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) operates rawintelsports.com, a sports data analysis and information platform. RawIntel provides structured game analysis and educational content to help users make informed decisions. RawIntel is not a sportsbook, gambling operator, picks service, or financial advisor. We do not accept bets. We do not tell users what to bet.
        </Section>

        <Section n="2" title="Eligibility">
          You must be at least 18 years old to use RawIntel. By using this service you confirm you meet this requirement.
        </Section>

        <Section n="3" title="Subscription & Billing">
          RawIntel offers a free tier and paid Pro tier. Pro subscriptions are billed on a recurring monthly ($9.99) or annual ($79.00) basis. Subscriptions auto-renew unless cancelled before the renewal date. You may cancel at any time through your account settings. No refunds are issued for partial billing periods.
        </Section>

        <Section n="4" title="No Guarantee of Outcomes">
          All analysis is generated from available data at the time of generation. RawIntel does not predict outcomes. Past analysis does not predict future results. Nothing on this platform constitutes a guarantee, warranty, or promise of any kind regarding any sporting event.
        </Section>

        <Section n="5" title="Responsible Gambling">
          Sports betting involves real financial risk. If you or someone you know has a gambling problem, help is available. Contact the National Council on Problem Gambling:{" "}
          <a href="tel:1-800-522-4700" style={linkStyle}>1-800-522-4700</a> or{" "}
          <a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer" style={linkStyle}>ncpgambling.org</a>.
        </Section>

        <Section n="6" title="Prohibited Use">
          You may not resell, redistribute, republish, or scrape any content from RawIntel without written permission.
        </Section>

        <Section n="7" title="Limitation of Liability">
          RawIntel&rsquo;s total liability to you for any claim is limited to the amount you paid us in the 30 days prior to the claim. We are not liable for any indirect, incidental, or consequential damages.
        </Section>

        <Section n="8" title="Governing Law">
          These terms are governed by the laws of the State of Missouri.
        </Section>

        <Section n="9" title="Changes">
          We may update these terms at any time. Continued use of the service constitutes acceptance.
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
      <p style={{ fontSize: "15px", color: "var(--ink)", margin: 0 }}>
        {children}
      </p>
    </section>
  );
}
