import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;
const optionalString = z.preprocess(emptyToUndefined, z.string().min(1).optional());
const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());

const environment = z.object({
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalString,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  CRON_SECRET: z.preprocess(emptyToUndefined, z.string().min(24).optional()),
  APP_URL: z.preprocess(emptyToUndefined, z.string().url().default("http://localhost:3000")),
  GEMINI_API_KEY: optionalString, GEMINI_MODEL: z.preprocess(emptyToUndefined, z.string().default("gemini-3.5-flash")),
  OPENROUTER_API_KEY: optionalString,
  OPENROUTER_MODEL_1: z.preprocess(emptyToUndefined, z.string().default("google/gemma-4-31b-it:free")),
  OPENROUTER_MODEL_2: z.preprocess(emptyToUndefined, z.string().default("qwen/qwen3.8-27b:free")),
  OPENROUTER_MODEL_3: z.preprocess(emptyToUndefined, z.string().default("nvidia/nemotron-3-ultra-550b-a55b:free")),
  RESEND_API_KEY: optionalString, RESEND_FROM: optionalString,
  LINKEDIN_API_ENABLED: z.enum(["true", "false"]).default("false"),
  LINKEDIN_CLIENT_ID: optionalString, LINKEDIN_CLIENT_SECRET: optionalString,
  LINKEDIN_REDIRECT_URI: optionalUrl,
});

export const env = environment.parse(process.env);

/**
 * The browser-safe Supabase key. Supabase issues it under two names depending on the project's key
 * era: the legacy `anon` JWT (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) and the newer opaque
 * `sb_publishable_...` key that the dashboard labels `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
 * Both grant the same permission, so either one is accepted here.
 */
export function getPublicSupabaseKey() {
  return env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
}

export const isDemoMode = !env.NEXT_PUBLIC_SUPABASE_URL || !getPublicSupabaseKey();
