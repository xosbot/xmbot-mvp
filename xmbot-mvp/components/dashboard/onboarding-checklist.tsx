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
      title: "Connect Binance",
      description: "Add your Binance API keys to start live trading",
      icon: Wallet,
      href: "/dashboard/settings",
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
    <Card className="bg-gradient-to-br from-gold-500/5 to-transparent border-gold-500/20 rounded-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-gold-400" />
            Quick Setup
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">{completedCount}/{steps.length}</span>
            <button
              onClick={() => setDismissed(true)}
              className="text-slate-500 hover:text-white transition-colors"
              aria-label="Dismiss checklist"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 rounded-full bg-slate-800 mt-2">
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
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20"
              )}
            >
              {step.completed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-slate-500 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", step.completed ? "text-emerald-300" : "text-white")}>
                  {step.title}
                </p>
                <p className="text-xs text-slate-500 truncate">{step.description}</p>
              </div>
              <step.icon className={cn("h-4 w-4 flex-shrink-0", step.completed ? "text-emerald-400" : "text-slate-500")} />
            </Link>
          ))}
        </div>
        {completedCount === steps.length - 1 && (
          <p className="text-xs text-gold-400 mt-3 text-center">Almost there! Complete the last step to start trading.</p>
        )}
      </CardContent>
    </Card>
  )
}
