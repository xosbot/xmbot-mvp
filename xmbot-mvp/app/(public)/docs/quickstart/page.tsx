import { ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Quick Start Guide",
  description: "Get started with XMBot in 15 minutes — connect Telegram, configure risk, and receive your first trading signal.",
}

export default function QuickstartPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link href="/docs" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Docs
        </Link>

        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-aggressive mb-4">
          Quick Start Guide
        </h1>
        <p className="text-lg text-slate-400 mb-12">
          Get up and running with XMBot in 15 minutes.
        </p>

        <div className="space-y-12">
          {[
            {
              step: "1",
              title: "Create Your Account",
              content: "Sign up at xmbot.online/register. Enter your name, email, and password. You'll be redirected to the dashboard after registration.",
            },
            {
              step: "2",
              title: "Subscribe to a Plan",
              content: "Navigate to checkout and select your preferred plan. The Beta Access plan (₹9,999 for 3 months) is recommended for new users. Payment is processed securely via Cashfree.",
            },
            {
              step: "3",
              title: "Connect Your Telegram",
              content: "Go to Settings → Telegram and link your Telegram account. This is how you'll receive trading signals and approve/reject trades.",
            },
            {
              step: "4",
              title: "Configure Risk Settings",
              content: "Set your risk preferences in Settings → AI: max risk per trade (default 2%), daily loss limits, and position sizing. These are enforced at the engine level.",
            },
            {
              step: "5",
              title: "Connect Binance (Optional)",
              content: "For live trading, go to Settings → Binance and enter your API keys. Enable trading permissions only (no withdrawal). You can start with Paper Trading first.",
            },
            {
              step: "6",
              title: "Start the Engine",
              content: "Go to Dashboard and click Start Engine. The multi-agent system will begin scanning XAUUSD and sending signals to your Telegram.",
            },
            {
              step: "7",
              title: "Review & Approve Signals",
              content: "When a signal arrives on Telegram, review the analysis (entry, stop loss, take profit, confidence). Tap Approve to execute or Reject to skip.",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-emerald-400 font-mono">{item.step}</span>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white mb-2">{item.title}</h2>
                <p className="text-sm text-slate-400 leading-relaxed">{item.content}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">You&apos;re all set!</h3>
              <p className="text-sm text-slate-400">
                The engine will start scanning the market immediately. You&apos;ll receive your first
                signal within the next market session. Join our{" "}
                <a href="https://t.me/xmbot" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">
                  Telegram group
                </a>{" "}
                for support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
