import { cn } from "@/lib/cn"

export function MovingBorder({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "corner-frame relative overflow-hidden rounded-md border border-gold-500/50 bg-background/90",
        className
      )}
    >
      {children}
    </div>
  )
}
