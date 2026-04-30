import Link from "next/link";

interface Props {
  term: string;
  definition: string;
  dark?: boolean;
}

function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

export default function GlossaryCallout({ term, definition, dark }: Props) {
  if (!term || !definition) return null;

  return (
    <div style={{
      background: dark ? "rgba(255,255,255,0.06)" : "#FEF3F3",
      borderRadius: 0,
      padding: "16px 18px",
      marginTop: "10px",
      border: dark ? "1px solid rgba(255,255,255,0.1)" : "none",
    }}>
      <p style={{ fontSize: "9px", fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--signal)", marginBottom: "6px" }}>
        Glossary Term
      </p>
      <p style={{ fontFamily: "var(--sans)", fontSize: "15px", fontWeight: 700, color: dark ? "#fff" : "var(--ink)", marginBottom: "6px", letterSpacing: "-0.01em" }}>
        {toTitleCase(term)}
      </p>
      <p style={{ fontSize: "13px", fontWeight: 400, color: dark ? "rgba(255,255,255,0.55)" : "var(--muted)", lineHeight: 1.6, marginBottom: "8px" }}>
        {definition}
      </p>
      <Link href="/glossary" style={{ fontSize: "13px", fontWeight: 500, color: "var(--signal)", textDecoration: "none" }}>
        View full glossary →
      </Link>
    </div>
  );
}
