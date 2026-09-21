import { NextResponse } from "next/server";
import { z } from "zod";
import { generateJsonWithFallback } from "@/lib/ai/provider";
import { getProviders } from "@/lib/ai/adapters";
import { rateLimitOk } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().min(20).max(3000),
  sourceTitle: z.string().max(300),
  sourceUrl: z.string().url(),
  sourceExcerpt: z.string().max(3000).default(""),
});

const reviewSchema = z.object({
  overallScore: z.number().min(0).max(100),
  factualSupport: z.number().min(0).max(100),
  originality: z.number().min(0).max(100),
  tone: z.number().min(0).max(100),
  readability: z.number().min(0).max(100),
  warnings: z.array(z.string()).max(6),
  claims: z.array(z.object({
    text: z.string(),
    state: z.enum(["supported", "needs_review", "personal_claim"]),
    evidence: z.string().optional(),
  })).max(10),
  recommendation: z.enum(["approve", "edit"]),
});

export type ReviewResult = z.infer<typeof reviewSchema>;

function buildReviewPrompt(input: z.infer<typeof requestSchema>): string {
  return `You are a strict but fair reviewer of LinkedIn posts for a full-stack developer and cybersecurity student.

Review this draft against its source. Your job:
1. Extract every factual claim in the draft.
2. Mark each claim: "supported" (the source backs it), "needs_review" (the source does NOT back it or it can't be verified), or "personal_claim" (framed as the writer's own view/experience — check it does not fabricate achievements).
3. Flag any invented experience, statistics, quotations, or hype as warnings.
4. Score 0-100 on: overall, factualSupport, originality, tone (conversational, not corporate), readability.
5. Recommend "approve" if safe to post as-is, otherwise "edit".

Draft title: ${input.title}
Draft content:
"""
${input.content}
"""

Source title: ${input.sourceTitle}
Source URL: ${input.sourceUrl}
Source excerpt:
"""
${input.sourceExcerpt}
"""

Respond with ONLY a JSON object matching this exact shape:
{
  "overallScore": 0,
  "factualSupport": 0,
  "originality": 0,
  "tone": 0,
  "readability": 0,
  "warnings": ["..."],
  "claims": [{ "text": "...", "state": "supported", "evidence": "what the source says" }],
  "recommendation": "approve"
}`;
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!rateLimitOk("review", 20, 60 * 60_000)) {
    return NextResponse.json({ error: "Rate limit reached. Try again later." }, { status: 429 });
  }
  const providers = getProviders();
  if (providers.length === 0) {
    return NextResponse.json({ error: "No AI provider configured." }, { status: 503 });
  }
  const log: { provider: string; model: string; attempt: number; error?: string }[] = [];
  try {
    const review = await generateJsonWithFallback(providers, buildReviewPrompt(parsed.data), reviewSchema, (e) => log.push(e), 60_000);
    return NextResponse.json({ review, log });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Review failed", log },
      { status: 502 },
    );
  }
}
