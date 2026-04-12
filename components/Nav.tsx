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
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "#0D1B2E",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1.25rem 1.5rem",
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
                <span style={{ fontSize: "14px", color: "#637A96" }}>←</span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#637A96", letterSpacing: "0.04em" }}>
                  {backLabel}
                </span>
              </Link>
              <div style={{ width: "1px", height: "14px", background: "#2A3F5A" }} />
            </>
          )}
          <Link href="/" style={{ textDecoration: "none" }}>
            <Logo />
          </Link>
        </div>

        {/* Center — sport tag, absolutely centered, clickable back to sport slate */}
        {sportTag && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <Link
              href={`/?sport=${sportTag}`}
              style={{ textDecoration: "none" }}
              className="group"
            >
              <span
                style={{
                  fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "#8FA3BC",
                  cursor: "pointer",
                }}
                className="group-hover:underline"
              >
                {sportTag}
              </span>
            </Link>
          </div>
        )}

        {/* Right side — nav links */}
        <div style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
          <Link
            href="/how-it-works"
            style={{
              fontSize: "14px", fontWeight: 600, letterSpacing: "0.04em",
              color: activePage === "how-it-works" ? "#FFFFFF" : "#637A96",
              textDecoration: "none",
            }}
          >
            How It Works
          </Link>
          <Link
            href="/glossary"
            style={{
              fontSize: "14px", fontWeight: 600, letterSpacing: "0.04em",
              color: activePage === "glossary" ? "#FFFFFF" : "#637A96",
              textDecoration: "none",
            }}
          >
            Glossary
          </Link>
        </div>
      </div>
    </header>
  );
}
