export default function DisclaimerFooter() {
  return (
    <footer
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        background: "#F0F3F7",
        borderTop: "1px solid #E8ECF2",
        padding: "10px 24px",
      }}
    >
      <p style={{ fontSize: "11px", fontWeight: 500, color: "#637A96", textAlign: "center", lineHeight: 1.5, margin: 0 }}>
        For informational purposes only. RawIntel does not provide financial, betting, or investment advice. Bet responsibly.{" "}
        Need support?{" "}
        <a
          href="https://www.ncpgambling.org"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#637A96", textDecoration: "underline" }}
        >
          ncpgambling.org
        </a>
        {" "}· © RawIntel LLC
      </p>
    </footer>
  );
}
