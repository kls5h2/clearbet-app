interface Props {
  term: string;
  definition: string;
}

export default function GlossaryCallout({ term, definition }: Props) {
  return (
    <div className="mt-6 pt-5 border-t border-[#E8ECF2]">
      <div className="rounded-lg px-4 py-4 bg-[#F0FAF8] border border-[#D4EDE9]">
        <p className="font-mono text-[9px] font-bold text-[#0A7A6C] tracking-[0.12em] uppercase mb-2">
          Glossary Term
        </p>
        <p className="text-[13px] leading-[1.7] text-[#0D1B2E]">
          <span className="font-bold">{term}:</span>{" "}
          <span className="text-[#3A5470]">{definition}</span>
        </p>
        <a
          href="/glossary"
          className="mt-2 inline-block font-mono text-[11px] font-semibold text-[#0A7A6C] hover:underline tracking-wide"
        >
          View full glossary →
        </a>
      </div>
    </div>
  );
}
