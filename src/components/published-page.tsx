"use client";

import { useState } from "react";
import { ArrowSquareOut, Check, Copy, UploadSimple } from "@phosphor-icons/react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockDrafts, mockMetrics, mockPublished, mockSettings } from "@/lib/mock-data";
import type { EngagementMetrics, PublishedPost } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type MetricKey = "impressions" | "reactions" | "comments" | "reposts";

const METRIC_FIELDS: { key: MetricKey; label: string }[] = [
  { key: "impressions", label: "Impressions" },
  { key: "reactions", label: "Reactions" },
  { key: "comments", label: "Comments" },
  { key: "reposts", label: "Reposts" },
];

export default function PublishedPage() {
  const [posts] = useState<PublishedPost[]>(mockPublished);
  const [metrics, setMetrics] = useState<EngagementMetrics[]>(mockMetrics);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishTarget, setPublishTarget] = useState("");

  const publishable = mockDrafts.filter((d) => d.status === "approved" || d.status === "scheduled");
  const publishSelection = publishable.find((d) => d.id === publishTarget);
  const blockedByApproval =
    mockSettings.approvalRequired && publishSelection !== undefined && publishSelection.status !== "approved";

  function setMetric(postId: string, key: MetricKey, value: number) {
    setMetrics((prev) =>
      prev.map((m) => {
        if (m.publishedPostId !== postId) return m;
        const next: EngagementMetrics = { ...m, recordedAt: new Date().toISOString() };
        next[key] = Number.isNaN(value) ? 0 : value;
        return next;
      }),
    );
  }

  async function copy(post: PublishedPost) {
    await navigator.clipboard.writeText(post.finalText);
    setCopiedId(post.id);
    toast.success("Published text copied.");
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-7">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Published</h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
              {posts.length} posts published. Metrics are entered by hand and stored against each post.
            </p>
          </div>
          <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UploadSimple size={16} /> Publish a draft
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Publish a draft manually</DialogTitle>
              <DialogDescription>
                Copy the text into LinkedIn yourself. This records the post with method = manual so your
                analytics stay accurate without any LinkedIn credentials.
              </DialogDescription>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="mb-2 text-xs text-[var(--muted)]">Draft to publish</p>
                  <Select value={publishTarget} onValueChange={setPublishTarget}>
                    <SelectTrigger aria-label="Draft to publish">
                      <SelectValue placeholder="Choose an approved or scheduled draft" />
                    </SelectTrigger>
                    <SelectContent>
                      {publishable.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {blockedByApproval && (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
                    Approval is required in Settings and this draft is still {publishSelection?.status.replace("_", " ")}.
                    Approve it on the Drafts page first.
                  </p>
                )}

                <div className="flex flex-wrap justify-end gap-2">
                  <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                  </DialogClose>
                  <Button
                    disabled={blockedByApproval}
                    onClick={() => {
                      if (!publishTarget) {
                        toast.error("Choose a draft first.");
                        return;
                      }
                      setPublishOpen(false);
                      toast.success("Recorded as manually published.", {
                        description: "The data layer will write this to published_posts with method = manual.",
                      });
                    }}
                  >
                    <Check size={16} /> Confirm publish
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {posts.map((post) => {
          const m = metrics.find((row) => row.publishedPostId === post.id);
          return (
            <Card key={post.id} className="overflow-hidden">
              <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                    <Badge tone={post.method === "manual" ? "neutral" : "accent"}>
                      {post.method === "manual" ? "Manual" : "LinkedIn API"}
                    </Badge>
                    <Badge tone="success">{post.status}</Badge>
                    <span>{formatDate(post.publishedAt)}</span>
                  </div>
                  <p className="mt-2 font-semibold">{post.title}</p>
                  {post.linkedinUrl ? (
                    <a
                      href={post.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--accent)]"
                    >
                      {post.linkedinPostId}
                      <ArrowSquareOut size={13} />
                    </a>
                  ) : (
                    <p className="mt-1 text-xs text-[var(--muted)]">Copied into LinkedIn by hand — no post ID recorded.</p>
                  )}
                </div>
                <Button variant="outline" onClick={() => copy(post)} className="shrink-0">
                  {copiedId === post.id ? <Check size={16} /> : <Copy size={16} />}
                  {copiedId === post.id ? "Copied!" : "Copy text"}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:p-5">
                {METRIC_FIELDS.map(({ key, label }) => (
                  <label key={key} className="block">
                    <span className="text-xs text-[var(--muted)]">{label}</span>
                    <input
                      type="number"
                      min={0}
                      value={m ? m[key] : 0}
                      onChange={(e) => setMetric(post.id, key, Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border bg-[var(--panel)] px-3 py-2 text-sm tabular-nums outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
                    />
                  </label>
                ))}
              </div>

              <details className="border-t px-4 py-3 text-sm sm:px-5">
                <summary className="cursor-pointer text-xs font-semibold text-[var(--muted)]">
                  Published text
                </summary>
                <p className="mt-3 whitespace-pre-line rounded-lg bg-black/[.03] p-4 leading-6 dark:bg-white/[.04]">
                  {post.finalText}
                </p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Last recorded {m ? formatDate(m.recordedAt) : "—"}
                </p>
              </details>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
