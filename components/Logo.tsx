interface LogoProps {
  fontSize?: number;
  barHeight?: number;
  color?: string;
}

export default function Logo({ fontSize = 22, barHeight = 17, color = "#FFFFFF" }: LogoProps) {
  return (
    <div className="flex items-center">
      <span style={{ fontSize: `${fontSize}px`, fontWeight: 800, letterSpacing: "-0.02em", color }}>Clear</span>
      <div style={{ width: "2px", height: `${barHeight}px`, background: "#0A7A6C", margin: "0 4px", borderRadius: "2px" }} />
      <span style={{ fontSize: `${fontSize}px`, fontWeight: 800, letterSpacing: "-0.02em", color }}>Bet</span>
    </div>
  );
}
