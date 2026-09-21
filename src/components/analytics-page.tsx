"use client";

import { useMemo, useState } from "react";
import { Warning } from "@phosphor-icons/react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockAgentRuns, mockDrafts, mockMetrics, mockProviderUsage, mockPublished, mockSettings } from "@/lib/mock-data";
import type { Pillar } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const PILLARS: Pillar[] = ["projects", "education", "industry", "career"];

/**
 * The reporting window is measured back from the newest fixture record rather than from the wall
 * clock, so the calculation stays pure during render and matches between server and client.
 */
const NEWEST_USAGE_AT = mockProviderUsage.reduce((max, u) => Math.max(max, new Date(u.createdAt).getTime()), 0);

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>}
    </Card>
  );
}

export default function AnalyticsPage() {
  const [windowDays, setWindowDays] = useState("30");

  const usage = useMemo(() => {
    const cutoff = NEWEST_USAGE_AT - Number(windowDays) * 86_400_000;
    const rows = mockProviderUsage.filter((u) => new Date(u.createdAt).getTime() >= cutoff);
    const calls = rows.length;
    const fails = rows.filter((r) => r.errorType).length;
    const latency = calls === 0 ? 0 : Math.round(rows.reduce((sum, r) => sum + r.latencyMs, 0) / calls);
    const tokens = rows.reduce((sum, r) => sum + r.inputTokens + r.outputTokens, 0);
    const retries = rows.reduce((sum, r) => sum + r.retryCount, 0);
    return { rows, calls, fails, latency, tokens, retries };
  }, [windowDays]);

  const publishedCount = mockPublished.length;
  const decided = mockDrafts.filter((d) => d.status === "approved" || d.status === "published").length;
  const approvalRate = Math.round((decided / mockDrafts.length) * 100);
  const candidatesFound = mockAgentRuns.reduce((sum, r) => sum + r.candidatesFound, 0);
  const draftsCreated = mockAgentRuns.reduce((sum, r) => sum + r.draftsCreated, 0);
  const totalImpressions = mockMetrics.reduce((sum, m) => sum + m.impressions, 0);
  const maxPillarWeight = Math.max(...PILLARS.map((p) => mockSettings.pillarWeights[p]), 1);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-7">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Analytics</h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
              Pipeline health and provider cost surface. Numbers come from the run and usage tables.
            </p>
          </div>
          <Select value={windowDays} onValueChange={setWindowDays}>
            <SelectTrigger className="sm:w-40" aria-label="Reporting window">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Candidates found" value={candidatesFound} hint={`${mockAgentRuns.length} agent runs`} />
          <Stat label="Drafts created" value={draftsCreated} hint={`${mockDrafts.length} in the workspace`} />
          <Stat label="Approval rate" value={`${approvalRate}%`} hint={`${decided} of ${mockDrafts.length} drafts moved forward`} />
          <Stat label="Published" value={publishedCount} hint={`${totalImpressions.toLocaleString("en")} impressions recorded`} />
        </div>

        <Card className="p-4 sm:p-5">
          <h3 className="text-sm font-semibold">Pillar distribution</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">How the content mix should split across the four pillars.</p>
          <div className="mt-4 space-y-3">
            {PILLARS.map((pillar) => {
              const weight = mockSettings.pillarWeights[pillar];
              return (
                <div key={pillar} className="flex items-center gap-3">
                  <span className="w-20 text-xs capitalize text-[var(--muted)]">{pillar}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/[.07] dark:bg-white/[.09]">
                    <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${(weight / maxPillarWeight) * 100}%` }} />
                  </div>
                  <span className="w-10 text-right text-xs font-semibold tabular-nums">{weight}%</span>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Provider calls" value={usage.calls} hint={`${usage.fails} returned an error`} />
          <Stat label="Avg latency" value={`${usage.latency}ms`} hint={`Window: last ${windowDays} days`} />
          <Stat label="Retries" value={usage.retries} hint={`${usage.tokens.toLocaleString("en")} tokens used`} />
        </div>

        <Card className="overflow-hidden">
          <div className="border-b p-4 sm:p-5">
            <h3 className="text-sm font-semibold">Provider usage</h3>
          </div>
          <div className="overflow-x-auto p-4 sm:p-5">
            <table className="w-full min-w-[42rem] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-[var(--muted)]">
                <tr className="border-b">
                  <th className="py-2 pr-4 font-semibold">Provider</th>
                  <th className="py-2 pr-4 font-semibold">Model</th>
                  <th className="py-2 pr-4 font-semibold">Operation</th>
                  <th className="py-2 pr-4 font-semibold">Latency</th>
                  <th className="py-2 pr-4 font-semibold">Tokens</th>
                  <th className="py-2 pr-4 font-semibold">Retries</th>
                  <th className="py-2 font-semibold">Error</th>
                </tr>
              </thead>
              <tbody>
                {usage.rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2.5 pr-4">
                      <Badge tone={r.provider === "gemini" ? "accent" : "warning"}>{r.provider}</Badge>
                    </td>
                    <td className="py-2.5 pr-4 text-[var(--muted)]">{r.model}</td>
                    <td className="py-2.5 pr-4">{r.operation}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{r.latencyMs}ms</td>
                    <td className="py-2.5 pr-4 tabular-nums">{(r.inputTokens + r.outputTokens).toLocaleString("en")}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{r.retryCount}</td>
                    <td className="py-2.5 text-[var(--muted)]">{r.errorType ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {usage.rows.length === 0 && (
              <p className="py-6 text-center text-sm text-[var(--muted)]">No provider calls in this window.</p>
            )}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b p-4 sm:p-5">
            <h3 className="text-sm font-semibold">Agent runs</h3>
          </div>
          <ul className="divide-y">
            {mockAgentRuns.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                    <Badge
                      tone={
                        r.status === "completed" ? "success"
                          : r.status === "failed" ? "danger"
                            : r.status === "running" ? "accent" : "neutral"
                      }
                    >
                      {r.status}
                    </Badge>
                    <span className="font-semibold text-[var(--foreground)]">{r.jobType}</span>
                    <span>{formatDate(r.startedAt)}</span>
                  </div>
                  {r.errorMessage && (
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                      <Warning size={13} /> {r.errorMessage}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-[var(--muted)]">
                  {r.candidatesFound} candidates · {r.draftsCreated} drafts
                </span>
              </li>
            ))}
          </ul>
        </Card>

      </div>
    </AppShell>
  );
}
