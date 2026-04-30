# CLAUDE.md — RawIntel

## Read this first. Every session. No exceptions.

RawIntel is a decision-support tool for sports betting. It translates game data into plain-English reasoning so users can decide for themselves.

Not a picks service. Not a prediction engine. Never tells users what to bet.

**Tagline:** Raw data. Clear read. Your call.

**North star:** Users leave thinking "I understand this well enough to decide" — not "what should I bet?"

---

## Stack

- **Frontend:** Next.js (Vercel) — rawintelsports.com
- **Database:** Supabase
- **Odds:** The Odds API
- **Game/player data:** Tank01 (RapidAPI) — separate NBA and MLB subscriptions
- **Analysis:** Claude API (claude-sonnet-4-20250514)
- **Payments:** Stripe
- **GitHub:** kls5h2

---

## Current Scope

**Live sports:** NBA + MLB
**Function:** User picks a game → live data pulled → six-step breakdown generated
**Output:** Plain-English analysis following the six-step framework
**Not yet live:** NFL, NHL, props, social features

Do not build beyond current scope without explicit instruction.

---

## The Six-Step Framework

Every breakdown. Every game. Every sport. No exceptions. Steps are always in this order.

### 01 — GAME SHAPE
**Purpose:** Define the environment
**Answer:** What kind of game is this?
**Length:** 2–4 sentences
**Include:** Pace profile, competitiveness, style, stability vs volatility
**MLB note:** Include pitching matchup context, ballpark factors, weather if relevant

### 02 — KEY DRIVERS
**Purpose:** Identify what actually matters
**Answer:** What 2–4 factors will decide this game?
**Rule:** No equal weighting. Most important factor first. Only include what materially impacts the outcome tonight.
**MLB note:** Starting pitcher ERA/WHIP, bullpen status, lineup vs handedness are primary drivers

### 03 — BASE SCRIPT
**Purpose:** Establish the most likely flow
**Answer:** If things play out normally, what happens?
**Length:** 1 paragraph

### 04 — FRAGILITY CHECK
**Purpose:** Identify failure points
**Answer:** What could break the script?
**Limit:** 2–3 items maximum. Color coded. Each item must be specific and checkable — not generic.
**MLB note:** Starting pitcher confirmation, bullpen availability, and weather are the most common fragility points

### 05 — MARKET READ
**Purpose:** Interpret the betting line
**Answer:** What is the market implying, and does it fit?
**Length:** 1 paragraph
**Rule:** Always translate the line into plain English probability. Never leave a number unexplained.
**MLB note:** Use "run line" not "spread." Translate implied probability for both ML and total.

### 06 — WHAT THIS MEANS
**Purpose:** Guide thinking without giving picks
**Answer:** How should the user approach this game?
**Length:** 1 paragraph
**Rule:** Always ends with the closing line. Never names a specific bet.

> **The closing line — never changes, never moves:**
> "This is not a pick. This is what the data says. Your decision is always yours."

---

## Where the Data Points

After the six steps, every breakdown includes a "WHERE THE DATA POINTS" section.

This surfaces 1–3 specific data-backed edges — not picks, not bets — framed as areas where the data creates an edge environment. Format:

- **Label** (e.g. TOTAL, RUN LINE, SPREAD): One sentence explaining what the data says and why. One sentence limiter.

The user decides what to do with it.

---

## The Glossary Callout — Every Breakdown

One term per breakdown. Defined in one sentence. Always the term most central to understanding the analysis. Links to /glossary.

---

## Voice Rules

**The voice is:** Sharp without swagger. Calm without being passive. Smart without being academic.

**Every sentence must:** frame, prioritize, interpret, or caution. If it does none of these — cut it.

**The Lean Formula — mandatory for any directional claim:**
LEAN + WHY + LIMITER
*Example: "This game leans slower because both teams are comfortable in half-court sets, but shooting variance could open it up quickly."*

---

## Confidence Levels

Use exactly one per breakdown. This word appears as the confidence badge in the UI.

| Level | Badge | Meaning |
|-------|-------|---------|
| 1 | CLEAR SPOT | Data points cleanly in one direction. Environment is stable. Logic holds. |
| 2 | LEAN | There's a directional edge but real fragility worth knowing. |
| 3 | FRAGILE | Logic exists but depends heavily on one or two variables. |
| 4 | PASS | Too many unknowns. Not enough signal to trust. |

---

## Color Coding System

Used in FRAGILITY CHECK only.

- 🔴 **RED** — Works against the expected outcome
- 🟢 **GREEN** — Reinforces the expected outcome
- 🟡 **AMBER** — Injury uncertainty / questionable status / unconfirmed lineup

Remove 🔵 BLUE — not used in live product.

---

## Allowed Language

**Environment:** stable / volatile / fragile / clean / messy / compressed / open / slower / tight / high-variance / low-variance

**Reasoning:** supports / weakens / depends on / holds if / shifts / aligns with / contradicts

**Guidance:** "if you're looking at this game…" / "the stronger logic centers on…" / "this matters because…"

---

## Forbidden Language — Never Use

**Hype words:** lock / hammer / smash / must-bet / free money / guaranteed / best bet / take this

**False authority:** "Vegas knows" / "sharp money says" (without data)

**Banned filler:** "anything can happen" / "it will be interesting to see" / "both teams bring…" / "could go either way" (without reasoning)

---

## Reasoning Rules

1. **Verify data before writing.** Never analyze a player who is out, traded, or inactive. Never use season stats without checking recent form. Flag if data freshness is uncertain.
2. **Think before writing.** Identify environment → prioritize drivers → define script → identify fragility → interpret market. THEN write.
3. **Prioritize, don't list.** Max 4 drivers. Max 3 fragility points.
4. **No surface-level stats.** Every stat must answer: why does this matter for this specific game tonight?
5. **No equal weighting.** Some factors matter more. Reflect that.
6. **No fake certainty.** Uncertainty is allowed. Confusion is not.
7. **Game first, always.** Never make the game fit a narrative. The data is the lens.

---

## Hard Guardrails

### Never:
- Give direct betting instructions
- Name specific bets or selections
- Imply picks service behavior
- Use hype language of any kind
- Express fake certainty
- Invent trends without sufficient data
- Analyze stale or unverified player data as current

### Always:
- Guide thinking — never instruct action
- Maintain six-step structure in every output
- Translate every betting line into plain English
- End every breakdown with the exact closing line
- Include one glossary callout per breakdown
- Reflect real reasoning including uncertainty

---

## Design System — Locked

**Colors:**
- `--ink: #111110`
- `--signal: #C9352A`
- `--warm-white: #F8F6F2`
- `--cream: #F0EDE6`

**Fonts:** Inter + JetBrains Mono

Do not introduce new colors or fonts without explicit approval.

---

## Terminology — Locked

- **"breakdown"** — not "read," not "analysis," not "pick"
- **"slate"** — not "board," not "schedule"
- **"run line"** — for MLB spread (not "spread")
- **"What This Means"** — step 6 label (not "Decision Lens")
- **"Where the Data Points"** — post-breakdown data edges section

---

## Verify Before Closing a Session

- Does every breakdown follow all six steps in order?
- Is step 6 labeled "WHAT THIS MEANS"?
- Does every breakdown end with the exact closing line?
- Does every breakdown include one glossary callout?
- Does the "Where the Data Points" section appear after the six steps?
- Does any output imply a pick or specific bet?
- Was any player or team data analyzed that could be stale or unverified?
- For MLB: is starting pitcher confirmed? Is bullpen status noted?
