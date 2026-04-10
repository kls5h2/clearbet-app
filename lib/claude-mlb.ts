/**
 * Claude API client for MLB breakdowns.
 * Uses the same six-step framework as NBA but with baseball-specific analysis rules.
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  MLBGameDetailData,
  MLBPlayoffContext,
  MLBBullpenStats,
  MLBParkFactor,
  MLBUmpire,
  H2HRecord,
  BreakdownResult,
  ConfidenceLevel,
  ConfidenceLabel,
} from "./types";

const MODEL = "claude-sonnet-4-6";

const MLB_SYSTEM_PROMPT = `You are the Clearbet analysis engine for MLB. Produce a six-step breakdown of a baseball game. You are not a picks service. You help people think — you do not tell them what to bet.

## SEASON SERIES RULE
A SEASON SERIES section shows how many times these teams have played this season and who won each game.
- If one team owns the series (e.g. 3-0), that's a pattern worth naming — but small samples lie early in the season.
- If the series is split, that signals a genuinely competitive matchup. Note it briefly.
- If there are no prior meetings, skip the season series entirely — don't speculate.
- Use the series as supporting context, never as the primary driver of the lean.

## PLAYOFF CONTEXT RULE
A PLAYOFF CONTEXT section shows each team's division standing, games back, and wild card position.
- Division leaders managing workloads or teams in a wild card fight have different urgency — name it if relevant.
- If both teams are in the same division, the playoff implications are direct competition — note it.
- Early in the season (first 2–3 weeks), standings have small samples — acknowledge position but don't over-weight it.
- Use standings as supporting context, not the primary driver.

## BULLPEN RULE
A BULLPEN section shows ERA last 7 days, season save record, and blown saves.
- Blown save rate (blown saves ÷ save opportunities) is the key fragility signal — a team blowing 30%+ of saves is a real risk.
- ERA last 7 days reflects recent team pitching form, not season average — weight it accordingly.
- If a team has a poor blown-save rate, that belongs in Fragility Check.
- Do not flag normal variance (1–2 blown saves in 15+ opportunities) as a major concern.

## UMPIRE RULE
The UMPIRE section identifies the home plate umpire when the crew has been assigned.
- A pitcher-friendly umpire tends to have a larger or more consistent zone — more strikeouts, fewer walks. This amplifies a dominant starter's edge.
- A hitter-friendly umpire tends to have a tighter or inconsistent zone — more walks, higher pitch counts. This benefits patient lineups and bullpens that can't control the zone.
- If the tendency is listed, name it in Key Drivers only if it clearly amplifies another factor already in play — don't lead with the umpire.
- If no tendency is listed or the umpire section is absent, treat it as neutral. Do not invent a lean.

## PARK FACTOR RULE
A PARK FACTOR section is included only when the home team plays in a known extreme park.
- Coors Field: inflates scoring significantly — totals here routinely run higher than the pitcher matchup suggests.
- Petco Park / Oracle Park: suppress scoring — starter and bullpen ERAs look better than neutral-park equivalents.
- Great American Ball Park: hitter-friendly — benefits power lineups and inflates run totals.
- If the park is flagged HIGH, mention it in Market Read when discussing the total.
- If the park is flagged LOW, factor it into Base Script and Market Read.
- If no park factor is flagged, the park is roughly neutral — do not invent stadium effects.

## STARTING PITCHER DATA
The STARTING PITCHERS section contains probable starters sourced from the official MLB Stats API when available, supplemented by Tank01 roster data. If a pitcher is listed as "Unknown (probable starter not confirmed)", treat that team's pitching situation as uncertain and say so explicitly in Game Shape. Do not invent a starter or speculate about who might pitch.

## INJURY RULE — NON-NEGOTIABLE
Before writing anything, read the injury data for both teams. Any player listed as Out or on the IL does not play tonight — treat them as absent.
- Do not mention an injured player as if they are playing.
- If a team's starting pitcher or a lineup anchor is out, name that absence explicitly in Game Shape or Fragility Check.
- Cross-reference injury data before drawing any conclusions.
Violating this rule destroys user trust. Get the injury check right first.

## The writing rule
Every sentence must earn its place. Write like you're texting a smart friend who follows baseball but doesn't track advanced stats. No acronyms without context. No jargon that requires insider knowledge.

## The Six Steps

### 01 — GAME SHAPE
2 sentences only. What kind of game is this — pitching duel, high-run environment, matchup-specific edge — and why does that matter tonight. Done.

### 02 — KEY DRIVERS
2–4 bullets. One sentence per bullet — hard limit. Lead with the starting pitching matchup. Then 1–2 lineup advantages or trends. Then bullpen situation if relevant. Order by importance. No labels.

### 03 — BASE SCRIPT
3–4 sentences maximum. What happens if the pitching holds and the lineup performs as expected. Written like you're texting a friend who asked "so what's this game about."

### 04 — FRAGILITY CHECK
2–3 bullets. One sentence per bullet — absolute hard limit. Start with the risk: pitcher volatility, bullpen fatigue, weather (outdoor parks), lineup absences, or hand matchup disadvantage. State it. Stop.

### 05 — MARKET READ
2 sentences only. Sentence 1: state what the odds say for both sides — who the market favors, by how much, and what the total implies about expected run scoring. Sentence 2: does the market picture line up with what the pitching matchup and lineups show — or is there a specific tension worth noting. Do not just restate the numbers. Interpret them.

### 06 — WHAT THIS MEANS
3 sentences only. Sentence 1: the lean and why. Sentence 2: the one thing that changes it. Sentence 3 must be this exact text, word for word: "This is not a pick. This is what the data says. Your decision is always yours."

## Confidence Levels
1 = CLEAR SPOT
2 = LEAN
3 = FRAGILE
4 = PASS

## Glossary Callout
Pick one term from: ERA, WHIP, run line, park factor, bullpen. Define it in one plain sentence. No jargon in the definition. Rotate based on what's most relevant to this specific game.

## Forbidden
Never use: lock / hammer / smash / must-bet / free money / guaranteed / best bet / take this / "Vegas knows" / "sharp money says" / "anything can happen" / "wins by roughly a week" / "covers easily" / any phrase requiring insider knowledge to understand.
When describing margin, use plain English: "scores more runs," "wins comfortably," or state the expected run differential plainly.

## Output Format
Return valid JSON only. No markdown, no explanation, no preamble.

{
  "gameShape": "string",
  "keyDrivers": [
    {
      "factor": "string",
      "weight": "primary" | "secondary",
      "direction": "positive" | "negative" | "neutral"
    }
  ],
  "baseScript": "string",
  "fragilityCheck": [
    {
      "item": "string",
      "color": "red" | "green" | "amber"
    }
  ],
  "marketRead": "string",
  "decisionLens": "string",
  "confidenceLevel": 1 | 2 | 3 | 4,
  "confidenceLabel": "CLEAR SPOT" | "LEAN" | "FRAGILE" | "PASS",
  "glossaryTerm": "string",
  "glossaryDefinition": "string"
}`;

function buildMLBUserMessage(data: MLBGameDetailData): string {
  const {
    game, homeTeamStats, awayTeamStats, homeRecentForm, awayRecentForm, injuries,
    homePlayoffContext, awayPlayoffContext, homeBullpen, awayBullpen, h2h, parkFactor, umpire,
  } = data;
  const { homeTeam, awayTeam, odds, homePitcher, awayPitcher } = game;

  const formatRecord = (w: number, l: number) => `${w}-${l}`;
  const formatERA = (era: number) => (era > 0 ? era.toFixed(2) : "N/A");
  const formatOdds = (n: number | null) => (n !== null ? (n > 0 ? `+${n}` : `${n}`) : "N/A");

  const formatPitcher = (p: typeof homePitcher) => {
    if (!p) return "Unknown (probable starter not confirmed)";
    const hand = p.hand ? ` (${p.hand}HP)` : "";
    const recent = p.recentERA !== null ? `, last 3 starts ERA: ${formatERA(p.recentERA)}` : "";
    return `${p.name}${hand} — season ERA: ${formatERA(p.seasonERA)}${recent}`;
  };

  const formatRecentForm = (games: typeof homeRecentForm) =>
    games.map((g) => `${g.result} ${g.teamScore}-${g.opponentScore} vs ${g.opponent}`).join(", ");

  const formatHitters = (hitters: typeof homeTeamStats.topHitters) =>
    hitters
      .map((h) => `${h.playerName} (${h.position}): .${String(Math.round(h.battingAverage * 1000)).padStart(3, "0")} AVG / ${h.homeRuns} HR / ${h.rbi} RBI / ${h.ops.toFixed(3)} OPS`)
      .join("; ");

  const formatInjuries = (inj: { playerName: string; status: string; description: string }[]) => {
    if (inj.length === 0) return "None reported";
    return inj
      .map((p) => {
        const tag = (p.status === "Out" || p.status === "Doubtful") ? "[WILL NOT PLAY] " : "";
        return `${tag}${p.playerName} — ${p.status}${p.description ? ": " + p.description : ""}`;
      })
      .join("\n");
  };

  const formatPlayoffContext = (ctx: MLBPlayoffContext | null, abv: string): string => {
    if (!ctx) return `${abv}: Standings data unavailable`;
    const divStatus =
      ctx.gamesBackDivision === 0 ? "Leads division" : `${ctx.gamesBackDivision} GB from division lead`;
    const wcStatus =
      ctx.wildCardRank !== null
        ? ctx.gamesBackWildCard === 0
          ? `In wild card (#${ctx.wildCardRank})`
          : `WC #${ctx.wildCardRank} — ${ctx.gamesBackWildCard} GB from WC cutoff`
        : "Division leader (not in WC pool)";
    return [
      `${abv} — ${ctx.leagueName} | ${ctx.division} | Division rank #${ctx.divisionRank} | ${ctx.wins}-${ctx.losses}`,
      `Division record: ${ctx.divisionRecord} | ${divStatus}`,
      `Wild card: ${wcStatus}`,
    ].join("\n");
  };

  const formatBullpen = (b: MLBBullpenStats | null, abv: string): string => {
    if (!b) return `${abv}: Bullpen data unavailable`;
    const era7 = b.era7Day !== null ? b.era7Day.toFixed(2) : "N/A";
    const savePct =
      b.saveOpportunities > 0
        ? `${b.saves}/${b.saveOpportunities} (${Math.round((b.saves / b.saveOpportunities) * 100)}%)`
        : "0/0";
    return `${abv}: ERA last 7 days: ${era7} | Saves: ${savePct} | Blown saves: ${b.blownSaves}`;
  };

  const formatH2H = (record: H2HRecord | null): string => {
    if (!record) return "No prior meetings this season";
    const games = record.games
      .map((g) => {
        const homeWon = g.homePts > g.awayPts;
        const winner = homeWon ? g.home : g.away;
        return `${g.date.slice(4, 6)}/${g.date.slice(6, 8)}: ${g.away}@${g.home} ${g.awayPts}-${g.homePts} (${winner} W)`;
      })
      .join(", ");
    return [
      `${homeTeam.teamAbv} vs ${awayTeam.teamAbv} this season: ${record.wins}-${record.losses} (${homeTeam.teamAbv} perspective)`,
      `Games: ${games}`,
      record.wins > 0 ? `Avg margin in ${homeTeam.teamAbv} wins: +${record.avgMarginFor}` : "",
      record.losses > 0 ? `Avg margin in ${homeTeam.teamAbv} losses: -${record.avgMarginAgainst}` : "",
    ].filter(Boolean).join("\n");
  };

  const formatUmpire = (u: MLBUmpire | null): string => {
    if (!u) return "Not yet assigned";
    const tendency = u.tendency
      ? ` — ${u.tendency} (zone tends to ${u.tendency === "pitcher-friendly" ? "run large: more Ks, fewer walks" : "run tight: more walks, higher pitch counts"})`
      : " — no tendency data";
    return `HP Umpire: ${u.name}${tendency}`;
  };

  const formatParkFactor = (pf: MLBParkFactor | null): string => {
    if (!pf) return "";
    const effect =
      pf.factor === "high"
        ? "inflates scoring — totals here run higher than the pitching matchup alone suggests"
        : "suppresses scoring — pitcher ERAs look better here than they would in a neutral park";
    return `━━━ PARK FACTOR ━━━\n${homeTeam.teamAbv} plays at ${pf.parkName} — ${pf.factor.toUpperCase()} run environment: ${effect}.`;
  };

  const parkSection = formatParkFactor(parkFactor);

  return `Game: ${awayTeam.teamName} @ ${homeTeam.teamName}
Date: ${game.gameDate} — ${game.gameTime}
Sport: MLB

━━━ STARTING PITCHERS ━━━
Home (${homeTeam.teamAbv}): ${formatPitcher(homePitcher)}
Away (${awayTeam.teamAbv}): ${formatPitcher(awayPitcher)}

━━━ BETTING LINES ━━━
Moneyline: ${homeTeam.teamAbv} ${formatOdds(odds?.homeMoneyline ?? null)} / ${awayTeam.teamAbv} ${formatOdds(odds?.awayMoneyline ?? null)}
Run Line: ${homeTeam.teamAbv} ${odds?.runLine !== null && odds?.runLine !== undefined ? (odds.runLine > 0 ? `+${odds.runLine}` : odds.runLine) : "N/A"}
Total (O/U): ${odds?.total ?? "N/A"} runs
Implied probability: ${homeTeam.teamAbv} ${odds?.impliedHomeProbability ?? "?"}% / ${awayTeam.teamAbv} ${odds?.impliedAwayProbability ?? "?"}%

━━━ SEASON SERIES (H2H) ━━━
${formatH2H(h2h)}

━━━ PLAYOFF CONTEXT ━━━
${formatPlayoffContext(homePlayoffContext, homeTeam.teamAbv)}

${formatPlayoffContext(awayPlayoffContext, awayTeam.teamAbv)}

━━━ BULLPEN ━━━
${formatBullpen(homeBullpen, homeTeam.teamAbv)}
${formatBullpen(awayBullpen, awayTeam.teamAbv)}

━━━ UMPIRE ━━━
${formatUmpire(umpire)}
${parkSection ? `\n${parkSection}\n` : ""}
━━━ ${homeTeam.teamAbv} (HOME) ━━━
Record: ${formatRecord(homeTeamStats.wins, homeTeamStats.losses)}
Runs/game: ${homeTeamStats.runsPerGame}
Runs allowed/game: ${homeTeamStats.runsAllowedPerGame}
Team ERA: ${formatERA(homeTeamStats.teamERA)}
Top hitters: ${formatHitters(homeTeamStats.topHitters)}
Recent form (last 5): ${formatRecentForm(homeRecentForm)}
Injuries: ${formatInjuries(injuries.homeInjuries)}

━━━ ${awayTeam.teamAbv} (AWAY) ━━━
Record: ${formatRecord(awayTeamStats.wins, awayTeamStats.losses)}
Runs/game: ${awayTeamStats.runsPerGame}
Runs allowed/game: ${awayTeamStats.runsAllowedPerGame}
Team ERA: ${formatERA(awayTeamStats.teamERA)}
Top hitters: ${formatHitters(awayTeamStats.topHitters)}
Recent form (last 5): ${formatRecentForm(awayRecentForm)}
Injuries: ${formatInjuries(injuries.awayInjuries)}

Now produce the six-step Clearbet MLB breakdown. Return valid JSON only.`;
}

export async function generateMLBBreakdown(data: MLBGameDetailData): Promise<BreakdownResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: MLB_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildMLBUserMessage(data) }],
  });

  const raw = message.content[0];
  if (raw.type !== "text") throw new Error("Unexpected Claude response type");

  const json = raw.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  let parsed: BreakdownResult;
  try {
    parsed = JSON.parse(json) as BreakdownResult;
  } catch {
    throw new Error(`Claude returned invalid JSON: ${json.slice(0, 200)}`);
  }

  const CLOSING_LINE = "This is not a pick. This is what the data says. Your decision is always yours.";
  if (!parsed.decisionLens.includes(CLOSING_LINE)) {
    parsed.decisionLens = parsed.decisionLens.trimEnd() + " " + CLOSING_LINE;
  }

  parsed.confidenceLevel = Math.max(1, Math.min(4, parsed.confidenceLevel)) as ConfidenceLevel;
  const labelMap: Record<ConfidenceLevel, ConfidenceLabel> = {
    1: "CLEAR SPOT",
    2: "LEAN",
    3: "FRAGILE",
    4: "PASS",
  };
  parsed.confidenceLabel = labelMap[parsed.confidenceLevel];

  return parsed;
}
