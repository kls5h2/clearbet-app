interface Props {
  term: string;
  definition: string;
}

export default function GlossaryCallout({ term, definition }: Props) {
  return (
    <div className="mt-8 pt-6 border-t border-[#E0E5EE]">
    <div className="border border-[#E0E5EE] rounded-lg p-4 bg-[#F4F6F9]">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-[#0A7A6C] flex items-center justify-center">
          <span className="text-white text-[10px] font-mono font-bold">G</span>
        </span>
        <div>
          <p className="text-[14px] leading-[1.7] text-[#0D1B2E]">
            <span className="font-semibold">{term}:</span>{" "}
            <span className="text-[#4A5568]">{definition}</span>
          </p>
          <a
            href="/glossary"
            className="mt-1 inline-block text-xs font-medium text-[#0A7A6C] hover:underline font-mono"
          >
            View full glossary →
          </a>
        </div>
      </div>
    </div>
    </div>
  );
}
