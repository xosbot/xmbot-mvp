"use client"

import { ScrollReveal, StaggerChildren, StaggerItem } from "./scroll-reveal"
import { GlareCard } from "@/components/ui/aceternity/glare-card"
import { Spotlight } from "@/components/ui/aceternity/spotlight"
import { Brain, BarChart3, Shield, Activity, BookOpen, Zap, Target, TrendingUp, Search } from "lucide-react"

const agents = [
  {
    icon: Search,
    name: "Technical Analyst",
    role: "Scans charts, patterns, and momentum",
    markets: "Gold, Stocks, Crypto, Forex",
    tools: "RSI, Supertrend, ADX, MACD",
    color: "gold" as const,
  },
  {
    icon: BarChart3,
    name: "Fundamental Analyst",
    role: "Earnings, news, and macro data",
    markets: "Stocks, Mutual Funds, Bonds",
    tools: "P/E, Revenue Growth, Macro",
    color: "emerald" as const,
  },
  {
    icon: Brain,
    name: "AI Validator",
    role: "Cross-validates with Gemini + Claude",
    markets: "All signals",
    tools: "Multi-model consensus",
    color: "blue" as const,
  },
  {
    icon: Activity,
    name: "Regime Detector",
    role: "Trending, ranging, or volatile?",
    markets: "All assets",
    tools: "Volatility, ADX, regime switching",
    color: "orange" as const,
  },
  {
    icon: Shield,
    name: "Risk Advisor",
    role: "Portfolio construction & sizing",
    markets: "All holdings",
    tools: "Position sizing, drawdown limits",
    color: "red" as const,
  },
  {
    icon: BookOpen,
    name: "Trade Journal",
    role: "NLP analysis, learnings, patterns",
    markets: "All trades",
    tools: "Sentiment, win/loss analysis",
    color: "purple" as const,
  },
]

function AgentCard({ agent }: { agent: typeof agents[0] }) {
  const colorMap = {
    gold: { fill: "rgba(184, 135, 63, 0.06)", fillStrong: "rgba(184, 135, 63, 0.1)", iconBg: "bg-gold-500/10", iconText: "text-gold-600", border: "border-gold-200", tag: "bg-gold-50 text-gold-700 border-gold-200" },
    emerald: { fill: "rgba(16, 185, 129, 0.06)", fillStrong: "rgba(16, 185, 129, 0.1)", iconBg: "bg-emerald-500/10", iconText: "text-emerald-600", border: "border-emerald-200", tag: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    blue: { fill: "rgba(59, 130, 246, 0.06)", fillStrong: "rgba(59, 130, 246, 0.1)", iconBg: "bg-blue-500/10", iconText: "text-blue-600", border: "border-blue-200", tag: "bg-blue-50 text-blue-700 border-blue-200" },
    orange: { fill: "rgba(249, 115, 22, 0.06)", fillStrong: "rgba(249, 115, 22, 0.1)", iconBg: "bg-orange-500/10", iconText: "text-orange-600", border: "border-orange-200", tag: "bg-orange-50 text-orange-700 border-orange-200" },
    red: { fill: "rgba(239, 68, 68, 0.06)", fillStrong: "rgba(239, 68, 68, 0.1)", iconBg: "bg-red-500/10", iconText: "text-red-600", border: "border-red-200", tag: "bg-red-50 text-red-700 border-red-200" },
    purple: { fill: "rgba(168, 85, 247, 0.06)", fillStrong: "rgba(168, 85, 247, 0.1)", iconBg: "bg-purple-500/10", iconText: "text-purple-600", border: "border-purple-200", tag: "bg-purple-50 text-purple-700 border-purple-200" },
  }

  const c = colorMap[agent.color]

  return (
    <StaggerItem>
      <Spotlight className="rounded-xl" fill={c.fillStrong}>
        <div className={`p-6 rounded-xl border ${c.border} bg-card hover:shadow-md transition-all duration-300 h-full`}>
          <div className={`w-12 h-12 rounded-xl ${c.iconBg} flex items-center justify-center mb-4`}>
            <agent.icon className={`h-6 w-6 ${c.iconText}`} />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">{agent.name}</h3>
          <p className="text-sm text-muted-foreground mb-3">{agent.role}</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {agent.markets.split(", ").map((m) => (
              <span key={m} className={`text-[10px] mono-label px-2 py-0.5 rounded-sm border ${c.tag}`}>
                {m}
              </span>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Tools:</span> {agent.tools}
          </div>
        </div>
      </Spotlight>
    </StaggerItem>
  )
}

export function AIAgentsSection() {
  return (
    <section id="ai-agents" className="py-24 sm:py-32 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 rounded-sm border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs mono-label text-gold-700 mb-6">
              // AI Agents
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium text-foreground tracking-tight">
              Your Multi-Agent
              <br />
              <span className="text-gradient-gold">Investment Team.</span>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Six specialized AI agents working 24/5. Each one is an expert in their domain.
              Together, they find opportunities no single indicator could.
            </p>
          </div>
        </ScrollReveal>

        <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" staggerDelay={0.08}>
          {agents.map((agent) => (
            <AgentCard key={agent.name} agent={agent} />
          ))}
        </StaggerChildren>

        <ScrollReveal>
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-gold-600" />
              <span>Agents collaborate in real-time. Consensus required before any signal is sent.</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
