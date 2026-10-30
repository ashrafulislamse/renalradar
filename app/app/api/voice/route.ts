import { NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/meta-client";

// POST /api/voice — BM/EN meal dictation → text (client then matches dishes).
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const audioBase64 = body?.audioBase64;
  const language: "ms" | "en" = body?.language === "ms" ? "ms" : "en";
  if (!audioBase64 || typeof audioBase64 !== "string") {
    return NextResponse.json({ error: "audioBase64 required" }, { status: 400 });
  }
  try {
    const text = await transcribeAudio(audioBase64, language);
    return NextResponse.json({ text });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "transcription failed" },
      { status: 502 },
    );
  }
}
