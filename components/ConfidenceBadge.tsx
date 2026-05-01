import type { ConfidenceLevel, ConfidenceLabel } from "@/lib/types";

interface Props {
  level: ConfidenceLevel;
  label: ConfidenceLabel;
  compact?: boolean;
}

const descriptions: Record<ConfidenceLevel, string> = {
  1: "One of the cleaner spots on the slate",
  2: "The game leans this way on paper",
  3: "There is logic here, but it's fragile",
  4: "This is a harder game to trust",
};

export default function ConfidenceBadge({ label, level, compact = false }: Props) {
  if (compact) {
    return (
      <span style={{
        fontSize: "9px", fontWeight: 600, textTransform: "uppercase",
        letterSpacing: "0.1em", color: "var(--muted)",
        padding: "2px 6px", border: "1px solid var(--border-med)",
      }}>
        {label}
      </span>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div>
        <span style={{
          fontSize: "10px", fontWeight: 500, textTransform: "uppercase",
          letterSpacing: "0.06em", color: "var(--ink)",
          background: "rgba(14,14,14,0.06)", padding: "3px 8px", borderRadius: 0,
        }}>
          {label}
        </span>
        <span style={{ fontSize: "12px", fontWeight: 400, color: "var(--muted)", marginLeft: "8px" }}>
          {descriptions[level]}
        </span>
      </div>
    </div>
  );
}
