"use client"

import { cn } from "@/lib/cn"

export function BentoGrid({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  )
}

export function BentoCard({
  children,
  className,
  span,
}: {
  children: React.ReactNode
  className?: string
  span?: "1" | "2" | "3"
}) {
  const spanClasses = {
    "1": "md:col-span-1",
    "2": "md:col-span-2",
    "3": "md:col-span-3",
  }

  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-white/10 bg-white/5 overflow-hidden transition-all duration-300 hover:border-white/20",
        span && spanClasses[span],
        className
      )}
    >
      {children}
    </div>
  )
}
