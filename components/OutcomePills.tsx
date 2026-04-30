"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type Outcome = "won" | "lost" | "push" | "no_action" | null;

type BetPlaced = null | boolean;
type Result = null | "won" | "lost" | "push";

interface Props {
  gameId: string;
  initialOutcome: Outcome;
}

function deriveState(o: Outcome): { betPlaced: BetPlaced; result: Result } {
  if (o === null) return { betPlaced: null, result: null };
  if (o === "no_action") return { betPlaced: false, result: null };
  return { betPlaced: true, result: o as Result };
}

const resultColors: Record<string, { bg: string; color: string; border: string }> = {
  won:  { bg: "var(--clear-bg)",   color: "var(--clear)",   border: "rgba(26,122,72,0.25)" },
  lost: { bg: "var(--lost-bg,#FAEAEA)", color: "var(--signal)", border: "rgba(201,53,42,0.25)" },
  push: { bg: "var(--lean-bg)",    color: "var(--lean)",    border: "rgba(24,82,168,0.25)" },
};

export default function OutcomePills({ gameId, initialOutcome }: Props) {
  const router = useRouter();
  const init = deriveState(initialOutcome);
  const [betPlaced, setBetPlaced] = useState<BetPlaced>(init.betPlaced);
  const [result, setResult] = useState<Result>(init.result);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function post(outcome: Outcome) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/breakdowns/${gameId}/outcome`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ outcome }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to save");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setPending(false);
    }
  }

  function handleNo() {
    if (betPlaced === false) {
      // deselect
      setBetPlaced(null);
      setResult(null);
      post(null);
    } else {
      setBetPlaced(false);
      setResult(null);
      post("no_action");
    }
  }

  function handleYes() {
    if (betPlaced === true) return; // already yes, do nothing
    setBetPlaced(true);
    // don't POST yet — wait for result selection
  }

  function handleResult(r: "won" | "lost" | "push") {
    if (result === r) {
      // deselect
      setResult(null);
      post(null);
    } else {
      setResult(r);
      post(r);
    }
  }

  const pillBase: React.CSSProperties = {
    fontSize: 11.5,
    fontWeight: 600,
    padding: "4px 12px",
    borderRadius: 0,
    cursor: pending ? "default" : "pointer",
    border: "1px solid var(--border-med)",
    background: "transparent",
    color: "var(--muted)",
    transition: "all 0.12s",
    fontFamily: "var(--sans)",
    opacity: pending ? 0.6 : 1,
  };

  return (
    <div
      style={{
        padding: "11px 20px",
        borderTop: "1px solid var(--border)",
        background: "var(--warm-white)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      <span
        style={{ fontSize: 12, color: "var(--muted)", flexShrink: 0 }}
      >
        Did you bet it?
      </span>

      {/* Yes / No */}
      <div style={{ display: "flex", gap: 5 }}>
        <button
          type="button"
          onClick={handleYes}
          disabled={pending}
          style={{
            ...pillBase,
            ...(betPlaced === true
              ? { background: "var(--ink)", color: "#fff", borderColor: "var(--ink)" }
              : {}),
          }}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={handleNo}
          disabled={pending}
          style={{
            ...pillBase,
            ...(betPlaced === false
              ? { background: "var(--ink)", color: "#fff", borderColor: "var(--ink)" }
              : {}),
          }}
        >
          No
        </button>
      </div>

      {/* Separator + result pills — only when Yes is selected */}
      {betPlaced === true && (
        <>
          <div
            style={{
              width: 1,
              height: 14,
              background: "var(--border-med)",
              flexShrink: 0,
            }}
          />
          <div style={{ display: "flex", gap: 5 }}>
            {(["won", "lost", "push"] as const).map((r) => {
              const active = result === r;
              const colors = resultColors[r];
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleResult(r)}
                  disabled={pending}
                  style={{
                    ...pillBase,
                    ...(active
                      ? {
                          background: colors.bg,
                          color: colors.color,
                          borderColor: colors.border,
                        }
                      : {}),
                  }}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              );
            })}
          </div>
        </>
      )}

      {error && (
        <span
          style={{ fontSize: 11, color: "var(--signal)", marginLeft: 4 }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
