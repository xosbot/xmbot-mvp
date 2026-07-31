"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/cn"

export function TextGenerateEffect({
  words,
  className,
  filter = true,
}: {
  words: string
  className?: string
  filter?: boolean
}) {
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const wordsArray = words.split(" ")

  return (
    <span ref={ref} className={cn("inline", className)}>
      {wordsArray.map((word, idx) => (
        <span
          key={idx}
          className={cn(
            "inline-block transition-all duration-500",
            mounted
              ? "opacity-100 blur-0 translate-y-0"
              : "opacity-0 blur-[8px] translate-y-4",
            filter && "blur-[8px]"
          )}
          style={{
            transitionDelay: `${idx * 0.08}s`,
          }}
        >
          {word}&nbsp;
        </span>
      ))}
    </span>
  )
}
