import { cn } from "@/lib/cn"

export function LampEffect({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("relative", className)}>
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-px bg-gold-500/50 pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
