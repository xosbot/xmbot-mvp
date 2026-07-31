"use client"

import { Brain, Users, Shield, BarChart3, Bell, Bot, Layers, Zap } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "Multi-Agent AI",
    description: "Technical Analysis Agent scans XAUUSD M5 with RSI + Supertrend + ADX. AI validates via Gemini/Claude. Future agents: sentiment, fundamentals, news.",
    color: "emerald" as const,
  },
  {
    icon: Users,
    title: "Human-in-the-Loop",
    description: "Every signal requires your approval. Review on Telegram, approve with one tap. No auto-execution without your explicit say-so.",
    color: "emerald" as const,
  },
  {
    icon: Shield,
    title: "Risk Engine",
    description: "2% max risk per trade. Daily loss limits. Max drawdown protection. Position sizing enforced. Your rules are non-negotiable.",
    color: "emerald" as const,
  },
  {
    icon: BarChart3,
    title: "Backtested & Validated",
    description: "64% win rate. +84.3% return. 4.3% max drawdown. Walk-forward validated on unseen data. Not just backtest overfitting.",
    color: "violet" as const,
  },
  {
    icon: Bell,
    title: "Telegram Alerts",
    description: "Signal cards with Approve/Reject buttons. Trade alerts. P&L summaries. System status. Everything you need, right in your pocket.",
    color: "violet" as const,
  },
  {
    icon: Bot,
    title: "Live Dashboard",
    description: "Real-time positions, P&L tracking, signal history, engine status. Monitor from any device, anywhere in the world.",
    color: "violet" as const,
  },
  {
    icon: Layers,
    title: "Multi-Broker",
    description: "Paper Trading for testing. Binance for crypto. MetaTrader 5 for forex. Interactive Brokers for stocks. Switch without changing strategy.",
    color: "emerald" as const,
  },
  {
    icon: Zap,
    title: "24/5 Execution",
    description: "Engine runs around the clock during market hours. No emotions, no FOMO, no revenge trading. Just the system, executing the plan.",
    color: "emerald" as const,
  },
]

export function FeaturesGrid() {
  return (
    <section id="features" className="py-24 sm:py-32 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs text-emerald-400 mb-6 uppercase tracking-wider">
            Platform
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
            Built for
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">Serious Traders</span>
          </h2>
          <p className="mt-6 text-lg text-slate-400 leading-relaxed">
            Everything you need to run a disciplined, automated gold trading operation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="relative p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 group hover:shadow-lg hover:shadow-black/20"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                f.color === "emerald"
                  ? "bg-emerald-500/10 group-hover:bg-emerald-500/20"
                  : "bg-violet-500/10 group-hover:bg-violet-500/20"
              } transition-colors duration-300`}>
                <f.icon className={`h-6 w-6 ${
                  f.color === "emerald" ? "text-emerald-400" : "text-violet-400"
                }`} />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
