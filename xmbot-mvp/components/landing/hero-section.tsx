"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Eye, TrendingUp, Activity, CheckCircle2, Zap } from "lucide-react"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { BackgroundBeams } from "@/components/ui/aceternity/background-beams"
import { TextGenerateEffect } from "@/components/ui/aceternity/text-generate-effect"
import { FlipWords } from "@/components/ui/aceternity/flip-words"
import { MagneticButton } from "@/components/ui/aceternity/magnetic-button"
import { Spotlight } from "@/components/ui/aceternity/spotlight"
import { LampEffect } from "@/components/ui/aceternity/lamp-effect"
import { CursorGlow } from "./cursor-glow"

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
    if (line.includes("$")) return "text-emerald-400"
    if (line.includes("[SIGNAL]") || line.includes("[ORDER]") || line.includes("[APPROVAL]")) return "text-emerald-400 font-medium"
    if (line.includes("[P&L]")) return "text-emerald-400 font-bold text-sm"
    if (line.includes("[SCAN]")) return "text-slate-300"
    if (line.includes("[TELEGRAM]") || line.includes("[MONITOR]")) return "text-yellow-400"
    return "text-slate-500"
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
      className="relative rounded-2xl overflow-hidden shadow-2xl"
    >
      {/* Gradient border */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-emerald-500/40 via-emerald-500/10 to-violet-500/20 pointer-events-none" />

      {/* Main container */}
      <div className="relative border border-white/10 bg-gradient-to-b from-white/5 to-black/60 backdrop-blur-2xl rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors" />
              <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors" />
            </div>
            <span className="text-xs text-slate-400 ml-2 font-mono font-medium">xmbot-engine</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-emerald-400"
            />
            <span className="text-xs text-emerald-400 font-mono font-semibold">LIVE</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 font-mono text-[11px] leading-relaxed space-y-1 min-h-[360px] max-h-[400px] overflow-y-auto">
          {lines.map((line, i) => (
            <motion.div
              key={`${i}-${line}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`${getLineColor(line)}`}
            >
              {line}
            </motion.div>
          ))}
          {currentLine < terminalLines.length && (
            <motion.div
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="w-2 h-4 bg-emerald-400"
            />
          )}
        </div>

        {/* Footer glow */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Outer glow */}
      <motion.div
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute -inset-px rounded-2xl bg-gradient-to-b from-emerald-500/0 via-emerald-500/5 to-violet-500/10 pointer-events-none blur-lg"
      />
    </motion.div>
  )
}

function StatsBar() {
  const stats = [
    { label: "Win Rate", value: "64%", icon: TrendingUp },
    { label: "6-Month Return", value: "+84.3%", icon: Activity },
    { label: "Max Drawdown", value: "4.3%", icon: Shield },
  ]

  return (
    <div className="grid grid-cols-3 gap-6">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 + i * 0.1, duration: 0.6 }}
          className="group relative"
        >
          <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur" />
          <div className="relative bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <s.icon className="h-4 w-4 text-emerald-400/60 group-hover:text-emerald-400 transition-colors" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white font-mono mb-1">{s.value}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">{s.label}</div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      <CursorGlow />
      <BackgroundBeams className="absolute inset-0 -z-10" />

      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-[800px] w-[800px] rounded-full bg-emerald-500/[0.08] blur-[150px]" />
        <div className="absolute right-1/4 top-1/3 h-[600px] w-[600px] rounded-full bg-violet-600/[0.06] blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#030712_70%)]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-32 w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Left Column - Content */}
          <div className="max-w-2xl">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
              className="mb-10 inline-flex items-center gap-3 rounded-full border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-emerald-400/5 px-5 py-2.5 text-sm text-emerald-300 backdrop-blur-xl"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium">Launching Monday — Early bird 50% off</span>
            </motion.div>

            {/* Main Headline */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 0.4, 0.25, 1] }}
            >
              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[1.1] mb-6">
                <span className="block text-white">
                  Trade Gold
                </span>
                <span className="block bg-gradient-to-r from-emerald-400 via-emerald-300 to-cyan-400 text-transparent bg-clip-text">
                  with AI Agents
                </span>
              </h1>
            </motion.div>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-xl sm:text-2xl text-slate-300 leading-relaxed max-w-lg mb-8"
            >
              64% win rate. +84.3% return. <span className="text-white font-semibold">You stay in control.</span> Every trade needs your approval.
            </motion.p>

            {/* Key Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10"
            >
              {[
                { icon: Shield, text: "2% max risk per trade" },
                { icon: Eye, text: "Human-in-the-loop approval" },
                { icon: TrendingUp, text: "64% win rate verified" },
                { icon: Zap, text: "Live signals via Telegram" },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className="flex items-center gap-3 text-slate-300"
                >
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/30 flex items-center justify-center">
                    <feature.icon className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span className="text-sm sm:text-base">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 mb-12"
            >
              <MagneticButton>
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white px-12 h-16 text-lg font-semibold shadow-2xl shadow-emerald-600/40 hover:shadow-emerald-500/50 transition-all duration-300 group w-full sm:w-auto"
                  >
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Start Free Trial
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </Link>
              </MagneticButton>
              <Link href="#how-it-works" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-600/50 text-slate-300 hover:bg-slate-800/50 hover:border-slate-500 h-16 text-lg font-semibold w-full sm:w-auto backdrop-blur-sm"
                >
                  How It Works
                </Button>
              </Link>
            </motion.div>

            {/* Stats Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <StatsBar />
            </motion.div>
          </div>

          {/* Right Column - Terminal */}
          <div className="hidden lg:flex lg:justify-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
              className="w-full max-w-md"
            >
              <TerminalSimulation />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
