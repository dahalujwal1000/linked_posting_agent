import { NextResponse } from "next/server";
import { z } from "zod";
import { generateWithFallback } from "@/lib/ai/provider";
import { getProviders } from "@/lib/ai/adapters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  title: z.string().min(5).max(300),
  url: z.string().url(),
  source: z.string().min(1).max(100),
  excerpt: z.string().max(1000).default(""),
  topic: z.string().max(100).default(""),
});

function buildPrompt(input: z.infer<typeof requestSchema>): string {
  return `You are a LinkedIn content writer for a full-stack developer and cybersecurity student.

Write ONE LinkedIn post about this news item. Strict rules:
- NEVER invent personal experience, achievements, statistics, quotations, or facts.
- Only make claims supported by the source below.
- Frame it as what the author learned or found interesting in this source — not as personal accomplishments.
- Tone: thoughtful, practical, professional. No hype, no emojis.
- Length: 120-200 words. End with one genuine discussion question.
- Finish with 2-3 relevant hashtags.
- Also write a short post title (max 12 words).

Source:
Title: ${input.title}
Publisher: ${input.source}
URL: ${input.url}
Topic: ${input.topic}
Excerpt: ${input.excerpt}

Respond with ONLY a JSON object matching this exact shape:
{
  "title": "short post title",
  "content": "the full LinkedIn post text with line breaks",
  "version": "educational",
  "sourceClaims": [{ "claim": "a claim made in the post", "evidence": "what the source says supporting it" }]
}`;
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const providers = getProviders();
  if (providers.length === 0) {
    return NextResponse.json({ error: "No AI provider configured. Set GEMINI_API_KEY or OPENROUTER_API_KEY." }, { status: 503 });
  }
  const log: { provider: string; model: string; attempt: number; error?: string }[] = [];
  try {
    const draft = await generateWithFallback(providers, buildPrompt(parsed.data), (e) => log.push(e), 30_000);
    return NextResponse.json({ draft, log });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed", log },
      { status: 502 },
    );
  }
}
