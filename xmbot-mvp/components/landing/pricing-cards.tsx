"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check, Star, Zap, ArrowRight } from "lucide-react"
import { ScrollReveal, StaggerChildren, StaggerItem } from "./scroll-reveal"
import { MovingBorder } from "@/components/ui/aceternity/moving-border"
import { GlareCard } from "@/components/ui/aceternity/glare-card"
import { CardSpotlight } from "@/components/ui/aceternity/card-spotlight"

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
              Choose the plan that fits your investment style. Upgrade anytime.
            </p>
          </div>
        </ScrollReveal>

        <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto" staggerDelay={0.1}>
          {/* Free */}
          <StaggerItem>
            <CardSpotlight className="p-8 h-full">
              <h3 className="text-lg font-semibold text-foreground">Free</h3>
              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">$0</span>
                  <span className="text-sm text-muted-foreground">/forever</span>
                </div>
              </div>
              <ul className="mt-6 space-y-3">
                {["Paper trading", "2 AI agents", "Limited signals", "Basic dashboard", "Community support"].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block mt-8">
                <Button variant="outline" className="w-full border-border text-foreground hover:bg-accent h-11 transition-all duration-300">
                  Get Started Free
                </Button>
              </Link>
            </CardSpotlight>
          </StaggerItem>

          {/* Pro — Most Popular */}
          <StaggerItem>
            <GlareCard className="relative h-full">
              <div className="absolute -top-px left-1/2 -translate-x-1/2 px-3 py-1 rounded-b-sm bg-gold-600 text-xs mono-label font-bold text-white z-10">
                Most Popular
              </div>
              <div className="p-8">
                <h3 className="text-lg font-semibold text-foreground">Pro</h3>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">$49</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                </div>
                <ul className="mt-6 space-y-3">
                  {["All 6 AI agents", "Gold, stocks, crypto, forex", "Telegram trade alerts", "Risk management built-in", "MF recommendations", "Portfolio review", "Priority email support"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="block mt-8">
                  <Button className="w-full bg-gold-600 hover:bg-gold-500 text-white font-semibold h-11 transition-colors duration-200 shadow-sm shadow-gold-600/20">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            </GlareCard>
          </StaggerItem>

          {/* Enterprise */}
          <StaggerItem>
            <CardSpotlight className="p-8 h-full">
              <div className="inline-flex items-center gap-2 rounded-sm bg-accent border border-border px-2.5 py-1 text-xs mono-label text-muted-foreground mb-4">
                <Zap className="h-3 w-3" /> For Teams
              </div>
              <h3 className="text-lg font-semibold text-foreground">Enterprise</h3>
              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">$199</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
              </div>
              <ul className="mt-6 space-y-3">
                {["Everything in Pro", "White-label API", "Custom strategies", "Dedicated account manager", "CSM + integrations", "SLA guarantee"].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block mt-8">
                <Button variant="outline" className="w-full border-border text-foreground hover:bg-accent h-11 transition-all duration-300">
                  Contact Sales
                </Button>
              </Link>
            </CardSpotlight>
          </StaggerItem>
        </StaggerChildren>
      </div>
    </section>
  )
}
