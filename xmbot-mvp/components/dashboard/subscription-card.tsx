"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CreditCard, Clock, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react"

interface SubscriptionData {
  isActive: boolean
  plan: {
    planName: string
    status: string
    startDate: string
    expiryDate: string
    daysLeft: number
    expired: boolean
  } | null
  payments: Array<{
    id: string
    amount: number
    currency: string
    status: string
    plan: string
    date: string
    planLabel: string
  }>
}

export function SubscriptionCard() {
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const res = await fetch("/api/settings/subscription")
      if (res.ok) {
        setData(await res.json())
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading subscription...
      </div>
    )
  }

  if (!data) {
    return <p className="text-sm text-slate-500">Failed to load subscription data.</p>
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white/[0.03] border-white/10 rounded-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Current Plan</h3>
            {data.plan ? (
              data.plan.expired ? (
                <Badge variant="destructive">Expired</Badge>
              ) : (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )
            ) : (
              <Badge variant="secondary">No Plan</Badge>
            )}
          </div>

          {data.plan ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Plan</p>
                  <p className="text-white font-medium">{data.plan.planName}</p>
                </div>
                <div>
                  <p className="text-slate-500">Days Remaining</p>
                  <p className="text-white font-medium">
                    {data.plan.expired ? (
                      <span className="text-red-400">Expired</span>
                    ) : (
                      `${data.plan.daysLeft} days`
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Start Date</p>
                  <p className="text-white">
                    {data.plan.startDate
                      ? new Date(data.plan.startDate).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Expiry Date</p>
                  <p className="text-white">
                    {data.plan.expiryDate
                      ? new Date(data.plan.expiryDate).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>

              {data.plan.daysLeft <= 7 && !data.plan.expired && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Your subscription expires in {data.plan.daysLeft} days. Renew to keep trading.
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              No active subscription. Subscribe to start trading.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/[0.03] border-white/10 rounded-md">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-white mb-4">Payment History</h3>
          {data.payments.length === 0 ? (
            <p className="text-sm text-slate-400">No payments yet.</p>
          ) : (
            <div className="space-y-3">
              {data.payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-sm border-b border-slate-800 pb-3 last:border-0"
                >
                  <div>
                    <p className="text-white">{p.planLabel}</p>
                    <p className="text-slate-500">{new Date(p.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white">
                      {p.currency === "INR" ? "₹" : "$"}
                      {p.amount.toLocaleString()}
                    </p>
                    <Badge
                      variant={p.status === "SUCCESS" ? "default" : p.status === "FAILED" ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {p.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button asChild>
          <a href="/checkout">
            <CreditCard className="h-4 w-4 mr-2" />
            {data.plan?.expired ? "Renew Subscription" : "Upgrade Plan"}
          </a>
        </Button>
      </div>
    </div>
  )
}
