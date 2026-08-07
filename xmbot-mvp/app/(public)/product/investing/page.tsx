import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, PieChart, TrendingUp, Shield, Target, BarChart3, Wallet, CheckCircle2, Landmark, Building2, Globe } from "lucide-react"

const advisoryServices = [
  {
    icon: PieChart,
    title: "Portfolio Review",
    description: "Upload or connect your current holdings. AI analyzes your portfolio across asset classes, identifies concentration risk, and suggests optimizations based on your risk profile and time horizon.",
    details: ["Asset allocation analysis", "Sector concentration check", "Correlation mapping", "Risk-adjusted scoring"],
  },
  {
    icon: TrendingUp,
    title: "Mutual Fund Recommendations",
    description: "Direct plan mutual fund suggestions for Indian investors. AI evaluates NAV history, expense ratios, fund manager track record, and category performance to recommend funds aligned with your goals.",
    details: ["Direct plan focus (lower expense)", "Tax-efficient fund selection", "SIP optimization", "ELSS for 80C"],
  },
  {
    icon: Target,
    title: "Stock Picks",
    description: "Fundamental + technical analysis combined. AI scores stocks on growth potential, value metrics, momentum, and quality. Covers NSE/BSE (India) and NYSE/NASDAQ (US).",
    details: ["Earnings growth scoring", "P/E & P/B value analysis", "Momentum & trend signals", "India + US markets"],
  },
  {
    icon: Shield,
    title: "Risk Rebalancing",
    description: "Quarterly portfolio rebalancing suggestions. AI monitors your target allocation and alerts you when drift exceeds thresholds. Maintains your risk profile through market cycles.",
    details: ["Target allocation monitoring", "Drift alerts", "Tax-loss harvesting", "Rebalancing calendar"],
  },
  {
    icon: BarChart3,
    title: "Goal-Based Planning",
    description: "Build investment roadmaps for life goals — retirement, education, home purchase, emergency fund. AI projects growth trajectories and suggests monthly investment amounts.",
    details: ["Retirement planning", "Education fund modeling", "Emergency fund calculator", "Monthly SIP recommendations"],
  },
  {
    icon: Wallet,
    title: "Tax Optimization",
    description: "Maximize returns after tax. For Indian investors: LTCG/STCG planning, ELSS recommendations, tax-loss harvesting. For US: wash sale avoidance, tax-efficient fund placement.",
    details: ["LTCG/STCG optimization (India)", "ELSS for 80C deductions", "Tax-loss harvesting", "Wash sale prevention (US)"],
  },
]

const marketSupport = [
  {
    icon: Landmark,
    region: "India",
    items: ["NSE / BSE Stocks", "Mutual Funds (Direct Plans)", "Gold (MCX & International)", "ETFs (Equity & Debt)", "Bonds & Fixed Income"],
  },
  {
    icon: Building2,
    region: "United States",
    items: ["NYSE / NASDAQ Stocks", "ETFs (SPY, QQQ, VTI)", "Crypto (BTC, ETH, 200+)", "Forex Major Pairs", "Commodities (Gold, Oil)"],
  },
  {
    icon: Globe,
    region: "Global",
    items: ["Gold (XAUUSD)", "Crypto (Binance Futures)", "Forex (EUR/USD, GBP/USD)", "Index CFDs (S&P 500)", "Commodities (Silver, Platinum)"],
  },
]

export default function InvestingPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 rounded-sm border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs mono-label text-gold-700 mb-6">
            // Investment Advisory
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium text-foreground tracking-tight">
            More Than Trading.
            <br />
            <span className="text-gradient-gold">Complete Financial Advisory.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            From short-term trades to long-term wealth building — AI guides every decision.
            Your personal financial advisor, powered by six specialized agents.
          </p>
        </div>

        {/* Advisory services */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {advisoryServices.map((service) => (
            <div key={service.title} className="p-6 rounded-xl border border-border bg-card hover:border-gold-200 hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center mb-4">
                <service.icon className="h-6 w-6 text-gold-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{service.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{service.description}</p>
              <div className="space-y-1.5">
                {service.details.map((d) => (
                  <div key={d} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                    {d}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Market coverage */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-foreground tracking-tight">
              Market Coverage
            </h2>
            <p className="mt-4 text-muted-foreground">Investment advisory across India, US, and global markets.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {marketSupport.map((market) => (
              <div key={market.region} className="p-6 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-3 mb-4">
                  <market.icon className="h-5 w-5 text-gold-600" />
                  <h3 className="font-semibold text-foreground">{market.region}</h3>
                </div>
                <div className="space-y-2">
                  {market.items.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold-400 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk engine highlight */}
        <div className="rounded-xl border border-border bg-card p-8 sm:p-12 mb-20">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-sm border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs mono-label text-emerald-700 mb-4">
                <Shield className="h-3 w-3" />
                Built-In Risk Engine
              </div>
              <h2 className="font-serif text-3xl font-medium text-foreground tracking-tight mb-4">
                Your Capital, Protected by Design
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Risk management isn&apos;t a feature — it&apos;s the architecture. Every trade goes through the Risk Advisor before execution.
                Position sizing, drawdown limits, and daily loss caps are enforced at the engine level.
              </p>
              <div className="space-y-3">
                {["2% max risk per trade", "Daily loss limits", "Max drawdown protection", "Per-user position limits", "Real-time portfolio risk monitoring"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 rounded-xl border border-border bg-accent">
              <div className="text-center mb-6">
                <div className="text-4xl font-bold font-mono text-foreground">4.3%</div>
                <div className="text-sm text-muted-foreground mt-1">Max Drawdown (Backtested)</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-card border border-border">
                  <div className="text-xl font-bold font-mono text-emerald-600">64%</div>
                  <div className="text-xs text-muted-foreground">Win Rate</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-card border border-border">
                  <div className="text-xl font-bold font-mono text-emerald-600">2.1x</div>
                  <div className="text-xs text-muted-foreground">Profit Factor</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-medium text-foreground tracking-tight mb-4">
            Start Building Wealth
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Free tier includes paper trading and basic advisory. Upgrade for full AI analysis and live trading.
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
