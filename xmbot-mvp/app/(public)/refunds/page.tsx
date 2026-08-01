import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "XMBot refund policy — 7-day money-back guarantee for all subscriptions.",
}

export default function RefundsPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-aggressive mb-8">
          Refund Policy
        </h1>
        <p className="text-sm text-slate-500 mb-12">Last updated: January 2026</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-white tracking-tight">7-Day Money-Back Guarantee</h2>
            <p className="text-slate-400 leading-relaxed">
              We offer a full refund within 7 days of your initial purchase if you&apos;re not
              satisfied with XMBot. No questions asked. We want you to be confident in your decision.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white tracking-tight">How to Request a Refund</h2>
            <p className="text-slate-400 leading-relaxed">
              To request a refund, contact us at{" "}
              <a href="mailto:support@xmbot.online" className="text-gold-400 hover:text-gold-300">
                support@xmbot.online
              </a>{" "}
              or via Telegram at{" "}
              <a href="https://t.me/xmbot" target="_blank" rel="noopener noreferrer" className="text-gold-400 hover:text-gold-300">
                @xmbot
              </a>{" "}
              within 7 days of your purchase. Include your registered email address and we&apos;ll
              process your refund within 5-7 business days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white tracking-tight">Eligibility</h2>
            <ul className="list-disc list-inside text-slate-400 space-y-2">
              <li>Refund requests must be made within 7 days of the original purchase date</li>
              <li>Only one refund per user account</li>
              <li>Refunds apply to the full subscription amount paid</li>
              <li>Processing fees (if any) are non-refundable</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white tracking-tight">Annual Subscriptions</h2>
            <p className="text-slate-400 leading-relaxed">
              For yearly subscriptions, you may request a full refund within 7 days of purchase.
              After 7 days, no refunds will be issued for the remaining subscription period.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white tracking-tight">Contact</h2>
            <p className="text-slate-400 leading-relaxed">
              If you have any questions about our refund policy, please contact us at{" "}
              <a href="mailto:support@xmbot.online" className="text-gold-400 hover:text-gold-300">
                support@xmbot.online
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
