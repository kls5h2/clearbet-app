interface Props {
  term: string;
  definition: string;
}

export default function GlossaryCallout({ term, definition }: Props) {
  return (
    <div
      style={{ background: "#F0FAF8", borderRadius: "12px", padding: "16px 18px", marginTop: "10px" }}
    >
      <p
        style={{
          fontSize: "9px", fontWeight: 800, letterSpacing: "0.14em",
          textTransform: "uppercase", color: "#0A7A6C", marginBottom: "6px",
        }}
      >
        Glossary Term
      </p>
      <p
        style={{
          fontSize: "15px", fontWeight: 800, color: "#096059",
          marginBottom: "6px", letterSpacing: "-0.01em",
        }}
      >
        {term}
      </p>
      <p
        style={{
          fontSize: "13px", fontWeight: 500, color: "#3A5470",
          lineHeight: 1.6, marginBottom: "8px",
        }}
      >
        {definition}
      </p>
      <a
        href="/glossary"
        style={{ fontSize: "11px", fontWeight: 700, color: "#0A7A6C", letterSpacing: "0.02em" }}
      >
        View full glossary →
      </a>
    </div>
  );
}
