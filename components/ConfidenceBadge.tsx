import type { ConfidenceLevel, ConfidenceLabel } from "@/lib/types";
import Tooltip from "./Tooltip";

interface Props {
  level: ConfidenceLevel;
  label: ConfidenceLabel;
  compact?: boolean; // true = Signal Grade only (for cards), false = full label + description (for breakdown header)
}

const grades: Record<ConfidenceLevel, string> = {
  1: "A",
  2: "B",
  3: "C",
  4: "D",
};

const descriptions: Record<ConfidenceLevel, string> = {
  1: "One of the cleaner spots on the slate",
  2: "The game leans this way on paper",
  3: "There is logic here, but it's fragile",
  4: "This is a harder game to trust",
};

const SIGNAL_GRADE_TOOLTIP =
  "Signal Grade rates data quality going into this breakdown — lineup certainty, line stability, historical depth, and environment. A = strong foundation. C or below = read the fragility check carefully.";

function SignalGradeLabel() {
  return (
    <Tooltip text={SIGNAL_GRADE_TOOLTIP}>
      <span
        style={{
          fontSize: "9px",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--muted)",
          borderBottom: "1px dotted rgba(14,14,14,0.35)",
          cursor: "help",
        }}
      >
        Signal Grade
      </span>
    </Tooltip>
  );
}

export default function ConfidenceBadge({ level, label, compact = false }: Props) {
  if (compact) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <SignalGradeLabel />
        <span style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "13px", color: "var(--signal)" }}>{grades[level]}</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <SignalGradeLabel />
        <span style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "13px", color: "var(--signal)" }}>{grades[level]}</span>
      </div>
      <div>
        <span style={{ fontSize: "10px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink)", background: "rgba(14,14,14,0.06)", padding: "3px 8px", borderRadius: "3px" }}>{label}</span>
        <span style={{ fontSize: "12px", fontWeight: 400, color: "var(--muted)", marginLeft: "8px" }}>{descriptions[level]}</span>
      </div>
    </div>
  );
}
