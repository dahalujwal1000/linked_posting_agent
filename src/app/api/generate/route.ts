import { NextResponse } from "next/server";
import { z } from "zod";
import { generateWithFallback } from "@/lib/ai/provider";
import { getProviders } from "@/lib/ai/adapters";
import { extractArticleText } from "@/lib/extract";
import { rateLimitOk } from "@/lib/cache";
import { saveDraft } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STYLES = ["educational", "opinion", "discussion"] as const;

const requestSchema = z.object({
  candidateId: z.string().min(1).max(64),
  title: z.string().min(5).max(300),
  url: z.string().url(),
  source: z.string().min(1).max(100),
  excerpt: z.string().max(1000).default(""),
  topic: z.string().max(100).default(""),
  style: z.enum(STYLES).default("educational"),
});

const STYLE_GUIDES: Record<(typeof STYLES)[number], string> = {
  educational:
    "Share something useful you picked up from the source, like you'd explain it to a friend who asked. Keep it casual but informative.",
  opinion:
    "Give your honest take on the idea in the source — agree, question it, or add a nuance. Sound like a real person thinking out loud, clearly framed as your view, not fact or personal achievement.",
  discussion:
    "Bring up the source's core idea in a laid-back way and get people talking. End with a genuine question you'd actually want answers to.",
};

function buildPrompt(input: z.infer<typeof requestSchema>, articleText: string | null): string {
  return `You are writing a LinkedIn post for a full-stack developer and cybersecurity student.

Write ONE LinkedIn post about this news item, in the "${input.style}" style: ${STYLE_GUIDES[input.style]}

Voice rules:
- Sound like a normal person posting, not a company blog. Conversational and relaxed.
- Not too formal (no "Furthermore", "In today's landscape", corporate speak) and not too direct or salesy (no "You must", "Here's why you need to").
- Contractions are fine ("I'm", "it's", "don't"). Short sentences are fine.
- It's okay to hedge naturally: "interesting that", "I noticed", "kind of curious about".

Strict rules:
- NEVER invent personal experience, achievements, statistics, quotations, or facts.
- Only make claims supported by the source below.
- Frame it as what the writer learned or found interesting in this source — not as personal accomplishments.
- No hype, no emojis.
- Length: 100-170 words. End with one genuine, easy-to-answer question.
- Finish with 2-3 relevant hashtags.
- Also write a short post title (max 12 words).

Source:
Title: ${input.title}
Publisher: ${input.source}
URL: ${input.url}
Topic: ${input.topic}
${articleText ? `Article content:\n${articleText}` : `Excerpt: ${input.excerpt}`}

Respond with ONLY a JSON object matching this exact shape:
{
  "title": "short post title",
  "content": "the full LinkedIn post text with line breaks",
  "version": "${input.style}",
  "sourceClaims": [{ "claim": "a claim made in the post", "evidence": "what the source says supporting it" }]
}`;
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!rateLimitOk("generate", 20, 60 * 60_000)) {
    return NextResponse.json({ error: "Rate limit reached (20 generations/hour). Try again later." }, { status: 429 });
  }
  const providers = getProviders();
  if (providers.length === 0) {
    return NextResponse.json({ error: "No AI provider configured. Set GEMINI_API_KEY or OPENROUTER_API_KEY." }, { status: 503 });
  }
  const log: { provider: string; model: string; attempt: number; error?: string }[] = [];
  try {
    const input = parsed.data;
    const articleText = await extractArticleText(input.url);
    const draft = await generateWithFallback(providers, buildPrompt(input, articleText), (e) => log.push(e), 60_000);
    const saved = {
      id: `${input.candidateId}:${input.style}`,
      candidateId: input.candidateId,
      style: input.style,
      candidateTitle: input.title,
      candidateUrl: input.url,
      source: input.source,
      draft,
      createdAt: new Date().toISOString(),
    };
    await saveDraft(saved).catch(() => { /* persistence is best-effort */ });
    return NextResponse.json({ draft, saved, usedArticleText: Boolean(articleText), log });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed", log },
      { status: 502 },
    );
  }
}

