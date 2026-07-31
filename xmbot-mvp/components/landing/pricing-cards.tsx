"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check, Star, Lock } from "lucide-react"

export function PricingCards() {
  return (
    <section id="pricing" className="py-24 sm:py-32 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs text-muted-foreground mb-6 uppercase tracking-wider">
            Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            Simple,
            <br />
            <span className="text-gradient">Transparent Pricing</span>
          </h2>
          <p className="mt-6 text-lg text-slate-400 leading-relaxed">
            Join our exclusive beta program at a special launch price.
          </p>
        </div>

        {/* Beta Card — Featured */}
        <div className="max-w-lg mx-auto mb-16">
          <div className="relative rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.08] to-card backdrop-blur-sm overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
            {/* Glow */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-emerald-500/20 via-transparent to-transparent opacity-50" />

            <div className="relative p-8 sm:p-10">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400 mb-6">
                <Star className="h-3 w-3" />
                Beta Access — Limited Spots
              </div>

              {/* Price */}
              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg text-slate-500 line-through">₹19,999</span>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-5xl font-bold text-white">₹9,999</span>
                  <span className="text-lg text-slate-400">/3 months</span>
                </div>
                <p className="text-sm text-emerald-400/80 mt-2">50% off — First 10 customers only</p>
              </div>

              {/* Features */}
              <ul className="space-y-3.5 mb-8">
                {[
                  "Full bot access for XAUUSD",
                  "AI analysis 24/5 with Telegram alerts",
                  "Approve/Reject every trade on Telegram",
                  "Risk management built-in",
                  "Setup assistance",
                  "Email support",
                  "Dashboard access",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-slate-300">
                    <Check className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link href="/register" className="block">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-12 text-base shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/30 transition-all duration-300">
                  Join Beta Now
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Future plans */}
        <div className="text-center mb-8">
          <p className="text-xs text-slate-500 uppercase tracking-widest">Coming Soon</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { name: "Monthly", price: "₹2,999", period: "/month" },
            { name: "Quarterly", price: "₹7,999", period: "/quarter", popular: true },
            { name: "Yearly", price: "₹24,999", period: "/year" },
          ].map((plan) => (
            <div
              key={plan.name}
              className="relative p-6 sm:p-8 rounded-2xl border border-border/60 bg-card/30 opacity-60"
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400">
                  Most Popular
                </div>
              )}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-sm text-slate-500">{plan.period}</span>
                </div>
              </div>
              <div className="mt-6">
                <Button disabled className="w-full border-slate-700 text-slate-500" variant="outline">
                  <Lock className="h-3 w-3 mr-2" />
                  Coming Soon
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
