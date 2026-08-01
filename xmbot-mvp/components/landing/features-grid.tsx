"use client"

import { Brain, Users, Shield, BarChart3, Bell, Bot, Layers, Zap } from "lucide-react"
import { motion } from "framer-motion"
import { ScrollReveal, StaggerChildren, StaggerItem } from "./scroll-reveal"
import { GlareCard } from "@/components/ui/aceternity/glare-card"
import { Spotlight } from "@/components/ui/aceternity/spotlight"

const features = [
  {
    icon: Brain,
    title: "Multi-Agent AI",
    description: "Technical Analysis Agent scans XAUUSD M5 with RSI + Supertrend + ADX. AI validates via Gemini/Claude.",
    color: "emerald" as const,
    featured: true,
  },
  {
    icon: Users,
    title: "Human-in-the-Loop",
    description: "Every signal requires your approval. Review on Telegram, approve with one tap. No auto-execution.",
    color: "emerald" as const,
    featured: true,
  },
  {
    icon: Shield,
    title: "Risk Engine",
    description: "2% max risk per trade. Daily loss limits. Max drawdown protection. Position sizing enforced.",
    color: "emerald" as const,
    featured: false,
  },
  {
    icon: BarChart3,
    title: "Backtested",
    description: "64% win rate. +84.3% return. 4.3% max drawdown. Walk-forward validated on unseen data.",
    color: "violet" as const,
    featured: false,
  },
  {
    icon: Bell,
    title: "Telegram Alerts",
    description: "Signal cards with Approve/Reject buttons. Trade alerts. P&L summaries. Everything in your pocket.",
    color: "violet" as const,
    featured: false,
  },
  {
    icon: Bot,
    title: "Live Dashboard",
    description: "Real-time positions, P&L tracking, signal history, engine status. Monitor from any device.",
    color: "violet" as const,
    featured: false,
  },
  {
    icon: Layers,
    title: "Multi-Broker",
    description: "Paper Trading for testing. Binance for crypto. MetaTrader 5 for forex. Switch without changing strategy.",
    color: "emerald" as const,
    featured: false,
  },
  {
    icon: Zap,
    title: "24/5 Execution",
    description: "Engine runs around the clock during market hours. No emotions, no FOMO. Just the system.",
    color: "emerald" as const,
    featured: false,
  },
]

export function FeaturesGrid() {
  return (
    <section id="features" className="py-32 sm:py-40 relative overflow-hidden">
      {/* Top border accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

      {/* Decorative gradient orbs */}
      <div className="absolute -top-40 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-violet-500/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-24">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-emerald-400/5 px-5 py-2 text-xs text-emerald-300 mb-8 uppercase tracking-wider font-medium backdrop-blur-xl"
            >
              Features
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight mb-6"
            >
              Built for
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-cyan-400 text-transparent bg-clip-text">
                Serious Traders
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-slate-300 leading-relaxed"
            >
              Everything you need to run a disciplined, automated gold trading operation.
            </motion.p>
          </div>
        </ScrollReveal>

        {/* Featured row: 2 large cards */}
        <StaggerChildren className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8" staggerDelay={0.1}>
          {features.filter(f => f.featured).map((f) => (
            <StaggerItem key={f.title}>
              <Spotlight className="rounded-3xl" fill={f.color === "emerald" ? "rgba(16, 185, 129, 0.1)" : "rgba(139, 92, 246, 0.1)"}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="relative group h-full rounded-3xl border border-white/10 bg-gradient-to-b from-white/8 to-white/3 backdrop-blur-2xl p-10 overflow-hidden transition-all duration-300 hover:border-emerald-500/30"
                >
                  {/* Animated gradient background on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative">
                    <motion.div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 ${
                        f.color === "emerald" ? "bg-gradient-to-br from-emerald-500/20 to-emerald-500/10" : "bg-gradient-to-br from-violet-500/20 to-violet-500/10"
                      }`}
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <f.icon className={`h-8 w-8 ${f.color === "emerald" ? "text-emerald-400" : "text-violet-400"}`} />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white mb-4">{f.title}</h3>
                    <p className="text-base text-slate-300 leading-relaxed">{f.description}</p>
                  </div>
                </motion.div>
              </Spotlight>
            </StaggerItem>
          ))}
        </StaggerChildren>

        {/* Standard row: 6 cards in 3-col */}
        <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.08}>
          {features.filter(f => !f.featured).map((f) => (
            <StaggerItem key={f.title}>
              <Spotlight className="rounded-2xl" fill={f.color === "emerald" ? "rgba(16, 185, 129, 0.06)" : "rgba(139, 92, 246, 0.06)"}>
                <motion.div
                  whileHover={{ y: -3 }}
                  className="relative group h-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-7 overflow-hidden transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/[0.08]"
                >
                  {/* Subtle hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative">
                    <motion.div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                        f.color === "emerald" ? "bg-emerald-500/15 group-hover:bg-emerald-500/25" : "bg-violet-500/15 group-hover:bg-violet-500/25"
                      } transition-colors duration-300`}
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <f.icon className={`h-6 w-6 ${f.color === "emerald" ? "text-emerald-400" : "text-violet-400"}`} />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-white mb-3">{f.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{f.description}</p>
                  </div>
                </motion.div>
              </Spotlight>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  )
}
