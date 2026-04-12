import Nav from "@/components/Nav";

interface Step {
  number: string;
  title: string;
  body: string;
}

const HOW_IT_WORKS: Step[] = [
  {
    number: "01",
    title: "We pull live pre-game data",
    body: "Before every game, Clearbet fetches injury reports, starting lineups, pitching matchups, recent form, standings, and the current betting market. Nothing is manually curated — it's all live.",
  },
  {
    number: "02",
    title: "The data gets analyzed, not summarized",
    body: "We don't just display the numbers. We run the data through a structured analytical framework that looks for meaningful patterns: who has the edge, where the market might be mispriced, and what variables could flip the outcome.",
  },
  {
    number: "03",
    title: "You get a plain-English breakdown",
    body: "Every breakdown follows the same seven-section structure — Game Shape, Key Drivers, Base Script, Fragility Check, Market Read, The Edge, and What This Means. No jargon without explanation. No conclusions without logic.",
  },
  {
    number: "04",
    title: "A confidence rating anchors the read",
    body: "Each breakdown ends with one of four ratings: CLEAR (strong alignment), LEAN (directional but not clean), FRAGILE (logic exists but risks are real), or PASS (too many unknowns to trust). These aren't win probabilities — they reflect how much the data agrees with itself.",
  },
  {
    number: "05",
    title: "You decide what to do with it",
    body: "Clearbet tells you what the data says. It doesn't tell you what to bet. The breakdown is designed to help you think clearly, not to think for you. Every section ends with a question, not a directive.",
  },
];

const CONFIDENCE_TIERS = [
  {
    label: "CLEAR",
    bg: "bg-[#DCFCE7]",
    text: "text-[#166534]",
    description: "Strong data alignment. The key variables point the same direction and the market hasn't fully priced it in.",
  },
  {
    label: "LEAN",
    bg: "bg-[#E6F4F2]",
    text: "text-[#0A7A6C]",
    description: "The game leans one way on paper. There's a logical case, but not without meaningful uncertainty.",
  },
  {
    label: "FRAGILE",
    bg: "bg-[#FEF3C7]",
    text: "text-[#92400E]",
    description: "There's a reading here, but it's built on assumptions that could easily break. Proceed with caution.",
  },
  {
    label: "PASS",
    bg: "bg-[#F1F4F8]",
    text: "text-[#64748B]",
    description: "Too many unknowns, too much noise, or no clear edge in either direction. Sitting out is a valid decision.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#F0F3F7]">
      <Nav backHref="/" />

      <main className="max-w-2xl mx-auto px-4 pt-6 pb-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-[26px] font-extrabold text-[#0D1B2E] leading-tight">
            How It Works
          </h1>
          <p className="mt-2 text-[15px] text-[#637A96] leading-[1.7]">
            Clearbet turns raw pre-game data into structured analysis so you can make better-informed betting decisions in under 60 seconds.
          </p>
        </div>

        {/* Steps */}
        <div className="bg-white border border-[#E8ECF2] rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(13,27,46,0.05)] mb-6">
          {HOW_IT_WORKS.map((step, idx) => (
            <div
              key={step.number}
              className={`px-6 py-5 ${idx !== HOW_IT_WORKS.length - 1 ? "border-b border-[#EEF1F5]" : ""}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-[11px] font-bold text-[#0A7A6C] tracking-[0.12em] shrink-0">
                  {step.number}
                </span>
                <h2 className="font-heading text-[15px] font-bold text-[#0D1B2E]">{step.title}</h2>
                <div className="flex-1 h-px bg-[#E8ECF2]" />
              </div>
              <p className="text-[14px] text-[#637A96] leading-[1.7] pl-9">{step.body}</p>
            </div>
          ))}
        </div>

        {/* Confidence system */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-heading text-[15px] font-bold text-[#0D1B2E] whitespace-nowrap">The Confidence System</h2>
            <div className="flex-1 h-px bg-[#E8ECF2]" />
          </div>
          <p className="text-[14px] text-[#637A96] leading-[1.7] mb-4">
            Every breakdown ends with a confidence rating. This isn&apos;t a win probability — it&apos;s a measure of how clearly the data points in one direction and how much we trust that signal.
          </p>
          <div className="space-y-2">
            {CONFIDENCE_TIERS.map((tier) => (
              <div
                key={tier.label}
                className="bg-white border border-[#E8ECF2] rounded-xl px-5 py-4 flex items-start gap-4 shadow-[0_1px_4px_rgba(13,27,46,0.05)]"
              >
                <span className={`shrink-0 inline-flex items-center px-[10px] py-[3px] rounded-full font-mono text-[10px] font-extrabold uppercase tracking-widest ${tier.bg} ${tier.text}`}>
                  {tier.label}
                </span>
                <p className="text-[13px] text-[#637A96] leading-[1.6] pt-0.5">{tier.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What we don't do */}
        <div className="bg-[#F0F3F7] border border-[#E8ECF2] rounded-xl px-6 py-5">
          <h2 className="font-heading text-[14px] font-bold text-[#0D1B2E] mb-3">What Clearbet doesn&apos;t do</h2>
          <ul className="space-y-2">
            {[
              "We don't pick your bets. Every breakdown ends with analysis, not a directive.",
              "We don't guarantee outcomes. Sports are unpredictable by design.",
              "We don't update in real time. Breakdowns are generated pre-game and reflect data at that moment.",
              "We don't account for in-game injuries or last-minute scratches after generation.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-[7px] shrink-0 w-[5px] h-[5px] rounded-full bg-[#B0BAC9]" />
                <p className="text-[13px] text-[#637A96] leading-[1.6]">{item}</p>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-10 text-center font-mono text-[11px] font-medium text-[#B0BAC9] tracking-wide">
          What the data says. Your decision to make.
        </p>
      </main>
    </div>
  );
}
