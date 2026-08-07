import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Brain, Search, BarChart3, Activity, Shield, BookOpen, Zap, Target, TrendingUp, CheckCircle2 } from "lucide-react"

const agents = [
  {
    icon: Search,
    name: "Technical Analyst",
    tagline: "Scans charts, patterns, and momentum",
    description: "The first line of analysis. Scans price action across multiple timeframes using RSI, Supertrend, ADX, MACD, and Bollinger Bands. Identifies high-probability setups and flags momentum shifts before they become obvious.",
    markets: ["Gold", "Stocks", "Crypto", "Forex"],
    tools: ["RSI", "Supertrend", "ADX", "MACD", "Bollinger Bands"],
    color: "gold",
  },
  {
    icon: BarChart3,
    name: "Fundamental Analyst",
    tagline: "Earnings, news, and macro data",
    description: "Looks beyond the charts. Analyzes company earnings, revenue growth, P/E ratios, macroeconomic indicators, and sector trends. For mutual funds, evaluates NAV history, expense ratios, and fund manager track records.",
    markets: ["Stocks", "Mutual Funds", "Bonds"],
    tools: ["P/E Ratio", "Revenue Growth", "Macro Data", "Sector Analysis"],
    color: "emerald",
  },
  {
    icon: Brain,
    name: "AI Validator",
    tagline: "Cross-validates with Gemini + Claude",
    description: "The quality gate. Every signal from the Technical and Fundamental agents is cross-validated by two independent LLMs — Google Gemini and Anthropic Claude. Only signals that pass consensus proceed. Disagreements are flagged for human review.",
    markets: ["All signals"],
    tools: ["Multi-model consensus", "Gemini 2.5", "Claude 4"],
    color: "blue",
  },
  {
    icon: Activity,
    name: "Regime Detector",
    tagline: "Trending, ranging, or volatile?",
    description: "Markets change character. The Regime Detector identifies whether the current environment is trending, ranging, or volatile — and adjusts signal confidence accordingly. A great setup in a choppy regime gets downgraded.",
    markets: ["All assets"],
    tools: ["Volatility analysis", "ADX regime", "Historical context"],
    color: "orange",
  },
  {
    icon: Shield,
    name: "Risk Advisor",
    tagline: "Portfolio construction & sizing",
    description: "Protects your capital. Enforces 2% max risk per trade, daily loss limits, and maximum drawdown protection. Calculates optimal position sizes based on your account balance and risk tolerance. Monitors portfolio-level exposure.",
    markets: ["All holdings"],
    tools: ["Position sizing", "Drawdown limits", "Portfolio risk"],
    color: "red",
  },
  {
    icon: BookOpen,
    name: "Trade Journal",
    tagline: "NLP analysis, learnings, patterns",
    description: "Learns from every trade. Uses NLP to analyze your trading patterns, identify recurring mistakes, and surface insights. Generates daily and weekly summaries with actionable recommendations. Tracks win rate, average R:R, and behavioral patterns.",
    markets: ["All trades"],
    tools: ["NLP analysis", "Pattern detection", "Performance reports"],
    color: "purple",
  },
]

const colorMap: Record<string, { bg: string; border: string; icon: string; tag: string; fill: string }> = {
  gold: { bg: "bg-gold-500/10", border: "border-gold-200", icon: "text-gold-600", tag: "bg-gold-50 text-gold-700 border-gold-200", fill: "bg-gold-500/5" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-200", icon: "text-emerald-600", tag: "bg-emerald-50 text-emerald-700 border-emerald-200", fill: "bg-emerald-500/5" },
  blue: { bg: "bg-blue-500/10", border: "border-blue-200", icon: "text-blue-600", tag: "bg-blue-50 text-blue-700 border-blue-200", fill: "bg-blue-500/5" },
  orange: { bg: "bg-orange-500/10", border: "border-orange-200", icon: "text-orange-600", tag: "bg-orange-50 text-orange-700 border-orange-200", fill: "bg-orange-500/5" },
  red: { bg: "bg-red-500/10", border: "border-red-200", icon: "text-red-600", tag: "bg-red-50 text-red-700 border-red-200", fill: "bg-red-500/5" },
  purple: { bg: "bg-purple-500/10", border: "border-purple-200", icon: "text-purple-600", tag: "bg-purple-50 text-purple-700 border-purple-200", fill: "bg-purple-500/5" },
}

export default function AIAgentsPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 rounded-sm border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs mono-label text-gold-700 mb-6">
            // AI Agents
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium text-foreground tracking-tight">
            Six Specialized Agents.
            <br />
            <span className="text-gradient-gold">One Investment Team.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Each agent is an expert in its domain. Together, they find opportunities no single indicator could.
            Consensus required before any signal reaches you.
          </p>
        </div>

        {/* Agent pipeline visualization */}
        <div className="mb-20 rounded-xl border border-border bg-card p-8 sm:p-10">
          <h2 className="text-lg font-semibold text-foreground mb-6 text-center">Signal Pipeline</h2>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            {["Technical Scan", "Fundamental Check", "Regime Filter", "AI Consensus", "Risk Validation", "Signal Sent"].map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-lg bg-gold-500/10 border border-gold-200 text-gold-700 font-medium text-xs mono-label">
                  {step}
                </div>
                {i < 5 && <span className="text-muted-foreground">→</span>}
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">Only signals that pass all stages reach your Telegram</p>
        </div>

        {/* Agent cards */}
        <div className="space-y-8">
          {agents.map((agent) => {
            const c = colorMap[agent.color]
            return (
              <div key={agent.name} className={`rounded-xl border ${c.border} ${c.fill} p-8 sm:p-10`}>
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-xl ${c.bg} flex items-center justify-center`}>
                        <agent.icon className={`h-7 w-7 ${c.icon}`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">{agent.name}</h3>
                        <p className="text-sm text-muted-foreground">{agent.tagline}</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed mb-6">{agent.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {agent.tools.map((tool) => (
                        <span key={tool} className={`text-[10px] mono-label px-2 py-0.5 rounded-sm border ${c.tag}`}>
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center">
                    <div className="text-xs text-muted-foreground mb-2 mono-label">Markets</div>
                    <div className="flex flex-wrap gap-2">
                      {agent.markets.map((m) => (
                        <div key={m} className="flex items-center gap-1.5 text-sm text-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          {m}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-medium text-foreground tracking-tight mb-4">
            See the Agents in Action
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Start with paper trading. Watch how each agent contributes to every signal.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-gold-600 hover:bg-gold-500 text-white font-semibold px-10 h-14 shadow-sm shadow-gold-600/20">
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
