/**
 * Claude API client — generates the six-step Clearbet breakdown.
 * Model: claude-sonnet-4-20250514
 */

import Anthropic from "@anthropic-ai/sdk";
import type { GameDetailData, BreakdownResult, ConfidenceLevel, ConfidenceLabel } from "./types";

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are the Clearbet analysis engine. Produce a six-step breakdown of an NBA game. You are not a picks service. You help people think — you do not tell them what to bet.

## SEASON SERIES RULE
A SEASON SERIES section shows how many times these teams have played this season and who won each game.
- If one team owns the series (e.g. 3-0), that's a pattern worth naming — but don't over-weight it. Small samples lie.
- If the series is split, that signals a genuine competitive matchup. Note it briefly.
- If there are no prior meetings, skip the season series entirely — don't speculate.
- Use the series as supporting context, never as the primary driver of the lean.

## PLAYOFF CONTEXT RULE
A PLAYOFF CONTEXT section is included for each team. Read it before writing Game Shape.
- If a team is eliminated, their motivation tonight is genuinely different — note it.
- If a team has clinched, rest management or load concerns become relevant.
- If a team is fighting for a play-in spot with few games left, that urgency belongs in Game Shape or Fragility Check.
- If both teams are eliminated or both have clinched, say so plainly. Do not invent playoff stakes that don't exist.
- Games back and current streak are proxies for momentum and urgency — use them.

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
  const { game, homeTeamStats, awayTeamStats, homeRecentForm, awayRecentForm, injuries, homePlayoffContext, awayPlayoffContext, h2h } = data;
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

  return `Game: ${awayTeam.teamName} @ ${homeTeam.teamName}
Date: ${game.gameDate} — ${game.gameTime}

━━━ BETTING LINES ━━━
Spread: ${homeTeam.teamAbv} ${formatOdds(odds?.spread ?? null)} (home)
Total (O/U): ${odds?.total ?? "N/A"}
Moneyline: ${homeTeam.teamAbv} ${formatOdds(odds?.homeMoneyline ?? null)} / ${awayTeam.teamAbv} ${formatOdds(odds?.awayMoneyline ?? null)}
Implied probability: ${homeTeam.teamAbv} ${odds?.impliedHomeProbability ?? "?"}% / ${awayTeam.teamAbv} ${odds?.impliedAwayProbability ?? "?"}%

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
