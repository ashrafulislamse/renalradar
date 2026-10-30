// Meta Model API client — SAM 3.1 (segmentation), Muse Spark 1.3 (orchestration /
// food ID), Muse Voice Transcribe. Env: META_API_KEY, META_API_BASE.
// All calls server-side only; never expose keys to the client.

const BASE = process.env.META_API_BASE || "https://api.meta.ai/v1";
const KEY = process.env.META_API_KEY || "";

async function metaCall(model: string, body: unknown): Promise<unknown> {
  if (!KEY) throw new Error("META_API_KEY not configured");
  const res = await fetch(`${BASE}/${model}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Meta API ${model} failed: ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json();
}

export type SegmentResult = {
  masks: { label: string; bbox: [number, number, number, number] }[];
};

// SAM 3.1 — text-prompted segmentation ("rice", "chicken", "salad" ...)
export async function segmentDishes(
  imageBase64: string,
  prompts: string[],
): Promise<SegmentResult> {
  const out = (await metaCall("sam-3-1", {
    image_base64: imageBase64,
    text_prompts: prompts,
    return_masks: true,
  })) as { masks?: { label: string; bbox: [number, number, number, number] }[] };
  return { masks: out.masks ?? [] };
}

export type Identification = { dish: string; confidence: number; notes: string };

// Muse Spark 1.3 — identify candidate foods per crop, with hedged notes.
export async function identifyFoods(
  imageBase64: string,
  cropHints: string[],
): Promise<Identification[]> {
  const out = (await metaCall("muse-spark-1-3", {
    image_base64: imageBase64,
    task: "food_identification",
    candidates: cropHints,
    instructions:
      "Identify each dish conservatively. If unsure, say so. Output JSON array {dish, confidence, notes}.",
  })) as { identifications?: Identification[] };
  return out.identifications ?? [];
}

// Muse Voice Transcribe — BM/EN meal dictation → text.
export async function transcribeAudio(
  audioBase64: string,
  language: "ms" | "en",
): Promise<string> {
  const out = (await metaCall("muse-voice-transcribe", {
    audio_base64: audioBase64,
    language,
  })) as { text?: string };
  return out.text ?? "";
}
