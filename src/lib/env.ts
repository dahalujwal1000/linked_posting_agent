import { z } from "zod";

const environment = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(24).optional(),
  APP_URL: z.string().url().default("http://localhost:3000"),
  GEMINI_API_KEY: z.string().min(1).optional(), GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  OPENROUTER_MODEL_1: z.string().default("google/gemma-4-31b-it:free"),
  OPENROUTER_MODEL_2: z.string().default("qwen/qwen3.8-27b:free"),
  OPENROUTER_MODEL_3: z.string().default("nvidia/nemotron-3-ultra-550b-a55b:free"),
  RESEND_API_KEY: z.string().min(1).optional(), RESEND_FROM: z.string().email().optional(),
  LINKEDIN_API_ENABLED: z.enum(["true", "false"]).default("false"),
  LINKEDIN_CLIENT_ID: z.string().min(1).optional(), LINKEDIN_CLIENT_SECRET: z.string().min(1).optional(),
  LINKEDIN_REDIRECT_URI: z.string().url().optional(),
});

export const env = environment.parse(process.env);
export const isDemoMode = !env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
