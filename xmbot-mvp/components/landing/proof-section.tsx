"use client"

import { useEffect, useRef, useState } from "react"

function AnimatedNumber({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [current, setCurrent] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          const duration = 2000
          const start = Date.now()
          const animate = () => {
            const elapsed = Date.now() - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCurrent(eased * target)
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, hasAnimated])

  return (
    <div ref={ref} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white font-mono tracking-tight">
      {prefix}{target % 1 === 0 ? Math.round(current) : current.toFixed(1)}{suffix}
    </div>
  )
}

export function ProofSection() {
  return (
    <section id="results" className="py-24 sm:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-emerald-500/[0.03] to-background" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs text-muted-foreground mb-6 uppercase tracking-wider">
            Backtested Results
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            Numbers That
            <br />
            <span className="text-gradient">Speak for Themselves</span>
          </h2>
          <p className="mt-6 text-lg text-slate-400 leading-relaxed">
            Validated on 6 months of XAUUSD M5 data with walk-forward analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Win Rate */}
          <div className="relative p-8 rounded-2xl border border-border/60 bg-card/40 text-center group hover:border-emerald-500/30 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                <svg className="h-7 w-7 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <AnimatedNumber target={64} suffix="%" />
              <div className="mt-3 text-sm font-medium text-slate-300">Win Rate</div>
              <div className="mt-1 text-xs text-slate-500">1,083 trades validated</div>
            </div>
          </div>

          {/* Return */}
          <div className="relative p-8 rounded-2xl border border-border/60 bg-card/40 text-center group hover:border-emerald-500/30 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                <svg className="h-7 w-7 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="17 6 23 6 23 12" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <AnimatedNumber target={84.3} prefix="+" suffix="%" />
              <div className="mt-3 text-sm font-medium text-slate-300">6-Month Return</div>
              <div className="mt-1 text-xs text-slate-500">On $10,000 initial capital</div>
            </div>
          </div>

          {/* Max Drawdown */}
          <div className="relative p-8 rounded-2xl border border-border/60 bg-card/40 text-center group hover:border-emerald-500/30 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                <svg className="h-7 w-7 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <AnimatedNumber target={4.3} suffix="%" />
              <div className="mt-3 text-sm font-medium text-slate-300">Max Drawdown</div>
              <div className="mt-1 text-xs text-slate-500">Risk-managed throughout</div>
            </div>
          </div>

          {/* Profit Factor */}
          <div className="relative p-8 rounded-2xl border border-border/60 bg-card/40 text-center group hover:border-emerald-500/30 transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                <svg className="h-7 w-7 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" strokeLinecap="round"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <AnimatedNumber target={2.1} prefix="" suffix="x" />
              <div className="mt-3 text-sm font-medium text-slate-300">Profit Factor</div>
              <div className="mt-1 text-xs text-slate-500">Gross profit / gross loss</div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-10 max-w-lg mx-auto">
          * Past performance does not guarantee future results. Trading involves significant risk of loss.
          Results based on backtested data from Jul–Dec 2025.
        </p>
      </div>
    </section>
  )
}
