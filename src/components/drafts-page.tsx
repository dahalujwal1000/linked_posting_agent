"use client";

import { useState } from "react";
import { ArrowSquareOut, ArrowsClockwise, Check, Copy, Prohibit } from "@phosphor-icons/react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockDrafts } from "@/lib/mock-data";
import type { Draft, DraftStatus, DraftVersion, DraftVersionType } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const LINKEDIN_LIMIT = 3000;

const statusTone: Record<DraftStatus, "accent" | "success" | "neutral" | "warning" | "danger"> = {
  awaiting_review: "warning",
  approved: "success",
  rejected: "danger",
  scheduled: "accent",
  published: "neutral",
};

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>(mockDrafts);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function setStatus(id: string, status: DraftStatus, message: string) {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
    toast.success(message);
  }

  function editVersion(id: string, versionType: DraftVersionType, content: string) {
    setDrafts((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, versions: d.versions.map((v) => (v.versionType === versionType ? { ...v, content } : v)) }
          : d,
      ),
    );
  }

  function regenerate(draft: Draft) {
    toast.info(`Regeneration queued for "${draft.title}".`, {
      description: "Fixture data is in use, so the versions will not change yet.",
    });
  }

  async function copy(draft: Draft, version: DraftVersion) {
    await navigator.clipboard.writeText(`${draft.title}\n\n${version.content}`);
    setCopiedId(`${draft.id}-${version.versionType}`);
    toast.success("Post copied to clipboard.");
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-7">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Drafts</h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
            Every draft carries three source-grounded versions. Compare them, edit the text, then copy the one you
            want into LinkedIn.
          </p>
        </div>

        <div className="space-y-4">
          {drafts.map((d) => (
            <Card key={d.id} className="overflow-hidden">
              <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                    <Badge tone={statusTone[d.status]}>{d.status.replace("_", " ")}</Badge>
                    <span>Quality {d.qualityScore}</span>
                    <span>{d.provider} · {d.model}</span>
                    <span>{formatDate(d.createdAt)}</span>
                  </div>
                  <p className="mt-2 font-semibold">{d.title}</p>
                  <a
                    href={d.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--accent)]"
                  >
                    Source: {d.sourceTitle}
                    <ArrowSquareOut size={13} />
                  </a>
                </div>
                <Button variant="outline" onClick={() => regenerate(d)} className="shrink-0">
                  <ArrowsClockwise size={16} /> Regenerate
                </Button>
              </div>

              {d.warnings.length > 0 && (
                <ul className="space-y-1 border-b bg-amber-50 px-5 py-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
                  {d.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}

              <div className="p-4 sm:p-5">
                <Tabs defaultValue="educational">
                  <TabsList>
                    {d.versions.map((v) => (
                      <TabsTrigger key={v.versionType} value={v.versionType}>{v.versionType}</TabsTrigger>
                    ))}
                  </TabsList>

                  {d.versions.map((v) => {
                    const key = `${d.id}-${v.versionType}`;
                    return (
                      <TabsContent key={v.versionType} value={v.versionType} className="space-y-3">
                        <textarea
                          value={v.content}
                          onChange={(e) => editVersion(d.id, v.versionType, e.target.value)}
                          rows={12}
                          aria-label={`${v.versionType} version`}
                          className="w-full resize-y rounded-lg border bg-black/[.03] p-4 text-sm leading-6 outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)] dark:bg-white/[.04]"
                        />
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={cn("text-xs", v.content.length > LINKEDIN_LIMIT ? "font-semibold text-red-600" : "text-[var(--muted)]")}>
                            {v.content.length} / {LINKEDIN_LIMIT} characters
                          </span>
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" onClick={() => copy(d, v)}>
                              {copiedId === key ? <Check size={16} /> : <Copy size={16} />}
                              {copiedId === key ? "Copied!" : "Copy post"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setStatus(d.id, "approved", "Draft approved.")}
                              disabled={d.status === "approved"}
                            >
                              <Check size={16} /> Approve
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => setStatus(d.id, "rejected", "Draft rejected.")}
                              disabled={d.status === "rejected"}
                            >
                              <Prohibit size={16} /> Reject
                            </Button>
                          </div>
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </div>
            </Card>
          ))}

        </div>
      </div>
    </AppShell>
  );
}
