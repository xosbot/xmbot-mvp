import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service | XMBot",
  description: "XMBot Terms of Service",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Terms of Service</h1>
        <p className="text-slate-400 text-sm mb-8">Last updated: July 31, 2026</p>

        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using XMBot (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
              If you do not agree to all of these terms, you may not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p>
              XMBot provides an automated trading bot platform for cryptocurrency and commodity markets.
              The Service executes trades based on pre-programmed strategies and algorithms.
              You connect your own exchange API keys to enable the Service to trade on your behalf.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Account Registration</h2>
            <p>
              You must provide accurate, complete, and current information during registration.
              You are responsible for safeguarding your account credentials.
              You must be at least 18 years old to use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. API Keys and Security</h2>
            <p>
              You are solely responsible for the security of your exchange API keys.
              XMBot encrypts all API keys using AES-256-GCM encryption.
              We never store API keys in plaintext. You may revoke API access at any time through your exchange account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Subscriptions and Payments</h2>
            <p>
              Paid subscriptions grant access to the Service for the specified duration.
              All payments are processed through our payment partner (CashFree).
              Subscriptions are non-refundable except as required by applicable law.
              You may cancel your subscription at any time; access continues until the end of the billing period.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. User Responsibilities</h2>
            <p>
              You are solely responsible for all trading activity conducted through your account.
              You acknowledge that trading involves substantial risk of financial loss.
              You should never trade with money you cannot afford to lose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Limitation of Liability</h2>
            <p>
              XMBot and its operators shall not be liable for any direct, indirect, incidental, special,
              or consequential damages resulting from the use or inability to use the Service.
              Past performance does not guarantee future results.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to the Service at any time,
              with or without cause, and with or without notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the Service
              after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Contact</h2>
            <p>
              For questions about these Terms, contact us at{" "}
              <a href="mailto:support@xmbot.online" className="text-emerald-400 hover:underline">
                support@xmbot.online
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800">
          <Link href="/" className="text-emerald-400 hover:underline text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
