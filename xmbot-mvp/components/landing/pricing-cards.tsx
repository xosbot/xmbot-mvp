"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check, Star, Zap } from "lucide-react"
import { ScrollReveal, StaggerChildren, StaggerItem } from "./scroll-reveal"

export function PricingCards() {
  return (
    <section id="pricing" className="py-24 sm:py-32 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs text-emerald-400 mb-6 uppercase tracking-wider">
              Pricing
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
              Simple,
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">Transparent Pricing</span>
            </h2>
            <p className="mt-6 text-lg text-slate-400 leading-relaxed">
              Choose the plan that fits your trading style. Upgrade anytime.
            </p>
          </div>
        </ScrollReveal>

        <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto" staggerDelay={0.1}>
          {/* Beta */}
          <StaggerItem>
            <div className="relative rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.08] to-black/40 backdrop-blur-sm overflow-hidden group hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-emerald-500/20 via-transparent to-transparent opacity-50" />
              <div className="relative p-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400 mb-4">
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
                      <Check className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="block mt-8">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-11 shadow-lg shadow-emerald-600/20 transition-all duration-300">
                    Join Beta Now
                  </Button>
                </Link>
              </div>
            </div>
          </StaggerItem>

          {/* Monthly */}
          <StaggerItem>
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden group hover:border-white/20 transition-all duration-300 hover:-translate-y-1">
              <div className="p-8">
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
                      <Check className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="block mt-8">
                  <Button variant="outline" className="w-full border-slate-700 text-white hover:bg-white/5 h-11 transition-all duration-300">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </StaggerItem>

          {/* Quarterly — Popular */}
          <StaggerItem>
            <div className="relative rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.06] to-black/40 backdrop-blur-sm overflow-hidden group hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-500/30">
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
                      <Check className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="block mt-8">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-11 shadow-lg shadow-emerald-600/20 transition-all duration-300">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </StaggerItem>

          {/* Yearly */}
          <StaggerItem>
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden group hover:border-white/20 transition-all duration-300 hover:-translate-y-1">
              <div className="p-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/15 border border-violet-500/20 px-3 py-1 text-xs font-medium text-violet-400 mb-4">
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
                      <Check className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="block mt-8">
                  <Button variant="outline" className="w-full border-slate-700 text-white hover:bg-white/5 h-11 transition-all duration-300">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </StaggerItem>
        </StaggerChildren>
      </div>
    </section>
  )
}
