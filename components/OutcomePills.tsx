"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type Outcome = "won" | "lost" | "push" | "no_action" | null;

const OPTIONS: { value: Exclude<Outcome, null>; label: string; color: string }[] = [
  { value: "won",       label: "Won",       color: "#0E8A5F" },
  { value: "lost",      label: "Lost",      color: "#D93B3A" },
  { value: "push",      label: "Push",      color: "#2E6CA9" },
  { value: "no_action", label: "No Action", color: "#0E0E0E" },
];

interface Props {
  gameId: string;
  initialOutcome: Outcome;
}

export default function OutcomePills({ gameId, initialOutcome }: Props) {
  const router = useRouter();
  const [outcome, setOutcome] = useState<Outcome>(initialOutcome);
  const [pending, setPending] = useState<Exclude<Outcome, null> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick(next: Exclude<Outcome, null>) {
    // Tap an already-active pill → clear it back to null (lets users undo).
    const target: Outcome = outcome === next ? null : next;
    const prev = outcome;
    setOutcome(target);
    setPending(next);
    setError(null);
    try {
      const res = await fetch(`/api/breakdowns/${gameId}/outcome`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ outcome: target }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to save");
      }
      setPending(null);
      router.refresh();
    } catch (err) {
      setOutcome(prev);
      setPending(null);
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {OPTIONS.map((opt) => {
          const active = outcome === opt.value;
          const saving = pending === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleClick(opt.value)}
              disabled={!!pending}
              style={{
                fontFamily: "var(--sans)",
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "6px 12px",
                borderRadius: "999px",
                cursor: pending ? "default" : "pointer",
                background: active ? opt.color : "transparent",
                color: active ? "#FAFAFA" : "var(--muted)",
                border: `0.5px solid ${active ? opt.color : "var(--border)"}`,
                opacity: saving ? 0.6 : 1,
                transition: "background 150ms ease, color 150ms ease, border-color 150ms ease",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {error && (
        <p style={{ marginTop: "6px", fontSize: "11px", color: "var(--signal)" }}>{error}</p>
      )}
    </div>
  );
}
