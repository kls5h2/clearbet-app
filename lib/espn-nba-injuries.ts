/**
 * ESPN NBA injuries — the authoritative real-time injury source for NBA
 * breakdowns. Overrides Tank01 injury data entirely.
 *
 * Endpoint returns a per-team grouping; we filter down to just the two teams
 * in the current game and normalize each entry to { playerName, status,
 * description, dateUpdated }.
 */

const ESPN_URL = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/injuries";

export type ESPNInjuryStatus = "Out" | "Questionable" | "Doubtful" | "Day-To-Day";

export interface ESPNInjuryEntry {
  playerName: string;
  status: ESPNInjuryStatus;
  description: string;
  dateUpdated: string; // ISO timestamp from ESPN
}

export type ESPNInjuryResult =
  | {
      ok: true;
      fetchedAt: string; // our fetch timestamp (ISO)
      homeInjuries: ESPNInjuryEntry[];
      awayInjuries: ESPNInjuryEntry[];
    }
  | { ok: false };

interface RawAthlete {
  displayName?: string;
}

interface RawInjury {
  date?: string;
  athlete?: RawAthlete;
  status?: string;
  longComment?: string;
  shortComment?: string;
  details?: { type?: string };
}

interface RawTeamBlock {
  displayName?: string;
  abbreviation?: string;
  injuries?: RawInjury[];
}

interface RawResponse {
  injuries?: RawTeamBlock[];
}

// Tank01 abbreviation → ESPN abbreviation (only teams that disagree).
// Tank01 uses NBA-official codes; ESPN uses its own variants for a handful.
const TANK01_TO_ESPN_ABV: Record<string, string> = {
  PHX: "PHX",
  BKN: "BKN",
  CHA: "CHA",
  GS: "GS",
  SA: "SA",
  NO: "NO",
  NY: "NY",
  NYK: "NY",
  GSW: "GS",
  SAS: "SA",
  NOP: "NO",
};

function normalizeAbv(abv: string): string {
  return (TANK01_TO_ESPN_ABV[abv] ?? abv).toUpperCase();
}

function normalizeStatus(raw: string | undefined): ESPNInjuryStatus | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  if (s === "out") return "Out";
  if (s === "doubtful") return "Doubtful";
  if (s === "questionable") return "Questionable";
  if (s === "day-to-day" || s === "day to day") return "Day-To-Day";
  return null;
}

function parseTeamInjuries(block: RawTeamBlock): ESPNInjuryEntry[] {
  const out: ESPNInjuryEntry[] = [];
  for (const inj of block.injuries ?? []) {
    const name = inj.athlete?.displayName?.trim();
    const status = normalizeStatus(inj.status);
    if (!name || !status) continue;
    const description =
      inj.longComment?.trim() ||
      inj.shortComment?.trim() ||
      inj.details?.type?.trim() ||
      "No further detail";
    out.push({
      playerName: name,
      status,
      description,
      dateUpdated: inj.date ?? "",
    });
  }
  return out;
}

/**
 * Fetch real-time NBA injuries from ESPN. Returns ok:false on any error so
 * the caller can flag INJURY DATA UNAVAILABLE in the prompt.
 */
export async function fetchESPNNBAInjuries(
  homeAbv: string,
  awayAbv: string,
  homeName: string,
  awayName: string
): Promise<ESPNInjuryResult> {
  try {
    const res = await fetch(ESPN_URL, { next: { revalidate: 300 } });
    if (!res.ok) {
      console.error(`[espn-injuries] HTTP ${res.status}`);
      return { ok: false };
    }
    const data: RawResponse = await res.json();
    const blocks = data.injuries ?? [];

    const homeNick = homeName.split(" ").pop()?.toLowerCase() ?? "";
    const awayNick = awayName.split(" ").pop()?.toLowerCase() ?? "";
    const homeAbvNorm = normalizeAbv(homeAbv);
    const awayAbvNorm = normalizeAbv(awayAbv);

    const matches = (block: RawTeamBlock, abv: string, nick: string) => {
      const blockAbv = (block.abbreviation ?? "").toUpperCase();
      if (blockAbv && blockAbv === abv) return true;
      const blockNick = block.displayName?.split(" ").pop()?.toLowerCase() ?? "";
      return blockNick !== "" && blockNick === nick;
    };

    const homeBlock = blocks.find((b) => matches(b, homeAbvNorm, homeNick));
    const awayBlock = blocks.find((b) => matches(b, awayAbvNorm, awayNick));

    if (!homeBlock && !awayBlock) {
      console.error(`[espn-injuries] no team blocks matched for ${homeAbv}/${awayAbv}`);
      return { ok: false };
    }

    return {
      ok: true,
      fetchedAt: new Date().toISOString(),
      homeInjuries: homeBlock ? parseTeamInjuries(homeBlock) : [],
      awayInjuries: awayBlock ? parseTeamInjuries(awayBlock) : [],
    };
  } catch (err) {
    console.error("[espn-injuries] fetch failed:", err instanceof Error ? err.message : err);
    return { ok: false };
  }
}
