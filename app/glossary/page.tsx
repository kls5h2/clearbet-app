import Link from "next/link";

export default function GlossaryPage() {
  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      {/* Nav */}
      <header className="border-b border-[#E0E5EE] bg-white">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="font-mono text-xs text-[#6B7A90] hover:text-[#0A7A6C] transition-colors"
          >
            ← Back
          </Link>
          <span className="text-[#E0E5EE]">|</span>
          <span className="font-heading text-base font-bold text-[#0D1B2E]">Clearbet</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-[#0D1B2E]">Glossary</h1>
          <p className="mt-1 text-sm text-[#6B7A90]">
            Plain-English definitions for the terms used in Clearbet breakdowns.
          </p>
        </div>

        <div className="bg-white border border-[#E0E5EE] rounded-xl p-8 text-center">
          <p className="text-sm text-[#6B7A90]">
            Terms are defined inline at the bottom of every breakdown. A full glossary is coming soon.
          </p>
        </div>
      </main>
    </div>
  );
}
