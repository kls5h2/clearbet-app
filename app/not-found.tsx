import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ background: "var(--ink)", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "var(--sans)" }}>
      <style>{`
        @keyframes nfFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nf-f1 { animation: nfFadeUp 0.6s 0.10s cubic-bezier(0.16,1,0.3,1) both; }
        .nf-f2 { animation: nfFadeUp 0.6s 0.22s cubic-bezier(0.16,1,0.3,1) both; }
        .nf-f3 { animation: nfFadeUp 0.6s 0.34s cubic-bezier(0.16,1,0.3,1) both; }
        .nf-f4 { animation: nfFadeUp 0.6s 0.46s cubic-bezier(0.16,1,0.3,1) both; }
        .nf-btn-primary:hover { background: #b02e24 !important; transform: translateY(-2px); box-shadow: 0 4px 16px rgba(201,53,42,0.4) !important; }
        .nf-btn-secondary:hover { color: #fff !important; border-color: rgba(255,255,255,0.25) !important; }
      `}</style>

      {/* Nav — brand only */}
      <nav style={{ padding: "0 40px", height: "54px", display: "flex", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <Link href="/" style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.03em", textDecoration: "none", color: "#fff" }}>
          Raw<span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>Intel</span><span style={{ color: "var(--signal)" }}>.</span>
        </Link>
      </nav>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>

        {/* Ghost 404 watermark */}
        <div aria-hidden style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          fontSize: "clamp(180px,30vw,320px)", fontWeight: 900, letterSpacing: "-0.06em",
          color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.03)",
          lineHeight: 1, pointerEvents: "none", userSelect: "none", whiteSpace: "nowrap",
          fontFamily: "var(--sans)",
        }}>404</div>

        {/* Radial signal glow */}
        <div aria-hidden style={{
          position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)",
          width: "60vw", height: "60vw", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,53,42,0.07) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />

        {/* Eyebrow */}
        <div className="nf-f1" style={{ fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--signal)", display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", position: "relative", zIndex: 1 }}>
          <span style={{ width: "20px", height: "1px", background: "var(--signal)", display: "inline-block", flexShrink: 0 }} />
          Page Not Found
          <span style={{ width: "20px", height: "1px", background: "var(--signal)", display: "inline-block", flexShrink: 0 }} />
        </div>

        {/* Headline */}
        <h1 className="nf-f2" style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.05, color: "#fff", marginBottom: "14px", position: "relative", zIndex: 1 }}>
          This page doesn&apos;t exist.<br />The board does.
        </h1>

        {/* Sub */}
        <p className="nf-f3" style={{ fontSize: "15px", color: "rgba(255,255,255,0.4)", lineHeight: 1.65, maxWidth: "380px", margin: "0 auto 36px", position: "relative", zIndex: 1 }}>
          Whatever you were looking for isn&apos;t here. Tonight&apos;s slate is live — that&apos;s a good place to start.
        </p>

        {/* Actions */}
        <div className="nf-f3" style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", position: "relative", zIndex: 1 }}>
          <Link
            href="/"
            className="nf-btn-primary"
            style={{
              fontSize: "13.5px", fontWeight: 700, color: "#fff", textDecoration: "none",
              padding: "12px 28px", borderRadius: 0, background: "var(--signal)",
              display: "flex", alignItems: "center", gap: "7px",
              transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
              boxShadow: "0 2px 8px rgba(201,53,42,0.3)",
            }}
          >
            See today&apos;s intel →
          </Link>
          <Link
            href="/"
            className="nf-btn-secondary"
            style={{
              fontSize: "13.5px", fontWeight: 500, color: "rgba(255,255,255,0.5)", textDecoration: "none",
              padding: "12px 22px", borderRadius: 0, border: "1px solid rgba(255,255,255,0.1)",
              transition: "all 0.15s",
            }}
          >
            Go home
          </Link>
        </div>

        {/* Closer */}
        <div className="nf-f4" style={{ marginTop: "52px", fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: "0.06em", color: "rgba(255,255,255,0.15)", position: "relative", zIndex: 1 }}>
          The data doesn&apos;t lie<span style={{ color: "var(--signal)", opacity: 0.5 }}> ·</span> It just needs translating<span style={{ color: "var(--signal)", opacity: 0.5 }}> ·</span> RawIntel<span style={{ color: "var(--signal)", opacity: 0.5 }}>.</span>
        </div>
      </main>

      <footer style={{ textAlign: "center", padding: "20px 40px", flexShrink: 0, fontSize: "11.5px", color: "rgba(255,255,255,0.18)", lineHeight: 1.8, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <a href="/terms" style={{ color: "rgba(255,255,255,0.25)", textDecoration: "underline", textUnderlineOffset: "2px" }}>Terms of Service</a>
        {" · "}
        <a href="/privacy" style={{ color: "rgba(255,255,255,0.25)", textDecoration: "underline", textUnderlineOffset: "2px" }}>Privacy Policy</a>
        {" · © RawIntel LLC"}
      </footer>
    </div>
  );
}
