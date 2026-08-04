import { cn } from "@/lib/cn"

/**
 * Renders a thin, solid accent stripe along the top edge instead of a
 * mouse-tracking glow — a status-stripe convention borrowed from
 * instrument panels, so `fill` still carries category meaning (gold vs
 * emerald) without the decorative blur.
 */
export function Spotlight({
  children,
  className,
  fill = "rgba(184, 135, 63, 0.12)",
}: {
  children: React.ReactNode
  className?: string
  fill?: string
}) {
  const accent = fill.replace(/[\d.]+\)$/, "0.9)")

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        className="absolute inset-x-0 top-0 h-[2px] z-10 pointer-events-none"
        style={{ background: accent }}
      />
      {children}
    </div>
  )
}
