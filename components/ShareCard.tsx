"use client";

import { useEffect, useRef, useState } from "react";
import type { AnyGame, ConfidenceLabel } from "@/lib/types";

interface Props {
  game: AnyGame;
  confidenceLabel: ConfidenceLabel;
  shareHook: string;
  open: boolean;
  onClose: () => void;
}

// Pill color per confidence label
const PILL_COLORS: Record<ConfidenceLabel, { bg: string; text: string }> = {
  "CLEAR SPOT": { bg: "#16A34A", text: "#FAFAFA" },
  "LEAN":       { bg: "#0E0E0E", text: "#FAFAFA" },
  "FRAGILE":    { bg: "#D97706", text: "#FAFAFA" },
  "PASS":       { bg: "#8A8A86", text: "#FAFAFA" },
};

const CLOSING_LINE = "This is not a pick. This is what the data says. Your decision is always yours.";

function formatShareDate(gameDate: string): string {
  // gameDate is YYYYMMDD
  if (!gameDate || gameDate.length !== 8) return gameDate;
  const y = parseInt(gameDate.slice(0, 4), 10);
  const m = parseInt(gameDate.slice(4, 6), 10) - 1;
  const d = parseInt(gameDate.slice(6, 8), 10);
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${months[m]} ${d}, ${y}`;
}

export default function ShareCard({ game, confidenceLabel, shareHook, open, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState<"copy" | "download" | "link" | null>(null);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    // Prevent body scroll while modal is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const awayNick = game.awayTeam.teamCity
    ? game.awayTeam.teamName.replace(game.awayTeam.teamCity, "").trim()
    : game.awayTeam.teamName;
  const homeNick = game.homeTeam.teamCity
    ? game.homeTeam.teamName.replace(game.homeTeam.teamCity, "").trim()
    : game.homeTeam.teamName;

  const matchup = `${awayNick} at ${homeNick}`;
  const pill = PILL_COLORS[confidenceLabel];
  const formattedDate = formatShareDate(game.gameDate);

  async function captureCanvas(): Promise<HTMLCanvasElement | null> {
    if (!cardRef.current) return null;
    const html2canvasMod = await import("html2canvas");
    const html2canvas = html2canvasMod.default;
    return html2canvas(cardRef.current, {
      backgroundColor: "#0E0E0E",
      scale: 2,
      useCORS: true,
      logging: false,
    });
  }

  async function handleCopyImage() {
    setBusy("copy");
    setStatus(null);
    try {
      const canvas = await captureCanvas();
      if (!canvas) throw new Error("capture failed");
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
      if (!blob) throw new Error("blob failed");
      // ClipboardItem is only available in secure contexts with clipboard-write permission
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setStatus("Image copied");
      } else {
        throw new Error("clipboard-write not supported");
      }
    } catch {
      setStatus("Clipboard not available — try Download");
    } finally {
      setBusy(null);
    }
  }

  async function handleDownload() {
    setBusy("download");
    setStatus(null);
    try {
      const canvas = await captureCanvas();
      if (!canvas) throw new Error("capture failed");
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `rawintel-${game.gameId || "share"}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setStatus("Downloaded");
    } catch {
      setStatus("Download failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleCopyLink() {
    setBusy("link");
    setStatus(null);
    try {
      const url = window.location.href;
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setStatus("Link copied");
      } else {
        throw new Error("clipboard not available");
      }
    } catch {
      setStatus("Clipboard not available");
    } finally {
      setBusy(null);
    }
  }

  const actionBtnStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.08)",
    border: "0.5px solid rgba(255,255,255,0.15)",
    color: "#FAFAFA",
    fontFamily: "var(--sans)",
    fontSize: "12px",
    fontWeight: 500,
    letterSpacing: "0.04em",
    padding: "10px 16px",
    borderRadius: 0,
    cursor: "pointer",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Share this breakdown"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px", overflowY: "auto",
      }}
    >
      <div style={{ position: "relative", maxWidth: "520px", width: "100%" }}>
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute", top: "-36px", right: 0,
            background: "none", border: "none", cursor: "pointer",
            color: "#FAFAFA", fontSize: "22px", fontWeight: 300, lineHeight: 1,
            padding: 0,
          }}
        >
          ×
        </button>

        {/* The share card (captured by html2canvas) */}
        <div
          ref={cardRef}
          style={{
            background: "#0E0E0E",
            color: "#FAFAFA",
            width: "480px",
            maxWidth: "100%",
            padding: "40px",
            borderRadius: 0,
            margin: "0 auto",
            fontFamily: "var(--sans)",
            position: "relative",
            boxSizing: "border-box",
          }}
        >
          {/* 1. RawIntel wordmark */}
          <div style={{ marginBottom: "32px" }}>
            <span style={{ fontFamily: "Georgia, serif", fontSize: "16px", fontWeight: 500, letterSpacing: "-0.02em", color: "#FAFAFA" }}>
              <em style={{ fontStyle: "italic", fontWeight: 400 }}>Raw</em>Intel<span style={{ color: "#D93B3A" }}>.</span>
            </span>
          </div>

          {/* 2. Matchup */}
          <h2 style={{
            fontFamily: "Georgia, serif",
            fontSize: "34px", fontWeight: 500, lineHeight: 1.1,
            letterSpacing: "-0.025em",
            color: "#FAFAFA", margin: 0, marginBottom: "10px",
          }}>
            {matchup}
          </h2>

          {/* 3. Sport + date */}
          <p style={{
            fontSize: "11px", fontWeight: 500, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "#8A8A86", margin: 0, marginBottom: "28px",
          }}>
            {game.sport} · {formattedDate}
          </p>

          {/* 4. Confidence pill */}
          <div style={{ marginBottom: "24px" }}>
            <span style={{
              display: "inline-block",
              background: pill.bg, color: pill.text,
              fontSize: "11px", fontWeight: 600, letterSpacing: "0.14em",
              textTransform: "uppercase", padding: "5px 12px", borderRadius: 0,
            }}>
              {confidenceLabel}
            </span>
          </div>

          {/* 5. Share hook — most interesting data point, pulled from the breakdown */}
          {shareHook && (
            <p style={{
              fontFamily: "var(--sans)", fontStyle: "italic",
              fontSize: "14px", color: "#FAFAFA",
              lineHeight: 1.55, margin: 0, marginBottom: "24px",
              paddingLeft: "14px",
              borderLeft: "2px solid #D93B3A",
            }}>
              {shareHook}
            </p>
          )}

          {/* 6. Closing line — smaller, italic serif */}
          <p style={{
            fontFamily: "Georgia, serif", fontStyle: "italic",
            fontSize: "13px", color: "#FAFAFA", opacity: 0.75,
            lineHeight: 1.5, margin: 0, marginBottom: "28px",
          }}>
            “{CLOSING_LINE}”
          </p>

          {/* 7. Footer */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <span style={{ fontSize: "11px", color: "#8A8A86", letterSpacing: "0.04em" }}>
              rawintelsports.com
            </span>
          </div>
        </div>

        {/* Action row */}
        <div style={{
          display: "flex", gap: "8px", justifyContent: "center",
          flexWrap: "wrap", marginTop: "16px",
        }}>
          <button onClick={handleCopyImage} disabled={busy !== null} style={actionBtnStyle}>
            {busy === "copy" ? "Copying…" : "Copy image"}
          </button>
          <button onClick={handleDownload} disabled={busy !== null} style={actionBtnStyle}>
            {busy === "download" ? "Rendering…" : "Download"}
          </button>
          <button onClick={handleCopyLink} disabled={busy !== null} style={actionBtnStyle}>
            {busy === "link" ? "Copying…" : "Copy link"}
          </button>
        </div>

        {status && (
          <p style={{
            textAlign: "center", marginTop: "12px",
            fontSize: "12px", color: "#FAFAFA", opacity: 0.7,
          }}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
