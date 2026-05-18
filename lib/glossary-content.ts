/**
 * Glossary term definitions for /glossary and /glossary/[slug].
 * All definitions are plain strings — no JSX.
 */

export interface GlossaryTerm {
  slug: string;
  name: string;
  def: string;
  keywords: string;
  badge?: "cb-clear" | "cb-lean" | "cb-fragile" | "cb-pass";
  categoryId: string;
  relatedSlugs?: string[];
}

export interface GlossaryCategory {
  id: string;
  name: string;
  terms: GlossaryTerm[];
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  // ── RawIntel System ────────────────────────────────────────────────────────
  {
    slug: "base-script",
    name: "Base Script",
    def: "The most probable game flow given the data, if nothing unexpected happens. Not a prediction — a structured description of the expected shape. The foundation of the breakdown.",
    keywords: "base script expected outcome probable",
    categoryId: "rawintel",
  },
  {
    slug: "breakdown",
    name: "Breakdown",
    def: "RawIntel's six-step analysis of a game. Covers game shape, key drivers, base script, fragility, market read, and what it all means. Not a pick.",
    keywords: "breakdown rawintel analysis",
    categoryId: "rawintel",
  },
  {
    slug: "clear-spot",
    name: "Clear Spot",
    def: "The data points cleanly in one direction. The environment is stable and the logic holds. One of the cleaner reads on tonight's board.",
    keywords: "clear spot confidence",
    badge: "cb-clear",
    categoryId: "rawintel",
  },
  {
    slug: "confidence-level",
    name: "Confidence Level",
    def: "An honest assessment of how clearly the data points in one direction. Four levels: Clear Spot, Lean, Fragile, Pass. Tells you how clean the read is — not how likely you are to win.",
    keywords: "confidence level clear spot lean fragile pass",
    categoryId: "rawintel",
  },
  {
    slug: "decision-lens",
    name: "Decision Lens",
    def: "Step 6 of the RawIntel framework. Guides how to think about the game without naming a specific bet. Always ends with the closing line.",
    keywords: "decision lens step 6 what this means guidance",
    categoryId: "rawintel",
  },
  {
    slug: "dna-tag",
    name: "DNA Tag",
    def: "A single icon that labels the game's structural profile — how it's likely to be played and scored, independent of which team wins.",
    keywords: "dna tag game profile structure label icon",
    categoryId: "rawintel",
  },
  {
    slug: "fragile",
    name: "Fragile",
    def: "The logic holds but depends on a few things going right. One injury or lineup change could flip the script. Read the Fragility Check carefully.",
    keywords: "fragile confidence risk conditional",
    badge: "cb-fragile",
    categoryId: "rawintel",
  },
  {
    slug: "fragility-check",
    name: "Fragility Check",
    def: "Step 4 of every breakdown. The specific, checkable things that would flip the base script — injuries, lineup changes, early momentum shifts. Read this before deciding anything.",
    keywords: "fragility check risk what breaks",
    categoryId: "rawintel",
    relatedSlugs: ["how-injuries-affect-betting-lines"],
  },
  {
    slug: "game-shape",
    name: "Game Shape",
    def: "Step 1 of every breakdown. Defines what kind of game this is — fast, slow, high-scoring, grind-it-out — before anything else. Sets the context for all other factors.",
    keywords: "game shape type fast slow",
    categoryId: "rawintel",
  },
  {
    slug: "lean",
    name: "Lean",
    def: "There's a directional read but it's not clean. Real factors point one way with enough noise on the other side to keep it from being a Clear Spot.",
    keywords: "lean confidence directional",
    badge: "cb-lean",
    categoryId: "rawintel",
  },
  {
    slug: "market-read",
    name: "Market Read",
    def: "Step 5 of the RawIntel framework. Interprets what the betting line implies and whether it aligns with the data picture.",
    keywords: "market read step 5 line interpretation odds",
    categoryId: "rawintel",
    relatedSlugs: ["how-to-read-betting-odds", "what-does-line-movement-mean"],
  },
  {
    slug: "pass",
    name: "Pass",
    def: "Too many moving parts to form a strong view. The data doesn't land clearly. Knowing when to pass is part of thinking clearly about betting.",
    keywords: "pass confidence skip no edge",
    badge: "cb-pass",
    categoryId: "rawintel",
  },
  {
    slug: "signal-grade",
    name: "Signal Grade",
    def: "RawIntel's overall confidence rating for a breakdown — Clear Spot, Lean, Fragile, or Pass — based on how aligned the data, script, and market are.",
    keywords: "signal grade confidence rating breakdown quality",
    categoryId: "rawintel",
  },

  // ── Game DNA Tags ──────────────────────────────────────────────────────────
  {
    slug: "half-court",
    name: "🧱 Half-Court",
    def: "Slow, deliberate game. Teams run set plays with fewer fast breaks. Totals are usually lower. Execution and defensive schemes matter more than athleticism.",
    keywords: "half court slow deliberate sets",
    categoryId: "dna",
  },
  {
    slug: "low-ceiling",
    name: "💤 Low Ceiling",
    def: "Limited scoring upside for both teams. This game is unlikely to blow open in either direction. Strong defensive matchup, slow pace, or both. The under is often the natural lean.",
    keywords: "low ceiling low scoring defensive tight",
    categoryId: "dna",
    relatedSlugs: ["what-to-look-for-betting-a-total"],
  },
  {
    slug: "star-driven",
    name: "🎯 Star Driven",
    def: "One or two key players will decide this game. Their performance tonight determines the outcome. Check injury reports and recent form before deciding anything.",
    keywords: "star driven player dependent key player",
    categoryId: "dna",
    relatedSlugs: ["how-injuries-affect-betting-lines"],
  },
  {
    slug: "transition-clash",
    name: "⚡ Transition Clash",
    def: "Both teams play at different preferred tempos. Whoever forces their pace controls the game. Watch early possessions — the first team to establish their speed usually wins that battle.",
    keywords: "transition clash pace tempo fast",
    categoryId: "dna",
  },
  {
    slug: "volatile",
    name: "🧨 Volatile",
    def: "High variance game. The outcome is harder to predict than the line suggests. Could go either way by a large margin. Props and totals carry extra risk here.",
    keywords: "volatile high variance unpredictable",
    categoryId: "dna",
  },

  // ── Betting Basics ─────────────────────────────────────────────────────────
  {
    slug: "alternate-line",
    name: "Alternate Line",
    def: "A spread or total offered at different odds than the standard line, letting you buy more or less cushion at adjusted juice.",
    keywords: "alternate line spread total adjusted juice cushion",
    categoryId: "betting",
    relatedSlugs: ["how-does-a-point-spread-work"],
  },
  {
    slug: "buying-points",
    name: "Buying Points",
    def: "Paying extra juice to move the spread or total in your favor, most common near key numbers in NFL.",
    keywords: "buying points juice key numbers nfl spread",
    categoryId: "betting",
    relatedSlugs: ["how-does-a-point-spread-work"],
  },
  {
    slug: "closing-line-value",
    name: "Closing Line Value (CLV)",
    def: "The difference between the line you bet and the closing line. Beating the closing line is the best indicator of long-term betting edge.",
    keywords: "closing line value clv edge long term",
    categoryId: "betting",
    relatedSlugs: ["what-is-closing-line-value"],
  },
  {
    slug: "cover",
    name: "Cover",
    def: "When a team wins against the spread. If Denver is −3.5 and wins by 7, they covered. If they win by 2, they did not cover — even though they won the game outright.",
    keywords: "cover ats against the spread win",
    categoryId: "betting",
    relatedSlugs: ["how-does-a-point-spread-work"],
  },
  {
    slug: "implied-probability",
    name: "Implied Probability",
    def: "What a moneyline translates to as a percentage chance of winning. −150 implies roughly 60% probability. +130 implies roughly 43%. The gap between implied probability and your read is where edges live.",
    keywords: "implied probability percentage odds chance",
    categoryId: "betting",
    relatedSlugs: ["what-is-implied-probability", "how-to-read-betting-odds"],
  },
  {
    slug: "juice-vig",
    name: "Juice / Vig",
    def: "The sportsbook's cut — built into the odds. Most standard bets are priced at −110 on both sides, meaning you bet $110 to win $100. That extra $10 is the juice. It's how the house makes money regardless of the outcome.",
    keywords: "juice vig vigorish sportsbook margin",
    categoryId: "betting",
    relatedSlugs: ["what-is-juice-or-vig", "what-does-minus-110-mean", "how-do-sportsbooks-make-money"],
  },
  {
    slug: "key-numbers",
    name: "Key Numbers",
    def: "In NFL betting, 3 and 7 are the most common margins of victory. Spreads near these numbers carry extra significance.",
    keywords: "key numbers nfl 3 7 margin victory spread",
    categoryId: "betting",
    relatedSlugs: ["how-does-a-point-spread-work", "how-to-know-if-spread-is-too-high"],
  },
  {
    slug: "line-movement",
    name: "Line Movement",
    def: "When the spread or total changes after it opens. Significant movement usually signals sharp (informed) money on one side. Not a reason to blindly follow — but worth knowing.",
    keywords: "line movement shift move sharp money",
    categoryId: "betting",
    relatedSlugs: ["what-does-line-movement-mean"],
  },
  {
    slug: "moneyline",
    name: "Moneyline",
    def: "A bet on which team wins outright, no spread involved. Negative = favorite (−150 means bet $150 to win $100). Positive = underdog (+130 means bet $100 to win $130).",
    keywords: "moneyline ml win straight up",
    categoryId: "betting",
    relatedSlugs: ["what-is-a-moneyline-bet", "how-to-read-betting-odds", "what-does-plus-150-mean"],
  },
  {
    slug: "prop-bet",
    name: "Prop Bet",
    def: "A bet on a specific event within a game — usually a player stat. Examples: Jokić over 28.5 points, LeBron over 7.5 assists. Props are more sensitive to lineup changes and game pace than spread bets.",
    keywords: "prop proposition player stat bet",
    categoryId: "betting",
  },
  {
    slug: "push",
    name: "Push",
    def: "When the final margin exactly matches the spread, resulting in a tie. Your bet is refunded. Example: Denver is −3 and wins by exactly 3. No winner, no loser — money back.",
    keywords: "push tie spread result no winner",
    categoryId: "betting",
    relatedSlugs: ["how-does-a-point-spread-work"],
  },
  {
    slug: "reverse-line-movement",
    name: "Reverse Line Movement",
    def: "When the line moves opposite to the public betting percentage — a signal that sharp money is on the other side.",
    keywords: "reverse line movement sharp money public betting",
    categoryId: "betting",
    relatedSlugs: ["what-does-line-movement-mean", "what-is-sharp-money", "what-does-public-on-one-side-mean"],
  },
  {
    slug: "sharp-money",
    name: "Sharp Money",
    def: "Bets placed by professional or highly informed bettors. Sportsbooks often move lines in response to sharp action. When the line moves against the public, sharp money is usually driving it.",
    keywords: "sharp money informed bettors professional",
    categoryId: "betting",
    relatedSlugs: ["what-is-sharp-money", "what-does-line-movement-mean", "what-does-public-on-one-side-mean"],
  },
  {
    slug: "spread",
    name: "Spread",
    def: "The point handicap a sportsbook assigns to level the playing field. Example: Denver −3.5 means Denver must win by 4+ for a bet on them to pay. Orlando +3.5 means Orlando can lose by 3 and still cover.",
    keywords: "spread point spread ats cover",
    categoryId: "betting",
    relatedSlugs: ["how-does-a-point-spread-work", "how-to-know-if-spread-is-too-high"],
  },
  {
    slug: "steam-move",
    name: "Steam Move",
    def: "A sudden, sharp line movement across multiple sportsbooks at the same time, usually triggered by coordinated sharp action.",
    keywords: "steam move sharp line movement sportsbooks",
    categoryId: "betting",
    relatedSlugs: ["what-is-sharp-money", "what-does-line-movement-mean"],
  },
  {
    slug: "total-over-under",
    name: "Total (Over/Under)",
    def: "A bet on the combined score of both teams. The sportsbook sets a number — you bet whether the actual score goes over or under it. Unrelated to which team wins.",
    keywords: "total over under ou points scored",
    categoryId: "betting",
    relatedSlugs: ["what-does-over-under-mean", "what-to-look-for-betting-a-total"],
  },
  {
    slug: "two-way-market",
    name: "Two-Way Market",
    def: "A bet with only two outcomes — win or lose. No push possible.",
    keywords: "two way market outcomes win lose no push",
    categoryId: "betting",
    relatedSlugs: ["what-is-a-two-way-market"],
  },

  // ── Stats & Data ───────────────────────────────────────────────────────────
  {
    slug: "ats-record",
    name: "ATS Record",
    def: "A team's record against the spread — wins and losses covering, not outright. A team can be 10–2 straight up but 4–8 ATS. More relevant to betting than win-loss record alone.",
    keywords: "ats record against spread cover losses wins",
    categoryId: "stats",
    relatedSlugs: ["how-does-a-point-spread-work"],
  },
  {
    slug: "back-to-back",
    name: "Back-to-Back",
    def: "When a team plays on consecutive nights with no rest day between games. One of the most reliable fragility flags in both sports.",
    keywords: "back to back consecutive nights rest fatigue nba nhl",
    categoryId: "stats",
    relatedSlugs: ["how-injuries-affect-betting-lines"],
  },
  {
    slug: "barrel-rate",
    name: "Barrel Rate",
    def: "The percentage of batted balls hit with optimal exit velocity and launch angle — the best predictor of hard contact and power output.",
    keywords: "barrel rate mlb baseball exit velocity launch angle statcast",
    categoryId: "stats",
  },
  {
    slug: "corsi-percentage",
    name: "Corsi Percentage",
    def: "The percentage of all shot attempts directed toward the opponent's net. The best single measure of possession and territorial control.",
    keywords: "corsi percentage nhl hockey shot attempts possession",
    categoryId: "stats",
  },
  {
    slug: "defensive-rating",
    name: "Defensive Rating",
    def: "Points allowed per 100 possessions. Lower is better. The best defensive teams hold opponents under 110. Elite defenses under 108.",
    keywords: "defensive rating efficiency points allowed 100",
    categoryId: "stats",
  },
  {
    slug: "era",
    name: "ERA",
    def: "Earned Run Average — the average runs a pitcher allows per nine innings. Under 3.00 is elite. Over 5.00 is a concern. One of the most important factors in MLB totals and run lines.",
    keywords: "era earned run average pitching baseball",
    categoryId: "stats",
  },
  {
    slug: "exit-velocity",
    name: "Exit Velocity",
    def: "How hard the ball comes off the bat in mph. Higher exit velocity means better contact quality regardless of outcome.",
    keywords: "exit velocity mlb baseball bat speed contact statcast",
    categoryId: "stats",
  },
  {
    slug: "first-five-innings",
    name: "First Five Innings (F5)",
    def: "An MLB bet that settles after five innings regardless of the final score. Useful when you trust the starting pitchers but not the bullpens. Removes late-game variance from the equation entirely.",
    keywords: "first five innings f5 mlb baseball starter",
    categoryId: "stats",
  },
  {
    slug: "hard-hit-rate",
    name: "Hard-Hit Rate",
    def: "The percentage of balls a batter hits at 95+ mph exit velocity. Measures consistent quality of contact.",
    keywords: "hard hit rate mlb baseball exit velocity contact quality",
    categoryId: "stats",
  },
  {
    slug: "high-danger-save-percentage",
    name: "High Danger Save Percentage",
    def: "Save rate on shots from the highest-quality scoring areas. Separates elite goaltenders from average ones.",
    keywords: "high danger save percentage nhl hockey goaltender",
    categoryId: "stats",
  },
  {
    slug: "home-away-splits",
    name: "Home / Away Splits",
    def: "How dramatically a team's performance changes depending on location. Some teams are elite at home and average on the road. Splits matter most in playoff situations and for teams with strong home crowds.",
    keywords: "home away splits location road performance",
    categoryId: "stats",
  },
  {
    slug: "load-management",
    name: "Load Management",
    def: "When a team intentionally limits a healthy player's minutes — usually late in the season. Check load management situations before any game involving star players. Undisclosed until close to tip-off.",
    keywords: "load management rest minutes nba player",
    categoryId: "stats",
    relatedSlugs: ["how-injuries-affect-betting-lines"],
  },
  {
    slug: "net-rating",
    name: "Net Rating",
    def: "Points scored minus points allowed per 100 possessions. The single best summary of a team's overall quality. Positive is good. Higher is better. More reliable than win-loss record over small samples.",
    keywords: "net rating efficiency plus minus points",
    categoryId: "stats",
  },
  {
    slug: "offensive-rating",
    name: "Offensive Rating",
    def: "Points scored per 100 possessions. Measures how efficiently a team scores, independent of pace. Useful for comparing teams that play at very different speeds.",
    keywords: "offensive rating efficiency scoring points 100",
    categoryId: "stats",
  },
  {
    slug: "pace",
    name: "Pace",
    def: "How many possessions a team averages per game. High pace = more possessions, higher totals. Low pace = fewer possessions, tighter games. One of the most important factors in setting the game shape.",
    keywords: "pace possessions per game speed tempo",
    categoryId: "stats",
    relatedSlugs: ["what-to-look-for-betting-a-total"],
  },
  {
    slug: "passer-rating",
    name: "Passer Rating",
    def: "A formula combining completion percentage, yards per attempt, touchdowns, and interceptions into one efficiency number.",
    keywords: "passer rating nfl quarterback efficiency touchdowns",
    categoryId: "stats",
  },
  {
    slug: "puck-line",
    name: "Puck Line",
    def: "Hockey's point spread, usually set at −1.5 for the favorite, meaning they must win by 2 or more goals to cover.",
    keywords: "puck line nhl hockey spread 1.5 goals",
    categoryId: "stats",
  },
  {
    slug: "pythagorean-record",
    name: "Pythagorean Record",
    def: "Expected wins based on points scored versus points allowed — not actual results. Teams that significantly outperform their Pythagorean record tend to regress. More predictive than straight win-loss over small samples.",
    keywords: "pythagorean record expected wins points luck",
    categoryId: "stats",
  },
  {
    slug: "run-line",
    name: "Run Line",
    def: "Baseball's version of the spread — almost always set at ±1.5 runs. The favorite must win by 2+. The underdog can lose by 1 and still cover. Changes the implied probability significantly.",
    keywords: "run line baseball spread rl",
    categoryId: "stats",
    relatedSlugs: ["how-does-a-point-spread-work"],
  },
  {
    slug: "save-percentage",
    name: "Save Percentage",
    def: "The percentage of shots on goal a goaltender stops. League average is around .910 — anything above .920 is elite.",
    keywords: "save percentage nhl hockey goaltender shots",
    categoryId: "stats",
  },
  {
    slug: "true-shooting-percentage",
    name: "True Shooting Percentage",
    def: "Scoring efficiency that accounts for three-pointers and free throws, not just field goals. More accurate than raw shooting percentage.",
    keywords: "true shooting percentage nba basketball efficiency scoring",
    categoryId: "stats",
  },
  {
    slug: "turnover-differential",
    name: "Turnover Differential",
    def: "The difference between turnovers gained and lost. One of the strongest single-game predictors of NFL outcomes.",
    keywords: "turnover differential nfl football turnovers gained lost",
    categoryId: "stats",
  },
  {
    slug: "usage-rate",
    name: "Usage Rate",
    def: "The percentage of team possessions a player is involved in while on the court. High usage = more shot attempts, more prop relevance. When a teammate is injured, usage rate often spikes — and props follow.",
    keywords: "usage rate player possessions props involved percent",
    categoryId: "stats",
    relatedSlugs: ["how-injuries-affect-betting-lines"],
  },
  {
    slug: "whip",
    name: "WHIP",
    def: "Walks plus Hits per Inning Pitched. Measures how many baserunners a pitcher allows. Under 1.10 is elite. Over 1.40 is a red flag. Lower is better.",
    keywords: "whip walks hits innings pitcher baseball",
    categoryId: "stats",
  },
];

const CATEGORY_ORDER = ["rawintel", "dna", "betting", "stats"] as const;

const CATEGORY_NAMES: Record<string, string> = {
  rawintel: "RawIntel System",
  dna:      "Game DNA Tags",
  betting:  "Betting Basics",
  stats:    "Stats & Data",
};

export const GLOSSARY_CATEGORIES: GlossaryCategory[] = CATEGORY_ORDER.map((id) => ({
  id,
  name: CATEGORY_NAMES[id],
  terms: GLOSSARY_TERMS.filter((t) => t.categoryId === id),
}));

export function getGlossaryTerm(slug: string): GlossaryTerm | undefined {
  return GLOSSARY_TERMS.find((t) => t.slug === slug);
}
