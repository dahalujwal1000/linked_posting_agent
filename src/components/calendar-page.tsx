"use client";

import { useState } from "react";
import { CalendarX, CaretLeft, CaretRight, Clock } from "@phosphor-icons/react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockSettings, mockSchedules } from "@/lib/mock-data";
import type { ScheduleStatus, ScheduledPost } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const TIME_SLOTS = ["04:15", "09:00", "13:30", "18:45", "21:00"];

const statusTone: Record<ScheduleStatus, "accent" | "success" | "neutral" | "warning" | "danger"> = {
  pending: "accent",
  processing: "warning",
  published: "success",
  failed: "danger",
  cancelled: "neutral",
};

/** Returns a YYYY-MM-DD key for the given instant in the configured timezone. */
function dateKeyInZone(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

function timeInZone(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
}

/** Builds a padded month grid of date keys, with nulls for the leading and trailing gaps. */
function buildMonth(year: number, month: number) {
  const cells: (string | null)[] = [];
  const lead = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  for (let i = 0; i < lead; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function CalendarPage() {
  const timezone = mockSettings.timezone;
  const [schedules, setSchedules] = useState<ScheduledPost[]>(mockSchedules);
  const initial = dateKeyInZone(mockSchedules[0].scheduledFor, timezone).split("-");
  const [cursor, setCursor] = useState({ year: Number(initial[0]), month: Number(initial[1]) - 1 });

  const days = buildMonth(cursor.year, cursor.month);
  const byDay = new Map<string, ScheduledPost[]>();
  for (const s of schedules) {
    const key = dateKeyInZone(s.scheduledFor, timezone);
    byDay.set(key, [...(byDay.get(key) ?? []), s]);
  }

  const upcoming = [...schedules].sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));

  function shiftMonth(delta: number) {
    setCursor((prev) => {
      const next = prev.month + delta;
      if (next < 0) return { year: prev.year - 1, month: 11 };
      if (next > 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: next };
    });
  }

  function reschedule(id: string, slot: string) {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, scheduledFor: `${dateKeyInZone(s.scheduledFor, timezone)}T${slot}:00Z`, status: "pending" } : s)),
    );
    toast.success(`Rescheduled for ${slot} (${timezone}).`);
  }

  function cancel(id: string) {
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, status: "cancelled" } : s)));
    toast.success("Schedule cancelled.");
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-7">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Calendar</h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
              Everything queued for publishing, shown in {timezone} regardless of where you are.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => shiftMonth(-1)} aria-label="Previous month">
              <CaretLeft size={16} />
            </Button>
            <span className="min-w-40 text-center text-sm font-semibold">
              {MONTHS[cursor.month]} {cursor.year}
            </span>
            <Button variant="outline" onClick={() => shiftMonth(1)} aria-label="Next month">
              <CaretRight size={16} />
            </Button>
          </div>
        </div>

        <Card className="p-3 sm:p-4">
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-[var(--muted)]">{d}</div>
            ))}
            {days.map((key, i) => (
              <div
                key={key ?? `empty-${i}`}
                className={cn("min-h-24 rounded-lg border p-1.5", key ? "bg-[var(--panel)]" : "border-transparent")}
              >
                {key && (
                  <>
                    <span className="text-xs font-semibold">{Number(key.slice(8))}</span>
                    <div className="mt-1 space-y-1">
                      {(byDay.get(key) ?? []).map((s) => (
                        <div
                          key={s.id}
                          title={s.draftTitle}
                          className={cn(
                            "truncate rounded px-1 py-0.5 text-[10px] font-medium",
                            s.status === "failed"
                              ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                              : s.status === "published"
                                ? "bg-black/[.06] text-[var(--muted)] dark:bg-white/[.08]"
                                : s.status === "cancelled"
                                  ? "bg-black/[.04] text-[var(--muted)] line-through dark:bg-white/[.05]"
                                  : "bg-[var(--accent)]/10 text-[var(--accent)]",
                          )}
                        >
                          {timeInZone(s.scheduledFor, timezone)} {s.draftTitle}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Queue ({upcoming.filter((s) => s.status !== "published" && s.status !== "cancelled").length} active)</h3>
          {upcoming.map((s) => (
            <Card key={s.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                  <Badge tone={statusTone[s.status]}>{s.status}</Badge>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={13} /> {formatDate(s.scheduledFor)}
                  </span>
                  <span>{timezone}</span>
                </div>
                <p className="mt-1.5 font-semibold">{s.draftTitle}</p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Select value={timeInZone(s.scheduledFor, timezone)} onValueChange={(slot) => reschedule(s.id, slot)}>
                  <SelectTrigger className="w-32" aria-label={`Reschedule ${s.draftTitle}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((slot) => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" onClick={() => cancel(s.id)} disabled={s.status === "cancelled" || s.status === "published"}>
                  <CalendarX size={16} /> Cancel
                </Button>
              </div>
            </Card>
          ))}
        </div>

      </div>
    </AppShell>
  );
}
