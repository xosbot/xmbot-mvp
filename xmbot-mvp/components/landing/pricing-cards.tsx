"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check, Star, Zap } from "lucide-react"
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
            <div className="inline-flex items-center gap-2 rounded-sm border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs mono-label text-gold-400 mb-6">
              // Pricing
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-aggressive">
              Simple,
              <br />
              <span className="text-gradient-gold">Transparent Pricing</span>
            </h2>
            <p className="mt-6 text-lg text-slate-400 leading-relaxed">
              Choose the plan that fits your trading style. Upgrade anytime.
            </p>
          </div>
        </ScrollReveal>

        <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto" staggerDelay={0.1}>
          {/* Beta — Moving Border */}
          <StaggerItem>
            <MovingBorder className="h-full">
              <div className="p-8">
                <div className="inline-flex items-center gap-2 rounded-sm bg-gold-500/10 border border-gold-500/30 px-2.5 py-1 text-xs mono-label text-gold-400 mb-4">
                  <Star className="h-3 w-3" /> Best Value
                </div>
                <h3 className="text-lg font-semibold text-white">Beta Access</h3>
                <div className="mt-4">
                  <span className="text-lg text-slate-500 line-through">₹19,999</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-4xl font-bold text-white">₹9,999</span>
                    <span className="text-sm text-slate-400">/3 months</span>
                  </div>
                  <p className="text-xs text-emerald-400/80 mt-2">50% off — Limited spots</p>
                </div>
                <ul className="mt-6 space-y-3">
                  {["Full bot access for XAUUSD", "AI analysis 24/5", "Telegram trade alerts", "Risk management built-in", "Setup assistance", "Email support"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <Check className="h-4 w-4 text-gold-500 mt-0.5 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="block mt-8">
                  <Button className="w-full bg-gold-500 hover:bg-gold-400 text-neutral-950 font-semibold h-11 transition-colors duration-200">
                    Join Beta Now
                  </Button>
                </Link>
              </div>
            </MovingBorder>
          </StaggerItem>

          {/* Monthly — CardSpotlight */}
          <StaggerItem>
            <CardSpotlight className="p-8 h-full">
              <h3 className="text-lg font-semibold text-white">Monthly</h3>
              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">₹2,999</span>
                  <span className="text-sm text-slate-400">/month</span>
                </div>
              </div>
              <ul className="mt-6 space-y-3">
                {["Full bot access for XAUUSD", "AI analysis 24/5", "Telegram trade alerts", "Risk management built-in", "Email support"].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <Check className="h-4 w-4 text-gold-500 mt-0.5 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block mt-8">
                <Button variant="outline" className="w-full border-slate-700 text-white hover:bg-white/5 h-11 transition-all duration-300">
                  Get Started
                </Button>
              </Link>
            </CardSpotlight>
          </StaggerItem>

          {/* Quarterly — GlareCard (Most Popular) */}
          <StaggerItem>
            <GlareCard className="relative h-full">
              <div className="absolute -top-px left-1/2 -translate-x-1/2 px-3 py-1 rounded-b-sm bg-gold-500 text-xs mono-label font-bold text-neutral-950 z-10">
                Most Popular
              </div>
              <div className="p-8">
                <h3 className="text-lg font-semibold text-white">Quarterly</h3>
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">₹7,999</span>
                    <span className="text-sm text-slate-400">/quarter</span>
                  </div>
                  <p className="text-xs text-emerald-400/80 mt-2">Save ₹1,000 vs monthly</p>
                </div>
                <ul className="mt-6 space-y-3">
                  {["Everything in Monthly", "Priority email support", "Advanced risk settings", "Performance reports", "Early access to new features"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <Check className="h-4 w-4 text-gold-500 mt-0.5 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="block mt-8">
                  <Button className="w-full bg-gold-500 hover:bg-gold-400 text-neutral-950 font-semibold h-11 transition-colors duration-200">
                    Get Started
                  </Button>
                </Link>
              </div>
            </GlareCard>
          </StaggerItem>

          {/* Yearly — CardSpotlight */}
          <StaggerItem>
            <CardSpotlight className="p-8 h-full">
              <div className="inline-flex items-center gap-2 rounded-sm bg-white/5 border border-white/15 px-2.5 py-1 text-xs mono-label text-slate-300 mb-4">
                <Zap className="h-3 w-3" /> Best for Pros
              </div>
              <h3 className="text-lg font-semibold text-white">Yearly</h3>
              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">₹24,999</span>
                  <span className="text-sm text-slate-400">/year</span>
                </div>
                <p className="text-xs text-emerald-400/80 mt-2">Save ₹11,000 vs monthly</p>
              </div>
              <ul className="mt-6 space-y-3">
                {["Everything in Quarterly", "Dedicated account manager", "Custom strategy requests", "API access", "White-glove onboarding"].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <Check className="h-4 w-4 text-gold-500 mt-0.5 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block mt-8">
                <Button variant="outline" className="w-full border-slate-700 text-white hover:bg-white/5 h-11 transition-all duration-300">
                  Get Started
                </Button>
              </Link>
            </CardSpotlight>
          </StaggerItem>
        </StaggerChildren>
      </div>
    </section>
  )
}
