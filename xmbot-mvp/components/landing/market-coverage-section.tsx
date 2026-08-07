"use client"

import { ScrollReveal, StaggerChildren, StaggerItem } from "./scroll-reveal"
import { Globe, TrendingUp, Bitcoin, BarChart3, Building2, Landmark } from "lucide-react"

const markets = [
  {
    region: "India",
    color: "orange" as const,
    icon: Landmark,
    markets: [
      { name: "NSE / BSE Stocks", desc: "5,000+ listed companies" },
      { name: "Mutual Funds", desc: "Direct plan recommendations" },
      { name: "Gold (XAUUSD)", desc: "Via MCX & international" },
      { name: "ETFs", desc: "Equity & debt ETFs" },
    ],
  },
  {
    region: "United States",
    color: "blue" as const,
    icon: Building2,
    markets: [
      { name: "NYSE / NASDAQ", desc: "10,000+ stocks & ETFs" },
      { name: "Crypto", desc: "BTC, ETH, 200+ coins" },
      { name: "Forex", desc: "Major & minor pairs" },
      { name: "Commodities", desc: "Gold, silver, oil" },
    ],
  },
  {
    region: "Global",
    color: "gold" as const,
    icon: Globe,
    markets: [
      { name: "Gold (XAUUSD)", desc: "Our core strength" },
      { name: "Crypto (Binance)", desc: "Futures & spot" },
      { name: "Forex Majors", desc: "EUR/USD, GBP/USD, USD/JPY" },
      { name: "Index CFDs", desc: "S&P 500, Nasdaq 100" },
    ],
  },
]

function MarketCard({ market, index }: { market: typeof markets[0]; index: number }) {
  const colorMap = {
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      icon: "text-orange-600",
      dot: "bg-orange-500",
      badge: "bg-orange-100 text-orange-700 border-orange-200",
    },
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "text-blue-600",
      dot: "bg-blue-500",
      badge: "bg-blue-100 text-blue-700 border-blue-200",
    },
    gold: {
      bg: "bg-gold-50",
      border: "border-gold-200",
      icon: "text-gold-700",
      dot: "bg-gold-500",
      badge: "bg-gold-100 text-gold-700 border-gold-200",
    },
  }

  const colors = colorMap[market.color]

  return (
    <StaggerItem>
      <div className={`rounded-xl border ${colors.border} ${colors.bg} p-6 sm:p-8 h-full transition-all duration-300 hover:shadow-md`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center`}>
            <market.icon className={`h-6 w-6 ${colors.icon}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{market.region}</h3>
            <div className={`inline-flex items-center gap-1.5 text-xs mono-label px-2 py-0.5 rounded-sm border ${colors.badge}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
              Live
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {market.markets.map((m) => (
            <div key={m.name} className="flex items-start gap-3">
              <div className={`w-1.5 h-1.5 rounded-full ${colors.dot} mt-2 flex-shrink-0`} />
              <div>
                <div className="text-sm font-medium text-foreground">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </StaggerItem>
  )
}

export function MarketCoverageSection() {
  return (
    <section id="markets" className="py-24 sm:py-32 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 rounded-sm border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs mono-label text-gold-700 mb-6">
              // Market Coverage
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium text-foreground tracking-tight">
              Every Market.
              <br />
              <span className="text-gradient-gold">One Platform.</span>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              From NSE stocks to global crypto — AI scans opportunities across every major market.
              India-first, global-ready.
            </p>
          </div>
        </ScrollReveal>

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-6" staggerDelay={0.15}>
          {markets.map((market, i) => (
            <MarketCard key={market.region} market={market} index={i} />
          ))}
        </StaggerChildren>

        <ScrollReveal>
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 rounded-xl border border-border bg-card px-6 py-3 shadow-sm">
              <Globe className="h-4 w-4 text-gold-600" />
              <span className="text-sm text-muted-foreground">
                <span className="text-foreground font-medium">50+ markets</span> across 3 continents — and growing
              </span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
