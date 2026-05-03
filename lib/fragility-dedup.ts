/**
 * Structural deduplication for fragility check points.
 *
 * Applied after every Claude API response, before saving or displaying a breakdown.
 * Two independent passes:
 *
 *   Pass 1 — confirmed-absence removal:
 *     If a fragility point names a confirmed-OUT player AND that player already
 *     appears in Game Shape, remove the fragility point. A confirmed absence is
 *     a premise — it belongs in Game Shape, not Fragility Check.
 *
 *   Pass 2 — word-overlap deduplication:
 *     Two items are duplicates when they share the same subject (text before the
 *     first colon) OR have >60% meaningful-word overlap. First occurrence is kept.
 */

import type { FragilityItem } from "./types";

const STOPWORDS = new Set([
  "the", "and", "for", "that", "this", "with", "from", "will", "would", "could",
  "their", "they", "which", "when", "where", "what", "who", "how", "than", "then",
  "into", "out", "its", "are", "was", "were", "has", "had", "have", "been", "being",
  "not", "but", "all", "can", "may", "more", "also", "just", "one", "any", "both",
]);

function wordTokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function wordOverlapRatio(a: string, b: string): number {
  const ta = new Set(wordTokens(a));
  const tb = new Set(wordTokens(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  const shared = [...ta].filter((x) => tb.has(x)).length;
  return shared / Math.max(ta.size, tb.size);
}

// Strip leading emoji / color-label prefix so comparisons aren't skewed by formatting.
function normalizeItem(s: string): string {
  return s
    .replace(/^(?:[🔴🟡🟢]|⚠️?)\s*/u, "")
    .replace(/^(RED|AMBER|GREEN)\s*[—–-]\s*/i, "")
    .trim();
}

export interface DedupResult {
  items: FragilityItem[];
  removedCount: number;
  log: string[];
}

export function deduplicateFragilityCheck(
  items: FragilityItem[],
  confirmedOutNames: string[],
  gameShape: string,
): DedupResult {
  const log: string[] = [];
  const gameShapeLower = gameShape.toLowerCase();

  // ── Pass 1: remove confirmed-OUT players already in Game Shape ──────────────
  let result = items.filter((f) => {
    const text = normalizeItem(f.item).toLowerCase();
    for (const name of confirmedOutNames) {
      // Match on any name segment > 2 chars (handles "Franz Wagner" → ["franz", "wagner"])
      const parts = name.toLowerCase().split(/\s+/).filter((p) => p.length > 2);
      const inItem = parts.some((part) => text.includes(part));
      const inShape = parts.some((part) => gameShapeLower.includes(part));
      if (inItem && inShape) {
        log.push(`confirmed-out "${name}" in Game Shape — removed fragility: "${f.item.slice(0, 80)}"`);
        return false;
      }
    }
    return true;
  });

  // ── Pass 2: deduplicate by subject match or word overlap ────────────────────
  const kept: FragilityItem[] = [];
  for (const candidate of result) {
    const normCandidate = normalizeItem(candidate.item);
    const isDuplicate = kept.some((existing) => {
      const normExisting = normalizeItem(existing.item);
      // (a) Same subject: text before first colon (player name / variable)
      const subA = normExisting.split(":")[0].trim().toLowerCase();
      const subB = normCandidate.split(":")[0].trim().toLowerCase();
      if (subA.length > 3 && subA === subB) return true;
      // (b) >60% word overlap on meaningful tokens
      return wordOverlapRatio(normExisting, normCandidate) > 0.6;
    });
    if (isDuplicate) {
      log.push(`word-overlap duplicate removed: "${candidate.item.slice(0, 80)}"`);
    } else {
      kept.push(candidate);
    }
  }

  return { items: kept, removedCount: items.length - kept.length, log };
}
