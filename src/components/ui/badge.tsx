import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const styles = cva("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold capitalize", {
  variants: {
    tone: {
      neutral: "bg-black/[.06] text-[var(--muted)] dark:bg-white/[.08]",
      accent: "bg-[var(--accent)]/10 text-[var(--accent)]",
      success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
      warning: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400",
      danger: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export function Badge({ className, tone, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof styles>) {
  return <span className={cn(styles({ tone }), className)} {...props} />;
}
