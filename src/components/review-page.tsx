"use client";

import { useMemo, useState } from "react";
import { PencilSimple, SealCheck } from "@phosphor-icons/react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScoreBar } from "@/components/ui/score-bar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockDrafts, mockReviews } from "@/lib/mock-data";

type ClaimState = "supported" | "needs_review" | "personal_claim";

const stateTone: Record<ClaimState, "success" | "warning" | "neutral"> = {
  supported: "success",
  needs_review: "warning",
  personal_claim: "neutral",
};

export default function ReviewPage() {
  const reviewed = useMemo(() => mockDrafts.filter((d) => mockReviews[d.id]), []);
  const [draftId, setDraftId] = useState(reviewed[0]?.id ?? "");
  const [claimFilter, setClaimFilter] = useState<"all" | ClaimState>("all");

  const draft = reviewed.find((d) => d.id === draftId) ?? reviewed[0];
  const review = draft ? mockReviews[draft.id] : undefined;
  const claims = review ? review.claims.filter((c) => claimFilter === "all" || c.state === claimFilter) : [];
  const needsAttention = review ? review.claims.filter((c) => c.state === "needs_review").length : 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-7">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Review</h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
            Every claim in a draft is compared against the source. Anything the source does not support is flagged
            before you approve it.
          </p>
        </div>

        {!draft || !review ? (
          <Card className="p-10 text-center text-sm text-[var(--muted)]">
            No drafts have been reviewed yet. Generate a post from the Ideas page first.
          </Card>
        ) : (
          <>
            <Card className="p-4 sm:p-5">
              <Select value={draftId} onValueChange={setDraftId}>
                <SelectTrigger aria-label="Draft to review">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reviewed.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>

            <Card
              className={
                review.recommendation === "approve"
                  ? "border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30 sm:p-5"
                  : "border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30 sm:p-5"
              }
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">
                    {review.recommendation === "approve" ? "Recommended for approval" : "Needs edits before approval"}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {needsAttention === 0
                      ? "Every claim is either supported by the source or clearly marked as your own view."
                      : `${needsAttention} claim${needsAttention === 1 ? "" : "s"} could not be verified against the source.`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => toast.success("Draft approved.")}>
                    <SealCheck size={16} /> Approve
                  </Button>
                  <Button variant="outline" onClick={() => toast.info("Opening the draft for editing.")}>
                    <PencilSimple size={16} /> Request edit
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="space-y-3 p-4 sm:p-5">
              <h3 className="text-sm font-semibold">Quality scores</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <ScoreBar label="Overall" value={review.overallScore} />
                <ScoreBar label="Factual support" value={review.factualSupport} />
                <ScoreBar label="Originality" value={review.originality} />
                <ScoreBar label="Tone" value={review.tone} />
                <ScoreBar label="Readability" value={review.readability} />
              </div>
            </Card>

            {review.warnings.length > 0 && (
              <Card className="border-amber-200 p-4 dark:border-amber-900 sm:p-5">
                <h3 className="text-sm font-semibold">Warnings</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
                  {review.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </Card>
            )}

            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4 sm:p-5">
                <h3 className="text-sm font-semibold">Claims ({claims.length})</h3>
                <Select value={claimFilter} onValueChange={(v) => setClaimFilter(v as "all" | ClaimState)}>
                  <SelectTrigger className="w-56" aria-label="Filter claims by state">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All claim states</SelectItem>
                    <SelectItem value="supported">Supported</SelectItem>
                    <SelectItem value="needs_review">Needs review</SelectItem>
                    <SelectItem value="personal_claim">Personal claim</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto p-4 sm:p-5">
                <table className="w-full min-w-[38rem] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-[var(--muted)]">
                    <tr className="border-b">
                      <th className="py-2 pr-4 font-semibold">Claim</th>
                      <th className="py-2 pr-4 font-semibold">State</th>
                      <th className="py-2 font-semibold">Evidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.map((c) => (
                      <tr key={c.text} className="border-b align-top last:border-0">
                        <td className="py-3 pr-4 font-medium">{c.text}</td>
                        <td className="py-3 pr-4">
                          <Badge tone={stateTone[c.state]}>{c.state.replace("_", " ")}</Badge>
                        </td>
                        <td className="py-3 text-[var(--muted)]">{c.evidence ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {claims.length === 0 && (
                  <p className="py-6 text-center text-sm text-[var(--muted)]">No claims match this filter.</p>
                )}
              </div>
            </Card>

          </>
        )}
      </div>
    </AppShell>
  );
}
