"use client"

import { motion } from "framer-motion"
import { ScrollReveal } from "./scroll-reveal"
import { ArrowUpRight, ArrowDownRight, Clock, TrendingUp, Shield, Target } from "lucide-react"

function SignalCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-foreground/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-gold-400" />
            </div>
            <div>
              <div className="font-medium text-foreground">XAUUSD</div>
              <div className="text-xs text-stone-500">Gold vs US Dollar</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-emerald-400">LIVE</span>
          </div>
        </div>

        {/* Signal Details */}
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-sm font-medium text-emerald-400">BUY SIGNAL</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <Clock className="h-3.5 w-3.5" />
              <span>M5 Timeframe</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="text-center">
              <div className="text-xs text-stone-500 mb-1">Entry</div>
              <div className="text-sm font-mono font-bold text-foreground">$2,341.50</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-stone-500 mb-1">Stop Loss</div>
              <div className="text-sm font-mono font-bold text-red-400">$2,335.20</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-stone-500 mb-1">Take Profit</div>
              <div className="text-sm font-mono font-bold text-emerald-400">$2,352.80</div>
            </div>
          </div>

          {/* Risk/Reward */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-foreground/[0.03] border border-foreground/10 mb-5">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gold-400" />
              <span className="text-xs text-stone-400">Risk:Reward</span>
            </div>
            <span className="text-sm font-mono font-bold text-gold-400">1:1.8</span>
          </div>

          {/* Confidence */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-stone-500">AI Confidence</span>
              <span className="text-xs font-mono text-emerald-400">87%</span>
            </div>
            <div className="h-2 rounded-full bg-foreground/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-gold-500 to-emerald-400"
                initial={{ width: 0 }}
                whileInView={{ width: "87%" }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>

          {/* AI Validation */}
          <div className="p-3 rounded-lg bg-gold-500/5 border border-gold-500/20 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-gold-400" />
              <span className="text-xs font-medium text-gold-400">AI Validation</span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              &quot;RSI oversold at 28.3 with bullish divergence. Supertrend flipped green. Volume confirming upward momentum. High-confidence long setup.&quot;
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t border-foreground/10 flex gap-3">
          <button className="flex-1 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2">
            <ArrowUpRight className="h-4 w-4" />
            Approve
          </button>
          <button className="flex-1 h-11 rounded-xl border border-foreground/15 text-stone-400 hover:bg-foreground/5 font-medium text-sm transition-colors flex items-center justify-center gap-2">
            <ArrowDownRight className="h-4 w-4" />
            Reject
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export function LivePreviewSection() {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <ScrollReveal>
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-sm border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs mono-label text-gold-400 mb-6">
                // Live Preview
              </div>
              <h2 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-medium text-foreground tracking-tight">
                This Is What
                <br />
                <span className="text-gradient-gold">You&apos;ll See.</span>
              </h2>
              <p className="mt-6 text-lg text-stone-400 leading-relaxed">
                Every signal comes with entry, stop loss, take profit, and AI analysis.
                You review. You decide. One tap.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "Pre-calculated risk:reward ratio",
                  "AI confidence score (0-100%)",
                  "Natural language analysis",
                  "One-tap approve or reject",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-stone-400">
                    <div className="w-5 h-5 rounded-full bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <SignalCard />
        </div>
      </div>
    </section>
  )
}
