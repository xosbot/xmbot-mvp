"use client"

import { ScrollReveal, StaggerChildren, StaggerItem } from "./scroll-reveal"
import { Globe, Building2, Landmark, Clock } from "lucide-react"

const markets = [
  {
    region: "Live Today",
    color: "gold" as const,
    icon: Globe,
    status: "live" as const,
    markets: [
      { name: "Gold (XAUUSD)", desc: "Via Binance PAXG/USDT, plus paper trading" },
      { name: "Crypto (Binance)", desc: "Spot & futures" },
    ],
  },
  {
    region: "India — Roadmap",
    color: "orange" as const,
    icon: Landmark,
    status: "roadmap" as const,
    markets: [
      { name: "NSE / BSE Stocks", desc: "Via Zerodha/Upstox integration" },
      { name: "Mutual Funds", desc: "Direct plan recommendations" },
      { name: "MCX Gold & Commodities", desc: "Domestic gold futures" },
    ],
  },
  {
    region: "Global — Roadmap",
    color: "blue" as const,
    icon: Building2,
    status: "roadmap" as const,
    markets: [
      { name: "NYSE / NASDAQ", desc: "Via Interactive Brokers" },
      { name: "Forex", desc: "Via MetaTrader 5" },
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
            {market.status === "live" ? (
              <div className={`inline-flex items-center gap-1.5 text-xs mono-label px-2 py-0.5 rounded-sm border ${colors.badge}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                Live
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-xs mono-label px-2 py-0.5 rounded-sm border border-border bg-accent text-muted-foreground">
                <Clock className="h-3 w-3" />
                Coming Soon
              </div>
            )}
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
              Gold Today.
              <br />
              <span className="text-gradient-gold">Every Market On The Roadmap.</span>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              XMOne trades XAUUSD gold live today. Stocks, mutual funds, and forex are next —
              built on the same AI pipeline and risk engine.
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
                <span className="text-foreground font-medium">Gold live today.</span> New markets ship as they're built — not before.
              </span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
