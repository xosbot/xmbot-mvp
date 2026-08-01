"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Eye, TrendingUp, Zap } from "lucide-react"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { BackgroundBeams } from "@/components/ui/aceternity/background-beams"
import { TextGenerateEffect } from "@/components/ui/aceternity/text-generate-effect"
import { FlipWords } from "@/components/ui/aceternity/flip-words"
import { LampEffect } from "@/components/ui/aceternity/lamp-effect"

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
    { text: "[P&L] +$47.20 (+1.45%)", delay: 14000 },
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
    if (line.includes("$")) return "text-gold-400"
    if (line.includes("[SIGNAL]") || line.includes("[ORDER]") || line.includes("[APPROVAL]")) return "text-emerald-400 font-medium"
    if (line.includes("[P&L]")) return "text-emerald-400 font-bold text-sm"
    if (line.includes("[SCAN]")) return "text-slate-300"
    if (line.includes("[TELEGRAM]") || line.includes("[MONITOR]")) return "text-yellow-400"
    return "text-slate-500"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="corner-frame relative rounded-md border border-white/10 bg-black/80 overflow-hidden"
    >
      <div className="relative">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/[0.03]">
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
        <div className="p-5 font-mono text-[11px] leading-relaxed space-y-1 min-h-[340px]">
          {lines.map((line, i) => (
            <div key={`${i}-${line}`} className={`${getLineColor(line)} animate-[fade-in_0.3s_ease-out]`}>
              {line}
            </div>
          ))}
          {currentLine < terminalLines.length && (
            <div className="w-2 h-4 bg-gold-400 animate-[blink_1s_step-end_infinite]" />
          )}
        </div>
      </div>
    </motion.div>
  )
}

function StatsBar() {
  const stats = [
    { label: "Setup Time", value: "15 min", icon: Zap, tone: "gold" as const },
    { label: "Win Rate", value: "64%", icon: TrendingUp, tone: "emerald" as const },
    { label: "Max Drawdown", value: "4.3%", icon: Shield, tone: "emerald" as const },
  ]

  return (
    <div className="grid grid-cols-3 divide-x divide-white/10 border border-white/10 rounded-md max-w-lg">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
          className="text-center py-3 px-2"
        >
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <s.icon className={`h-3.5 w-3.5 ${s.tone === "gold" ? "text-gold-400" : "text-emerald-400"}`} />
            <span className="text-xl sm:text-2xl font-bold text-white font-mono tracking-tight">{s.value}</span>
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 mono-label">{s.label}</div>
        </motion.div>
      ))}
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      <BackgroundBeams className="absolute inset-0 -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8 inline-flex items-center gap-2 rounded-sm border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs mono-label text-gold-400"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
              <span>Beta Open // Live in 15 Min</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <LampEffect>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-aggressive leading-[1.05]">
                  <span className="text-white">
                    <TextGenerateEffect words="Gold Trading," filter={false} />
                  </span>
                  <br />
                  <span className="text-gradient-gold">
                    <FlipWords words={["Simplified.", "On Telegram.", "In Your Control."]} duration={3000} />
                  </span>
                </h1>
              </LampEffect>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 text-lg text-slate-400 leading-relaxed"
            >
              No charts to babysit, no code to write. Connect Telegram, and the AI scans
              XAUUSD 24/5 for you. <span className="text-white font-medium">Every signal lands in your pocket — you tap Approve or Reject.</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500"
            >
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-gold-500" />
                <span>Live in 15 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-gold-500" />
                <span>Human-in-the-loop</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gold-500" />
                <span>2% max risk per trade</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 flex flex-col sm:flex-row gap-4"
            >
              <Link href="/register">
                <Button size="lg" className="bg-gold-500 hover:bg-gold-400 text-neutral-950 font-semibold px-10 h-14 text-base transition-colors duration-200 group">
                  Set Up in 15 Minutes
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="border-white/15 text-slate-300 hover:bg-white/5 h-14 text-base">
                  See How It Works
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-14"
            >
              <StatsBar />
            </motion.div>
          </div>

          <div className="hidden lg:block">
            <TerminalSimulation />
          </div>
        </div>
      </div>
    </section>
  )
}
