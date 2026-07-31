"use client"

import { cn } from "@/lib/cn"

export function BackgroundGradient({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("relative", className)}>
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-2xl">
        <div className="absolute -inset-[1px] bg-gradient-to-r from-gold-500/20 via-emerald-500/20 to-gold-500/20 blur-sm" />
        <div className="absolute inset-0 bg-black/90" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  )
}
