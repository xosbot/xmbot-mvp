import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Star, Lock, Sparkles } from "lucide-react"
import { PLANS } from "@/lib/cashfree"

const betaFeatures = [
  "Full bot access for XAUUSD",
  "Auto-execution 24/5",
  "Telegram trade alerts with Approve/Reject",
  "Risk management built-in",
  "Setup assistance",
  "Email support",
  "Dashboard access",
]

const futurePlans = [PLANS.monthly, PLANS.quarterly, PLANS.yearly]

export function PricingCards() {
  return (
    <section id="pricing" className="py-20 sm:py-28 border-t border-slate-800/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/50 bg-slate-800/50 px-4 py-1.5 text-xs text-slate-400 mb-4 uppercase tracking-wider">
            <Sparkles className="h-3 w-3" />
            Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-slate-400">
            Join our exclusive beta program at a special launch price.
          </p>
        </div>

        {/* Beta card */}
        <div className="max-w-md mx-auto mb-20">
          <Card className="relative overflow-hidden bg-gradient-to-b from-emerald-500/[0.08] to-slate-900/60 border-emerald-500/20 backdrop-blur-sm">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500/40 via-emerald-400 to-emerald-500/40" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_70%)]" />

            <CardHeader className="text-center pb-2 relative">
              <Badge className="mx-auto mb-3 bg-emerald-500/15 text-emerald-400 border-emerald-500/20">
                <Star className="h-3 w-3 mr-1" />
                Beta Access — Limited Spots
              </Badge>
              <CardTitle className="text-white text-2xl">Beta Program</CardTitle>
              <div className="mt-4">
                <span className="text-slate-600 line-through text-lg">{PLANS.beta.originalLabel}</span>
                <div className="text-5xl font-bold text-white mt-1 tracking-tight">{PLANS.beta.label}</div>
                <p className="text-sm text-emerald-400/80 mt-1">{PLANS.beta.discountLabel} — First 10 customers only</p>
              </div>
            </CardHeader>
            <CardContent className="pt-6 relative">
              <ul className="space-y-3">
                {betaFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-slate-300">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="relative">
              <Link href="/register" className="w-full">
                <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20">
                  Join Beta Now
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        {/* Future plans */}
        <div className="text-center mb-8">
          <p className="text-xs text-slate-500 uppercase tracking-widest">Coming Soon</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
          {futurePlans.map((plan) => (
            <Card key={plan.name} className="bg-slate-900/30 border-slate-800/60 opacity-60">
              <CardHeader className="text-center">
                {plan.popular && (
                  <Badge variant="secondary" className="mx-auto mb-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    Most Popular
                  </Badge>
                )}
                <CardTitle className="text-white text-lg">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-white">{plan.label}</span>
                  <span className="text-slate-500 text-sm">{plan.period}</span>
                </div>
              </CardHeader>
              <CardFooter>
                <Button size="sm" variant="outline" className="w-full border-slate-700 text-slate-500" disabled>
                  <Lock className="h-3 w-3 mr-2" />
                  Coming Soon
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
