import { env } from "@/lib/env";
import { AiProvider, AiProviderError } from "@/lib/ai/provider";

function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new AiProviderError("No JSON object in model output", "retryable");
  try {
    return JSON.parse(match[0]);
  } catch {
    throw new AiProviderError("Model output was not valid JSON", "retryable");
  }
}

function geminiProvider(): AiProvider | null {
  if (!env.GEMINI_API_KEY) return null;
  const model = env.GEMINI_MODEL;
  return {
    name: "gemini",
    model,
    async generate(prompt: string, signal: AbortSignal) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, responseMimeType: "application/json" },
          }),
        },
      );
      if (!res.ok) {
        const kind = res.status === 429 || res.status >= 500 ? "retryable" : "permanent";
        throw new AiProviderError(`Gemini HTTP ${res.status}`, kind, res.status);
      }
      const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      return extractJson(text);
    },
  };
}

function openRouterProvider(model: string): AiProvider {
  return {
    name: "openrouter",
    model,
    async generate(prompt: string, signal: AbortSignal) {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) {
        const kind = res.status === 429 || res.status >= 500 ? "retryable" : "permanent";
        throw new AiProviderError(`OpenRouter HTTP ${res.status}`, kind, res.status);
      }
      const data = await res.json() as { choices?: { message?: { content?: string } }[] };
      return extractJson(data.choices?.[0]?.message?.content ?? "");
    },
  };
}

/** Returns configured providers in priority order: Gemini first, OpenRouter fallbacks after. */
export function getProviders(): AiProvider[] {
  const providers: AiProvider[] = [];
  const gemini = geminiProvider();
  if (gemini) providers.push(gemini);
  if (env.OPENROUTER_API_KEY) {
    for (const model of [env.OPENROUTER_MODEL_1, env.OPENROUTER_MODEL_2, env.OPENROUTER_MODEL_3]) {
      providers.push(openRouterProvider(model));
    }
  }
  return providers;
}
