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
            <Card className="bg-card border-border rounded-md">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Available Plans
                </CardTitle>
                <CardDescription>Choose the plan that fits your trading needs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(PLANS).map(([key, plan]) => (
                  <div
                    key={key}
                    className={`p-4 rounded-md border ${
                      plan.popular
                        ? "border-gold-500/30 bg-gold-500/5"
                        : "border-border bg-accent"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-foreground">{plan.name}</h4>
                        {plan.popular && (
                          <Badge className="bg-gold-500/20 text-gold-600 border-gold-500/30 text-xs rounded-sm">
                            Popular
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-foreground">{plan.label}</span>
                        <span className="text-sm text-muted-foreground">{plan.period}</span>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="pt-4">
                  <a
                    href="/pricing"
                    className="text-sm text-gold-600 hover:underline"
                  >
                    Compare all features →
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border rounded-md">
              <CardHeader>
                <CardTitle className="text-foreground">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Questions about billing or your subscription?
                </p>
                <a
                  href="/contact"
                  className="inline-flex items-center text-sm text-gold-600 hover:underline"
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
