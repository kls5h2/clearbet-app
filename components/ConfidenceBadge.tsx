import type { ConfidenceLevel, ConfidenceLabel } from "@/lib/types";

interface Props {
  level: ConfidenceLevel;
  label: ConfidenceLabel;
}

const styles: Record<ConfidenceLevel, string> = {
  1: "bg-[#0A7A6C] text-white",
  2: "bg-[#0D1B2E] text-white",
  3: "bg-[#B45309] text-white",
  4: "bg-[#6B7A90] text-white",
};

const descriptions: Record<ConfidenceLevel, string> = {
  1: "One of the cleaner spots on the slate",
  2: "The game leans this way on paper",
  3: "There is logic here, but it's fragile",
  4: "This is a harder game to trust",
};

export default function ConfidenceBadge({ level, label }: Props) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`inline-flex items-center px-3 py-1 rounded text-xs font-mono font-medium tracking-widest uppercase ${styles[level]}`}
      >
        {label}
      </span>
      <span className="text-sm text-[#6B7A90]">{descriptions[level]}</span>
    </div>
  );
}
