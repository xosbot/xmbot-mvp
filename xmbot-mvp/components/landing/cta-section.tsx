"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Eye, TrendingUp, Zap, CheckCircle2 } from "lucide-react"
import { ScrollReveal } from "./scroll-reveal"
import { MovingBorder } from "@/components/ui/aceternity/moving-border"
import { LampEffect } from "@/components/ui/aceternity/lamp-effect"

export function CTASection() {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <MovingBorder className="p-8 sm:p-12 lg:p-16 text-center">
            <LampEffect>
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-sm border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs mono-label text-gold-400 mb-8">
                  <Zap className="h-3.5 w-3.5" />
                  <span>7-Day Free Trial // No Credit Card Required</span>
                </div>

                <h2 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-medium text-foreground tracking-tight">
                  Your First AI Trade Is
                  <br />
                  <span className="text-gradient-gold">15 Minutes Away</span>
                </h2>

                <p className="mt-6 text-lg text-stone-400 max-w-xl mx-auto leading-relaxed">
                  Connect Telegram, set your risk limits, and let the AI find your next trade.
                  You approve. You profit. No strings attached.
                </p>

                <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-stone-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Free 7-day trial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>No credit card needed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Cancel anytime</span>
                  </div>
                </div>

                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/register">
                    <Button size="lg" className="bg-gold-500 hover:bg-gold-400 text-neutral-950 font-semibold px-10 h-14 text-base transition-colors duration-200 group">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="https://t.me/xmbot" target="_blank" rel="noopener noreferrer">
                    <Button size="lg" variant="outline" className="border-foreground/15 text-stone-300 hover:bg-foreground/5 h-14 text-base">
                      Join Telegram
                    </Button>
                  </Link>
                </div>

                <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs text-stone-500">
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-gold-500" />
                    <span>2% max risk per trade</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-gold-500" />
                    <span>You approve every trade</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    <span>64% backtested win rate</span>
                  </div>
                </div>
              </div>
            </LampEffect>
          </MovingBorder>
        </ScrollReveal>
      </div>
    </section>
  )
}
