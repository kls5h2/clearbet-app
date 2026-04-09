/**
 * Claude API client — generates the six-step Clearbet breakdown.
 * Model: claude-sonnet-4-20250514
 */

import Anthropic from "@anthropic-ai/sdk";
import type { GameDetailData, BreakdownResult, ConfidenceLevel, ConfidenceLabel } from "./types";

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are the Clearbet analysis engine. Produce a six-step breakdown of an NBA game. You are not a picks service. You help people think — you do not tell them what to bet.

## INJURY RULE — NON-NEGOTIABLE
Before writing anything, read the injury data for both teams. Any player listed as Out or Doubtful does not play tonight — treat them as absent, not as a factor.
- Do not mention an injured player as if they are playing.
- If a key player (a team's top scorer, primary playmaker, or starting big) is out, that absence must be named explicitly in Game Shape or Fragility Check. It changes the game entirely and the user needs to know.
- The top players listed in the data are the players available tonight — cross-reference against injuries and remove anyone who is Out or Doubtful before drawing conclusions.
Violating this rule destroys user trust. Get the injury check right first, then analyze the game.

## The writing rule
Every sentence must earn its place. If it doesn't add new information — cut it.
The test for every sentence: Would a person who bets twice a month understand this immediately on the first read? If no — rewrite it or cut it. No jargon. No stats terms that need explaining. Write like you're texting a smart friend.

## The Six Steps

### 01 — GAME SHAPE
2 sentences only. What kind of game is this and why does that matter tonight. Done.

### 02 — KEY DRIVERS
2–4 bullets. One sentence per bullet — hard limit. One idea per bullet. If you cannot say it in one sentence, cut until you can. No conjunctions to chain ideas together — if you find yourself writing "and" or "but" to connect two thoughts, split them or cut one. Order by importance, most important first. No labels, no jargon.

### 03 — BASE SCRIPT
3–4 sentences maximum. What happens if nothing goes wrong. Written like you're texting a friend who asked "so what's this game about."

### 04 — FRAGILITY CHECK
2–3 bullets. One sentence per bullet — absolute hard limit. Start with the risk. State it. Stop. No explanation after the statement — the statement is the explanation. If the sentence runs past 20 words, cut it in half and keep the half that matters.

### 05 — MARKET READ
2 sentences only. Sentence 1: what the line says in plain English. Sentence 2: does that fit what the data shows or does it feel off.

### 06 — WHAT THIS MEANS
3 sentences only. Sentence 1: the lean and why. Sentence 2: the one thing that changes it. Sentence 3 must be this exact text, word for word: "This is not a pick. This is what the data says. Your decision is always yours."

## Confidence Levels
Assign exactly one:
1 = CLEAR SPOT
2 = LEAN
3 = FRAGILE
4 = PASS

## Glossary Callout
One term from the analysis. Defined in one plain sentence. No jargon in the definition.

## Forbidden
Never use: lock / hammer / smash / must-bet / free money / guaranteed / best bet / take this / "Vegas knows" / "sharp money says" / "anything can happen" / "it will be interesting to see" / "both teams bring" / "wins by roughly a week" / "covers comfortably" / "by a mile" / any sports betting jargon that requires insider knowledge to understand.
When describing a large margin of victory, use plain English: "wins comfortably," "wins by double digits," or state the actual expected point differential plainly. Never use phrases a casual fan would have to Google.

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

function buildUserMessage(data: GameDetailData): string {
  const { game, homeTeamStats, awayTeamStats, homeRecentForm, awayRecentForm, injuries } = data;
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

  return `Game: ${awayTeam.teamName} @ ${homeTeam.teamName}
Date: ${game.gameDate} — ${game.gameTime}

━━━ BETTING LINES ━━━
Spread: ${homeTeam.teamAbv} ${formatOdds(odds?.spread ?? null)} (home)
Total (O/U): ${odds?.total ?? "N/A"}
Moneyline: ${homeTeam.teamAbv} ${formatOdds(odds?.homeMoneyline ?? null)} / ${awayTeam.teamAbv} ${formatOdds(odds?.awayMoneyline ?? null)}
Implied probability: ${homeTeam.teamAbv} ${odds?.impliedHomeProbability ?? "?"}% / ${awayTeam.teamAbv} ${odds?.impliedAwayProbability ?? "?"}%

━━━ ${homeTeam.teamAbv} (HOME) ━━━
Record: ${formatRecord(homeTeamStats.wins, homeTeamStats.losses)}
Points per game: ${homeTeamStats.pointsPerGame}
Points allowed per game: ${homeTeamStats.pointsAllowedPerGame}
Pace (possessions/48): ${homeTeamStats.pace}
Offensive rating: ${homeTeamStats.offensiveRating}
Defensive rating: ${homeTeamStats.defensiveRating}
Rebounds/game: ${homeTeamStats.reboundsPerGame}
Assists/game: ${homeTeamStats.assistsPerGame}
Turnovers/game: ${homeTeamStats.turnoversPerGame}
3-point attempts/game: ${homeTeamStats.threePointAttempts}
3-point %: ${homeTeamStats.threePointPct}%
Top players: ${formatTopPlayers(homeTeamStats.topPlayers)}
Recent form (last 5): ${formatRecentForm(homeRecentForm)}
Injuries: ${formatInjuries(injuries.homeInjuries)}

━━━ ${awayTeam.teamAbv} (AWAY) ━━━
Record: ${formatRecord(awayTeamStats.wins, awayTeamStats.losses)}
Points per game: ${awayTeamStats.pointsPerGame}
Points allowed per game: ${awayTeamStats.pointsAllowedPerGame}
Pace (possessions/48): ${awayTeamStats.pace}
Offensive rating: ${awayTeamStats.offensiveRating}
Defensive rating: ${awayTeamStats.defensiveRating}
Rebounds/game: ${awayTeamStats.reboundsPerGame}
Assists/game: ${awayTeamStats.assistsPerGame}
Turnovers/game: ${awayTeamStats.turnoversPerGame}
3-point attempts/game: ${awayTeamStats.threePointAttempts}
3-point %: ${awayTeamStats.threePointPct}%
Top players: ${formatTopPlayers(awayTeamStats.topPlayers)}
Recent form (last 5): ${formatRecentForm(awayRecentForm)}
Injuries: ${formatInjuries(injuries.awayInjuries)}

Now produce the six-step Clearbet breakdown. Return valid JSON only.`;
}

export async function generateBreakdown(data: GameDetailData): Promise<BreakdownResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildUserMessage(data),
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
