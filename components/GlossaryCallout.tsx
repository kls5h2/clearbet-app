import Link from "next/link";

interface Props {
  term: string;
  definition: string;
}

function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

export default function GlossaryCallout({ term, definition }: Props) {
  if (!term || !definition) return null;

  return (
    <div style={{ background: "#FEF3F3", borderRadius: "6px", padding: "16px 18px", marginTop: "10px" }}>
      <p style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--signal)", marginBottom: "6px" }}>
        Glossary Term
      </p>
      <p style={{ fontFamily: "Georgia, serif", fontSize: "16px", fontWeight: 500, color: "var(--ink)", marginBottom: "6px" }}>
        {toTitleCase(term)}
      </p>
      <p style={{ fontSize: "13px", fontWeight: 400, color: "var(--muted)", lineHeight: 1.6, marginBottom: "8px" }}>
        {definition}
      </p>
      <Link href="/glossary" style={{ fontSize: "13px", fontWeight: 500, color: "var(--signal)", textDecoration: "none" }}>
        View full glossary →
      </Link>
    </div>
  );
}
