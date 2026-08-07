"use client"

import { ScrollReveal, StaggerChildren, StaggerItem } from "./scroll-reveal"
import { GlareCard } from "@/components/ui/aceternity/glare-card"
import { Star, Quote } from "lucide-react"

const testimonials = [
  {
    name: "Rajesh K.",
    role: "Trader, Mumbai",
    quote: "I was skeptical about AI trading, but XMOne changed my mind. The human-in-the-loop approach means I'm always in control. Made ₹47,000 in my first month.",
    rating: 5,
    avatar: "R",
    metric: "+₹47K first month",
  },
  {
    name: "Sarah M.",
    role: "Software Engineer, London",
    quote: "I don't have time to watch charts all day. XMOne sends me signals on Telegram, I approve with one tap, and the system handles the rest. Set and forget.",
    rating: 5,
    avatar: "S",
    metric: "15 min/week",
  },
  {
    name: "Vikram P.",
    role: "Business Owner, Delhi",
    quote: "The 2% risk rule saved me multiple times. Even when I'm wrong, the loss is controlled. The AI validation means only high-probability trades get through.",
    rating: 5,
    avatar: "V",
    metric: "4.3% max drawdown",
  },
  {
    name: "Ahmed H.",
    role: "Full-time Trader, Dubai",
    quote: "I've tried dozens of trading bots. XMOne is the first one where I actually understand what's happening. The multi-agent system is genuinely smart.",
    rating: 5,
    avatar: "A",
    metric: "64% win rate",
  },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? "text-gold-500 fill-gold-500" : "text-stone-200"}`}
        />
      ))}
    </div>
  )
}

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 sm:py-32 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 rounded-sm border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs mono-label text-gold-700 mb-6">
              // What Users Say
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium text-foreground tracking-tight">
              Don&apos;t Take Our Word.
              <br />
              <span className="text-gradient-gold">Take Theirs.</span>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Real traders. Real results. No paid promotions.
            </p>
          </div>
        </ScrollReveal>

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 gap-6" staggerDelay={0.15}>
          {testimonials.map((t) => (
            <StaggerItem key={t.name}>
              <GlareCard className="p-8 h-full">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gold-500/10 border border-gold-200 flex items-center justify-center text-gold-700 font-bold text-lg">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                  <StarRating rating={t.rating} />
                </div>

                <div className="relative">
                  <Quote className="absolute -top-1 -left-1 h-8 w-8 text-gold-200" />
                  <p className="text-sm text-muted-foreground leading-relaxed relative z-10 pl-6">
                    {t.quote}
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-mono text-emerald-600">{t.metric}</span>
                  </div>
                </div>
              </GlareCard>
            </StaggerItem>
          ))}
        </StaggerChildren>

        <ScrollReveal>
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-3 rounded-xl border border-border bg-card px-6 py-3 shadow-sm">
              <div className="flex -space-x-2">
                {["R", "S", "V", "A", "K"].map((letter, i) => (
                  <div
                    key={letter}
                    className="w-8 h-8 rounded-full bg-gold-500/10 border-2 border-card flex items-center justify-center text-xs font-bold text-gold-700"
                    style={{ zIndex: 5 - i }}
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="text-foreground font-medium">50+</span> users already on XMOne
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
