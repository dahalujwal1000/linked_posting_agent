import { createClient } from "@supabase/supabase-js";
import { env, getPublicSupabaseKey, isDemoMode } from "@/lib/env";

/** Browser-safe client. Returns null in demo mode so callers fall back to local fixtures. */
export function getPublicSupabase() {
  const key = getPublicSupabaseKey();
  if (isDemoMode || !env.NEXT_PUBLIC_SUPABASE_URL || !key) return null;
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, key);
}
