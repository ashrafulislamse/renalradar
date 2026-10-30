// Guardrail: this tool documents meals; it never gives personal medical advice.
// Deterministic heuristics classify each generated sentence; advice-shaped
// output is REFUSED (replaced with a referral to the patient's dietitian).

export type Verdict = "education" | "trend" | "advice";

const ADVICE_PATTERNS: RegExp[] = [
  /\byou (?:should|must|need to|have to)\b/i,
  /\b(?:eat|avoid|stop|reduce|limit|cut)\s+(?:more |less )?(?:this|that|it|sodium|potassium|phosphorus|fluid|salt|protein)\b/i,
  /\b(?:is|are)\s+(?:safe|unsafe|okay|ok|dangerous|bad|good)\s+for\s+you\b/i,
  /\bi recommend\b/i,
  /\b(?:increase|decrease)\s+your\b/i,
  /\byour\s+(?:target|limit|allowance|dose|intake)\s+(?:is|should)\b/i,
];

export function classifySentence(sentence: string): Verdict {
  if (ADVICE_PATTERNS.some((re) => re.test(sentence))) return "advice";
  if (/\b(?:trend|this week|last week|compared|average|over time)\b/i.test(sentence))
    return "trend";
  return "education";
}

const REFUSAL =
  "I can't advise on personal dietary changes. Please discuss this with your dietitian — here are the questions to ask.";

export type GuardrailResult = {
  allowed: string[];
  refused: string[];
  refusal: string | null;
};

export function screenNarrative(text: string): GuardrailResult {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const allowed: string[] = [];
  const refused: string[] = [];
  for (const s of sentences) {
    if (classifySentence(s) === "advice") refused.push(s);
    else allowed.push(s);
  }
  return {
    allowed,
    refused,
    refusal: refused.length > 0 ? REFUSAL : null,
  };
}

// Deterministic safety: any dietitian-facing summary ends with questions, never directives.
export function dietitianQuestions(totals: Record<string, number | null>): string {
  const parts: string[] = [];
  if (totals.sodium_mg !== null) parts.push(`sodium ${totals.sodium_mg} mg`);
  if (totals.potassium_mg !== null) parts.push(`potassium ${totals.potassium_mg} mg`);
  if (totals.phosphorus_mg !== null) parts.push(`phosphorus ${totals.phosphorus_mg} mg`);
  const summary = parts.length ? parts.join(", ") : "the values above";
  return `Logged this week: ${summary}. What, if anything, should we adjust together?`;
}
