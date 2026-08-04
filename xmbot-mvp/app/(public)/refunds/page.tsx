import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "XMBot refund policy — subscriptions are non-refundable except as required by applicable law.",
}

export default function RefundsPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-aggressive mb-8">
          Refund Policy
        </h1>
        <p className="text-sm text-slate-500 mb-12">Last updated: August 2026</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-white tracking-tight">Subscriptions Are Non-Refundable</h2>
            <p className="text-slate-400 leading-relaxed">
              Paid XMBot subscriptions are non-refundable, except where required by applicable law.
              This applies to all plans, including annual subscriptions — we don&apos;t issue partial
              refunds for unused time on a billing period.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white tracking-tight">Cancelling Your Subscription</h2>
            <p className="text-slate-400 leading-relaxed">
              You can cancel auto-renewal at any time from{" "}
              <a href="/dashboard/subscription" className="text-gold-400 hover:text-gold-300">
                Dashboard → Subscription
              </a>. Cancelling stops future charges, but you keep access through the end of
              the billing period you&apos;ve already paid for.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white tracking-tight">Billing Errors</h2>
            <p className="text-slate-400 leading-relaxed">
              If you were charged in error — a duplicate charge, or a charge after you cancelled —
              contact us and we&apos;ll investigate and correct it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white tracking-tight">Contact</h2>
            <p className="text-slate-400 leading-relaxed">
              Questions about billing or this policy: reach us at{" "}
              <a href="mailto:support@xmbot.online" className="text-gold-400 hover:text-gold-300">
                support@xmbot.online
              </a>{" "}
              or via Telegram at{" "}
              <a href="https://t.me/xmbot" target="_blank" rel="noopener noreferrer" className="text-gold-400 hover:text-gold-300">
                @xmbot
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
