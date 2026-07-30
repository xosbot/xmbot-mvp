import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Brain } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Stripe-style gradient mesh */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-[150px]" />
        <div className="absolute right-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute left-1/3 bottom-0 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-[100px]" />
      </div>

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-32 w-full">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400">
            <Brain className="h-3.5 w-3.5" />
            <span>AI-Powered Trading Agent Platform</span>
          </div>

          {/* Primary headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05]">
            AI Agents That{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-300">
              Trade Gold
            </span>
            <br />
            <span className="text-slate-300">While You Stay in Control</span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed">
            Multi-agent trading platform with human-in-the-loop approval.
            Technical analysis agents generate signals, AI validates them,
            <span className="text-slate-300"> you decide what to execute</span>.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 h-12 text-base shadow-lg shadow-emerald-600/25">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 h-12 text-base">
                See How It Works
              </Button>
            </Link>
          </div>

          {/* Trust metrics */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">64%</div>
              <div className="text-xs text-slate-500 mt-1">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">+84.3%</div>
              <div className="text-xs text-slate-500 mt-1">6-Month Return</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">3</div>
              <div className="text-xs text-slate-500 mt-1">AI Agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">24/5</div>
              <div className="text-xs text-slate-500 mt-1">Auto-Trading</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
