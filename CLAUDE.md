# CLAUDE.md — RawIntel

## Read this first. Every session. No exceptions.

RawIntel is a decision-support system for sports betting at rawintel.ai. Every line of code, every output, every design decision must serve this product and this product only.

---

## What RawIntel IS

- A tool that translates complex game data into clear, structured reasoning
- A system that interprets data, prioritizes what matters, and guides thinking
- A product that helps users make informed betting decisions on their own terms
- An education layer baked into the product experience itself

## What RawIntel is NOT

- Not a picks service
- Not a prediction engine
- Not a raw data dashboard
- Not a gambling content brand
- Not a system that tells users what to bet

---

## The North Star

A user should never leave a RawIntel breakdown thinking: "What should I bet?"

They should leave thinking: "I understand this well enough to decide."

---

## The Six-Step Framework

Every breakdown follows this exact structure. Every sport. Every game. Every time.

### 01 — GAME SHAPE
**Purpose:** Define the environment
**Answer:** What kind of game is this?
**Length:** 2–4 sentences
**Include:** Pace profile, competitiveness, style, stability vs volatility

### 02 — KEY DRIVERS
**Purpose:** Identify what actually matters
**Answer:** What 2–4 factors will decide this game?
**Rule:** Only include what materially impacts the outcome. Never equal weighting. Some factors matter more — reflect that.

### 03 — BASE SCRIPT
**Purpose:** Establish the most likely flow
**Answer:** If things play out normally, what happens?
**Length:** 1 paragraph

### 04 — FRAGILITY CHECK
**Purpose:** Identify failure points
**Answer:** What could break the script?
**Limit:** 2–3 items maximum. Color coded.

### 05 — MARKET READ
**Purpose:** Interpret the betting line
**Answer:** What is the market implying, and does it fit?
**Length:** 1 paragraph
**Rule:** Always translate the line into plain English probability. Never leave a number unexplained.

### 06 — DECISION LENS
**Purpose:** Guide thinking without giving picks
**Answer:** How should the user approach this game?
**Length:** 1 paragraph
**Rule:** Always ends with the closing line. Never names a specific bet.

---

## The Closing Line — Never Changes

> "This is not a pick. This is what the data says. Your decision is always yours."

This line appears at the end of every single Decision Lens. Every sport. Every game. Every time. It never changes. It never gets paraphrased. It never gets removed.

---

## The Glossary Callout — Every Analysis

Every breakdown includes one glossary callout. One term from the analysis defined in one sentence. Always the term most central to understanding the Decision Lens. Links to the Glossary tab.

---

## Voice Rules

**The voice is:** Sharp without swagger. Calm without being passive. Smart without being academic.

**Every sentence must:** frame, prioritize, interpret, or caution. If it does none of these → cut it.

**The Lean Formula — mandatory:**
LEAN + WHY + LIMITER
Example: "This game leans slower because both teams are comfortable in half-court sets, but shooting variance could open it up quickly."

---

## Confidence Levels

Use exactly one per analysis. Use this language exactly.

| Level | Label | Example |
|-------|-------|---------|
| 1 | CLEAR SPOT | "This is one of the cleaner spots on the slate" |
| 2 | LEAN | "The game leans this way on paper" |
| 3 | FRAGILE | "There is logic here, but it's fragile" |
| 4 | PASS | "This is a harder game to trust" |

---

## Signal Grade System

Every breakdown includes a Signal Grade (A–F) calculated from four factors:

1. **Lineup Certainty** — Are starting lineups confirmed?
2. **Line Stability** — Has the spread moved significantly?
3. **Historical Data Depth** — Sufficient head-to-head and trend data?
4. **Environmental Clarity** — Are pace, context, and conditions clear?

Grade reflects data confidence, not outcome confidence.

---

## Allowed Language

**Environment:** stable / volatile / fragile / clean / messy / compressed / open / slower / tight / high-variance / low-variance

**Reasoning:** supports / weakens / depends on / holds if / shifts / aligns with / contradicts

**Guidance:** "if you're looking at this game…" / "the stronger logic centers on…" / "this matters because…"

---

## Forbidden Language — Never Use These

**Hype words:** lock / hammer / smash / must-bet / free money / guaranteed / best bet / take this

**False authority:** "Vegas knows" / "sharp money says" (without data)

**Banned filler:** "anything can happen" / "it will be interesting to see" / "both teams bring…" / "could go either way" (without reasoning)

---

## Color Coding System

- 🔴 **RED** — Negative. Works against the expected outcome.
- 🟢 **GREEN** — Positive. Reinforces the expected outcome.
- 🔵 **BLUE** — Neutral. Relevant context, not clearly positive or negative.
- 🟡 **AMBER** — Status flag. Injury uncertainty, questionable, limited minutes.

---

## Reasoning Rules

1. **Think before writing.** Identify environment → prioritize drivers → define script → identify fragility → interpret market. THEN write.
2. **Prioritize, don't list.** Max 4 drivers. Max 3 fragility points.
3. **No surface-level stats.** Every stat must answer: why does this matter for this specific game tonight?
4. **No equal weighting.** Some factors matter more. Reflect that.
5. **No fake certainty.** Uncertainty is allowed. Confusion is not.
6. **Game first, always.** Never make the game fit a bet. The game is the lens.
7. **Injury framing:** Always use "if confirmed" language for unverified injury status. Auto-assign FRAGILE confidence when multiple players have unverified status.
8. **Playoff context:** Inject month-based NBA playoff context. Never label a playoff game as regular season.

---

## Hard Guardrails

### Never:
- Give direct betting instructions
- Name specific bets or selections
- Act like or imply picks service behavior
- Use hype language of any kind
- Express fake certainty
- Invent trends without sufficient data

### Always:
- Guide thinking — never instruct action
- Maintain six-step structure in every output
- Translate every betting line into plain English
- End every Decision Lens with the closing line
- Include one glossary callout per analysis
- Reflect real reasoning including uncertainty

---

## Current Build State

The following are live and deployed on Vercel:

- Next.js frontend
- Supabase database (breakdowns table includes `card_summary` column)
- Tank01 (NBA + MLB data via RapidAPI)
- The Odds API (live odds)
- Claude API (`claude-sonnet-4-6`) for breakdown generation
- Typography: Playfair Display (headings) + Inter (body) via `next/font/google`
- ShareCard component with PNG export via html2canvas
- Line Translator tool at `/tools/line-translator`
- 20 content pages at `/learn/[slug]`
- Content repurpose engine at `/api/repurpose` + admin UI at `/repurpose`
- GameCard and ArchiveCard with hover states
- Reusable Tooltip component
- Signal Grade system (defined, not yet auto-calculated from live data)

## Pending — Build in This Order

1. Stripe + Supabase Auth (top priority)
2. "My Breakdowns" nav item (after Auth — filters archive by `user_id`)
3. Signal Grade wired to live data
4. Mobile nav collapse below 768px
5. Milwaukee Bucks away color accent
6. Nav z-index fix on archive scroll
7. Featured card variant (after live slate data layer)
8. Line movement tracker
9. PWA setup
10. Tomorrow's slate preview section

Do not build featured card variant until the live slate data layer is connected.

---

## Design Tokens — Use These Exactly

```
--ink:     #0E0E0E
--signal:  #D93B3A
--paper:   #F7F5F0
--canvas:  #FAFAFA
--muted:   #8A8A86
--border:  rgba(14,14,14,0.1)
--serif:   Georgia, 'Times New Roman', serif (Playfair Display via next/font)
--sans:    'Helvetica Neue', Helvetica, Arial, sans-serif (Inter via next/font)
```

**Principles:**
- Dark hero sections (`--ink` background), light content sections (`--canvas` / `--paper`)
- Signal red (`--signal: #D93B3A`) for accents, CTAs, brand dot
- Clean and calm — no clutter, no noise
- Education baked in — glossary callout is part of every output

---

## Data Sources

- Live odds: The Odds API
- NBA + MLB game and player data: Tank01 (separate RapidAPI subscriptions)
- Analysis generation: Claude API (`claude-sonnet-4-6`)

---

## Product Identity

**Name:** RawIntel
**Domain:** rawintel.ai / rawintelsports.com
**Tagline:** What the data says. Your decision to make.
**One sentence:** RawIntel turns raw game data into plain-English breakdowns so you can make informed betting decisions in under 60 seconds.
**GitHub:** kls5h2
**Deployment:** Vercel

## Companion Brand

**She Bets** — content brand targeting women in sports betting. Social handles and Substack set up, no audience built yet. Drives audience that converts to RawIntel paid users. Build content strategy separately — do not mix with RawIntel product build sessions.

---

## The Promise

RawIntel does not predict outcomes.

It builds a system that understands how games behave, explains what the data says, and respects the user enough to let them decide.

Every build decision should serve that promise.

---

## Decision Council

When I say "council gather" — invoke all three subagents in parallel on the idea I provide. Each agent documents reasoning in shared_reasoning.md before returning its report. After all three complete, synthesize a consensus recommendation that identifies where perspectives overlap.

Agents: optimist-strategist, devils-advocate, neutral-analyst
Trigger phrase: "council gather"
Output: Individual reports + consensus + shared_reasoning.md updated

## Design Reference Files
All page designs live in /design-reference/. These HTML files are 
the source of truth for layout, typography, spacing, and copy. 
Do not deviate from them when building pages.

Files:
- rawintel-homepage-v2.html — Homepage
- rawintel-slate-v11.html — Today's Intel
- rawintel-breakdown.html — Breakdown page
- rawintel-how-it-works.html — How It Works
- rawintel-glossary.html — Glossary
- rawintel-line-translator.html — Line Translator
- rawintel-pricing.html — Pricing
- rawintel-my-breakdowns.html — My Breakdowns
- rawintel-login.html — Login / Sign Up
- rawintel-404.html — 404