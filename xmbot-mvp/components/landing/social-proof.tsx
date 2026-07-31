"use client"

import { Star } from "lucide-react"

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
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs text-muted-foreground mb-6 uppercase tracking-wider">
            Beta Users
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            Trusted by
            <br />
            <span className="text-gradient">Real Traders</span>
          </h2>
          <p className="mt-6 text-lg text-slate-400 leading-relaxed">
            Early beta users are seeing results. Here&apos;s what they say.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="relative p-6 sm:p-8 rounded-2xl border border-border/60 bg-card/40 hover:bg-card/60 hover:border-border transition-all duration-300 group"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-sm text-slate-300 leading-relaxed mb-6">
                &ldquo;{t.content}&rdquo;
              </blockquote>

              {/* Highlight */}
              <div className="mb-6 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-xs font-medium text-emerald-400">&ldquo;{t.highlight}&rdquo;</span>
              </div>

              {/* Author */}
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
          ))}
        </div>
      </div>
    </section>
  )
}
