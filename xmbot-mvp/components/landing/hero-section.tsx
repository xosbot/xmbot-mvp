"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Eye, TrendingUp, Activity, Zap, Bot, Lock } from "lucide-react"
import { useEffect, useState } from "react"

function TerminalSimulation() {
  const [lines, setLines] = useState<string[]>([])
  const [currentLine, setCurrentLine] = useState(0)

  const terminalLines = [
    { text: "$ xmbot-engine --mode=live --broker=binance", delay: 0 },
    { text: "[ENGINE] Initializing multi-agent system...", delay: 800 },
    { text: "[ENGINE] Technical Analysis Agent loaded", delay: 1600 },
    { text: "[ENGINE] AI Validator loaded (Gemini Pro)", delay: 2200 },
    { text: "[ENGINE] Risk Manager loaded", delay: 2800 },
    { text: "[ENGINE] Scanning XAUUSD M5...", delay: 3500 },
    { text: "[SCAN] RSI: 38.2 | Supertrend: Bullish | ADX: 32.1", delay: 5000 },
    { text: "[AI] Confidence: 82% — Signal validated ✓", delay: 6200 },
    { text: "[SIGNAL] BUY PAXGUSDT @ $3,247.80", delay: 7000 },
    { text: "[RISK] SL: $3,239.35 | TP: $3,264.70 | Risk: 2.0%", delay: 7500 },
    { text: "[TELEGRAM] Signal card sent → Awaiting approval...", delay: 8500 },
    { text: "[APPROVAL] ✓ Approved by user in 12s", delay: 10500 },
    { text: "[ORDER] Filled: 0.05 lots @ $3,247.82", delay: 11500 },
    { text: "[MONITOR] Position active — trailing stop engaged", delay: 12500 },
    { text: "[P&L] +$47.20 (+1.45%) 🟢", delay: 14000 },
  ]

  useEffect(() => {
    if (currentLine >= terminalLines.length) {
      const timer = setTimeout(() => {
        setLines([])
        setCurrentLine(0)
      }, 4000)
      return () => clearTimeout(timer)
    }

    const timer = setTimeout(() => {
      setLines((prev) => [...prev, terminalLines[currentLine].text])
      setCurrentLine((prev) => prev + 1)
    }, terminalLines[currentLine].delay - (currentLine > 0 ? terminalLines[currentLine - 1].delay : 0))

    return () => clearTimeout(timer)
  }, [currentLine])

  const getLineColor = (line: string) => {
    if (line.includes("$")) return "text-emerald-400"
    if (line.includes("[SIGNAL]") || line.includes("[ORDER]") || line.includes("[APPROVAL]")) return "text-emerald-400 font-medium"
    if (line.includes("[P&L]")) return "text-emerald-400 font-bold text-sm"
    if (line.includes("[SCAN]")) return "text-slate-300"
    if (line.includes("[TELEGRAM]") || line.includes("[MONITOR]")) return "text-yellow-400"
    return "text-slate-500"
  }

  return (
    <div className="relative rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl overflow-hidden shadow-2xl shadow-emerald-500/10">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <span className="text-xs text-slate-500 ml-2 font-mono">xmbot-engine</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-400 font-mono">LIVE</span>
        </div>
      </div>

      {/* Terminal content */}
      <div className="p-5 font-mono text-[11px] leading-relaxed space-y-1 min-h-[340px]">
        {lines.map((line, i) => (
          <div
            key={`${i}-${line}`}
            className={`${getLineColor(line)} animate-[fade-in_0.3s_ease-out]`}
          >
            {line}
          </div>
        ))}
        {currentLine < terminalLines.length && (
          <div className="w-2 h-4 bg-emerald-400 animate-[blink_1s_step-end_infinite]" />
        )}
      </div>

      {/* Bottom glow */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-emerald-500/5 to-transparent pointer-events-none" />
    </div>
  )
}

function StatsBar() {
  const stats = [
    { label: "Win Rate", value: "64%", icon: TrendingUp },
    { label: "6-Month Return", value: "+84.3%", icon: Activity },
    { label: "Max Drawdown", value: "4.3%", icon: Shield },
  ]

  return (
    <div className="grid grid-cols-3 gap-6 max-w-lg">
      {stats.map((s) => (
        <div key={s.label} className="text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <s.icon className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xl sm:text-2xl font-bold text-white font-mono">{s.value}</span>
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        {/* Gradient mesh */}
        <div className="absolute left-1/4 top-0 h-[800px] w-[800px] rounded-full bg-emerald-500/[0.08] blur-[150px]" />
        <div className="absolute right-1/4 top-1/3 h-[600px] w-[600px] rounded-full bg-violet-600/[0.06] blur-[120px]" />
        <div className="absolute left-1/3 bottom-0 h-[600px] w-[600px] rounded-full bg-emerald-500/[0.04] blur-[100px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        {/* Radial vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#030712_70%)]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div className="max-w-xl">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400 animate-[fade-in_0.6s_ease-out]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>AI-Powered Trading — Beta Open</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] animate-[slide-up_0.6s_ease-out_0.1s_both]">
              <span className="text-white">Trade Gold</span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">with AI Agents</span>
              <br />
              <span className="text-slate-300 text-4xl sm:text-5xl lg:text-6xl">You Stay in Control</span>
            </h1>

            {/* Subheadline */}
            <p className="mt-8 text-lg text-slate-400 leading-relaxed animate-[slide-up_0.6s_ease-out_0.2s_both]">
              Multi-agent system analyzes XAUUSD 24/5. Signals sent to your Telegram.
              You approve or reject. <span className="text-white font-medium">No auto-execution without your say.</span>
            </p>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500 animate-[slide-up_0.6s_ease-out_0.3s_both]">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-500" />
                <span>2% max risk per trade</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-emerald-500" />
                <span>Human-in-the-loop</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span>Backtested 6 months</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 animate-[slide-up_0.6s_ease-out_0.4s_both]">
              <Link href="/register">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 h-14 text-base shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/30 transition-all duration-300 group">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800/50 h-14 text-base">
                  See How It Works
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-14 animate-[slide-up_0.6s_ease-out_0.5s_both]">
              <StatsBar />
            </div>
          </div>

          {/* Right: Terminal */}
          <div className="hidden lg:block animate-[scale-in_0.6s_ease-out_0.3s_both]">
            <div aria-hidden="true">
              <TerminalSimulation />
            </div>
            <p className="sr-only">
              XMBot trading terminal simulation showing real-time AI analysis and trade execution
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
