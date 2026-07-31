"use client"

import { Star } from "lucide-react"
import { ScrollReveal, StaggerChildren, StaggerItem } from "./scroll-reveal"

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
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
              Trusted by
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">Real Traders</span>
            </h2>
            <p className="mt-6 text-lg text-slate-400 leading-relaxed">
              Early beta users are seeing results. Here&apos;s what they say.
            </p>
          </div>
        </ScrollReveal>

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-6" staggerDelay={0.12}>
          {testimonials.map((t) => (
            <StaggerItem key={t.name}>
              <div className="relative p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 group hover:-translate-y-1">
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <blockquote className="text-sm text-slate-300 leading-relaxed mb-6">
                  &ldquo;{t.content}&rdquo;
                </blockquote>
                <div className="mb-6 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-xs font-medium text-emerald-400">&ldquo;{t.highlight}&rdquo;</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-violet-500/20 flex items-center justify-center text-sm font-bold text-white">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.role}</div>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  )
}
