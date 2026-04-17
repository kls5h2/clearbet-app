export default function DisclaimerFooter() {
  return (
    <footer
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        background: "var(--canvas)",
        borderTop: "0.5px solid var(--border)",
        padding: "10px 24px",
      }}
    >
      <p style={{ fontSize: "12px", fontWeight: 400, color: "var(--muted)", textAlign: "center", lineHeight: 1.5, margin: 0 }}>
        For informational purposes only. RawIntel does not provide financial, betting, or investment advice. Bet responsibly.{" "}
        Need support?{" "}
        <a
          href="https://www.ncpgambling.org"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--muted)", textDecoration: "underline" }}
        >
          ncpgambling.org
        </a>
        {" "}· © RawIntel LLC
      </p>
    </footer>
  );
}
