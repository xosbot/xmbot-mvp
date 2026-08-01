"use client"

import { useEffect, useRef, useState } from "react"
import { ScrollReveal, StaggerChildren, StaggerItem } from "./scroll-reveal"
import { CardSpotlight } from "@/components/ui/aceternity/card-spotlight"
import { GlareCard } from "@/components/ui/aceternity/glare-card"

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
    <div ref={ref} className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white font-mono tracking-tight">
      {prefix}{target % 1 === 0 ? Math.round(current) : current.toFixed(1)}{suffix}
    </div>
  )
}

export function ProofSection() {
  return (
    <section id="results" className="py-24 sm:py-32 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 rounded-sm border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs mono-label text-gold-400 mb-6">
              // Backtested Results
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-aggressive">
              Simple Doesn&apos;t Mean
              <br />
              <span className="text-gradient-emerald">Unproven</span>
            </h2>
            <p className="mt-6 text-lg text-slate-400 leading-relaxed">
              Validated on 6 months of XAUUSD M5 data with walk-forward analysis — before it ever touched real money.
            </p>
          </div>
        </ScrollReveal>

        <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.1}>
          {[
            { icon: "✓", value: 64, suffix: "%", label: "Win Rate", sub: "1,083 trades validated" },
            { icon: "↗", value: 84.3, prefix: "+", suffix: "%", label: "6-Month Return", sub: "On $10,000 initial capital" },
            { icon: "🛡", value: 4.3, suffix: "%", label: "Max Drawdown", sub: "Risk-managed throughout" },
            { icon: "$", value: 2.1, suffix: "x", label: "Profit Factor", sub: "Gross profit / gross loss" },
          ].map((stat, i) => (
            <StaggerItem key={stat.label}>
              {i === 1 ? (
                <GlareCard className="p-8 text-center h-full">
                  <div className="w-16 h-16 rounded-md mx-auto mb-6 flex items-center justify-center bg-emerald-500/10 text-2xl">
                    {stat.icon}
                  </div>
                  <AnimatedNumber target={stat.value} prefix={stat.prefix || ""} suffix={stat.suffix} />
                  <div className="mt-3 text-sm font-medium text-slate-300">{stat.label}</div>
                  <div className="mt-1 text-xs text-slate-500">{stat.sub}</div>
                </GlareCard>
              ) : (
                <CardSpotlight className="p-8 text-center h-full">
                  <div className="w-16 h-16 rounded-md mx-auto mb-6 flex items-center justify-center bg-emerald-500/10 text-2xl">
                    {stat.icon}
                  </div>
                  <AnimatedNumber target={stat.value} prefix={stat.prefix || ""} suffix={stat.suffix} />
                  <div className="mt-3 text-sm font-medium text-slate-300">{stat.label}</div>
                  <div className="mt-1 text-xs text-slate-500">{stat.sub}</div>
                </CardSpotlight>
              )}
            </StaggerItem>
          ))}
        </StaggerChildren>

        <p className="text-center text-xs text-slate-600 mt-10 max-w-lg mx-auto">
          * Past performance does not guarantee future results. Trading involves significant risk of loss.
          Results based on backtested data from Jul–Dec 2025.
        </p>
      </div>
    </section>
  )
}
