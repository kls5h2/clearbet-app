"use client";

import { useEffect, useRef, useState } from "react";
import Nav from "@/components/Nav";

type Mode = "text" | "image";
type Status = "idle" | "loading" | "done" | "error";
type ImageMime = "image/png" | "image/jpeg" | "image/webp";

const ACCEPT_MIMES: ImageMime[] = ["image/png", "image/jpeg", "image/webp"];
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

interface TranslateResult {
  line: string;
  translation: string;
  impliedProbability: number;
  context: string;
  watch: string[];
}

function allowStrong(html: string): string {
  return html
    .replace(/<(?!\/?strong>)[^>]+>/gi, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

const EXAMPLES = [
  { label: "Denver -3.5 (-110)", value: "Denver Nuggets -3.5 (-110)" },
  { label: "Jokić o28.5 pts", value: "Jokić over 28.5 points (-115)" },
  { label: "Lakers +130 ML", value: "Lakers +130 moneyline" },
  { label: "Over 214.5 (-108)", value: "Celtics vs Hawks over 214.5 (-108)" },
  { label: "Spurs +9.5 RL", value: "San Antonio Spurs +9.5 run line" },
];


function readImage(file: File): Promise<{ base64: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const comma = dataUrl.indexOf(",");
      resolve({ base64: comma === -1 ? dataUrl : dataUrl.slice(comma + 1), dataUrl });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function LineTranslatorClient() {
  const [mode, setMode] = useState<Mode>("text");
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<TranslateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [probBarWidth, setProbBarWidth] = useState(0);
  const [infoPrompt, setInfoPrompt] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<ImageMime | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result) {
      const prob = Math.round(result.impliedProbability) || 0;
      const t = setTimeout(() => setProbBarWidth(prob), 100);
      return () => clearTimeout(t);
    }
  }, [result]);

  function setExample(value: string) {
    setMode("text");
    setInput(value);
    setResult(null);
    setError(null);
    setInfoPrompt(null);
    setStatus("idle");
    setProbBarWidth(0);
  }

  async function ingestFile(file: File) {
    if (!(ACCEPT_MIMES as string[]).includes(file.type)) {
      setError("Unsupported image type. Use PNG, JPEG, or WebP.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image too large — keep it under 4MB.");
      return;
    }
    const { base64, dataUrl } = await readImage(file);
    setImagePreview(dataUrl);
    setImageBase64(base64);
    setImageMime(file.type as ImageMime);
    setError(null);
  }

  function clearImage() {
    setImagePreview(null);
    setImageBase64(null);
    setImageMime(null);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) ingestFile(file);
  }

  const canTranslate = mode === "text" ? !!input.trim() : !!imageBase64;

  async function handleTranslate() {
    if (!canTranslate) return;
    setStatus("loading");
    setError(null);
    setInfoPrompt(null);
    setResult(null);
    setProbBarWidth(0);

    try {
      const body: { input?: string; image?: { data: string; mediaType: ImageMime } } = {};
      if (input.trim()) body.input = input.trim();
      if (imageBase64 && imageMime) body.image = { data: imageBase64, mediaType: imageMime };

      const res = await fetch("/api/line-translator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(errBody?.error ?? "Translation failed");
      }
      const data = await res.json() as TranslateResult & { needsInfo?: true; prompt?: string };
      if (data.needsInfo) {
        setInfoPrompt(data.prompt ?? "Can you share more detail about the line?");
        setStatus("idle");
        return;
      }
      setResult(data);
      setStatus("done");
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  function resetTool() {
    setStatus("idle");
    setResult(null);
    setError(null);
    setInfoPrompt(null);
    setInput("");
    clearImage();
    setProbBarWidth(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div style={{ background: "#F8F6F2", minHeight: "100vh" }}>
      <style>{`
        @keyframes ltSpin { to { transform: rotate(360deg); } }
        @keyframes ltResultIn { from { opacity: 0; transform: translateY(16px) scale(0.99); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .lt-result { animation: ltResultIn 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .lt-translate-btn:hover:not(:disabled) { background: #b02e24 !important; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(201,53,42,0.35) !important; }
        .lt-example-pill:hover { color: var(--ink) !important; border-color: rgba(17,17,16,0.25) !important; background: #F0EDE6 !important; }
        .lt-try-again:hover { color: var(--ink) !important; }
        .lt-mode-tab:hover:not(.lt-mode-active) { background: #F0EDE6 !important; color: var(--ink) !important; }
        .lt-drop-zone:hover { border-color: var(--signal) !important; background: rgba(201,53,42,0.03) !important; }
      `}</style>

      <Nav />

      {/* Hero band */}
      <div style={{ background: "var(--ink)", padding: "32px clamp(16px, 4vw, 40px)", position: "relative", overflow: "hidden" }}>
        <div aria-hidden style={{
          position: "absolute", right: "-2%", top: "50%", transform: "translateY(-50%)",
          fontSize: "clamp(140px,22vw,260px)", fontWeight: 900, color: "transparent",
          WebkitTextStroke: "1px rgba(255,255,255,0.03)", lineHeight: 1,
          pointerEvents: "none", userSelect: "none", fontFamily: "var(--sans)",
        }}>R</div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "12px" }}>
          <span style={{ width: "20px", height: "1px", background: "var(--signal)", flexShrink: 0, display: "inline-block" }} />
          Line Translator
        </div>
        <div style={{ fontSize: "clamp(22px,4vw,34px)", fontWeight: 800, letterSpacing: "-0.035em", color: "#fff", lineHeight: 1.15, marginBottom: "8px", fontFamily: "var(--sans)" }}>
          What does that line<br />actually mean?
        </div>
        <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.42)", lineHeight: 1.6, maxWidth: "480px", fontFamily: "var(--sans)" }}>
          Paste any betting line — spread, moneyline, total, or prop. Get a plain-English translation, implied probability, and context read back.
        </div>
      </div>

      {/* Page content */}
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "40px clamp(16px, 4vw, 40px) 80px" }}>

        {/* Input card */}
        <div style={{ background: "#fff", borderRadius: 0, border: "1px solid rgba(17,17,16,0.15)", overflow: "hidden", boxShadow: "0 1px 2px rgba(17,17,16,0.04), 0 2px 6px rgba(17,17,16,0.04), 0 0 0 1px rgba(17,17,16,0.03), inset 0 1px 0 rgba(255,255,255,0.7)", marginBottom: "16px" }}>

          {/* Header */}
          <div style={{ padding: "20px 22px 0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)" }}>
              Paste a line or upload a slip
            </div>
            <div style={{ display: "flex", border: "1px solid rgba(17,17,16,0.15)", borderRadius: 0, overflow: "hidden" }}>
              {(["text", "image"] as Mode[]).map((m, i) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`lt-mode-tab${mode === m ? " lt-mode-active" : ""}`}
                  style={{
                    fontSize: "12.5px", fontWeight: 500, fontFamily: "var(--sans)",
                    color: mode === m ? "#fff" : "var(--muted)",
                    background: mode === m ? "var(--ink)" : "transparent",
                    border: "none", borderRight: i === 0 ? "1px solid rgba(17,17,16,0.15)" : "none",
                    padding: "6px 14px", cursor: "pointer", transition: "all 0.12s",
                    display: "flex", alignItems: "center", gap: "6px",
                  }}
                >
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--signal)", opacity: mode === m ? 1 : 0, transition: "opacity 0.12s", flexShrink: 0 }} />
                  {m === "text" ? "Type" : "Image"}
                </button>
              ))}
            </div>
          </div>

          {/* Text mode */}
          {mode === "text" && (
            <div style={{ padding: "14px 22px 20px" }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleTranslate(); } }}
                placeholder="e.g. Denver Nuggets -3.5, Jokić over 28.5 pts, Lakers +130..."
                rows={3}
                style={{
                  width: "100%", minHeight: "80px", resize: "none",
                  fontFamily: "var(--mono)", fontSize: "15px", fontWeight: 500,
                  color: "var(--ink)", background: "transparent",
                  border: "none", outline: "none", lineHeight: 1.5,
                }}
              />
            </div>
          )}

          {/* Image mode */}
          {mode === "image" && (
            <div style={{ padding: "14px 22px 20px" }}>
              {imagePreview ? (
                <div style={{ position: "relative" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Bet slip preview" style={{ width: "100%", borderRadius: 0, maxHeight: "200px", objectFit: "cover" }} />
                  <button
                    onClick={clearImage}
                    style={{ position: "absolute", top: "8px", right: "8px", background: "var(--ink)", color: "#fff", border: "none", borderRadius: 0, fontSize: "11px", fontWeight: 600, padding: "4px 10px", cursor: "pointer" }}
                  >
                    ✕ Remove
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
                  className="lt-drop-zone"
                  style={{
                    border: `2px dashed ${dragActive ? "var(--signal)" : "rgba(17,17,16,0.15)"}`,
                    borderRadius: 0, padding: "32px 20px", textAlign: "center",
                    cursor: "pointer", transition: "all 0.15s",
                    background: dragActive ? "rgba(201,53,42,0.03)" : "#F8F6F2",
                    position: "relative",
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) ingestFile(f); e.target.value = ""; }}
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%", zIndex: 1 }}
                  />
                  <div style={{ fontSize: "24px", marginBottom: "8px" }}>📸</div>
                  <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>
                    <strong style={{ color: "var(--ink)", fontWeight: 600 }}>Drop your bet slip here</strong> or click to upload
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "#9B9790", marginTop: "4px", letterSpacing: "0.04em" }}>
                    PNG · JPEG · WebP · 4MB max
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div style={{ padding: "12px 22px 16px", borderTop: "1px solid rgba(14,14,14,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <div style={{ fontSize: "12px", color: "#9B9790", fontStyle: "italic" }}>
              Works with spreads, moneylines, totals, and props.
            </div>
            <button
              onClick={handleTranslate}
              disabled={status === "loading" || !canTranslate}
              className="lt-translate-btn"
              style={{
                fontSize: "13.5px", fontWeight: 700, color: "#fff",
                background: "var(--signal)", border: "none", borderRadius: 0,
                padding: "10px 24px", cursor: status === "loading" || !canTranslate ? "default" : "pointer",
                display: "flex", alignItems: "center", gap: "8px",
                transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
                boxShadow: "0 2px 8px rgba(201,53,42,0.25)",
                opacity: status === "loading" || !canTranslate ? 0.6 : 1,
                fontFamily: "var(--sans)",
              }}
            >
              {status === "loading" ? (
                <span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "ltSpin 0.7s linear infinite", display: "inline-block" }} />
              ) : (
                <span>Translate it →</span>
              )}
            </button>
          </div>
        </div>

        {/* Examples */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9B9790", marginBottom: "10px" }}>
            Try an example
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {EXAMPLES.map((ex) => (
              <button
                key={ex.value}
                onClick={() => setExample(ex.value)}
                className="lt-example-pill"
                style={{
                  fontFamily: "var(--mono)", fontSize: "12px", color: "var(--muted)",
                  background: "#fff", border: "1px solid rgba(17,17,16,0.15)",
                  padding: "5px 12px", borderRadius: 0, cursor: "pointer",
                  transition: "all 0.12s", whiteSpace: "nowrap",
                }}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clarification prompt */}
        {infoPrompt && (
          <div style={{
            marginBottom: "16px", padding: "14px 16px",
            background: "var(--cream)", border: "1px solid var(--border-med)",
            borderLeft: "3px solid var(--ink)", borderRadius: 0,
            fontSize: "13.5px", color: "var(--ink-2)", lineHeight: 1.6,
            display: "flex", alignItems: "flex-start", gap: "10px",
          }}>
            <span style={{ color: "var(--muted)", flexShrink: 0, fontSize: "13px", marginTop: "1px" }}>→</span>
            {infoPrompt}
          </div>
        )}

        {/* Error */}
        {status === "error" && error && (
          <p style={{ marginBottom: "16px", fontSize: "13px", color: "var(--signal)" }}>{error}</p>
        )}

        {/* Result card */}
        {status === "done" && result && (
          <div ref={resultRef} className="lt-result">
            <div style={{ background: "#fff", borderRadius: 0, border: "1px solid rgba(17,17,16,0.06)", overflow: "hidden", boxShadow: "0 2px 4px rgba(17,17,16,0.04), 0 6px 16px rgba(17,17,16,0.07), 0 16px 32px rgba(17,17,16,0.05), 0 0 0 1px rgba(17,17,16,0.04), inset 0 1px 0 rgba(255,255,255,0.6)" }}>

              {/* Header */}
              <div style={{ background: "var(--ink)", padding: "14px 24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                  <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--signal)", flexShrink: 0 }} />
                  <div style={{ fontFamily: "var(--mono)", fontSize: "11px", letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
                    Translation
                  </div>
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.35)", flex: "1", minWidth: "120px", textAlign: "right" }}>
                  {result.line}
                </div>
              </div>

              {/* Translation */}
              <div
                style={{ padding: "22px 24px", fontSize: "16px", lineHeight: 1.7, color: "#2E2C2A", borderBottom: "1px solid rgba(14,14,14,0.06)" }}
                dangerouslySetInnerHTML={{ __html: allowStrong(result.translation) }}
              />

              {/* Implied probability */}
              <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", gap: "16px", borderBottom: "1px solid rgba(14,14,14,0.06)", background: "#F8F6F2" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", flexShrink: 0 }}>
                  Implied Probability
                </div>
                <div style={{ flex: 1, height: "6px", background: "#F0EDE6", borderRadius: 0, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "var(--signal)", borderRadius: 0, width: `${probBarWidth}%`, transition: "width 1s cubic-bezier(0.16,1,0.3,1)" }} />
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "14px", fontWeight: 600, color: "var(--ink)", flexShrink: 0, minWidth: "40px", textAlign: "right" }}>
                  {Math.round(result.impliedProbability)}%
                </div>
              </div>

              {/* What the market is saying */}
              <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(14,14,14,0.06)" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--signal)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                  What the market is saying
                  <span style={{ flex: 1, height: "1px", background: "rgba(14,14,14,0.06)", display: "inline-block" }} />
                </div>
                <div
                  style={{ fontSize: "14px", lineHeight: 1.65, color: "#2E2C2A" }}
                  dangerouslySetInnerHTML={{ __html: allowStrong(result.context) }}
                />
              </div>

              {/* What to watch */}
              <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(14,14,14,0.06)" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--signal)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                  What to watch
                  <span style={{ flex: 1, height: "1px", background: "rgba(14,14,14,0.06)", display: "inline-block" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {result.watch.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px", color: "#2E2C2A", lineHeight: 1.5 }}>
                      <span style={{ color: "var(--signal)", fontSize: "13px", flexShrink: 0, marginTop: "2px" }}>→</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: "14px 24px", background: "#F8F6F2", borderTop: "1px solid rgba(14,14,14,0.06)" }}>
                <button
                  onClick={resetTool}
                  className="lt-try-again"
                  style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--sans)", transition: "color 0.12s", padding: 0 }}
                >
                  ← Translate another line
                </button>
              </div>
            </div>

          </div>
        )}


      </div>

      <footer style={{ textAlign: "center", padding: "24px 40px", fontSize: "12px", color: "#9B9790", lineHeight: 1.8 }}>
        For informational purposes only. RawIntel does not provide financial, betting, or investment advice. Bet responsibly.<br />
        <a href="https://www.ncpgambling.org" style={{ color: "var(--muted)", textDecoration: "underline", textUnderlineOffset: "2px" }}>ncpgambling.org</a>
        {" · "}
        <a href="/terms" style={{ color: "var(--muted)", textDecoration: "underline", textUnderlineOffset: "2px" }}>Terms of Service</a>
        {" · "}
        <a href="/privacy" style={{ color: "var(--muted)", textDecoration: "underline", textUnderlineOffset: "2px" }}>Privacy Policy</a>
        {" · © RawIntel LLC"}
      </footer>
    </div>
  );
}
