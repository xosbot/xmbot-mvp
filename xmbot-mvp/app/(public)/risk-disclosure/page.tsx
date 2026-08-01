import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Risk Disclosure | XMBot",
  description: "XMBot Trading Risk Disclosure",
}

export default function RiskDisclosurePage() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Trading Risk Disclosure</h1>
        <p className="text-slate-400 text-sm mb-8">Last updated: July 31, 2026</p>

        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">General Risk Warning</h2>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 mb-4">
              <p className="text-amber-300 font-medium">
                Trading cryptocurrencies and commodities involves substantial risk of loss and is not suitable
                for every investor. Past performance does not guarantee future results.
              </p>
            </div>
            <p>
              The high degree of leverage available in trading can work against you as well as for you.
              Before deciding to trade, you should carefully consider your investment objectives,
              level of experience, and risk appetite.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Automated Trading Risks</h2>
            <p>
              Automated trading systems involve additional risks, including:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>System failures or software bugs</li>
              <li>Network connectivity issues</li>
              <li>Unforeseen market conditions</li>
              <li>Liquidity gaps and slippage</li>
              <li>Incorrect signal interpretation</li>
              <li>Over-reliance on historical data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">No Financial Advice</h2>
            <p>
              The information and tools provided by XMBot are for educational and informational
              purposes only. They do not constitute financial advice, investment advice,
              trading advice, or any other form of professional advice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">You Could Lose Your Entire Investment</h2>
            <p>
              You should never trade with money you cannot afford to lose. There is a possibility
              that you could sustain a loss of some or all of your initial investment.
              You should be aware of all the risks associated with trading and seek advice from
              an independent financial advisor if you have any doubts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Market Risks</h2>
            <p>
              Financial markets are volatile and unpredictable. The value of assets can fluctuate
              significantly in short periods. Factors including but not limited to economic events,
              geopolitical developments, regulatory changes, and market sentiment can cause
              rapid price movements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Technical Risks</h2>
            <p>
              XMBot relies on third-party exchanges and APIs. We are not responsible for
              outages, delays, or errors in exchange systems. API rate limits, connectivity
              issues, or exchange maintenance may affect trade execution.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Regulatory Risks</h2>
            <p>
              Cryptocurrency and derivatives trading regulations vary by jurisdiction.
              It is your responsibility to ensure your use of the Service complies with
              all applicable laws and regulations in your jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Assumption of Risk</h2>
            <p>
              By using XMBot, you acknowledge that you understand and accept all risks
              associated with automated trading. You agree that XMBot and its operators
              shall not be held responsible for any losses incurred through use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Contact</h2>
            <p>
              For questions about risk disclosure, contact us at{" "}
              <a href="mailto:support@xmbot.online" className="text-gold-400 hover:underline">
                support@xmbot.online
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800">
          <Link href="/" className="text-gold-400 hover:underline text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
