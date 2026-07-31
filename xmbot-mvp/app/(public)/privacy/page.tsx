import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy | XMBot",
  description: "XMBot Privacy Policy",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>
        <p className="text-slate-400 text-sm mb-8">Last updated: July 31, 2026</p>

        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Information We Collect</h2>
            <p>We collect the following information:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Account information (name, email, phone number)</li>
              <li>Payment information (processed by CashFree, not stored by us)</li>
              <li>Exchange API keys (encrypted with AES-256-GCM)</li>
              <li>Trading activity and bot performance data</li>
              <li>Technical data (IP address, browser type, device information)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Provide and maintain the Service</li>
              <li>Process payments</li>
              <li>Execute trades on your behalf</li>
              <li>Send important service notifications</li>
              <li>Improve the Service</li>
              <li>Detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data.
              API keys are encrypted using AES-256-GCM and are never stored in plaintext.
              We use HTTPS for all data transmission. However, no method of electronic
              storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Data Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties.
              We may share information with:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Payment processors (CashFree) for transaction processing</li>
              <li>Cloud infrastructure providers for hosting</li>
              <li>Law enforcement if required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active.
              When you delete your account, we remove your personal data within 30 days,
              except where required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
              <li>Revoke API key access at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Cookies</h2>
            <p>
              We use essential cookies to maintain your session. We do not use
              third-party tracking cookies or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Changes to Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify
              you of any material changes via email or through the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Contact</h2>
            <p>
              For questions about this Privacy Policy, contact us at{" "}
              <a href="mailto:privacy@xmbot.online" className="text-emerald-400 hover:underline">
                privacy@xmbot.online
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
