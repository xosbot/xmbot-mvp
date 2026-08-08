"use client"

import { Topbar } from "@/components/dashboard/topbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wifi, WifiOff, Shield, ExternalLink, CheckCircle2, Clock, Zap } from "lucide-react"

const brokers = [
  {
    name: "Paper Trading",
    description: "Risk-free testing with simulated trades",
    status: "connected",
    markets: ["All markets"],
    apiKey: "paper_mode",
  },
  {
    name: "Binance",
    description: "Crypto trading with PAXGUSDT for gold exposure",
    status: "disconnected",
    markets: ["Crypto", "Gold (PAXG)"],
    apiKey: null,
  },
  {
    name: "Zerodha",
    description: "India stocks, MCX commodities, mutual funds",
    status: "coming",
    markets: ["NSE/BSE", "MCX"],
    apiKey: null,
  },
  {
    name: "Interactive Brokers",
    description: "Global access to 150+ markets",
    status: "coming",
    markets: ["US Stocks", "Global"],
    apiKey: null,
  },
  {
    name: "MetaTrader 5",
    description: "Forex and CFD trading with EA support",
    status: "coming",
    markets: ["Forex", "CFDs"],
    apiKey: null,
  },
  {
    name: "Upstox",
    description: "Low-cost Indian discount broker",
    status: "coming",
    markets: ["NSE/BSE"],
    apiKey: null,
  },
]

export default function BrokersPage() {
  return (
    <>
      <Topbar title="Brokers" />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        {/* Security notice */}
        <Card className="bg-emerald-500/5 border-emerald-200 rounded-md">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-emerald-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">Trade-Only Permissions</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  XMOne only requests trade execution permissions — never withdrawal access.
                  Your API keys are encrypted with Fernet encryption.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Broker cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brokers.map((broker) => (
            <Card key={broker.name} className={`bg-card border-border rounded-md ${
              broker.status === "connected" ? "border-emerald-200" : ""
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground text-sm">{broker.name}</CardTitle>
                  {broker.status === "connected" ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Connected
                    </div>
                  ) : broker.status === "coming" ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Coming Soon
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <WifiOff className="h-3 w-3" />
                      Disconnected
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">{broker.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {broker.markets.map((m) => (
                    <span key={m} className="text-[10px] mono-label px-2 py-0.5 rounded-sm border border-border bg-accent text-muted-foreground">
                      {m}
                    </span>
                  ))}
                </div>
                {broker.status === "connected" ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Active and ready for trading
                  </div>
                ) : broker.status === "disconnected" ? (
                  <Button size="sm" variant="outline" className="w-full text-xs border-gold-200 text-gold-700 hover:bg-gold-500/10">
                    <Zap className="h-3 w-3 mr-1" />
                    Connect {broker.name}
                  </Button>
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    Integration in progress
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Connection steps */}
        <Card className="bg-card border-border rounded-md">
          <CardHeader>
            <CardTitle className="text-foreground text-sm">How to Connect a Broker</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[
                { step: "01", title: "Generate API Keys", desc: "Create API keys on your broker's platform with trade-only permissions" },
                { step: "02", title: "Enter in XMOne", desc: "Paste your API keys in the broker settings. Encrypted and stored securely." },
                { step: "03", title: "AI Starts Analyzing", desc: "Engine connects and begins scanning gold markets with all five AI agents" },
                { step: "04", title: "Approve via Telegram", desc: "Signals arrive on Telegram. Tap Approve — trade executes on your broker" },
              ].map((s) => (
                <div key={s.step} className="p-3 rounded-lg border border-border bg-accent text-center">
                  <div className="text-xs font-mono font-bold text-gold-600 mb-1">{s.step}</div>
                  <h4 className="text-xs font-semibold text-foreground mb-1">{s.title}</h4>
                  <p className="text-[11px] text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  )
}
