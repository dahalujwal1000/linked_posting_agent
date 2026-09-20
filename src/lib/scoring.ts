import { createHash } from "node:crypto";

export type ScoreWeights = { relevance: number; freshness: number; value: number; discussion: number; credibility: number };
export const defaultWeights: ScoreWeights = { relevance: 30, freshness: 20, value: 20, discussion: 15, credibility: 15 };
export function scoreCandidate(values: Record<keyof ScoreWeights, number>, weights = defaultWeights) {
  const totalWeight = Object.values(weights).reduce((sum, value) => sum + value, 0);
  if (totalWeight !== 100) throw new Error("Scoring weights must total 100.");
  return Math.round(Object.entries(weights).reduce((sum, [key, weight]) => sum + values[key as keyof ScoreWeights] * weight / 100, 0));
}
export function normalizedHash(value: string) { return createHash("sha256").update(value.trim().toLowerCase().replace(/\?.*$/, "")).digest("hex"); }
export function contentFingerprint(title: string, excerpt: string) { return createHash("sha256").update(`${title} ${excerpt}`.toLowerCase().replace(/\W+/g, " ").trim()).digest("hex"); }
