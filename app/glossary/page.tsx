"use client";

import { useState } from "react";
import Nav from "@/components/Nav";

interface GlossaryEntry {
  term: string;
  definition: string;
  sport: string;
}

const TERMS: GlossaryEntry[] = [
  { term: "Against the spread (ATS)", definition: "Whether a team covered the point spread — not just whether they won. A team can win the game but still fail to cover if they didn't win by enough.", sport: "NBA · NFL" },
  { term: "Blown save", definition: "When a relief pitcher enters with a lead and allows the opposing team to tie or take the lead. A high blown-save rate signals a fragile bullpen.", sport: "MLB" },
  { term: "Bullpen", definition: "The group of relief pitchers who come in after the starter leaves. Their recent ERA and save rate tell you how well they've been protecting leads.", sport: "MLB" },
  { term: "Corsi percentage", definition: "The percentage of all shot attempts directed toward the opponent's net — the best single measure of possession and territorial control.", sport: "NHL" },
  { term: "Cover", definition: "When a team wins by more than the spread requires. If a team is favored by −6.5 and wins by 7, they covered.", sport: "All sports" },
  { term: "ERA", definition: "Earned Run Average — the average runs a pitcher allows per nine innings. Under 3.00 is elite. Over 5.00 is a real concern.", sport: "MLB" },
  { term: "First five innings", definition: "A bet that only covers what happens through the first five innings of a game, before either team's bullpen takes over. Useful when one starting pitcher is clearly better than the other but you don't trust the relief pitching on either side.", sport: "MLB" },
  { term: "Implied probability", definition: "What the moneyline translates to as a percentage chance of winning. A −164 moneyline implies roughly a 62% chance. A +130 implies roughly 43%.", sport: "All sports" },
  { term: "Line movement", definition: "How the spread or total has changed since it first opened. Significant movement usually signals where informed money is going.", sport: "All sports" },
  { term: "Load management", definition: "When a team intentionally limits a healthy star player's minutes — usually near the end of the season — to keep them fresh for the playoffs.", sport: "NBA" },
  { term: "Moneyline", definition: "A bet on which team wins outright, with no spread involved. Favorites have negative odds (−150), underdogs have positive odds (+130).", sport: "All sports" },
  { term: "Net rating", definition: "Points scored minus points allowed per 100 possessions. The best single-number summary of NBA team quality.", sport: "NBA" },
  { term: "Park factor", definition: "How a specific ballpark affects scoring vs league average. Coors Field inflates run totals. Petco Park suppresses them.", sport: "MLB" },
  { term: "Puck line", definition: "Hockey's point spread — usually −1.5 for the favorite, meaning they must win by 2 or more goals to cover.", sport: "NHL" },
  { term: "Run line", definition: "Baseball's version of the spread — almost always set at ±1.5 runs. Betting the favorite means they must win by 2 or more.", sport: "MLB" },
  { term: "Spread", definition: "The number of points a favorite must win by for a bet on them to pay. A −6.5 spread means the favorite must win by 7 or more.", sport: "All sports" },
  { term: "Usage rate", definition: "The percentage of team possessions that run through a specific player on the court. High usage means the offense depends heavily on that player.", sport: "NBA" },
  { term: "WHIP", definition: "Walks plus hits per inning pitched — the best measure of how many baserunners a pitcher allows. Under 1.10 is excellent. Over 1.40 is a concern.", sport: "MLB" },
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
    <div style={{ background: "var(--canvas, #FAFAFA)", minHeight: "100vh", paddingBottom: "5rem" }}>
      <Nav activePage="glossary" />

      {/* Hero header */}
      <div style={{ background: "var(--ink, #0E0E0E)", padding: "2.5rem 1.5rem 2rem", marginBottom: "0", position: "relative", overflow: "hidden" }}>
        {/* R. watermark — matches hero treatment used on /, /how-it-works, /tools/line-translator */}
        <span aria-hidden="true" style={{
          position: "absolute", right: "-60px", top: "-80px",
          fontFamily: "Georgia, serif", fontSize: "520px", fontStyle: "italic",
          color: "rgba(217,59,58,0.07)", pointerEvents: "none", zIndex: 0, lineHeight: 1,
        }}>
          R.
        </span>
        <div style={{ maxWidth: "720px", margin: "0 auto", position: "relative" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--signal, #D93B3A)", marginBottom: "8px" }}>
            Glossary
          </p>
          <h1 style={{ fontSize: "30px", fontFamily: "Georgia, serif", fontWeight: 500, color: "#FAFAFA", letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: "10px" }}>
            Know the Language
          </h1>
          <p style={{ fontSize: "14px", color: "#9A9A96", lineHeight: 1.6, maxWidth: "440px" }}>
            Terms used in RawIntel breakdowns, defined simply.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "2rem 1.5rem 0" }}>
        {/* Search */}
        <input
          type="text"
          placeholder="Search terms..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            background: "var(--paper, #F7F5F0)", border: "0.5px solid var(--border, rgba(14,14,14,0.10))", borderRadius: "4px",
            padding: "11px 16px", fontFamily: "inherit", fontSize: "14px",
            color: "var(--ink, #0E0E0E)", width: "100%", marginBottom: "2rem", outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--signal, #D93B3A)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border, rgba(14,14,14,0.10))")}
        />

        {filtered.length === 0 && (
          <div style={{ background: "var(--paper, #F7F5F0)", border: "0.5px solid var(--border, rgba(14,14,14,0.10))", borderRadius: "6px", padding: "40px 24px", textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: "var(--muted, #8A8A86)" }}>No terms match your search.</p>
          </div>
        )}

        {/* Alphabetical sections */}
        {letters.map((letter) => (
          <div key={letter} style={{ marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "22px", fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: 400, color: "var(--ink, #0E0E0E)", marginBottom: "10px" }}>
              {letter}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {grouped.get(letter)!.map((entry) => (
                <div
                  key={entry.term}
                  style={{
                    background: "var(--paper, #F7F5F0)", border: "0.5px solid var(--border, rgba(14,14,14,0.10))", borderRadius: "6px",
                    padding: "16px 18px",
                  }}
                >
                  <span style={{
                    display: "inline-flex", alignItems: "center",
                    fontSize: "9px", fontWeight: 800, letterSpacing: "0.1em",
                    textTransform: "uppercase", padding: "2px 8px", borderRadius: "999px",
                    marginBottom: "8px", background: "rgba(217,59,58,0.08)", color: "var(--signal, #D93B3A)",
                  }}>
                    {entry.sport}
                  </span>
                  <p style={{ fontSize: "16px", fontFamily: "Georgia, serif", fontWeight: 500, color: "var(--ink, #0E0E0E)", marginBottom: "8px", lineHeight: 1.2 }}>
                    {entry.term}
                  </p>
                  <p style={{ fontSize: "14px", color: "var(--muted, #8A8A86)", lineHeight: 1.65 }}>
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
