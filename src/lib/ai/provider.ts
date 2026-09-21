import { z } from "zod";

export const generatedDraftSchema = z.object({ title: z.string().min(5).max(120), content: z.string().min(80).max(3000), version: z.enum(["educational", "opinion", "discussion"]), sourceClaims: z.array(z.object({ claim: z.string(), evidence: z.string() })).max(8) });
export type GeneratedDraft = z.infer<typeof generatedDraftSchema>;
export type AiErrorKind = "retryable" | "permanent";
export class AiProviderError extends Error { constructor(message: string, readonly kind: AiErrorKind, readonly status?: number) { super(message); } }
export interface AiProvider { name: string; model: string; generate(prompt: string, signal: AbortSignal): Promise<unknown>; }
export function classifyProviderError(error: unknown): AiErrorKind { const status = error instanceof AiProviderError ? error.status : undefined; if (status && [400, 401, 403].includes(status)) return "permanent"; if (error instanceof AiProviderError) return error.kind; return "retryable"; }
export async function generateJsonWithFallback<T>(providers: AiProvider[], prompt: string, schema: z.ZodType<T>, log: (event: { provider: string; model: string; attempt: number; error?: string }) => void, timeoutMs = 20_000): Promise<T> {
  let lastError: unknown;
  for (const provider of providers) for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try { const raw = await provider.generate(prompt, controller.signal); const parsed = schema.safeParse(raw); if (!parsed.success) throw new AiProviderError("Invalid structured output", attempt === 0 ? "retryable" : "permanent"); log({ provider: provider.name, model: provider.model, attempt }); return parsed.data; }
    catch (error) { const normalized = error instanceof Error && error.name === "AbortError" ? new AiProviderError(`Request timed out after ${Math.round(timeoutMs / 1000)}s`, "retryable") : error; lastError = normalized; log({ provider: provider.name, model: provider.model, attempt, error: normalized instanceof Error ? normalized.message : "Unknown provider failure" }); if (classifyProviderError(normalized) === "permanent") break; if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 300)); }
    finally { clearTimeout(timeout); }
  }
  throw lastError instanceof Error ? lastError : new Error("All AI providers failed.");
}

export function generateWithFallback(providers: AiProvider[], prompt: string, log: (event: { provider: string; model: string; attempt: number; error?: string }) => void, timeoutMs = 20_000): Promise<GeneratedDraft> {
  return generateJsonWithFallback(providers, prompt, generatedDraftSchema, log, timeoutMs);
}
