"use client"

import { useState } from "react"
import { cn } from "@/lib/cn"

export function ExpandableCard({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div
      className={cn(
        "border-b border-border last:border-0",
        className
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-5 text-left group"
        aria-expanded={isOpen}
      >
        <span className="text-base font-medium text-foreground group-hover:text-gold-600 transition-colors pr-4">
          {title}
        </span>
        <div
          className={cn(
            "h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform duration-300",
            isOpen ? "rotate-180" : ""
          )}
        >
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-96 pb-5 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
      </div>
    </div>
  )
}
