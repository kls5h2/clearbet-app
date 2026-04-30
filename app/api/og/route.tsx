import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

// Latin-subset woff2 URLs from Google Fonts CSS2 API responses (stable)
const INTER_REGULAR_URL = "https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2";
const INTER_BOLD_URL    = "https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa0ZL7W0Q5nw.woff2";
const MONO_URL            = "https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxTOlOVk6OThhvA.woff2";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function fmtDate(gameDate: string): string {
  if (gameDate.length !== 8) return gameDate;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const m = parseInt(gameDate.slice(4, 6), 10) - 1;
  const d = parseInt(gameDate.slice(6, 8), 10);
  return `${months[m]} ${d}`;
}

// Scale font size down for longer titles
function titleFontSize(len: number): number {
  if (len <= 12) return 108;
  if (len <= 18) return 88;
  if (len <= 26) return 72;
  if (len <= 36) return 58;
  return 46;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  // ── Line Translator share card ────────────────────────────────────────────
  if (type === "line-translator") {
    const inputLine    = searchParams.get("line") ?? "";
    const translation  = searchParams.get("translation") ?? "";
    const implied      = searchParams.get("implied") ?? "";
    const tranTrunc    = translation.length > 150 ? translation.slice(0, 147) + "…" : translation;
    const lineFs       = inputLine.length <= 18 ? 88 : inputLine.length <= 26 ? 72 : inputLine.length <= 36 ? 58 : 46;

    const [interRegular, interBold, monoFont] = await Promise.all([
      fetch(INTER_REGULAR_URL).then((r) => r.arrayBuffer()),
      fetch(INTER_BOLD_URL).then((r) => r.arrayBuffer()),
      fetch(MONO_URL).then((r) => r.arrayBuffer()),
    ]);

    return new ImageResponse(
      (
        <div style={{ width: "1200px", height: "630px", display: "flex", flexDirection: "column", background: "#F8F6F2" }}>
          {/* 6px signal-red top bar */}
          <div style={{ width: "100%", height: "6px", background: "#C9352A", flexShrink: 0 }} />

          {/* Body */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "52px 80px 44px" }}>
            {/* Wordmark + LINE TRANSLATOR label */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: "22px", color: "#0E0E0E", letterSpacing: "-0.03em" }}>Raw</span>
                <span style={{ fontFamily: "Inter", fontWeight: 400, fontSize: "22px", color: "#8A8A86", letterSpacing: "-0.03em" }}>Intel</span>
                <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: "22px", color: "#C9352A", letterSpacing: "-0.03em" }}>.</span>
              </div>
              <div style={{ fontFamily: "Mono", fontSize: "13px", fontWeight: 400, color: "#8A8A86", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Line Translator
              </div>
            </div>

            {/* Input line — large and bold */}
            <div style={{ fontFamily: "Inter", fontWeight: 800, fontSize: `${lineFs}px`, color: "#0E0E0E", letterSpacing: "-0.04em", lineHeight: 1.05, marginTop: "32px" }}>
              {inputLine || "Betting Line"}
            </div>

            {/* Translation */}
            {tranTrunc && (
              <div style={{ fontFamily: "Inter", fontWeight: 400, fontSize: "20px", color: "#3D3B38", lineHeight: 1.55, marginTop: "24px", maxWidth: "960px" }}>
                {tranTrunc}
              </div>
            )}

            {/* Implied probability */}
            {implied && (
              <div style={{ display: "flex", marginTop: "20px" }}>
                <div style={{ fontFamily: "Mono", fontSize: "15px", fontWeight: 400, color: "#C9352A", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {`IMPLIED: ${implied}%`}
                </div>
              </div>
            )}

            {/* Push footer to bottom */}
            <div style={{ flex: 1 }} />

            {/* Footer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(14,14,14,0.12)", paddingTop: "18px" }}>
              <div style={{ fontFamily: "Inter", fontSize: "13px", fontStyle: "italic", color: "#8A8A86" }}>
                What the data says. Your decision to make.
              </div>
              <div style={{ fontFamily: "Mono", fontWeight: 400, fontSize: "13px", color: "#C9352A", letterSpacing: "0.06em" }}>
                rawintel.ai
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          { name: "Inter", data: interRegular, weight: 400, style: "normal" },
          { name: "Inter", data: interBold,    weight: 700, style: "normal" },
          { name: "Mono",  data: monoFont,     weight: 400, style: "normal" },
        ],
      }
    );
  }

  const gameId = searchParams.get("gameId");

  let title      = searchParams.get("title") ?? "";
  let sport      = searchParams.get("sport") ?? "NBA";
  let date       = searchParams.get("date") ?? "";
  let confidence = searchParams.get("confidence") ?? "";
  let insight    = searchParams.get("insight") ?? "";

  if (gameId) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/breakdowns?game_id=eq.${encodeURIComponent(gameId)}&order=created_at.desc&limit=1&select=breakdown_content,game_snapshot,sport,home_team,away_team,game_date`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        }
      );
      if (res.ok) {
        const rows = (await res.json()) as Array<{
          breakdown_content: { confidenceLabel?: string; cardSummary?: string } | null;
          game_snapshot: { homeTeam?: { teamAbv?: string }; awayTeam?: { teamAbv?: string } } | null;
          sport: string | null;
          home_team: string | null;
          away_team: string | null;
          game_date: string | null;
        }>;
        if (rows.length > 0) {
          const row = rows[0];
          const snap = row.game_snapshot;
          const away = snap?.awayTeam?.teamAbv ?? row.away_team ?? "AWY";
          const home = snap?.homeTeam?.teamAbv ?? row.home_team ?? "HOM";
          title      = `${away} vs ${home}`;
          sport      = row.sport ?? sport;
          date       = fmtDate(row.game_date ?? "");
          if (row.breakdown_content) {
            confidence = row.breakdown_content.confidenceLabel ?? confidence;
            insight    = row.breakdown_content.cardSummary ?? insight;
          }
        }
      }
    } catch {
      // Fall through to param values
    }
  }

  // Truncate insight at ~130 chars to stay within two display lines
  const insightTrunc = insight.length > 130 ? insight.slice(0, 127) + "…" : insight;
  const displayTitle = title || "Game Breakdown";
  const fs = titleFontSize(displayTitle.length);

  const [interRegular, interBold, monoFont] = await Promise.all([
    fetch(INTER_REGULAR_URL).then((r) => r.arrayBuffer()),
    fetch(INTER_BOLD_URL).then((r) => r.arrayBuffer()),
    fetch(MONO_URL).then((r) => r.arrayBuffer()),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          background: "#F8F6F2",
        }}
      >
        {/* 6px signal-red top bar */}
        <div style={{ width: "100%", height: "6px", background: "#C9352A", flexShrink: 0 }} />

        {/* Body */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "52px 80px 44px",
          }}
        >
          {/* Wordmark + sport / date */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: "22px", color: "#0E0E0E", letterSpacing: "-0.03em" }}>Raw</span>
              <span style={{ fontFamily: "Inter", fontWeight: 400, fontSize: "22px", color: "#8A8A86", letterSpacing: "-0.03em" }}>Intel</span>
              <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: "22px", color: "#C9352A", letterSpacing: "-0.03em" }}>.</span>
            </div>
            {(sport || date) && (
              <div
                style={{
                  fontFamily: "Mono",
                  fontSize: "13px",
                  fontWeight: 400,
                  color: "#8A8A86",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {[sport, date].filter(Boolean).join(" · ")}
              </div>
            )}
          </div>

          {/* Game title */}
          <div
            style={{
              fontFamily: "Inter",
              fontWeight: 800,
              fontSize: `${fs}px`,
              color: "#0E0E0E",
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              marginTop: "32px",
            }}
          >
            {displayTitle}
          </div>

          {/* Confidence badge */}
          {confidence && (
            <div style={{ display: "flex", marginTop: "22px" }}>
              <div
                style={{
                  background: "#0E0E0E",
                  color: "#FFFFFF",
                  fontFamily: "Inter",
                  fontWeight: 700,
                  fontSize: "11px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  padding: "7px 16px",
                  borderRadius: "100px",
                  display: "flex",
                }}
              >
                {confidence}
              </div>
            </div>
          )}

          {/* Key insight (up to 2 lines) */}
          {insightTrunc && (
            <div
              style={{
                fontFamily: "Inter",
                fontWeight: 400,
                fontSize: "21px",
                color: "#3D3B38",
                lineHeight: 1.55,
                marginTop: "22px",
                maxWidth: "960px",
              }}
            >
              {insightTrunc}
            </div>
          )}

          {/* Push footer to bottom */}
          <div style={{ flex: 1 }} />

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(14,14,14,0.12)",
              paddingTop: "18px",
            }}
          >
            <div
              style={{
                fontFamily: "Inter",
                fontSize: "13px",
                fontStyle: "italic",
                color: "#8A8A86",
              }}
            >
              What the data says. Your decision to make.
            </div>
            <div
              style={{
                fontFamily: "Mono",
                fontWeight: 400,
                fontSize: "13px",
                color: "#C9352A",
                letterSpacing: "0.06em",
              }}
            >
              rawintel.ai
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Inter", data: interRegular, weight: 400, style: "normal" },
        { name: "Inter", data: interBold,    weight: 700, style: "normal" },
        { name: "Mono",  data: monoFont,     weight: 400, style: "normal" },
      ],
    }
  );
}
