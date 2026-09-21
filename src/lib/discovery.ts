import Parser from "rss-parser";
import { contentFingerprint, normalizedHash, scoreCandidate } from "@/lib/scoring";
import { assertSafeExternalUrl } from "@/lib/security/safe-url";

export interface NewsCandidate {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  topic: string;
  excerpt: string;
  totalScore: number;
}

const parser = new Parser();
const MAX_AGE_DAYS = 7;

const RSS_FEEDS: { name: string; url: string; topic: string }[] = [
  { name: "The Pragmatic Engineer", url: "https://newsletter.pragmaticengineer.com/feed", topic: "Full-stack development" },
  { name: "Google Online Security", url: "https://security.googleblog.com/feeds/posts/default", topic: "Cybersecurity" },
];

const DEVTO_TAGS = ["webdev", "security", "ai"];
const HN_QUERIES = ["AI security", "LLM agents", "full-stack"];

function guessTopic(text: string): string {
  const t = text.toLowerCase();
  if (/(secur|vulnerab|exploit|owasp|breach|malware|cve)/.test(t)) return "Cybersecurity";
  if (/(ai|llm|gpt|gemini|model|agent)/.test(t)) return "AI tooling";
  if (/(react|next|typescript|node|api|database|web)/.test(t)) return "Full-stack development";
  return "Career learning";
}

function freshness(publishedAt: string): number {
  const ageDays = (Date.now() - new Date(publishedAt).getTime()) / 86_400_000;
  if (Number.isNaN(ageDays)) return 40;
  return Math.max(0, Math.round(100 - (ageDays / MAX_AGE_DAYS) * 100));
}

function buildCandidate(raw: { title: string; url: string; source: string; publishedAt: string; excerpt: string; popularity?: number }): NewsCandidate | null {
  try {
    const url = assertSafeExternalUrl(raw.url).toString();
    const topic = guessTopic(`${raw.title} ${raw.excerpt}`);
    const fresh = freshness(raw.publishedAt);
    const popularity = Math.min(100, raw.popularity ?? 50);
    const totalScore = scoreCandidate({
      relevance: 70, freshness: fresh, value: 65,
      discussion: popularity, credibility: 70,
    });
    return {
      id: normalizedHash(url).slice(0, 16),
      title: raw.title.trim(),
      url,
      source: raw.source,
      publishedAt: raw.publishedAt,
      topic,
      excerpt: raw.excerpt.slice(0, 300).trim(),
      totalScore,
    };
  } catch {
    return null;
  }
}

async function fetchHN(): Promise<NewsCandidate[]> {
  const results: NewsCandidate[] = [];
  for (const query of HN_QUERIES) {
    try {
      const res = await fetch(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=5`, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) continue;
      const data = await res.json() as { hits: { title: string; url?: string; created_at: string; points: number; objectID: string }[] };
      for (const hit of data.hits) {
        if (!hit.url) continue;
        const c = buildCandidate({
          title: hit.title, url: hit.url, source: "Hacker News",
          publishedAt: hit.created_at,
          excerpt: `${hit.points} points on Hacker News`,
          popularity: Math.min(100, hit.points / 3),
        });
        if (c) results.push(c);
      }
    } catch { /* skip failed source */ }
  }
  return results;
}

async function fetchDevto(): Promise<NewsCandidate[]> {
  const results: NewsCandidate[] = [];
  for (const tag of DEVTO_TAGS) {
    try {
      const res = await fetch(`https://dev.to/api/articles?tag=${tag}&top=7&per_page=5`, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) continue;
      const data = await res.json() as { title: string; url: string; published_at: string; description: string; public_reactions_count: number }[];
      for (const a of data) {
        const c = buildCandidate({
          title: a.title, url: a.url, source: "dev.to",
          publishedAt: a.published_at, excerpt: a.description,
          popularity: Math.min(100, a.public_reactions_count / 5),
        });
        if (c) results.push(c);
      }
    } catch { /* skip failed source */ }
  }
  return results;
}

async function fetchRss(): Promise<NewsCandidate[]> {
  const results: NewsCandidate[] = [];
  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      for (const item of parsed.items.slice(0, 5)) {
        if (!item.link || !item.title) continue;
        const c = buildCandidate({
          title: item.title, url: item.link, source: feed.name,
          publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
          excerpt: item.contentSnippet ?? "",
          popularity: 50,
        });
        if (c) results.push(c);
      }
    } catch { /* skip failed source */ }
  }
  return results;
}

export async function discoverNews(): Promise<NewsCandidate[]> {
  const [hn, devto, rss] = await Promise.all([fetchHN(), fetchDevto(), fetchRss()]);
  const seen = new Set<string>();
  const cutoff = Date.now() - MAX_AGE_DAYS * 86_400_000;
  return [...hn, ...devto, ...rss]
    .filter((c) => {
      const fp = contentFingerprint(c.title, c.excerpt);
      if (seen.has(fp)) return false;
      seen.add(fp);
      return new Date(c.publishedAt).getTime() > cutoff;
    })
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 12);
}
