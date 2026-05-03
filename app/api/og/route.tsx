import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

// Latin-subset woff2 URLs from Google Fonts CSS2 API responses (stable)
const INTER_REGULAR_URL   = "https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2";
const INTER_BOLD_URL      = "https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa0ZL7W0Q5nw.woff2";
const INTER_EXTRABOLD_URL = "https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2ZL7W0Q5nw.woff2";
const MONO_URL            = "https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxTOlOVk6OThhvA.woff2";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Exact CSS token values
const SIGNAL    = "#C9352A";
const INK       = "#111110";
const WARM_WHITE = "#F8F6F2";
const MUTED_HEX = "#8A8A86";
const INK_2     = "#3D3B38";

const GRADE_MAP: Record<string, { label: string; color: string; bg: string }> = {
  CLEAR_SPOT: { label: "CLEAR SPOT", color: "#1A7A48", bg: "#E4F3EC" },
  LEAN:       { label: "LEAN",       color: "#1852A8", bg: "#E4EDFA" },
  FRAGILE:    { label: "FRAGILE",    color: "#B56A12", bg: "#FAF0E2" },
  PASS:       { label: "PASS",       color: "#6E6B66", bg: "#EDECEA" },
};

const LABEL_TO_GRADE: Record<string, string> = {
  "CLEAR SPOT": "CLEAR_SPOT",
  "LEAN":       "LEAN",
  "FRAGILE":    "FRAGILE",
  "PASS":       "PASS",
};

// Cache 24 h, stale-while-revalidate 24 h — breakdowns don't change after generation
const CACHE = { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400" };

function fmtDate(gameDate: string): string {
  if (gameDate.length !== 8) return gameDate;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const m = parseInt(gameDate.slice(4, 6), 10) - 1;
  const d = parseInt(gameDate.slice(6, 8), 10);
  return `${months[m]} ${d}`;
}

function matchupFontSize(awayLen: number, homeLen: number): number {
  const total = awayLen + homeLen;
  if (total <= 12) return 78;
  if (total <= 18) return 68;
  if (total <= 26) return 58;
  if (total <= 36) return 46;
  if (total <= 48) return 38;
  return 30;
}

async function loadFonts() {
  try {
    const [reg, bold, xbold, mono] = await Promise.all([
      fetch(INTER_REGULAR_URL).then((r) => r.arrayBuffer()),
      fetch(INTER_BOLD_URL).then((r) => r.arrayBuffer()),
      fetch(INTER_EXTRABOLD_URL).then((r) => r.arrayBuffer()),
      fetch(MONO_URL).then((r) => r.arrayBuffer()),
    ]);
    return [
      { name: "Inter", data: reg,   weight: 400 as const, style: "normal" as const },
      { name: "Inter", data: bold,  weight: 700 as const, style: "normal" as const },
      { name: "Inter", data: xbold, weight: 800 as const, style: "normal" as const },
      { name: "Mono",  data: mono,  weight: 400 as const, style: "normal" as const },
    ];
  } catch {
    return [];
  }
}

// ── Breakdown card — three-band layout per creative brief ───────────────────
// Top 40%: teams (stacked, "vs.") + Signal Grade badge (light pill, matches .cb-* CSS)
// Mid 40%: BASE SCRIPT label + first sentence
// Bottom 20%: lighter strip — date/time left, wordmark right
function renderBreakdownCard(
  awayTeam: string,
  homeTeam: string,
  signalGrade: string,
  baseScript: string,
  gameDate: string,
  gameTime: string,
) {
  const grade = GRADE_MAP[signalGrade] ?? GRADE_MAP["LEAN"];

  // Truncate to ~2 display lines at 26px
  const script = baseScript.length > 145 ? baseScript.slice(0, 142) + "…" : baseScript;

  // Scale team name font to longest name — names are stacked, not inline
  const longer = Math.max(awayTeam.length, homeTeam.length);
  const teamFs = longer <= 8 ? 64 : longer <= 14 ? 56 : longer <= 20 ? 46 : 38;

  const dateLine = [gameDate, gameTime].filter(Boolean).join(" · ");

  return (
    <div style={{ width: "1200px", height: "630px", display: "flex", flexDirection: "column", background: INK }}>

      {/* ── Top band — 40% = 252px ─────────────────────────────────────────── */}
      <div style={{ height: "252px", display: "flex", alignItems: "center", padding: "0 60px" }}>

        {/* Teams — stacked, uppercase, away on top */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ fontFamily: "Inter", fontWeight: 800, fontSize: `${teamFs}px`, color: WARM_WHITE, letterSpacing: "-0.04em", lineHeight: "1" }}>
            {awayTeam.toUpperCase()}
          </span>
          <span style={{ fontFamily: "Mono", fontSize: "13px", fontWeight: 400, color: "rgba(248,246,242,0.3)", letterSpacing: "0.08em" }}>
            vs.
          </span>
          <span style={{ fontFamily: "Inter", fontWeight: 800, fontSize: `${teamFs}px`, color: WARM_WHITE, letterSpacing: "-0.04em", lineHeight: "1" }}>
            {homeTeam.toUpperCase()}
          </span>
        </div>

        {/* Signal Grade badge — light pill matching exact .cb-* token values */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: grade.bg, padding: "16px 28px" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: grade.color, flexShrink: 0 }} />
          <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: "19px", color: grade.color, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {grade.label}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "rgba(248,246,242,0.08)" }} />

      {/* ── Middle band — 40% = 252px ──────────────────────────────────────── */}
      <div style={{ height: "252px", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 60px" }}>

        {/* BASE SCRIPT label */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ width: "20px", height: "1px", background: SIGNAL, flexShrink: 0, marginRight: "10px" }} />
          <span style={{ fontFamily: "Mono", fontSize: "11px", fontWeight: 600, color: "rgba(248,246,242,0.3)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Base Script
          </span>
        </div>

        {/* First sentence of the base script */}
        <div style={{ fontFamily: "Inter", fontSize: "26px", fontWeight: 400, color: WARM_WHITE, lineHeight: "1.5", maxWidth: "1040px" }}>
          {script || "Breakdown in progress."}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "rgba(248,246,242,0.08)" }} />

      {/* ── Bottom strip — remaining ~124px ───────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 60px", background: "rgba(248,246,242,0.025)" }}>

        {/* Date · time */}
        <div style={{ flex: 1 }}>
          {dateLine && (
            <span style={{ fontFamily: "Mono", fontSize: "15px", fontWeight: 400, color: "rgba(248,246,242,0.35)", letterSpacing: "0.06em" }}>
              {dateLine}
            </span>
          )}
        </div>

        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: "20px", color: WARM_WHITE, letterSpacing: "-0.03em" }}>Raw</span>
          <span style={{ fontFamily: "Inter", fontWeight: 400, fontSize: "20px", color: "rgba(248,246,242,0.3)", letterSpacing: "-0.03em" }}>Intel</span>
          <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: "20px", color: SIGNAL }}>.</span>
        </div>
      </div>
    </div>
  );
}

// ── Homepage OG card (static) ───────────────────────────────────────────────
function renderHomeCard() {
  return (
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        background: INK,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ghost R — bottom-right, clipped by overflow:hidden */}
      <div
        style={{
          position: "absolute",
          right: "-80px",
          bottom: "-100px",
          fontFamily: "Inter",
          fontWeight: 900,
          fontSize: "620px",
          color: "transparent",
          WebkitTextStroke: "1px rgba(248,246,242,0.03)",
          lineHeight: "1",
          pointerEvents: "none",
          userSelect: "none",
          letterSpacing: "-20px",
        }}
      >
        R
      </div>

      {/* Content column */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "52px 60px 44px",
          flex: 1,
          position: "relative",
        }}
      >
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: "24px", color: WARM_WHITE, letterSpacing: "-0.5px" }}>Raw</span>
          <span style={{ fontFamily: "Inter", fontWeight: 400, fontSize: "24px", color: "#6E6B66", letterSpacing: "-0.5px" }}>Intel</span>
          <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: "24px", color: SIGNAL }}>.</span>
        </div>

        {/* Signal dash + eyebrow */}
        <div style={{ display: "flex", alignItems: "center", marginTop: "16px" }}>
          <div style={{ width: "28px", height: "2px", background: SIGNAL, flexShrink: 0, marginRight: "12px" }} />
          <span style={{ fontFamily: "Mono", fontSize: "13px", fontWeight: 600, color: "#9B9790", letterSpacing: "2px" }}>
            SPORTS BETTING DECISION SUPPORT
          </span>
        </div>

        {/* Flex gap — pushes headlines to lower half */}
        <div style={{ flex: 1 }} />

        {/* Three-line headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: "Inter", fontWeight: 800, fontSize: "96px", color: WARM_WHITE, letterSpacing: "-3px", lineHeight: "1.12" }}>
            Raw data.
          </div>
          <div style={{ fontFamily: "Inter", fontWeight: 800, fontSize: "96px", color: WARM_WHITE, letterSpacing: "-3px", lineHeight: "1.12" }}>
            Clear read.
          </div>
          <div style={{ display: "flex", alignItems: "baseline", lineHeight: "1.12" }}>
            <span style={{ fontFamily: "Inter", fontWeight: 800, fontSize: "96px", color: SIGNAL, letterSpacing: "-3px" }}>Your</span>
            <span style={{ fontFamily: "Inter", fontWeight: 800, fontSize: "96px", color: "rgba(248,246,242,0.25)", letterSpacing: "-3px", marginLeft: "24px" }}>call.</span>
          </div>
        </div>

        {/* Subtext */}
        <div style={{ fontFamily: "Inter", fontSize: "20px", fontWeight: 400, color: "#9B9790", marginTop: "20px" }}>
          Never picks. Your decision is always yours.
        </div>

        {/* Footer row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "14px" }}>
          <span style={{ fontFamily: "Mono", fontSize: "16px", fontWeight: 400, color: "#6E6B66", letterSpacing: "0.5px" }}>
            rawintelsports.com
          </span>
          <span style={{ fontFamily: "Mono", fontSize: "13px", fontWeight: 400, color: "#6E6B66", letterSpacing: "0.8px" }}>
            Game Shape · Key Drivers · Base Script · Fragility Check · Market Read · Summary
          </span>
        </div>
      </div>
    </div>
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type         = searchParams.get("type");
  const gameId       = searchParams.get("gameId");
  const homeTeamP    = searchParams.get("homeTeam");

  const fonts = await loadFonts();

  // ── Homepage OG (static) ──────────────────────────────────────────────────
  if (type === "home") {
    return new ImageResponse(renderHomeCard(), {
      width: 1200,
      height: 630,
      fonts,
      // Very long cache — the home card never changes
      headers: { "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=604800" },
    });
  }

  // ── Line Translator share card ────────────────────────────────────────────
  if (type === "line-translator") {
    const inputLine   = searchParams.get("line") ?? "";
    const translation = searchParams.get("translation") ?? "";
    const implied     = searchParams.get("implied") ?? "";
    const tranTrunc   = translation.length > 150 ? translation.slice(0, 147) + "…" : translation;
    const lineFs      = inputLine.length <= 18 ? 88 : inputLine.length <= 26 ? 72 : inputLine.length <= 36 ? 58 : 46;

    return new ImageResponse(
      (
        <div style={{ width: "1200px", height: "630px", display: "flex", flexDirection: "column", background: WARM_WHITE }}>
          <div style={{ width: "100%", height: "6px", background: SIGNAL, flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "52px 80px 44px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: "22px", color: "#0E0E0E", letterSpacing: "-0.03em" }}>Raw</span>
                <span style={{ fontFamily: "Inter", fontWeight: 400, fontSize: "22px", color: MUTED_HEX, letterSpacing: "-0.03em" }}>Intel</span>
                <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: "22px", color: SIGNAL, letterSpacing: "-0.03em" }}>.</span>
              </div>
              <div style={{ fontFamily: "Mono", fontSize: "13px", color: MUTED_HEX, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Line Translator
              </div>
            </div>
            <div style={{ fontFamily: "Inter", fontWeight: 800, fontSize: `${lineFs}px`, color: "#0E0E0E", letterSpacing: "-0.04em", lineHeight: "1.05", marginTop: "32px" }}>
              {inputLine || "Betting Line"}
            </div>
            {tranTrunc && (
              <div style={{ fontFamily: "Inter", fontWeight: 400, fontSize: "20px", color: INK_2, lineHeight: "1.55", marginTop: "24px", maxWidth: "960px" }}>
                {tranTrunc}
              </div>
            )}
            {implied && (
              <div style={{ display: "flex", marginTop: "20px" }}>
                <div style={{ fontFamily: "Mono", fontSize: "15px", color: SIGNAL, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {`IMPLIED: ${implied}%`}
                </div>
              </div>
            )}
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(14,14,14,0.12)", paddingTop: "18px" }}>
              <div style={{ fontFamily: "Inter", fontSize: "13px", fontStyle: "italic", color: MUTED_HEX }}>
                What the data says. Your decision to make.
              </div>
              <div style={{ fontFamily: "Mono", fontSize: "13px", color: SIGNAL, letterSpacing: "0.06em" }}>
                rawintelsports.com
              </div>
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630, fonts, headers: CACHE },
    );
  }

  // ── Breakdown card — direct params path ──────────────────────────────────
  // Triggered when homeTeam is explicitly supplied (e.g. from layout meta tags)
  if (homeTeamP) {
    const awayTeam    = searchParams.get("awayTeam")    ?? "";
    const signalGrade = searchParams.get("signalGrade") ?? "LEAN";
    const baseScript  = searchParams.get("baseScript")  ?? "";
    const gameDate    = searchParams.get("gameDate")    ?? "";
    const gameTime    = searchParams.get("gameTime")    ?? "";

    return new ImageResponse(
      renderBreakdownCard(awayTeam, homeTeamP, signalGrade, baseScript, gameDate, gameTime),
      { width: 1200, height: 630, fonts, headers: CACHE },
    );
  }

  // ── Breakdown card — gameId path (Supabase lookup) ────────────────────────
  let awayTeam    = searchParams.get("awayTeam")    ?? searchParams.get("title") ?? "";
  let homeTeam    = searchParams.get("homeTeam")    ?? "";
  let signalGrade = searchParams.get("signalGrade") ?? "";
  let baseScript  = searchParams.get("baseScript")  ?? searchParams.get("insight") ?? "";
  let gameDate    = searchParams.get("gameDate")    ?? searchParams.get("date") ?? "";
  let gameTime    = searchParams.get("gameTime")    ?? "";

  // Legacy params remapping (backward compat with old confidence/title params)
  if (!signalGrade && searchParams.get("confidence")) {
    signalGrade = LABEL_TO_GRADE[searchParams.get("confidence") ?? ""] ?? "LEAN";
  }

  if (gameId && SUPABASE_URL && SUPABASE_KEY) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/breakdowns?game_id=eq.${encodeURIComponent(gameId)}&order=created_at.desc&limit=1&select=breakdown_content,game_snapshot,sport,home_team,away_team,game_date`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        },
      );
      if (res.ok) {
        const rows = (await res.json()) as Array<{
          breakdown_content: { confidenceLabel?: string; baseScript?: string; cardSummary?: string } | null;
          game_snapshot: {
            homeTeam?: { teamAbv?: string; teamName?: string };
            awayTeam?: { teamAbv?: string; teamName?: string };
            gameTime?: string;
          } | null;
          sport: string | null;
          home_team: string | null;
          away_team: string | null;
          game_date: string | null;
        }>;
        if (rows.length > 0) {
          const row = rows[0];
          const snap = row.game_snapshot;
          // Prefer full teamName from snapshot, fall back to stored abbrev
          homeTeam  = snap?.homeTeam?.teamName ?? row.home_team ?? homeTeam;
          awayTeam  = snap?.awayTeam?.teamName ?? row.away_team ?? awayTeam;
          gameDate  = fmtDate(row.game_date ?? "");
          gameTime  = snap?.gameTime ?? gameTime;
          if (row.breakdown_content) {
            signalGrade = LABEL_TO_GRADE[row.breakdown_content.confidenceLabel ?? ""] ?? signalGrade;
            // First sentence of baseScript
            const raw = row.breakdown_content.baseScript ?? row.breakdown_content.cardSummary ?? "";
            baseScript = raw.match(/^[^.!?]+[.!?]/)?.[0] ?? raw.slice(0, 130);
          }
        }
      }
    } catch {
      // Fall through with whatever params we have
    }
  }

  // If we have enough data for the breakdown card, render it
  if (homeTeam || awayTeam) {
    return new ImageResponse(
      renderBreakdownCard(awayTeam, homeTeam, signalGrade, baseScript, gameDate, gameTime),
      { width: 1200, height: 630, fonts, headers: CACHE },
    );
  }

  // ── Generic fallback (no game data available) ─────────────────────────────
  return new ImageResponse(
    (
      <div style={{ width: "1200px", height: "630px", display: "flex", flexDirection: "column", background: WARM_WHITE }}>
        <div style={{ width: "100%", height: "6px", background: SIGNAL, flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "52px 80px" }}>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: "48px", color: "#0E0E0E", letterSpacing: "-0.03em" }}>Raw</span>
            <span style={{ fontFamily: "Inter", fontWeight: 400, fontSize: "48px", color: MUTED_HEX, letterSpacing: "-0.03em" }}>Intel</span>
            <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: "48px", color: SIGNAL, letterSpacing: "-0.03em" }}>.</span>
          </div>
          <div style={{ fontFamily: "Inter", fontSize: "18px", color: MUTED_HEX, marginTop: "16px", letterSpacing: "-0.01em" }}>
            Raw data. Clear read. Your call.
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts, headers: CACHE },
  );
}
