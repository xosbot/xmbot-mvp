import { cn } from "@/lib/cn"

export function GlareCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border border-border bg-foreground/[0.03] transition-colors duration-200 hover:border-gold-500/40 hover:bg-foreground/[0.05]",
        className
      )}
    >
      {children}
    </div>
  )
}
