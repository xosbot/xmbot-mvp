"use client"

import { Brain, Users, Shield, BarChart3, Bell, Bot, Layers, Zap, Check } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const features = [
  {
    icon: Brain,
    title: "Multi-Agent AI Architecture",
    description: "Three specialized agents work together: a Technical Analysis Agent scans XAUUSD M5 with RSI + Supertrend + ADX, an AI Validator confirms signals via Gemini/Claude, and a Risk Manager enforces position sizing. Each agent specializes in what it does best.",
    color: "emerald" as const,
  },
  {
    icon: Users,
    title: "Human-in-the-Loop Approval",
    description: "Every signal requires your explicit approval. When the AI identifies a trading opportunity, it sends a detailed signal card to your Telegram with entry price, stop loss, take profit, and confidence score. You tap Approve or Reject — no auto-execution without your say.",
    color: "emerald" as const,
  },
  {
    icon: Shield,
    title: "Enforced Risk Management",
    description: "2% maximum risk per trade. Daily loss limits. Maximum drawdown protection. Position sizing enforced at the engine level — not a suggestion, but a hard rule that cannot be overridden. Your capital is protected by design.",
    color: "emerald" as const,
  },
  {
    icon: BarChart3,
    title: "Backtested & Walk-Forward Validated",
    description: "64% win rate over 1,083 trades in 6 months. +84.3% return on $10,000 initial capital. 4.3% max drawdown. Walk-forward analysis on unseen data shows +19% — the system generalizes, not just overfits.",
    color: "violet" as const,
  },
  {
    icon: Bell,
    title: "Telegram Signal Cards",
    description: "Rich signal cards delivered directly to your Telegram with Approve/Reject buttons, entry price, stop loss, take profit, confidence score, and risk amount. Everything you need to make an informed decision in one message.",
    color: "violet" as const,
  },
  {
    icon: Bot,
    title: "Real-Time Dashboard",
    description: "Monitor open positions with live P&L, track your account balance and equity, review signal history with outcomes, and check engine status — all from a responsive web dashboard accessible from any device.",
    color: "violet" as const,
  },
  {
    icon: Layers,
    title: "Multi-Broker Support",
    description: "Start with Paper Trading to test risk-free, then switch to Binance for live crypto trading with PAXGUSDT. MetaTrader 5 for forex and Interactive Brokers coming soon. Switch brokers without changing your strategy.",
    color: "emerald" as const,
  },
  {
    icon: Zap,
    title: "24/5 Automated Analysis",
    description: "The engine runs around the clock during market hours. No emotions, no FOMO, no revenge trading. Just systematic analysis and signal generation while you sleep. You review signals on your schedule.",
    color: "emerald" as const,
  },
]

export default function FeaturesPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs text-emerald-400 mb-6 uppercase tracking-wider">
            Platform Features
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-aggressive">
            Built for
            <br />
            <span className="text-gradient-emerald">Serious Traders</span>
          </h1>
          <p className="mt-6 text-lg text-slate-400 leading-relaxed">
            Everything you need to run a disciplined, automated gold trading operation
            with full control over every decision.
          </p>
        </div>

        {/* Features grid */}
        <div className="space-y-8 mb-20">
          {features.map((feature, i) => (
            <div key={feature.title} className={`grid lg:grid-cols-2 gap-8 items-center ${i % 2 === 1 ? "lg:flex-row-reverse" : ""}`}>
              <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
                  feature.color === "emerald" ? "bg-emerald-500/10" : "bg-violet-500/10"
                }`}>
                  <feature.icon className={`h-7 w-7 ${feature.color === "emerald" ? "text-emerald-400" : "text-violet-400"}`} />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight mb-4">{feature.title}</h2>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
              <div className={`p-8 rounded-2xl border border-white/10 bg-white/5 ${i % 2 === 1 ? "lg:order-1" : ""}`}>
                <div className="aspect-video rounded-lg bg-gradient-to-br from-emerald-500/10 to-violet-500/10 flex items-center justify-center">
                  <feature.icon className="h-16 w-16 text-emerald-400/30" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white tracking-aggressive mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Join the beta and experience AI-powered trading with full control.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 h-14 shadow-lg shadow-emerald-600/25">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
