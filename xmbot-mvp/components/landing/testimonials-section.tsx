"use client"

import { ScrollReveal, StaggerChildren, StaggerItem } from "./scroll-reveal"
import { GlareCard } from "@/components/ui/aceternity/glare-card"
import { Quote } from "lucide-react"

const scenarios = [
  {
    title: "Stay in control",
    role: "How the human-in-the-loop flow works",
    quote: "Every signal from the Technical Analysis Agent is reviewed and AI-validated before it reaches you. Nothing executes until you tap Approve on Telegram — you're never left out of the loop.",
    icon: "R",
  },
  {
    title: "A few minutes a day",
    role: "What using XMOne looks like",
    quote: "Signals arrive on Telegram with the full picture: entry, stop-loss, take-profit, and the AI's reasoning. Approve or reject with one tap — no need to watch charts all day.",
    icon: "S",
  },
  {
    title: "Risk stays bounded",
    role: "How the risk engine behaves",
    quote: "The 2% max-risk-per-trade rule and daily loss limit apply to every signal automatically. Even a losing trade is a controlled loss, not an open-ended one.",
    icon: "V",
  },
  {
    title: "Built to be understood",
    role: "Why it's transparent by design",
    quote: "Every signal card shows which agent generated it and why — RSI, Supertrend, ADX, and the AI's confidence score — so you can see the reasoning, not just a black-box \"buy\" alert.",
    icon: "A",
  },
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 sm:py-32 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 rounded-sm border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs mono-label text-gold-700 mb-6">
              // How It Works In Practice
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium text-foreground tracking-tight">
              What Using XMOne
              <br />
              <span className="text-gradient-gold">Actually Looks Like.</span>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              We&apos;re in early beta — these are illustrative walkthroughs of the product, not customer quotes.
            </p>
          </div>
        </ScrollReveal>

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 gap-6" staggerDelay={0.15}>
          {scenarios.map((s) => (
            <StaggerItem key={s.title}>
              <GlareCard className="p-8 h-full">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gold-500/10 border border-gold-200 flex items-center justify-center text-gold-700 font-bold text-lg">
                      {s.icon}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{s.title}</div>
                      <div className="text-xs text-muted-foreground">{s.role}</div>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <Quote className="absolute -top-1 -left-1 h-8 w-8 text-gold-200" />
                  <p className="text-sm text-muted-foreground leading-relaxed relative z-10 pl-6">
                    {s.quote}
                  </p>
                </div>
              </GlareCard>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  )
}
