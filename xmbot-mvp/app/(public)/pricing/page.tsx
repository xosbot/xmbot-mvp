"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check, Star, Zap } from "lucide-react"
import { MovingBorder } from "@/components/ui/aceternity/moving-border"
import { GlareCard } from "@/components/ui/aceternity/glare-card"
import { CardSpotlight } from "@/components/ui/aceternity/card-spotlight"
import { ScrollReveal } from "@/components/landing/scroll-reveal"

const plans = [
  {
    name: "Beta Access",
    price: "₹9,999",
    originalPrice: "₹19,999",
    period: "/3 months",
    discount: "50% off — Limited spots",
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
    name: "Monthly",
    price: "₹2,999",
    period: "/month",
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
    name: "Quarterly",
    price: "₹7,999",
    period: "/quarter",
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
    name: "Yearly",
    price: "₹24,999",
    period: "/year",
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
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs text-emerald-400 mb-6 uppercase tracking-wider">
            Pricing
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-aggressive">
            Simple,
            <br />
            <span className="text-gradient-emerald">Transparent Pricing</span>
          </h1>
          <p className="mt-6 text-lg text-slate-400 leading-relaxed">
            Choose the plan that fits your trading style. Upgrade anytime.
            7-day money-back guarantee on all plans.
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
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-500/30 z-10">
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
              { q: "Is there a free trial?", a: "We don't offer a free trial, but we offer a 7-day money-back guarantee. Try XMBot risk-free — if you're not satisfied, we'll refund your full purchase amount." },
              { q: "Can I switch plans?", a: "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the change takes effect at your next billing cycle." },
              { q: "What payment methods do you accept?", a: "We accept all major credit/debit cards, UPI, net banking, and popular wallets through our secure payment partner Cashfree." },
              { q: "Do I need a Binance account?", a: "No. You can start with Paper Trading to test the system risk-free. When you're ready for live trading, connect your Binance account via API keys." },
            ].map((faq) => (
              <div key={faq.q} className="p-6 rounded-2xl border border-white/10 bg-white/5">
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
            <a href="mailto:support@xmbot.online" className="text-emerald-400 hover:text-emerald-300">
              support@xmbot.online
            </a>
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 h-14 shadow-lg shadow-emerald-600/25">
              Start Free Trial
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
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400 mb-4 self-start">
          <plan.badge.icon className="h-3 w-3" /> {plan.badge.text}
        </div>
      )}
      <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
      <div className="mt-4">
        {plan.originalPrice && (
          <span className="text-lg text-slate-500 line-through">{plan.originalPrice}</span>
        )}
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-4xl font-bold text-white">{plan.price}</span>
          <span className="text-sm text-slate-400">{plan.period}</span>
        </div>
        {plan.discount && <p className="text-xs text-emerald-400/80 mt-2">{plan.discount}</p>}
        {plan.savings && <p className="text-xs text-emerald-400/80 mt-2">{plan.savings}</p>}
      </div>
      <ul className="mt-6 space-y-3 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
            <Check className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />{f}
          </li>
        ))}
      </ul>
      <Link href="/register" className="block mt-8">
        <Button
          className={`w-full h-11 transition-all duration-300 ${
            plan.highlighted
              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
              : "border-slate-700 text-white hover:bg-white/5"
          }`}
          variant={plan.highlighted ? "default" : "outline"}
        >
          {plan.cta}
        </Button>
      </Link>
    </div>
  )
}
