"use client"

import { Topbar } from "@/components/dashboard/topbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SubscriptionCard } from "@/components/dashboard/subscription-card"
import { PLANS } from "@/lib/plans"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Star } from "lucide-react"

export default function SubscriptionPage() {
  return (
    <>
      <Topbar title="Subscription" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SubscriptionCard />
          </div>

          <div className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Available Plans
                </CardTitle>
                <CardDescription>Choose the plan that fits your trading needs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(PLANS).map(([key, plan]) => (
                  <div
                    key={key}
                    className={`p-4 rounded-lg border ${
                      plan.popular
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-slate-700 bg-slate-800/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-white">{plan.name}</h4>
                        {plan.popular && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                            Popular
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-white">{plan.label}</span>
                        <span className="text-sm text-slate-500">{plan.period}</span>
                      </div>
                    </div>
{"discountLabel" in plan && plan.discountLabel && (
                      <p className="text-xs text-emerald-400">{plan.discountLabel}</p>
                    )}
                  </div>
                ))}

                <div className="pt-4">
                  <a
                    href="/pricing"
                    className="text-sm text-emerald-500 hover:underline"
                  >
                    Compare all features →
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-400">
                  Questions about billing or your subscription?
                </p>
                <a
                  href="/contact"
                  className="inline-flex items-center text-sm text-emerald-500 hover:underline"
                >
                  Contact Support →
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}
