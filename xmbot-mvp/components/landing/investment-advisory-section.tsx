"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ScrollReveal, StaggerChildren, StaggerItem } from "./scroll-reveal"
import { GlareCard } from "@/components/ui/aceternity/glare-card"
import { Spotlight } from "@/components/ui/aceternity/spotlight"
import { ArrowRight, PieChart, TrendingUp, Shield, Target, BarChart3, Wallet } from "lucide-react"

const advisoryFeatures = [
  {
    icon: PieChart,
    title: "Portfolio Review",
    description: "AI scans your current holdings and suggests optimizations based on your risk profile and goals.",
    color: "gold" as const,
  },
  {
    icon: TrendingUp,
    title: "MF Recommendations",
    description: "Direct plan mutual fund suggestions based on risk appetite, time horizon, and tax planning (India-specific).",
    color: "emerald" as const,
  },
  {
    icon: Target,
    title: "Stock Picks",
    description: "Fundamental + technical analysis combined. AI scores stocks on growth potential, value, and momentum.",
    color: "blue" as const,
  },
  {
    icon: Shield,
    title: "Risk Rebalancing",
    description: "Quarterly portfolio rebalancing suggestions to maintain your target asset allocation and manage drawdowns.",
    color: "orange" as const,
  },
  {
    icon: BarChart3,
    title: "Goal-Based Planning",
    description: "Retirement, education, home purchase — AI builds investment roadmaps aligned to your life goals.",
    color: "purple" as const,
  },
  {
    icon: Wallet,
    title: "Tax Optimization",
    description: "Tax-loss harvesting, LTCG/STCG planning for India. Maximize returns after tax across all instruments.",
    color: "red" as const,
  },
]

function FeatureCard({ feature }: { feature: typeof advisoryFeatures[0] }) {
  const colorMap = {
    gold: { fill: "rgba(184, 135, 63, 0.08)", iconBg: "bg-gold-500/10", iconText: "text-gold-600", border: "border-gold-200" },
    emerald: { fill: "rgba(16, 185, 129, 0.08)", iconBg: "bg-emerald-500/10", iconText: "text-emerald-600", border: "border-emerald-200" },
    blue: { fill: "rgba(59, 130, 246, 0.08)", iconBg: "bg-blue-500/10", iconText: "text-blue-600", border: "border-blue-200" },
    orange: { fill: "rgba(249, 115, 22, 0.08)", iconBg: "bg-orange-500/10", iconText: "text-orange-600", border: "border-orange-200" },
    purple: { fill: "rgba(168, 85, 247, 0.08)", iconBg: "bg-purple-500/10", iconText: "text-purple-600", border: "border-purple-200" },
    red: { fill: "rgba(239, 68, 68, 0.08)", iconBg: "bg-red-500/10", iconText: "text-red-600", border: "border-red-200" },
  }

  const c = colorMap[feature.color]

  return (
    <StaggerItem>
      <Spotlight className="rounded-xl" fill={c.fill}>
        <div className={`p-6 rounded-xl border ${c.border} bg-card hover:shadow-md transition-all duration-300 h-full`}>
          <div className={`w-12 h-12 rounded-xl ${c.iconBg} flex items-center justify-center mb-4`}>
            <feature.icon className={`h-6 w-6 ${c.iconText}`} />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-2">{feature.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
        </div>
      </Spotlight>
    </StaggerItem>
  )
}

export function InvestmentAdvisorySection() {
  return (
    <section id="investing" className="py-24 sm:py-32 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 rounded-sm border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs mono-label text-gold-700 mb-6">
              // Investment Advisory
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium text-foreground tracking-tight">
              More Than Trading.
              <br />
              <span className="text-gradient-gold">Complete Financial Advisory.</span>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              From short-term trades to long-term wealth building — AI guides every decision.
              Your personal financial advisor, powered by six specialized agents.
            </p>
          </div>
        </ScrollReveal>

        <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" staggerDelay={0.1}>
          {advisoryFeatures.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </StaggerChildren>

        <ScrollReveal>
          <div className="mt-16 text-center">
            <Link href="/product/investing">
              <Button size="lg" variant="outline" className="border-border text-muted-foreground hover:bg-accent group">
                Explore Investment Advisory
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
