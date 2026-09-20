import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const styles = cva("inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition active:scale-[.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:pointer-events-none disabled:opacity-50", { variants: { variant: { default: "bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90", outline: "border bg-transparent hover:bg-black/5 dark:hover:bg-white/5", ghost: "hover:bg-black/5 dark:hover:bg-white/5", danger: "bg-red-600 text-white hover:bg-red-700" } }, defaultVariants: { variant: "default" } });
export function Button({ className, variant, asChild, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof styles> & { asChild?: boolean }) { const Comp = asChild ? Slot : "button"; return <Comp className={cn(styles({ variant }), className)} {...props} />; }
