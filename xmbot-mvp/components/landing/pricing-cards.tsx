"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check, Star, ArrowRight } from "lucide-react"
import { ScrollReveal, StaggerChildren, StaggerItem } from "./scroll-reveal"
import { GlareCard } from "@/components/ui/aceternity/glare-card"
import { CardSpotlight } from "@/components/ui/aceternity/card-spotlight"
import { PLANS } from "@/lib/plans"

export function PricingCards() {
  return (
    <section id="pricing" className="py-24 sm:py-32 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 rounded-sm border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs mono-label text-gold-700 mb-6">
              // Pricing
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium text-foreground tracking-tight">
              Simple,
              <br />
              <span className="text-gradient-gold">Transparent Pricing</span>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              For XAUUSD gold trading today. No free trial — start with free paper trading instead,
              risk-free, for as long as you want.
            </p>
          </div>
        </ScrollReveal>

        <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto" staggerDelay={0.1}>
          {/* Free — Paper Trading */}
          <StaggerItem>
            <CardSpotlight className="p-8 h-full">
              <h3 className="text-lg font-semibold text-foreground">Paper Trading</h3>
              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">₹0</span>
                  <span className="text-sm text-muted-foreground">/forever</span>
                </div>
              </div>
              <ul className="mt-6 space-y-3">
                {["Full AI signal pipeline", "Simulated trades — no real money", "Telegram alerts", "Dashboard access", "Email support"].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block mt-8">
                <Button variant="outline" className="w-full border-border text-foreground hover:bg-accent h-11 transition-all duration-300">
                  Start Free
                </Button>
              </Link>
            </CardSpotlight>
          </StaggerItem>

          {/* Monthly — Most Popular */}
          <StaggerItem>
            <GlareCard className="relative h-full">
              <div className="absolute -top-px left-1/2 -translate-x-1/2 px-3 py-1 rounded-b-sm bg-gold-600 text-xs mono-label font-bold text-white z-10">
                Most Popular
              </div>
              <div className="p-8">
                <h3 className="text-lg font-semibold text-foreground">{PLANS.monthly.name}</h3>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">{PLANS.monthly.label}</span>
                    <span className="text-sm text-muted-foreground">{PLANS.monthly.period}</span>
                  </div>
                </div>
                <ul className="mt-6 space-y-3">
                  {["Full bot access for XAUUSD", "AI analysis 24/5", "Telegram trade alerts", "Risk management built-in", "Email support"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="block mt-8">
                  <Button className="w-full bg-gold-600 hover:bg-gold-500 text-white font-semibold h-11 transition-colors duration-200 shadow-sm shadow-gold-600/20">
                    Get Started
                  </Button>
                </Link>
              </div>
            </GlareCard>
          </StaggerItem>

          {/* Yearly */}
          <StaggerItem>
            <CardSpotlight className="p-8 h-full">
              <div className="inline-flex items-center gap-2 rounded-sm bg-accent border border-border px-2.5 py-1 text-xs mono-label text-muted-foreground mb-4">
                <Star className="h-3 w-3" /> Best for Pros
              </div>
              <h3 className="text-lg font-semibold text-foreground">{PLANS.yearly.name}</h3>
              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">{PLANS.yearly.label}</span>
                  <span className="text-sm text-muted-foreground">{PLANS.yearly.period}</span>
                </div>
              </div>
              <ul className="mt-6 space-y-3">
                {["Everything in Monthly", "Dedicated account manager", "Custom strategy requests", "API access", "White-glove onboarding"].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block mt-8">
                <Button variant="outline" className="w-full border-border text-foreground hover:bg-accent h-11 transition-all duration-300">
                  Get Started
                </Button>
              </Link>
            </CardSpotlight>
          </StaggerItem>
        </StaggerChildren>

        <ScrollReveal>
          <div className="mt-10 text-center">
            <Link href="/pricing" className="inline-flex items-center gap-1.5 text-sm text-gold-700 hover:text-gold-600 group">
              See quarterly plan & full plan comparison
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
