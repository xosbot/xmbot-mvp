import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Bot, Users, Shield, BarChart3, Building2, Workflow, Bell, Cpu } from "lucide-react"

const features = [
  {
    title: "Multi-Agent Architecture",
    description: "Technical Analysis Agent for setups, AI validation via Gemini/Claude, and future agents for sentiment, fundamentals, and risk analysis.",
    icon: Cpu,
  },
  {
    title: "Human-in-the-Loop",
    description: "Every signal goes through you. Approve, reject, or modify on Telegram before execution. You stay in control, the bot does the work.",
    icon: Users,
  },
  {
    title: "Multi-Broker Support",
    description: "Works with Paper Trading, MetaTrader 5, and Interactive Brokers. Switch brokers without changing your strategy or configuration.",
    icon: Building2,
  },
  {
    title: "Risk Engine",
    description: "Built-in position sizing, daily loss limits, max drawdown protection, and per-trade stop-loss enforcement. Your risk rules are non-negotiable.",
    icon: Shield,
  },
  {
    title: "Backtested Strategy",
    description: "RSI + Supertrend + ADX strategy validated on 6 months of XAUUSD M5 data. 64% win rate, +84.3% return, 4.3% max drawdown.",
    icon: BarChart3,
  },
  {
    title: "Telegram Integration",
    description: "Real-time signal cards with Approve/Reject/Modify buttons. Trade alerts, performance summaries, and system status — all in your chat.",
    icon: Bell,
  },
  {
    title: "Disciplined Execution",
    description: "No emotions, no revenge trading, no FOMO. The engine follows the system precisely, executing only when all conditions are met.",
    icon: Workflow,
  },
  {
    title: "Live Dashboard",
    description: "Web dashboard with live positions, P&L tracking, signal history, and engine status. Monitor your bots from any device.",
    icon: Bot,
  },
]

export function FeaturesGrid() {
  return (
    <section id="features" className="py-20 sm:py-28 border-t border-slate-800/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/50 bg-slate-800/50 px-4 py-1.5 text-xs text-slate-400 mb-4 uppercase tracking-wider">
            <Workflow className="h-3 w-3" />
            Platform
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Built for Serious Traders
          </h2>
          <p className="mt-4 text-slate-400">
            Everything you need to run a disciplined, automated gold trading operation.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group bg-slate-900/40 border-slate-800/60 hover:border-emerald-500/20 hover:bg-slate-900/60 transition-all duration-300"
            >
              <CardHeader>
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-2 group-hover:bg-emerald-500/20 transition-colors">
                  <feature.icon className="h-4 w-4 text-emerald-400" />
                </div>
                <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-400 leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
