import { ArrowLeft, MessageCircle } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "API Reference",
  description: "XMBot's API status — there's no public API yet.",
}

export default function ApiDocsPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link href="/docs" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Docs
        </Link>

        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-aggressive mb-8">
          API Reference
        </h1>

        <div className="prose prose-invert prose-slate max-w-none space-y-6">
          <p className="text-slate-400 leading-relaxed">
            There&apos;s no public, third-party API yet. XMBot today is Telegram-first — signals,
            approvals, and controls all happen through your Telegram chat, with the web
            dashboard for account, position, and trade history.
          </p>
          <p className="text-slate-400 leading-relaxed">
            The dashboard itself is built on internal endpoints (engine status, positions, trade
            history) authenticated by your logged-in session — not a public API key, and not
            intended for third-party integration today.
          </p>
          <div className="p-4 rounded-lg border border-gold-500/20 bg-gold-500/5 flex items-start gap-3">
            <MessageCircle className="h-5 w-5 text-gold-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-300">
              Want programmatic access? Reach out on{" "}
              <Link href="https://t.me/xmbot" target="_blank" rel="noopener noreferrer" className="text-gold-400 hover:underline">
                Telegram
              </Link>{" "}
              and tell us what you&apos;re building — it helps us prioritize a real public API.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
