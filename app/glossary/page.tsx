"use client";

import { useState } from "react";
import Nav from "@/components/Nav";

interface GlossaryEntry {
  term: string;
  definition: string;
  sport: string;
  sportTagBg: string;
  sportTagColor: string;
}

const TERMS: GlossaryEntry[] = [
  // A
  { term: "Against the spread (ATS)", definition: "Whether a team covered the point spread — not just whether they won. A team can win the game but still fail to cover if they didn't win by enough.", sport: "NBA · NFL", sportTagBg: "#E6F4F2", sportTagColor: "#0A7A6C" },
  // B
  { term: "Blown save", definition: "When a relief pitcher enters with a lead and allows the opposing team to tie or take the lead. A high blown-save rate signals a fragile bullpen.", sport: "MLB", sportTagBg: "#FEF9EC", sportTagColor: "#92400E" },
  { term: "Bullpen", definition: "The group of relief pitchers who come in after the starter leaves. Their recent ERA and save rate tell you how well they've been protecting leads.", sport: "MLB", sportTagBg: "#FEF9EC", sportTagColor: "#92400E" },
  // C
  { term: "Cover", definition: "When a team wins by more than the spread requires. If a team is favored by −6.5 and wins by 7, they covered.", sport: "All sports", sportTagBg: "#E6F4F2", sportTagColor: "#0A7A6C" },
  { term: "Corsi percentage", definition: "The percentage of all shot attempts directed toward the opponent's net — the best single measure of possession and territorial control.", sport: "NHL", sportTagBg: "#EEF1F5", sportTagColor: "#3A5470" },
  // E
  { term: "ERA", definition: "Earned Run Average — the average runs a pitcher allows per nine innings. Under 3.00 is elite. Over 5.00 is a real concern.", sport: "MLB", sportTagBg: "#FEF9EC", sportTagColor: "#92400E" },
  // I
  { term: "Implied probability", definition: "What the moneyline translates to as a percentage chance of winning. A −164 moneyline implies roughly a 62% chance. A +130 implies roughly 43%.", sport: "All sports", sportTagBg: "#E6F4F2", sportTagColor: "#0A7A6C" },
  // F
  { term: "First five innings", definition: "A bet that only covers what happens through the first five innings of a game, before either team's bullpen takes over. Useful when one starting pitcher is clearly better than the other but you don't trust the relief pitching on either side.", sport: "MLB", sportTagBg: "#FEF9EC", sportTagColor: "#92400E" },
  // L
  { term: "Line movement", definition: "How the spread or total has changed since it first opened. Significant movement usually signals where informed money is going.", sport: "All sports", sportTagBg: "#E6F4F2", sportTagColor: "#0A7A6C" },
  { term: "Load management", definition: "When a team intentionally limits a healthy star player's minutes — usually near the end of the season — to keep them fresh for the playoffs.", sport: "NBA", sportTagBg: "#EEF1F5", sportTagColor: "#3A5470" },
  // M
  { term: "Moneyline", definition: "A bet on which team wins outright, with no spread involved. Favorites have negative odds (−150), underdogs have positive odds (+130).", sport: "All sports", sportTagBg: "#E6F4F2", sportTagColor: "#0A7A6C" },
  // N
  { term: "Net rating", definition: "Points scored minus points allowed per 100 possessions. The best single-number summary of NBA team quality.", sport: "NBA", sportTagBg: "#EEF1F5", sportTagColor: "#3A5470" },
  // P
  { term: "Park factor", definition: "How a specific ballpark affects scoring vs league average. Coors Field inflates run totals. Petco Park suppresses them.", sport: "MLB", sportTagBg: "#FEF9EC", sportTagColor: "#92400E" },
  { term: "Puck line", definition: "Hockey's point spread — usually −1.5 for the favorite, meaning they must win by 2 or more goals to cover.", sport: "NHL", sportTagBg: "#EEF1F5", sportTagColor: "#3A5470" },
  // R
  { term: "Run line", definition: "Baseball's version of the spread — almost always set at ±1.5 runs. Betting the favorite means they must win by 2 or more.", sport: "MLB", sportTagBg: "#FEF9EC", sportTagColor: "#92400E" },
  // S
  { term: "Spread", definition: "The number of points a favorite must win by for a bet on them to pay. A −6.5 spread means the favorite must win by 7 or more.", sport: "All sports", sportTagBg: "#E6F4F2", sportTagColor: "#0A7A6C" },
  // U
  { term: "Usage rate", definition: "The percentage of team possessions that run through a specific player on the court. High usage means the offense depends heavily on that player.", sport: "NBA", sportTagBg: "#EEF1F5", sportTagColor: "#3A5470" },
  // W
  { term: "WHIP", definition: "Walks plus hits per inning pitched — the best measure of how many baserunners a pitcher allows. Under 1.10 is excellent. Over 1.40 is a concern.", sport: "MLB", sportTagBg: "#FEF9EC", sportTagColor: "#92400E" },
];

// Group by first letter
function groupByLetter(terms: GlossaryEntry[]): Map<string, GlossaryEntry[]> {
  const map = new Map<string, GlossaryEntry[]>();
  for (const t of terms) {
    const letter = t.term[0].toUpperCase();
    if (!map.has(letter)) map.set(letter, []);
    map.get(letter)!.push(t);
  }
  return map;
}

export default function GlossaryPage() {
  const [query, setQuery] = useState("");

  const filtered = TERMS.filter(
    (t) =>
      query === "" ||
      t.term.toLowerCase().includes(query.toLowerCase()) ||
      t.definition.toLowerCase().includes(query.toLowerCase())
  );

  const grouped = groupByLetter(filtered);
  const letters = Array.from(grouped.keys()).sort();

  return (
    <div style={{ background: "#F0F3F7", minHeight: "100vh", paddingBottom: "5rem" }}>
      <Nav activePage="glossary" />

      {/* Dark navy page header */}
      <div style={{ background: "#0D1B2E", padding: "2.5rem 1.5rem 2rem", marginBottom: "0" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#0A7A6C", marginBottom: "8px" }}>
            Glossary
          </p>
          <h1 style={{ fontSize: "30px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: "10px" }}>
            Know the Language
          </h1>
          <p style={{ fontSize: "14px", color: "#637A96", fontWeight: 500, lineHeight: 1.6, maxWidth: "440px" }}>
            Terms used in ClearBet breakdowns, defined simply.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "2rem 1.5rem 0" }}>
        {/* Search */}
        <input
          type="text"
          placeholder="Search terms…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            background: "#FFFFFF", border: "1px solid #E8ECF2", borderRadius: "10px",
            padding: "11px 16px", fontFamily: "inherit", fontSize: "14px", fontWeight: 500,
            color: "#0D1B2E", width: "100%", marginBottom: "2rem", outline: "none",
            boxShadow: "0 1px 4px rgba(13,27,46,0.05)", transition: "border-color 0.15s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#0A7A6C")}
          onBlur={(e) => (e.target.style.borderColor = "#E8ECF2")}
        />

        {filtered.length === 0 && (
          <div style={{ background: "#FFFFFF", border: "1px solid #E8ECF2", borderRadius: "14px", padding: "40px 24px", textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: "#637A96" }}>No terms match your search.</p>
          </div>
        )}

        {/* Alphabetical sections */}
        {letters.map((letter) => (
          <div key={letter} style={{ marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "22px", fontWeight: 800, color: "#0A7A6C", letterSpacing: "-0.02em", marginBottom: "10px" }}>
              {letter}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {grouped.get(letter)!.map((entry) => (
                <div
                  key={entry.term}
                  style={{
                    background: "#FFFFFF", border: "1px solid #E8ECF2", borderRadius: "12px",
                    padding: "16px 18px", boxShadow: "0 1px 4px rgba(13,27,46,0.05)",
                  }}
                >
                  <span style={{
                    display: "inline-flex", alignItems: "center",
                    fontSize: "9px", fontWeight: 800, letterSpacing: "0.1em",
                    textTransform: "uppercase", padding: "2px 8px", borderRadius: "999px",
                    marginBottom: "8px", background: entry.sportTagBg, color: entry.sportTagColor,
                  }}>
                    {entry.sport}
                  </span>
                  <p style={{ fontSize: "16px", fontWeight: 800, color: "#0D1B2E", letterSpacing: "-0.02em", marginBottom: "8px", lineHeight: 1.2 }}>
                    {entry.term}
                  </p>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "#637A96", lineHeight: 1.65 }}>
                    {entry.definition}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
