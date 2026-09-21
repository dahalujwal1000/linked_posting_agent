"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowSquareOut, Check, Copy, Sparkle, SpinnerGap, Trash } from "@phosphor-icons/react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

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

interface DraftGroup {
  candidateId: string;
  title: string;
  url: string;
  source: string;
  newest: string;
  drafts: SavedDraft[];
}

export default function DraftsPage() {
  const [groups, setGroups] = useState<DraftGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStyle, setActiveStyle] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/drafts")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Failed to load drafts");
        const byCandidate = new Map<string, DraftGroup>();
        for (const d of data.drafts as SavedDraft[]) {
          const g = byCandidate.get(d.candidateId) ?? {
            candidateId: d.candidateId,
            title: d.candidateTitle,
            url: d.candidateUrl,
            source: d.source,
            newest: d.createdAt,
            drafts: [],
          };
          g.drafts.push(d);
          if (d.createdAt > g.newest) g.newest = d.createdAt;
          byCandidate.set(d.candidateId, g);
        }
        setGroups([...byCandidate.values()].sort((a, b) => b.newest.localeCompare(a.newest)));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load drafts"))
      .finally(() => setLoading(false));
  }, []);

  async function copyDraft(d: SavedDraft) {
    await navigator.clipboard.writeText(`${d.draft.title}\n\n${d.draft.content}`);
    setCopiedId(d.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function removeDraft(d: SavedDraft) {
    setDeletingId(d.id);
    setGroups((prev) =>
      prev
        .map((g) => ({ ...g, drafts: g.drafts.filter((x) => x.id !== d.id) }))
        .filter((g) => g.drafts.length > 0),
    );
    await fetch(`/api/drafts?id=${encodeURIComponent(d.id)}`, { method: "DELETE" }).catch(() => {});
    setDeletingId(null);
  }

  const totalDrafts = groups.reduce((sum, g) => sum + g.drafts.length, 0);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Drafts</h2>
            <p className="mt-1 max-w-xl text-sm text-[var(--muted)]">
              Your saved drafts, grouped by story. They persist on this device.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/"><Sparkle size={16} /> New from news</Link>
          </Button>
        </div>

        {loading && (
          <Card className="p-10 text-center text-sm text-[var(--muted)]">
            <SpinnerGap size={20} className="mx-auto animate-spin" />
          </Card>
        )}

        {error && (
          <Card className="border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </Card>
        )}

        {!loading && !error && groups.length === 0 && (
          <Card className="p-10 text-center text-sm text-[var(--muted)]">
            No saved drafts yet. Go to <Link href="/" className="font-semibold text-[var(--accent)]">Overview</Link>, fetch news, and generate a post.
          </Card>
        )}

        {!loading && groups.length > 0 && (
          <p className="text-xs text-[var(--muted)]">{totalDrafts} draft{totalDrafts === 1 ? "" : "s"} across {groups.length} stor{groups.length === 1 ? "y" : "ies"}</p>
        )}
                <div className="space-y-4">
          {groups.map((g) => {
            const styles = g.drafts.map((d) => d.style);
            const currentStyle = activeStyle[g.candidateId] ?? styles[0];
            const current = g.drafts.find((d) => d.style === currentStyle) ?? g.drafts[0];
            return (
              <Card key={g.candidateId} className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                      <span className="rounded-full bg-[var(--accent)]/10 px-2 py-0.5 font-semibold text-[var(--accent)]">{g.source}</span>
                      <span>{formatDate(g.newest)}</span>
                    </div>
                    <a href={g.url} target="_blank" rel="noreferrer" className="mt-2 flex items-start gap-1.5 font-semibold hover:text-[var(--accent)]">
                      {g.title}
                      <ArrowSquareOut size={15} className="mt-1 shrink-0" />
                    </a>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    {g.drafts.map((d) => (
                      <Button
                        key={d.style}
                        variant={current.style === d.style ? "default" : "outline"}
                        onClick={() => setActiveStyle((prev) => ({ ...prev, [g.candidateId]: d.style }))}
                        className="capitalize"
                      >
                        {d.style}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold">{current.draft.title}</p>
                    <div className="flex shrink-0 gap-2">
                      <Button variant="outline" onClick={() => copyDraft(current)}>
                        {copiedId === current.id ? <Check size={16} /> : <Copy size={16} />}
                        {copiedId === current.id ? "Copied!" : "Copy post"}
                      </Button>
                      <Button variant="ghost" onClick={() => removeDraft(current)} disabled={deletingId === current.id} aria-label="Delete draft">
                        {deletingId === current.id ? <SpinnerGap size={16} className="animate-spin" /> : <Trash size={16} />}
                      </Button>
                    </div>
                  </div>
                  <p className="whitespace-pre-line rounded-lg bg-black/[.03] p-4 text-sm leading-6 dark:bg-white/[.04]">{current.draft.content}</p>
                  {current.draft.sourceClaims.length > 0 && (
                    <details className="text-xs text-[var(--muted)]">
                      <summary className="cursor-pointer font-semibold">Source-grounding ({current.draft.sourceClaims.length} claims)</summary>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {current.draft.sourceClaims.map((sc, i) => (
                          <li key={i}><span className="font-medium">{sc.claim}</span> — {sc.evidence}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
