import Link from "next/link";
import Logo from "./Logo";

interface NavProps {
  backHref?: string;
  backLabel?: string;
  sportTag?: string;
  activePage?: "how-it-works" | "glossary";
}

export default function Nav({ backHref, backLabel = "Back", sportTag, activePage }: NavProps) {
  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1.25rem 1.5rem",
        background: "#F0F3F7",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Left side */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {backHref && (
          <>
            <Link
              href={backHref}
              style={{ display: "flex", alignItems: "center", gap: "4px", textDecoration: "none" }}
            >
              <span style={{ fontSize: "14px", color: "#9FADBF" }}>←</span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#9FADBF", letterSpacing: "0.04em" }}>
                {backLabel}
              </span>
            </Link>
            <div style={{ width: "1px", height: "14px", background: "#DDE2EB" }} />
          </>
        )}
        <Link href="/" style={{ textDecoration: "none" }}>
          <Logo />
        </Link>
      </div>

      {/* Right side */}
      {sportTag ? (
        <span
          style={{
            fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase", color: "#9FADBF",
          }}
        >
          {sportTag}
        </span>
      ) : (
        <div style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
          <Link
            href="/how-it-works"
            style={{
              fontSize: "12px", fontWeight: 600, letterSpacing: "0.04em",
              color: activePage === "how-it-works" ? "#0D1B2E" : "#9FADBF",
              textDecoration: "none",
            }}
          >
            How It Works
          </Link>
          <Link
            href="/glossary"
            style={{
              fontSize: "12px", fontWeight: 600, letterSpacing: "0.04em",
              color: activePage === "glossary" ? "#0D1B2E" : "#9FADBF",
              textDecoration: "none",
            }}
          >
            Glossary
          </Link>
        </div>
      )}
    </header>
  );
}
