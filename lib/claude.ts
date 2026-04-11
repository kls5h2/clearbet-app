/**
 * Claude API client — generates the six-step Clearbet breakdown.
 * Model: claude-sonnet-4-20250514
 */

import Anthropic from "@anthropic-ai/sdk";
import type { GameDetailData, BreakdownResult, ConfidenceLevel, ConfidenceLabel } from "./types";

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are the Clearbet analysis engine. Your job is to help people understand a game well enough to make their own decision. You are not a picks service. You do not tell people what to bet. Ever.

## THE WRITING RULE — READ THIS FIRST
Write like you're texting a smart friend who watches the games but doesn't track advanced stats. One idea per sentence. If a sentence runs long, cut it in half and keep the half that matters. No jargon. No insider terms without explanation. If a casual fan would have to Google it — rewrite it.

## INJURY RULE — NON-NEGOTIABLE
Read injury data for both teams before writing anything. Players listed Out or Doubtful do not play tonight — remove them from your analysis entirely. If a key player is out, name it explicitly in Game Shape or Fragility Check. Do not mention an injured player as if they are available.

## SEASON SERIES RULE
Use season series as supporting context only — never as the primary driver. If one team owns the series, note it briefly. If split, note the competitiveness. If no prior meetings, skip it entirely.

## PLAYOFF CONTEXT RULE
Read playoff context before writing Game Shape. Eliminated teams have different motivation — say so. Clinched teams may rest players — that belongs in Fragility Check. Teams fighting for play-in spots with urgency — that belongs in Game Shape.

## THE SIX STEPS

### 01 — GAME SHAPE
2–3 sentences. What kind of game is this and why does it matter tonight. Include playoff context if it changes the game environment.

### 02 — KEY DRIVERS
2–4 bullets. One sentence per bullet, hard limit. Order by importance — most important first. Include stars AND role players when a role player materially affects the outcome — a missing backup point guard in foul trouble changes a game. No equal weighting — if one factor matters more, put it first and say why.

### 03 — BASE SCRIPT
3 sentences. What happens if nothing goes wrong. Plain English only.

### 04 — FRAGILITY CHECK
2–3 bullets. One sentence each. State the risk. Stop. No explanation after the statement.

### 05 — MARKET READ
3 sentences maximum. What the line implies in plain English. Does it fit the data or feel off. If the line has moved, say which direction and what that signals.

### 06 — THE EDGE
2–3 bullets. This is where you translate the analysis into the environments it creates for different bet types. Do not name specific bets or lines. Do not say "take" or "bet." Instead: identify what the data environment favors — a pace that suits under bettors, a usage pattern that creates a prop environment, a spread that feels mispriced given a specific risk. One sentence per bullet. End this section with exactly: "These are the environments the data creates. Your decision is always yours."

### 07 — WHAT THIS MEANS
3 sentences only. Sentence 1: the lean and why in plain English. Sentence 2: the one thing that changes it. Sentence 3 must be word for word: "This is not a pick. This is what the data says. Your decision is always yours."

## CONFIDENCE LEVELS
Assign exactly one:
1 = CLEAR SPOT
2 = LEAN
3 = FRAGILE
4 = PASS

## GLOSSARY CALLOUT
Pick the term most central to understanding The Edge or What This Means.
Choose from: spread, moneyline, implied probability, line movement, cover,
push, against the spread (ATS), over/under, load management, usage rate,
true shooting percentage, pace, point differential, back-to-back,
playoff seeding, play-in, closing line, public money, key numbers.
Define it in one plain sentence. Never repeat a term used in the previous
glossary callout. Never use jargon in the definition.

## FORBIDDEN
Never use: lock / hammer / smash / must-bet / free money / guaranteed / best bet / take this / "Vegas knows" / "sharp money says" / "anything can happen" / "it will be interesting to see" / "both teams bring" / "could go either way" / any phrase a casual fan would have to Google.

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

function buildUserMessage(data: GameDetailData): string {
  const { game, homeTeamStats, awayTeamStats, homeRecentForm, awayRecentForm, injuries, homePlayoffContext, awayPlayoffContext, h2h, lineMovement } = data;
  const { homeTeam, awayTeam, odds } = game;

  const formatRecord = (w: number, l: number) => `${w}-${l}`;
  const formatOdds = (n: number | null) => (n !== null ? (n > 0 ? `+${n}` : `${n}`) : "N/A");
  const formatRecentForm = (games: typeof homeRecentForm) =>
    games.map((g) => `${g.result} ${g.teamScore}-${g.opponentScore} vs ${g.opponent} (total: ${g.total})`).join(", ");

  const formatInjuries = (injuries: { playerName: string; position: string; status: string; description: string }[]) => {
    if (injuries.length === 0) return "None reported";
    return injuries
      .map((p) => {
        const tag = (p.status === "Out" || p.status === "Doubtful") ? `[WILL NOT PLAY] ` : "";
        return `${tag}${p.playerName} (${p.position}) — ${p.status}${p.description ? ": " + p.description : ""}`;
      })
      .join("\n");
  };

  const formatTopPlayers = (players: typeof homeTeamStats.topPlayers) =>
    players
      .map((p) => `${p.playerName} (${p.position}): ${p.pointsPerGame} PPG / ${p.assistsPerGame} APG / ${p.reboundsPerGame} RPG`)
      .join("; ");

  const formatPlayoffContext = (
    ctx: typeof homePlayoffContext,
    teamAbv: string,
    wins: number,
    losses: number
  ): string => {
    if (!ctx) return "Standings data unavailable";
    const statusLabel: Record<string, string> = {
      "clinched-playoff":   "CLINCHED playoff berth (top-6 seed)",
      "in-playoff":         "Currently IN playoffs (top-6 seed)",
      "play-in":            "Currently in PLAY-IN position (7–10 seed)",
      "play-in-contention": "Chasing PLAY-IN spot (outside top 10, not eliminated)",
      "eliminated":         "ELIMINATED from playoff contention",
    };
    return [
      `${teamAbv} — ${ctx.conference} seed #${ctx.seed} | ${wins}-${losses} | ${ctx.gamesRemaining} games remaining`,
      `Status: ${statusLabel[ctx.playoffStatus] ?? ctx.playoffStatus}`,
      ctx.clinched ? "Clinched: Yes" : "",
      ctx.gamesBack > 0 ? `Games back of 1st: ${ctx.gamesBack}` : "Holds 1st seed in conference",
      ctx.gamesBackSix > 0 ? `Games back of 6th (auto-playoff cutoff): ${ctx.gamesBackSix}` : "",
      ctx.gamesBackTen > 0 ? `Games back of 10th (play-in cutoff): ${ctx.gamesBackTen}` : "",
      ctx.currentStreak ? `Current streak: ${ctx.currentStreak}` : "",
    ].filter(Boolean).join("\n");
  };

  const optionalStat = (label: string, value: number | null | undefined, decimals = 1): string =>
    value != null && value > 0 ? `\n${label}: ${value.toFixed(decimals)}` : "";

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

  const movementLines = lineMovement ? [
    formatMovement(lineMovement.spreadMovement, "Spread"),
    formatMovement(lineMovement.totalMovement, "Total"),
    formatMLMovement(lineMovement.homeMLMovement, homeTeam.teamAbv),
    formatMLMovement(lineMovement.awayMLMovement, awayTeam.teamAbv),
  ].filter(Boolean) : [];

  return `Game: ${awayTeam.teamName} @ ${homeTeam.teamName}
Date: ${game.gameDate} — ${game.gameTime}

━━━ BETTING LINES ━━━
Spread: ${homeTeam.teamAbv} ${formatOdds(odds?.spread ?? null)} (home)
Total (O/U): ${odds?.total ?? "N/A"}
Moneyline: ${homeTeam.teamAbv} ${formatOdds(odds?.homeMoneyline ?? null)} / ${awayTeam.teamAbv} ${formatOdds(odds?.awayMoneyline ?? null)}
Implied probability: ${homeTeam.teamAbv} ${odds?.impliedHomeProbability ?? "?"}% / ${awayTeam.teamAbv} ${odds?.impliedAwayProbability ?? "?"}%
${movementLines.length > 0 ? `\n━━━ LINE MOVEMENT (opening → current) ━━━\n${movementLines.join("\n")}` : "\n━━━ LINE MOVEMENT ━━━\nOpening line not yet recorded — first fetch of the day"}

━━━ SEASON SERIES (H2H) ━━━
${h2h
  ? `${homeTeam.teamAbv} vs ${awayTeam.teamAbv} this season: ${h2h.wins}-${h2h.losses} (${homeTeam.teamAbv} perspective)
Games: ${h2h.games.map((g) => {
    const homeWon = g.homePts > g.awayPts;
    const refIsHome = g.home === homeTeam.teamAbv;
    const winner = homeWon ? g.home : g.away;
    return `${g.date.slice(4, 6)}/${g.date.slice(6, 8)}: ${g.away}@${g.home} ${g.awayPts}-${g.homePts} (${winner} W)`;
  }).join(", ")}
${h2h.wins > 0 ? `Avg margin in ${homeTeam.teamAbv} wins: +${h2h.avgMarginFor}` : ""}${h2h.losses > 0 ? `  Avg margin in ${homeTeam.teamAbv} losses: -${h2h.avgMarginAgainst}` : ""}`
  : "No prior meetings this season"}

━━━ PLAYOFF CONTEXT ━━━
${formatPlayoffContext(homePlayoffContext, homeTeam.teamAbv, homeTeamStats.wins, homeTeamStats.losses)}

${formatPlayoffContext(awayPlayoffContext, awayTeam.teamAbv, awayTeamStats.wins, awayTeamStats.losses)}

━━━ ${homeTeam.teamAbv} (HOME) ━━━
Record: ${formatRecord(homeTeamStats.wins, homeTeamStats.losses)}
Points per game: ${homeTeamStats.pointsPerGame}
Points allowed per game: ${homeTeamStats.pointsAllowedPerGame}${optionalStat("Pace", homeTeamStats.pace)}${optionalStat("Offensive rating", homeTeamStats.offensiveRating)}${optionalStat("Defensive rating", homeTeamStats.defensiveRating)}${optionalStat("Rebounds per game", homeTeamStats.reboundsPerGame)}${optionalStat("Assists per game", homeTeamStats.assistsPerGame)}${optionalStat("Turnovers per game", homeTeamStats.turnoversPerGame)}${optionalStat("3pt attempts per game", homeTeamStats.threePointAttempts)}${optionalStat("3pt%", homeTeamStats.threePointPct, 3)}
Top players: ${formatTopPlayers(homeTeamStats.topPlayers)}
Recent form (last 5): ${formatRecentForm(homeRecentForm)}
Injuries: ${formatInjuries(injuries.homeInjuries)}

━━━ ${awayTeam.teamAbv} (AWAY) ━━━
Record: ${formatRecord(awayTeamStats.wins, awayTeamStats.losses)}
Points per game: ${awayTeamStats.pointsPerGame}
Points allowed per game: ${awayTeamStats.pointsAllowedPerGame}${optionalStat("Pace", awayTeamStats.pace)}${optionalStat("Offensive rating", awayTeamStats.offensiveRating)}${optionalStat("Defensive rating", awayTeamStats.defensiveRating)}${optionalStat("Rebounds per game", awayTeamStats.reboundsPerGame)}${optionalStat("Assists per game", awayTeamStats.assistsPerGame)}${optionalStat("Turnovers per game", awayTeamStats.turnoversPerGame)}${optionalStat("3pt attempts per game", awayTeamStats.threePointAttempts)}${optionalStat("3pt%", awayTeamStats.threePointPct, 3)}
Top players: ${formatTopPlayers(awayTeamStats.topPlayers)}
Recent form (last 5): ${formatRecentForm(awayRecentForm)}
Injuries: ${formatInjuries(injuries.awayInjuries)}

Now produce the six-step Clearbet breakdown. Return valid JSON only.`;
}

export async function generateBreakdown(data: GameDetailData): Promise<BreakdownResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const userMessage = buildUserMessage(data);
  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  const raw = message.content[0];
  if (raw.type !== "text") throw new Error("Unexpected Claude response type");

  // Strip any accidental markdown code fences
  const json = raw.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  let parsed: BreakdownResult;
  try {
    parsed = JSON.parse(json) as BreakdownResult;
  } catch {
    throw new Error(`Claude returned invalid JSON: ${json.slice(0, 200)}`);
  }

  // Validate the closing line is present in decisionLens
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

  // Clamp confidence level
  parsed.confidenceLevel = Math.max(1, Math.min(4, parsed.confidenceLevel)) as ConfidenceLevel;

  // Ensure confidenceLabel matches level
  const labelMap: Record<ConfidenceLevel, ConfidenceLabel> = {
    1: "CLEAR SPOT",
    2: "LEAN",
    3: "FRAGILE",
    4: "PASS",
  };
  parsed.confidenceLabel = labelMap[parsed.confidenceLevel];

  return parsed;
}
