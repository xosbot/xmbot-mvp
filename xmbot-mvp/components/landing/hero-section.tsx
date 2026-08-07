"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Eye, TrendingUp, Zap, CheckCircle2, Globe, BarChart3 } from "lucide-react"
import { motion } from "framer-motion"
import { TextGenerateEffect } from "@/components/ui/aceternity/text-generate-effect"
import { FlipWords } from "@/components/ui/aceternity/flip-words"
import { LampEffect } from "@/components/ui/aceternity/lamp-effect"
import { ProductMockupStack } from "./product-mockup-stack"

function StatsBar() {
  const stats = [
    { label: "Win Rate", value: "64%", icon: TrendingUp, tone: "emerald" },
    { label: "Return", value: "+84%", icon: TrendingUp, tone: "emerald" },
    { label: "Max Drawdown", value: "4.3%", icon: Shield, tone: "emerald" },
  ]

  return (
    <div className="grid grid-cols-3 divide-x divide-border border border-border rounded-xl max-w-lg bg-card shadow-sm">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
          className="text-center py-3 px-2"
        >
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <s.icon className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xl sm:text-2xl font-bold text-foreground font-mono tracking-tight">{s.value}</span>
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground mono-label">{s.label}</div>
        </motion.div>
      ))}
    </div>
  )
}

function TrustBadges() {
  const badges = [
    "No withdrawal access — ever",
    "API keys only",
    "Cancel anytime",
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8, duration: 0.6 }}
      className="mt-6 flex flex-wrap gap-x-4 gap-y-2"
    >
      {badges.map((badge) => (
        <div key={badge} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          <span>{badge}</span>
        </div>
      ))}
    </motion.div>
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
              className="mb-8 inline-flex items-center gap-2 rounded-sm border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs mono-label text-gold-700"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse" />
              <span>Beta Open // 7-Day Free Trial</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <LampEffect>
                <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-medium tracking-tight leading-[1.05]">
                  <span className="text-foreground">
                    <TextGenerateEffect words="AI Investment" filter={false} />
                  </span>
                  <br />
                  <span className="text-gradient-gold">
                    <FlipWords words={["Partner for Every Market.", "Across Every Asset.", "That Grows With You."]} duration={3000} />
                  </span>
                </h1>
              </LampEffect>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 text-lg text-muted-foreground leading-relaxed"
            >
              Gold, stocks, crypto, mutual funds — AI finds opportunities across India and global markets.
              You decide. No charts. No code. No stress.
              <span className="text-foreground font-medium"> Just disciplined growth.</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gold-600" />
                <span>India + US + Global markets</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-gold-600" />
                <span>You approve every trade</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gold-600" />
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
                <Button size="lg" className="bg-gold-600 hover:bg-gold-500 text-white font-semibold px-10 h-14 text-base transition-colors duration-200 group shadow-sm shadow-gold-600/20">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="border-border text-muted-foreground hover:bg-accent h-14 text-base">
                  See How It Works
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10"
            >
              <StatsBar />
              <p className="text-[10px] text-muted-foreground mt-2">* Backtested results. Past performance does not guarantee future returns.</p>
              <TrustBadges />
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
