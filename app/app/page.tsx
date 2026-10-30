"use client";

import { useState } from "react";

type Contribution = {
  dishId: string;
  name: string;
  nameBm: string;
  serving: string;
  portion: number;
  values: Record<string, number | null>;
  source: string;
  estimated: boolean;
};

type AnalyzeResult = {
  contributions: Contribution[];
  totals: Record<string, number | null>;
  unknownKeys: string[];
  narrative: string[];
  refused?: string[];
  disclaimer?: string;
  dietitianQuestion: string;
};

const DISCLAIMER =
  "Generic food information only — not medical advice. Discuss with your dietitian.";

export default function Home() {
  const [tab, setTab] = useState<"camera" | "log">("camera");
  const [preview, setPreview] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function analyze() {
    if (!preview) return;
    setError(null);
    setResult(null);
    setStatus("Analyzing…");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ imageBase64: preview }),
      });
      if (!res.ok) throw new Error(`analyze failed (${res.status})`);
      const { jobId } = await res.json();
      setJobId(jobId);
      const deadline = Date.now() + 90_000;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 2000));
        const poll = await fetch(`/api/analyze/${jobId}`);
        const data = await poll.json();
        if (data.status === "done") {
          setResult(data.result);
          setStatus("");
          return;
        }
        if (data.status === "failed") throw new Error(data.error || "pipeline failed");
        setStatus("Analyzing… (segmentation → identification)");
      }
      throw new Error("timed out");
    } catch (err) {
      setError(err instanceof Error ? err.message : "something went wrong");
      setStatus("");
    }
  }

  function setPortion(dishId: string, delta: number) {
    setResult((r) =>
      r
        ? {
            ...r,
            contributions: r.contributions.map((c) =>
              c.dishId === dishId
                ? { ...c, portion: Math.max(0.5, Math.round((c.portion + delta) * 2) / 2) }
                : c,
            ),
          }
        : r,
    );
  }

  return (
    <main className="mx-auto max-w-xl p-5 pb-16">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F97316]">
            Renal Radar <span className="text-[#8b949e]">·</span>{" "}
            <span className="text-[#e6edf3]">Radar Peninggalan</span>
          </h1>
          <p className="text-xs text-[#8b949e]">Documentation, never advice.</p>
        </div>
        <nav className="flex gap-1 rounded-full bg-[#161b22] p-1 text-xs">
          <button
            className={`rounded-full px-3 py-1.5 ${tab === "camera" ? "bg-[#F97316] text-white" : "text-[#8b949e]"}`}
            onClick={() => setTab("camera")}
          >
            Camera
          </button>
          <button
            className={`rounded-full px-3 py-1.5 ${tab === "log" ? "bg-[#F97316] text-white" : "text-[#8b949e]"}`}
            onClick={() => setTab("log")}
          >
            Log
          </button>
        </nav>
      </header>

      {tab === "camera" && (
        <section className="space-y-4">
          <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-[#30363d] bg-[#0d1117] p-8 text-center">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={onCapture}
            />
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="meal" className="mx-auto max-h-64 rounded-xl" />
            ) : (
              <span className="text-sm text-[#8b949e]">
                📷 Tap to photograph your meal
                <br />
                <span className="text-xs">Ambil gambar makanan anda</span>
              </span>
            )}
          </label>

          <button
            onClick={analyze}
            disabled={!preview || status !== ""}
            className="w-full rounded-xl bg-[#F97316] py-3 font-semibold text-white disabled:opacity-40"
          >
            {status || "Analyze meal"}
          </button>

          {error && (
            <p className="rounded-lg bg-[#2d1216] p-3 text-xs text-[#ff9d96]">{error}</p>
          )}

          {result && (
            <section className="space-y-3">
              <h2 className="pt-2 text-sm font-semibold text-[#e6edf3]">
                Detected dishes — correct anything wrong
              </h2>
              {result.contributions.length === 0 && (
                <p className="rounded-lg bg-[#161b22] p-3 text-xs text-[#8b949e]">
                  No verified dishes recognized. Unknown stays unknown — nothing is guessed.
                </p>
              )}
              {result.contributions.map((c) => (
                <div
                  key={c.dishId}
                  className="flex items-center justify-between rounded-xl bg-[#161b22] p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-[#e6edf3]">
                      {c.name} <span className="text-[#8b949e]">· {c.nameBm}</span>
                    </p>
                    <p className="text-[11px] text-[#8b949e]">
                      {c.serving} · source: {c.source}
                      {c.estimated && " (est.)"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPortion(c.dishId, -0.5)}
                      className="h-7 w-7 rounded-full bg-[#30363d] text-[#e6edf3]"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-sm text-[#e6edf3]">
                      {c.portion}×
                    </span>
                    <button
                      onClick={() => setPortion(c.dishId, 0.5)}
                      className="h-7 w-7 rounded-full bg-[#30363d] text-[#e6edf3]"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}

              {result.disclaimer && (
                <p className="rounded-lg bg-[#2d1216] p-3 text-xs text-[#ffb3ad]">
                  {result.disclaimer}
                </p>
              )}

              <div className="rounded-xl border border-[#30363d] p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8b949e]">
                  Meal totals (generic references)
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(result.totals).map(([k, v]) => (
                    <div key={k} className="flex justify-between rounded-lg bg-[#0d1117] px-3 py-2">
                      <span className="text-[#8b949e]">{k.replace("_", " ")}</span>
                      <span className="text-[#e6edf3]">{v === null ? "unknown" : v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="rounded-xl bg-[#161b22] p-3 text-xs text-[#e6edf3]">
                ❓ {result.dietitianQuestion}
              </p>
              <p className="text-center text-[11px] text-[#8b949e]">{DISCLAIMER}</p>
            </section>
          )}
        </section>
      )}

      {tab === "log" && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[#e6edf3]">Weekly summary</h2>
          <p className="rounded-xl bg-[#161b22] p-4 text-xs text-[#8b949e]">
            Your logged meals and trends will appear here. Bring this summary to your
            dietitian appointments — it ends with questions, never directives.
          </p>
          <p className="text-center text-[11px] text-[#8b949e]">{DISCLAIMER}</p>
        </section>
      )}
    </main>
  );
}
