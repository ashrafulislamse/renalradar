// Async job pattern: POST /api/analyze creates a job (15-60s of AI work vs
// Vercel's 60s cap), the client polls GET /api/analyze/[jobId].
// MVP store is in-memory; production swap = Supabase table (same interface).

export type JobStatus = "queued" | "running" | "done" | "failed";

export type Job = {
  id: string;
  status: JobStatus;
  createdAt: number;
  result?: unknown;
  error?: string;
};

const globalJobs = globalThis as unknown as { __renalradarJobs?: Map<string, Job> };
const jobs: Map<string, Job> = globalJobs.__renalradarJobs ?? new Map();
globalJobs.__renalradarJobs = jobs;

export function createJob(): Job {
  const job: Job = { id: crypto.randomUUID(), status: "queued", createdAt: Date.now() };
  jobs.set(job.id, job);
  return job;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function updateJob(id: string, patch: Partial<Job>): Job | undefined {
  const job = jobs.get(id);
  if (!job) return undefined;
  Object.assign(job, patch);
  return job;
}
