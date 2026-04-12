"use client";

import { useState } from "react";
import Nav from "@/components/Nav";

interface GlossaryEntry {
  term: string;
  definition: string;
  category: "betting" | "market" | "context";
}

const TERMS: GlossaryEntry[] = [
  // Betting basics
  { term: "Spread", definition: "The margin of victory a team must win by for a bet on them to pay out. A -5.5 favorite must win by 6 or more.", category: "betting" },
  { term: "Moneyline", definition: "A straight-up bet on who wins the game, no point spread involved. Favorites pay less; underdogs pay more.", category: "betting" },
  { term: "Total (Over/Under)", definition: "A bet on whether the combined score of both teams will be over or under a set number.", category: "betting" },
  { term: "Run Line", definition: "MLB's version of the spread — almost always set at ±1.5 runs. Betting the favorite means they must win by 2 or more.", category: "betting" },
  { term: "ATS (Against the Spread)", definition: "Whether a team covered the spread. A team can win the game but lose ATS if they didn't win by enough.", category: "betting" },
  { term: "Juice / Vig", definition: "The sportsbook's cut — typically shown as -110, meaning you bet $110 to win $100. It's built into every line.", category: "betting" },
  { term: "Cover", definition: "When a team beats the spread. If a -4 favorite wins by 7, they covered by 3.", category: "betting" },
  { term: "Push", definition: "When the final margin exactly matches the spread, resulting in a refund. A -3 favorite winning by exactly 3 is a push.", category: "betting" },
  { term: "Implied Probability", definition: "What the moneyline odds suggest is the expected win chance. A -150 favorite has an implied probability of about 60%.", category: "betting" },
  { term: "Key Numbers", definition: "Scores that appear most often as final margins — 3 and 7 in NFL, 5 and 7 in NBA. Lines often cluster around these.", category: "betting" },

  // Market signals
  { term: "Opening Line", definition: "The initial odds a sportsbook posts, usually before significant betting action shapes the market.", category: "market" },
  { term: "Closing Line", definition: "The final odds just before the game starts. Sharp bettors consistently beat the closing line — it's the most informed number.", category: "market" },
  { term: "Line Movement", definition: "How the spread or total shifts from open to close. Big movement without an obvious reason (injury, weather) often signals sharp action.", category: "market" },
  { term: "Steam Move", definition: "A fast, coordinated bet from sharp bettors that triggers quick line movement across multiple books simultaneously.", category: "market" },
  { term: "Reverse Line Movement", definition: "When the line moves opposite to where the public is betting. Suggests sharp money is on the less popular side.", category: "market" },
  { term: "Sharp Money", definition: "Bets placed by professional or highly informed bettors. Books adjust lines in response to sharp action.", category: "market" },
  { term: "Public Betting", definition: "The majority side — teams with large fanbases, recent hot streaks, or heavy media attention. Books sometimes shade lines against the public.", category: "market" },
  { term: "Two-Way Market", definition: "A game with balanced action on both sides, suggesting neither team is a clear public favorite. These lines are more reliable.", category: "market" },
  { term: "Fade", definition: "Betting against a team or the public. Fading the public means taking the less popular side.", category: "market" },
  { term: "Hook", definition: "The half-point added to spreads (e.g., -3.5 instead of -3) that eliminates pushes. Buying or selling the hook costs extra juice.", category: "market" },

  // Game context
  { term: "Rest Advantage", definition: "When one team has had more days off than the other. Meaningful in back-to-back situations or after long road trips.", category: "context" },
  { term: "Back-Door Cover", definition: "When a team scores late to cover the spread despite the outcome being decided. Garbage-time points are real for bettors.", category: "context" },
  { term: "Pace", definition: "How fast a team plays, measured by possessions per game. High-pace teams push totals up; slow-pace teams suppress scoring.", category: "context" },
  { term: "Turnover Differential", definition: "The gap between turnovers forced and turnovers committed. Teams that win this tend to win the game.", category: "context" },
  { term: "Park Factor", definition: "MLB metric measuring how a specific ballpark affects scoring relative to league average. Coors Field inflates runs; Petco Park suppresses them.", category: "context" },
  { term: "BABIP", definition: "Batting Average on Balls In Play. A very high or low BABIP often reflects luck that will regress — relevant for evaluating pitcher sustainability.", category: "context" },
  { term: "ERA", definition: "Earned Run Average — runs a pitcher allows per 9 innings, excluding errors. Lower is better.", category: "context" },
  { term: "Bullpen", definition: "The relief pitchers available after the starter exits. A depleted bullpen is a significant risk factor for totals bets.", category: "context" },
  { term: "Net Rating", definition: "Points scored minus points allowed per 100 possessions. The best single-number summary of NBA team quality.", category: "context" },
  { term: "Contrarian", definition: "Betting against popular opinion — taking an unpopular team or side. Works when public perception has inflated the line beyond fair value.", category: "context" },
];

const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  betting: "Betting Basics",
  market: "Market & Lines",
  context: "Game Context",
};

export default function GlossaryPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filtered = TERMS.filter((entry) => {
    const matchesSearch =
      query === "" ||
      entry.term.toLowerCase().includes(query.toLowerCase()) ||
      entry.definition.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = activeCategory === "all" || entry.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#F0F3F7]">
      <Nav backHref="/" />

      <main className="max-w-2xl mx-auto px-4 pt-6 pb-24">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-heading text-[26px] font-extrabold text-[#0D1B2E] leading-tight">
            Glossary
          </h1>
          <p className="mt-1 font-mono text-[11px] font-medium text-[#9FADBF] tracking-wide">
            Plain-English definitions for every term used in Clearbet breakdowns.
          </p>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search terms..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white border border-[#E8ECF2] rounded-xl px-4 py-3 text-[14px] text-[#0D1B2E] placeholder-[#B0BAC9] outline-none focus:border-[#0A7A6C] focus:ring-1 focus:ring-[#0A7A6C] transition-colors shadow-[0_1px_4px_rgba(13,27,46,0.05)]"
          />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`font-mono text-[10px] font-bold tracking-[0.1em] uppercase px-4 py-2 rounded-full transition-colors ${
                activeCategory === key
                  ? "bg-[#0A7A6C] text-white"
                  : "bg-white border border-[#E8ECF2] text-[#9FADBF] hover:border-[#0A7A6C] hover:text-[#0A7A6C]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Term list */}
        {filtered.length === 0 ? (
          <div className="bg-white border border-[#E8ECF2] rounded-xl px-5 py-10 text-center shadow-[0_1px_4px_rgba(13,27,46,0.05)]">
            <p className="text-[14px] text-[#637A96]">No terms match your search.</p>
          </div>
        ) : (
          <div className="bg-white border border-[#E8ECF2] rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(13,27,46,0.05)]">
            {filtered.map((entry, idx) => (
              <div
                key={entry.term}
                className={`px-5 py-4 ${idx !== filtered.length - 1 ? "border-b border-[#EEF1F5]" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-[15px] font-bold text-[#0D1B2E]">{entry.term}</p>
                    <p className="text-[13px] text-[#637A96] leading-[1.6] mt-0.5">{entry.definition}</p>
                  </div>
                  <span className={`shrink-0 mt-0.5 font-mono text-[9px] font-bold tracking-[0.08em] uppercase px-2 py-[2px] rounded-full ${
                    entry.category === "betting"
                      ? "bg-[#EDF1F6] text-[#637A96]"
                      : entry.category === "market"
                      ? "bg-[#F0FAF8] text-[#0A7A6C]"
                      : "bg-[#F0F3F7] text-[#9FADBF]"
                  }`}>
                    {entry.category === "betting" ? "Basics" : entry.category === "market" ? "Market" : "Context"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-8 text-center font-mono text-[11px] font-medium text-[#B0BAC9] tracking-wide">
          {filtered.length} of {TERMS.length} terms
        </p>
      </main>
    </div>
  );
}
