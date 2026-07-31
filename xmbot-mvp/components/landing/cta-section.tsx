"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Zap, Shield, Eye, TrendingUp } from "lucide-react"

export function CTASection() {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      {/* Background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[1000px] rounded-full bg-gradient-to-r from-emerald-500/10 via-violet-500/10 to-emerald-500/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 sm:p-12 lg:p-16 text-center overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-emerald-500/10 blur-[100px] rounded-full" />

          <div className="relative">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400 mb-8">
              <Zap className="h-3.5 w-3.5" />
              <span>Limited Beta — First 10 Customers</span>
            </div>

            {/* Headline */}
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight">
              Ready to Trade
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">with AI?</span>
            </h2>

            {/* Copy */}
            <p className="mt-6 text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
              Trade with confidence. Make every decision with AI-grade analysis.
              The multi-agent system handles the heavy lifting while you stay in control.
            </p>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-500" />
                <span>2% max risk</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-emerald-500" />
                <span>You approve every trade</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span>64% win rate</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 h-14 text-base shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/30 transition-all duration-300 group">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="https://t.me/xmbot" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800/50 h-14 text-base">
                  Join Telegram
                </Button>
              </Link>
            </div>

            {/* Fine print */}
            <p className="mt-8 text-xs text-slate-600">
              No hidden fees. Cancel anytime. Trading involves risk.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
