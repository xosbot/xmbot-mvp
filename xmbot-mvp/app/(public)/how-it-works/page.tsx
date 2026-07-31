"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageSquare, Brain, CheckCircle, BarChart3 } from "lucide-react"
import { LampEffect } from "@/components/ui/aceternity/lamp-effect"
import { GlareCard } from "@/components/ui/aceternity/glare-card"

const steps = [
  {
    icon: MessageSquare,
    number: "01",
    title: "Connect Telegram",
    time: "2 minutes",
    description: "Link your Telegram account to XMBot. Set your risk preferences — max loss per trade, daily limits, and position sizing. The system configures itself based on your risk tolerance.",
    details: [
      "One-click Telegram linking",
      "Set max risk per trade (default: 2%)",
      "Configure daily loss limits",
      "Choose your notification preferences",
    ],
    color: "emerald" as const,
  },
  {
    icon: Brain,
    number: "02",
    title: "AI Analyzes the Market",
    time: "24/5",
    description: "The multi-agent engine scans XAUUSD every 5 minutes. The Technical Analysis Agent checks RSI + Supertrend + ADX. The AI Validator confirms via Gemini/Claude. Only high-confidence signals proceed.",
    details: [
      "RSI + Supertrend + ADX filters",
      "AI-powered signal validation",
      "Multi-timeframe analysis",
      "Pattern recognition",
    ],
    color: "violet" as const,
  },
  {
    icon: CheckCircle,
    number: "03",
    title: "You Approve or Reject",
    time: "12s average",
    description: "A rich signal card arrives on Telegram with entry price, stop loss, take profit, confidence score, and risk amount. Review the analysis, then tap Approve or Reject. The trade only executes after your approval.",
    details: [
      "Detailed signal cards",
      "Entry, stop loss, take profit",
      "Confidence score displayed",
      "One-tap approve/reject",
    ],
    color: "emerald" as const,
  },
  {
    icon: BarChart3,
    number: "04",
    title: "Track & Optimize",
    time: "Real-time",
    description: "Monitor your P&L on the live dashboard. Review signal history with outcomes. Track win rate, profit factor, and drawdown. Adjust parameters as you learn what works for your trading style.",
    details: [
      "Real-time P&L tracking",
      "Signal history with outcomes",
      "Performance analytics",
      "Adjustable parameters",
    ],
    color: "violet" as const,
  },
]

export default function HowItWorksPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs text-emerald-400 mb-6 uppercase tracking-wider">
            How It Works
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-aggressive">
            From Setup to Live Signals
            <br />
            <span className="text-gradient-emerald">in 15 Minutes</span>
          </h1>
          <p className="mt-6 text-lg text-slate-400 leading-relaxed">
            No coding required. Connect your Telegram, configure your risk,
            and start receiving AI-powered trading signals.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-16 mb-20">
          {steps.map((step, i) => (
            <div key={step.number} className="grid lg:grid-cols-2 gap-12 items-center">
              <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                <div className="flex items-center gap-4 mb-6">
                  <LampEffect>
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                      step.color === "emerald"
                        ? "bg-emerald-500/10 border border-emerald-500/20"
                        : "bg-violet-500/10 border border-violet-500/20"
                    }`}>
                      <step.icon className={`h-7 w-7 ${step.color === "emerald" ? "text-emerald-400" : "text-violet-400"}`} />
                    </div>
                  </LampEffect>
                  <div>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      step.color === "emerald"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-violet-500/10 text-violet-400"
                    }`}>
                      Step {step.number}
                    </span>
                    <div className="text-xs text-slate-500 mt-1">{step.time}</div>
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-white tracking-tight mb-4">{step.title}</h2>
                <p className="text-slate-400 leading-relaxed mb-6">{step.description}</p>
                <ul className="space-y-3">
                  {step.details.map((detail) => (
                    <li key={detail} className="flex items-center gap-3 text-sm text-slate-300">
                      <CheckCircle className={`h-4 w-4 flex-shrink-0 ${step.color === "emerald" ? "text-emerald-400" : "text-violet-400"}`} />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                <GlareCard className="p-8">
                  <div className="aspect-video rounded-lg bg-gradient-to-br from-emerald-500/10 to-violet-500/10 flex items-center justify-center">
                    <step.icon className="h-20 w-20 text-emerald-400/20" />
                  </div>
                </GlareCard>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white tracking-aggressive mb-4">
            Ready to Start?
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Set up in 15 minutes. No coding required. Start with paper trading risk-free.
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
