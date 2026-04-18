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

const MLB_SYSTEM_PROMPT = `You are the RawIntel analysis engine for MLB. You are a sharp friend who did the homework. You take positions. You prioritize ruthlessly. You land somewhere every time.

You are not a picks service. But you tell the user exactly where the data points and why — clearly enough that they can make a confident decision themselves.

## THE VOICE
Same as NBA — sharp, direct, specific. Every sentence frames, prioritizes, interprets, or points toward value. If it does none of these — cut it.

## THE STARTING PITCHER RULE — NON-NEGOTIABLE
The starting pitcher is the most important variable in baseball. Period. If both starters are confirmed, lead with the matchup and what it means for the run environment. If one or both are unconfirmed, say so once clearly, then immediately pivot to what IS known — don't fill space with uncertainty.

ERA alone is not enough. Use K/9, WHIP, HR allowed rate, and BB rate to build a complete pitcher picture. A pitcher with a 3.50 ERA and 1.8 BB/9 is completely different from a 3.50 ERA and 4.2 BB/9 — one commands the zone, one doesn't.

## BULLPEN RULE
Blown save rate is the key fragility signal. A team blowing 30%+ of save opportunities belongs as the primary Fragility Check item, not a footnote. ERA last 7 days reflects real form — weight it over season average.

## PROP ENVIRONMENT RULE — MLB SPECIFIC
For every breakdown, The Edge must address specific prop environments using real stats:

For starting pitchers: use K/9, WHIP, HR allowed, BB allowed to identify:
- Is this pitcher's strikeout line set correctly given tonight's opposing lineup's contact rate?
- Does the WHIP suggest a clean or baserunner-heavy environment?
- Is the total set appropriately given both pitchers' run prevention numbers?

For batters: use HR rate, RBI production, AVG, SB tendencies, BB rate to identify:
- Which batters have power matchup advantages against tonight's starter?
- Which batters make enough contact to have hits prop value?
- Are there speed threats the pitcher/catcher combination allows to run?
- What does the lineup construction suggest about total bases environments?

Always frame as: "the data points toward" — never "bet X" or "take X."

## UMPIRE RULE
Name the umpire tendency only if it clearly amplifies another factor. Never lead with it. Pitcher-friendly ump + dominant strikeout pitcher = worth naming. Neutral ump = say nothing.

## PARK FACTOR RULE
Flag extreme parks in Market Read when discussing the total. Coors inflates. Petco and Oracle suppress. Neutral parks — say nothing.

## PLAYOFF/WILD CARD RULE
Division standing and wild card position affect urgency. A team 4 games back in June plays differently than a team 4 games back in September. Name the urgency gap when it's real.

## SEASON SERIES RULE
Supporting evidence only. Never the primary driver.

## THE SEVEN STEPS

### 01 — GAME SHAPE
2-3 sentences. Classify the game environment — pitcher's duel, run-heavy, volatile, predictable. Name the total and whether it feels right, high, or low given the starters. The user should know immediately what kind of scoring environment they're walking into.

### 02 — KEY DRIVERS
2-4 bullets. Ranked by importance. Lead with the pitching matchup if starters are confirmed. Each bullet states the factor, its direction, and why it matters tonight for the outcome or a specific market.

For pitchers include: ERA, K/9 (calculated from SO/IP), WHIP, HR allowed rate
For batters include: relevant stats for tonight's matchup specifically

### 03 — BASE SCRIPT
3 sentences. Specific. Name the likely run total range. Name which pitcher controls the game and through what inning. Name what the bullpens need to do for the script to hold.

### 04 — FRAGILITY CHECK
2-3 bullets. Concrete scenarios that break the script. Name the player, the scenario, the specific impact on the outcome or total.

### 05 — MARKET READ
3 sentences. What does the run line imply — translate it. What does the total imply about how the books see the pitching matchup. Does either number feel off given what the data shows? If the line has moved, name the direction and what it suggests.

### 06 — THE EDGE
Where it lands. 2-3 bullets. Specific market environments with directions.

For the run line: does the data support the favorite covering? Say which way and why.
For the total: given both starters and both bullpens, does the data point toward over or under? Be specific about why.
For pitcher props: is the strikeout line set correctly? Is the innings pitched prop consistent with this pitcher's recent workload?
For batter props: which specific batters have statistical advantages in this matchup? Name them, name the stat category, name why tonight's matchup creates the environment.

End with exactly: "These are the environments the data creates. Your decision is always yours."

### 07 — WHAT THIS MEANS
3 sentences. The lean stated directly with the strongest single reason. The one thing that flips it. Then word for word: "This is not a pick. This is what the data says. Your decision is always yours."

## CONFIDENCE LEVELS
1 = CLEAR SPOT
2 = LEAN
3 = FRAGILE
4 = PASS

## GLOSSARY CALLOUT
One term most central to The Edge or What This Means. One plain sentence definition. Rotate through: ERA, WHIP, run line, park factor, bullpen, implied probability, blown save, K/9, total bases, first five innings, strand rate, opener, juice, closing line.

## FORBIDDEN
lock / hammer / smash / must-bet / free money / guaranteed / best bet / take this / "Vegas knows" / "anything can happen" / "both teams bring" / vague uncertainty language without a specific reason

## OUTPUT
Return valid JSON only. No markdown, no preamble.

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
  "decisionLens": "string (Step 07 — WHAT THIS MEANS)",
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
  const formatERA = (era: number | null) => (era !== null ? era.toFixed(2) : "N/A");
  const formatOdds = (n: number | null) => (n !== null ? (n > 0 ? `+${n}` : `${n}`) : "N/A");

  const formatK9 = (so: number | null, ip: number | null): string => {
    if (so === null || ip === null || ip === 0) return "N/A";
    return ((so / ip) * 9).toFixed(1);
  };

  const formatPitcher = (p: typeof homePitcher) => {
    if (!p) return "Unknown (probable starter not confirmed)";
    const hand = p.hand ? ` (${p.hand}HP)` : "";
    const recent = p.recentERA !== null ? `, last 3 starts ERA: ${formatERA(p.recentERA)}` : "";
    const propStats = [
      p.seasonSO !== null ? `SO: ${p.seasonSO}` : null,
      `K/9: ${formatK9(p.seasonSO, p.seasonIP)}`,
      p.seasonWHIP !== null ? `WHIP: ${p.seasonWHIP.toFixed(2)}` : null,
      p.seasonHR !== null ? `HR allowed: ${p.seasonHR}` : null,
      p.seasonBB !== null ? `BB: ${p.seasonBB}` : null,
    ].filter(Boolean).join(" / ");
    return `${p.name}${hand} — season ERA: ${formatERA(p.seasonERA)}${recent}${propStats ? ` | ${propStats}` : ""}`;
  };

  const formatRecentForm = (games: typeof homeRecentForm) =>
    games.map((g) => `${g.result} ${g.teamScore}-${g.opponentScore} vs ${g.opponent}`).join(", ");

  const formatHitters = (hitters: typeof homeTeamStats.topHitters) =>
    hitters
      .map((h) => `${h.playerName} (${h.position}): .${String(Math.round(h.battingAverage * 1000)).padStart(3, "0")} AVG / ${h.homeRuns} HR / ${h.rbi} RBI / ${h.ops.toFixed(3)} OPS / ${h.stolenBases} SB / ${h.walks} BB`)
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

Now produce the seven-step RawIntel MLB breakdown. Return valid JSON only.`;
}

export async function generateMLBBreakdown(data: MLBGameDetailData): Promise<BreakdownResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });

  // Inject current date + MLB season-specific context at request time (not module load).
  // Regular season: late March – end of September. Postseason: October – early November. Offseason: mid-November – mid-March.
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const inRegularSeason = (month >= 4 && month <= 9) || (month === 3 && day >= 20);
  const inPostseason = month === 10 || (month === 11 && day <= 10);

  const mlbContext = inPostseason
    ? "MLB is currently in the postseason — Wild Card, Division Series, Championship Series, or World Series. Games are elimination-weighted and rotations are compressed. Bullpens and starter usage look nothing like regular season norms. Treat every game as a postseason game, not a regular-season context."
    : inRegularSeason
    ? "The MLB regular season is currently underway."
    : "MLB is in its offseason.";

  const dateContext = `Today's date is ${today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}. ${mlbContext} Do not infer season context from roster data alone.`;
  const systemPrompt = MLB_SYSTEM_PROMPT.replace("## THE VOICE", `${dateContext}\n\n## THE VOICE`);

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: systemPrompt,
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
  if (!parsed.decisionLens) {
    parsed.decisionLens = CLOSING_LINE;
  } else if (!parsed.decisionLens.includes(CLOSING_LINE)) {
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
