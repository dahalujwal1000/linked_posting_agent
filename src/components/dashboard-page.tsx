"use client";

import { useEffect, useState } from "react";
import { ArrowSquareOut, Check, Copy, ShieldCheck, Sparkle, SpinnerGap, Trash } from "@phosphor-icons/react";
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

interface SavedDraft {
  id: string;
  candidateId: string;
  style: string;
  candidateTitle: string;
  candidateUrl: string;
  source: string;
  draft: GeneratedDraft;
  createdAt: string;
}

interface ReviewResult {
  overallScore: number;
  factualSupport: number;
  originality: number;
  tone: number;
  readability: number;
  warnings: string[];
  claims: { text: string; state: "supported" | "needs_review" | "personal_claim"; evidence?: string }[];
  recommendation: "approve" | "edit";
}

const STYLES = ["educational", "opinion", "discussion"] as const;
type Style = (typeof STYLES)[number];

export default function Dashboard() {
  const [candidates, setCandidates] = useState<NewsCandidate[]>([]);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  // Drafts keyed by `${candidateId}:${style}`
  const [drafts, setDrafts] = useState<Record<string, GeneratedDraft>>({});
  const [genErrors, setGenErrors] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeStyle, setActiveStyle] = useState<Record<string, Style>>({});
  const [savedCount, setSavedCount] = useState(0);
  const [reviews, setReviews] = useState<Record<string, ReviewResult>>({});
  const [reviewingFor, setReviewingFor] = useState<string | null>(null);
  const [reviewErrors, setReviewErrors] = useState<Record<string, string>>({});

  // Restore previously generated drafts so a refresh never loses work.
  useEffect(() => {
    fetch("/api/drafts")
      .then((r) => r.json())
      .then((data: { drafts?: SavedDraft[] }) => {
        const map: Record<string, GeneratedDraft> = {};
        for (const s of data.drafts ?? []) map[s.id] = s.draft;
        setDrafts(map);
        setSavedCount((data.drafts ?? []).length);
      })
      .catch(() => { /* persistence is best-effort */ });
  }, []);

  async function fetchNews() {
    setFetching(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/news");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fetch failed");
      setCandidates(data.candidates);
      setGenErrors({});
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Fetch failed");
    } finally {
      setFetching(false);
    }
  }

  async function generatePost(c: NewsCandidate, style: Style) {
    const key = `${c.id}:${style}`;
    setGeneratingFor(key);
    setGenErrors((prev) => ({ ...prev, [key]: "" }));
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: c.id, title: c.title, url: c.url, source: c.source, excerpt: c.excerpt, topic: c.topic, style }),
      });
      const data = await res.json();
      if (!res.ok) {
        const last = Array.isArray(data.log) && data.log.length > 0 ? data.log[data.log.length - 1] : null;
        throw new Error(last?.error ? `${data.error} (${last.provider}: ${last.error})` : (data.error ?? "Generation failed"));
      }
      setDrafts((prev) => ({ ...prev, [key]: data.draft }));
      setActiveStyle((prev) => ({ ...prev, [c.id]: style }));
      setSavedCount((n) => n + 1);
    } catch (e) {
      setGenErrors((prev) => ({ ...prev, [key]: e instanceof Error ? e.message : "Generation failed" }));
    } finally {
      setGeneratingFor(null);
    }
  }

  async function removeDraft(key: string) {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setSavedCount((n) => Math.max(0, n - 1));
    await fetch(`/api/drafts?id=${encodeURIComponent(key)}`, { method: "DELETE" }).catch(() => {});
  }

  async function copyDraft(key: string, draft: GeneratedDraft) {
    await navigator.clipboard.writeText(`${draft.title}\n\n${draft.content}`);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function reviewDraft(c: NewsCandidate, key: string, draft: GeneratedDraft) {
    setReviewingFor(key);
    setReviewErrors((prev) => ({ ...prev, [key]: "" }));
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          content: draft.content,
          sourceTitle: c.title,
          sourceUrl: c.url,
          sourceExcerpt: c.excerpt,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const last = Array.isArray(data.log) && data.log.length > 0 ? data.log[data.log.length - 1] : null;
        throw new Error(last?.error ? `${data.error} (${last.provider}: ${last.error})` : (data.error ?? "Review failed"));
      }
      setReviews((prev) => ({ ...prev, [key]: data.review }));
    } catch (e) {
      setReviewErrors((prev) => ({ ...prev, [key]: e instanceof Error ? e.message : "Review failed" }));
    } finally {
      setReviewingFor(null);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">News to LinkedIn</h2>
            <p className="mt-1 max-w-xl text-sm text-[var(--muted)]">
              Fetch fresh dev &amp; security news, generate source-grounded drafts in three styles, then copy and post the one you like.
              {savedCount > 0 && <span className="font-semibold text-[var(--foreground)]"> {savedCount} saved draft{savedCount === 1 ? "" : "s"} restored.</span>}
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
            Click <span className="font-semibold text-[var(--foreground)]">Fetch news</span> to discover today&apos;s top stories from Hacker News, dev.to, OWASP, Krebs, and engineering blogs.
          </Card>
        )}

        <div className="space-y-4">
                    {candidates.map((c) => {
            const stylesWithDrafts = STYLES.filter((s) => drafts[`${c.id}:${s}`]);
            const currentStyle = activeStyle[c.id] ?? stylesWithDrafts[0] ?? "educational";
            const currentKey = `${c.id}:${currentStyle}`;
            const currentDraft = drafts[currentKey];
            return (
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
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    {STYLES.map((style) => {
                      const key = `${c.id}:${style}`;
                      const hasDraft = Boolean(drafts[key]);
                      const busy = generatingFor === key;
                      return (
                        <Button
                          key={style}
                          variant={hasDraft && currentStyle === style ? "default" : "outline"}
                          onClick={() => (hasDraft ? setActiveStyle((prev) => ({ ...prev, [c.id]: style })) : generatePost(c, style))}
                          disabled={busy || generatingFor !== null}
                          className="capitalize"
                        >
                          {busy ? <SpinnerGap size={15} className="animate-spin" /> : <Sparkle size={15} />}
                          {style}{hasDraft ? " ✓" : ""}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                                {genErrors[currentKey] && (
                  <div className="border-b bg-red-50 px-5 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
                    {genErrors[currentKey]}
                  </div>
                )}

                {currentDraft && (
                  <div className="space-y-4 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold">
                        <span className="mr-2 rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-xs capitalize text-[var(--accent)]">{currentStyle}</span>
                        {currentDraft.title}
                      </p>
                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" onClick={() => reviewDraft(c, currentKey, currentDraft)} disabled={reviewingFor === currentKey}>
                          {reviewingFor === currentKey ? <SpinnerGap size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                          {reviews[currentKey] ? "Re-check" : "Check quality"}
                        </Button>
                        <Button variant="outline" onClick={() => copyDraft(currentKey, currentDraft)}>
                          {copiedId === currentKey ? <Check size={16} /> : <Copy size={16} />}
                          {copiedId === currentKey ? "Copied!" : "Copy post"}
                        </Button>
                        <Button variant="ghost" onClick={() => removeDraft(currentKey)} aria-label="Delete draft">
                          <Trash size={16} />
                        </Button>
                      </div>
                    </div>
                    <p className="whitespace-pre-line rounded-lg bg-black/[.03] p-4 text-sm leading-6 dark:bg-white/[.04]">{currentDraft.content}</p>
                    {currentDraft.sourceClaims.length > 0 && (
                      <details className="text-xs text-[var(--muted)]">
                        <summary className="cursor-pointer font-semibold">Source-grounding ({currentDraft.sourceClaims.length} claims)</summary>
                        <ul className="mt-2 list-disc space-y-1 pl-5">
                          {currentDraft.sourceClaims.map((sc, i) => (
                            <li key={i}><span className="font-medium">{sc.claim}</span> — {sc.evidence}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                    {reviewErrors[currentKey] && (
                      <p className="text-xs text-red-600 dark:text-red-400">{reviewErrors[currentKey]}</p>
                    )}
                    {reviews[currentKey] && (() => {
                      const rv = reviews[currentKey];
                      const flagged = rv.claims.filter((cl) => cl.state === "needs_review").length;
                      return (
                        <div className={rv.recommendation === "approve"
                          ? "rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30"
                          : "rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30"}>
                          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                            <span className="font-semibold">
                              {rv.recommendation === "approve" ? "Looks good to post" : "Needs edits before posting"} — score {rv.overallScore}/100
                            </span>
                            <span className="text-xs text-[var(--muted)]">
                              facts {rv.factualSupport} · tone {rv.tone} · readability {rv.readability}
                              {flagged > 0 && ` · ${flagged} claim${flagged === 1 ? "" : "s"} unverified`}
                            </span>
                          </div>
                          {rv.warnings.length > 0 && (
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[var(--muted)]">
                              {rv.warnings.map((w, i) => <li key={i}>{w}</li>)}
                            </ul>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
