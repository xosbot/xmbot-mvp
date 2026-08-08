"use client"

import { ScrollReveal } from "./scroll-reveal"
import { ExpandableCard } from "@/components/ui/aceternity/expandable-card"

const faqs = [
  { question: "Is my money safe?", answer: "XMOne never has direct access to your funds. We connect via API keys with trading permissions only (no withdrawal). You can revoke access anytime. The 2% risk rule ensures no single trade can cause significant damage." },
  { question: "What if I'm not satisfied?", answer: "You can cancel your subscription anytime — you'll keep access through the end of the billing period you've already paid for. We recommend starting with a shorter plan to try XMOne before committing to a longer one." },
  { question: "What is XMOne?", answer: "XMOne is an AI-powered gold (XAUUSD) trading platform, built to expand into stocks, crypto, and mutual funds over time. It uses a multi-agent system to analyze markets 24/5 and sends trading signals to your Telegram. You approve or reject each trade — no auto-execution without your say." },
  { question: "How does the human-in-the-loop work?", answer: "When the AI identifies a trading opportunity, it sends a signal card to your Telegram with entry price, stop loss, take profit, and confidence score. You tap Approve or Reject. Only after your approval does the system execute the trade." },
  { question: "Do I need to keep my computer running?", answer: "No. The engine runs on our servers 24/5 during market hours. You just need Telegram on your phone to receive signals and approve trades. No computer required." },
  { question: "What's the minimum capital needed?", answer: "We recommend starting with at least $500 for paper trading. For live trading, $1,000+ is ideal to properly implement the 2% risk management rule. The bot trades 0.05 lot sizes by default." },
  { question: "What markets do you support?", answer: "Currently: Gold (XAUUSD), Binance crypto, paper trading. We're adding NSE/BSE stocks, mutual funds, and more brokers (Zerodha, Interactive Brokers) in upcoming releases." },
  { question: "What about mutual funds?", answer: "Not yet available. AI-powered mutual fund recommendations for Indian investors are on our roadmap, but nothing is live today — the current product is gold trading only." },
  { question: "How is this different from other trading bots?", answer: "Most bots trade automatically without your input. XMOne requires human approval for every trade. We also use a multi-agent architecture (not just simple indicators) and AI validation, rather than a single indicator-based signal." },
]

export function FAQSection() {
  return (
    <section id="faq" className="py-24 sm:py-32 relative" aria-labelledby="faq-heading">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-sm border border-gold-500/30 bg-gold-500/5 px-3 py-1.5 text-xs mono-label text-gold-700 mb-6">
              // FAQ
            </div>
            <h2 id="faq-heading" className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium text-foreground tracking-tight">
              Frequently Asked
              <br />
              <span className="text-gradient-gold">Questions</span>
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-sm" role="list">
            {faqs.map((faq) => (
              <ExpandableCard key={faq.question} title={faq.question}>
                {faq.answer}
              </ExpandableCard>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
