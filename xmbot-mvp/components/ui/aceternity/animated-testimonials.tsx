"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/cn"

export function AnimatedTestimonials({
  testimonials,
  className,
}: {
  testimonials: {
    name: string
    role: string
    content: string
    rating: number
    highlight?: string
  }[]
  className?: string
}) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [testimonials.length])

  return (
    <div className={cn("relative", className)}>
      <div className="relative min-h-[280px]">
        {testimonials.map((testimonial, idx) => (
          <div
            key={idx}
            className={cn(
              "absolute inset-0 transition-all duration-500",
              idx === active
                ? "opacity-100 translate-y-0 scale-100 z-10"
                : idx < active
                ? "opacity-0 -translate-y-4 scale-95 z-0"
                : "opacity-0 translate-y-4 scale-95 z-0"
            )}
          >
            <div className="p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <svg
                    key={i}
                    className="h-4 w-4 fill-yellow-500 text-yellow-500"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                &ldquo;{testimonial.content}&rdquo;
              </p>
              {testimonial.highlight && (
                <div className="mb-6 px-3 py-2 rounded-lg bg-gold-500/10 border border-gold-500/20">
                  <span className="text-xs font-medium text-gold-400">
                    &ldquo;{testimonial.highlight}&rdquo;
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500/20 to-emerald-500/20 flex items-center justify-center text-sm font-bold text-white">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{testimonial.name}</div>
                  <div className="text-xs text-slate-500">{testimonial.role}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-2 mt-6">
        {testimonials.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActive(idx)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              idx === active ? "bg-gold-400 w-6" : "bg-white/20 hover:bg-white/30"
            )}
            aria-label={`Go to testimonial ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
