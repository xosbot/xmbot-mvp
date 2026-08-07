"use client"

import Link from "next/link"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, MessageSquare, Shield, Wallet, Zap, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  completed: boolean
}

export function OnboardingChecklist() {
  const [dismissed, setDismissed] = useState(false)
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: "telegram",
      title: "Connect Telegram",
      description: "Link your Telegram to receive trade signals and approve trades",
      icon: MessageSquare,
      href: "/dashboard/settings",
      completed: false,
    },
    {
      id: "risk",
      title: "Set Risk Limits",
      description: "Configure max daily loss, position size, and stop loss defaults",
      icon: Shield,
      href: "/dashboard/settings",
      completed: false,
    },
    {
      id: "broker",
      title: "Connect Broker",
      description: "Add your broker API keys to start live trading",
      icon: Wallet,
      href: "/dashboard/brokers",
      completed: false,
    },
    {
      id: "engine",
      title: "Start Engine",
      description: "Activate the trading engine to begin scanning for signals",
      icon: Zap,
      href: "/dashboard",
      completed: false,
    },
  ])

  const completedCount = steps.filter((s) => s.completed).length
  const allDone = completedCount === steps.length

  if (dismissed || allDone) return null

  return (
    <Card className="bg-gradient-to-br from-gold-500/5 to-transparent border-gold-200 rounded-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-gold-600" />
            Quick Setup
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{completedCount}/{steps.length}</span>
            <button
              onClick={() => setDismissed(true)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss checklist"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 rounded-full bg-accent mt-2">
          <div
            className="h-full rounded-full bg-gold-500 transition-all duration-500"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((step) => (
            <Link
              key={step.id}
              href={step.href}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200",
                step.completed
                  ? "border-emerald-200 bg-emerald-500/5"
                  : "border-border bg-accent/50 hover:bg-accent hover:border-gold-200"
              )}
            >
              {step.completed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", step.completed ? "text-emerald-600" : "text-foreground")}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">{step.description}</p>
              </div>
              <step.icon className={cn("h-4 w-4 flex-shrink-0", step.completed ? "text-emerald-600" : "text-muted-foreground")} />
            </Link>
          ))}
        </div>
        {completedCount === steps.length - 1 && (
          <p className="text-xs text-gold-600 mt-3 text-center">Almost there! Complete the last step to start trading.</p>
        )}
      </CardContent>
    </Card>
  )
}
