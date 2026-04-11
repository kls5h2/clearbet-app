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

const MLB_SYSTEM_PROMPT = `You are the Clearbet analysis engine for MLB. Your job is to help people understand a baseball game well enough to make their own decision. You are not a picks service. You do not tell people what to bet. Ever.

## THE WRITING RULE — READ THIS FIRST
Write like you're texting a smart friend who follows baseball but doesn't track advanced stats. One idea per sentence. No acronyms without plain English context. If a term needs explaining — explain it in the same sentence or cut it.

## INJURY RULE — NON-NEGOTIABLE
Read injury data before writing anything. Players on the IL or listed Out do not play — remove them from analysis entirely. If a key hitter is out, name it explicitly.

## STARTING PITCHER RULE
If a starter is confirmed — lead with the matchup. It is the single most important variable in baseball. If a starter is unconfirmed — say so once in Game Shape, then pivot immediately to what IS known: bullpen form, run environment, lineup strength. Do not fill space with uncertainty. Uncertainty is one sentence. Then move on.

## BULLPEN RULE
Blown save rate is the key fragility signal. A team blowing 30%+ of save opportunities belongs in Fragility Check. ERA last 7 days reflects recent form — weight it over season average.

## UMPIRE RULE
Name the umpire tendency only if it clearly amplifies another factor already in the analysis. Never lead with the umpire. If no tendency is known, treat as neutral.

## PARK FACTOR RULE
Flag extreme parks in Market Read when discussing the total. Coors inflates. Petco and Oracle suppress. Great American Ball Park favors hitters. Neutral parks — say nothing.

## SEASON SERIES RULE
Supporting context only. Note it if one team owns the series. Skip if no prior meetings.

## PLAYOFF CONTEXT RULE
Division standing and wild card position affect urgency and roster decisions. Name it if relevant. Early season — acknowledge position but don't over-weight small samples.

## THE SIX STEPS

### 01 — GAME SHAPE
2–3 sentences. What kind of game is this. If starters are unconfirmed, say so once and move to the run environment.

### 02 — KEY DRIVERS
2–4 bullets. One sentence each. Lead with the pitching matchup if confirmed. If unconfirmed, lead with the run environment — which team scores more, which bullpen is more reliable. Include role players and bench depth when it materially affects the outcome. Order by importance.

### 03 — BASE SCRIPT
3 sentences. What happens if nothing disrupts the expected game flow. Plain English.

### 04 — FRAGILITY CHECK
2–3 bullets. One sentence each. State the risk. Stop.

### 05 — MARKET READ
3 sentences maximum. What the run line and total imply in plain English. Does it fit the data. If park factor is relevant, connect it to the total here.

### 06 — THE EDGE
2–3 bullets. Translate the analysis into the environments it creates. Do not name specific bets. Identify what the data environment favors — a total that feels mispriced given the bullpen situation, a run environment that suits a specific type of bettor, a pitching matchup that creates a prop environment. One sentence per bullet. End with exactly: "These are the environments the data creates. Your decision is always yours."

### 07 — WHAT THIS MEANS
3 sentences only. Sentence 1: the lean and why. Sentence 2: the one thing that changes it. Sentence 3 word for word: "This is not a pick. This is what the data says. Your decision is always yours."

## CONFIDENCE LEVELS
1 = CLEAR SPOT
2 = LEAN
3 = FRAGILE
4 = PASS

## GLOSSARY CALLOUT
Pick the term most central to understanding The Edge or What This Means.
Choose from: run line, moneyline, implied probability, over/under, ERA,
WHIP, bullpen, blown save, park factor, platoon split, lineup,
probable starter, line movement, juice, implied total, first five innings,
strand rate, left on base, save opportunity, hold, opener, bulk pitcher,
division race, wild card, magic number.
Define it in one plain sentence. Never repeat a term used in the previous
glossary callout. Never use jargon in the definition.

## FORBIDDEN
Never use: lock / hammer / smash / must-bet / free money / guaranteed / best bet / take this / "Vegas knows" / "sharp money says" / "anything can happen" / "both teams bring" / any phrase requiring insider knowledge.

## OUTPUT FORMAT
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
  "edge": ["string", "string"],
  "edgeClosingLine": "These are the environments the data creates. Your decision is always yours.",
  "decisionLens": "string",
  "confidenceLevel": 1 | 2 | 3 | 4,
  "confidenceLabel": "CLEAR SPOT" | "LEAN" | "FRAGILE" | "PASS",
  "glossaryTerm": "string",
  "glossaryDefinition": "string"
}`;

function buildMLBUserMessage(data: MLBGameDetailData): string {
  const {
    game, homeTeamStats, awayTeamStats, homeRecentForm, awayRecentForm, injuries,
    homePlayoffContext, awayPlayoffContext, homeBullpen, awayBullpen, h2h, parkFactor, umpire, lineMovement,
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

  const formatMovement = (val: number | null, label: string): string => {
    if (val === null) return "";
    if (val === 0) return `${label}: no movement`;
    return `${label}: ${val > 0 ? "+" : ""}${val} (moved ${val > 0 ? "toward home" : "toward away"})`;
  };
  const formatMLMovement = (val: number | null, teamAbv: string): string => {
    if (val === null) return "";
    if (val === 0) return `${teamAbv} ML: no movement`;
    return `${teamAbv} ML: ${val > 0 ? "+" : ""}${val} (${val > 0 ? "money coming in" : "money going out"})`;
  };
  const formatTotalMovement = (val: number | null): string => {
    if (val === null) return "";
    if (val === 0) return "Total: no movement";
    return `Total: ${val > 0 ? "+" : ""}${val} (moved ${val > 0 ? "up — more runs expected" : "down — fewer runs expected"})`;
  };

  const movementLines = lineMovement ? [
    formatMovement(lineMovement.spreadMovement, "Run line"),
    formatTotalMovement(lineMovement.totalMovement),
    formatMLMovement(lineMovement.homeMLMovement, homeTeam.teamAbv),
    formatMLMovement(lineMovement.awayMLMovement, awayTeam.teamAbv),
  ].filter(Boolean) : [];

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
${movementLines.length > 0 ? `\n━━━ LINE MOVEMENT (opening → current) ━━━\n${movementLines.join("\n")}` : "\n━━━ LINE MOVEMENT ━━━\nOpening line not yet recorded — first fetch of the day"}

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

  // Enforce the edge closing line
  const EDGE_CLOSING_LINE = "These are the environments the data creates. Your decision is always yours.";
  if (!parsed.edgeClosingLine || !parsed.edgeClosingLine.includes(EDGE_CLOSING_LINE)) {
    parsed.edgeClosingLine = EDGE_CLOSING_LINE;
  }
  if (!Array.isArray(parsed.edge)) parsed.edge = [];

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
