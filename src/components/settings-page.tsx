"use client";

import { useState } from "react";
import { FloppyDisk, Minus, PauseCircle, Plus, X } from "@phosphor-icons/react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockSettings, mockSources } from "@/lib/mock-data";
import type { Pillar, Source, UserSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

const PILLARS: Pillar[] = ["projects", "education", "industry", "career"];
const SCORE_KEYS = ["relevance", "freshness", "value", "discussion", "credibility"] as const;
const TIMEZONES = ["Asia/Kathmandu", "Asia/Kolkata", "UTC", "Europe/London", "America/New_York"];

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="space-y-4 p-4 sm:p-5">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="mt-1 text-xs text-[var(--muted)]">{description}</p>}
      </div>
      {children}
    </Card>
  );
}

function Stepper({ label, value, onChange, step = 5, min = 0, max = 100, suffix = "%" }: {
  label: string; value: number; onChange: (next: number) => void; step?: number; min?: number; max?: number; suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
      <span className="text-sm capitalize">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(Math.max(min, value - step))}
          className="grid size-7 place-items-center rounded-md border hover:bg-black/5 dark:hover:bg-white/5"
        >
          <Minus size={13} weight="bold" />
        </button>
        <span className="w-12 text-center text-sm font-semibold tabular-nums">{value}{suffix}</span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(Math.min(max, value + step))}
          className="grid size-7 place-items-center rounded-md border hover:bg-black/5 dark:hover:bg-white/5"
        >
          <Plus size={13} weight="bold" />
        </button>
      </div>
    </div>
  );
}

function Switch({ checked, onChange, label, danger = false }: {
  checked: boolean; onChange: (next: boolean) => void; label: string; danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition",
        checked ? (danger ? "bg-red-600" : "bg-[var(--accent)]") : "bg-black/15 dark:bg-white/20",
      )}
    >
      <span className={cn("absolute top-0.5 size-5 rounded-full bg-white transition-all", checked ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

function Toggle({ label, description, checked, onChange, danger = false }: {
  label: string; description?: string; checked: boolean; onChange: (next: boolean) => void; danger?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="mt-0.5 text-xs text-[var(--muted)]">{description}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} label={label} danger={danger} />
    </div>
  );
}

function Chips({ items, onRemove }: { items: string[]; onRemove: (item: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="inline-flex items-center gap-1.5 rounded-full bg-black/[.06] px-2.5 py-1 text-xs font-medium dark:bg-white/[.08]">
          {item}
          <button type="button" aria-label={`Remove ${item}`} onClick={() => onRemove(item)} className="text-[var(--muted)] hover:text-red-600">
            <X size={12} weight="bold" />
          </button>
        </span>
      ))}
      {items.length === 0 && <span className="text-xs text-[var(--muted)]">Nothing here yet.</span>}
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(mockSettings);
  const [sources, setSources] = useState<Source[]>(mockSources);
  const [topicDraft, setTopicDraft] = useState("");
  const [blockedDraft, setBlockedDraft] = useState("");
  const [allowedDraft, setAllowedDraft] = useState("");

  const scoreTotal = SCORE_KEYS.reduce((sum, key) => sum + settings.scoringWeights[key], 0);
  const scoreValid = scoreTotal === 100;
  const pillarTotal = PILLARS.reduce((sum, p) => sum + settings.pillarWeights[p], 0);

  function patch(next: Partial<UserSettings>) {
    setSettings((prev) => ({ ...prev, ...next }));
  }

  function save() {
    if (!scoreValid) {
      toast.error(`Scoring weights must total 100. They currently total ${scoreTotal}.`);
      return;
    }
    toast.success("Settings saved locally.", { description: "Persistence arrives with the data layer." });
  }

  function togglePause() {
    const next = !settings.paused;
    patch({ paused: next });
    if (next) toast.warning("Agent paused. Scheduled runs will be skipped.");
    else toast.success("Agent resumed.");
  }

  function addValue(list: string[], value: string) {
    const trimmed = value.trim();
    return trimmed && !list.includes(trimmed) ? [...list, trimmed] : list;
  }

  function toggleSource(id: string) {
    setSources((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-7">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
              Scoring, sources, and publishing preferences. The agent reads all of these before it runs.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={settings.paused ? "danger" : "outline"} onClick={togglePause}>
              <PauseCircle size={16} /> {settings.paused ? "Resume agent" : "Pause agent"}
            </Button>
            <Button onClick={save}>
              <FloppyDisk size={16} /> Save
            </Button>
          </div>
        </div>

        {settings.paused && (
          <Card className="border-red-200 bg-red-50 p-4 text-sm dark:border-red-900 dark:bg-red-950/30">
            <p className="font-semibold">The agent is paused.</p>
            <p className="mt-1 text-[var(--muted)]">Discovery and publishing runs will be skipped until you resume.</p>
          </Card>
        )}

        <Section title="Topics" description="The subject areas discovery should favour.">
          <Chips items={settings.topics} onRemove={(t) => patch({ topics: settings.topics.filter((x) => x !== t) })} />
          <div className="flex gap-2">
            <input
              value={topicDraft}
              onChange={(e) => setTopicDraft(e.target.value)}
              placeholder="Add a topic"
              className="min-h-10 flex-1 rounded-lg border bg-[var(--panel)] px-3 text-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
            />
            <Button
              variant="outline"
              onClick={() => {
                patch({ topics: addValue(settings.topics, topicDraft) });
                setTopicDraft("");
              }}
            >
              <Plus size={16} /> Add
            </Button>
          </div>
        </Section>

        <Section
          title="Scoring weights"
          description="Used to rank every candidate. They must total exactly 100, matching the scoring function's own check."
        >
          <div className="flex items-center gap-2">
            <Badge tone={scoreValid ? "success" : "danger"}>Total {scoreTotal}%</Badge>
            <span className="text-xs text-[var(--muted)]">
              {scoreValid ? "Balanced." : `Adjust by ${100 - scoreTotal > 0 ? "+" : ""}${100 - scoreTotal}% to save.`}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {SCORE_KEYS.map((key) => (
              <Stepper
                key={key}
                label={key}
                value={settings.scoringWeights[key]}
                onChange={(next) => patch({ scoringWeights: { ...settings.scoringWeights, [key]: next } })}
              />
            ))}
          </div>
        </Section>

        <Section title="Pillar weights" description="How the content mix should split across the four pillars.">
          <div className="flex items-center gap-2">
            <Badge tone={pillarTotal === 100 ? "success" : "warning"}>Total {pillarTotal}%</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {PILLARS.map((pillar) => (
              <Stepper
                key={pillar}
                label={pillar}
                value={settings.pillarWeights[pillar]}
                onChange={(next) => patch({ pillarWeights: { ...settings.pillarWeights, [pillar]: next } })}
              />
            ))}
          </div>
        </Section>

        <Section title="Sources" description="Where discovery pulls from. Disabled sources are skipped entirely.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-[var(--muted)]">
                <tr className="border-b">
                  <th className="py-2 pr-4 font-semibold">Source</th>
                  <th className="py-2 pr-4 font-semibold">Kind</th>
                  <th className="py-2 pr-4 font-semibold">Credibility</th>
                  <th className="py-2 font-semibold">Enabled</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium">{s.name}</p>
                      <p className="max-w-[16rem] truncate text-xs text-[var(--muted)]">{s.url}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge tone="accent">{s.kind}</Badge>
                    </td>
                    <td className="py-3 pr-4 tabular-nums">{s.credibilityScore}</td>
                    <td className="py-3">
                      <Switch
                        label={`Enable ${s.name}`}
                        checked={s.enabled}
                        onChange={() => toggleSource(s.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[var(--muted)]">
            {sources.filter((s) => s.enabled).length} of {sources.length} sources enabled.
          </p>
        </Section>

        <Section title="Domain rules" description="Blocked domains are never fetched. Allowed domains bypass the blocklist.">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Blocked</p>
              <div className="mt-2">
                <Chips
                  items={settings.blockedDomains}
                  onRemove={(d) => patch({ blockedDomains: settings.blockedDomains.filter((x) => x !== d) })}
                />
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  value={blockedDraft}
                  onChange={(e) => setBlockedDraft(e.target.value)}
                  placeholder="add-blocked.example"
                  className="min-h-10 flex-1 rounded-lg border bg-[var(--panel)] px-3 text-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    patch({ blockedDomains: addValue(settings.blockedDomains, blockedDraft) });
                    setBlockedDraft("");
                  }}
                >
                  <Plus size={16} /> Block
                </Button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Allowed</p>
              <div className="mt-2">
                <Chips
                  items={settings.allowedDomains}
                  onRemove={(d) => patch({ allowedDomains: settings.allowedDomains.filter((x) => x !== d) })}
                />
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  value={allowedDraft}
                  onChange={(e) => setAllowedDraft(e.target.value)}
                  placeholder="trusted-source.example"
                  className="min-h-10 flex-1 rounded-lg border bg-[var(--panel)] px-3 text-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    patch({ allowedDomains: addValue(settings.allowedDomains, allowedDraft) });
                    setAllowedDraft("");
                  }}
                >
                  <Plus size={16} /> Allow
                </Button>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Writing preferences" description="These values are injected into the generation prompt.">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs text-[var(--muted)]">Tone</p>
              <Select value={settings.tone} onValueChange={(tone) => patch({ tone })}>
                <SelectTrigger aria-label="Tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thoughtful and practical">thoughtful and practical</SelectItem>
                  <SelectItem value="concise and direct">concise and direct</SelectItem>
                  <SelectItem value="analytical">analytical</SelectItem>
                  <SelectItem value="conversational">conversational</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="mb-2 text-xs text-[var(--muted)]">Post length</p>
              <Select
                value={settings.postLength}
                onValueChange={(value) => patch({ postLength: value as UserSettings["postLength"] })}
              >
                <SelectTrigger aria-label="Post length">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">short</SelectItem>
                  <SelectItem value="medium">medium</SelectItem>
                  <SelectItem value="long">long</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Stepper
              label="Hashtags"
              suffix=""
              step={1}
              min={0}
              max={5}
              value={settings.hashtagCount}
              onChange={(hashtagCount) => patch({ hashtagCount })}
            />
            <Stepper
              label="Emoji level"
              suffix=""
              step={1}
              min={0}
              max={3}
              value={settings.emojiLevel}
              onChange={(emojiLevel) => patch({ emojiLevel })}
            />
            <Stepper
              label="Max article age"
              suffix="d"
              step={1}
              min={1}
              max={30}
              value={settings.maxArticleAgeDays}
              onChange={(maxArticleAgeDays) => patch({ maxArticleAgeDays })}
            />
          </div>
        </Section>

        <Section title="System" description="Run behaviour, provider order, and the LinkedIn publish flag.">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs text-[var(--muted)]">Timezone</p>
              <Select value={settings.timezone} onValueChange={(timezone) => patch({ timezone })}>
                <SelectTrigger aria-label="Timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="mb-2 text-xs text-[var(--muted)]">Primary provider</p>
              <Select
                value={settings.providerOrder[0] ?? "gemini"}
                onValueChange={(provider) =>
                  patch({ providerOrder: [provider, ...settings.providerOrder.filter((p) => p !== provider)] })
                }
              >
                <SelectTrigger aria-label="Primary provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">gemini</SelectItem>
                  <SelectItem value="openrouter">openrouter</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-[var(--muted)]">
                Fallback order: {settings.providerOrder.slice(1).join(" → ") || "none"}
              </p>
            </div>
          </div>

          <Toggle
            label="Require approval before publishing"
            description="Drafts must be approved before a scheduled publish will run."
            checked={settings.approvalRequired}
            onChange={(approvalRequired) => patch({ approvalRequired })}
          />

          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">LinkedIn API publishing</p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                Feature-flagged off. LinkedIn client credentials are not configured.
              </p>
            </div>
            <Badge tone="neutral">Disabled</Badge>
          </div>
        </Section>

      </div>
    </AppShell>
  );
}

