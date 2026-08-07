"use client"

import { Topbar } from "@/components/dashboard/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, Search, BarChart3, Activity, Shield, BookOpen, Zap, Target, CheckCircle2, Clock } from "lucide-react"

const agents = [
  {
    icon: Search,
    name: "Technical Analyst",
    status: "active",
    lastSignal: "2 min ago",
    signalsToday: 12,
    accuracy: "68%",
    description: "Scans RSI, Supertrend, ADX across multiple timeframes",
    color: "gold",
  },
  {
    icon: BarChart3,
    name: "Fundamental Analyst",
    status: "active",
    lastSignal: "15 min ago",
    signalsToday: 4,
    accuracy: "72%",
    description: "Earnings, P/E, macro data, sector analysis",
    color: "emerald",
  },
  {
    icon: Brain,
    name: "AI Validator",
    status: "active",
    lastSignal: "2 min ago",
    signalsToday: 8,
    accuracy: "85%",
    description: "Gemini + Claude consensus validation",
    color: "blue",
  },
  {
    icon: Activity,
    name: "Regime Detector",
    status: "active",
    lastSignal: "5 min ago",
    signalsToday: 6,
    accuracy: "79%",
    description: "Trending/ranging/volatile classification",
    color: "orange",
  },
  {
    icon: Shield,
    name: "Risk Advisor",
    status: "active",
    lastSignal: "1 min ago",
    signalsToday: 8,
    accuracy: "94%",
    description: "Position sizing, drawdown limits, portfolio risk",
    color: "red",
  },
  {
    icon: BookOpen,
    name: "Trade Journal",
    status: "active",
    lastSignal: "1 hr ago",
    signalsToday: 1,
    accuracy: "—",
    description: "NLP analysis, pattern detection, daily summaries",
    color: "purple",
  },
]

const colorMap: Record<string, { bg: string; border: string; icon: string; tag: string }> = {
  gold: { bg: "bg-gold-500/10", border: "border-gold-200", icon: "text-gold-600", tag: "bg-gold-50 text-gold-700 border-gold-200" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-200", icon: "text-emerald-600", tag: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  blue: { bg: "bg-blue-500/10", border: "border-blue-200", icon: "text-blue-600", tag: "bg-blue-50 text-blue-700 border-blue-200" },
  orange: { bg: "bg-orange-500/10", border: "border-orange-200", icon: "text-orange-600", tag: "bg-orange-50 text-orange-700 border-orange-200" },
  red: { bg: "bg-red-500/10", border: "border-red-200", icon: "text-red-600", tag: "bg-red-50 text-red-700 border-red-200" },
  purple: { bg: "bg-purple-500/10", border: "border-purple-200", icon: "text-purple-600", tag: "bg-purple-50 text-purple-700 border-purple-200" },
}

export default function AgentsPage() {
  return (
    <>
      <Topbar title="AI Agents" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        {/* Pipeline */}
        <Card className="bg-card border-border rounded-md">
          <CardHeader>
            <CardTitle className="text-foreground text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-gold-600" />
              Signal Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {["Technical Scan", "Fundamental Check", "Regime Filter", "AI Consensus", "Risk Validation", "Signal Sent"].map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-lg bg-gold-500/10 border border-gold-200 text-gold-700 font-medium mono-label">
                    {step}
                  </div>
                  {i < 5 && <span className="text-muted-foreground">→</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Agent cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const c = colorMap[agent.color]
            return (
              <Card key={agent.name} className={`bg-card border-border rounded-md hover:border-gold-200 transition-colors`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
                        <agent.icon className={`h-5 w-5 ${c.icon}`} />
                      </div>
                      <div>
                        <CardTitle className="text-foreground text-sm">{agent.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{agent.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] text-emerald-600 mono-label">ACTIVE</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2 rounded-lg bg-accent border border-border">
                      <div className="text-lg font-bold font-mono text-foreground">{agent.signalsToday}</div>
                      <div className="text-[10px] text-muted-foreground">Signals Today</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-accent border border-border">
                      <div className="text-lg font-bold font-mono text-foreground">{agent.accuracy}</div>
                      <div className="text-[10px] text-muted-foreground">Accuracy</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-accent border border-border">
                      <div className="text-xs font-mono text-muted-foreground flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3" />
                        {agent.lastSignal}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Last Signal</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>
    </>
  )
}
