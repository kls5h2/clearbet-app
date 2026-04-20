/**
 * ESPN NBA playoff series score — pulled from the public scoreboard endpoint
 * so the breakdown prompt has accurate "Cleveland leads series 1-0" context
 * and doesn't invent elimination stakes.
 */

const ESPN_URL = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";

export interface ESPNSeriesEntry {
  gameNumber: number | null;      // parsed from the event headline, e.g. 2 for "Game 2"
  summary: string;                 // ESPN's own string, e.g. "Cleveland leads series 1-0"
  homeAbv: string;
  awayAbv: string;
  homeWins: number;
  awayWins: number;
  leaderAbv: string | null;        // null when tied
}

export type ESPNSeriesResult =
  | { ok: true; fetchedAt: string; series: ESPNSeriesEntry }
  | { ok: false };

interface RawTeam {
  abbreviation?: string;
  displayName?: string;
}

interface RawCompetitor {
  id?: string;
  homeAway?: "home" | "away";
  team?: RawTeam;
}

interface RawSeriesCompetitor {
  id?: string;
  team?: RawTeam;
  wins?: number;
}

interface RawSeries {
  type?: string;      // "playoff" for playoff games
  title?: string;
  summary?: string;
  competitors?: RawSeriesCompetitor[];
}

interface RawNote {
  type?: string;
  headline?: string;  // e.g. "Eastern Conference First Round Game 2"
}

interface RawCompetition {
  competitors?: RawCompetitor[];
  series?: RawSeries;
  notes?: RawNote[];
}

interface RawEvent {
  competitions?: RawCompetition[];
}

interface RawResponse {
  events?: RawEvent[];
}

function normalizeAbv(abv: string | undefined): string {
  return (abv ?? "").toUpperCase();
}

function matchesTeam(competitor: RawCompetitor | undefined, abv: string, nick: string): boolean {
  if (!competitor?.team) return false;
  const cAbv = normalizeAbv(competitor.team.abbreviation);
  if (cAbv && cAbv === abv) return true;
  const cNick = competitor.team.displayName?.split(" ").pop()?.toLowerCase() ?? "";
  return cNick !== "" && cNick === nick;
}

function parseGameNumber(headline: string | undefined): number | null {
  if (!headline) return null;
  const m = headline.match(/\bGame\s+(\d+)/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Fetch today's NBA scoreboard and return the series-score entry for the
 * specific game involving both teams. Returns ok:false on any error so the
 * caller can surface "series score unavailable" in the prompt.
 */
export async function fetchESPNNBASeries(
  homeAbv: string,
  awayAbv: string,
  homeName: string,
  awayName: string
): Promise<ESPNSeriesResult> {
  try {
    const res = await fetch(ESPN_URL, { next: { revalidate: 300 } });
    if (!res.ok) {
      console.error(`[espn-series] HTTP ${res.status}`);
      return { ok: false };
    }
    const data: RawResponse = await res.json();
    const events = data.events ?? [];

    const homeNick = homeName.split(" ").pop()?.toLowerCase() ?? "";
    const awayNick = awayName.split(" ").pop()?.toLowerCase() ?? "";
    const homeAbvNorm = normalizeAbv(homeAbv);
    const awayAbvNorm = normalizeAbv(awayAbv);

    for (const ev of events) {
      const comp = ev.competitions?.[0];
      if (!comp) continue;
      const competitors = comp.competitors ?? [];
      if (competitors.length < 2) continue;

      const homeSide = competitors.find((c) => c.homeAway === "home");
      const awaySide = competitors.find((c) => c.homeAway === "away");

      const matches =
        (matchesTeam(homeSide, homeAbvNorm, homeNick) && matchesTeam(awaySide, awayAbvNorm, awayNick)) ||
        // Fallback: ESPN occasionally flips homeAway relative to our source; match either direction
        (matchesTeam(homeSide, awayAbvNorm, awayNick) && matchesTeam(awaySide, homeAbvNorm, homeNick));
      if (!matches) continue;

      const series = comp.series;
      if (!series || series.type !== "playoff" || !series.summary) {
        console.log("[espn-series] event matched but no playoff series block present");
        return { ok: false };
      }

      const seriesCompetitors = series.competitors ?? [];
      const findWins = (abv: string, nick: string) => {
        const found = seriesCompetitors.find((c) => {
          const cAbv = normalizeAbv(c.team?.abbreviation);
          if (cAbv && cAbv === abv) return true;
          const cNick = c.team?.displayName?.split(" ").pop()?.toLowerCase() ?? "";
          return cNick !== "" && cNick === nick;
        });
        return typeof found?.wins === "number" ? found.wins : 0;
      };

      const homeWins = findWins(homeAbvNorm, homeNick);
      const awayWins = findWins(awayAbvNorm, awayNick);
      const leaderAbv = homeWins > awayWins ? homeAbvNorm : awayWins > homeWins ? awayAbvNorm : null;

      const headline = comp.notes?.find((n) => n.headline)?.headline;
      const gameNumber = parseGameNumber(headline);

      return {
        ok: true,
        fetchedAt: new Date().toISOString(),
        series: {
          gameNumber,
          summary: series.summary,
          homeAbv: homeAbvNorm,
          awayAbv: awayAbvNorm,
          homeWins,
          awayWins,
          leaderAbv,
        },
      };
    }

    console.log(`[espn-series] no scoreboard event matched ${homeAbv}/${awayAbv}`);
    return { ok: false };
  } catch (err) {
    console.error("[espn-series] fetch failed:", err instanceof Error ? err.message : err);
    return { ok: false };
  }
}
