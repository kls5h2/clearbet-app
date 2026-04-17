interface LogoProps {
  dark?: boolean; // true = light text for dark backgrounds
}

export default function Logo({ dark = false }: LogoProps) {
  const color = dark ? "#FAFAFA" : "var(--ink)";
  return (
    <span style={{ fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: 500, letterSpacing: "-0.025em", color }}>
      <em style={{ fontStyle: "italic", fontWeight: 400 }}>Raw</em>Intel<span style={{ color: "var(--signal)" }}>.</span>
    </span>
  );
}
