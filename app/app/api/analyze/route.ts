import { NextResponse } from "next/server";
import { createJob, updateJob } from "@/lib/jobs";
import { segmentDishes, identifyFoods } from "@/lib/meta-client";
import { DISHES, computeIntake, matchDishByName, type Contribution } from "@/lib/nutrients";
import { screenNarrative, dietitianQuestions } from "@/lib/guardrail";

// POST /api/analyze — create job, run pipeline in background, return jobId instantly.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const imageBase64 = body?.imageBase64;
  if (!imageBase64 || typeof imageBase64 !== "string") {
    return NextResponse.json({ error: "imageBase64 required" }, { status: 400 });
  }

  const job = createJob();
  updateJob(job.id, { status: "running" });

  // Fire-and-forget pipeline (serverless: within the same invocation window).
  void (async () => {
    try {
      const dishNames = DISHES.map((d) => d.name);
      const seg = await segmentDishes(imageBase64, dishNames);
      const ids = await identifyFoods(imageBase64, seg.masks.map((m) => m.label));

      // Reconcile model output against the verified DB — never invent values.
      const contributions: Contribution[] = [];
      for (const id of ids) {
        const dish = matchDishByName(id.dish);
        if (!dish) continue; // unknown dish stays unknown
        contributions.push({
          dishId: dish.id,
          name: dish.name,
          nameBm: dish.name_bm,
          serving: dish.serving,
          portion: 1,
          values: dish.nutrients,
          source: dish.source,
          estimated: dish.source.includes("est."),
        });
      }

      const { totals, unknownKeys } = computeIntake(contributions);
      const narrative = `This meal includes ${contributions
        .map((c) => c.name)
        .join(", ") || "unrecognized items"}. Values are generic per-serving references, not measurements of your plate.`;
      const guardrail = screenNarrative(narrative);

      updateJob(job.id, {
        status: "done",
        result: {
          contributions,
          totals,
          unknownKeys,
          narrative: guardrail.refusal ? guardrail.allowed : [narrative],
          refused: guardrail.refused,
          disclaimer: guardrail.refusal ?? undefined,
          dietitianQuestion: dietitianQuestions(totals),
        },
      });
    } catch (err) {
      updateJob(job.id, {
        status: "failed",
        error: err instanceof Error ? err.message : "pipeline failed",
      });
    }
  })();

  return NextResponse.json({ jobId: job.id }, { status: 202 });
}
