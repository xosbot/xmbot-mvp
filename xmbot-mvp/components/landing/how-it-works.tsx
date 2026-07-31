"use client"

import { MessageSquare, Brain, CheckCircle, BarChart3 } from "lucide-react"
import { ScrollReveal, StaggerChildren, StaggerItem } from "./scroll-reveal"
import { LampEffect } from "@/components/ui/aceternity/lamp-effect"
import { GlareCard } from "@/components/ui/aceternity/glare-card"

const steps = [
  {
    icon: MessageSquare,
    number: "01",
    title: "Connect Telegram",
    description: "Link your Telegram account in 2 minutes. Set your risk preferences — max loss per trade, daily limits.",
    color: "emerald" as const,
  },
  {
    icon: Brain,
    number: "02",
    title: "AI Scans the Market",
    description: "Multi-agent engine analyzes XAUUSD every 5 minutes. RSI + Supertrend + ADX filters. AI validates every signal.",
    color: "violet" as const,
  },
  {
    icon: CheckCircle,
    number: "03",
    title: "You Approve or Reject",
    description: "Signal card arrives on Telegram with entry price, stop loss, take profit. Tap Approve or Reject.",
    color: "emerald" as const,
  },
  {
    icon: BarChart3,
    number: "04",
    title: "Track & Optimize",
    description: "Monitor P&L on your dashboard. Review signal history. Adjust parameters. Get monthly reports.",
    color: "violet" as const,
  },
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
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-aggressive">
              Four Steps to
              <br />
              <span className="text-gradient-emerald">Smarter Trading</span>
            </h2>
            <p className="mt-6 text-lg text-slate-400 leading-relaxed">
              From setup to live signals in under 15 minutes. No coding required.
            </p>
          </div>
        </ScrollReveal>

        {/* Timeline */}
        <div className="relative max-w-4xl mx-auto">
          {/* Tracing beam line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500/50 via-violet-500/50 to-emerald-500/50" />

          <StaggerChildren className="space-y-12" staggerDelay={0.2}>
            {steps.map((step, i) => (
              <StaggerItem key={step.number}>
                <div className="relative flex gap-8 items-start">
                  {/* Step number circle */}
                  <div className="relative z-10 flex-shrink-0">
                    <LampEffect>
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                        step.color === "emerald"
                          ? "bg-emerald-500/10 border border-emerald-500/20"
                          : "bg-violet-500/10 border border-violet-500/20"
                      }`}>
                        <step.icon className={`h-7 w-7 ${step.color === "emerald" ? "text-emerald-400" : "text-violet-400"}`} />
                      </div>
                    </LampEffect>
                  </div>

                  {/* Step content */}
                  <GlareCard className="flex-1 p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        step.color === "emerald"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-violet-500/10 text-violet-400"
                      }`}>
                        {step.number}
                      </span>
                      <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
                  </GlareCard>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </div>
    </section>
  )
}
