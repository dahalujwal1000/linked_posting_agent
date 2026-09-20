import { cn } from "@/lib/utils";
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <section className={cn("rounded-xl border bg-[var(--panel)]", className)} {...props} />; }
