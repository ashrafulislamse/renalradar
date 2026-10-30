import { NextResponse } from "next/server";
import { getJob } from "@/lib/jobs";

// GET /api/analyze/[jobId] — poll pipeline status.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const job = getJob(jobId);
  if (!job) return NextResponse.json({ error: "job not found" }, { status: 404 });
  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    error: job.error,
    result: job.result,
  });
}
