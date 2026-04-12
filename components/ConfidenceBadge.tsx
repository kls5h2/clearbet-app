import type { ConfidenceLevel, ConfidenceLabel } from "@/lib/types";

interface Props {
  level: ConfidenceLevel;
  label: ConfidenceLabel;
}

const styles: Record<ConfidenceLevel, string> = {
  1: "bg-[#DCFCE7] text-[#166534]",
  2: "bg-[#EFF6FF] text-[#1D4ED8]",
  3: "bg-[#FEF3C7] text-[#92400E]",
  4: "bg-[#F1F4F8] text-[#64748B]",
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
        className={`inline-flex items-center px-[10px] py-[3px] rounded-full text-[10px] font-extrabold uppercase tracking-widest ${styles[level]}`}
      >
        {label}
      </span>
      <span className="text-[12px] font-semibold text-[#637A96]">{descriptions[level]}</span>
    </div>
  );
}
