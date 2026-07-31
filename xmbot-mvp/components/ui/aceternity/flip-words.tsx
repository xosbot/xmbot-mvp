"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/cn"

export function FlipWords({
  words,
  duration = 3000,
  className,
}: {
  words: string[]
  duration?: number
  className?: string
}) {
  const [currentWord, setCurrentWord] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFlipping(true)
      setTimeout(() => {
        setCurrentWord((prev) => (prev + 1) % words.length)
        setIsFlipping(false)
      }, 300)
    }, duration)

    return () => clearInterval(interval)
  }, [duration, words.length])

  return (
    <span
      className={cn(
        "inline-block relative overflow-hidden h-[1.1em] align-bottom",
        className
      )}
    >
      <span
        className={cn(
          "inline-block transition-all duration-300 ease-in-out",
          isFlipping
            ? "opacity-0 -translate-y-full rotate-x-90"
            : "opacity-100 translate-y-0 rotate-x-0"
        )}
      >
        {words[currentWord]}
      </span>
    </span>
  )
}
