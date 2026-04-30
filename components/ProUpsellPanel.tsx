import Link from "next/link";

interface Props {
  eyebrow?: string;
  heading: string;
  body: string;
  ctaLabel?: string;
}

/**
 * Standardized in-page upsell for Pro-gated surfaces (archive, my-breakdowns,
 * and anywhere else a free user lands on a Pro feature). Matches the dark-hero
 * treatment used on the breakdown page when the daily cap is hit.
 */
export default function ProUpsellPanel({
  eyebrow = "Pro Feature",
  heading,
  body,
  ctaLabel = "Upgrade to Pro",
}: Props) {
  return (
    <div style={{
      background: "var(--ink)",
      borderRadius: 0,
      padding: "56px 40px",
      position: "relative",
      overflow: "hidden",
      textAlign: "center",
    }}>
      <span aria-hidden="true" style={{
        position: "absolute", right: "-40px", top: "-60px",
        fontFamily: "Georgia, serif", fontSize: "360px", fontStyle: "italic",
        color: "rgba(217,59,58,0.07)", pointerEvents: "none", zIndex: 0, lineHeight: 1,
      }}>R.</span>
      <div style={{ position: "relative", zIndex: 1, maxWidth: "460px", margin: "0 auto" }}>
        <p style={{
          fontFamily: "var(--sans)", fontSize: "11px", textTransform: "uppercase",
          letterSpacing: "0.22em", color: "var(--signal)", marginBottom: "14px",
        }}>
          {eyebrow}
        </p>
        <h2 style={{
          fontFamily: "var(--serif)", fontSize: "clamp(26px, 3.5vw, 34px)",
          fontWeight: 500, color: "#FAFAFA", letterSpacing: "-0.02em",
          lineHeight: 1.2, margin: 0,
        }}>
          {heading}
        </h2>
        <p style={{
          fontFamily: "var(--sans)", fontSize: "15px", color: "#9A9A96",
          lineHeight: 1.6, marginTop: "16px", marginBottom: "24px",
        }}>
          {body}
        </p>
        <Link
          href="/pricing"
          style={{
            display: "inline-block",
            background: "var(--signal)", color: "#FAFAFA",
            fontFamily: "var(--sans)", fontSize: "13px", fontWeight: 500,
            letterSpacing: "0.04em", textDecoration: "none",
            padding: "12px 24px", borderRadius: 0,
          }}
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
