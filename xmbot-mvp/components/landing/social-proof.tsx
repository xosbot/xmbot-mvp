"use client"

import { ScrollReveal } from "./scroll-reveal"
import { AnimatedTestimonials } from "@/components/ui/aceternity/animated-testimonials"

const testimonials = [
  {
    name: "Rahul M.",
    role: "Full-time Trader, Mumbai",
    content: "I was skeptical about automated trading, but the human-in-the-loop approach sold me. I still make the final call, but the AI does the heavy analysis. Win rate has been solid — better than my manual trades.",
    rating: 5,
    highlight: "Better than my manual trades",
  },
  {
    name: "Priya K.",
    role: "Part-time Investor, Bangalore",
    content: "Set it up in 15 minutes. The Telegram alerts are clean — I just approve or reject. No more staring at charts all day. The risk management is tight, which is exactly what I needed.",
    rating: 5,
    highlight: "Set it up in 15 minutes",
  },
  {
    name: "Arjun S.",
    role: "Portfolio Manager, Delhi",
    content: "Backtested results matched live performance within 5%. The multi-agent architecture is real — not just a simple indicator bot. Worth the beta price for the risk management alone.",
    rating: 5,
    highlight: "Multi-agent architecture is real",
  },
]

export function SocialProof() {
  return (
    <section className="py-24 sm:py-32 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs text-emerald-400 mb-6 uppercase tracking-wider">
              Beta Users
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-aggressive">
              Trusted by
              <br />
              <span className="text-gradient-emerald">Real Traders</span>
            </h2>
            <p className="mt-6 text-lg text-slate-400 leading-relaxed">
              Early beta users are seeing results. Here&apos;s what they say.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="max-w-3xl mx-auto">
            <AnimatedTestimonials testimonials={testimonials} />
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
