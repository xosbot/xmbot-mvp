import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Brain, Users, Shield, BarChart3, Globe, Zap, ArrowRight, CheckCircle2 } from "lucide-react"

const capabilities = [
  {
    icon: Brain,
    title: "Multi-Agent AI",
    description: "Six specialized agents analyze every signal from multiple angles — technical, fundamental, regime, risk, consensus, and journal.",
    href: "/product/ai-agents",
  },
  {
    icon: Globe,
    title: "Multi-Market",
    description: "Gold, stocks, crypto, forex, mutual funds — across India (NSE/BSE), US (NYSE/NASDAQ), and global exchanges.",
    href: "/product/integrations",
  },
  {
    icon: Users,
    title: "Human-in-the-Loop",
    description: "Every trade requires your approval. Signal cards on Telegram — tap Approve or Reject. No auto-execution.",
    href: "/product/ai-agents",
  },
  {
    icon: Shield,
    title: "Risk Engine",
    description: "2% max risk per trade, daily loss limits, drawdown protection, and per-user position sizing enforced automatically.",
    href: "/product/investing",
  },
  {
    icon: BarChart3,
    title: "Investment Advisory",
    description: "Beyond trading — portfolio review, mutual fund recommendations, stock picks, tax optimization, and goal-based planning.",
    href: "/product/investing",
  },
  {
    icon: Zap,
    title: "Multi-Broker",
    description: "Paper trading, Binance, Zerodha, Interactive Brokers, MT5. Switch brokers without changing your strategy.",
    href: "/product/integrations",
  },
]

export default function ProductPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 rounded-sm border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs mono-label text-gold-700 mb-6">
            // The Platform
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium text-foreground tracking-tight">
            AI Investment Platform
            <br />
            <span className="text-gradient-gold">for Every Market.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Six AI agents. Multiple markets. Human control.
            XMOne combines algorithmic precision with your judgment — the way investing should work.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-gold-600 hover:bg-gold-500 text-white font-semibold px-8 h-12 shadow-sm shadow-gold-600/20">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#capabilities">
              <Button size="lg" variant="outline" className="border-border text-muted-foreground hover:bg-accent h-12">
                Explore Features
              </Button>
            </Link>
          </div>
        </div>

        {/* Capabilities grid */}
        <div id="capabilities" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {capabilities.map((cap) => (
            <Link key={cap.title} href={cap.href} className="group">
              <div className="p-6 rounded-xl border border-border bg-card hover:border-gold-200 hover:shadow-md transition-all duration-300 h-full">
                <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center mb-4 group-hover:bg-gold-500/15 transition-colors">
                  <cap.icon className="h-6 w-6 text-gold-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-gold-700 transition-colors">{cap.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{cap.description}</p>
                <div className="mt-4 flex items-center gap-1 text-sm text-gold-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* How it works summary */}
        <div className="rounded-xl border border-border bg-card p-8 sm:p-12 mb-20">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-foreground tracking-tight">
              How It Works
            </h2>
            <p className="mt-4 text-muted-foreground">From sign-up to first signal in 15 minutes.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Connect", desc: "Link Telegram and set your risk preferences. No code, no install." },
              { step: "02", title: "AI Analyzes", desc: "Six agents scan markets 24/5. Consensus required before any signal." },
              { step: "03", title: "You Decide", desc: "Signal card on Telegram. Tap Approve or Reject. You're in control." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="text-xs font-mono font-bold text-gold-600 mb-2">{s.step}</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust */}
        <div className="text-center">
          <div className="inline-flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            {["Paper trading first", "API keys only — no withdrawal", "2% max risk per trade", "Cancel anytime"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
