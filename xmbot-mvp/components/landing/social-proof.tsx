"use client"

import { ShieldCheck, Eye, Undo2 } from "lucide-react"
import { ScrollReveal, StaggerChildren, StaggerItem } from "./scroll-reveal"
import { GlareCard } from "@/components/ui/aceternity/glare-card"

const commitments = [
  {
    icon: ShieldCheck,
    title: "No Withdrawal Access",
    description: "Your Binance API keys are connected with trade-only permissions. XMBot can never move funds out of your account — and you can revoke access in one tap, anytime.",
  },
  {
    icon: Eye,
    title: "You Approve Every Trade",
    description: "This isn't a line in the terms — it's the architecture. No signal executes until you tap Approve on Telegram. There is no auto-execution mode to accidentally enable.",
  },
  {
    icon: Undo2,
    title: "Cancel Anytime, No Lock-In",
    description: "Cancel your subscription whenever you want, straight from your dashboard. You keep access through the period you've already paid for — no calls, no retention forms.",
  },
]

export function SocialProof() {
  return (
    <section className="py-24 sm:py-32 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 rounded-sm border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs mono-label text-gold-400 mb-6">
              // Beta Program
            </div>
            <h2 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-medium text-foreground tracking-tight">
              Built to Earn Trust
              <br />
              <span className="text-gradient-gold">Not Buy It</span>
            </h2>
            <p className="mt-6 text-lg text-stone-400 leading-relaxed">
              We&apos;re early, and we&apos;d rather show you exactly how you&apos;re protected than
              paste in reviews. Here&apos;s what that looks like in practice.
            </p>
          </div>
        </ScrollReveal>

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto" staggerDelay={0.1}>
          {commitments.map((c) => (
            <StaggerItem key={c.title}>
              <GlareCard className="p-8 h-full">
                <div className="w-14 h-14 rounded-xl bg-card border border-border flex items-center justify-center mb-6">
                  <c.icon className="h-7 w-7 text-foreground/70" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">{c.title}</h3>
                <p className="text-sm text-stone-400 leading-relaxed">{c.description}</p>
              </GlareCard>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  )
}
