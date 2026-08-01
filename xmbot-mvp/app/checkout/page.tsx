"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2, Shield, Star } from "lucide-react"
import { PLANS } from "@/lib/plans"

const betaFeatures = [
  "Full bot access for XAUUSD",
  "AI-powered trading 24/5",
  "Telegram trade alerts",
  "Risk management built-in",
  "Setup assistance",
  "Email support",
  "3 months access",
]

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
      </div>
    )
  }

  if (!session) {
    router.push("/login")
    return null
  }

  const handlePayment = async () => {
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "beta" }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to create order")
        return
      }

      if (data.orderData?.payment_link) {
        window.location.href = data.orderData.payment_link
      } else if (data.paymentSessionId) {
        window.location.href = data.orderData?.payments?.url || `/payment/status?order_id=${data.orderId}`
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md rounded-md bg-white/[0.03] border-white/10 overflow-hidden">
        <div className="h-[3px] bg-gold-500" />
        <CardHeader className="text-center">
          <Badge className="mx-auto mb-2 rounded-sm bg-gold-500/10 text-gold-400 border-gold-500/30">
            <Star className="h-3 w-3 mr-1" />
            Beta Access
          </Badge>
          <CardTitle className="text-white text-2xl">Confirm Your Subscription</CardTitle>
          <div className="mt-4">
            <span className="text-slate-500 line-through text-lg">{PLANS.beta.originalLabel}</span>
            <div className="text-5xl font-bold text-white mt-1">{PLANS.beta.label}</div>
            <p className="text-sm text-emerald-400 mt-1">{PLANS.beta.discountLabel} — Limited spots</p>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-md border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400 mb-4">
              {error}
            </div>
          )}
          <ul className="space-y-3">
            {betaFeatures.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm text-slate-300">
                <Check className="h-4 w-4 text-gold-500 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
            <Shield className="h-3 w-3" />
            Secure payment powered by CashFree
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handlePayment}
            disabled={loading}
            size="lg"
            className="w-full bg-gold-500 hover:bg-gold-400 text-neutral-950 font-semibold transition-colors duration-200"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Pay {PLANS.beta.label}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
