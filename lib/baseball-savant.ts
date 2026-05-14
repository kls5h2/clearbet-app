/**
 * Baseball Savant Statcast CSV fetch + parse.
 * Endpoint returns season-level batter aggregates — barrel rate, hard hit %, etc.
 * Cached daily via Next.js fetch cache (revalidate: 86400).
 *
 * Field notes from CSV header (values are percentages 0–100, normalized to 0.0–1.0 here):
 *   barrel_batted_rate  — barrel %
 *   hard_hit_percent    — hard hit %
 *   launch_angle_avg    — average launch angle (degrees)
 *   pull_percent        — pull %
 *   exit_velocity_avg   — average exit velocity (mph)
 */

const STATCAST_URL =
  "https://baseballsavant.mlb.com/statcast_search/csv" +
  "?hfSea=2026%7C&player_type=batter&group_by=name" +
  "&sort_col=barrel_batted_rate&sort_order=desc&min_abs=50&type=details";

export interface StatcastBatter {
  barrelRate: number | null;      // 0.0–1.0
  hardHitPct: number | null;      // 0.0–1.0
  launchAngleAvg: number | null;  // degrees
  pullPct: number | null;         // 0.0–1.0
  exitVeloAvg: number | null;     // mph
}

type StatcastMap = Map<string, StatcastBatter>;

// In-process singleton so Vercel serverless invocations within the same
// execution context skip the network round-trip. The Next.js fetch cache
// handles cross-invocation deduplication (86400s TTL = daily refresh).
let _cachedAt = 0;
let _cache: StatcastMap = new Map();

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function parsePct(val: string | undefined): number | null {
  if (!val || val.trim() === "" || val === "null") return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n / 100; // Baseball Savant returns 0–100
}

function parseNum(val: string | undefined): number | null {
  if (!val || val.trim() === "" || val === "null") return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

/**
 * Parse CSV text into a StatcastMap keyed by normalized player name.
 */
function parseStatcastCSV(csv: string): StatcastMap {
  const lines = csv.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return new Map();

  // Header row — find column indices
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));

  const idx = (field: string) => headers.indexOf(field);
  const nameIdx = idx("player_name") !== -1 ? idx("player_name") : idx("name");
  const barrelIdx = idx("barrel_batted_rate");
  const hardHitIdx = idx("hard_hit_percent");
  const launchIdx = idx("launch_angle_avg");
  const pullIdx = idx("pull_percent");
  const exitVeloIdx = idx("exit_velocity_avg");

  if (nameIdx === -1) {
    console.warn("[baseball-savant] CSV missing player_name/name column — skipping parse");
    return new Map();
  }

  const result: StatcastMap = new Map();

  for (let i = 1; i < lines.length; i++) {
    // Simple CSV split — handles quoted fields with commas inside quotes
    const cols = splitCSVLine(lines[i]);
    const name = cols[nameIdx]?.replace(/"/g, "").trim();
    if (!name) continue;

    result.set(normalizeName(name), {
      barrelRate: barrelIdx !== -1 ? parsePct(cols[barrelIdx]) : null,
      hardHitPct: hardHitIdx !== -1 ? parsePct(cols[hardHitIdx]) : null,
      launchAngleAvg: launchIdx !== -1 ? parseNum(cols[launchIdx]) : null,
      pullPct: pullIdx !== -1 ? parsePct(cols[pullIdx]) : null,
      exitVeloAvg: exitVeloIdx !== -1 ? parseNum(cols[exitVeloIdx]) : null,
    });
  }

  return result;
}

/**
 * Minimal CSV line splitter — handles double-quoted fields.
 */
function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/**
 * Fetch and return the season Statcast map.
 * Cached daily. Falls back to an empty map on any error — never throws.
 */
export async function getStatcastBatters(): Promise<StatcastMap> {
  const now = Date.now();

  // In-process cache: valid for 23 hours (Next.js fetch cache handles the rest)
  if (_cache.size > 0 && now - _cachedAt < 23 * 60 * 60 * 1000) {
    return _cache;
  }

  try {
    const res = await fetch(STATCAST_URL, {
      headers: { "Accept": "text/csv", "User-Agent": "RawIntel/1.0" },
      next: { revalidate: 86400 }, // Next.js daily cache
    });

    if (!res.ok) {
      console.warn(`[baseball-savant] fetch failed: ${res.status} — returning empty map`);
      return _cache; // return whatever we have (possibly stale)
    }

    const csv = await res.text();
    const parsed = parseStatcastCSV(csv);

    if (parsed.size === 0) {
      console.warn("[baseball-savant] parsed 0 rows — CSV may have changed format");
      return _cache;
    }

    console.log(`[baseball-savant] loaded ${parsed.size} batters`);
    _cache = parsed;
    _cachedAt = now;
    return _cache;
  } catch (err) {
    console.error("[baseball-savant] fetch threw:", err instanceof Error ? err.message : err);
    return _cache;
  }
}

/**
 * Look up Statcast data for a batter by name.
 * Tries exact match, then last-name-only fallback.
 */
export function lookupStatcast(name: string, map: StatcastMap): StatcastBatter | null {
  const normalized = normalizeName(name);
  if (map.has(normalized)) return map.get(normalized)!;

  // Last name fallback — handles "Yordan Alvarez" vs "Alvarez, Yordan" format differences
  // Baseball Savant often formats as "Last, First"
  const reversed = normalized.split(" ").reverse().join(", ");
  if (map.has(reversed)) return map.get(reversed)!;

  // Try "Last, First" → "First Last" conversion
  const commaSplit = normalized.split(", ");
  if (commaSplit.length === 2) {
    const asFirstLast = `${commaSplit[1]} ${commaSplit[0]}`;
    if (map.has(asFirstLast)) return map.get(asFirstLast)!;
  }

  return null;
}
