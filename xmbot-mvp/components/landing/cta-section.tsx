"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Eye, TrendingUp, Zap } from "lucide-react"
import { ScrollReveal } from "./scroll-reveal"
import { BackgroundBeams } from "@/components/ui/aceternity/background-beams"
import { MovingBorder } from "@/components/ui/aceternity/moving-border"
import { MagneticButton } from "@/components/ui/aceternity/magnetic-button"
import { LampEffect } from "@/components/ui/aceternity/lamp-effect"

export function CTASection() {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

      <BackgroundBeams className="absolute inset-0 -z-10" />

      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[1000px] rounded-full bg-gradient-to-r from-gold-500/10 via-emerald-500/10 to-gold-500/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <MovingBorder className="p-8 sm:p-12 lg:p-16 text-center">
            <LampEffect>
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/20 bg-gold-500/10 px-4 py-1.5 text-sm text-gold-400 mb-8">
                  <Zap className="h-3.5 w-3.5" />
                  <span>Limited Beta — First 10 Customers</span>
                </div>

                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-aggressive">
                  Your First Signal Is
                  <br />
                  <span className="text-gradient-gold">15 Minutes Away</span>
                </h2>

                <p className="mt-6 text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
                  Connect Telegram, set your risk limits, and let the multi-agent system
                  handle the analysis. You stay the one who taps Approve.
                </p>

                <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gold-500" />
                    <span>2% max risk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-gold-500" />
                    <span>You approve every trade</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span>64% win rate</span>
                  </div>
                </div>

                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <MagneticButton>
                    <Link href="/register">
                      <Button size="lg" className="bg-gold-500 hover:bg-gold-400 text-neutral-950 font-semibold px-10 h-14 text-base shadow-lg shadow-gold-600/25 hover:shadow-gold-500/30 transition-all duration-300 group">
                        Set Up in 15 Minutes
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </MagneticButton>
                  <Link href="https://t.me/xmbot" target="_blank" rel="noopener noreferrer">
                    <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800/50 h-14 text-base">
                      Join Telegram
                    </Button>
                  </Link>
                </div>

                <p className="mt-8 text-xs text-slate-600">
                  No hidden fees. Cancel anytime. Trading involves risk.
                </p>
              </div>
            </LampEffect>
          </MovingBorder>
        </ScrollReveal>
      </div>
    </section>
  )
}
