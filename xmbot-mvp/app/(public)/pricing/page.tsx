"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check, Star, Zap } from "lucide-react"
import { MovingBorder } from "@/components/ui/aceternity/moving-border"
import { GlareCard } from "@/components/ui/aceternity/glare-card"
import { CardSpotlight } from "@/components/ui/aceternity/card-spotlight"
import { ScrollReveal } from "@/components/landing/scroll-reveal"
import { PLANS } from "@/lib/plans"

const plans = [
  {
    name: PLANS.beta.name,
    price: PLANS.beta.label,
    period: PLANS.beta.period,
    badge: { text: "Best Value", icon: Star },
    features: [
      "Full bot access for XAUUSD",
      "AI analysis 24/5",
      "Telegram trade alerts",
      "Risk management built-in",
      "Setup assistance",
      "Email support",
    ],
    cta: "Join Beta Now",
    highlighted: true,
  },
  {
    name: PLANS.monthly.name,
    price: PLANS.monthly.label,
    period: PLANS.monthly.period,
    features: [
      "Full bot access for XAUUSD",
      "AI analysis 24/5",
      "Telegram trade alerts",
      "Risk management built-in",
      "Email support",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: PLANS.quarterly.name,
    price: PLANS.quarterly.label,
    period: PLANS.quarterly.period,
    popular: true,
    savings: "Save ₹1,000 vs monthly",
    features: [
      "Everything in Monthly",
      "Priority email support",
      "Advanced risk settings",
      "Performance reports",
      "Early access to new features",
    ],
    cta: "Get Started",
    highlighted: true,
  },
  {
    name: PLANS.yearly.name,
    price: PLANS.yearly.label,
    period: PLANS.yearly.period,
    badge: { text: "Best for Pros", icon: Zap },
    savings: "Save ₹11,000 vs monthly",
    features: [
      "Everything in Quarterly",
      "Dedicated account manager",
      "Custom strategy requests",
      "API access",
      "White-glove onboarding",
    ],
    cta: "Get Started",
    highlighted: false,
  },
]

export default function PricingPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 rounded-sm border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs mono-label text-gold-400 mb-6">
            // Pricing
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-aggressive">
            Simple,
            <br />
            <span className="text-gradient-gold">Transparent Pricing</span>
          </h1>
          <p className="mt-6 text-lg text-slate-400 leading-relaxed">
            Choose the plan that fits your trading style. Upgrade anytime,
            cancel anytime — no lock-in.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-20">
          {plans.map((plan) =>
            plan.name === "Beta Access" ? (
              <MovingBorder key={plan.name} className="h-full">
                <PlanCard plan={plan} />
              </MovingBorder>
            ) : plan.popular ? (
              <GlareCard key={plan.name} className="relative h-full">
                <div className="absolute -top-px left-1/2 -translate-x-1/2 px-3 py-1 rounded-b-sm bg-gold-500 text-xs mono-label font-bold text-neutral-950 z-10">
                  Most Popular
                </div>
                <PlanCard plan={plan} />
              </GlareCard>
            ) : (
              <CardSpotlight key={plan.name} className="h-full">
                <PlanCard plan={plan} />
              </CardSpotlight>
            )
          )}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white tracking-aggressive text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              { q: "Is there a free trial?", a: "We don't offer a free trial or refunds, but you can start with Paper Trading to test the system risk-free before connecting a live broker, and cancel anytime — you'll keep access through the billing period you've already paid for." },
              { q: "Can I switch plans?", a: "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the change takes effect at your next billing cycle." },
              { q: "What payment methods do you accept?", a: "We accept all major credit/debit cards, UPI, net banking, and popular wallets through our secure payment partner Cashfree." },
              { q: "Do I need a Binance account?", a: "No. You can start with Paper Trading to test the system risk-free. When you're ready for live trading, connect your Binance account via API keys." },
            ].map((faq) => (
              <div key={faq.q} className="p-6 rounded-md border border-white/10 bg-white/[0.03]">
                <h3 className="text-base font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-20">
          <p className="text-slate-400 mb-6">
            Still have questions? Contact us at{" "}
            <a href="mailto:support@xmbot.online" className="text-gold-400 hover:text-gold-300">
              support@xmbot.online
            </a>
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-gold-500 hover:bg-gold-400 text-neutral-950 font-semibold px-10 h-14 transition-colors duration-200">
              Set Up in 15 Minutes
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function PlanCard({ plan }: { plan: typeof plans[number] }) {
  return (
    <div className="p-8 h-full flex flex-col">
      {plan.badge && (
        <div className="inline-flex items-center gap-2 rounded-sm bg-gold-500/10 border border-gold-500/30 px-2.5 py-1 text-xs mono-label text-gold-400 mb-4 self-start">
          <plan.badge.icon className="h-3 w-3" /> {plan.badge.text}
        </div>
      )}
      <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
      <div className="mt-4">
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-4xl font-bold text-white">{plan.price}</span>
          <span className="text-sm text-slate-400">{plan.period}</span>
        </div>
        {plan.savings && <p className="text-xs text-emerald-400/80 mt-2">{plan.savings}</p>}
      </div>
      <ul className="mt-6 space-y-3 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
            <Check className="h-4 w-4 text-gold-500 mt-0.5 flex-shrink-0" />{f}
          </li>
        ))}
      </ul>
      <Link href="/register" className="block mt-8">
        <Button
          className={`w-full h-11 transition-colors duration-200 ${
            plan.highlighted
              ? "bg-gold-500 hover:bg-gold-400 text-neutral-950 font-semibold"
              : "border-white/15 text-white hover:bg-white/5"
          }`}
          variant={plan.highlighted ? "default" : "outline"}
        >
          {plan.cta}
        </Button>
      </Link>
    </div>
  )
}
