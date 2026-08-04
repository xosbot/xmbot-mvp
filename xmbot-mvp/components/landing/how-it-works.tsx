"use client"

import { MessageSquare, Brain, CheckCircle, BarChart3 } from "lucide-react"
import { ScrollReveal, StaggerChildren, StaggerItem } from "./scroll-reveal"
import { LampEffect } from "@/components/ui/aceternity/lamp-effect"
import { GlareCard } from "@/components/ui/aceternity/glare-card"

const steps = [
  {
    icon: MessageSquare,
    number: "01",
    time: "~2 min",
    title: "Connect Telegram",
    description: "Link your Telegram account and set your risk preferences — max loss per trade, daily limits. No install, no code.",
  },
  {
    icon: Brain,
    number: "02",
    time: "Runs 24/5",
    title: "AI Scans the Market",
    description: "Multi-agent engine analyzes XAUUSD every 5 minutes — RSI, Supertrend, ADX — then an AI validator double-checks every candidate signal.",
  },
  {
    icon: CheckCircle,
    number: "03",
    time: "~12s",
    title: "You Approve or Reject",
    description: "A signal card lands on Telegram with entry price, stop loss, and take profit already worked out. Tap Approve or Reject — nothing fires without you.",
  },
  {
    icon: BarChart3,
    number: "04",
    time: "Anytime",
    title: "Track & Optimize",
    description: "Watch P&L on your dashboard, review past signals, and adjust risk settings whenever you want. Monthly reports keep you honest.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 relative">
      <div className="absolute top-0 left-1/2 -transtone-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 rounded-sm border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs mono-label text-gold-400 mb-6">
              // How It Works
            </div>
            <h2 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-semibold text-foreground tracking-tight">
              Four Steps.
              <br />
              <span className="text-gradient-gold">15 Minutes Total.</span>
            </h2>
            <p className="mt-6 text-lg text-stone-400 leading-relaxed">
              Start to finish, on your phone. No coding, no charts to learn, no software to install.
            </p>
          </div>
        </ScrollReveal>

        {/* Timeline */}
        <div className="relative max-w-4xl mx-auto">
          {/* Tracing beam line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-gold-500/25" />

          <StaggerChildren className="space-y-12" staggerDelay={0.2}>
            {steps.map((step) => (
              <StaggerItem key={step.number}>
                <div className="relative flex gap-8 items-start">
                  {/* Step number circle */}
                  <div className="relative z-10 flex-shrink-0">
                    <LampEffect>
                      <div className="w-16 h-16 rounded-md flex items-center justify-center bg-gold-500/10 border border-gold-500/20">
                        <step.icon className="h-7 w-7 text-gold-400" />
                      </div>
                    </LampEffect>
                  </div>

                  {/* Step content */}
                  <GlareCard className="flex-1 p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-gold-500/10 text-gold-400">
                        {step.number}
                      </span>
                      <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                      <span className="ml-auto text-xs font-mono text-stone-500">{step.time}</span>
                    </div>
                    <p className="text-sm text-stone-400 leading-relaxed">{step.description}</p>
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
