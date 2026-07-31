"use client"

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
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-gold-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
