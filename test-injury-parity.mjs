/**
 * NBA Injury Parity Test
 * Runs the new official PDF source and the ESPN source in parallel for
 * tonight's games, then compares results and flags any discrepancies.
 *
 * Run: node test-injury-parity.mjs
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const DATE_ET       = "2026-05-04";
const PDF_CDN_BASE  = "https://ak-static.cms.nba.com/referee/injury/Injury-Report";
const ESPN_URL      = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/injuries";
const GAMES_API     = "http://localhost:3000/api/games?sport=nba";

const PDF_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
  Referer:      "https://www.nba.com/",
  Accept:       "application/pdf,*/*",
};

// pdf-parse strips spaces — use lookbehind so status matches after lowercase (end of first name)
const STATUS_RE = /(?<=[a-z])(Out|Probable|Questionable|Available|Doubtful|Day-To-Day)/;

const TEAM_NAME_PREFIXES = [
  "AtlantaHawks", "BostonCeltics", "BrooklynNets", "CharlotteHornets",
  "ChicagoBulls", "ClevelandCavaliers", "DallasMavericks", "DenverNuggets",
  "DetroitPistons", "GoldenStateWarriors", "HoustonRockets", "IndianaPacers",
  "LosAngelesClippers", "LosAngelesLakers", "MemphisGrizzlies", "MiamiHeat",
  "MilwaukeeBucks", "MinnesotaTimberwolves", "NewOrleansPelicans", "NewYorkKnicks",
  "OklahomaCityThunder", "OrlandoMagic", "Philadelphia76ers", "PhoenixSuns",
  "PortlandTrailBlazers", "SacramentoKings", "SanAntonioSpurs", "TorontoRaptors",
  "UtahJazz", "WashingtonWizards",
];

function extractName(prefix) {
  const commaIdx = prefix.lastIndexOf(",");
  if (commaIdx < 0) return null;
  const firstName = prefix.slice(commaIdx + 1);
  const beforeComma = prefix.slice(0, commaIdx);
  for (const team of TEAM_NAME_PREFIXES) {
    const idx = beforeComma.lastIndexOf(team);
    if (idx >= 0) {
      const lastName = beforeComma.slice(idx + team.length);
      if (lastName) return { firstName, lastName };
    }
  }
  // Fallback: scan for last non-letter → advance to first uppercase; else last camelCase boundary
  let start = 0;
  for (let i = 0; i < beforeComma.length; i++) {
    if (!/[A-Za-z''\-.]/.test(beforeComma[i])) {
      for (let j = i + 1; j < beforeComma.length; j++) {
        if (/[A-Z]/.test(beforeComma[j])) { start = j; break; }
      }
    } else if (i > 0 && /[a-z]/.test(beforeComma[i - 1]) && /[A-Z]/.test(beforeComma[i])) {
      start = i;
    }
  }
  const lastName = beforeComma.slice(start);
  return firstName && lastName ? { firstName, lastName } : null;
}

// ── URL generation ─────────────────────────────────────────────────────────

function buildCandidateUrls() {
  const now = new Date();
  const etParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(now);

  const year  = etParts.find(p => p.type === "year").value;
  const month = etParts.find(p => p.type === "month").value;
  const day   = etParts.find(p => p.type === "day").value;
  const h     = parseInt(etParts.find(p => p.type === "hour").value, 10);
  const m     = parseInt(etParts.find(p => p.type === "minute").value, 10);

  const dateStr = `${year}-${month}-${day}`;
  const slotMin = Math.floor(m / 15) * 15;
  const urls = [];

  for (let off = 0; off < 12; off++) {
    const total = h * 60 + slotMin - off * 15;
    if (total < 0) break;
    const h24  = Math.floor(total / 60);
    const min  = total % 60;
    const ampm = h24 >= 12 ? "PM" : "AM";
    const h12  = h24 % 12 === 0 ? 12 : h24 % 12;
    const ts   = `${String(h12).padStart(2,"0")}_${String(min).padStart(2,"0")}${ampm}`;
    urls.push({ url: `${PDF_CDN_BASE}_${dateStr}_${ts}.pdf`, label: `${dateStr} ${ts}` });
  }
  return urls;
}

// ── PDF source ─────────────────────────────────────────────────────────────

async function fetchPDFSource() {
  const candidates = buildCandidateUrls();
  let buf = null, label = "";

  for (const c of candidates) {
    try {
      const r = await fetch(c.url, { headers: PDF_HEADERS, signal: AbortSignal.timeout(8000) });
      if (r.ok) { buf = Buffer.from(await r.arrayBuffer()); label = c.label; break; }
    } catch { /* try next */ }
  }

  if (!buf) return { ok: false, source: "pdf", label: "", players: new Map() };

  const parsed = await pdfParse(buf);
  const lines  = parsed.text.split("\n").map(l => l.trim()).filter(Boolean);
  const players = new Map(); // name.lower → { status, comment, line }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const st = line.match(STATUS_RE);
    if (!st) continue;
    if (st[1] === "Available") continue;

    // Prefix = everything before the status keyword; extract name from it
    const si     = line.indexOf(st[0]);
    const prefix = line.slice(0, si);
    const nm     = extractName(prefix);
    if (!nm) continue;

    const name = `${nm.firstName} ${nm.lastName}`;

    let reason = line.slice(si + st[0].length).trim();

    // Peek up to 2 continuation lines for multi-line reason cells
    for (const peek of [lines[i + 1] ?? "", lines[i + 2] ?? ""]) {
      if (!peek || peek.startsWith("Page")) break;
      if (STATUS_RE.test(peek) || peek.includes(",")) break;
      reason = reason ? `${reason} ${peek}` : peek;
    }

    const comment = reason
      .replace(/^Injury\/Illness-/i, "")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/;/g, "; ")
      .replace(/\s{2,}/g, " ")
      .trim();

    players.set(name.toLowerCase(), { status: st[1], comment, rawLine: line });
  }

  return { ok: true, source: "pdf", label, players };
}

// ── ESPN source ────────────────────────────────────────────────────────────

async function fetchESPNSource() {
  const players = new Map();
  try {
    const r = await fetch(ESPN_URL, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return { ok: false, source: "espn", players };
    const data = await r.json();

    for (const team of data.injuries ?? []) {
      for (const inj of team.injuries ?? []) {
        const name = inj.athlete?.displayName?.trim();
        const raw  = inj.status?.trim();
        if (!name || !raw) continue;

        // Map ESPN statuses to our normalized set
        const statusMap = { out: "Out", questionable: "Questionable", doubtful: "Doubtful", "day-to-day": "Day-To-Day" };
        const status = statusMap[raw.toLowerCase()];
        if (!status) continue;

        const comment = inj.longComment || inj.shortComment || inj.details?.type || "";
        players.set(name.toLowerCase(), { status, comment, team: team.abbreviation });
      }
    }
    return { ok: true, source: "espn", players };
  } catch (e) {
    return { ok: false, source: "espn", players, error: e.message };
  }
}

// ── Game list ──────────────────────────────────────────────────────────────

async function getTonightTeams() {
  // Try the local dev server first; fall back to hardcoded tonight's games
  try {
    const r = await fetch(GAMES_API, { signal: AbortSignal.timeout(3000) });
    if (r.ok) {
      const d = await r.json();
      return (d.games ?? []).flatMap(g => [g.homeTeam?.teamAbv, g.awayTeam?.teamAbv].filter(Boolean));
    }
  } catch { /* local server not running */ }
  return ["PHI", "NYK", "MIN", "SAS"]; // hardcoded from today's PDF
}

// ── Compare ────────────────────────────────────────────────────────────────

function compareResults(pdf, espn, teams) {
  const teamNames = new Set(teams.map(t => t.toLowerCase()));
  console.log(`\n${"═".repeat(72)}`);
  console.log("  PARITY CHECK — NBA Official PDF vs ESPN");
  console.log(`  PDF snapshot: ${pdf.label || "N/A"}  |  Teams: ${teams.join(", ")}`);
  console.log(`${"═".repeat(72)}`);

  const KNOWN_GROUND_TRUTH = {
    "joel embiid":      { status: "Probable",     team: "PHI" },
    "jeremy sochan":    { status: "Questionable",  team: "NYK" },
    "donte divincenzo": { status: "Out",           team: "MIN" },
    "ayo dosunmu":      { status: "Out",           team: "MIN" },
    "anthony edwards":  { status: "Questionable",  team: "MIN" },
  };

  // 1. Ground truth check (PDF)
  console.log("\n── GROUND TRUTH CHECK (PDF source) ─────────────────────────");
  for (const [name, expected] of Object.entries(KNOWN_GROUND_TRUTH)) {
    const entry = pdf.players.get(name);
    if (!entry) {
      console.log(`  ✗ ${name.toUpperCase()} — NOT FOUND in PDF`);
      continue;
    }
    const match = entry.status === expected.status;
    const icon  = match ? "✓" : "⚠";
    console.log(`  ${icon} ${name.toUpperCase()} [${expected.team}]: PDF=${entry.status} expected=${expected.status}${!match ? " ← MISMATCH" : ""}`);
    if (entry.comment) console.log(`       reason: ${entry.comment}`);
  }

  // 2. Cross-source comparison for shared players
  console.log("\n── CROSS-SOURCE COMPARISON (PDF vs ESPN) ───────────────────");

  const allNames = new Set([...pdf.players.keys(), ...espn.players.keys()]);
  let matches = 0, mismatches = 0, pdfOnly = 0, espnOnly = 0;

  for (const name of [...allNames].sort()) {
    const p = pdf.players.get(name);
    const e = espn.players.get(name);

    if (p && e) {
      if (p.status === e.status) {
        matches++;
        console.log(`  ✓ ${name}: ${p.status}`);
      } else {
        mismatches++;
        console.log(`  ⚠ ${name}: PDF=${p.status}  ESPN=${e.status}  ← MISMATCH`);
      }
    } else if (p && !e) {
      pdfOnly++;
      console.log(`  → PDF only: ${name} (${p.status})`);
    } else if (!p && e) {
      espnOnly++;
      console.log(`  ← ESPN only: ${name} (${e.status})`);
    }
  }

  // 3. Summary
  console.log(`\n── SUMMARY ─────────────────────────────────────────────────`);
  console.log(`  PDF players parsed:    ${pdf.players.size}`);
  console.log(`  ESPN players found:    ${espn.players.size}`);
  console.log(`  Status match:          ${matches}`);
  console.log(`  Status mismatch:       ${mismatches}`);
  console.log(`  PDF only (not ESPN):   ${pdfOnly}`);
  console.log(`  ESPN only (not PDF):   ${espnOnly}`);

  if (mismatches === 0) {
    console.log("\n  VERDICT: Sources agree on all shared players ✓");
  } else {
    console.log(`\n  VERDICT: ${mismatches} mismatch(es) — review above`);
  }

  // 4. Full PDF dump
  console.log(`\n── FULL PDF PLAYER LIST ────────────────────────────────────`);
  for (const [name, d] of [...pdf.players.entries()].sort()) {
    console.log(`  ${d.status.padEnd(14)} ${name}${d.comment ? ` — ${d.comment}` : ""}`);
  }
}

// ── run ────────────────────────────────────────────────────────────────────

(async () => {
  console.log(`\nRunning injury parity test for ${DATE_ET}...`);

  const [pdfResult, espnResult, teams] = await Promise.all([
    fetchPDFSource(),
    fetchESPNSource(),
    getTonightTeams(),
  ]);

  if (!pdfResult.ok) {
    console.error("PDF source failed — cannot run parity check.");
    process.exit(1);
  }

  if (!espnResult.ok) {
    console.warn("ESPN source unavailable — PDF-only results shown.");
  }

  compareResults(pdfResult, espnResult, teams);

  console.log(`\n${"═".repeat(72)}\n`);
})();
