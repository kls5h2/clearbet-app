import Link from "next/link";
import Logo from "./Logo";

interface NavProps {
  backHref?: string;
  backLabel?: string;
  sportTag?: string;
}

export default function Nav({ backHref, backLabel = "← Back", sportTag }: NavProps) {
  return (
    <header className="bg-[#F0F3F7] sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 h-[52px] flex items-center justify-between">
        <div className="flex items-center gap-3">
          {backHref && (
            <>
              <Link
                href={backHref}
                className="text-[12px] font-semibold text-[#9FADBF] hover:text-[#637A96] transition-colors"
              >
                {backLabel}
              </Link>
              <div className="w-[1px] h-[14px] bg-[#DDE2EB]" />
            </>
          )}
          <Link href="/">
            <Logo />
          </Link>
          {sportTag && (
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#9FADBF]">
              {sportTag}
            </span>
          )}
        </div>
        <div className="flex items-center gap-5">
          <Link
            href="/how-it-works"
            className="text-[12px] font-semibold text-[#9FADBF] hover:text-[#637A96] transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="/glossary"
            className="text-[12px] font-semibold text-[#9FADBF] hover:text-[#637A96] transition-colors"
          >
            Glossary
          </Link>
        </div>
      </div>
    </header>
  );
}
