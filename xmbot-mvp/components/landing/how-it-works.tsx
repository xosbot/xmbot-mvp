import { Card } from "@/components/ui/card"
import { Brain, CheckCircle, TrendingUp, CircuitBoard } from "lucide-react"

const steps = [
  {
    step: "01",
    title: "AI Agents Analyze",
    description: "Technical Analysis Agent scans XAUUSD on M5 timeframe. RSI + Supertrend + ADX filter isolates high-probability entries with 64% win rate.",
    icon: Brain,
    badge: "emerald",
  },
  {
    step: "02",
    title: "Risk Check & You Approve",
    description: "Risk engine enforces 2% max risk per trade and daily limits. You receive a signal card on Telegram with Approve / Reject buttons. No auto-execution without your say.",
    icon: CheckCircle,
    badge: "violet",
  },
  {
    step: "03",
    title: "Executed with Risk Controls",
    description: "Approved signals go through the Risk Engine — max drawdown, daily loss limits, position sizing. Then executed via your broker (Paper, MT5, or IBKR).",
    icon: TrendingUp,
    badge: "emerald",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute right-0 top-1/2 h-[400px] w-[400px] rounded-full bg-emerald-500/5 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/50 bg-slate-800/50 px-4 py-1.5 text-xs text-slate-400 mb-4 uppercase tracking-wider">
            <CircuitBoard className="h-3 w-3" />
            Pipeline
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            From Signal to Trade in 3 Steps
          </h2>
          <p className="mt-4 text-slate-400">
            Every trade goes through the same disciplined pipeline. No shortcuts, no emotions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative">
          <div className="hidden md:block absolute top-1/2 left-[20%] right-[20%] h-px bg-gradient-to-r from-emerald-500/40 via-slate-700 to-violet-500/40 -translate-y-1/2" />

          {steps.map((s) => (
            <Card
              key={s.step}
              className={`relative bg-slate-900/60 border-slate-800 transition-colors backdrop-blur-sm ${
                s.badge === "emerald"
                  ? "hover:border-emerald-500/30"
                  : "hover:border-violet-500/30"
              }`}
            >
              <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${
                s.badge === "emerald"
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-violet-500/20 text-violet-400 border-violet-500/30"
              }`}>
                {s.step}
              </div>

              <div className="p-6">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${
                  s.badge === "emerald" ? "bg-emerald-500/10" : "bg-violet-500/10"
                }`}>
                  <s.icon className={`h-5 w-5 ${
                    s.badge === "emerald" ? "text-emerald-400" : "text-violet-400"
                  }`} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
