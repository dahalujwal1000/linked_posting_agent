"use client";

import { useState } from "react";
import { ArrowSquareOut, Check, Copy, Sparkle, SpinnerGap } from "@phosphor-icons/react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface NewsCandidate {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  topic: string;
  excerpt: string;
  totalScore: number;
}

interface GeneratedDraft {
  title: string;
  content: string;
  version: string;
  sourceClaims: { claim: string; evidence: string }[];
}

export default function Dashboard() {
  const [candidates, setCandidates] = useState<NewsCandidate[]>([]);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, GeneratedDraft>>({});
  const [genErrors, setGenErrors] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function fetchNews() {
    setFetching(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/news");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fetch failed");
      setCandidates(data.candidates);
      setDrafts({});
      setGenErrors({});
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Fetch failed");
    } finally {
      setFetching(false);
    }
  }

  async function generatePost(c: NewsCandidate) {
    setGeneratingFor(c.id);
    setGenErrors((prev) => ({ ...prev, [c.id]: "" }));
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: c.title, url: c.url, source: c.source, excerpt: c.excerpt, topic: c.topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setDrafts((prev) => ({ ...prev, [c.id]: data.draft }));
    } catch (e) {
      setGenErrors((prev) => ({ ...prev, [c.id]: e instanceof Error ? e.message : "Generation failed" }));
    } finally {
      setGeneratingFor(null);
    }
  }

  async function copyDraft(id: string, draft: GeneratedDraft) {
    await navigator.clipboard.writeText(`${draft.title}\n\n${draft.content}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">News to LinkedIn</h2>
            <p className="mt-1 max-w-xl text-sm text-[var(--muted)]">
              Fetch fresh dev &amp; security news, generate a source-grounded draft, then copy and post it yourself.
            </p>
          </div>
          <Button onClick={fetchNews} disabled={fetching}>
            {fetching ? <SpinnerGap size={17} className="animate-spin" /> : <Sparkle size={17} />}
            {fetching ? "Fetching news..." : "Fetch news"}
          </Button>
        </div>

        {fetchError && (
          <Card className="border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
            {fetchError}
          </Card>
        )}

        {!fetching && candidates.length === 0 && !fetchError && (
          <Card className="p-10 text-center text-sm text-[var(--muted)]">
            Click <span className="font-semibold text-[var(--foreground)]">Fetch news</span> to discover today&apos;s top stories from Hacker News, dev.to, and engineering blogs.
          </Card>
        )}

        <div className="space-y-4">
          {candidates.map((c) => (
            <Card key={c.id} className="overflow-hidden">
              <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                    <span className="rounded-full bg-[var(--accent)]/10 px-2 py-0.5 font-semibold text-[var(--accent)]">{c.source}</span>
                    <span>{c.topic}</span>
                    <span>Score {c.totalScore}</span>
                    <span>{formatDate(c.publishedAt)}</span>
                  </div>
                  <a href={c.url} target="_blank" rel="noreferrer" className="mt-2 flex items-start gap-1.5 font-semibold hover:text-[var(--accent)]">
                    {c.title}
                    <ArrowSquareOut size={15} className="mt-1 shrink-0" />
                  </a>
                  {c.excerpt && <p className="mt-1.5 line-clamp-2 text-sm text-[var(--muted)]">{c.excerpt}</p>}
                </div>
                <Button variant="outline" onClick={() => generatePost(c)} disabled={generatingFor === c.id} className="shrink-0">
                  {generatingFor === c.id ? <SpinnerGap size={16} className="animate-spin" /> : <Sparkle size={16} />}
                  {drafts[c.id] ? "Regenerate" : "Generate post"}
                </Button>
              </div>

              {genErrors[c.id] && (
                <div className="border-b bg-red-50 px-5 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
                  {genErrors[c.id]}
                </div>
              )}

              {drafts[c.id] && (
                <div className="space-y-4 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold">{drafts[c.id].title}</p>
                    <Button variant="outline" onClick={() => copyDraft(c.id, drafts[c.id])} className="shrink-0">
                      {copiedId === c.id ? <Check size={16} /> : <Copy size={16} />}
                      {copiedId === c.id ? "Copied!" : "Copy post"}
                    </Button>
                  </div>
                  <p className="whitespace-pre-line rounded-lg bg-black/[.03] p-4 text-sm leading-6 dark:bg-white/[.04]">{drafts[c.id].content}</p>
                  {drafts[c.id].sourceClaims.length > 0 && (
                    <details className="text-xs text-[var(--muted)]">
                      <summary className="cursor-pointer font-semibold">Source-grounding ({drafts[c.id].sourceClaims.length} claims)</summary>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {drafts[c.id].sourceClaims.map((sc, i) => (
                          <li key={i}><span className="font-medium">{sc.claim}</span> — {sc.evidence}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
