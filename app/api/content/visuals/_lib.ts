import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { BreakdownResult, AnyGame } from "@/lib/types";

const CONTENT_API_TOKEN = process.env.CONTENT_API_TOKEN;

export function checkAuth(req: NextRequest): boolean {
  if (!CONTENT_API_TOKEN) return false;
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return token === CONTENT_API_TOKEN;
}

export interface VisualData {
  sport: "NBA" | "MLB";
  matchup: string;
  signalGrade: string | null;
  confidenceLabel: string;
  keyDrivers: Array<{ factor: string; weight: string }>;
  fragilityCheck: Array<{ item: string; color: string }>;
}

export async function fetchVisualData(id: string): Promise<VisualData | null> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("breakdowns")
    .select(
      "sport, home_team, away_team, game_snapshot, breakdown_content, confidence_label"
    )
    .eq("game_id", id)
    .single();

  if (error || !data) return null;

  const content = data.breakdown_content as BreakdownResult | null;
  const snap = data.game_snapshot as AnyGame | null;

  let matchup: string;
  if (snap?.homeTeam && snap?.awayTeam) {
    const home = snap.homeTeam.teamCity
      ? `${snap.homeTeam.teamCity} ${snap.homeTeam.teamName}`
      : snap.homeTeam.teamAbv;
    const away = snap.awayTeam.teamCity
      ? `${snap.awayTeam.teamCity} ${snap.awayTeam.teamName}`
      : snap.awayTeam.teamAbv;
    matchup = `${away} @ ${home}`;
  } else {
    matchup = `${data.away_team} @ ${data.home_team}`;
  }

  return {
    sport: data.sport as "NBA" | "MLB",
    matchup,
    signalGrade: content?.signalGrade ?? null,
    confidenceLabel: data.confidence_label as string,
    keyDrivers: (content?.keyDrivers ?? []).slice(0, 3).map((d) => ({
      factor: d.factor,
      weight: d.weight,
    })),
    fragilityCheck: (content?.fragilityCheck ?? []).slice(0, 3).map((f) => ({
      item: f.item,
      color: f.color,
    })),
  };
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const FONTS =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;800&family=JetBrains+Mono:wght@400&display=swap";

function shell(eyebrow: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
<link href="${FONTS}" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{
  width:1080px;height:1080px;overflow:hidden;
  background:#111110;color:#F8F6F2;
  font-family:Inter,sans-serif;
}
body{position:relative;display:flex;flex-direction:column}
.bar{position:absolute;left:0;top:0;bottom:0;width:5px;background:#C9352A}
.layout{margin-left:5px;padding:72px 80px;flex:1;display:flex;flex-direction:column}
.eyebrow{
  font-family:'JetBrains Mono',monospace;font-size:13px;
  color:#6b6b69;text-transform:uppercase;letter-spacing:.12em;
}
.main{flex:1;display:flex;flex-direction:column;justify-content:center}
.footer{
  text-align:right;font-family:'JetBrains Mono',monospace;
  font-size:12px;color:#6b6b69;letter-spacing:.08em;
}
</style>
</head>
<body>
<div class="bar"></div>
<div class="layout">
  <div class="eyebrow">${eyebrow}</div>
  <div class="main">${body}</div>
  <div class="footer">rawintelsports.com</div>
</div>
</body>
</html>`;
}

const GRADE_COLOR: Record<string, string> = {
  A: "#4ade80",
  B: "#a3e635",
  C: "#facc15",
  D: "#fb923c",
  F: "#C9352A",
};

const BADGE_COLOR: Record<string, string> = {
  "CLEAR SPOT": "#4ade80",
  LEAN: "#facc15",
  FRAGILE: "#fb923c",
  PASS: "#6b6b69",
};

const FRAGILITY_COLOR: Record<string, string> = {
  red: "#C9352A",
  green: "#4ade80",
  amber: "#facc15",
};

function badge(label: string, color: string): string {
  return `<span style="display:inline-block;border:1px solid ${color};border-radius:6px;padding:10px 22px;font-family:'JetBrains Mono',monospace;font-size:14px;color:${color};text-transform:uppercase;letter-spacing:.1em;">${esc(label)}</span>`;
}

export function renderCoverHtml(data: VisualData): string {
  const gc = data.signalGrade ? (GRADE_COLOR[data.signalGrade] ?? "#6b6b69") : null;
  const bc = BADGE_COLOR[data.confidenceLabel] ?? "#6b6b69";

  const body = `
    <div style="margin-bottom:52px;">
      <div style="font-family:'JetBrains Mono',monospace;font-size:15px;color:#6b6b69;letter-spacing:.1em;text-transform:uppercase;margin-bottom:28px;">${esc(data.sport)}</div>
      <div style="font-size:64px;font-weight:800;line-height:1.08;color:#F8F6F2;max-width:900px;word-wrap:break-word;">${esc(data.matchup)}</div>
    </div>
    <div style="display:flex;gap:16px;flex-wrap:wrap;">
      ${gc ? badge(`Signal ${data.signalGrade}`, gc) : ""}
      ${badge(data.confidenceLabel, bc)}
    </div>`;

  return shell("01 — Game Breakdown", body);
}

export function renderKeyDriversHtml(data: VisualData): string {
  const items = data.keyDrivers.map((d, i) => {
    const num = String(i + 1).padStart(2, "0");
    const isPrimary = d.weight === "primary";
    return `
      <div style="display:flex;gap:28px;align-items:flex-start;padding:28px 0;${i < data.keyDrivers.length - 1 ? "border-bottom:1px solid #1e1e1d;" : ""}">
        <div style="font-family:'JetBrains Mono',monospace;font-size:20px;color:#C9352A;flex-shrink:0;padding-top:4px;">${num}</div>
        <div style="flex:1;">
          <div style="font-size:28px;font-weight:${isPrimary ? 800 : 400};line-height:1.3;color:#F8F6F2;margin-bottom:10px;">${esc(d.factor)}</div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:${isPrimary ? "#C9352A" : "#6b6b69"};text-transform:uppercase;letter-spacing:.12em;">${isPrimary ? "PRIMARY" : "SECONDARY"}</div>
        </div>
      </div>`;
  }).join("");

  const body = `<div style="width:100%;">${items}</div>`;
  return shell("02 — Key Drivers", body);
}

export function renderFragilityHtml(data: VisualData): string {
  const items = data.fragilityCheck.map((f, i) => {
    const color = FRAGILITY_COLOR[f.color] ?? "#6b6b69";
    return `
      <div style="display:flex;gap:24px;align-items:flex-start;padding:26px 0;${i < data.fragilityCheck.length - 1 ? "border-bottom:1px solid #1e1e1d;" : ""}">
        <div style="width:12px;height:12px;border-radius:50%;background:${color};flex-shrink:0;margin-top:10px;"></div>
        <div style="font-size:26px;font-weight:400;line-height:1.4;color:#F8F6F2;">${esc(f.item)}</div>
      </div>`;
  }).join("");

  const body = `<div style="width:100%;">${items}</div>`;
  return shell("04 — Fragility Check", body);
}

export function renderCtaHtml(data: VisualData): string {
  const body = `
    <div>
      <div style="font-size:72px;font-weight:800;line-height:1.05;color:#F8F6F2;margin-bottom:36px;">Full breakdown<br>available now.</div>
      <div style="font-size:24px;font-weight:400;color:#6b6b69;margin-bottom:48px;">${esc(data.matchup)}</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:18px;color:#C9352A;letter-spacing:.08em;">rawintelsports.com</div>
    </div>
    <div style="margin-top:60px;font-family:'JetBrains Mono',monospace;font-size:13px;color:#6b6b69;letter-spacing:.12em;text-transform:uppercase;">Raw data. Clear read. Your call.</div>`;

  return shell("Rawintelsports.com", body);
}
