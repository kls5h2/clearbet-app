/**
 * NBA Official Injury Report — primary injury data source.
 *
 * Fetches directly from the NBA's CDN (ak-static.cms.nba.com) rather than
 * relying on Tank01 scraping it. The NBA publishes official injury report PDFs
 * every 15 minutes during the season. No API key required.
 *
 * URL format (as of 2025-12-22):
 *   Injury-Report_YYYY-MM-DD_HH_MMam/pm.pdf
 *
 * Returns Map<lowercase player name → { status, comment }> matching the
 * shape expected by getInjuryReport() in tank01.ts.
 */

const PDF_CDN_BASE =
  "https://ak-static.cms.nba.com/referee/injury/Injury-Report";

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Referer: "https://www.nba.com/",
  Accept: "application/pdf,*/*",
};

// pdf-parse strips spaces between adjacent PDF cells, producing lines like:
// "Philadelphia76ersEmbiid,JoelProbableInjury/Illness-RightHip;Contusion"
// \b fails between two word chars — use lookbehind so status matches after a first name's
// lowercase tail (e.g. "...JoelProbable..." → "l" before "P").
const STATUS_RE = /(?<=[a-z])(Out|Probable|Questionable|Available|Doubtful|Day-To-Day)/;

// Known NBA team names as they appear concatenated in the PDF (CityNickname, no spaces).
// Used to strip the team prefix from "beforeComma" to isolate the player's last name.
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

/**
 * Extract (firstName, lastName) from the prefix segment that sits between the
 * start of the line and the status keyword. Handles both simple rows
 * ("Dosunmu,Ayo") and full rows with game context and team name embedded
 * ("...MinnesotaTimberwolvesDiVincenzo,Donte").
 */
function extractName(prefix: string): { firstName: string; lastName: string } | null {
  const commaIdx = prefix.lastIndexOf(",");
  if (commaIdx < 0) return null;

  const firstName = prefix.slice(commaIdx + 1);
  const beforeComma = prefix.slice(0, commaIdx);

  // Try stripping a known team name to isolate the last name
  for (const team of TEAM_NAME_PREFIXES) {
    const idx = beforeComma.lastIndexOf(team);
    if (idx >= 0) {
      const lastName = beforeComma.slice(idx + team.length);
      if (lastName) return { firstName, lastName };
    }
  }

  // Fallback: no team name matched. Find where the last name starts by scanning
  // for the last non-letter character, then advancing to the first uppercase letter.
  let start = 0;
  for (let i = 0; i < beforeComma.length; i++) {
    if (!/[A-Za-z''\-.]/.test(beforeComma[i])) {
      // After a non-letter, scan forward for the next uppercase letter
      for (let j = i + 1; j < beforeComma.length; j++) {
        if (/[A-Z]/.test(beforeComma[j])) { start = j; break; }
      }
    } else if (i > 0 && /[a-z]/.test(beforeComma[i - 1]) && /[A-Z]/.test(beforeComma[i])) {
      // camelCase boundary — candidate start for last name
      start = i;
    }
  }
  const lastName = beforeComma.slice(start);
  return firstName && lastName ? { firstName, lastName } : null;
}

export interface OfficialInjuryEntry {
  playerName: string;  // "First Last" (normalized from PDF "Last,First")
  status: string;
  comment: string;
  reportTime: string;  // ISO timestamp of the report snapshot used
}

/**
 * Build candidate PDF URLs, most-recent first, walking back 3 hours in
 * 15-minute increments. The NBA CDN returns 403 for future (unpublished)
 * slots, so we walk back until we get a 200.
 */
function buildCandidateUrls(): { url: string; timeLabel: string }[] {
  const now = new Date();

  const etParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const year  = etParts.find((p) => p.type === "year")!.value;
  const month = etParts.find((p) => p.type === "month")!.value;
  const day   = etParts.find((p) => p.type === "day")!.value;
  const etHour = parseInt(etParts.find((p) => p.type === "hour")!.value, 10);
  const etMin  = parseInt(etParts.find((p) => p.type === "minute")!.value, 10);

  const dateStr    = `${year}-${month}-${day}`;
  const slotMinute = Math.floor(etMin / 15) * 15;

  const candidates: { url: string; timeLabel: string }[] = [];

  // Try up to 12 slots back (3 hours)
  for (let offset = 0; offset < 12; offset++) {
    const totalMinutes = etHour * 60 + slotMinute - offset * 15;
    if (totalMinutes < 0) break;

    const h24  = Math.floor(totalMinutes / 60);
    const min  = totalMinutes % 60;
    const ampm = h24 >= 12 ? "PM" : "AM";
    const h12  = h24 % 12 === 0 ? 12 : h24 % 12;

    const timeStr = `${String(h12).padStart(2, "0")}_${String(min).padStart(2, "0")}${ampm}`;
    candidates.push({
      url: `${PDF_CDN_BASE}_${dateStr}_${timeStr}.pdf`,
      timeLabel: `${year}-${month}-${day} ${String(h12).padStart(2, "0")}:${String(min).padStart(2, "0")} ${ampm} ET`,
    });
  }

  return candidates;
}

/**
 * Fetch the most recently published PDF. Walks back through 15-min slots
 * until it gets a 200. Returns null after 3 hours of misses.
 */
async function fetchLatestPDF(): Promise<{
  buf: Buffer;
  reportTime: string;
} | null> {
  const candidates = buildCandidateUrls();

  for (const { url, timeLabel } of candidates) {
    try {
      const res = await fetch(url, {
        headers: FETCH_HEADERS,
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      });

      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        console.log(
          `[nba-injuries] fetched ${url} (${buf.length.toLocaleString()} bytes)`
        );
        return { buf, reportTime: timeLabel };
      }
      // 403 = slot not yet published; 404 = doesn't exist — keep walking back
    } catch {
      // timeout / network error — try next slot
    }
  }

  console.warn("[nba-injuries] no PDF snapshot found in the last 3 hours");
  return null;
}

/**
 * Parse the raw PDF text into a player-name → {status, comment} map.
 *
 * The PDF uses a 7-column table. pdfplumber / pdf-parse reads text linearly
 * top-to-bottom, so multi-line reason cells get interleaved with the next row.
 * Strategy: scan for lines that contain BOTH a "Last,First" name AND a status
 * keyword — those are player rows. Reason text on the same line is captured;
 * if the reason is missing or incomplete we peek at the next line.
 */
function parseInjuryText(
  text: string,
  reportTime: string
): OfficialInjuryEntry[] {
  const entries: OfficialInjuryEntry[] = [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // pdf-parse strips spaces between adjacent PDF cells, so a line looks like:
    // "Philadelphia76ersEmbiid,JoelProbableInjury/Illness-RightHip;Contusion"
    // Strategy: anchor on the status keyword, extract Last,First from the prefix.
    const statusMatch = line.match(STATUS_RE);
    if (!statusMatch) continue;

    const status = statusMatch[1];
    if (status === "Available") continue; // cleared — not injured

    // Prefix = everything before the status keyword
    const statusIdx = line.indexOf(statusMatch[0]);
    const prefix = line.slice(0, statusIdx);

    const extracted = extractName(prefix);
    if (!extracted) continue;

    const { firstName, lastName } = extracted;
    const playerName = `${firstName} ${lastName}`; // "Joel Embiid"

    // Reason = everything after the status keyword on this line
    let rawReason = line.slice(statusIdx + statusMatch[0].length).trim();

    // Peek up to 2 continuation lines for multi-line reason cells.
    // A line is a valid continuation if it has no status keyword and no comma
    // (the comma signals a new player row).
    for (const peekLine of [lines[i + 1] ?? "", lines[i + 2] ?? ""]) {
      if (!peekLine || peekLine.startsWith("Page")) break;
      if (STATUS_RE.test(peekLine) || peekLine.includes(",")) break;
      rawReason = rawReason ? `${rawReason} ${peekLine}` : peekLine;
    }

    // Normalize reason: "Injury/Illness-LeftKnee;BoneBruise" → "Left Knee; Bone Bruise"
    const comment = rawReason
      .replace(/^Injury\/Illness-/i, "")
      .replace(/([a-z])([A-Z])/g, "$1 $2") // camelCase → words
      .replace(/;/g, "; ")
      .replace(/\s{2,}/g, " ")
      .trim();

    entries.push({ playerName, status, comment, reportTime });
  }

  return entries;
}

/**
 * Fetch the official NBA injury report PDF and return a Map keyed by
 * lowercase player name → { status, comment }.
 *
 * This is a drop-in replacement for the CDN JSON approach that was returning
 * 403. Gracefully returns an empty map on any failure so the Tank01 fallback
 * (Layer 2) remains active.
 */
export async function fetchOfficialNBAInjuries(): Promise<
  Map<string, { status: string; comment: string }>
> {
  const result = new Map<string, { status: string; comment: string }>();

  try {
    // Dynamic import keeps pdf-parse out of Edge Runtime bundles
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = (await import("pdf-parse")).default;

    const fetched = await fetchLatestPDF();
    if (!fetched) return result;

    const parsed = await pdfParse(fetched.buf);
    const entries = parseInjuryText(parsed.text, fetched.reportTime);

    for (const e of entries) {
      result.set(e.playerName.toLowerCase(), {
        status: e.status,
        comment: e.comment,
      });
    }

    console.log(
      `[nba-injuries] ${result.size} players parsed from ${fetched.reportTime} report`
    );
  } catch (err) {
    console.error(
      "[nba-injuries] failed:",
      err instanceof Error ? err.message : String(err)
    );
  }

  return result;
}
