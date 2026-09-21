"use client";

import { useMemo, useState } from "react";
import { ArrowSquareOut, CheckCircle, Prohibit, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScoreBar } from "@/components/ui/score-bar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockCandidates } from "@/lib/mock-data";
import type { Candidate, CandidateStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const ALL_STATUSES: CandidateStatus[] = ["new", "selected", "dismissed", "duplicate", "blocked"];

const statusTone: Record<CandidateStatus, "accent" | "success" | "neutral" | "warning" | "danger"> = {
  new: "accent",
  selected: "success",
  dismissed: "neutral",
  duplicate: "warning",
  blocked: "danger",
};

export default function IdeasPage() {
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  const [topic, setTopic] = useState("all");
  const [status, setStatus] = useState("all");

  const topics = useMemo(() => Array.from(new Set(mockCandidates.map((c) => c.topic))), []);
  const visible = candidates.filter(
    (c) => (topic === "all" || c.topic === topic) && (status === "all" || c.status === status),
  );

  function updateStatus(id: string, next: CandidateStatus) {
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, status: next } : c)));
    toast.success(next === "selected" ? "Candidate selected for drafting." : "Candidate dismissed.");
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-7">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Ideas</h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
            Showing {visible.length} of {candidates.length} discovered candidates. Each total is the weighted
            result of the five component scores.
          </p>
        </div>

        <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <Select value={topic} onValueChange={setTopic}>
            <SelectTrigger className="sm:w-60" aria-label="Filter by topic">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All topics</SelectItem>
              {topics.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="sm:w-48" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        {visible.length === 0 && (
          <Card className="p-10 text-center text-sm text-[var(--muted)]">No candidates match these filters.</Card>
        )}

        <div className="space-y-4">
          {visible.map((c) => (
            <Card key={c.id} className="overflow-hidden">
              <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                    <Badge tone="accent">{c.source}</Badge>
                    <Badge tone={statusTone[c.status]}>{c.status}</Badge>
                    <span>{c.topic}</span>
                    <span>{formatDate(c.publishedAt)}</span>
                  </div>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 flex items-start gap-1.5 font-semibold hover:text-[var(--accent)]"
                  >
                    {c.title}
                    <ArrowSquareOut size={15} className="mt-1 shrink-0" />
                  </a>
                  <p className="mt-1.5 line-clamp-2 text-sm text-[var(--muted)]">{c.excerpt}</p>
                </div>
                <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-[var(--accent)]/10 text-sm font-bold text-[var(--accent)]">
                  {c.totalScore}
                </span>
              </div>

              <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-5">
                <ScoreBar label="Relevance" value={c.scores.relevance} hint="How closely the topic matches the interests configured in Settings." />
                <ScoreBar label="Freshness" value={c.scores.freshness} hint="Decays linearly to zero across the maximum article age window." />
                <ScoreBar label="Value" value={c.scores.value} hint="How much a reader would actually learn from the source." />
                <ScoreBar label="Discussion" value={c.scores.discussion} hint="How much genuine conversation the topic tends to generate." />
                <ScoreBar label="Credibility" value={c.scores.credibility} hint="How trustworthy the publisher is, from the source's own score." />
              </div>

              <div className="flex flex-wrap gap-2 border-t p-4 sm:p-5">
                <Button variant="outline" onClick={() => updateStatus(c.id, "selected")} disabled={c.status === "selected"}>
                  <CheckCircle size={16} /> Select
                </Button>
                <Button variant="ghost" onClick={() => updateStatus(c.id, "dismissed")} disabled={c.status === "dismissed"}>
                  <Prohibit size={16} /> Dismiss
                </Button>
                <Button asChild variant="outline">
                  <Link href="/drafts"><Sparkle size={16} /> Generate post</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
