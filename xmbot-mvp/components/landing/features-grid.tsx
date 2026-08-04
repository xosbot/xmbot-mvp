"use client"

import { Brain, Users, Shield, BarChart3, Bell, Bot, Layers, Zap } from "lucide-react"
import { ScrollReveal, StaggerChildren, StaggerItem } from "./scroll-reveal"
import { GlareCard } from "@/components/ui/aceternity/glare-card"
import { Spotlight } from "@/components/ui/aceternity/spotlight"

const features = [
  {
    icon: Brain,
    title: "Multi-Agent AI",
    description: "Technical Analysis Agent scans XAUUSD M5 with RSI + Supertrend + ADX. AI validates via Gemini/Claude.",
    color: "gold" as const,
    featured: true,
  },
  {
    icon: Users,
    title: "Human-in-the-Loop",
    description: "Every signal requires your approval. Review on Telegram, approve with one tap. No auto-execution.",
    color: "neutral" as const,
    featured: true,
  },
  {
    icon: Shield,
    title: "Risk Engine",
    description: "2% max risk per trade. Daily loss limits. Max drawdown protection. Position sizing enforced.",
    color: "neutral" as const,
    featured: false,
  },
  {
    icon: BarChart3,
    title: "Backtested",
    description: "64% win rate. +84.3% return. 4.3% max drawdown. Walk-forward validated on unseen data.",
    color: "emerald" as const,
    featured: false,
  },
  {
    icon: Bell,
    title: "Telegram Alerts",
    description: "Signal cards with Approve/Reject buttons. Trade alerts. P&L summaries. Everything in your pocket.",
    color: "neutral" as const,
    featured: false,
  },
  {
    icon: Bot,
    title: "Live Dashboard",
    description: "Real-time positions, P&L tracking, signal history, engine status. Monitor from any device.",
    color: "neutral" as const,
    featured: false,
  },
  {
    icon: Layers,
    title: "Multi-Broker",
    description: "Paper Trading for testing. Binance for live crypto trading. MetaTrader 5 and Interactive Brokers coming soon.",
    color: "neutral" as const,
    featured: false,
  },
  {
    icon: Zap,
    title: "24/5 Execution",
    description: "Engine runs around the clock during market hours. No emotions, no FOMO. Just the system.",
    color: "neutral" as const,
    featured: false,
  },
]

function iconBoxClasses(color: "gold" | "emerald" | "neutral", hoverable = false) {
  if (color === "emerald") {
    return hoverable
      ? "bg-emerald-500/10 group-hover:bg-emerald-500/20"
      : "bg-emerald-500/10"
  }
  if (color === "gold") {
    return hoverable
      ? "bg-gold-500/10 group-hover:bg-gold-500/20"
      : "bg-gold-500/10"
  }
  return hoverable
    ? "bg-card border border-border group-hover:border-foreground/20"
    : "bg-card border border-border"
}

function iconClasses(color: "gold" | "emerald" | "neutral") {
  if (color === "emerald") return "text-emerald-400"
  if (color === "gold") return "text-gold-400"
  return "text-foreground/70"
}

function spotlightFill(color: "gold" | "emerald" | "neutral", strong = false) {
  if (color === "emerald") return strong ? "rgba(16, 185, 129, 0.08)" : "rgba(16, 185, 129, 0.06)"
  if (color === "gold") return strong ? "rgba(184, 135, 63, 0.08)" : "rgba(184, 135, 63, 0.06)"
  return strong ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.03)"
}

export function FeaturesGrid() {
  return (
    <section id="features" className="py-24 sm:py-32 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 rounded-sm border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs mono-label text-gold-400 mb-6">
              // Platform
            </div>
            <h2 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-medium text-foreground tracking-tight">
              Simple to Use.
              <br />
              <span className="text-gradient-gold">Serious Underneath.</span>
            </h2>
            <p className="mt-6 text-lg text-stone-400 leading-relaxed">
              Everything you need to run a disciplined, automated gold trading operation — without ever opening a terminal yourself.
            </p>
          </div>
        </ScrollReveal>

        {/* Featured row: 2 large cards */}
        <StaggerChildren className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6" staggerDelay={0.1}>
          {features.filter(f => f.featured).map((f) => (
            <StaggerItem key={f.title}>
              <Spotlight className="rounded-xl" fill={spotlightFill(f.color, true)}>
                <GlareCard className="p-8 h-full">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${iconBoxClasses(f.color)}`}>
                    <f.icon className={`h-7 w-7 ${iconClasses(f.color)}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{f.title}</h3>
                  <p className="text-sm text-stone-400 leading-relaxed">{f.description}</p>
                </GlareCard>
              </Spotlight>
            </StaggerItem>
          ))}
        </StaggerChildren>

        {/* Standard row: 6 cards in 3-col */}
        <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" staggerDelay={0.08}>
          {features.filter(f => !f.featured).map((f) => (
            <StaggerItem key={f.title}>
              <Spotlight className="rounded-xl" fill={spotlightFill(f.color)}>
                <div className="p-6 rounded-xl border border-foreground/10 bg-foreground/[0.03] hover:bg-foreground/[0.05] hover:border-foreground/20 transition-colors duration-200 group h-full">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors duration-300 ${iconBoxClasses(f.color, true)}`}>
                    <f.icon className={`h-6 w-6 ${iconClasses(f.color)}`} />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-stone-400 leading-relaxed">{f.description}</p>
                </div>
              </Spotlight>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  )
}
