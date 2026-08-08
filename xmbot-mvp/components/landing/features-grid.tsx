"use client"

import { Brain, Users, Shield, BarChart3, Bell, Bot, Layers, Zap, Globe, TrendingUp } from "lucide-react"
import { ScrollReveal, StaggerChildren, StaggerItem } from "./scroll-reveal"
import { GlareCard } from "@/components/ui/aceternity/glare-card"
import { Spotlight } from "@/components/ui/aceternity/spotlight"

const features = [
  {
    icon: Brain,
    title: "Multi-Agent AI Analysis",
    description: "Five specialized agents scan gold and crypto 24/5. Gemini and Claude validate every signal. You get only high-probability setups.",
    color: "gold" as const,
    featured: true,
  },
  {
    icon: Users,
    title: "You Stay in Control",
    description: "Every trade requires your approval. Signal lands on Telegram, you tap Approve or Reject. No auto-execution. Ever. Your money, your decisions.",
    color: "neutral" as const,
    featured: true,
  },
  {
    icon: Globe,
    title: "Gold Today, More Markets Ahead",
    description: "XAUUSD gold and crypto are live now. Stocks (NSE/BSE, NYSE/NASDAQ), forex, and mutual funds are on the roadmap.",
    color: "gold" as const,
    featured: false,
  },
  {
    icon: Shield,
    title: "Risk is Baked In",
    description: "2% max risk per trade. Daily loss limits. Max drawdown protection. Per-user position limits enforced automatically.",
    color: "neutral" as const,
    featured: false,
  },
  {
    icon: TrendingUp,
    title: "Investment Advisory (Roadmap)",
    description: "Beyond trading — portfolio review, MF recommendations, stock picks, tax optimization. Planned, not yet built.",
    color: "emerald" as const,
    featured: false,
  },
  {
    icon: BarChart3,
    title: "Backtested Results",
    description: "64% win rate. +84.3% return. 4.3% max drawdown. Backtested on 6 months of PAXG/USDT data with walk-forward analysis — not live trading results.",
    color: "emerald" as const,
    featured: false,
  },
  {
    icon: Bell,
    title: "Instant Alerts",
    description: "Signal cards with entry, SL, TP, and AI analysis land in your pocket. Review in 12 seconds, approve with one tap.",
    color: "neutral" as const,
    featured: false,
  },
  {
    icon: Bot,
    title: "Real-Time Dashboard",
    description: "Watch positions, P&L, portfolio allocation, and signal history live. Monitor from any device. Monthly reports keep you honest.",
    color: "neutral" as const,
    featured: false,
  },
  {
    icon: Layers,
    title: "Multi-Broker Support",
    description: "Paper trading and Binance are live today. Zerodha, Interactive Brokers, and MT5 are on the roadmap.",
    color: "neutral" as const,
    featured: false,
  },
]

function iconBoxClasses(color: "gold" | "emerald" | "neutral", hoverable = false) {
  if (color === "emerald") {
    return hoverable
      ? "bg-emerald-500/10 group-hover:bg-emerald-500/15"
      : "bg-emerald-500/10"
  }
  if (color === "gold") {
    return hoverable
      ? "bg-gold-500/10 group-hover:bg-gold-500/15"
      : "bg-gold-500/10"
  }
  return hoverable
    ? "bg-accent border border-border group-hover:border-gold-200"
    : "bg-accent border border-border"
}

function iconClasses(color: "gold" | "emerald" | "neutral") {
  if (color === "emerald") return "text-emerald-600"
  if (color === "gold") return "text-gold-600"
  return "text-muted-foreground"
}

function spotlightFill(color: "gold" | "emerald" | "neutral", strong = false) {
  if (color === "emerald") return strong ? "rgba(16, 185, 129, 0.06)" : "rgba(16, 185, 129, 0.04)"
  if (color === "gold") return strong ? "rgba(184, 135, 63, 0.06)" : "rgba(184, 135, 63, 0.04)"
  return strong ? "rgba(0, 0, 0, 0.02)" : "rgba(0, 0, 0, 0.015)"
}

export function FeaturesGrid() {
  return (
    <section id="features" className="py-24 sm:py-32 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 rounded-sm border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs mono-label text-gold-700 mb-6">
              // Why XMOne
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium text-foreground tracking-tight">
              Investing Shouldn&apos;t Be
              <br />
              <span className="text-gradient-gold">A Full-Time Job.</span>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              XMOne handles the gold analysis. You handle the decisions.
              That&apos;s how disciplined trading works.
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
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </GlareCard>
              </Spotlight>
            </StaggerItem>
          ))}
        </StaggerChildren>

        {/* Standard row: 7 cards in 3-col */}
        <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" staggerDelay={0.08}>
          {features.filter(f => !f.featured).map((f) => (
            <StaggerItem key={f.title}>
              <Spotlight className="rounded-xl" fill={spotlightFill(f.color)}>
                <div className="p-6 rounded-xl border border-border bg-card hover:bg-accent hover:border-gold-200 transition-colors duration-200 group h-full">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors duration-300 ${iconBoxClasses(f.color, true)}`}>
                    <f.icon className={`h-6 w-6 ${iconClasses(f.color)}`} />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              </Spotlight>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  )
}
