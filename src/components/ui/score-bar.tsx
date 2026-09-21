"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function ScoreBar({ label, value, hint, className }: { label: string; value: number; hint?: string; className?: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  const labelNode = hint ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help underline decoration-dotted underline-offset-2">{label}</span>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  ) : (
    label
  );

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-[var(--muted)]">{labelNode}</span>
        <span className="font-semibold tabular-nums">{clamped}</span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 w-full overflow-hidden rounded-full bg-black/[.07] dark:bg-white/[.09]"
      >
        <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

