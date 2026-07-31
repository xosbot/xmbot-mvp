"use client"

import { cn } from "@/lib/cn"

export function MovingBorder({
  children,
  className,
  duration = 4000,
}: {
  children: React.ReactNode
  className?: string
  duration?: number
}) {
  return (
    <div className={cn("relative p-[1px] overflow-hidden rounded-2xl", className)}>
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `conic-gradient(from 0deg, transparent 0%, #10b981 12.5%, transparent 25%, transparent 50%, #8b5cf6 62.5%, transparent 75%)`,
          animation: `spin ${duration}ms linear infinite`,
        }}
      />
      <div className="relative z-10 rounded-2xl bg-black/90 backdrop-blur-xl">
        {children}
      </div>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
