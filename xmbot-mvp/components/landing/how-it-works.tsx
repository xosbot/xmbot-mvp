"use client"

import { MessageSquare, Brain, CheckCircle, BarChart3 } from "lucide-react"
import { ScrollReveal, StaggerChildren, StaggerItem } from "./scroll-reveal"

const steps = [
  { icon: MessageSquare, number: "01", title: "Connect Telegram", description: "Link your Telegram account in 2 minutes. Set your risk preferences — max loss per trade, daily limits.", color: "emerald" },
  { icon: Brain, number: "02", title: "AI Scans the Market", description: "Multi-agent engine analyzes XAUUSD every 5 minutes. RSI + Supertrend + ADX filters. AI validates every signal.", color: "violet" },
  { icon: CheckCircle, number: "03", title: "You Approve or Reject", description: "Signal card arrives on Telegram with entry price, stop loss, take profit. Tap Approve or Reject.", color: "emerald" },
  { icon: BarChart3, number: "04", title: "Track & Optimize", description: "Monitor P&L on your dashboard. Review signal history. Adjust parameters. Get monthly reports.", color: "violet" },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs text-emerald-400 mb-6 uppercase tracking-wider">
              How It Works
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
              Four Steps to
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">Smarter Trading</span>
            </h2>
            <p className="mt-6 text-lg text-slate-400 leading-relaxed">
              From setup to live signals in under 15 minutes. No coding required.
            </p>
          </div>
        </ScrollReveal>

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8" staggerDelay={0.15}>
          {steps.map((step, i) => (
            <StaggerItem key={step.number}>
              <div className="relative group">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[calc(50%+50px)] right-[calc(-50%+50px)] h-px bg-gradient-to-r from-border to-transparent" />
                )}
                <div className="relative p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-black/20 group-hover:-translate-y-1">
                  <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                    step.color === "emerald"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                  }`}>
                    {step.number}
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                    step.color === "emerald" ? "bg-emerald-500/10 group-hover:bg-emerald-500/20" : "bg-violet-500/10 group-hover:bg-violet-500/20"
                  } transition-colors duration-300`}>
                    <step.icon className={`h-6 w-6 ${step.color === "emerald" ? "text-emerald-400" : "text-violet-400"}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">{step.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  )
}
