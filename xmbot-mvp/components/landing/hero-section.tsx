"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Eye, TrendingUp, Zap } from "lucide-react"
import { motion } from "framer-motion"
import { TextGenerateEffect } from "@/components/ui/aceternity/text-generate-effect"
import { FlipWords } from "@/components/ui/aceternity/flip-words"
import { LampEffect } from "@/components/ui/aceternity/lamp-effect"
import { ProductMockupStack } from "./product-mockup-stack"

function StatsBar() {
  const stats = [
    { label: "Setup Time", value: "15 min", icon: Zap, tone: "gold" as const },
    { label: "Win Rate", value: "64%", icon: TrendingUp, tone: "emerald" as const },
    { label: "Max Drawdown", value: "4.3%", icon: Shield, tone: "emerald" as const },
  ]

  return (
    <div className="grid grid-cols-3 divide-x divide-foreground/10 border border-foreground/10 rounded-xl max-w-lg">
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
            <span className="text-xl sm:text-2xl font-bold text-foreground font-mono tracking-tight">{s.value}</span>
          </div>
          <div className="text-[10px] sm:text-xs text-stone-500 mono-label">{s.label}</div>
        </motion.div>
      ))}
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
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
                <h1 className="font-serif text-6xl sm:text-7xl lg:text-8xl font-medium tracking-tight leading-[1.02]">
                  <span className="text-foreground">
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
              className="mt-8 text-lg text-stone-400 leading-relaxed"
            >
              No charts to babysit, no code to write. Connect Telegram, and the AI scans
              XAUUSD 24/5 for you. <span className="text-foreground font-medium">Every signal lands in your pocket — you tap Approve or Reject.</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-stone-500"
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
                <Button size="lg" variant="outline" className="border-foreground/15 text-stone-300 hover:bg-foreground/5 h-14 text-base">
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
            <ProductMockupStack />
          </div>
        </div>
      </div>
    </section>
  )
}
