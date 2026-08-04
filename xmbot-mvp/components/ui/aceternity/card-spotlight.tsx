import { cn } from "@/lib/cn"

export function CardSpotlight({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        // Gold is scarce by design — a neutral hover here, not gold on
        // every card. Reserve gold for deliberately-chosen moments (a
        // featured tier, a primary CTA), not a uniform default state.
        "relative overflow-hidden rounded-xl border border-border bg-foreground/[0.03] transition-colors duration-200 hover:border-foreground/20 hover:bg-foreground/[0.05]",
        className
      )}
    >
      {children}
    </div>
  )
}
