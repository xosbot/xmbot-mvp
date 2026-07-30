import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function CTASection() {
  return (
    <section className="py-20 sm:py-28 border-t border-slate-800/50 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-r from-emerald-500/10 via-violet-500/10 to-emerald-500/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-8 sm:p-12 lg:p-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Limited Beta — First 10 Customers</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to Trade with AI?
          </h2>
          <p className="mt-4 text-lg text-slate-400 max-w-xl mx-auto">
            Stop watching charts. Stop second-guessing entries. Let the multi-agent system
            handle the analysis while you make the calls.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 h-12 text-base shadow-lg shadow-emerald-600/25">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="https://t.me/xmbot" target="_blank">
              <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 h-12 text-base">
                Join Telegram
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-xs text-slate-600">
            No hidden fees. Cancel anytime. Trading involves risk.
          </p>
        </div>
      </div>
    </section>
  )
}
