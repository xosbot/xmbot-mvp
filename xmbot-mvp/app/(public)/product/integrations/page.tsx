import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2, XCircle, Clock, Landmark, Building2, Globe, Zap, Shield, ExternalLink } from "lucide-react"

const brokers = [
  {
    name: "Paper Trading",
    description: "Test the platform risk-free with simulated trades. Same AI signals, same dashboard — no real money at stake.",
    status: "live" as const,
    markets: ["All markets"],
    features: ["Unlimited paper trades", "Same AI analysis", "Real-time dashboard", "Risk-free testing"],
    recommended: "Start here",
  },
  {
    name: "Binance",
    description: "World's largest crypto exchange. Trade PAXGUSDT (gold-backed token) and 200+ crypto pairs with AI signals.",
    status: "live" as const,
    markets: ["Crypto", "Gold (PAXG)"],
    features: ["Spot & Futures trading", "PAXGUSDT for gold exposure", "Low trading fees", "API key connection"],
    recommended: null,
  },
  {
    name: "Zerodha",
    description: "India's largest stockbroker. Trade NSE/BSE stocks, MCX commodities, and mutual funds with AI-powered analysis.",
    status: "coming" as const,
    markets: ["India Stocks", "MCX Commodities", "Mutual Funds"],
    features: ["NSE & BSE access", "MCX gold futures", "Direct MF plans", "Kite API integration"],
    recommended: "India users",
  },
  {
    name: "Interactive Brokers",
    description: "Global access to 150+ markets. Stocks, options, futures, forex across 33 countries with institutional-grade execution.",
    status: "coming" as const,
    markets: ["US Stocks", "Global Markets", "Forex", "Options"],
    features: ["150+ markets worldwide", "Professional execution", "Low margin rates", "TWS API"],
    recommended: null,
  },
  {
    name: "MetaTrader 5",
    description: "Industry standard for forex and CFD trading. Connect EA for automated execution with AI signal generation.",
    status: "coming" as const,
    markets: ["Forex", "CFDs", "Indices"],
    features: ["Expert Advisor support", "MT5 API", "Multi-broker compatible", "Custom indicators"],
    recommended: null,
  },
  {
    name: "Upstox",
    description: "Popular Indian discount broker. Low-cost trading on NSE/BSE with API access for algorithmic strategies.",
    status: "coming" as const,
    markets: ["India Stocks", "Mutual Funds"],
    features: ["Low brokerage", "API access", "Mobile-first", "Direct MF"],
    recommended: null,
  },
]

const connectionSteps = [
  { step: "01", title: "Generate API Keys", desc: "Create API keys on your broker's platform with trade-only permissions (no withdrawal)." },
  { step: "02", title: "Enter in XMOne", desc: "Paste your API keys in the dashboard settings. Encrypted and stored securely." },
  { step: "03", title: "AI Starts Analyzing", desc: "Engine connects to your broker and begins scanning markets with all six AI agents." },
  { step: "04", title: "Approve via Telegram", desc: "Signals arrive on Telegram. Tap Approve — trade executes on your broker account." },
]

export default function IntegrationsPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 rounded-sm border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs mono-label text-gold-700 mb-6">
            // Integrations
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium text-foreground tracking-tight">
            Connect Your Broker.
            <br />
            <span className="text-gradient-gold">Start in Minutes.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            XMOne connects to your existing broker via secure API keys.
            No fund withdrawal access. Trade-only permissions. You stay in control.
          </p>
        </div>

        {/* Security highlight */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8 mb-20">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Security First</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Your API keys are encrypted with Fernet encryption and stored securely.
                XMOne only requests trade execution permissions — never withdrawal access.
                You can revoke keys anytime from your broker dashboard.
              </p>
              <div className="space-y-2">
                {["Trade-only permissions (no withdrawal)", "Fernet encryption for API keys", "Revocable anytime", "No fund access ever"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center">
              <div className="grid grid-cols-2 gap-3">
                {["AES-256", "Fernet", "TLS 1.3", "Zero Trust"].map((badge) => (
                  <div key={badge} className="px-4 py-2 rounded-lg bg-card border border-border text-center text-xs font-mono text-foreground">
                    {badge}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Broker cards */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-foreground tracking-tight">
              Supported Brokers
            </h2>
            <p className="mt-4 text-muted-foreground">Start with paper trading, then connect your broker.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brokers.map((broker) => (
              <div key={broker.name} className={`p-6 rounded-xl border bg-card transition-all duration-300 ${
                broker.status === "live" ? "border-emerald-200 hover:border-emerald-300" : "border-border hover:border-gold-200"
              } ${broker.recommended ? "ring-2 ring-gold-500/20" : ""}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">{broker.name}</h3>
                  {broker.status === "live" ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 mono-label">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Live
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mono-label">
                      <Clock className="h-3 w-3" />
                      Coming Soon
                    </div>
                  )}
                </div>
                {broker.recommended && (
                  <div className="inline-flex items-center gap-1.5 text-xs text-gold-700 bg-gold-50 border border-gold-200 px-2 py-0.5 rounded-sm mono-label mb-3">
                    <Zap className="h-3 w-3" />
                    {broker.recommended}
                  </div>
                )}
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{broker.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {broker.markets.map((m) => (
                    <span key={m} className="text-[10px] mono-label px-2 py-0.5 rounded-sm border border-border bg-accent text-muted-foreground">
                      {m}
                    </span>
                  ))}
                </div>
                <div className="space-y-1.5">
                  {broker.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Connection steps */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-foreground tracking-tight">
              Connect in 4 Steps
            </h2>
            <p className="mt-4 text-muted-foreground">From sign-up to live signals in 15 minutes.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {connectionSteps.map((s) => (
              <div key={s.step} className="p-6 rounded-xl border border-border bg-card text-center">
                <div className="text-xs font-mono font-bold text-gold-600 mb-2">{s.step}</div>
                <h3 className="text-base font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* India-specific section */}
        <div className="rounded-xl border border-border bg-card p-8 sm:p-12 mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Landmark className="h-5 w-5 text-orange-600" />
            </div>
            <h2 className="font-serif text-2xl font-medium text-foreground">India Market Support</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-6">
            XMOne is built India-first. Full support for NSE/BSE stocks, MCX commodities, mutual funds, and Indian tax optimization.
            Zerodha and Upstox integrations coming soon.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {["NSE & BSE stocks (5,000+)", "MCX gold & silver futures", "Direct plan mutual funds", "ELSS tax-saving funds", "LTCG/STCG tax optimization", "SIP recommendations"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-orange-600" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-medium text-foreground tracking-tight mb-4">
            Ready to Connect?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Start with paper trading — no broker connection needed. Connect your broker when you&apos;re ready.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-gold-600 hover:bg-gold-500 text-white font-semibold px-10 h-14 shadow-sm shadow-gold-600/20">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/docs/quickstart">
              <Button size="lg" variant="outline" className="border-border text-muted-foreground hover:bg-accent h-14">
                Read Documentation
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
